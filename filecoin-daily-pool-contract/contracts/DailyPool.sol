// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract DailyPool is ReentrancyGuard, Ownable {
  using ECDSA for bytes32;

  uint256 public startTimestamp;
  uint256 public depositAmount;
  uint256 public lockedPoolAmount; // prev round's pool amount to be claimed
  uint24 public currentRoundId;
  uint24 public minAttendance = 2;
  IERC20 public usdtContract;
  address public daoMsigAddress = 0x7B941952696Dc372628E06Ee129cc14195788475;
  address public donationMsigAddress = 0x7B941952696Dc372628E06Ee129cc14195788475;

  struct RoundInfo {
    string question;
    string encryptedAnswer;
    uint24 attendance; // the number of participants
    string answer; // revealed after round is finished. Entered at the end of the round.
    uint256 prize; // total prize of round
    bool platformFeeTransferred;
  }

  struct UserInfo {
    bool isAnswered;
    string encryptedAnswer;
    uint256 prize;
  }

  enum RANK {
    TopOne,
    TopFive,
    OTHERS
  }
  // Mapping for roundId -> question and answer
  mapping(uint24 => RoundInfo) public roundInfos;
  // Mapping for user funds, roundId -> userAddress -> UserInfo
  mapping(uint24 => mapping(address => UserInfo)) public roundUserInfos;

  error NotAnswerTime();

  event NewRoundOpened(uint24 indexed roundId, RoundInfo roundInfo, uint256 indexed startTimestamp);
  event AnswerSubmitted(uint24 indexed roundId, address indexed respondent, string answer);
  event PlatformFeeTransferred(uint256 indexed amount);
  event PrizeClaimed(uint24 indexed roundId, address indexed winner, uint256 indexed prize);

  constructor(
    string memory _firstQuestion,
    string memory _encryptedAnswer,
    address _usdtContractAddress,
    uint8 _tokenDecimal
  ) {
    usdtContract = IERC20(_usdtContractAddress);
    depositAmount = 10 ** _tokenDecimal;
    startTimestamp = block.timestamp;
    roundInfos[currentRoundId].question = _firstQuestion;
    roundInfos[currentRoundId].encryptedAnswer = _encryptedAnswer;

    emit NewRoundOpened(currentRoundId, roundInfos[currentRoundId], block.timestamp);
  }

  ///@notice Function to finish prev round and start next one, executed by admin(backend)
  ///@param _nextQuestion new question
  ///@param _encryptedNextAnswer new encrypted answer
  ///@param _answer current round's correct answer
  ///@dev close prev round and open new one, operated by admin
  function executeRound(
    string calldata _nextQuestion,
    string calldata _encryptedNextAnswer,
    string calldata _answer
  ) external onlyOwner {
    require(block.timestamp >= startTimestamp + 1 days, "Not finished previous round");
    startTimestamp = block.timestamp;
    if (roundInfos[currentRoundId].attendance > minAttendance) {
      lockedPoolAmount += roundInfos[currentRoundId].prize; // add unclaimed prize to next pool
      roundInfos[currentRoundId].answer = _answer;
      _transferDaoPrize(currentRoundId); // transfer dao prize
      // start next round
      currentRoundId++;
      roundInfos[currentRoundId].encryptedAnswer = _encryptedNextAnswer;
      roundInfos[currentRoundId].question = _nextQuestion;
    }

    emit NewRoundOpened(currentRoundId, roundInfos[currentRoundId], block.timestamp);
  }

  ///@notice Function to submit answer from user side
  ///@param _encryptedAnswer answer that is submitted by user
  ///@dev encrypted from dapp using public key
  function submitAnswer(string calldata _encryptedAnswer) external nonReentrant {
    if (
      block.timestamp > startTimestamp + 1 days ||
      block.timestamp < startTimestamp + 1 days - 2 minutes
    ) {
      revert NotAnswerTime();
    }
    require(
      !roundUserInfos[currentRoundId][msg.sender].isAnswered,
      "Already answered for this round"
    );
    usdtContract.transferFrom(msg.sender, address(this), depositAmount);
    // save users' encrypted answers and increase attendance

    roundInfos[currentRoundId].prize += depositAmount;
    roundInfos[currentRoundId].attendance++;

    roundUserInfos[currentRoundId][msg.sender].encryptedAnswer = _encryptedAnswer;
    roundUserInfos[currentRoundId][msg.sender].isAnswered = true;

    emit AnswerSubmitted(currentRoundId, msg.sender, _encryptedAnswer);
  }

  ///@notice Function to claim prize
  ///@param signature signed message with prize and winner address by platform owner
  ///@param _rank winner's rank
  ///@param _players the number of players who submitted correct answer(excluding top winners)
  ///@dev close prev round and open new one, operated by admin
  function claimPrize(bytes calldata signature, RANK _rank, uint24 _players) external nonReentrant {
    require(_verifyPlatformOwner(signature, _rank), "Wrong prize or signature");
    require(
      roundUserInfos[currentRoundId - 1][msg.sender].isAnswered,
      "Not answered for this round"
    );
    require(roundUserInfos[currentRoundId - 1][msg.sender].prize == 0, "Already Claimed");

    uint256 _prize = _calcPrizeFromRank(_rank, _players);
    _transferPrize(msg.sender, _prize);
    roundUserInfos[currentRoundId - 1][msg.sender].prize = _prize;
    lockedPoolAmount -= _prize;
    emit PrizeClaimed(currentRoundId - 1, msg.sender, _prize);
  }

  ///@notice Function to set minimum number of participants
  function setMinAttendance(uint24 _newMinAttendance) external onlyOwner {
    require(_newMinAttendance > 0, "Minimum attendance should be more than 0");
    minAttendance = _newMinAttendance;
  }

  ///@notice Function to send platform fee for dao and donation
  function _transferDaoPrize(uint24 _roundId) private nonReentrant {
    require(_roundId == currentRoundId, "Not finished round");
    require(!roundInfos[_roundId].platformFeeTransferred, "Already claimed");
    _transferPrize(daoMsigAddress, (lockedPoolAmount * 3) / 100);
    _transferPrize(donationMsigAddress, (lockedPoolAmount * 2) / 100);
    roundInfos[_roundId].platformFeeTransferred = true;
    lockedPoolAmount = (lockedPoolAmount * 95) / 100;
    emit PlatformFeeTransferred((lockedPoolAmount * 5) / 100);
  }

  function _transferPrize(address _to, uint256 _prize) private {
    bool sent = usdtContract.transfer(_to, _prize);
    require(sent, "Failed to transfer prize");
  }

  /**
   * @notice Function to verify owner to get winner's prize
   * @dev
   * - Should encode winner's prize and winner address
   * - Get message from ECDSA library
   * - Recover address
   * - Return boolean if same as owner() true, not false
   */
  function _verifyPlatformOwner(bytes calldata signature, RANK _rank) private view returns (bool) {
    bytes32 hash = keccak256(abi.encodePacked(_rank, msg.sender));
    bytes32 message = ECDSA.toEthSignedMessageHash(hash);
    address recoveredAddress = ECDSA.recover(message, signature);
    return (recoveredAddress == owner());
  }

  function _calcPrizeFromRank(RANK _rank, uint24 _players) private view returns (uint256) {
    uint256 totalPrize = (roundInfos[currentRoundId - 1].prize * 95) / 100;
    if (_rank == RANK.TopOne) {
      return (totalPrize * 25) / 100;
    } else if (_rank == RANK.TopFive) {
      return (totalPrize * 5) / 100;
    } else {
      return (totalPrize * 50) / 100 / _players;
    }
  }
}

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
  uint256 public currentPoolAmount; // current round's pool amount
  uint24 public currentRoundId;
  uint24 public minAttendance = 100;
  IERC20 public usdtContract;
  address public daoMsigAddress = 0x307cc392Ef5b722A6ED0e0b9F1cb93Ba6a0e956E;
  address public donationMsigAddress = 0x307cc392Ef5b722A6ED0e0b9F1cb93Ba6a0e956E;

  enum ClaimStatus {
    NotClaimed,
    TopWinnersClaimed,
    AllClaimed
  }

  struct RoundInfo {
    string question;
    string encryptedAnswer;
    uint24 attendance; // the number of participants
    string publicKey; // used to encrypt answers. Entered at the start of the round.
    string privateKey; // used to decrypt answers. Entered at the end of the round.
    uint256 prize; // total prize of round
    ClaimStatus claimstatus;
    bool platformFeeTransferred;
  }

  struct UserInfo {
    bool isDeposited;
    bool isAnswered;
    string encryptedAnswer;
    uint256 prize;
  }

  struct TopWinnerStructure {
    address firstOne;
    address[] secondFive;
  }
  // Mapping for roundId -> question and answer
  mapping(uint24 => RoundInfo) public roundInfos;
  // Mapping for user funds, roundId -> userAddress -> UserInfo
  mapping(uint24 => mapping(address => UserInfo)) public roundUserInfos;

  error NotAnswerTime();

  event NewRoundOpened(
    uint24 indexed roundId,
    RoundInfo indexed roundInfo,
    uint256 indexed startTimestamp
  );
  event AnswerSubmitted(uint24 indexed roundId, address indexed respondent, string indexed answer);
  event TopWinnerPrizeTransferred(uint256 indexed topOnePrize, uint256 indexed topTenPrize);
  event RestWinnerPrizeTransferred(uint256 indexed topOnePrize, uint256 indexed prize);
  event PlatformFeeTransferred(uint256 indexed amount);
  event PrizeClaimed(uint24 indexed roundId, address indexed winner, uint256 indexed prize);

  constructor(
    string memory _firstQuestion,
    string memory _publicKey,
    address _usdtContractAddress,
    uint8 _tokenDecimal
  ) {
    usdtContract = IERC20(_usdtContractAddress);
    depositAmount = 10 ** _tokenDecimal;
    startTimestamp = block.timestamp;
    roundInfos[currentRoundId].question = _firstQuestion;
    roundInfos[currentRoundId].publicKey = _publicKey;

    emit NewRoundOpened(currentRoundId, roundInfos[currentRoundId], block.timestamp);
  }

  ///@notice Function to deposit usdt for users
  function deposit() external {
    require(
      !roundUserInfos[currentRoundId][msg.sender].isDeposited,
      "Already deposited for this round"
    );
    usdtContract.transferFrom(msg.sender, address(this), depositAmount);
    roundUserInfos[currentRoundId][msg.sender].isDeposited = true;
    roundInfos[currentRoundId].prize += depositAmount;
    currentPoolAmount += depositAmount;
  }

  ///@notice Function to finish prev round and start next one, executed by admin(backend)
  ///@param _nextQuestion new question
  ///@param _encryptedNextAnswer new encrypted answer
  ///@param _privateKey current round's private key to decrypt the answer
  ///@dev close prev round and open new one, operated by admin
  function executeRound(
    string calldata _nextQuestion,
    string calldata _nextPublicKey,
    string calldata _encryptedNextAnswer,
    string calldata _privateKey
  ) external onlyOwner {
    require(block.timestamp >= startTimestamp + 1 days, "Not finished previous round");
    startTimestamp = block.timestamp;
    if (roundInfos[currentRoundId].attendance < minAttendance) {
      // make the question again for same round
      roundInfos[currentRoundId].question = _nextQuestion;
      roundInfos[currentRoundId].encryptedAnswer = _encryptedNextAnswer;
    } else {
      roundInfos[currentRoundId].privateKey = _privateKey; // set prev round's private key
      _transferDaoPrize(currentRoundId); // transfer dao prize
      // start next round
      currentRoundId++;
      roundInfos[currentRoundId].encryptedAnswer = _encryptedNextAnswer;
      roundInfos[currentRoundId].question = _nextQuestion;
      roundInfos[currentRoundId].publicKey = _nextPublicKey;
      roundInfos[currentRoundId].prize = currentPoolAmount; // add unclained prize to next pool
    }

    emit NewRoundOpened(currentRoundId, roundInfos[currentRoundId], block.timestamp);
  }

  ///@notice Function to submit answer from user side
  ///@param _encryptedAnswer answer that is submitted by user
  ///@dev encrypted from dapp using public key
  function submitAnswer(string calldata _encryptedAnswer) external {
    if (
      block.timestamp > startTimestamp + 1 days ||
      block.timestamp < startTimestamp + 1 days - 1 minutes
    ) {
      revert NotAnswerTime();
    }
    require(roundUserInfos[currentRoundId][msg.sender].isDeposited, "Deposit fund first");
    require(
      !roundUserInfos[currentRoundId][msg.sender].isAnswered,
      "Already answered for this round"
    );
    // save users' encrypted answers and increase attendance
    roundUserInfos[currentRoundId][msg.sender].encryptedAnswer = _encryptedAnswer;
    roundUserInfos[currentRoundId][msg.sender].isAnswered = true;
    roundInfos[currentRoundId].attendance++;

    emit AnswerSubmitted(currentRoundId, msg.sender, _encryptedAnswer);
  }

  ///@notice Function to claim prize
  ///@param signature signed message with prize and winner address by platform owner
  ///@param _prize winner's prize
  ///@dev close prev round and open new one, operated by admin
  function claimPrize(bytes calldata signature, uint256 _prize) external nonReentrant {
    require(_verifyPlatformOwner(signature, _prize), "Wrong prize");
    require(
      roundUserInfos[currentRoundId - 1][msg.sender].prize == 0,
      "Already Claimed or no prize to claim"
    );
    _transferPrize(msg.sender, _prize);
    roundUserInfos[currentRoundId - 1][msg.sender].prize = _prize;
    currentPoolAmount -= _prize;
    emit PrizeClaimed(currentRoundId - 1, msg.sender, _prize);
  }

  ///@notice Function to send platform fee for dao and donation
  function _transferDaoPrize(uint24 _roundId) private nonReentrant {
    require(_roundId < currentRoundId, "Not finished round");
    require(!roundInfos[_roundId].platformFeeTransferred, "Already claimed");
    _transferPrize(daoMsigAddress, (roundInfos[_roundId].prize * 3) / 100);
    _transferPrize(donationMsigAddress, (roundInfos[_roundId].prize * 2) / 100);
    roundInfos[_roundId].platformFeeTransferred = true;
    emit PlatformFeeTransferred((roundInfos[_roundId].prize * 5) / 100);
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
  function _verifyPlatformOwner(
    bytes calldata signature,
    uint256 _prize
  ) private view returns (bool) {
    bytes32 hash = keccak256(abi.encodePacked(_prize, msg.sender));
    bytes32 message = ECDSA.toEthSignedMessageHash(hash);
    address recoveredAddress = ECDSA.recover(message, signature);
    return (recoveredAddress == owner());
  }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DailyPool is Ownable {
  uint256 public startTimestamp;
  uint256 public depositAmount;
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
    uint24 attendance;
    string publicKey; // used to encrypt answers. Entered at the start of the round.
    string privateKey; // used to decrypt answers. Entered at the end of the round.
    uint256 prize;
    ClaimStatus claimstatus;
    bool platformFeeTransferred;
  }

  struct UserInfo {
    bool isDeposited;
    bool isAnswered;
    string encryptedAnswer;
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

  constructor(
    string memory _firstQuestion,
    string memory _publicKey,
    address _usdtContractAddress,
    uint8 _tokenDecimal
  ) {
    usdtContract = IERC20(_usdtContractAddress);
    depositAmount = 1 * _tokenDecimal;
    startTimestamp = block.timestamp;
    roundInfos[currentRoundId].question = _firstQuestion;
    roundInfos[currentRoundId].publicKey = _publicKey;

    emit NewRoundOpened(currentRoundId, roundInfos[currentRoundId], block.timestamp);
  }

  function deposit() external {
    require(
      !roundUserInfos[currentRoundId][msg.sender].isDeposited,
      "Already deposited for this round"
    );
    usdtContract.transferFrom(msg.sender, address(this), depositAmount);
    roundUserInfos[currentRoundId][msg.sender].isDeposited = true;
    roundInfos[currentRoundId].prize += depositAmount;
  }

  ///@param _nextQuestion new question
  ///@param _encryptedNextAnswer new encrypted answer
  ///@param _privateKey current round's private key to decrypt the answer
  ///@dev close prev round and open new one, operated by admin
  function executeRound(
    string calldata _nextQuestion,
    string calldata _nextPublicKey,
    string calldata _encryptedNextAnswer,
    string calldata _privateKey
  ) public onlyOwner {
    require(block.timestamp >= startTimestamp + 1 days, "Not finished previous round");
    startTimestamp = block.timestamp;
    if (roundInfos[currentRoundId].attendance < minAttendance) {
      // make the question again for same round
      roundInfos[currentRoundId].question = _nextQuestion;
      roundInfos[currentRoundId].encryptedAnswer = _encryptedNextAnswer;
    } else {
      roundInfos[currentRoundId].privateKey = _privateKey; // set prev round's private key
      // start next round
      currentRoundId++;
      roundInfos[currentRoundId].encryptedAnswer = _encryptedNextAnswer;
      roundInfos[currentRoundId].question = _nextQuestion;
      roundInfos[currentRoundId].publicKey = _nextPublicKey;
    }

    emit NewRoundOpened(currentRoundId, roundInfos[currentRoundId], block.timestamp);
  }

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

  // send platform fee for dao and donation
  function transferDaoPrize(uint24 _roundId) public onlyOwner {
    require(_roundId < currentRoundId, "Not finished round");
    require(!roundInfos[_roundId].platformFeeTransferred, "Already claimed");
    _transferSinglePrize(daoMsigAddress, (roundInfos[_roundId].prize * 3) / 100);
    _transferSinglePrize(donationMsigAddress, (roundInfos[_roundId].prize * 2) / 100);

    emit PlatformFeeTransferred((roundInfos[_roundId].prize * 5) / 100);
  }

  // send prize to top winners
  function transferTopWinnerPrize(
    TopWinnerStructure calldata _winners,
    uint24 _roundId
  ) public onlyOwner {
    require(_roundId < currentRoundId, "Not finished round");
    require(_winners.secondFive.length == 5, "Wrong winner length");
    require(roundInfos[_roundId].claimstatus == ClaimStatus.NotClaimed, "Already Claimed");
    uint256 winnerPrize = (roundInfos[_roundId].prize * 95) / 100;
    uint256 topOnePrize = (winnerPrize * 25) / 100;
    _transferSinglePrize(_winners.firstOne, topOnePrize);
    uint256 topFiveprize = (winnerPrize * 25) / 100 / 5; //calculate top 5 winner prize
    _transferMultiPrize(_winners.secondFive, topFiveprize);
    roundInfos[_roundId].claimstatus = ClaimStatus.TopWinnersClaimed;

    emit TopWinnerPrizeTransferred(topOnePrize, topFiveprize);
  }

  // send prize to rest winners
  function transferRestWinnerPrize(address[] calldata _winners, uint24 _roundId) public onlyOwner {
    require(roundInfos[_roundId].claimstatus == ClaimStatus.TopWinnersClaimed, "Already Claimed");
    uint256 winnerPrize = (roundInfos[_roundId].prize * 95) / 100;
    uint256 prize = (winnerPrize * 50) / 100 / _winners.length; //calculate rest winners prize
    _transferMultiPrize(_winners, prize);
    roundInfos[_roundId].claimstatus = ClaimStatus.AllClaimed;

    emit RestWinnerPrizeTransferred(_winners.length, prize);
  }

  function _transferMultiPrize(address[] memory _winners, uint256 _prize) private {
    uint256 winnerLength = _winners.length;
    for (uint i = 0; i < winnerLength; i++) {
      bool sent = usdtContract.transfer(_winners[i], _prize);
      require(sent, "Failed to transfer prize to winners");
    }
  }

  function _transferSinglePrize(address _winner, uint256 _prize) private {
    bool sent = usdtContract.transfer(_winner, _prize);
    require(sent, "Failed to transfer prize");
  }
}

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployments, ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Ship } from "../utils";
import { BigNumber, BytesLike } from "ethers";
import { DailyPool, DailyPool__factory, TestUSDT, TestUSDT__factory } from "../types";
import { PromiseOrValue } from "../types/common";

chai.use(solidity);
const { expect, assert } = chai;

let ship: Ship;
let dailyPool: DailyPool;
let testUSDT: TestUSDT;

let deployer: SignerWithAddress;
let signer: SignerWithAddress;
let alice: SignerWithAddress;
let bob: SignerWithAddress;

const setup = deployments.createFixture(async (hre) => {
  ship = await Ship.init(hre);
  const { accounts, users } = ship;
  await deployments.fixture(["all"]);

  return {
    ship,
    accounts,
    users,
  };
});

describe("Daily pool unit tests", () => {
  let depositAmount: BigNumber;
  const roundDurationInSecond: number = 60 * 60;

  beforeEach(async () => {
    const scaffold = await setup();

    deployer = scaffold.accounts.deployer;
    signer = scaffold.accounts.signer;
    alice = scaffold.accounts.alice;
    bob = scaffold.accounts.bob;

    dailyPool = await ship.connect(DailyPool__factory);
    testUSDT = await ship.connect(TestUSDT__factory);
    depositAmount = await dailyPool.depositAmount();
  });

  describe("Submit answer for the first round executed when deploying the contract", () => {
    beforeEach(async () => {
      await testUSDT.approve(dailyPool.address, depositAmount);
    });
    it("Emits an event after submit answer", async () => {
      await time.increase(roundDurationInSecond - 60);
      expect(await dailyPool.submitAnswer("answer 1")).to.emit(dailyPool, "AnswerSubmitted");
    });
    it("Should be answer time", async () => {
      const error = "NotAnswerTime";
      await expect(dailyPool.submitAnswer("any answer")).to.be.revertedWith(error);
      await time.increase(roundDurationInSecond);
      await expect(dailyPool.submitAnswer("any answer")).to.be.revertedWith(error);
    });
    it("Should be return already answered error", async () => {
      const error = "Already answered for this round";
      await time.increase(roundDurationInSecond - 60);
      expect(await dailyPool.submitAnswer("answer 1")).to.emit(dailyPool, "AnswerSubmitted");
      await expect(dailyPool.submitAnswer("any answer")).to.be.revertedWith(error);
    });
    it("Check round and user status after answer submitted", async () => {
      const submittedAnswer = "answer 1";
      await time.increase(roundDurationInSecond - 60);
      expect(await dailyPool.submitAnswer(submittedAnswer)).to.emit(dailyPool, "AnswerSubmitted");
      const roundInfo = await dailyPool.roundInfos(0);
      expect(roundInfo.prize).to.be.equal(depositAmount);
      expect(roundInfo.attendance).to.be.equal(1);
      const roundUserInfo = await dailyPool.roundUserInfos(0, deployer.address);
      expect(roundUserInfo.encryptedAnswer).to.be.equal(submittedAnswer);
      expect(roundUserInfo.isAnswered).to.be.equal(true);
      expect((await dailyPool.roundInfos(0)).prize).to.be.equal(depositAmount);
    });
  });
  describe("Execute round from backend", () => {
    const submittedAnswer1 = "answer 1";
    const submittedAnswer2 = "answer 2";
    // Alice and bob submitted their answer.
    beforeEach(async () => {
      await testUSDT.transfer(alice.address, depositAmount);
      await testUSDT.transfer(bob.address, depositAmount);
      await testUSDT.connect(alice).approve(dailyPool.address, depositAmount);
      await testUSDT.connect(bob).approve(dailyPool.address, depositAmount);

      // set min attendance as 2
      await dailyPool.setMinAttendance(2);
    });
    it("Emits an event after execute next round", async () => {
      await time.increase(roundDurationInSecond - 60);
      await dailyPool.connect(alice).submitAnswer(submittedAnswer1);
      await dailyPool.connect(bob).submitAnswer(submittedAnswer2);
      await time.increase(60);
      expect(
        await dailyPool.executeRound(
          "Next question",
          "Next publicKey",
          "Next encrypted answer",
          "Prev privateKey",
        ),
      ).to.be.emit(dailyPool, "NewRoundOpened");
    });
    it("Should be reverted with Not finished previous round", async () => {
      const error = "Not finished previous round";
      await time.increase(roundDurationInSecond - 60);
      await dailyPool.connect(alice).submitAnswer(submittedAnswer1);
      await dailyPool.connect(bob).submitAnswer(submittedAnswer2);
      await expect(
        dailyPool.executeRound("Next question", "Next publicKey", "Next encrypted answer", "Prev privateKey"),
      ).to.be.revertedWith(error);
    });
    it("Simulate skip daily prize", async () => {
      await time.increase(roundDurationInSecond - 60);
      await dailyPool.connect(alice).submitAnswer(submittedAnswer1);
      const currentRoundId = await dailyPool.currentRoundId();
      await time.increase(60);
      expect(
        await dailyPool.executeRound(
          "Next question",
          "Next publicKey",
          "Next encrypted answer",
          "Prev privateKey",
        ),
      ).to.be.emit(dailyPool, "NewRoundOpened");
      expect(await dailyPool.currentRoundId()).to.be.equal(currentRoundId);
      expect((await dailyPool.roundInfos(0)).prize).to.be.equal(depositAmount);
    });
    it("Simulate next daily prize", async () => {
      const msigAddress = "0x307cc392Ef5b722A6ED0e0b9F1cb93Ba6a0e956E";
      await time.increase(roundDurationInSecond - 60);
      await dailyPool.connect(alice).submitAnswer(submittedAnswer1);
      await dailyPool.connect(bob).submitAnswer(submittedAnswer2);
      const currentRoundId = await dailyPool.currentRoundId();
      const prevMsigBalance = await testUSDT.balanceOf(msigAddress);
      await time.increase(60);
      expect(
        await dailyPool.executeRound(
          "Next question",
          "Next publicKey",
          "Next encrypted answer",
          "Prev privateKey",
        ),
      )
        .to.be.emit(dailyPool, "PlatformFeeTransferred")
        .emit(dailyPool, "NewRoundOpened");
      expect((await dailyPool.roundInfos(currentRoundId)).prize).to.be.equal(depositAmount.mul(2));
      expect(await dailyPool.currentRoundId()).to.be.equal(currentRoundId + 1);
      expect(await dailyPool.lockedPoolAmount()).to.be.equal(depositAmount.mul(2).mul(95).div(100));
      expect((await dailyPool.roundInfos(currentRoundId + 1)).prize).to.be.equal(0);
      expect((await testUSDT.balanceOf(msigAddress)).sub(prevMsigBalance)).to.be.equal(
        depositAmount.mul(2).mul(5).div(100),
      );
    });
  });
  describe("Claim reward", () => {
    const submittedAnswer1 = "answer 1";
    const submittedAnswer2 = "answer 2";
    let signature: PromiseOrValue<BytesLike>;
    // Alice and bob submitted their answer and execute next round.
    beforeEach(async () => {
      const hash = ethers.utils.solidityKeccak256(["uint256", "address"], [depositAmount, alice.address]);
      signature = deployer.signMessage(ethers.utils.arrayify(hash));
      await testUSDT.transfer(alice.address, depositAmount);
      await testUSDT.transfer(bob.address, depositAmount);
      await testUSDT.connect(alice).approve(dailyPool.address, depositAmount);
      await testUSDT.connect(bob).approve(dailyPool.address, depositAmount);

      // set min attendance as 2
      await dailyPool.setMinAttendance(2);
      await time.increase(roundDurationInSecond - 60);
      await dailyPool.connect(alice).submitAnswer(submittedAnswer1);
      await dailyPool.connect(bob).submitAnswer(submittedAnswer2);
      await time.increase(60);
      expect(
        await dailyPool.executeRound(
          "Next question",
          "Next publicKey",
          "Next encrypted answer",
          "Prev privateKey",
        ),
      ).to.be.emit(dailyPool, "NewRoundOpened");
    });

    it("Should be reverted with Wrong prize or signature", async () => {
      const error = "Wrong prize or signature";
      await expect(dailyPool.claimPrize(signature, 0)).to.be.revertedWith(error);
    });
    it("Should be reverted with Not answered for this round", async () => {
      const hash = ethers.utils.solidityKeccak256(["uint256", "address"], [depositAmount, deployer.address]);
      signature = deployer.signMessage(ethers.utils.arrayify(hash));
      const error = "Not answered for this round";
      await expect(dailyPool.claimPrize(signature, depositAmount)).to.be.revertedWith(error);
    });
    it("Emits an events when user claimed his reward", async () => {
      const prevBalance = await testUSDT.balanceOf(alice.address);
      expect(await dailyPool.connect(alice).claimPrize(signature, depositAmount)).to.be.emit(
        dailyPool,
        "PrizeClaimed",
      );
      expect((await testUSDT.balanceOf(alice.address)).sub(prevBalance)).to.be.equal(depositAmount);
    });
    it("Should be claimed only once for one user and round", async () => {
      const error = "Already Claimed";
      expect(await dailyPool.connect(alice).claimPrize(signature, depositAmount)).to.be.emit(
        dailyPool,
        "PrizeClaimed",
      );
      await expect(dailyPool.connect(alice).claimPrize(signature, depositAmount)).to.be.revertedWith(error);
    });
  });
});

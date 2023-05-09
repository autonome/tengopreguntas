import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployments, ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { Ship } from "../utils";
import { BigNumber, BytesLike } from "ethers";
import { PromiseOrValue } from "../types/common";
import { DailyPool, DailyPool__factory } from "../types";

chai.use(solidity);
const { expect, assert } = chai;

let ship: Ship;
let dailyPool: DailyPool;

let deployer: SignerWithAddress;
let alice: SignerWithAddress;
let vault: SignerWithAddress;

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
  beforeEach(async () => {
    const scaffold = await setup();

    deployer = scaffold.accounts.deployer;
    alice = scaffold.accounts.alice;
    vault = scaffold.accounts.vault;

    dailyPool = await ship.connect(DailyPool__factory);
    const depositAmount = await dailyPool.depositAmount();
    console.log(BigNumber.from(depositAmount).toNumber());
  });

  describe("Deposit", () => {
    it("emits an event after deposit fund", async () => {});
  });
});

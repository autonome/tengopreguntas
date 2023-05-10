import { DeployFunction } from "hardhat-deploy/types";
import { DailyPool__factory, TestUSDT__factory } from "../types";
import { Ship } from "../utils";

const func: DeployFunction = async (hre) => {
  const { deploy, connect } = await Ship.init(hre);
  const usdtContract = await connect(TestUSDT__factory);
  const decimal = await usdtContract.decimals()
  const firstQuestion = "What is the blockchain?";
  const publicKey = "First privatekey";
  const encryptedAnswer = "First Encrypted answer";
  await deploy(DailyPool__factory, {
    args: [firstQuestion, encryptedAnswer, publicKey, usdtContract.address, decimal],
  });
};

export default func;
func.tags = ["pool", "all"];
func.dependencies = ["usdt"];

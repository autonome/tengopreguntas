import { DeployFunction } from "hardhat-deploy/types";
import { DailyPool__factory } from "../types";
import { Ship } from "../utils";
import { generateKeyPairSync } from "crypto";
import { writeFileSync } from "fs";
import { constants } from "crypto";
import { sign } from "crypto";

const func: DeployFunction = async (hre) => {
  const { deploy } = await Ship.init(hre);
  const usdtAddress = "0x8cDc8c7a027f18503f4A7C24e4b7488B08A56223";
  const firstQuestion = "question1";
  const firstAnswer = "answer1";
  const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });

  writeFileSync("0-publicKey.pem", keyPair.publicKey.export({ type: "spki", format: "pem" }));
  writeFileSync("0-privateKey.pem", keyPair.privateKey.export({ type: "pkcs8", format: "pem" }));
  // sign with private key
  const encryptedCorrectAnswer = sign("sha256", Buffer.from(firstAnswer), {
    key: keyPair.privateKey,
    padding: constants.RSA_PKCS1_PSS_PADDING,
  }).toString("base64");

  await deploy(DailyPool__factory, {
    args: [firstQuestion, encryptedCorrectAnswer, usdtAddress],
  });
};

export default func;
func.tags = ["test-pool", "test-all"];

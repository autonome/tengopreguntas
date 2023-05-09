import { HardhatUserConfig } from "hardhat/types";
import { node_url, accounts, verifyKey } from "./utils/network";
import { removeConsoleLog } from "hardhat-preprocessor";

import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-abi-exporter";
import "hardhat-deploy";
import "hardhat-watcher";
import "solidity-coverage";
import "hardhat-storage-layout";
import "dotenv/config";

import "./tasks/account";
import "./tasks/contracts";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 3141,
      forking: {
        enabled: false,
        blockNumber: undefined,
        url: node_url("hyperspace"),
      },
      accounts: accounts("hardhat"),
      mining: {
        auto: true,
      },
    },
    localhost: {
      url: node_url("localhost"),
      accounts: accounts("localhost"),
      tags: ["local", "test"],
    },
    testnet: {
      url: node_url("hyperspace"),
      accounts: [PRIVATE_KEY],
      tags: ["dev", "live"],
    },
    mainnet: {
      url: node_url("filecoin"),
      accounts: [PRIVATE_KEY],
      tags: ["prod", "live"],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      testnet: verifyKey("etherscan"),
      mainnet: verifyKey("etherscan"),
    },
    customChains: [
      {
        network: "Filecoin - Hyperspace testnet",
        chainId: 3141,
        urls: {
          apiURL: "https://hyperspace.filfox.info/api/v1",
          browserURL: "https://hyperspace.filfox.info/en/",
        },
      },
      {
        network: "Filecoin - Mainnet",
        chainId: 314,
        urls: {
          apiURL: "https://filfox.info/api/v1",
          browserURL: "https://filfox.info/en/",
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
    signer: 1,
    alice: 2,
    bob: 3,
  },
  abiExporter: {
    path: "./abis",
    runOnCompile: false,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: true,
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  mocha: {
    timeout: 10000000,
  },
  preprocess: {
    eachLine: removeConsoleLog((hre) => hre.network.name !== "hardhat" && hre.network.name !== "localhost"),
  },
};

export default config;

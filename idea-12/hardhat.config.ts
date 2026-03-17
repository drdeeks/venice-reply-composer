import { HardhatUserConfig } from "hardhat/config";
import { task } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import { deploy as lidoDeploy } from "@lido-sdk/hardhat";

require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");

const { INFURA_ID, PRIVATE_KEY } = process.env;

const chainIds: Record<string, NetworkUserConfig> = {
  hardhat: {},
  goerli: {
    url: `https://goerli.infura.io/v3/${INFURA_ID}`,
    accounts: [`0x${PRIVATE_KEY}`],
  },
  mainnet: {
    url: `https://mainnet.infura.io/v3/${INFURA_ID}`,
    accounts: [`0x${PRIVATE_KEY}`],
  },
  sepolia: {
    url: `https://rpc.sepolia.org/v1/${INFURA_ID}`,
    accounts: [`0x${PRIVATE_KEY}`],
  },
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: chainIds,
  namedAccounts: {
    deployer: 0,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    artifacts: "./artifacts",
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 100,
  },
  mocha: {
    timeout: 30000,
  },
};

export default config;
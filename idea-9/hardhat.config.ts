require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: '0.8.20',
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_URL,
        blockNumber: parseInt(process.env.FORK_BLOCK || '17500000'),
        enabled: Boolean(process.env.FORK_ENABLED),
      },
    },
    localhost: {
      url: 'http://localhost:8545',
    },
    'base-testnet': {
      url: process.env.BASE_TESTNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    'base-mainnet': {
      url: process.env.BASE_MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 20000,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    excludeContracts: ['Migrations', 'Mock', 'Test', 'Hook'],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
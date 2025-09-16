// hardhat.config.js
require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          viaIR: true,
          evmVersion: 'paris',
          metadata: { bytecodeHash: 'none' }
        }
      },
      {
        version: '0.8.24',
        settings: {
          optimizer: { enabled: true, runs: 200 },
          viaIR: true,
          evmVersion: 'paris',
          metadata: { bytecodeHash: 'none' }
        }
      }
    ]
  },
  paths: {
    root: ".",
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  resolver: {
    alias: {
      "@openzeppelin/contracts": "../../node_modules/@openzeppelin/contracts"
    }
  },
  networks: {
    hyperevm: {
      url: 'https://rpc.hyperliquid.xyz/evm',
      chainId: 999,
      accounts: process.env.DEPLOYER_KEY && process.env.DEPLOYER_KEY.length === 64 ? [process.env.DEPLOYER_KEY] : []
    },
    hyperevmTestnet: {
      url: 'https://rpc.hyperliquid-testnet.xyz/evm',
      chainId: 998,
      accounts: process.env.DEPLOYER_KEY && process.env.DEPLOYER_KEY.length === 64 ? [process.env.DEPLOYER_KEY] : []
    }
  }
};
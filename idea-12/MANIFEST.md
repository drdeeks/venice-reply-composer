# Project 12: Group DeFi Savings Chat

## Overview
A Status Network group chat integration that allows members to pool ETH into shared DeFi positions (Lido staking or Uniswap LP) without leaving the chat interface. Group decisions are made in-thread, with on-chain execution via transaction batching ("taps").

## Partners & Technologies
- **Status Network**: Mobile Ethereum client with group chat (IMP) integration
- **Uniswap**: Decentralized exchange for LP positions
- **Lido**: Liquid staking protocol for ETH staking

## Core Features
1. **Group Treasury Management**: Multi-signature wallet or smart contract wallet for group funds
2. **DeFi Strategy Execution**: Support for Lido staking and Uniswap V2/V3 LP positions
3. **In-Chat Governance**: Proposals, voting, and execution coordination within Status group chat
4. **Transaction Batching**: Consolidate multiple user actions into efficient on-chain transactions
5. **Real-time Share Accounting**: Track member contributions and earnings

## Architecture

### Frontend (Status DApp)
- React-based chat plugin
- Wallet connection via Status wallet
- Governance UI: proposals, voting, treasury dashboard
- Integration with Status Group Chat API

### Smart Contracts (EVM)
- **GroupTreasury.sol**: Main contract managing pooled funds
  - Deposit/withdraw functions with share accounting
  - Strategy execution (Lido/Uniswap)
  - Withdrawal locking periods
- **StrategyManager.sol**: DeFi strategy implementations
  - Lido staking wrapper
  - Uniswap LP position manager
- **Governance.sol**: On-chain voting for strategy changes/withdrawals

### Off-chain Services
- Indexer: Track contributions, shares, positions
- API: Serve chat bot and dApp data
- Transaction relay: Execute batched transactions

## Development Phases

### Phase 1: Research & Foundation
- Study Status SDK and IMP integration
- Review Lido and Uniswap contract interfaces
- Set up Hardhat/Truffle development environment
- Create base smart contract architecture

### Phase 2: Smart Contract Implementation
- Implement GroupTreasury with ERC-20 share tokens
- Implement StrategyManager with Lido/Unipool integrations
- Add governance module for strategy changes
- Write comprehensive tests

### Phase 3: Frontend & Chat Integration
- Build React dApp for Status
- Integrate with Status Group Chat API
- Implement chat bot for proposals/voting
- Real-time share calculator

### Phase 4: Testing & Deployment
- Integration tests
- Testnet deployment (Goerli/Sepolia)
- Security audits (internal)
- Production deployment (Mainnet)

## Enterprise Requirements
- Comprehensive test coverage (>90%)
- Formal verification where possible
- Upgradeability via proxies
- Detailed documentation
- Monitoring and incident response
- Gas optimization
- Access control and security best practices

## File Structure
```
idea-12/
├── contracts/
│   ├── GroupTreasury.sol
│   ├── StrategyManager.sol
│   ├── Governance.sol
│   ├── interfaces/
│   │   ├── ILido.sol
│   │   └── IUniswap.sol
│   └── libraries/
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── scripts/
│   ├── deploy.js
│   ├── indexer.js
│   └── bot.js
├── docs/
├── config/
├── hardhat.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Success Criteria
- Fully functional group savings dApp running on Status
- Live Lido staking position with real ETH
- Live Uniswap LP position with real ETH/Token pair
- Smooth UX: deposit -> earn -> withdraw
- Secure, audited smart contracts
- Comprehensive test suite passing

---

**Status**: Planning phase | **Priority**: High | **Owner**: Titan
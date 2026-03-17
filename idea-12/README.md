# Group DeFi Savings Chat - Status Integration

This is a Status Network group chat integration that enables members to pool ETH into shared DeFi positions (Lido staking + Uniswap LP) without leaving the chat interface.

## Features

- **Group Treasury Management**: Multi-signature wallet with share-based accounting
- **DeFi Strategy Execution**: Support for Lido staking and Uniswap LP positions
- **In-Chat Governance**: Proposals, voting, and execution coordination within Status group chat
- **Transaction Batching**: Consolidate multiple user actions into efficient on-chain transactions
- **Real-time Share Accounting**: Track member contributions and earnings

## Architecture

### Smart Contracts (EVM)
- **GroupTreasury.sol**: Main contract managing pooled funds
- **StrategyManager.sol**: DeFi strategy implementations
- **Governance.sol**: On-chain voting for strategy changes/withdrawals

### Frontend (Status DApp)
- React-based chat plugin
- Wallet connection via Status wallet
- Governance UI: proposals, voting, treasury dashboard
- Integration with Status Group Chat API

## Development

### Prerequisites
- Node.js 18+
- Hardhat
- Status App

### Setup

1. Install dependencies:
```bash
npm install
cd frontend && npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Add your Infura ID and private key
```

3. Compile contracts:
```bash
npx hardhat compile
```

4. Run tests:
```bash
npx hardhat test
```

5. Deploy to testnet:
```bash
npx hardhat run scripts/deploy.js --network goerli
```

6. Start frontend:
```bash
cd frontend && npm start
```

## Project Structure

```
├── contracts/          # Smart contracts
├── test/              # Test suites
├── frontend/          # React dApp
├── scripts/           # Deployment scripts
├── docs/             # Documentation
└── MANIFEST.md       # Project specification
```

## Security Considerations

- **Access Control**: Multi-signature governance for treasury operations
- **Withdrawal Locks**: 7-day lock period to prevent immediate exits
- **Strategy Safeguards**: Allocation limits and rebalance controls
- **Upgradability**: UUPS proxy pattern for contract upgrades

## Integration with Status

### Status SDK Integration
```typescript
import { useWeb3React } from '@web3-react/core';
import { injected } from './connectors';

// Connect to Status wallet
const { active, account, activate } = useWeb3React();

// Status Group Chat API integration
const groupChat = useStatusGroupChat();
```

### Chat Bot Commands
```
!deposit <amount> - Deposit ETH to treasury
!withdraw <shares> - Queue withdrawal
!propose "description" - Create governance proposal
!vote <id> <yes/no> - Vote on proposal
!treasury - View treasury stats
!positions - View active positions
```

## Deployment

### Testnet Deployment
1. Configure Hardhat for Goerli or Sepolia
2. Deploy contracts
3. Verify on Etherscan
4. Update frontend with contract addresses

### Mainnet Deployment
1. Security audit
2. Multi-signature deployment
3. Monitor gas usage
4. Emergency stop functionality

## Monitoring & Maintenance

- **Gas Usage**: Track and optimize contract calls
- **Treasury Health**: Monitor ETH balances and strategy performance
- **Proposal Activity**: Alert on new proposals and votes
- **Contract Upgrades**: Test and deploy improvements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Discord: #group-defi-savings
- Email: support@groupdefisavings.chat
- Status: Join our official group chat
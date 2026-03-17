# Project 9: AI Agent Revenue Splitter

## Overview
Automatically distribute protocol fees earned by Virtuals AI agents on Base to token holders in real-time, proportional to their holdings. Deploy once; dividends flow forever.

## Partners
- **Virtuals Protocol**: AI agents on Base with associated tokens
- **Slice**: Commerce protocol with hooks for on-chain actions
- **Base**: Ethereum L2 for deployment

## Architecture
```
┌─────────────────┐
│ Virtuals Agent  │ (earns fees)
│     Wallet      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   RevenueSplitter (Smart Contract) │
│  - Holds revenue pool               │
│  - Tracks agent token holders       │
│  - Distributes proportionally       │
│  - Integrated with Slice Hooks      │
└────────┬────────────────────────────┘
         │
         ├─> Automatic splits (via hooks)
         └─> Manual claims (pull model)
```

## Key Components

### 1. RevenueSplitter.sol
Main contract implementing:
- ERC-20 token snapshot/balance tracking
- Revenue pool management (accept stablecoins, ETH, etc.)
- Proportional distribution based on token holdings at time of revenue
- Pull/claim pattern for gas efficiency
- Events for transparency

### 2. SliceHook.sol (Optional)
If Virtuals agent sells via Slice:
- Custom hook implementing IProductAction
- Redirects purchase revenue to splitter
- Triggers distribution event

### 3. AgentToken.sol
Wrapper/interface for the Virtuals agent's ERC-20 token

### 4. Deployment & Scripts
- Deployment scripts for Base
- Configuration management
- Upgradeable proxy (if needed)

## Tech Stack
- **Language**: Solidity ^0.8.20
- **Framework**: Hardhat (testing, deployment)
- **Network**: Base Mainnet/Testnet
- **Libraries**: OpenZeppelin, Slice hooks

## Directory Structure
```
idea-9/
├── contracts/
│   ├── RevenueSplitter.sol
│   ├── SliceHook.sol
│   ├── interfaces/
│   │   ├── IRevenueSplitter.sol
│   │   ├── ISliceHook.sol
│   │   └── IAgentToken.sol
│   └── libraries/
│       └── SafeMath.sol
├── test/
│   ├── RevenueSplitter.test.ts
│   ├── SliceHook.test.ts
│   └── helpers/
├── scripts/
│   ├── deploy.ts
│   ├── configure.ts
│   └── distribute.ts
├── frontend/ (optional)
│   └── src/components/TokenHolderDashboard.tsx
├── manifests/
│   └── agent-config.json
├── .env.example
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

## Implementation Phases

### Phase 1: Core Smart Contracts (Week 1)
- Design RevenueSplitter with pull distribution
- Implement snapshot mechanism for token holder eligibility
- Add acceptance of multiple currencies (USDC, USDT, ETH)
- Write comprehensive tests (unit + integration)

### Phase 2: Slice Integration (Week 2)
- Research Virtuals agent revenue sources
- Build Slice hook if needed
- Implement automatic distribution on revenue receipt
- Test on Base testnet

### Phase 3: Deployment & Monitoring (Week 3)
- Deploy to Base mainnet
- Set up monitoring/alerting
- Documentation for agent creators
- Governance mechanisms (if needed)

### Phase 4: Enterprise Features (Week 4)
- Upgradeability (if needed)
- Gas optimization
- Access control
- Emergency pause
- Multi-sig treasury support

## Testing Strategy
- Unit tests: 90%+ coverage
- Forked mainnet tests with real Virtuals tokens
- Integration tests with Slice mock
- Security audit checklist

## Success Criteria
- Contract deployed on Base mainnet
- Tested with 10,000+ token holders scenario
- Automatic distribution verified
- Gas costs < 10% of distributed amount
- Comprehensive documentation

## Open Questions
1. Exact Virtuals token contract address(es)?
2. Revenue sources (fees from where exactly?)
3. Should distribution be automatic or claim-based?
4. What currencies are earned?
5. Is Slice integration required or optional?

---
*Status: Planning phase. Researching Virtuals Protocol specifics.*
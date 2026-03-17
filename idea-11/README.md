# Uniswap v4 Hook Revenue Share

**Project 11 - Synthesis Hackathon 2026**

## Overview

A Uniswap v4 hook that intercepts a configurable percentage of swap fees and routes them to a Slice payment splitter, enabling automatic revenue distribution to protocol contributors at the contract level.

**Partners:** Uniswap, Slice  
**Estimated Prize:** $6,450  
**Bounties:** Agentic Finance, Build with x402, Slice Hooks

## Architecture

```
┌─────────────────┐
│   Uniswap v4    │
│     Pool        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hook Contract  │ ← Intercepts swaps
│  (Revenue       │   via afterSwap hook
│   Share)        │
└────────┬────────┘
         │
         ├─────────────┐
         ▼             ▼
┌─────────────────┐ ┌─────────────────┐
│  Protocol Fee   │ │  LP Provider    │
│  (configurable  │ │  Fee (standard) │
│   percentage)   │ │                 │
└────────┬────────┘ └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Slice Payment  │
│  Splitter       │ ← Auto-distributes
│                 │   to contributors
└─────────────────┘
```

## Components

1. **RevenueShareHook.sol** - Core hook contract implementing Uniswap v4 hook callbacks
2. **SlicePaymentSplitter.sol** - Wrapper around Slice's payment splitting mechanism
3. **Deployer.s.sol** - Deployment script with configuration
4. **Integration tests** - Comprehensive test suite using Forge
5. **Deployment guide** - Step-by-step deployment instructions

## Key Features

- ✅ Configurable fee percentage (basis points)
- ✅ Automatic routing to Slice payment splitter
- ✅ Support for multiple contributor addresses with weighted splits
- ✅ Reentrancy protection
- ✅ Event emissions for transparency
- ✅ Emergency withdrawal functionality
- ✅ Upgradeable pattern (optional)

## Tech Stack

- **Language:** Solidity ^0.8.20
- **Framework:** Foundry
- **Libraries:**
  - Uniswap v4 Core
  - Uniswap v4 Hook interfaces
  - OpenZeppelin contracts (ReentrancyGuard, Ownable)
  - Slice payment splitter integration

## Prerequisites

- Foundry installed
- Access to Uniswap v4 testnet/mainnet deployments
- Slice payment splitter contract address (or deploy your own)
- RPC endpoint (for deployment/testing)

## Quick Start

```bash
# Install dependencies
forge install Uniswap/v4-core

# Compile
forge build

# Run tests
forge test -vvv

# Deploy to localhost
forge script script/Deploy.s.sol:Deploy --rpc-url localhost --private-key $PRIVATE_KEY
```

See `docs/DEPLOYMENT.md` for full deployment instructions.

## Testing

The test suite covers:

- Hook fee interception accuracy
- Integration with Slice payment splitter
- Configurable fee percentage validation
- Multiple contributor splits
- Edge cases (zero fees, 100% fees, reentrancy)
- Emergency withdrawal

```bash
# Unit tests
forge test --via-ir -vvv

# With coverage
forge coverage

# Gas reporting
forge test --gas-report
```

## Project Structure

```
hackathon/idea-11/
├── contracts/
│   ├── RevenueShareHook.sol
│   ├── interfaces/
│   │   └── ISlicePaymentSplitter.sol
│   └── libraries/
│       └── FeeMath.sol
├── src/
│   └── types.ts
├── test/
│   ├── RevenueShareHook.t.sol
│   ├── mocks/
│   │   └── MockSliceSplitter.s.sol
│   └── fixtures/
│       └── PoolFixture.t.sol
├── script/
│   └── Deploy.s.sol
├── docs/
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   └── API.md
├── foundry.toml
├── package.json
└── README.md
```

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions, open an issue in the repository or contact the development team.

---

*Built for the Synthesis Hackathon 2026*
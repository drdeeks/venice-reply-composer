# Project Structure

```
hackathon/idea-11/
├── contracts/                    # Solidity smart contracts
│   ├── RevenueShareHook.sol      # Main hook contract
│   ├── interfaces/               # Contract interfaces
│   │   └── ISlicePaymentSplitter.sol
│   ├── libraries/                # Reusable libraries
│   │   └── FeeMath.sol
│   └── mocks/                    # Test mocks
│       └── MockSliceSplitter.sol
├── src/                         # TypeScript source files
│   ├── index.ts                 # Main API entry point
│   └── types.ts                 # Type definitions
├── scripts/                     # deployment and utility scripts
│   ├── Deploy.s.sol             # Deployment script
│   └── run.js                   # Script runner
├── test/                        # Test files
│   ├── RevenueShareHook.t.sol   # Main test suite
│   ├── mocks/                   # Test mocks (Solidity)
│   └── fixtures/                # Test fixtures
├── docs/                        # Documentation
│   ├── API.md                   # API reference
│   ├── ARCHITECTURE.md          # Architecture docs
│   └── DEPLOYMENT.md            # Deployment guide
├── foundry.toml                 # Foundry configuration
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration (optional)
├── package.json                 # Node dependencies
├── README.md                    # Project overview
├── manifest.md                  # Hackathon manifest
├── LICENSE                      # MIT License
└── .gitignore                   # Git ignore rules

Additional files may be generated:
- out/      (Foundry build artifacts)
- lib/      (forged dependencies)
- cache/    (Foundry cache)
- dist/     (TypeScript build output)
- coverage/ (coverage reports)
```

## Key Files Overview

### Smart Contracts (contracts/)

**RevenueShareHook.sol** - Core contract implementing:
- Uniswap v4 hook callbacks (no-op for unused hooks)
- Fee collection and distribution logic
- Contributor management (add/remove/update)
- Security features: ReentrancyGuard, input validation
- Event emissions for transparency

**FeeMath.sol** - Math library with safe operations:
- Addition, subtraction, multiplication, division with overflow checks
- Percentage calculations
- Proportional distribution calculations

**ISlicePaymentSplitter.sol** - Interface for Slice integration

### Testing (test/)

**RevenueShareHook.t.sol** - Comprehensive test suite covering:
- Initialization tests
- Fee percentage management
- Contributor management
- Fee collection and distribution
- Statistics queries
- Emergency withdrawal
- Event emissions
- Reentrancy protection
- Edge cases

**MockSliceSplitter.sol** - Mock implementation for local testing

**PoolFixture.t.sol** (in fixtures/) - Test harness for pool integration

### Deployment (scripts/)

**Deploy.s.sol** - Multi-purpose deployment and configuration script:
- `deploy()` - Deploy new hook contract with config
- `deployDefault()` - Deploy with test defaults
- `configure()` - Update hook configuration
- `addContributors()` - Batch add contributors
- `removeContributor()` - Remove a contributor
- `updateContributorShare()` - Change contributor share
- `emergencyWithdraw()` - Emergency fund recovery
- `getStats()` - Read hook statistics
- `getContributorInfo()` - Read contributor details
- `getAllContributors()` - List all contributors

### TypeScript API (src/)

**types.ts** - Type definitions for:
- HookConfig
- ContributorConfig
- HookStats
- ContributorInfo
- DeploymentOptions
- NetworkConfig

**index.ts** - Main entry point with:
- Type exports
- Utility functions
- Validation helpers
- Network configurations

### Configuration Files

**foundry.toml** - Foundry configuration:
- Compiler version (0.8.20)
- Path aliases
- Gas reporting
- Coverage settings
- Script definitions

**tsconfig.json** - TypeScript configuration with path aliases

**package.json** - Node dependencies:
- `@openzeppelin/contracts`
- `forge-std`
- `@uniswap/v4-core` (optional)
- Build tools

### Documentation (docs/)

**README.md** - Project overview, quick start, tech stack

**DEPLOYMENT.md** - Complete deployment guide:
- Prerequisites
- Environment setup
- Local testing
- Testnet deployment
- Mainnet deployment
- Post-deployment steps
- Troubleshooting

**ARCHITECTURE.md** - System design:
- Component diagrams
- Data flow
- State variables
- Permissions
- Security considerations
- Extension points

**API.md** - Complete API reference:
- All functions
- Events
- Error codes
- Usage examples
- TypeScript API

---

## File Naming Conventions

- Solidity contracts: `PascalCase.sol`
- Interfaces: `IInterfaceName.sol`
- Libraries: `LibraryName.sol` (may be PascalCase or snake_case)
- Test files: `ContractName.t.sol`
- Scripts: `ActionName.s.sol`
- Config files: `kebab-case`
- TypeScript: `camelCase.ts`

---

## Quick Links

- [Main README](README.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Hackathon Manifest](manifest.md)

---

*Last updated: March 13, 2026*
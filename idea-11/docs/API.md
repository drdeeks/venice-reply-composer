# API Documentation

## Table of Contents

1. [RevenueShareHook Interface](#revenuessharehook-interface)
2. [Slice Payment Splitter Interface](#slice-payment-splitter-interface)
3. [Events](#events)
4. [Error Codes](#error-codes)
5. [TypeScript API](#typescript-api)
6. [Usage Examples](#usage-examples)

---

## RevenueShareHook Interface

### State Getters

```solidity
/// @notice Get the current fee percentage in basis points
/// @return fee percentage (0-10000, where 5000 = 50%)
function getFeePercentage() external view returns (uint256);

/// @notice Get the configured Slice payment splitter address
/// @return address of the splitter
function getSliceSplitter() external view returns (address);

/// @notice Get total fees collected since deployment
/// @return collected fees in wei
function getTotalCollectedFees() external view returns (uint256);

/// @notice Get total fees distributed to Slice
/// @return distributed fees in wei
function getTotalDistributedFees() external view returns (uint256);

/// @notice Get contributor count
/// @return number of contributors
function getContributorCount() external view returns (uint256);

/// @notice Get contributor details
/// @param _contributor address to query
/// @return account, shareBasisPoints, accumulatedFees, isActive
function getContributor(address _contributor)
    external view returns (
        address account,
        uint256 shareBasisPoints,
        uint256 accumulatedFees,
        bool isActive
    );

/// @notice Get all active contributors
/// @return arrays of accounts, shares, and accumulated fees
function getAllContributors()
    external view returns (
        address[] memory accounts,
        uint256[] memory shares,
        uint256[] memory fees
    );

/// @notice Get comprehensive hook statistics
/// @return collected, distributed, feePercentage, contributorCount
function getStats()
    external view returns (
        uint256 collected,
        uint256 distributed,
        uint256 feePercentage,
        uint256 contributorCount
    );
```

### Administrative Functions (Owner Only)

```solidity
/// @notice Set the protocol fee percentage
/// @param _newFeeBasisPoints fee in basis points (0-10000)
function setFeePercentage(uint256 _newFeeBasisPoints) external;

/// @notice Set/update the Slice payment splitter address
/// @param _splitter address of new splitter contract
function setPaymentSplitter(address _splitter) external;

/// @notice Add a new contributor
/// @param _contributor contributor wallet address
/// @param _shareBasisPoints share % in basis points (1-10000)
/// @param _category category string (e.g., "development")
function addContributor(
    address _contributor,
    uint256 _shareBasisPoints,
    string memory _category
) external;

/// @notice Remove a contributor
/// @param _contributor address to remove
function removeContributor(address _contributor) external;

/// @notice Update a contributor's share percentage
/// @param _contributor contributor address
/// @param _newShareBasisPoints new share in basis points
function updateContributorShare(
    address _contributor,
    uint256 _newShareBasisPoints
) external;

/// @notice Withdraw contract balance (emergency use only)
function emergencyWithdraw() external;

/// @notice Transfer contract ownership
/// @param newOwner address of new owner
function transferOwnership(address newOwner) external;
```

### Fee Collection

```solidity
/// @notice Collect and distribute fees (called by pool/external)
/// @param _feeAmount amount of fee collected (in wei)
function collectFees(uint256 _feeAmount) external;
```

### Hook Callbacks

These are required by the Uniswap v4 hook interface but are currently no-ops:

```solidity
function afterSwap(IPoolManager memory _poolManager) external override;
function beforeSwap(IPoolManager memory _poolManager) external override;
function afterInitialize(IPoolManager memory _poolManager) external override;
function beforeInitialize(IPoolManager memory _poolManager) external override;
function afterAddLiquidity(IPoolManager memory _poolManager) external override;
function beforeAddLiquidity(IPoolManager memory _poolManager) external override;
function afterRemoveLiquidity(IPoolManager memory _poolManager) external override;
function beforeRemoveLiquidity(IPoolManager memory _poolManager) external override;
```

---

## Slice Payment Splitter Interface

### Distribution Functions

```solidity
/// @notice Distribute funds among contributors according to shares
/// @param amount amount to distribute (in wei)
function distribute(uint256 amount) external payable;

/// @notice Add a contributor
/// @param contributor contributor address
/// @param shareBasisPoints share percentage (1-10000)
function addContributor(address contributor, uint256 shareBasisPoints) external;

/// @notice Remove a contributor
/// @param contributor contributor address
function removeContributor(address contributor) external;
```

### View Functions

```solidity
/// @notice Get share percentage for a contributor
/// @param contributor contributor address
/// @return share in basis points
function getShare(address contributor) external view returns (uint256);

/// @notice Get total configured shares
/// @return total in basis points (should be 10000)
function getTotalShares() external view returns (uint256);

/// @notice Get number of contributors
/// @return contributor count
function getContributorCount() external view returns (uint256);

/// @notice Get contributor at index
/// @param index 0-based index
/// @return contributor address
function getContributor(uint256 index) external view returns (address);

/// @notice Get total accumulated funds (if tracked)
/// @return total funds balance
function getAccumulated() external view returns (uint256);
```

---

## Events

### RevenueShareHook Events

```solidity
/// @notice Emitted when fee percentage is updated
event FeePercentageUpdated(
    uint256 indexed oldFee,
    uint256 indexed newFee
);

/// @notice Emitted when fees are collected
event FeeCollected(
    uint256 amount,         // total swap fee
    uint256 protocolFee    // portion kept by protocol
);

/// @notice Emitted when fees are routed to Slice
event FeeRouted(
    uint256 amount,         // amount routed
    uint256 distributionCount  // number of contributors
);

/// @notice Emitted when a contributor is added
event ContributorAdded(
    address indexed contributor,
    uint256 shareBasisPoints,
    bytes32 indexed category  // keccak256 of category string
);

/// @notice Emitted when a contributor is removed
event ContributorRemoved(
    address indexed contributor
);

/// @notice Emitted when contributor share is updated
event ContributorShareUpdated(
    address indexed contributor,
    uint256 oldShare,
    uint256 newShare,
    uint256 totalShares
);

/// @notice Emitted when new Slice splitter is set
event SplitterUpdated(
    address indexed oldSplitter,
    address indexed newSplitter
);

/// @notice Emitted on emergency withdrawal
event EmergencyWithdrawal(
    address indexed to,
    uint256 amount
);

/// @notice Hook initialization event (for tracking)
event Initialize(
    address indexed pool,
    bytes32 indexed keyHash,
    bytes32 currency
);
```

---

## Error Codes

### Access Errors

| Code | Message | Cause |
|------|---------|-------|
| `UNAUTHORIZED` | "Unauthorized" | Caller is not owner |
| `INVALID_OWNER` | "Invalid owner" | Owner address is zero |

### Parameter Errors

| Code | Message | Cause |
|------|---------|-------|
| `FEE_TOO_HIGH` | "Fee percentage too high" | feeBasisPoints > 10000 |
| `INVALID_SPLITTER` | "Invalid splitter address" | Slice address is zero |
| `INVALID_CONTRIBUTOR` | "Invalid contributor address" | Zero address |
| `SHARE_MUST_BE_POSITIVE` | "Share must be positive" | Share ≤ 0 |
| `SHARE_TOO_HIGH` | "Share too high" | Share > 10000 |
| `TOTAL_SHARES_EXCEED` | "Total shares exceed 100%" | Sum > 10000 |
| `DUPLICATE_CONTRIBUTOR` | "Contributor already exists" | Duplicate add |

### Fee Collection Errors

| Code | Message | Cause |
|------|---------|-------|
| `NO_FEES_TO_COLLECT` | "No fees to collect" | Amount is 0 |
| `NO_BALANCE_TO_WITHDRAW` | "No balance to withdraw" | Balance is 0 |
| `TOTAL_SHARES_ZERO` | "Total shares is zero" | No contributors configured |

---

## TypeScript API

### Type Definitions

```typescript
export interface HookConfig {
  /** Fee percentage in basis points (e.g., 500 = 5%) */
  feeBasisPoints: number;
  /** Slice payment splitter contract address */
  sliceSplitterAddress: string;
  /** Owner address (must have admin privileges) */
  ownerAddress: string;
}

export interface ContributorConfig {
  address: string;
  shareBasisPoints: number;
  category: string;
}

export interface HookStats {
  collectedFees: bigint;
  distributedFees: bigint;
  feePercentage: number;
  contributorCount: number;
}

export interface ContributorInfo {
  account: string;
  shareBasisPoints: number;
  accumulatedFees: bigint;
  isActive: boolean;
}
```

### Deployment Script Usage

```typescript
import { deploy, configure, addContributors } from './scripts/Deploy.s.sol';
import { HookConfig, ContributorConfig } from './src/types';

// Deploy hook
const config: HookConfig = {
  feeBasisPoints: 500,  // 5%
  sliceSplitterAddress: '0x...',
  ownerAddress: '0x...',
};

const hookAddress = await deploy(config);

// Add contributors
const contributors: ContributorConfig[] = [
  { address: '0x...', shareBasisPoints: 4000, category: 'development' },
  { address: '0x...', shareBasisPoints: 3000, category: 'marketing' },
  { address: '0x...', shareBasisPoints: 3000, category: 'operations' },
];

await addContributors(hookAddress, contributors);
```

---

## Usage Examples

### Example 1: Deploying a New Hook

```javascript
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Deploy Uniswap v4 hook
  const Hook = await ethers.getContractFactory('RevenueShareHook');
  const hook = await Hook.deploy(deployer.address);
  await hook.deployed();
  
  console.log('Hook deployed to:', hook.address);
}
```

### Example 2: Configuring Fee Percentage

```javascript
async function setFee(hookAddress, feePercentage) {
  const hook = await ethers.getContractAt('RevenueShareHook', hookAddress);
  
  // Set fee to 5% (500 basis points)
  await hook.setFeePercentage(500);
  
  const fee = await hook.getFeePercentage();
  console.log('Fee set to:', fee.toString());
}
```

### Example 3: Adding Contributors

```javascript
async function addContributors(hookAddress, contributors) {
  const hook = await ethers.getContractAt('RevenueShareHook', hookAddress);
  
  // Add contributors with shares
  await hook.addContributor(
    '0xContributor1',
    4000,  // 40%
    'development'
  );
  
  await hook.addContributor(
    '0xContributor2',
    3000,  // 30%
    'marketing'
  );
  
  await hook.addContributor(
    '0xContributor3',
    3000,  // 30%
    'partnerships'
  );
  
  console.log('Contributors added');
}
```

### Example 4: Collecting and Distributing Fees

```javascript
async function collectFees(hookAddress, feeAmount) {
  const hook = await ethers.getContractAt('RevenueShareHook', hookAddress);
  
  // This function would be called by the pool or a fee collector
  await hook.collectFees(feeAmount);
  
  const stats = await hook.getStats();
  console.log(`Collected ${ethers.utils.formatEther(stats.collected)} ETH`);
}
```

### Example 5: Reading Statistics

```javascript
async function getHookStats(hookAddress) {
  const hook = await ethers.getContractAt('RevenueShareHook', hookAddress);
  
  const [
    collected,
    distributed,
    feePercentage,
    contributorCount
  ] = await hook.getStats();
  
  console.log('Hook Statistics:');
  console.log('- Collected fees:', ethers.utils.formatEther(collected), 'ETH');
  console.log('- Distributed fees:', ethers.utils.formatEther(distributed), 'ETH');
  console.log('- Fee percentage:', feePercentage.toString(), 'bps (', (feePercentage/100).toFixed(2), '%)');
  console.log('- Active contributors:', contributorCount.toString());
}
```

---

## API Reference Quick Links

- [RevenueShareHook.sol](../contracts/RevenueShareHook.sol) - Main contract
- [ISlicePaymentSplitter.sol](../contracts/interfaces/ISlicePaymentSplitter.sol) - Slice interface
- [FeeMath.sol](../contracts/libraries/FeeMath.sol) - Math utilities
- [Deployments script](../scripts/Deploy.s.sol) - Deployment operations

---

*Last updated: March 13, 2026*
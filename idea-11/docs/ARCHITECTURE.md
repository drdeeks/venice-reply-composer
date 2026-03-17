# Architecture Documentation

## System Architecture

The Uniswap v4 Hook Revenue Share system consists of three main components:

1. **RevenueShareHook** - Core smart contract that intercepts swap fees and routes to Slice
2. **Slice Payment Splitter** - External contract for automated revenue distribution
3. **Configuration System** - Owner-managed contributor and fee settings

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         UNISWAP V4 POOL                         │
│                                                                 │
│  Swapping Users → Pool → Fee Collection → RevenueShareHook     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REVENUE SHARE HOOK CONTRACT                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ State Storage                                            │   │
│  │  • feeBasisPoints          (uint256)                     │   │
│  │  • sliceSplitter           (address)                     │   │
│  │  • contributors[]          (Contributor[])               │   │
│  │  • totalCollectedFees      (uint256)                     │   │
│  │  • totalDistributedFees   (uint256)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Public Functions                                         │   │
│  │  • setFeePercentage(uint256)           [owner only]      │   │
│  │  • setPaymentSplitter(address)         [owner only]      │   │
│  │  • addContributor(address,uint256)     [owner only]      │   │
│  │  • removeContributor(address)          [owner only]      │   │
│  │  • updateContributorShare(...)         [owner only]      │   │
│  │  • getStats()                    [read-only]             │   │
│  │  • getAllContributors()           [read-only]             │   │
│  │  • getContributor(address)        [read-only]             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Hook Callbacks (unused except for future extension)      │   │
│  │  • beforeSwap/afterSwap, beforeInit/afterInit, etc.      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Internal Functions                                        │   │
│  │  • collectFees(uint256) - called by external             │   │
│  │  • _distributeToSlice(uint256) - internal routing        │   │
│  |  • _getTotalShares() - compute active shares             │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ .distribute(amount)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                SLICE PAYMENT SPLITTER CONTRACT                 │
│                                                                 │
│  • Manages contributor shares                                  │
│  • Handles distribution logic                                  │
│  • Allows contributors to withdraw their portion              │
│  • Records distribution history                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Withdraw(amount)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONTRIBUTORS (wallets)                     │
│  • Individual contributors receive funds based on share %     │
│  • Can withdraw from Slice whenever available                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Fee Interception Flow

```
1. Swapper executes trade on Uniswap v4 pool
2. Pool charges swap fee (standard Uniswap fee)
3. Pool sends protocol fee to hook contract (via configured mechanism)
4. Hook's collectFees(amount) is called by authorized entity
5. Hook calculates protocol fee: amount × feeBasisPoints / 10000
6. Hook emits FeeCollected event
7. Hook routes fee to Slice payment splitter via _distributeToSlice()
8. Slice splitter adds to contributor balances
9. Contributors withdraw their share from Slice
```

### Configuration Management Flow

```
Owner actions:
1. Set fee percentage -> setFeePercentage(uint256)
2. Set Slice splitter -> setPaymentSplitter(address)
3. Add contributor -> addContributor(address,uint256,category)
4. Remove contributor -> removeContributor(address)
5. Update contributor share -> updateContributorShare(...)
6. Emergency withdraw -> emergencyWithdraw() if needed
```

## State Variables

### RevenueShareHook

| Variable | Type | Visibility | Description |
|----------|------|------------|-------------|
| `feeBasisPoints` | `uint256` | `public` | Fee percentage in basis points (0-10000) |
| `sliceSplitter` | `ISlicePaymentSplitter` | `public` | Slice payment splitter contract address |
| `contributors` | `Contributor[]` | `public` | Array of all configured contributors |
| `contributorIndex` | `mapping(address => uint256)` | `public` | Quick lookup (1-based index) |
| `totalCollectedFees` | `uint256` | `public` | Total fees collected since deployment |
| `totalDistributedFees` | `uint256` | `public` | Total fees routed to Slice |
| `owner` | `address` | `public` | Contract owner address |

### Contributor Struct

```solidity
struct Contributor {
    address account;           // Contributor wallet address
    uint256 shareBasisPoints;  // Share percentage (500 = 5%)
    uint256 totalAccumulatedFees; // Total fees earned
    bool isActive;             // Whether contributor is active
}
```

## Permissions & Access Control

| Function | Required Role | Description |
|----------|--------------|-------------|
| `setPaymentSplitter` | `owner` | Update Slice splitter address |
| `setFeePercentage` | `owner` | Change protocol fee percentage |
| `addContributor` | `owner` | Add new revenue share recipient |
| `removeContributor` | `owner` | Remove a contributor |
| `updateContributorShare` | `owner` | Modify contributor's share % |
| `collectFees` | `this` (contract) | Internal fee collection |
| `emergencyWithdraw` | `owner` | Withdraw all contract balance |
| `getStats` | `anyone` | Read hook statistics |
| `getContributor` | `anyone` | Read contributor info |
| `getAllContributors` | `anyone` | List all active contributors |
| `afterSwap` | `Pool Manager` | Hook callback (no-op) |

## Security Considerations

### Reentrancy Protection

- `collectFees()` and `_distributeToSlice()` use `nonReentrant` modifier
- `emergencyWithdraw()` uses `nonReentrant` modifier
- External calls (to Slice) are safe due to checks-effects-interactions pattern

### Input Validation

- Fee percentage: `require(_newFee <= MAX_FEE_PERCENTAGE)`
- Total shares: `require(totalShares + newShare <= MAX_SHARES)`
- Address checks: `require(_address != address(0))`
- Share bounds: `require(_share > 0 && _share <= MAX_SHARES)`

### Upgradeability

Current implementation is **non-upgradeable**. For production:

1. Consider using OpenZeppelin Transparent Proxy or UUPS pattern
2. Store settable variables in dedicated storage slots
3. Use `initializable` for two-phase initialization
4. Plan for pausable functionality if needed

## Extension Points

The hook is designed to be extensible:

1. **Add real fee extraction**: Implement proper fee capture from pool state
2. **Pause functionality**: Add `Pausable` for emergency stops
3. **Timelock**: Use `TimelockController` for critical parameter changes
4. **Vesting**: Add vesting schedules for contributor shares
5. **Multi-sig**: Replace `owner` with Gnosis Safe for production

## Gas Optimizations

Current optimizations:

1. **Packed structs**: `Contributor` uses tight packing
2. **Array mappings**: `contributorIndex` for O(1) lookup
3. **Efficient loops**: Limit iteration to active contributors only

Potential further optimizations:

1. **Bit packing**: Store `isActive` in a separate mapping
2. **Batch operations**: Handle multiple contributors in one tx
3. **Event indexing**: Reduce event data size

## Integration with Slice

The hook integrates with Slice using the `ISlicePaymentSplitter` interface:

```solidity
interface ISlicePaymentSplitter {
    function distribute(uint256 amount) external;
    function addContributor(address contributor, uint256 shareBasisPoints) external;
    function getShare(address contributor) external view returns (uint256);
}
```

**Note**: This interface assumes the standard Slice payment splitter. Adjust if Slice uses a different interface.

## Future Enhancements

1. **Dynamic fee tiers**: Different fees for different token pairs
2. **Hook state management**: Integrate with Uniswap v4's state management
3. **x402 integration**: Support payment requests (Bounty 6450)
4. **Governance**: Add DAO control over fee parameters
5. **Analytics**: On-chain analytics and reporting contract

---

*Generated: March 13, 2026*
# Deployment Guide

This guide provides step-by-step instructions for deploying the Uniswap v4 Hook Revenue Share project to various networks.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Testing](#local-testing)
4. [Testnet Deployment](#testnet-deployment)
5. [Mainnet Deployment](#mainnet-deployment)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** v18+ (for TypeScript tooling)
- **Foundry** (latest version)
- **Git**
- **Bash/Zsh** shell

### Required Accounts & Funds

- **RPC endpoint** (Infura, Alchemy, or local node)
- **Wallet with private key** for deployment
- **Testnet ETH** (for testnet deployment)
- **Mainnet ETH** (for mainnet deployment)

### Required Contracts (Pre-deployed)

- **Uniswap v4 PoolManager** - must be deployed already on target network
- **Slice Payment Splitter** - either your own or Slice's deployed version

---

## Environment Setup

### 1. Clone and Install

```bash
# Navigate to project directory
cd hackathon/idea-11

# Install Foundry dependencies
forge install

# Install Node.js dependencies
npm install

# Build the project
npm run build
# or
forge build
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# RPC URLs
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID

# Private keys (KEEP SECURE!)
# NEVER commit these to version control
DEPLOYER_PRIVATE_KEY=0x...

# Network configuration
NETWORK_ID=5  # 1=mainnet, 5=goerli, 137=polygon, etc.
POOL_MANAGER_ADDRESS=0x...
SLICE_SPLITTER_ADDRESS=0x...

# Gas configuration (optional)
GAS_PRICE=1000000000  # 1 gwei
GAS_LIMIT=6000000
```

### 3. Load Environment Variables

```bash
# For Foundry
export MAINNET_RPC_URL="your_rpc_url"
export DEPLOYER_PRIVATE_KEY="your_private_key"

# For Node.js/TypeScript
source .env  # or use direnv/dotenv-cli
```

---

## Local Testing

### 1. Start Local Node

```bash
# Start Anvil (Foundry's local Ethereum node)
anvil \
  --port 8545 \
  --accounts 20 \
  --balance 10000000000000000000000  # 10,000 ETH per account
```

### 2. Run Tests

```bash
# Run all tests
forge test -vvv

# Run with coverage
forge coverage --report-line --report-html

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-contract RevenueShareHookTest --match-test test_FeeCollection_Basic
```

### 3. Run Local Deployment

```bash
# Deploy to localhost
forge script scripts/Deploy.s.sol:deploy \
  --rpc-url http://localhost:8545 \
  --private-key 0x... \
  --broadcast

# Use default configuration
forge script scripts/Deploy.s.sol:deployDefault \
  --rpc-url http://localhost:8545 \
  --private-key 0x... \
  --broadcast
```

---

## Testnet Deployment

### 1. Prepare Testnet Configuration

Create `configuration/testnet.json`:

```json
{
  "rpcUrl": "https://goerli.infura.io/v3/YOUR_PROJECT_ID",
  "chainId": 5,
  "poolManagerAddress": "0x...",
  "sliceSplitterAddress": "0x...",
  "initialFeeBasisPoints": 500,
  "ownerAddress": "0x...",
  "contributors": [
    {
      "address": "0x...",
      "shareBasisPoints": 4000,
      "category": "development"
    },
    {
      "address": "0x...",
      "shareBasisPoints": 3000,
      "category": "marketing"
    },
    {
      "address": "0x...",
      "shareBasisPoints": 3000,
      "category": "operations"
    }
  ]
}
```

### 2. Deploy to Testnet

```bash
# Deploy the hook contract
forge script scripts/Deploy.s.sol:deploy \
  --rpc-url $GOERLI_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --slow

# Pass configuration as calldata
forge script scripts/Deploy.s.sol:deploy \
  --rpc-url $GOERLI_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --sig "deploy(address,uint256,address)" \
  $OWNER_ADDRESS 500 $SLICE_SPLITTER_ADDRESS
```

### 3. Configure Contributors After Deployment

```bash
# Add contributors
forge script scripts/Deploy.s.sol:addContributors \
  --rpc-url $GOERLI_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --sig "addContributors(address,address[],uint256[],string[])" \
  $HOOK_ADDRESS \
  "[0xContributor1,0xContributor2,0xContributor3]" \
  "[4000,3000,3000]" \
  "[\"development\",\"marketing\",\"operations\"]"
```

### 4. Verify Deployment

Verify the contract on a block explorer (if supported):

```bash
# If using Etherscan/Goerli verification
forge verify-contract \
  --chain-id 5 \
  --compiler-version 0.8.20 \
  --optimizer true \
  --rpc-url $GOERLI_RPC_URL \
  $HOOK_ADDRESS \
  scripts/verify.sol:Verify
```

---

## Mainnet Deployment

### WARNING

**Mainnet deployment is a production operation. Follow these steps carefully:**

1. **Security Review**: Have the contract audited by at least one third party
2. **Test Extensively**: Run full test suite on multiple testnets
3. **Use Multisig**: Deploy from a multisig wallet (recommended: Gnosis Safe)
4. **Gradual Rollout**: Start with small fees, monitor, then increase
5. **Emergency Plan**: Have emergency withdrawal procedure ready

### 1. Prepare Mainnet Configuration

```json
{
  "rpcUrl": "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
  "chainId": 1,
  "poolManagerAddress": "0x...",  // Mainnet Uniswap v4 PoolManager
  "sliceSplitterAddress": "0x...", // Slice mainnet splitter
  "initialFeeBasisPoints": 100,   // Start with 1% for testing
  "ownerAddress": "0x...",        // Multisig owner
  "contributors": [
    // ... contributor configuration
  ]
}
```

### 2. Deploy the Hook

```bash
# Deploy with carefully chosen parameters
forge script scripts/Deploy.s.sol:deploy \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --gas-limit 6000000 \
  --slow \
  --verify

# Track transaction hash for verification
```

### 3. Configure Contributors

```bash
# Add all contributors
forge script scripts/Deploy.s.sol:addContributors \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --gas-limit 1000000 \
  $HOOK_ADDRESS \
  "[...]" \
  "[...]" \
  "[...]"
```

### 4. Set Fee Percentage

```bash
# Start with conservative fee (1%)
forge script scripts/Deploy.s.sol:configure \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --sig "setFeePercentage(address,uint256)" \
  $HOOK_ADDRESS \
  100
```

### 5. Verify Contract on Etherscan

## Post-Deployment Steps

### 1. Monitor Fee Collection

```bash
# Check statistics regularly
forge script scripts/Deploy.s.sol:getStats \
  --rpc-url $NETWORK_RPC_URL \
  $HOOK_ADDRESS
```

### 2. Distribute Fees

Fees are automatically distributed to the Slice payment splitter. Contributors can withdraw from Slice according to their configured shares.

### 3. Maintain Configuration

As contributors change or fee percentages need adjustment:

- **Update contributor shares**: `updateContributorShare(address,uint256)`
- **Add new contributors**: `addContributors(...)`
- **Remove contributors**: `removeContributor(address)`
- **Change fee percentage**: `setFeePercentage(uint256)`

### 4. Emergency Procedures

In case of unexpected behavior:

1. **Withdraw remaining balance**: `emergencyWithdraw()` (owner only)
2. **Disable the hook**: Not implemented by default, but could be added if needed
3. **Contact support**: If needed, reach out to the development team

---

## Troubleshooting

### Common Issues

#### 1. "revert: Unauthorized" error

**Cause**: Not calling as owner or authorized address.

**Solution**: Ensure you're using the correct private key and the owner address matches.

#### 2. "Invalid Slice splitter address"

**Cause**: The Slice payment splitter address is incorrect or not deployed.

**Solution**: Deploy or obtain the correct Slice splitter address first.

#### 3. Insufficient gas

**Cause**: Gas limit is too low for complex operations.

**Solution**: Increase `--gas-limit` flag (recommended: 6M for testnet, 10M for mainnet).

#### 4. Revert on `addContributor`

**Cause**: Total shares would exceed 100% or contributor already exists.

**Solution**: Check current shares and contributor list before adding.

#### 5. No fees collected

**Cause**: Fee percentage is 0 or fee extraction not implemented.

**Solution**: Verify `feeBasisPoints` > 0 and that fee collection logic is properly connected to pool.

---

## Need Help?

- Open an issue in the repository
- Check the [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Review the [API.md](API.md) for contract interfaces
- Contact: titan@openclaw.org

---

*Last updated: March 13, 2026*
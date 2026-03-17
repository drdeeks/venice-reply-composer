/**
 * Revenue Share Hook API
 * 
 * Main entry point for the TypeScript APIs and utilities
 */

// Export types
export * from './types';

// Re-export contract types/interfaces if available
export { default as RevenueShareHook } from '../contracts/RevenueShareHook.sol';
export { default as ISlicePaymentSplitter } from '../contracts/interfaces/ISlicePaymentSplitter.sol';

// Import deployment functions (to be used with hardhat/ethers)
// Note: These are documented in the README and scripts

/**
 * Quick setup guide:
 * 
 * 1. Install dependencies:
 *    npm install
 * 
 * 2. Build contracts:
 *    npm run build
 *    or
 *    forge build
 * 
 * 3. Run tests:
 *    npm run test
 *    or
 *    forge test -vvv
 * 
 * 4. Deploy (see scripts/Deploy.s.sol):
 *    forge script scripts/Deploy.s.sol:deploy --rpc-url $RPC --private-key $KEY
 * 
 * 5. Check docs:
 *    - README.md for overview
 *    - docs/DEPLOYMENT.md for deployment steps
 *    - docs/ARCHITECTURE.md for system design
 *    - docs/API.md for API reference
 */

// Version
export const VERSION = '1.0.0';

// Default fee percentages in basis points
export const DEFAULT_FEE_BASIS_POINTS = 500; // 5%
export const MAX_FEE_BASIS_POINTS = 10000; // 100%
export const ONE_HUNDRED_PERCENT = 10000; // 100% in basis points
export const ONE_BASIS_POINT = 1;

// Network configurations (if connecting to Uniswap v4)
export const NETWORKS = {
  1: {
    name: 'mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    active: true,
  },
  5: {
    name: 'goerli',
    rpcUrl: 'https://goerli.infura.io/v3/',
    active: true,
  },
  137: {
    name: 'polygon',
    rpcUrl: 'https://polygon-rpc.com',
    active: false,
  },
} as const;

// Helper function to get network config
export function getNetworkConfig(chainId: number) {
  return NETWORKS[chainId as keyof typeof NETWORKS] || null;
}

// Validation helpers
export function validateFeePercentage(feeBasisPoints: number): boolean {
  return feeBasisPoints > 0 && feeBasisPoints <= MAX_FEE_BASIS_POINTS;
}

export function validateSharePercentage(shareBasisPoints: number): boolean {
  return shareBasisPoints > 0 && shareBasisPoints <= ONE_HUNDRED_PERCENT;
}

export function validateTotalShares(
  currentTotal: number,
  newShare: number,
  maxTotal: number = ONE_HUNDRED_PERCENT
): boolean {
  return currentTotal + newShare <= maxTotal;
}
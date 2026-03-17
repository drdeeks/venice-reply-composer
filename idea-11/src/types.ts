/**
 * TypeScript definitions for Uniswap v4 Hook Revenue Share project
 */

/**
 * Configuration for the Revenue Share Hook
 */
export interface HookConfig {
  /** Fee percentage in basis points (e.g., 500 = 5%) */
  feeBasisPoints: number;
  /** Slice payment splitter contract address */
  sliceSplitterAddress: string;
  /** Owner address (must have admin privileges) */
  ownerAddress: string;
}

/**
 * Contributor configuration
 */
export interface ContributorConfig {
  /** Contributor wallet address */
  address: string;
  /** Share percentage in basis points */
  shareBasisPoints: number;
  /** Category for categorization (e.g., "development", "marketing") */
  category: string;
}

/**
 * Statistics from the hook contract
 */
export interface HookStats {
  /** Total collected fees in wei */
  collectedFees: bigint;
  /** Total distributed fees in wei */
  distributedFees: bigint;
  /** Current fee percentage in basis points */
  feePercentage: number;
  /** Number of contributors configured */
  contributorCount: number;
}

/**
 * Contributor information from the hook
 */
export interface ContributorInfo {
  /** Contributor address */
  account: string;
  /** Share percentage in basis points */
  shareBasisPoints: number;
  /** Accumulated fees received in wei */
  accumulatedFees: bigint;
  /** Whether contributor is active */
  isActive: boolean;
}

/**
 * Deployment options for the script
 */
export interface DeploymentOptions {
  /** RPC URL for target network */
  rpcUrl: string;
  /** Private key for deployment (should be funded) */
  privateKey: string;
  /** Chain ID (e.g., 1 for mainnet, 5 for goerli, 137 for polygon) */
  chainId: number;
}

/**
 * Deploy result
 */
export interface DeployResult {
  /** Address of deployed hook contract */
  hookAddress: string;
  /** Transaction hash of deployment */
  txHash: string;
  /** Gas used for deployment */
  gasUsed: number;
}

/**
 * Integration test results
 */
export interface TestResult {
  testName: string;
  passed: boolean;
  gasUsed?: number;
  error?: string;
  duration: number;
}

/**
 * Network configuration for supported chains
 */
export interface NetworkConfig {
  /** Chain ID */
  chainId: number;
  /** Network name */
  name: string;
  /** RPC URL (can be overridden) */
  rpcUrl: string;
  /** Uniswap v4 PoolManager address */
  poolManagerAddress: string;
  /** Supported for deployment */
  isActive: boolean;
}

/**
 * Default network configurations
 */
export const NETWORKS: NetworkConfig[] = [
  {
    chainId: 1,
    name: "mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/",
    poolManagerAddress: "0x...", // Mainnet address
    isActive: true,
  },
  {
    chainId: 5,
    name: "goerli",
    rpcUrl: "https://goerli.infura.io/v3/",
    poolManagerAddress: "0x...", // Goerli test address
    isActive: true,
  },
  {
    chainId: 137,
    name: "polygon",
    rpcUrl: "https://polygon-rpc.com",
    poolManagerAddress: "0x...", // Polygon address
    isActive: false,
  },
];
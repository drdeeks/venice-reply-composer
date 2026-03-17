export interface EmailRecipient {
  email: string;
  name?: string;
  amount: number; // in native token units (e.g., cUSD)
  currency: string; // e.g., 'cUSD'
}

export interface YieldHarvest {
  id: string;
  timestamp: Date;
  amountEth: number; // raw yield amount in ETH
  stethAmount: string; // hex string of stETH amount
  status: 'pending' | 'bridging' | 'completed' | 'failed';
  txHash?: string;
  bridgeTxHash?: string;
  error?: string;
}

export interface BridgeTransaction {
  id: string;
  harvestId: string;
  amount: number;
  fromChain: 'ethereum';
  toChain: 'celo';
  token: string; // token address
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  destinationAddress: string; // Ampersend or Celo address
  confirmations: number;
  error?: string;
}

export interface EmailDisbursement {
  id: string;
  harvestId: string;
  bridgeTxId: string;
  recipient: EmailRecipient;
  amount: number;
  emailTemplateId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  emailId?: string;
  error?: string;
  sentAt?: Date;
  claimUrl?: string;
}

export interface StakingPosition {
  address: string;
  stethBalance: bigint;
  rawYield: bigint; // withdrawals in queue
  lastUpdated: Date;
  totalStaked: bigint;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  ethereumConnected: boolean;
  celoConnected: boolean;
  ampersendConnected: boolean;
  lastHarvestAt?: Date;
  pendingHarvests: number;
  pendingBridges: number;
  pendingEmails: number;
  uptime: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

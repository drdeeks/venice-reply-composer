import * as dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { extend } from 'date-fns';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  logLevel: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';
  ethereum: {
    rpcUrl: string;
    privateKey: string;
    stakingWalletAddress: string;
    stethAddress: string;
    withdrawalQueueAddress: string;
  };
  celo: {
    rpcUrl: string;
    bridgeContractAddress: string;
    nativeToken: string;
    targetStablecoin: string;
  };
  ampersend: {
    apiKey: string;
    apiUrl: string;
    senderEmail: string;
    webhookSecret: string;
  };
  scheduler: {
    yieldHarvestIntervalHours: number;
    bridgeConfirmationsBlocks: number;
    minimumYieldBridgeAmountEth: number;
  };
  alerts: {
    alertEmail: string;
    webhookUrl: string;
  };
}

function loadConfig(): AppConfig {
  const rpcUrl = process.env.ETHEREUM_RPC_URL;
  if (!rpcUrl) {
    throw new Error('ETHEREUM_RPC_URL is required');
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY is required');
  }

  const stakingWallet = process.env.STAKING_WALLET_ADDRESS;
  if (!stakingWallet) {
    throw new Error('STAKING_WALLET_ADDRESS is required');
  }

  const stethAddress = process.env.LIDO_STETH_ADDRESS || '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';
  const withdrawalQueueAddress = process.env.LIDO_WITHDRAWAL_QUEUE_ADDRESS || '0x0C0F8B3b4a8dcB15392a026FcBFd4B3739284b18';

  const celoRpcUrl = process.env.CELO_RPC_URL;
  if (!celoRpcUrl) {
    throw new Error('CELO_RPC_URL is required');
  }

  const celoBridgeAddress = process.env.CELO_BRIDGE_CONTRACT_ADDRESS;
  if (!celoBridgeAddress) {
    throw new Error('CELO_BRIDGE_CONTRACT_ADDRESS is required');
  }

  const ampersendApiKey = process.env.AMPERSEND_API_KEY;
  if (!ampersendApiKey) {
    throw new Error('AMPERSEND_API_KEY is required');
  }

  const ampersendApiUrl = process.env.AMPERSEND_API_URL || 'https://api.ampersend.io/v1';
  const ampersendSenderEmail = process.env.AMPERSEND_SENDER_EMAIL;
  if (!ampersendSenderEmail) {
    throw new Error('AMPERSEND_SENDER_EMAIL is required');
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  const nodeEnv = (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development';
  const logLevel = (process.env.LOG_LEVEL as any) || 'info';

  const yieldHarvestIntervalHours = parseInt(process.env.YIELD_HARVEST_INTERVAL_HOURS || '24', 10);
  const bridgeConfirmationsBlocks = parseInt(process.env.BRIDGE_CONFIRMATIONS_BLOCKS || '12', 10);
  const minimumYieldBridgeAmountEth = parseFloat(process.env.MINIMUM_YIELD_BRIDGE_AMOUNT_ETH || '0.01');

  return {
    port,
    nodeEnv,
    logLevel,
    ethereum: {
      rpcUrl,
      privateKey,
      stakingWalletAddress: stakingWallet,
      stethAddress,
      withdrawalQueueAddress,
    },
    celo: {
      rpcUrl: celoRpcUrl,
      bridgeContractAddress: celoBridgeAddress,
      nativeToken: process.env.CELO_NATIVE_TOKEN || 'CELO',
      targetStablecoin: process.env.TARGET_STABLECOIN_ON_CELO || 'cUSD',
    },
    ampersend: {
      apiKey: ampersendApiKey,
      apiUrl: ampersendApiUrl,
      senderEmail: ampersendSenderEmail,
      webhookSecret: process.env.AMPERSEND_WEBHOOK_SECRET || '',
    },
    scheduler: {
      yieldHarvestIntervalHours,
      bridgeConfirmationsBlocks,
      minimumYieldBridgeAmountEth,
    },
    alerts: {
      alertEmail: process.env.ALERT_EMAIL || '',
      webhookUrl: process.env.WEBHOOK_URL || '',
    },
  };
}

export const config: AppConfig = loadConfig();

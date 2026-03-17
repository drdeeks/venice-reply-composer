import * as dotenv from 'dotenv';
import { SystemConfig } from './types';

dotenv.config();

export function loadConfig(): SystemConfig {
  const required = [
    'ENS_REGISTRY_ADDRESS',
    'ENS_RESOLVER_ADDRESS',
    'VERIFIED_BUILDERS_DOMAIN',
    'MERIT_CONTRACT_ADDRESS',
    'CHAIN_ID',
    'RPC_URL'
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  const config: SystemConfig = {
    ensRegistryAddress: process.env.ENS_REGISTRY_ADDRESS!,
    ensPublicResolverAddress: process.env.ENS_RESOLVER_ADDRESS!,
    verifiedBuildersDomain: process.env.VERIFIED_BUILDERS_DOMAIN!,
    meritApiBaseUrl: process.env.MERIT_API_BASE_URL || 'https://api.merits.xyz',
    meritApiKey: process.env.MERIT_API_KEY,
    meritContractAddress: process.env.MERIT_CONTRACT_ADDRESS!,
    talentApiBaseUrl: process.env.TALENT_API_BASE_URL || 'https://api.talentprotocol.com',
    talentApiKey: process.env.TALENT_API_KEY,
    chainId: parseInt(process.env.CHAIN_ID!, 10),
    rpcUrl: process.env.RPC_URL!,
    privateKey: process.env.PRIVATE_KEY,
    minTalentScore: parseInt(process.env.MIN_TALENT_SCORE || '50', 10),
    requiredMeritAttestations: parseInt(process.env.REQUIRED_MERIT_ATTESTATIONS || '1', 10)
  };

  return config;
}
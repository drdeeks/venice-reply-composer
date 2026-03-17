export interface Config {
  // Server
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];

  // Database
  databaseUrl: string;
  dbSsl: boolean;

  // Celo
  celoProviderUrl: string;
  celoNetwork: 'alfajores' | 'mainnet';
  celoPrivateKey: string;
  celoContractAddress: string;
  celoStablecoinAddress: string;

  // Self Protocol
  selfApiKey: string;
  selfAppId: string;
  selfAppSecret: string;

  // Email (Ampersend)
  ampersendApiKey: string;
  ampersendFromEmail: string;
  ampersendReplyTo: string;
  emailProvider: 'ampersend' | 'sendgrid' | 'mailgun';
  emailApiKey?: string;

  // App Settings
  sessionSecret: string;
  verificationTokenExpiry: number;
  transactionTimeout: number;
  maxVerificationAttempts: number;

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFormat: 'json' | 'pretty';

  // Feature Flags
  enableSelfVerification: boolean;
  enableEmailNotifications: boolean;
  enableWebhooks: boolean;
}

function validateConfig(): Record<string, string | number | boolean | string[]> {
  const required = [
    'PORT',
    'DATABASE_URL',
    'CELO_PROVIDER_URL',
    'CELO_PRIVATE_KEY',
    'SELF_API_KEY',
    'AMPERSEND_API_KEY',
    'AMPERSEND_FROM_EMAIL',
    'SESSION_SECRET'
  ];

  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    databaseUrl: process.env.DATABASE_URL!,
    dbSsl: process.env.DB_SSL === 'true',
    celoProviderUrl: process.env.CELO_PROVIDER_URL!,
    celoNetwork: (process.env.CELO_NETWORK as any) || 'alfajores',
    celoPrivateKey: process.env.CELO_PRIVATE_KEY!,
    celoContractAddress: process.env.CELO_CONTRACT_ADDRESS || '',
    celoStablecoinAddress: process.env.CELO_STABLECOIN_ADDRESS || '',
    selfApiKey: process.env.SELF_API_KEY!,
    selfAppId: process.env.SELF_APP_ID || '',
    selfAppSecret: process.env.SELF_APP_SECRET || '',
    ampersendApiKey: process.env.AMPERSEND_API_KEY!,
    ampersendFromEmail: process.env.AMPERSEND_FROM_EMAIL!,
    ampersendReplyTo: process.env.AMPERSEND_REPLY_TO || process.env.AMPERSEND_FROM_EMAIL!,
    emailProvider: (process.env.EMAIL_PROVIDER as any) || 'ampersend',
    emailApiKey: process.env.SENDGRID_API_KEY || process.env.MAILGUN_API_KEY,
    sessionSecret: process.env.SESSION_SECRET!,
    verificationTokenExpiry: parseInt(process.env.VERIFICATION_TOKEN_EXPIRY || '86400000', 10),
    transactionTimeout: parseInt(process.env.TRANSACTION_TIMEOUT || '7200000', 10),
    maxVerificationAttempts: parseInt(process.env.MAX_VERIFICATION_ATTEMPTS || '3', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    logFormat: (process.env.LOG_FORMAT as any) || 'json',
    enableSelfVerification: process.env.ENABLE_SELF_VERIFICATION !== 'false',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
    enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
  };
}

export const config: Config = validateConfig() as Config;
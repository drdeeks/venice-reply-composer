// Main exports
export { loadConfig } from './config';
export { TalentProtocolClient } from './talent-protocol';
export { MeritSystemsClient } from './merit-systems';
export { ENSManager } from './ens-manager';
export { CredentialIssuer } from './credential-issuer';
export { EXAMPLE_CREDENTIALS, EXAMPLE_TALENT_PROFILES, EXAMPLE_MERIT_ATTESTATIONS, EXAMPLE_VERIFICATION_RESULTS } from './examples';

export * from './types';

// Re-export commonly used types
export type { 
  BuilderCredential, 
  CredentialProof, 
  IssuanceRequest, 
  VerificationResult,
  SystemConfig,
  TalentProfile,
  TalentAchievement,
  MeritAttestation
} from './types';

export type { 
  ENSSubdomainInfo 
} from './ens-manager';
export interface BuilderCredential {
  address: string;
  ensSubdomain: string;
  fullEnsName: string;
  meritAttestations: MeritAttestation[];
  talentScore?: number;
  talentProfileId?: string;
  proof: CredentialProof;
  issuedAt: number;
  expiresAt?: number;
  revoked: boolean;
}

export interface MeritAttestation {
  id: string;
  issuer: string;
  recipient: string;
  data: Record<string, any>;
  signature: string;
  issuedAt: number;
  revoked: boolean;
}

// API response shape (raw from Merit Systems API)
export type MeritAttestationResponse = MeritAttestation;

export interface TalentProfileResponse {
  id: string;
  address: string;
  score: number;
  rank: number;
  skills: string[];
  achievements: TalentAchievement[];
}

export interface TalentProfile extends TalentProfileResponse {}

export interface TalentAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: number;
  proof: string;
}

export interface CredentialProof {
  signature: string;
  issuer: string;
  domainSeparator: string;
  digest: string;
}

export interface IssuanceRequest {
  builderAddress: string;
  meritAttestationIds?: string[];
  includeTalentScore: boolean;
  expiry?: number;
}

export interface VerificationResult {
  valid: boolean;
  builderAddress: string;
  ensName: string;
  meritCount: number;
  talentScore?: number;
  errors?: string[];
}

export interface SystemConfig {
  ensRegistryAddress: string;
  ensPublicResolverAddress: string;
  verifiedBuildersDomain: string;
  meritApiBaseUrl: string;
  meritApiKey?: string;
  meritContractAddress: string;
  talentApiBaseUrl: string;
  talentApiKey?: string;
  chainId: number;
  rpcUrl: string;
  privateKey?: string;
  minTalentScore: number;
  requiredMeritAttestations: number;
}
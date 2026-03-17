import { BuilderCredential, CredentialProof, IssuanceRequest, VerificationResult } from './types';
import { TalentProfile, TalentAchievement } from './types';
import { MeritAttestation } from './types';

/**
 * Example credentials for testing
 */
export const EXAMPLE_CREDENTIALS = {
  /**
   * Alice - Strong talent score, no merit attestations
   */
  alice: {
    address: '0x1234567890123456789012345678901234567890',
    ensSubdomain: 'alice',
    fullEnsName: 'alice.verified-builders.eth',
    meritAttestations: [],
    talentScore: 95,
    proof: {
      signature: '0xabc123...',
      issuer: 'verified-builders.eth',
      domainSeparator: '0xdef456...',
      digest: '0xghi789...'
    } as CredentialProof,
    issuedAt: Date.now() - 86400000, // 1 day ago
    revoked: false
  } as BuilderCredential,

  /**
   * Bob - High talent score, multiple merit attestations
   */
  bob: {
    address: '0x9876543210987654321098765432109876543210',
    ensSubdomain: 'bob',
    fullEnsName: 'bob.verified-builders.eth',
    meritAttestations: [
      {
        id: 'merit-123',
        issuer: '0xMeritIssuer',
        recipient: '0x9876543210987654321098765432109876543210',
        data: { type: 'smart-contract', level: 'advanced', projects: 5 },
        signature: '0xMeritSig1',
        issuedAt: Date.now() - 172800000, // 2 days ago
        revoked: false
      },
      {
        id: 'merit-456',
        issuer: '0xMeritIssuer',
        recipient: '0x9876543210987654321098765432109876543210',
        data: { type: 'dapp', level: 'intermediate', users: 1000 },
        signature: '0xMeritSig2',
        issuedAt: Date.now() - 259200000, // 3 days ago
        revoked: false
      }
    ],
    talentScore: 88,
    proof: {
      signature: '0xdef456...',
      issuer: 'verified-builders.eth',
      domainSeparator: '0xabc123...',
      digest: '0xghi789...'
    } as CredentialProof,
    issuedAt: Date.now() - 345600000, // 4 days ago
    revoked: false
  } as BuilderCredential,

  /**
   * Charlie - Low talent score, revoked credential
   */
  charlie: {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    ensSubdomain: 'charlie',
    fullEnsName: 'charlie.verified-builders.eth',
    meritAttestations: [
      {
        id: 'merit-789',
        issuer: '0xMeritIssuer',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        data: { type: 'smart-contract', level: 'beginner', projects: 1 },
        signature: '0xMeritSig3',
        issuedAt: Date.now() - 604800000, // 1 week ago
        revoked: false
      }
    ],
    talentScore: 25, // Below threshold
    proof: {
      signature: '0xghi789...',
      issuer: 'verified-builders.eth',
      domainSeparator: '0xdef456...',
      digest: '0xabc123...'
    } as CredentialProof,
    issuedAt: Date.now() - 691200000, // 8 days ago
    revoked: true
  } as BuilderCredential,

  /**
   * Dana - Expired credential
   */
  dana: {
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    ensSubdomain: 'dana',
    fullEnsName: 'dana.verified-builders.eth',
    meritAttestations: [
      {
        id: 'merit-101',
        issuer: '0xMeritIssuer',
        recipient: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        data: { type: 'smart-contract', level: 'advanced', projects: 3 },
        signature: '0xMeritSig4',
        issuedAt: Date.now() - 1209600000, // 2 weeks ago
        revoked: false
      }
    ],
    talentScore: 75,
    proof: {
      signature: '0x123456...',
      issuer: 'verified-builders.eth',
      domainSeparator: '0x789abc...',
      digest: '0xdefghi...'
    } as CredentialProof,
    issuedAt: Date.now() - 1209600000, // 2 weeks ago
    expiresAt: Date.now() - 86400000, // Expired 1 day ago
    revoked: false
  } as BuilderCredential
};

/**
 * Example Talent Protocol profiles
 */
export const EXAMPLE_TALENT_PROFILES = {
  alice: {
    id: 'alice-id',
    address: '0x1234567890123456789012345678901234567890',
    score: 95,
    rank: 1,
    skills: ['solidity', 'smart-contracts', 'web3'],
    achievements: [
      {
        id: 'alice-achievement-1',
        type: 'hackathon-win',
        title: 'ETHGlobal Hackathon Winner',
        description: 'Won first place at ETHGlobal Hackathon',
        timestamp: Date.now() - 2592000000,
        proof: 'https://hack.ethglobal.com/alice-win'
      }
    ]
  } as TalentProfile,

  bob: {
    id: 'bob-id',
    address: '0x9876543210987654321098765432109876543210',
    score: 88,
    rank: 5,
    skills: ['react', 'dapp', 'smart-contracts'],
    achievements: [
      {
        id: 'bob-achievement-1',
        type: 'dapp-launch',
        title: 'Launched DeFi Dapp',
        description: 'Launched a DeFi application with 1000+ users',
        timestamp: Date.now() - 7776000000,
        proof: 'https://dapp.bob.io'
      }
    ]
  } as TalentProfile,

  charlie: {
    id: 'charlie-id',
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    score: 25,
    rank: 1000,
    skills: ['solidity', 'smart-contracts'],
    achievements: [
      {
        id: 'charlie-achievement-1',
        type: 'first-project',
        title: 'Completed First Smart Contract',
        description: 'Completed first smart contract project',
        timestamp: Date.now() - 31536000000, // 1 year ago
        proof: 'https://github.com/charlie/first-contract'
      }
    ]
  } as TalentProfile,

  dana: {
    id: 'dana-id',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    score: 75,
    rank: 25,
    skills: ['smart-contracts', 'security', 'audit'],
    achievements: [
      {
        id: 'dana-achievement-1',
        type: 'security-audit',
        title: 'Security Audit Completed',
        description: 'Completed security audit for DeFi protocol',
        timestamp: Date.now() - 15552000000, // 6 months ago
        proof: 'https://audit.dana.io'
      }
    ]
  } as TalentProfile
};

/**
 * Example Merit attestations
 */
export const EXAMPLE_MERIT_ATTESTATIONS = {
  smartContractAdvanced: {
    id: 'merit-sc-advanced',
    issuer: '0xMeritIssuer',
    recipient: '0x1234567890123456789012345678901234567890',
    data: { type: 'smart-contract', level: 'advanced', projects: 5 },
    signature: '0xMeritSig1',
    issuedAt: Date.now() - 172800000,
    revoked: false
  } as MeritAttestation,

  dappIntermediate: {
    id: 'merit-dapp-intermediate',
    issuer: '0xMeritIssuer',
    recipient: '0x9876543210987654321098765432109876543210',
    data: { type: 'dapp', level: 'intermediate', users: 1000 },
    signature: '0xMeritSig2',
    issuedAt: Date.now() - 259200000,
    revoked: false
  } as MeritAttestation,

  beginnerSmartContract: {
    id: 'merit-sc-beginner',
    issuer: '0xMeritIssuer',
    recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    data: { type: 'smart-contract', level: 'beginner', projects: 1 },
    signature: '0xMeritSig3',
    issuedAt: Date.now() - 604800000,
    revoked: false
  } as MeritAttestation,

  securityAudit: {
    id: 'merit-audit',
    issuer: '0xMeritIssuer',
    recipient: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    data: { type: 'security-audit', level: 'expert', protocols: 3 },
    signature: '0xMeritSig4',
    issuedAt: Date.now() - 1209600000,
    revoked: false
  } as MeritAttestation
};

/**
 * Example verification results
 */
export const EXAMPLE_VERIFICATION_RESULTS = {
  aliceValid: {
    valid: true,
    builderAddress: '0x1234567890123456789012345678901234567890',
    ensName: 'alice.verified-builders.eth',
    meritCount: 0,
    talentScore: 95,
    errors: undefined
  } as VerificationResult,

  bobValid: {
    valid: true,
    builderAddress: '0x9876543210987654321098765432109876543210',
    ensName: 'bob.verified-builders.eth',
    meritCount: 2,
    talentScore: 88,
    errors: undefined
  } as VerificationResult,

  charlieInvalid: {
    valid: false,
    builderAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    ensName: 'charlie.verified-builders.eth',
    meritCount: 1,
    talentScore: 25,
    errors: [
      'Talent score below threshold (25 < 50)',
      'Credential has been revoked'
    ]
  } as VerificationResult,

  danaInvalid: {
    valid: false,
    builderAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    ensName: 'dana.verified-builders.eth',
    meritCount: 1,
    talentScore: 75,
    errors: ['Credential has expired']
  } as VerificationResult
};
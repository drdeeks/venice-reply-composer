import { ethers } from 'ethers';
import { BuilderCredential, CredentialProof, IssuanceRequest, VerificationResult } from './types';
import { SystemConfig } from './config';

export class CredentialIssuer {
  private readonly config: SystemConfig;
  private readonly provider: ethers.providers.Provider;
  private readonly signer?: ethers.Signer;

  constructor(config: SystemConfig, provider?: ethers.providers.Provider, signer?: ethers.Signer) {
    this.config = config;
    this.provider = provider || new ethers.providers.JsonRpcProvider(config.rpcUrl, config.chainId);
    this.signer = signer;
  }

  /**
   * Generate a cryptographic proof for a credential
   */
  private async generateProof(
    credentialData: Omit<BuilderCredential, 'proof' | 'issuedAt'>,
    issuer: string
  ): Promise<CredentialProof> {
    const dataToSign = JSON.stringify({
      address: credentialData.address,
      ensSubdomain: credentialData.ensSubdomain,
      meritAttestations: credentialData.meritAttestations.map(a => a.id),
      talentScore: credentialData.talentScore,
      issuedAt: Date.now(),
      expiresAt: credentialData.expiresAt
    });

    const domainSeparator = ethers.utils.hashMessage(
      `EIP712Domain:${this.config.chainId}:${this.config.verifiedBuildersDomain}`
    );

    const digest = ethers.utils.keccak256(domainSeparator + dataToSign);

    let signature: string;
    if (this.signer) {
      signature = await this.signer.signMessage(digest);
    } else {
      // Sign with issuer's address
      const tempSigner = new ethers.Wallet(this.config.privateKey!, this.provider);
      signature = await tempSigner.signMessage(digest);
    }

    return {
      signature,
      issuer,
      domainSeparator: domainSeparator,
      digest
    };
  }

  /**
   * Verify a credential's cryptographic proof
   */
  async verifyProof(credential: BuilderCredential): Promise<boolean> {
    try {
      const dataToVerify = JSON.stringify({
        address: credential.address,
        ensSubdomain: credential.ensSubdomain,
        meritAttestations: credential.meritAttestations.map(a => a.id),
        talentScore: credential.talentScore,
        issuedAt: credential.issuedAt,
        expiresAt: credential.expiresAt
      });

      const domainSeparator = ethers.utils.hashMessage(
        `EIP712Domain:${this.config.chainId}:${this.config.verifiedBuildersDomain}`
      );

      const expectedDigest = ethers.utils.keccak256(domainSeparator + dataToVerify);
      const recoveredAddress = ethers.utils.recoverAddress(
        expectedDigest,
        credential.proof.signature
      );

      return recoveredAddress.toLowerCase() === credential.proof.issuer.toLowerCase() &&
             expectedDigest === credential.proof.digest;
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }

  /**
   * Create a new builder credential
   */
  async createCredential(
    request: IssuanceRequest,
    talentScore?: number,
    meritAttestations?: MeritAttestation[]
  ): Promise<BuilderCredential> {
    const now = Date.now();

    // Basic validation
    if (!request.builderAddress || !ethers.utils.isAddress(request.builderAddress)) {
      throw new Error('Invalid builder address');
    }

    // Generate ENS subdomain
    const subdomain = this.generateSubdomain(request.builderAddress);
    const fullEnsName = `${subdomain}.${this.config.verifiedBuildersDomain}`;

    // Create credential
    const credential: BuilderCredential = {
      address: request.builderAddress,
      ensSubdomain: subdomain,
      fullEnsName,
      meritAttestations: meritAttestations || [],
      talentScore: talentScore,
      proof: await this.generateProof({
        address: request.builderAddress,
        ensSubdomain: subdomain,
        meritAttestations: meritAttestations || [],
        talentScore: talentScore
      }, this.config.verifiedBuildersDomain),
      issuedAt: now,
      revoked: false
    };

    // Set expiry if requested
    if (request.expiry) {
      credential.expiresAt = request.expiry;
    }

    return credential;
  }

  /**
   * Generate a subdomain from an address
   */
  private generateSubdomain(address: string): string {
    // Use the last 8 characters of the address (40 bits)
    const last8 = address.slice(-8);
    // Convert to a readable format (base32)
    const readable = ethers.utils.hexZeroPad(last8, 20)
      .toHexString()
      .slice(2)
      .replace(/[^a-z0-9]/g, '');
    return `builder-${readable.slice(0, 10)}`;
  }

  /**
   * Verify a credential's validity
   */
  async verifyCredential(credential: BuilderCredential): Promise<VerificationResult> {
    const errors: string[] = [];

    // Check proof
    const proofValid = await this.verifyProof(credential);
    if (!proofValid) {
      errors.push('Invalid cryptographic proof');
    }

    // Check expiry
    if (credential.expiresAt && credential.expiresAt < Date.now()) {
      errors.push('Credential has expired');
    }

    // Check revocation
    if (credential.revoked) {
      errors.push('Credential has been revoked');
    }

    // Check talent score threshold
    if (credential.talentScore !== undefined && credential.talentScore < this.config.minTalentScore) {
      errors.push(`Talent score below threshold (${credential.talentScore} < ${this.config.minTalentScore})`);
    }

    // Check merit attestation count
    if (credential.meritAttestations.length < this.config.requiredMeritAttestations) {
      errors.push(`Insufficient merit attestations (${credential.meritAttestations.length} < ${this.config.requiredMeritAttestations})`);
    }

    // Verify merit attestations
    for (const attestation of credential.meritAttestations) {
      try {
        const client = new MeritSystemsClient(
          this.config.meritApiBaseUrl,
          this.config.meritContractAddress,
          this.config.meritApiKey
        );
        const result = await client.verifyAttestation(attestation.id);
        if (!result.valid) {
          errors.push(`Invalid merit attestation: ${attestation.id}`);
        }
      } catch (error) {
        errors.push(`Error verifying merit attestation: ${attestation.id}`);
      }
    }

    return {
      valid: errors.length === 0,
      builderAddress: credential.address,
      ensName: credential.fullEnsName,
      meritCount: credential.meritAttestations.length,
      talentScore: credential.talentScore,
      errors
    };
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credential: BuilderCredential): Promise<boolean> {
    if (!this.signer) {
      throw new Error('Signer required to revoke credentials');
    }

    // Update the credential
    credential.revoked = true;
    
    // Re-sign with revocation flag
    credential.proof = await this.generateProof({
      ...credential,
      revoked: true
    }, this.config.verifiedBuildersDomain);

    return true;
  }

  /**
   * Update a credential (e.g., add new attestations)
   */
  async updateCredential(
    credential: BuilderCredential,
    newAttestations?: MeritAttestation[]
  ): Promise<BuilderCredential> {
    if (!this.signer) {
      throw new Error('Signer required to update credentials');
    }

    const updatedAttestations = newAttestations 
      ? [...credential.meritAttestations, ...newAttestations] 
      : credential.meritAttestations;

    // Re-create credential with updated attestations
    return this.createCredential(
      {
        builderAddress: credential.address,
        meritAttestationIds: updatedAttestations.map(a => a.id),
        includeTalentScore: credential.talentScore !== undefined,
        expiry: credential.expiresAt
      },
      credential.talentScore,
      updatedAttestations
    );
  }
}
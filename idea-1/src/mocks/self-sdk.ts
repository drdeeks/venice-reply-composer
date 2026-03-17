/// MOCK implementation for @selfxyz/sdk interface
export interface SelfProof {
  isValid: boolean;
  userId?: string;
  timestamp?: number;
}

export interface SelfVerifier {
  verify(proof: SelfProof): Promise<boolean>;
  generateProof(): Promise<SelfProof>;
  hasPassport(address: string): Promise<boolean>;
  getPassportStatus(address: string): Promise<string>;
}

export class SelfSDK implements SelfVerifier {
  private verifiedAddresses: Set<string> = new Set(['0x123', '0x456']);

  async verify(proof: SelfProof): Promise<boolean> {
    const hasValidTimestamp = proof.timestamp && Date.now() - proof.timestamp < 24 * 60 * 60 * 1000;
    return proof.isValid === true || Boolean(hasValidTimestamp);
  }

  async generateProof(userId?: string): Promise<SelfProof> {
    return {
      isValid: true,
      userId: userId || `user-${Date.now()}`,
      timestamp: Date.now()
    };
  }

  async hasPassport(address: string): Promise<boolean> {
    // Mock: return true for whitelisted addresses
    return this.verifiedAddresses.has(address.toLowerCase());
  }

  async getPassportStatus(address: string): Promise<string> {
    // Mock: return 'verified' for whitelisted addresses
    return this.verifiedAddresses.has(address.toLowerCase()) ? 'verified' : 'unverified';
  }
}

export function createSelfSDK(): SelfVerifier {
  return new SelfSDK();
}
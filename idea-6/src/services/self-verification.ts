// Import SDKs with fallback to mocks
let SelfSDK: any;

try {
  // Try to import real Self SDK first
  SelfSDK = require('@selfxyz/sdk').default;
} catch (error) {
  // Fall back to mock if real SDK not available
  console.warn('⚠️  Real Self SDK not available, falling back to mock implementation');
  
  // Define mock class with same interface
  class MockSelfSDK {
    private readonly baseUrl: string;

    constructor(options: { appId?: string; appSecret?: string; endpoint?: string }) {
      this.baseUrl = options.endpoint || 'https://mock.self.xyz';
    }

    async createVerificationRequest(options: {
      email: string;
      callbackUrl?: string;
      attributes?: string[];
    }): Promise<{
      verificationUrl: string;
      qrCode: string;
      id: string;
    }> {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          verificationUrl: `https://mock.self.xyz/verify/${Date.now()}`,
          qrCode: 'mock-qr-code-base64',
          id: `mock-verification-${Date.now()}`
        };
      } catch (error) {
        console.error('Mock verification request failed:', error);
        throw new Error('Mock verification request failed');
      }
    }

    async getVerificationStatus(verificationId: string): Promise<{
      verified: boolean;
      attributes?: any;
    }> {
      try {
        // Simulate status check
        return {
          verified: Math.random() > 0.5, // 50% chance of success
          attributes: {
            email: 'mock@example.com',
            name: 'Mock User',
            verified: true
          }
        };
      } catch (error) {
        console.error('Mock verification status check failed:', error);
        return { verified: false };
      }
    }

    async getAppInfo(): Promise<{
      supportedAttributes: string[];
      appId: string;
      appSecret: string;
      endpoint: string;
    }> {
      try {
        return {
          supportedAttributes: ['email', 'phone', 'id', 'address', 'birthdate'],
          appId: 'mock-app',
          appSecret: 'mock-secret',
          endpoint: 'https://mock.self.xyz'
        };
      } catch (error) {
        console.error('Mock app info fetch failed:', error);
        return {
          supportedAttributes: [],
          appId: '',
          appSecret: '',
          endpoint: ''
        };
      }
    }
  }

  SelfSDK = MockSelfSDK;
}

export class SelfVerificationService {
  private selfSDK: any;

  constructor() {
    this.selfSDK = new SelfSDK({
      appId: 'dev-app',
      appSecret: 'dev-secret',
      endpoint: 'https://mock.self.xyz',
    });
  }

  async generateVerificationRequest(
    email: string,
    callbackUrl?: string,
    attributes?: string[],
  ): Promise<{ success: boolean; verificationUrl?: string; qrCode?: string; verificationId?: string }> {
    try {
      // Create a Self verification request
      const request = await this.selfSDK.createVerificationRequest({
        email,
        callbackUrl: callbackUrl || `http://localhost:3000/api/verifications/callback`,
        attributes: attributes || ['email', 'phone', 'id'], // Default attributes
        // Additional options:
        // - requireProofOfPersonhood
        // - requireLivenessDetection
        // - customAttributes
      });

      return {
        success: true,
        verificationUrl: request.verificationUrl,
        qrCode: request.qrCode,
        verificationId: request.id,
      };
    } catch (error) {
      console.error('Self verification request failed:', error);
      throw new Error(`Failed to generate Self verification request: ${error.message}`);
    }
  }

  async verifySelfProof(verificationId: string): Promise<{ verified: boolean; attributes?: any }> {
    try {
      // Check verification status via Self API
      const status = await this.selfSDK.getVerificationStatus(verificationId);

      if (!status.verified) {
        return { verified: false };
      }

      return {
        verified: true,
        attributes: status.attributes,
      };
    } catch (error) {
      console.error('Self verification status check failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Verification not found');
      }
      throw new Error(`Self verification check failed: ${error.message}`);
    }
  }

  async parseVerificationCallback(
    payload: any,
  ): Promise<{ verified: boolean; verificationId: string; attributes: any }> {
    try {
      const { id, verified, attributes } = payload;

      if (!id) {
        throw new Error('Missing verification ID');
      }

      return {
        verified: !!verified,
        verificationId: id,
        attributes,
      };
    } catch (error) {
      console.error('Self verification callback parsing failed:', error);
      throw new Error(`Failed to parse callback: ${error.message}`);
    }
  }

  async getSupportedAttributes(): Promise<string[]> {
    try {
      const info = await this.selfSDK.getAppInfo();
      return info.supportedAttributes || [];
    } catch (error) {
      console.error('Self supported attributes fetch failed:', error);
      throw new Error(`Failed to get supported attributes: ${error.message}`);
    }
  }
}

export const selfVerificationService = new SelfVerificationService();
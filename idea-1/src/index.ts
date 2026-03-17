import { BankrSkill, SkillContext } from './mocks/bankr-sdk';

// Import SDKs with fallback to mocks
let SelfSDK: any;
try {
  // Try to import real SDK first
  SelfSDK = require('@selfxyz/sdk').default;
} catch (error) {
  // Fall back to mock if real SDK not available
  console.warn('Real Self SDK not available, using mock implementation');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockSelf = require('./mocks/self-sdk');
  SelfSDK = mockSelf.createSelfSDK ? mockSelf.createSelfSDK : () => new mockSelf.SelfSDK();
}

export class HumanVerifiedTippingSkillClass extends BankrSkill {
  private self: any;

  constructor() {
    super({
      name: 'human-verified-tipping',
      description: 'Requires both sender and receiver to verify humanity via Self ZK passport before tip executes',
      version: '1.0.0',
      author: 'Titan'
    });

    this.self = SelfSDK();
  }

  async onTip(context: SkillContext, tip: any) {
    try {
      // Verify sender
      const senderVerified = await this.verifyHuman(tip.sender);
      if (!senderVerified) {
        throw new Error(`Tip rejected: ${tip.sender} has not verified humanity via Self ZK passport`);
      }

      // Verify receiver
      const receiverVerified = await this.verifyHuman(tip.receiver);
      if (!receiverVerified) {
        throw new Error(`Tip rejected: ${tip.receiver} has not verified humanity via Self ZK passport`);
      }

      // Execute tip
      return this.executeTip(tip);
    } catch (error) {
      // Log error and reject tip
      console.error('Tip verification failed:', error);
      throw error;
    }
  }

  private async verifyHuman(address: string): Promise<boolean> {
    try {
      // Check if address has a valid Self ZK passport
      const hasPassport = await this.self.hasPassport(address);
      if (!hasPassport) {
        return false;
      }

      // Check if passport is active/verified
      const passportStatus = await this.self.getPassportStatus(address);
      return passportStatus === 'verified';
    } catch (error) {
      console.error(`Verification failed for ${address}:`, error);
      return false;
    }
  }

  public async executeTip(tip: any): Promise<any> {
    // This would call the actual Bankr tip execution
    // For now, we'll just return success
    return {
      success: true,
      transactionHash: '0x' + Math.random().toString(16).slice(2, 18),
      message: 'Tip executed successfully'
    };
  }
}

// Export the skill
export default new HumanVerifiedTippingSkillClass();
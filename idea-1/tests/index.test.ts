import { HumanVerifiedTippingSkillClass } from '../src/index';

// Mock bankr-skills-sdk to avoid external dependency
jest.mock('bankr-skills-sdk', () => ({
  BankrSkill: class {
    constructor(public config: any) {}
    async executeTip(tip: any): Promise<any> {
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).slice(2, 18),
        message: 'Tip executed successfully'
      };
    }
  },
  SkillContext: {}
}));

describe('HumanVerifiedTippingSkill', () => {
  let skill: HumanVerifiedTippingSkillClass;

  beforeEach(() => {
    skill = new HumanVerifiedTippingSkillClass();
  });

  describe('onTip', () => {
    it('should execute tip when both sender and receiver are verified', async () => {
      // Arrange
      const mockTip = { sender: '0x123', receiver: '0x456', amount: 10 };
      // Act
      const result = await skill.onTip({} as any, mockTip);
      // Assert
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    it('should handle unverified senders gracefully', async () => {
      // We'll simulate unverified by temporarily overriding the Self SDK mock
      const originalSelf = (skill as any).self;
      (skill as any).self = {
        hasPassport: async () => false,
        getPassportStatus: async () => 'unverified'
      };
      const mockTip = { sender: '0x123', receiver: '0x456', amount: 10 };
      await expect(skill.onTip({} as any, mockTip)).rejects.toThrow(
        'Tip rejected: 0x123 has not verified humanity via Self ZK passport'
      );
      (skill as any).self = originalSelf;
    });

    it('should handle unverified receivers gracefully', async () => {
      const originalSelf = (skill as any).self;
      (skill as any).self = {
        hasPassport: async (addr: string) => addr === '0x123',
        getPassportStatus: async () => 'verified'
      };
      const mockTip = { sender: '0x123', receiver: '0x456', amount: 10 };
      await expect(skill.onTip({} as any, mockTip)).rejects.toThrow(
        'Tip rejected: 0x456 has not verified humanity via Self ZK passport'
      );
      (skill as any).self = originalSelf;
    });
  });
});
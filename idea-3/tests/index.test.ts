import BankrLidoStakingSkill from '../src/index';

describe('BankrLidoStakingSkill', () => {
  let skill: BankrLidoStakingSkill;

  beforeEach(() => {
    skill = new BankrLidoStakingSkill();
  });

  describe('parseCommand', () => {
    it('should parse stake command with amount', () => {
      const cmd = (skill as any).parseCommand('stake 0.5 ETH');
      expect(cmd.type).toBe('stake');
      expect(cmd.amount).toBe('0.5');
      expect(cmd.asset).toBe('ETH');
    });

    it('should parse unstake command', () => {
      const cmd = (skill as any).parseCommand('unstake 1.2 stETH');
      expect(cmd.type).toBe('unstake');
      expect(cmd.amount).toBe('1.2');
    });

    it('should parse balance query', () => {
      const cmd = (skill as any).parseCommand('check my stETH balance');
      expect(cmd.type).toBe('balance');
    });

    it('should parse yield query', () => {
      const cmd = (skill as any).parseCommand('what\'s my yield?');
      expect(cmd.type).toBe('yield');
    });
  });

  describe('onMessage', () => {
    it('should respond to stake command', async () => {
      const result = await skill.onMessage({} as any, 'stake 0.5 ETH');
      expect(result.message).toContain('stake');
    });

    it('should respond to balance query', async () => {
      const result = await skill.onMessage({} as any, 'balance');
      expect(result.message).toContain('stETH balance');
    });

    it('should respond to yield query', async () => {
      const result = await skill.onMessage({} as any, 'yield');
      expect(result.message).toContain('yield');
    });
  });
});
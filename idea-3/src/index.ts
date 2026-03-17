import { BankrSkill, SkillContext } from 'bankr-skills-sdk';
import { ethers } from 'ethers';
import { Lido } from '@lido-finance/lido';

interface StakingCommand {
  type: 'stake' | 'unstake' | 'balance' | 'yield';
  amount?: string;
  asset?: 'ETH' | 'stETH';
}

class BankrLidoStakingSkill extends BankrSkill {
  private lido: Lido;
  private provider: ethers.JsonRpcProvider;

  constructor() {
    super({
      name: 'lido-staking-skill',
      description: 'Stake ETH into Lido, check stETH yields, and unstake via natural language commands',
      version: '1.0.0',
      author: 'Titan'
    });

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'https://mainnet.base.org');

    // Initialize Lido contract
    this.lido = new Lido({
      signer: null, // read-only for now; will need signer for transactions
      provider: this.provider
    });
  }

  async onMessage(context: SkillContext, message: string): Promise<any> {
    try {
      const command = this.parseCommand(message);

      switch (command.type) {
        case 'stake':
          return await this.handleStake(command, context);
        case 'unstake':
          return await this.handleUnstake(command, context);
        case 'balance':
          return await this.handleBalance(context);
        case 'yield':
          return await this.handleYield(context);
        default:
          return { message: 'I can help with staking, unstaking, checking balance, or yield. Try: "stake 0.5 ETH" or "check my stETH balance".' };
      }
    } catch (error) {
      console.error('Skill error:', error);
      return { message: `Error: ${error.message}` };
    }
  }

  private parseCommand(message: string): StakingCommand {
    const lower = message.toLowerCase();

    // Detect stake
    if (lower.includes('stake')) {
      const match = message.match(/(\d+(\.\d+)?)\s*(ETH|stETH|usd)?/i);
      if (match) {
        return { type: 'stake', amount: match[1], asset: ('ETH' as any) };
      }
      return { type: 'stake' };
    }

    // Detect unstake
    if (lower.includes('unstake')) {
      const match = message.match(/(\d+(\.\d+)?)\s*(ETH|stETH)?/i);
      if (match) {
        return { type: 'unstake', amount: match[1], asset: ('stETH' as any) };
      }
      return { type: 'unstake' };
    }

    // Detect balance
    if (lower.includes('balance') || lower.includes('my stETH') || lower.includes('my ETH')) {
      return { type: 'balance' };
    }

    // Detect yield
    if (lower.includes('yield') || lower.includes('reward') || lower.includes('earnings')) {
      return { type: 'yield' };
    }

    return { type: 'balance' }; // default
  }

  private async handleStake(command: StakingCommand, context: SkillContext): Promise<any> {
    // For PoC: return instructions. Full implementation would require transaction signing.
    const amount = command.amount || 'some';
    return {
      message: `To stake ${amount} ETH into Lido, you would need to sign a transaction. In a full version, I'd call Lido's submit() with your signature.`
    };
  }

  private async handleUnstake(command: StakingCommand, context: SkillContext): Promise<any> {
    return {
      message: `Unstaking ${command.amount || 'your'} stETH would involve Lido's unstake queue (1-3 days). This skill would queue the withdrawal.`
    };
  }

  private async handleBalance(context: SkillContext): Promise<any> {
    // In production, would look up user's address from context
    return {
      message: 'To show your stETH balance, I would query the Lido contract for your address. For demo purposes, assume you have 1.2345 stETH.'
    };
  }

  private async handleYield(context: SkillContext): Promise<any> {
    return {
      message: 'Current Lido stETH yield is ~3-5% APY. Your personal yield depends on how long you\'ve been staking and the current oracle fees.'
    };
  }
}

export default new BankrLidoStakingSkill();
/// MOCK implementation for bankr-skills-sdk interface

export interface SkillContext {
  sender: string;
  receiver: string;
  amount: number;
  metadata?: any;
}

export interface BankrSkillBaseConfig {
  name: string;
  description: string;
  version: string;
  author: string;
}

export class BankrSkill {
  constructor(public config: BankrSkillBaseConfig) {}
  async onTip(context: SkillContext, tip: any): Promise<any> {
    return this.executeTip(tip);
  }
  public async executeTip(tip: any): Promise<any> {
    throw new Error('executeTip must be implemented by subclass');
  }
}
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
export declare class BankrSkill {
    config: BankrSkillBaseConfig;
    constructor(config: BankrSkillBaseConfig);
    onTip(context: SkillContext, tip: any): Promise<any>;
    executeTip(tip: any): Promise<any>;
}
export declare function createBankrSkill(config: BankrSkillBaseConfig): BankrSkill;
//# sourceMappingURL=bankr-sdk.d.ts.map
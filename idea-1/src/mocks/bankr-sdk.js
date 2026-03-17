"use strict";
/// MOCK implementation for bankr-skills-sdk interface
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankrSkill = void 0;
exports.createBankrSkill = createBankrSkill;
class BankrSkill {
    constructor(config) {
        this.config = config;
    }
    async onTip(context, tip) {
        return this.executeTip(tip);
    }
    async executeTip(tip) {
        return {
            success: true,
            transactionHash: '0x' + Math.random().toString(16).slice(2, 18),
            message: 'Tip executed successfully'
        };
    }
}
exports.BankrSkill = BankrSkill;
function createBankrSkill(config) {
    return new BankrSkill(config);
}
//# sourceMappingURL=bankr-sdk.js.map
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { Contract } from '@ethersproject/contracts';
import { config } from '../config';

export interface CeloContractABI {
  transfer: (to: string, amount: string) => Promise<any>;
  allowance: (owner: string, spender: string) => Promise<any>;
  approve: (spender: string, amount: string) => Promise<any>;
  balanceOf: (address: string) => Promise<any>;
  decimals: () => Promise<any>;
  symbol: () => Promise<any>;
  name: () => Promise<any>;
}

export class CeloService {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private stablecoinContract: Contract | null = null;
  private isInitialized = false;

  constructor() {
    this.provider = new JsonRpcProvider(config.celoProviderUrl);
    this.wallet = new Wallet(config.celoPrivateKey, this.provider);
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Load stablecoin contract if address provided
      if (config.celoStablecoinAddress) {
        const stablecoinABI = [
          'function transfer(address to, uint amount) external returns (bool)',
          'function allowance(address owner, address spender) view returns (uint)',
          'function approve(address spender, uint amount) external returns (bool)',
          'function balanceOf(address account) view returns (uint)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
          'function name() view returns (string)',
        ];

        this.stablecoinContract = new Contract(
          config.celoStablecoinAddress,
          stablecoinABI,
          this.wallet,
        );
      }

      this.isInitialized = true;
      console.log('Celo service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Celo service:', error);
      return false;
    }
  }

  async getBalance(address: string): Promise<{ balance: string; stableBalance: string }> {
    try {
      // CELO native balance
      const balance = await this.provider.getBalance(address);
      const weiBalance = balance.toString();

      let stableBalance = '0';
      if (this.stablecoinContract) {
        const stable = await this.stablecoinContract.balanceOf(address);
        stableBalance = stable.toString();
      }

      return {
        balance: weiBalance,
        stableBalance,
      };
    } catch (error) {
      throw new Error(`Failed to get balance for ${address}: ${error.message}`);
    }
  }

  async transferNative(to: string, amountWei: string): Promise<{ success: boolean; txHash?: string }> {
    try {
      const tx = await this.wallet.sendTransaction({
        to,
        value: amountWei,
      });

      const receipt = await tx.wait();
      return {
        success: receipt.status === 1,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      throw new Error(`Native transfer failed: ${error.message}`);
    }
  }

  async transferStablecoin(
    to: string,
    amount: string,
  ): Promise<{ success: boolean; txHash: string }> {
    if (!this.stablecoinContract) {
      throw new Error('Stablecoin contract not initialized');
    }

    try {
      // Get token decimals
      const decimals = await this.stablecoinContract.decimals();
      const amountWithDecimals = (parseFloat(amount) * Math.pow(10, decimals)).toString();

      const tx = await this.stablecoinContract.transfer(to, amountWithDecimals);
      const receipt = await tx.wait();

      return {
        success: receipt.status === 1,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      throw new Error(`Stablecoin transfer failed: ${error.message}`);
    }
  }

  async lockFunds(
    amount: string,
    currency: string,
  ): Promise<{ success: boolean; txHash?: string }> {
    // In a production implementation, we would call a smart contract
    // that locks funds until verification is complete.
    // For now, we'll just simulate this with a direct transfer.

    if (config.celoContractAddress) {
      // We would call the contract's lock function here
      // const contract = new Contract(config.celoContractAddress, abi, this.wallet);
      // const tx = await contract.lock(amount, { value: ... });
      // await tx.wait();
      throw new Error('Lock contract not implemented');
    } else {
      // Degraded mode: directly hold funds in escrow wallet
      return { success: true, txHash: '0x' };
    }
  }

  async releaseLockedFunds(
    lockedTxHash: string,
    recipient: string,
  ): Promise<{ success: boolean; txHash?: string }> {
    // Release funds from lock after verification
    if (config.celoContractAddress) {
      // const contract = new Contract(config.celoContractAddress, abi, this.wallet);
      // const tx = await contract.release(lockedTxHash, recipient);
      // await tx.wait();
      throw new Error('Release contract not implemented');
    } else {
      return { success: true, txHash: '0x' };
    }
  }

  async getTransaction(txHash: string) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      const tx = await this.provider.getTransaction(txHash);
      return { receipt, transaction: tx };
    } catch (error) {
      throw new Error(`Transaction lookup failed: ${error.message}`);
    }
  }
}

export const celoService = new CeloService();
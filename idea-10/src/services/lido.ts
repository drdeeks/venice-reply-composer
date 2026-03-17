import { ethers } from 'ethers';
import { EthereumClient } from './ethereum';
import { logger } from '../config/logger';
import { config } from '../config/config';
import { StakingPosition } from '../types';

export class LidoService {
  private ethClient: EthereumClient;
  private stethContract: ethers.Contract;
  private withdrawalQueueContract: ethers.Contract;
  private stakingWalletAddress: string;

  private static readonly STETH_ABI = [
    'function balanceOf(address account) external view returns (uint256)',
    'function totalSupply() external view returns (uint256)',
    'function getSharesByStETH(uint256 stETH) external view returns (uint256)',
    'function getStETHByShares(uint256 shares) external view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 amount)',
  ];

  private static readonly WITHDRAWAL_QUEUE_ABI = [
    'function totalWithdrawalQueueSize() external view returns (uint256)',
    'function getWithdrawalRequest(uint256 index) external view returns (address, uint256, uint256, uint256)',
    'function find(address, bool) external view returns (uint256)',
    'function requestWithdrawals(uint256[] calldata shares) external returns (uint256)',
    'function withdraw(address, uint256, bytes calldata) external',
  ];

  constructor() {
    this.ethClient = new EthereumClient();
    this.stakingWalletAddress = config.ethereum.stakingWalletAddress;
    
    const provider = this.ethClient.getProvider();
    this.stethContract = new ethers.Contract(
      config.ethereum.stethAddress,
      LidoService.STETH_ABI,
      provider
    );
    
    this.withdrawalQueueContract = new ethers.Contract(
      config.ethereum.withdrawalQueueAddress,
      LidoService.WITHDRAWAL_QUEUE_ABI,
      provider
    );
  }

  async getStEthBalance(address: string = this.stakingWalletAddress): Promise<bigint> {
    try {
      const balance = await this.stethContract.balanceOf(address);
      logger.debug(`stETH balance for ${address}: ${balance.toString()}`);
      return balance;
    } catch (error) {
      logger.error(`Failed to get stETH balance for ${address}:`, error);
      throw error;
    }
  }

  async getStakingPosition(): Promise<StakingPosition> {
    try {
      const [stethBalance, totalSupply] = await Promise.all([
        this.getStEthBalance(),
        this.stethContract.totalSupply(),
      ]);

      const shares = await this.stethContract.getSharesByStETH(stethBalance);
      
      const totalRequests = await this.withdrawalQueueContract.totalWithdrawalQueueSize();
      let totalWithdrawalAmount = ethers.BigNumber.from(0);

      const maxChecks = Math.min(totalRequests.toNumber(), 1000);
      for (let i = 0; i < maxChecks; i++) {
        try {
          const [recipient, amount] = await this.withdrawalQueueContract.getWithdrawalRequest(i);
          if (recipient.toLowerCase() === this.stakingWalletAddress.toLowerCase()) {
            totalWithdrawalAmount = totalWithdrawalAmount.add(amount);
          }
        } catch (err) {
          logger.warn(`Failed to fetch withdrawal request ${i}:`, err);
        }
      }

      const position: StakingPosition = {
        address: this.stakingWalletAddress,
        stethBalance,
        rawYield: totalWithdrawalAmount,
        lastUpdated: new Date(),
        totalStaked: shares,
      };

      logger.info(`Staking position updated: stETH=${stethBalance.toString()}, pending withdrawals=${totalWithdrawalAmount.toString()}`);
      return position;
    } catch (error) {
      logger.error('Failed to get staking position:', error);
      throw error;
    }
  }

  async stakeEth(amountEth: number): Promise<string> {
    const signer = this.ethClient.getSigner();
    const depositContract = this.stethContract.connect(signer);
    
    const amountWei = ethers.parseEther(amountEth.toString());
    
    try {
      logger.info(`Staking ${amountEth} ETH via Lido`);
      const tx = await depositContract.deposit({ value: amountWei });
      logger.info(`Deposit transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      logger.info(`Deposit confirmed: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      logger.error('Staking failed:', error);
      throw error;
    }
  }

  async requestWithdrawal(shares: bigint): Promise<string> {
    const signer = this.ethClient.getSigner();
    const queue = this.withdrawalQueueContract.connect(signer);
    
    try {
      logger.info(`Requesting withdrawal of ${shares.toString()} shares`);
      const tx = await queue.requestWithdrawals([shares]);
      logger.info(`Withdrawal request sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      logger.info(`Withdrawal request confirmed: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      logger.error('Withdrawal request failed:', error);
      throw error;
    }
  }

  async claimWithdrawal(requestId: bigint): Promise<string> {
    const signer = this.ethClient.getSigner();
    const queue = this.withdrawalQueueContract.connect(signer);
    
    try {
      logger.info(`Claiming withdrawal request ${requestId.toString()}`);
      const tx = await queue.withdraw(this.stakingWalletAddress, requestId, '0x');
      logger.info(`Claim transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      logger.info(`Claim confirmed: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      logger.error('Claim withdrawal failed:', error);
      throw error;
    }
  }

  convertStethToEth(stethAmount: bigint): bigint {
    try {
      const shares = this.stethContract.getSharesByStETH(stethAmount);
      return this.stethContract.getStETHByShares(shares);
    } catch (error) {
      logger.error('Failed to convert stETH to ETH equivalent:', error);
      throw error;
    }
  }

  async getTotalStaked(): Promise<bigint> {
    try {
      const totalSupply = await this.stethContract.totalSupply();
      const stethBalance = await this.stethContract.balanceOf(this.stakingWalletAddress);
      
      const shares = await this.stethContract.getSharesByStETH(stethBalance);
      return shares;
    } catch (error) {
      logger.error('Failed to get total staked:', error);
      throw error;
    }
  }

  getStakingWalletAddress(): string {
    return this.stakingWalletAddress;
  }

  getStethContract(): ethers.Contract {
    return this.stethContract;
  }

  getWithdrawalQueueContract(): ethers.Contract {
    return this.withdrawalQueueContract;
  }
}

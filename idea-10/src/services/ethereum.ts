import { ethers } from 'ethers';

export class EthereumClient {
  private provider: ethers.providers.JsonRpcProvider;
  private signer?: ethers.Signer;

  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    if (!rpcUrl) {
      throw new Error('ETHEREUM_RPC_URL not configured');
    }

    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }
  }

  async getBalance(address: string): Promise<ethers.BigNumber> {
    return await this.provider.getBalance(address);
  }

  async getStethBalance(address: string): Promise<ethers.BigNumber> {
    const stethContract = new ethers.Contract(
      process.env.LIDO_STETH_ADDRESS || '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      [
        'function balanceOf(address account) external view returns (uint256)',
      ],
      this.provider
    );

    return await stethContract.balanceOf(address);
  }

  async getStethYield(address: string): Promise<ethers.BigNumber> {
    const withdrawalQueue = new ethers.Contract(
      process.env.LIDO_WITHDRAWAL_QUEUE_ADDRESS || '0x0C0F8B3b4a8dcB15392a026FcBFd4B3739284b18',
      [
        'function totalWithdrawalQueueSize() external view returns (uint256)',
        'function getWithdrawalRequest(uint256 index) external view returns (address, uint256, uint256, uint256)',
      ],
      this.provider
    );

    const totalRequests = await withdrawalQueue.totalWithdrawalQueueSize();
    let totalYield = ethers.BigNumber.from(0);

    for (let i = 0; i < totalRequests && i < 100; i++) {
      const [recipient, , amount, timestamp] = await withdrawalQueue.getWithdrawalRequest(i);
      if (recipient.toLowerCase() === address.toLowerCase()) {
        totalYield = totalYield.add(amount);
      }
    }

    return totalYield;
  }

  async sendTransaction(tx: ethers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('No signer available');
    }

    const transaction = await this.signer.sendTransaction(tx);
    return transaction;
  }

  async waitForTransaction(txHash: string): Promise<ethers.providers.TransactionReceipt> {
    return await this.provider.waitForTransaction(txHash);
  }

  async estimateGas(tx: ethers.TransactionRequest): Promise<ethers.BigNumber> {
    return await this.provider.estimateGas(tx);
  }

  async getTransaction(txHash: string): Promise<ethers.providers.TransactionResponse | null> {
    return await this.provider.getTransaction(txHash);
  }

  async getNetwork(): Promise<ethers.providers.Network> {
    return await this.provider.getNetwork();
  }

  getSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error('No signer available');
    }
    return this.signer;
  }

  getProvider(): ethers.providers.JsonRpcProvider {
    return this.provider;
  }
}

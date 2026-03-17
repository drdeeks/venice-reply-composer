import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, ContractFactory, Signer } from 'ethers';

describe('RevenueSplitter', function () {
  let accounts: Signer[];
  let revenueSplitter: Contract;
  let agentToken: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;

  const INITIAL_SUPPLY = ethers.utils.parseEther('1000000');
  const TOKEN_HOLDERS = [
    { address: '0x1111111111111111111111111111111111111111', balance: ethers.utils.parseEther('400000') },
    { address: '0x2222222222222222222222222222222222222222', balance: ethers.utils.parseEther('350000') },
    { address: '0x3333333333333333333333333333333333333333', balance: ethers.utils.parseEther('250000') },
  ];

  before(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];

    const RevenueSplitter = await ethers.getContractFactory('RevenueSplitter');
    revenueSplitter = await RevenueSplitter.deploy();
    await revenueSplitter.deployed();

    const AgentToken = await ethers.getContractFactory('AgentToken');
    agentToken = await AgentToken.deploy(INITIAL_SUPPLY);
    await agentToken.deployed();

    // Mint tokens to holders
    for (const holder of TOKEN_HOLDERS) {
      await agentToken.transfer(holder.address, holder.balance);
    }
  });

  describe('Deployment', function () {
    it('should deploy with correct initial state', async function () {
      expect(await revenueSplitter.totalRevenue()).to.equal(0);
      expect(await revenueSplitter.totalDistributed()).to.equal(0);
    });
  });

  describe('Revenue Collection', function () {
    it('should accept revenue', async function () {
      const revenueAmount = ethers.utils.parseEther('100');
      const tx = await revenueSplitter.collectRevenue({
        value: revenueAmount,
        gasLimit: 200000,
      });

      await expect(tx).to.emit(revenueSplitter, 'RevenueCollected')
        .withArgs(revenueAmount, await revenueSplitter.totalRevenue());
    });

    it('should track total revenue', async function () {
      const initialRevenue = await revenueSplitter.totalRevenue();
      const revenueAmount = ethers.utils.parseEther('50');
      
      await revenueSplitter.collectRevenue({
        value: revenueAmount,
        gasLimit: 200000,
      });

      expect(await revenueSplitter.totalRevenue()).to.equal(initialRevenue.add(revenueAmount));
    });
  });

  describe('Distribution Calculation', function () {
    it('should calculate correct distribution amounts', async function () {
      const revenueAmount = ethers.utils.parseEther('1000');
      const totalSupply = await agentToken.totalSupply();
      
      // Set up token balances
      for (const holder of TOKEN_HOLDERS) {
        await agentToken.transfer(holder.address, holder.balance);
      }

      const distributions = await revenueSplitter.calculateDistribution(revenueAmount);
      
      expect(distributions.length).to.equal(3);
      
      // Verify proportions
      const expectedUser1 = revenueAmount.mul(TOKEN_HOLDERS[0].balance).div(totalSupply);
      const expectedUser2 = revenueAmount.mul(TOKEN_HOLDERS[1].balance).div(totalSupply);
      const expectedUser3 = revenueAmount.mul(TOKEN_HOLDERS[2].balance).div(totalSupply);

      expect(distributions[0].amount).to.equal(expectedUser1);
      expect(distributions[1].amount).to.equal(expectedUser2);
      expect(distributions[2].amount).to.equal(expectedUser3);
    });

    it('should handle zero revenue', async function () {
      const distributions = await revenueSplitter.calculateDistribution(ethers.utils.parseEther('0'));
      expect(distributions.length).to.equal(0);
    });
  });

  describe('Claim Process', function () {
    it('should allow users to claim their share', async function () {
      const revenueAmount = ethers.utils.parseEther('500');
      const user1Address = await user1.getAddress();
      const user1Balance = await agentToken.balanceOf(user1Address);
      const totalSupply = await agentToken.totalSupply();
      
      // Collect revenue
      await revenueSplitter.collectRevenue({
        value: revenueAmount,
        gasLimit: 200000,
      });

      // Calculate expected amount
      const expectedAmount = revenueAmount.mul(user1Balance).div(totalSupply);
      
      // Claim
      const tx = await revenueSplitter.claim(user1Address);

      await expect(tx).to.emit(revenueSplitter, 'DistributionClaimed')
        .withArgs(user1Address, expectedAmount);

      // Verify user received amount
      const userBalanceAfter = await user1.getBalance();
      expect(userBalanceAfter).to.be.at.least(
        (await user1.getBalance()).add(expectedAmount)
      );
    });

    it('should prevent double claiming', async function () {
      const user1Address = await user1.getAddress();
      
      // First claim
      await revenueSplitter.claim(user1Address);
      
      // Second claim should revert
      await expect(revenueSplitter.claim(user1Address)).to.be.reverted;
    });
  });

  describe('Emergency Functions', function () {
    it('should allow owner to pause/unpause', async function () {
      await revenueSplitter.pause();
      expect(await revenueSplitter.paused()).to.equal(true);

      await revenueSplitter.unpause();
      expect(await revenueSplitter.paused()).to.equal(false);
    });

    it('should revert actions when paused', async function () {
      await revenueSplitter.pause();
      
      await expect(revenueSplitter.collectRevenue({
        value: ethers.utils.parseEther('10'),
        gasLimit: 200000,
      })).to.be.reverted;

      await revenueSplitter.unpause();
    });
  });
});
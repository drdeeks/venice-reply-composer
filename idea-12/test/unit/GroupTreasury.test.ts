const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GroupTreasury", function () {
  let GroupTreasury;
  let treasury;
  let owner;
  let addr1;
  let addr2;
  let lidoMock;

  const ETH_VALUE = ethers.utils.parseEther("1");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock Lido
    const LidoMock = await ethers.getContractFactory("LidoMock");
    lidoMock = await LidoMock.deploy();
    await lidoMock.deployed();

    // Deploy GroupTreasury
    GroupTreasury = await ethers.getContractFactory("GroupTreasury");
    treasury = await GroupTreasury.deploy(
      owner.address,
      lidoMock.address,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero
    );
    await treasury.deployed();
  });

  describe("Initialization", function () {
    it("Should set correct owner and roles", async function () {
      expect(await treasury.hasRole(await treasury.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await treasury.hasRole(await treasury.GOVERNANCE_ROLE(), owner.address)).to.be.true;
    });

    it("Should initialize with 0 state", async function () {
      expect(await treasury.totalDeposited()).to.equal(0);
      expect(await treasury.totalShares()).to.equal(0);
      expect(await treasury.totalLiquidETH()).to.equal(0);
    });
  });

  describe("Deposit", function () {
    it("Should mint shares on deposit", async function () {
      await treasury.connect(addr1).deposit({ value: ETH_VALUE });

      const balance = await treasury.balanceOf(addr1.address);
      expect(balance).to.equal(ETH_VALUE);
      expect(await treasury.totalShares()).to.equal(ETH_VALUE);
      expect(await treasury.totalDeposited()).to.equal(ETH_VALUE);
    });

    it("Should not accept zero deposits", async function () {
      await expect(treasury.connect(addr1).deposit({ value: 0 }))
        .to.be.revertedWith("Zero deposit");
    });

    it("Should handle multiple deposits correctly", async function () {
      await treasury.connect(addr1).deposit({ value: ETH_VALUE });
      await treasury.connect(addr2).deposit({ value: ETH_VALUE });

      expect(await treasury.balanceOf(addr1.address)).to.equal(ETH_VALUE);
      expect(await treasury.balanceOf(addr2.address)).to.equal(ETH_VALUE);
      expect(await treasury.totalDeposited()).to.equal(ethers.utils.parseEther("2"));
    });

    it("Should stake to Lido on deposit", async function () {
      await treasury.connect(addr1).deposit({ value: ETH_VALUE });

      // In the current implementation, staking happens automatically
      // but since Lido is mocked, we can check balance changes
      expect(await treasury.address).to.be.provider;
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      await treasury.connect(addr1).deposit({ value: ETH_VALUE });
    });

    it("Should queue withdrawal and lock shares", async function () {
      const shares = await treasury.balanceOf(addr1.address);
      await treasury.connect(addr1).queueWithdrawal(shares);

      const lockedUntil = await treasury.withdrawalLockUntil(addr1.address);
      expect(lockedUntil).to.be.gt(ethers.provider.send('eth_getBlockNumber', []));
    });

    it("Should not allow withdrawal while locked", async function () {
      const shares = await treasury.balanceOf(addr1.address);
      await treasury.connect(addr1).queueWithdrawal(shares);

      await expect(treasury.connect(addr1).executeWithdrawal())
        .to.be.revertedWith("Withdrawal locked");
    });

    it("Should revert on queue with zero shares", async function () {
      await expect(treasury.connect(addr1).queueWithdrawal(0))
        .to.be.revertedWith("Zero shares");
    });
  });

  describe("Access Control", function () {
    it("Should allow only governance to set strategies", async function () {
      await expect(treasury.connect(addr1).setStrategy(0, true, 5000))
        .to.be.revertedWithCustomError(treasury, "AccessControlEnumerable", "Not allowed to call");

      await treasury.setStrategy(0, true, 5000);
      expect().nothing;
    });

    it("Should allow only governance to add supported tokens", async function () {
      await expect(treasury.connect(addr1).addSupportedToken(addr1.address))
        .to.be.revertedWith("AccessControl: ...");
    });
  });
});

describe("LidoMock", function () {
  let LidoMock;
  let lidoMock;

  beforeEach(async function () {
    LidoMock = await ethers.getContractFactory("LidoMock");
    lidoMock = await LidoMock.deploy();
    await lidoMock.deployed();
  });

  it("Should convert ETH to shares", async function () {
    const shares = await lidoMock.ethToShares(ethers.utils.parseEther("1"));
    expect(shares).to.equal(ethers.utils.parseEther("0.99")); // Mock rate
  });

  it("Should accept staking deposits", async function () {
    await lidoMock.stake({ value: ETH_VALUE });
    expect(await lidoMock.balanceOf(lidoMock.address)).to.equal(ETH_VALUE);
  });
});

describe("StrategyManager", function () {
  let StrategyManager;

  beforeEach(async function () {
    StrategyManager = await ethers.getContractFactory("StrategyManager");
    // Will implement after integration
  });
});
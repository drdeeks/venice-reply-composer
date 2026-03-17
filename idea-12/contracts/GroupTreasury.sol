// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./interfaces/ILido.sol";
import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/IUniswapV2Pair.sol";

contract GroupTreasury is
    ERC20BurnableUpgradeable,
    ERC20SnapshotUpgradeable,
    AccessControl,
    ReentrancyGuard,
    UUPSUpgradeable
{
    using SafeMath for uint256;

    // Default withdrawal lock period: 7 days
    uint256 public constant DEFAULT_WITHDRAWAL_LOCK_PERIOD = 7 days;

    // Governance role for treasury management
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // Addresses
    ILido public lidoStaking;
    IUniswapV2Router public uniswapRouter;
    address public wethToken;

    // Supported tokens for Uniswap LP (aside from ETH/WETH)
    mapping(address => bool) public isSupportedToken;

    // Withdrawal lock: timestamp until which a user cannot withdraw
    mapping(address => uint256) public withdrawalLockUntil;

    // Strategy configurations
    struct Strategy {
        bool isActive;
        uint256 allocationPercentage; // Basis points (0-10000, where 10000 = 100%)
        address targetToken; // For Uniswap: token address; for Lido: address(0)
    }

    // Currently active strategies
    Strategy public lidoStrategy;
    Strategy public uniswapStrategy;

    // Treasury state
    uint256 public totalDeposited; // Total ETH deposited
    uint256 public totalShares;    // Total shares minted (including staked)
    uint256 public totalLiquidETH; // ETH available for immediate withdrawal

    // Track LP positions
    struct LiquidityPosition {
        address token; // Token pair address (other than WETH)
        uint256 lpTokenBalance;
        uint256 token0Balance;
        uint256 token1Balance;
    }

    mapping(address => LiquidityPosition) public liquidityPositions;

    // Events
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event WithdrawalQueued(address indexed user, uint256 shares, uint256 ethAmount, uint256 unlockTime);
    event WithdrawalExecuted(address indexed user, uint256 shares, uint256 ethAmount);
    event StrategySet(address indexed strategy, bool active, uint256 allocationPercentage);
    event SupportedTokenAdded(address indexed token);
    event SupportedTokenRemoved(address indexed token);
    event LidoStaked(address indexed from, uint256 amount, uint256 shares);
    event UniswapLPAdded(address indexed from, uint256 ethAmount, address token, uint256 lpAmount);
    event UniswapLPRemoved(address indexed from, address token, uint256 lpAmount, uint256 ethAmountOut, uint256 tokenOut);

    /// @dev Initializes the upgradeable contract
    function initialize(address initialGovernor, address _lidoStaking, address _uniswapRouter, address _wethToken) public initializer {
        __ERC20_init("GroupTreasury Shares", "GTS");
        __ERC20Snapshot_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, initialGovernor);
        _setupRole(GOVERNANCE_ROLE, initialGovernor);

        lidoStaking = ILido(_lidoStaking);
        uniswapRouter = IUniswapV2Router(_uniswapRouter);
        wethToken = _wethToken;

        // Configure initial strategy: 100% to Lido staking
        lidoStrategy = Strategy({
            isActive: true,
            allocationPercentage: 10000, // 100%
            targetToken: address(0)
        });

        uniswapStrategy = Strategy({
            isActive: false,
            allocationPercentage: 0,
            targetToken: address(0)
        });

        totalDeposited = 0;
        totalShares = 0;
        totalLiquidETH = 0;
    }

    /// @notice Deposit ETH into the treasury
    /// @dev Only callable by governance to stake immediately according to strategy
    /// User-facing deposits are handled by Status dApp which calls `deposit`
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Zero deposit");

        uint256 shares = _mintForDeposit(msg.sender, msg.value);

        totalDeposited = totalDeposited.add(msg.value);
        totalShares = totalShares.add(shares);

        // Automatically stake according to strategy
        _stakeAccordingToStrategy(msg.value);

        emit Deposited(msg.sender, msg.value, shares);
    }

    /// @notice Queue a withdrawal (shares burned, ETH locked)
    /// @param shares Number of shares to withdraw
    function queueWithdrawal(uint256 shares) external nonReentrant {
        require(shares > 0, "Zero shares");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");

        uint256 ethAmount = _sharesToETH(shares);

        // Burn shares
        _burn(msg.sender, shares);
        totalShares = totalShares.sub(shares);

        // Lock withdrawal
        uint256 unlockTime = block.timestamp.add(DEFAULT_WITHDRAWAL_LOCK_PERIOD);
        withdrawalLockUntil[msg.sender] = max(withdrawalLockUntil[msg.sender], unlockTime);

        emit WithdrawalQueued(msg.sender, shares, ethAmount, unlockTime);
    }

    /// @notice Execute a withdrawal after lock period
    function executeWithdrawal() external nonReentrant {
        uint256 unlockTime = withdrawalLockUntil[msg.sender];
        require(unlockTime <= block.timestamp, "Withdrawal locked");

        // Withdraw amount is determined by current ETH value of total shares
        // We need to calculate based on share ratio
        uint256 userETHShare = _calculateUserShare(msg.sender);

        require(totalLiquidETH >= userETHShare, "Insufficient liquidity");
        totalLiquidETH = totalLiquidETH.sub(userETHShare);

        withdrawalLockUntil[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: userETHShare}("");
        require(success, "Transfer failed");

        emit WithdrawalExecuted(msg.sender, userETHShare, userETHShare);
    }

    /// @notice Governance: set strategy allocations
    /// @param _strategy The strategy to configure (0 = Lido, 1 = Uniswap)
    /// @param active Whether the strategy should be active
    /// @param allocation Percentage (0-10000 basis points)
    function setStrategy(uint8 _strategy, bool active, uint256 allocation) external onlyRole(GOVERNANCE_ROLE) {
        require(allocation <= 10000, "Invalid allocation");

        if (_strategy == 0) {
            lidoStrategy.isActive = active;
            lidoStrategy.allocationPercentage = allocation;
        } else if (_strategy == 1) {
            uniswapStrategy.isActive = active;
            uniswapStrategy.allocationPercentage = allocation;
        }

        emit StrategySet(bytes32(_strategy), active, allocation);
    }

    /// @notice Add a supported token for Uniswap positions
    function addSupportedToken(address token) external onlyRole(GOVERNANCE_ROLE) {
        isSupportedToken[token] = true;
        emit SupportedTokenAdded(token);
    }

    /// @notice Remove a supported token
    function removeSupportedToken(address token) external onlyRole(GOVERNANCE_ROLE) {
        isSupportedToken[token] = false;
        emit SupportedTokenRemoved(token);
    }

    // =====================
    // Strategy Execution
    // =====================

    /// @dev Auto-stake incoming deposits according to current strategy
    function _stakeAccordingToStrategy(uint256 depositAmount) internal {
        if (lidoStrategy.isActive && lidoStrategy.allocationPercentage > 0) {
            uint256 lidoAmount = depositAmount.mul(lidoStrategy.allocationPercentage).div(10000);
            _stakeToLido(lidoAmount);
        }

        if (uniswapStrategy.isActive && uniswapStrategy.allocationPercentage > 0) {
            uint256 uniAmount = depositAmount.mul(uniswapStrategy.allocationPercentage).div(10000);
            _addLiquidityOnUniswap(uniAmount);
        }
    }

    /// @dev Stake ETH to Lido
    function _stakeToLido(uint256 amount) internal returns (uint256 shares) {
        require(address(lidoStaking) != address(0), "Lido not set");
        require(amount > 0, "Zero amount");

        // Keep some ETH in treasury for withdrawals
        uint256 available = address(this).balance;
        uint256 toStake = min(amount, available.sub(totalLiquidETH));

        if (toStake == 0) return 0;

        totalLiquidETH = totalLiquidETH.sub(toStake);

        (bool success, ) = address(lidoStaking).call{value: toStake}("");
        require(success, "Lido stake failed");

        shares = lidoStaking.ethToShares(toStake);
        totalShares = totalShares.add(shares); // Consider staked shares as part of total

        emit LidoStaked(msg.sender, toStake, shares);
    }

    /// @dev Add liquidity to Uniswap V2 (simple pool)
    function _addLiquidityOnUniswap(uint256 ethAmount) internal {
        require(address(uniswapRouter) != address(0), "Uniswap not set");
        require(ethAmount > 0, "Zero amount");
        require(totalLiquidETH >= ethAmount, "Insufficient ETH");

        // Currently hard-coded to USDC or similar stablecoin
        // In production, this should be configurable per strategy
        address token = isSupportedToken(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48) // USDC mainnet
            ? 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
            : wethToken;

        // Add liquidity
        totalLiquidETH = totalLiquidETH.sub(ethAmount);

        // Calculate optimal token amount based on reserves (simplified)
        (uint reserveETH, uint reserveToken) = _getReserves(wethToken, token);
        uint tokenAmount = ethAmount.mul(reserveToken).div(reserveETH);

        // Approve and add liquidity
        // In production, use the router's addLiquidityETH function
        // For now, we'll log and track positions manually for demo

        liquidityPositions[wethToken] = LiquidityPosition({
            token: token,
            lpTokenBalance: 0,
            token0Balance: 0,
            token1Balance: 0
        });

        emit UniswapLPAdded(msg.sender, ethAmount, token, 0);
    }

    /// @notice Remove Uniswap LP position (governance only)
    function removeLiquidity(address lpPair, uint256 liquidity) external onlyRole(GOVERNANCE_ROLE) {
        IUniswapV2Pair pair = IUniswapV2Pair(lpPair);
        (uint amount0, uint amount1) = pair.burn(liquidity);

        // Transfer proceeds to treasury
        if (amount0 > 0) {
            IERC20(token0 = pair.token0()).transfer(address(this), amount0);
        }
        if (amount1 > 0) {
            IERC20(token1 = pair.token1()).transfer(address(this), amount1);
        }

        // Update position tracking
        delete liquidityPositions[lpPair];

        emit UniswapLPRemoved(msg.sender, lpPair, liquidity, amount0, amount1);
    }

    /// @dev Calculate a user's share of total ETH
    function _calculateUserShare(address user) internal view returns (uint256) {
        if (totalShares == 0) return 0;
        return balanceOf(user).mul(totalDeposited).div(totalShares);
    }

    /// @dev Mint shares for a deposit
    function _mintForDeposit(address to, uint256 depositAmount) internal returns (uint256 shares) {
        if (totalShares == 0) {
            shares = depositAmount; // 1:1 initially
        } else {
            shares = depositAmount.mul(totalShares).div(totalDeposited);
        }
        _mint(to, shares);
        return shares;
    }

    /// @dev Convert shares to ETH (based on totalDeposited/totalShares ratio)
    function _sharesToETH(uint256 shares) internal view returns (uint256) {
        if (totalShares == 0) return 0;
        return shares.mul(totalDeposited).div(totalShares);
    }

    /// @dev Get reserves for a token pair
    function _getReserves(address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        address pair = IUniswapV2Router(uniswapRouter).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            return (0, 0);
        }
        (reserveA, reserveB,) = IUniswapV2Pair(pair).getReserves();

        // Normalize: token0 is always the smaller address
        if (tokenA > tokenB) {
            (reserveA, reserveB) = (reserveB, reserveA);
        }
    }

    /// @dev Max helper
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    /// @dev Min helper
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    // =====================
    // View Functions
    // =====================

    /// @notice Get current treasury state
    function getTreasuryState() external view returns (
        uint256 _totalDeposited,
        uint256 _totalShares,
        uint256 _totalLiquidETH,
        uint256 _availableLidoShares,
        uint256 _uniswapPositionCount
    ) {
        return (
            totalDeposited,
            totalShares,
            totalLiquidETH,
            0, // TODO: calculate from Lido
            0  // TODO: Map length of positions
        );
    }

    /// @notice Get user stats
    function getUserStats(address user) external view returns (
        uint256 shares,
        uint256 ethValue,
        uint256 withdrawableAt,
        uint256 lockedAmount
    ) {
        shares = balanceOf(user);
        ethValue = _calculateUserShare(user);
        withdrawableAt = withdrawalLockUntil[user];
        lockedAmount = withdrawableAt > block.timestamp ? ethValue : 0;
        return (shares, ethValue, withdrawableAt, lockedAmount);
    }

    /// @notice Check if a withdrawal is ready
    function canWithdraw(address user) external view returns (bool) {
        return withdrawalLockUntil[user] <= block.timestamp;
    }

    /// @notice Get pending rewards (staked shares value minus current total)
    /// This is a simplified view; production would track rewards more precisely
    function getPendingRewards() external view returns (uint256 lidoRewards, uint256 uniRewards) {
        // Assuming staking rewards accrue in Lido's shares
        if (address(lidoStaking) != address(0)) {
            uint256 currentLidoETH = lidoStaking.getTotalPooledEther();
            // Compare with what we think we have (needs off-chain tracking)
        }
        return (0, 0);
    }

    // =====================
    // Admin Functions
    // =====================

    /// @notice Withdraw excess ETH (governance only)
    /// Used to pay for gas, operations, or redistribute to members (via governance vote)
    function withdrawExcessETH(uint256 amount, address to) external onlyRole(GOVERNANCE_ROLE) {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }

    // =====================
    // UUPS Upgradeability
    // =====================

    function _authorizeUpgrade(address newImplementation) internal onlyRole(getDefaultAdminRole()) override {}
}
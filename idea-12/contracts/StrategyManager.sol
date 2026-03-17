// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./interfaces/ILido.sol";
import "./IStrategyConsumer.sol";

contract StrategyManager is
    AccessControl,
    UUPSUpgradeable
{
    using SafeMath for uint256;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    ILido public lidoStrategy;
    IStrategyConsumer public uniswapStrategy;

    // Treasury address that owns the capital
    address public treasury;

    struct StrategyState {
        bool isActive;
        uint256 allocationBps; // Basis points (0-10000)
        uint256 totalAllocated;
        uint256 totalHarvested;
        uint256 lastReportedValue;
    }

    mapping(uint256 => StrategyState) public strategies;
    uint256 public strategyCount;

    event StrategyCreated(uint256 indexed id, address strategy, string name, uint256 allocationBps);
    event StrategyUpdated(uint256 indexed id, bool active, uint256 allocationBps);
    event StrategyAllocated(uint256 indexed id, address from, uint256 amount);
    event StrategyHarvested(uint256 indexed id, address to, uint256 amount);

    /// @dev Initialize the manager
    function initialize(address initialGovernor, address _treasury) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, initialGovernor);
        _setupRole(MANAGER_ROLE, initialGovernor);

        treasury = _treasury;

        // Register built-in strategies
        _registerLidoStrategy();
        _registerUniswapStrategy();
    }

    /// @dev Register Lido staking strategy
    function _registerLidoStrategy() internal returns (uint256) {
        uint256 id = 1;
        strategies[id] = StrategyState({
            isActive: true,
            allocationBps: 10000,
            totalAllocated: 0,
            totalHarvested: 0,
            lastReportedValue: 0
        });
        strategyCount = 2;
        emit StrategyCreated(id, address(lidoStrategy), "Lido Staking", 10000);
        return id;
    }

    /// @dev Register Uniswap V2 LP strategy
    function _registerUniswapStrategy() internal returns (uint256) {
        uint256 id = 2;
        strategies[id] = StrategyState({
            isActive: false,
            allocationBps: 0,
            totalAllocated: 0,
            totalHarvested: 0,
            lastReportedValue: 0
        });
        emit StrategyCreated(id, address(0), "Uniswap V2 LP", 0);
        return id;
    }

    /// @notice Allocate incoming funds to active strategies
    /// @param amount Total ETH amount to allocate
    function allocate(uint256 amount) external onlyRole(MANAGER_ROLE) {
        require(amount > 0, "Zero amount");

        uint256 totalAllocation = 0;
        for (uint256 i = 1; i <= strategyCount; i++) {
            StrategyState storage s = strategies[i];
            if (s.isActive) {
                uint256 allocation = amount.mul(s.allocationBps).div(10000);
                totalAllocation = totalAllocation.add(allocation);
            }
        }

        require(totalAllocation <= amount, "Invalid total allocation");

        // Execute allocations
        for (uint256 i = 1; i <= strategyCount; i++) {
            StrategyState storage s = strategies[i];
            if (s.isActive && s.allocationBps > 0) {
                uint256 allocation = amount.mul(s.allocationBps).div(10000);
                _allocateToStrategy(i, allocation);
            }
        }
    }

    /// @dev Allocate to a specific strategy
    function _allocateToStrategy(uint256 strategyId, uint256 amount) internal {
        StrategyState storage s = strategies[strategyId];

        if (strategyId == 1 && address(lidoStrategy) != address(0)) {
            // Lido: direct stake using the main Lido contract
            // Treasury contract should transfer ETH to this manager and this manager stakes
            // Simplified: assume Lido is directly accessible or use adapter
        } else if (strategyId == 2 && address(uniswapStrategy) != address(0)) {
            // Uniswap LP
            // This would call into UniswapRouter to add liquidity
        }

        s.totalAllocated = s.totalAllocated.add(amount);
        emit StrategyAllocated(strategyId, treasury, amount);
    }

    /// @notice Harvest returns from strategies back to treasury
    /// Rebalances portfolio if needed
    function harvest() external onlyRole(MANAGER_ROLE) {
        for (uint256 i = 1; i <= strategyCount; i++) {
            StrategyState storage s = strategies[i];
            if (s.isActive) {
                _harvestStrategy(i, s);
            }
        }
    }

    /// @dev Harvest from a specific strategy
    function _harvestStrategy(uint256 strategyId, StrategyState storage s) internal {
        uint256 harvested = 0;

        if (strategyId == 1) {
            // Lido: withdraw some staked ETH if rebalancing needed
            // For now, we keep it staked
        } else if (strategyId == 2) {
            // Uniswap: collect fees and optionally remove some liquidity
        }

        if (harvested > 0) {
            // Return to treasury
            s.totalHarvested = s.totalHarvested.add(harvested);
            emit StrategyHarvested(strategyId, treasury, harvested);
        }
    }

    /// @notice Update strategy allocation percentages
    function setStrategyAllocation(uint256 strategyId, uint256 allocationBps) external onlyRole(MANAGER_ROLE) {
        require(strategyId <= strategyCount, "Invalid strategy");
        require(allocationBps <= 10000, "Invalid allocation");

        StrategyState storage s = strategies[strategyId];
        s.allocationBps = allocationBps;
        s.isActive = allocationBps > 0;

        emit StrategyUpdated(strategyId, s.isActive, allocationBps);
    }

    /// @notice Get performance metrics for a strategy
    function getStrategyMetrics(uint256 strategyId)
        external
        view
        returns (
            bool isActive,
            uint256 allocationBps,
            uint256 totalAllocated,
            uint256 totalHarvested,
            uint256 currentValue,
            uint256 apy
        )
    {
        require(strategyId <= strategyCount, "Invalid strategy");
        StrategyState memory s = strategies[strategyId];

        // In production, query strategy contract for current value
        // This is a stub
        return (
            s.isActive,
            s.allocationBps,
            s.totalAllocated,
            s.totalHarvested,
            0,
            0
        );
    }

    // =====================
    // UUPS Upgradeability
    // =====================

    function _authorizeUpgrade(address newImplementation) internal onlyRole(getDefaultAdminRole()) override {}
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Deploy} from "@openzeppelin/hardhat-upgrades";
import {RevenueShareHook} from "../src/RevenueShareHook.sol";
import {MockSliceSplitter} from "../src/MockSliceSplitter.sol";

interface IPoolManager {
    function unlock(bytes calldata data) external;
    function unlockCallback(bytes calldata data) external returns (bytes memory);
}

interface IUniswapV4Hook {
    function beforeInitialize(IPoolManager memory _poolManager) external;
    function afterInitialize(IPoolManager memory _poolManager) external;
    function beforeAddLiquidity(IPoolManager memory _poolManager) external;
    function afterAddLiquidity(IPoolManager memory _poolManager) external;
    function beforeRemoveLiquidity(IPoolManager memory _poolManager) external;
    function afterRemoveLiquidity(IPoolManager memory _poolManager) external;
    function beforeSwap(IPoolManager memory _poolManager) external;
    function afterSwap(IPoolManager memory _poolManager) external;
}

/// @title Deployment Script for Uniswap v4 Hook Revenue Share
/// @notice Deploys RevenueShareHook with configurable parameters
/// @dev Uses Foundry for deployment and configuration

contract Deploy {
    using stdStorage for StdStorage;

    /// @notice Deploy the RevenueShareHook contract
    /// @param ownerAddress Address that will own and manage the hook
    /// @param initialFeeBasisPoints Initial fee percentage in basis points (e.g., 500 = 5%)
    /// @param sliceSplitterAddress Address of deployed Slice payment splitter
    /// @return Address of deployed RevenueShareHook contract
    function deploy(
        address ownerAddress,
        uint256 initialFeeBasisPoints,
        address sliceSplitterAddress
    ) external returns (address) {
        // Validate parameters
        require(ownerAddress != address(0), "Invalid owner address");
        require(initialFeeBasisPoints <= 10000, "Fee percentage cannot exceed 100%");
        require(sliceSplitterAddress != address(0), "Invalid Slice splitter address");

        // Deploy the hook contract
        RevenueShareHook hook = new RevenueShareHook(ownerAddress);
        
        // Set initial configuration
        hook.setPaymentSplitter(sliceSplitterAddress);
        hook.setFeePercentage(initialFeeBasisPoints);

        return address(hook);
    }

    /// @notice Deploy with default parameters (for testing)
    /// @param ownerAddress Address that will own and manage the hook
    /// @return Address of deployed RevenueShareHook contract
    function deployDefault(address ownerAddress) external returns (address) {
        // Default: 5% fee, mock Slice splitter
        MockSliceSplitter sliceSplitter = new MockSliceSplitter();
        
        // Add default contributors with equal shares
        sliceSplitter.addContributor(ownerAddress, 3333); // 33.33%
        sliceSplitter.addContributor(address(0xA), 3333); // 33.33%
        sliceSplitter.addContributor(address(0xB), 3334); // 33.34%

        return deploy(ownerAddress, 500, address(sliceSplitter));
    }

    /// @notice Configure the hook after deployment
    /// @param hookAddress Address of deployed RevenueShareHook contract
    /// @param ownerAddress New owner address (if changing)
    /// @param newFeeBasisPoints New fee percentage in basis points
    /// @param newSliceSplitterAddress New Slice splitter address
    function configure(
        address hookAddress,
        address ownerAddress,
        uint256 newFeeBasisPoints,
        address newSliceSplitterAddress
    ) external {
        // Validate hook exists
        require(hookAddress != address(0), "Invalid hook address");

        RevenueShareHook hook = RevenueShareHook(hookAddress);

        // Configure if parameters are provided
        if (ownerAddress != address(0)) {
            hook.transferOwnership(ownerAddress);
        }

        if (newFeeBasisPoints > 0 && newFeeBasisPoints <= 10000) {
            hook.setFeePercentage(newFeeBasisPoints);
        }

        if (newSliceSplitterAddress != address(0)) {
            hook.setPaymentSplitter(newSliceSplitterAddress);
        }
    }

    /// @notice Add contributors to the hook
    /// @param hookAddress Address of deployed RevenueShareHook contract
    /// @param contributors Array of contributor addresses
    /// @param shares Array of share percentages in basis points
    /// @param categories Array of category strings for each contributor
    function addContributors(
        address hookAddress,
        address[] memory contributors,
        uint256[] memory shares,
        string[] memory categories
    ) external {
        require(contributors.length == shares.length, "Contributors and shares must match");
        require(contributors.length == categories.length, "Contributors and categories must match");

        RevenueShareHook hook = RevenueShareHook(hookAddress);

        for (uint256 i = 0; i < contributors.length; i++) {
            if (contributors[i] != address(0)) {
                hook.addContributor(contributors[i], shares[i], categories[i]);
            }
        }
    }

    /// @notice Remove a contributor from the hook
    /// @param hookAddress Address of deployed RevenueShareHook contract
    /// @param contributorAddress Address to remove
    function removeContributor(
        address hookAddress,
        address contributorAddress
    ) external {
        require(contributorAddress != address(0), "Invalid contributor address");
        
        RevenueShareHook hook = RevenueShareHook(hookAddress);
        hook.removeContributor(contributorAddress);
    }

    /// @notice Update a contributor's share
    /// @param hookAddress Address of deployed RevenueShareHook contract
    /// @param contributorAddress Address to update
    /// @param newShareBasisPoints New share percentage in basis points
    function updateContributorShare(
        address hookAddress,
        address contributorAddress,
        uint256 newShareBasisPoints
    ) external {
        require(contributorAddress != address(0), "Invalid contributor address");
        require(newShareBasisPoints > 0 && newShareBasisPoints <= 10000, "Invalid share percentage");

        RevenueShareHook hook = RevenueShareHook(hookAddress);
        hook.updateContributorShare(contributorAddress, newShareBasisPoints);
    }

    /// @notice Emergency withdrawal of contract balance
    /// @param hookAddress Address of deployed RevenueShareHook contract
    function emergencyWithdraw(address hookAddress) external {
        RevenueShareHook hook = RevenueShareHook(hookAddress);
        hook.emergencyWithdraw();
    }

    /// @notice Get hook statistics
    /// @param hookAddress Address of deployed RevenueShareHook contract
    /// @return collectedFees, distributedFees, feePercentage, contributorCount
    function getStats(address hookAddress) external view returns (
        uint256,
        uint256,
        uint256,
        uint256
    ) {
        RevenueShareHook hook = RevenueShareHook(hookAddress);
        return hook.getStats();
    }

    /// @notice Get contributor information
    /// @param hookAddress Address of deployed RevenueShareHook contract
    /// @param contributorAddress Address to query
    /// @return account, shareBasisPoints, accumulatedFees, isActive
    function getContributorInfo(
        address hookAddress,
        address contributorAddress
    ) external view returns (
        address,
        uint256,
        uint256,
        bool
    ) {
        RevenueShareHook hook = RevenueShareHook(hookAddress);
        return hook.getContributor(contributorAddress);
    }

    /// @notice Get all contributors
    /// @param hookAddress Address of deployed RevenueShareHook contract
    /// @return accounts, shares, fees
    function getAllContributors(
        address hookAddress
    ) external view returns (
        address[] memory,
        uint256[] memory,
        uint256[] memory
    ) {
        RevenueShareHook hook = RevenueShareHook(hookAddress);
        return hook.getAllContributors();
    }
}
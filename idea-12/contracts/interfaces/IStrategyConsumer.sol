// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IStrategyConsumer {
    /// @notice Execute rebalance (reallocate between token and underlying)
    function executeRebalance(uint256 amount) external returns (uint256);

    /// @notice Harvest returns and return to caller
    function harvest() external returns (uint256);

    /// @notice Get current value of the strategy in ETH
    function getCurrentValue() external view returns (uint256);

    /// @notice Get total allocated to this strategy
    function getAllocated() external view returns (uint256);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Safe math operations for fee calculations with overflow protection
library FeeMath {
    /// @notice Add two numbers with overflow check
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "FeeMath: addition overflow");
        return c;
    }

    /// @notice Subtract two numbers with underflow check
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "FeeMath: subtraction underflow");
        return a - b;
    }

    /// @notice Multiply two numbers with overflow check
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        require(c / a == b, "FeeMath: multiplication overflow");
        return c;
    }

    /// @notice Divide with rounding toward zero
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "FeeMath: division by zero");
        return a / b;
    }

    /// @notice Return the larger of two numbers
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    /// @notice Return the smaller of two numbers
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a <= b ? a : b;
    }

    /// @notice Calculate percentage: (value * percentage) / 100
    /// @dev Uses basis points (percentage / 100) for precision
    function calculatePercentage(
        uint256 value,
        uint256 basisPoints
    ) internal pure returns (uint256) {
        require(basisPoints <= 10000, "FeeMath: basis points exceed 10000");
        return value.mul(basisPoints).div(10000);
    }

    /// @notice Distribute amount proportionally across shares
    /// @return Individual share amounts based on contributor share
    function distributeProportionally(
        uint256 totalAmount,
        uint256 totalShares,
        uint256 contributorShares
    ) internal pure returns (uint256) {
        if (contributorShares == 0) {
            return 0;
        }
        if (totalShares == 0) {
            revert("FeeMath: total shares is zero");
        }
        return totalAmount.mul(contributorShares).div(totalShares);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IUniswapV2Pair {
    /// @notice Get the reserves of the pair
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    /// @notice Get the total supply of LP tokens
    function totalSupply() external view returns (uint);

    /// @notice Burn LP tokens and receive the underlying tokens
    /// @param amount The amount of LP tokens to burn
    /// @return amount0 The amount of token0 received
    /// @return amount1 The amount of token1 received
    function burn(uint amount) external returns (uint amount0, uint amount1);

    /// @notice Get the token0 and token1 addresses
    function token0() external view returns (address);
    function token1() external view returns (address);
}
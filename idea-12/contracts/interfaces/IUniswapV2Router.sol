// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IUniswapV2Router {
    /// @notice Swaps exact ETH for tokens
    /// @param amountIn The amount of ETH to swap
    /// @param amountOutMin Minimum amount of tokens to receive
    /// @param path Path of the swap
    /// @param to Address to receive the tokens
    /// @param deadline Time after which the transaction can no longer be executed
    /// @return amounts0LastId The amount of tokens bought
    function swapExactETHForTokens(
        uint amountIn,
        uint[] calldata amountOut,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);

    /// @notice Get ETH price in terms of tokens
    /// @param token The token to get the price of
    /// @return The amount of ETH that can be bought with one token
    function quoteETHInput(uint amountIn, address token) external view returns (uint amountOut);

    /// @notice Get ETH price in terms of tokens (output)
    /// @param amountOut The amount of tokens to buy
    /// @param token The token to get the price of
    /// @return The amount of ETH needed to buy the tokens
    function quoteETHOutput(uint amountOut, address token) external view returns (uint amountIn);

    /// @notice Create a pair between two tokens
    /// @param tokenA The first token
    /// @param tokenB The second token
    /// @return The address of the created pair
    function createPair(address tokenA, address tokenB) external returns (address pair);

    /// @notice Get the factory address
    function factory() external view returns (address);

    /// @notice Get the WETH address
    function WETH() external view returns (address);

    /// @notice Add liquidity with ETH
    /// @param token The token to add liquidity for
    /// @param amountTokenDesired The desired amount of token
    /// @param amountTokenMin Minimum amount of token to add
    /// @param amountETHMin Minimum amount of ETH to add
    /// @param to Address to receive LP tokens
    /// @param deadline Time after which the transaction can no longer be executed
    /// @return The amount of token actually added
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

    /// @notice Remove liquidity with ETH
    /// @param token The token to remove liquidity from
    /// @param liquidity The amount of liquidity to remove
    /// @param amountTokenMin Minimum amount of token to receive
    /// @param amountETHMin Minimum amount of ETH to receive
    /// @param to Address to receive the tokens
    /// @param deadline Time after which the transaction can no longer be executed
    /// @return The amount of token and ETH actually received
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);

    /// @notice Get the reserves of a pair
    /// @param pair The pair address
    /// @return The reserves of the pair
    function getReserves(address pair) external view returns (uint reserveA, uint reserveB, uint blockTimestampLast);
}
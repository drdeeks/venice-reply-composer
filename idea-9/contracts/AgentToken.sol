// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title AgentToken
 * @dev Simple ERC20 token representing ownership of an AI agent.
 * In production, this would be the actual Virtuals AI agent token contract.
 */
contract AgentToken is ERC20 {
    uint8 private _decimals;
    
    constructor(
        uint256 initialSupply,
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals
    ) ERC20(tokenName, tokenSymbol) {
        _decimals = tokenDecimals;
        _mint(msg.sender, initialSupply * 10 ** tokenDecimals);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // Mint new tokens (onlyOwner in production)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
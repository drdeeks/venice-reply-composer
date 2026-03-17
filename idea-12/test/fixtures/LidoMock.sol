// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LidoMock {
    mapping(address => uint256) public shares;
    uint256 public totalShares;
    uint256 private constant SHARES_RATIO = 99; // 1 ETH = 0.99 shares

    event Staked(address indexed from, uint256 amount);
    event Withdrawn(address indexed from, address to, uint256 shares, uint256 amount);

    /// @notice Simulate Lido staking
    receive() external payable {
        totalShares += ethToShares(msg.value);
        shares[msg.sender] += ethToShares(msg.value);
        emit Staked(msg.sender, msg.value);
    }

    /// @notice Stake ETH (via fallback receive)
    function stake() external payable {}

    /// @notice Convert ETH to shares
    function ethToShares(uint256 amount) public view returns (uint256) {
        return amount.mul(SHARES_RATIO) / 100;
    }

    /// @notice Convert shares to ETH
    function sharesToETH(uint256 _shares) public view returns (uint256) {
        return _shares.mul(100) / SHARES_RATIO;
    }

    /// @notice Withdraw staked ETH
    function withdraw(uint256 sharesToBurn) external {
        uint256 senderShares = shares[msg.sender];
        require(senderShares >= sharesToBurn, "Insufficient shares");

        uint256 amount = sharesToETH(sharesToBurn);

        shares[msg.sender] -= sharesToBurn;
        totalShares -= sharesToBurn;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(msg.sender, msg.sender, sharesToBurn, amount);
    }

    /// @notice Get total pooled ETH
    function getTotalPooledEther() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get total shares
    function totalShares() external view returns (uint256) {
        return totalShares;
    }

    /// @notice Get user shares
    function getUserShares(address user) external view returns (uint256) {
        return shares[user];
    }
}
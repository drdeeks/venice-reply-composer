// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILido {
    /// @notice Deposit ETH to the beacon chain
    /// @param _referral Referral address (address(0) for none)
    /// @return Amount of shares minted
    function submit(address _referral) external payable returns (uint256);

    /// @notice Deposit multiple ETH amounts in a batch
    /// @param _referrals Array of referral addresses
    /// @param _amounts Array of ETH amounts (in wei)
    /// @return Total amount of shares minted
    function submitMany(
        address[] calldata _referrals,
        uint256[] calldata _amounts
    ) external payable returns (uint256);

    /// @notice Convert shares to ETH amount
    /// @param _shares Amount of shares to convert
    /// @return Equivalent ETH amount (in wei)
    function sharesToETH(uint256 _shares) external view returns (uint256);

    /// @notice Convert ETH amount to shares
    /// @param _amount ETH amount to convert (in wei)
    /// @return Equivalent shares amount
    function ethToShares(uint256 _amount) external view returns (uint256);

    /// @notice Get total pooled ETH
    function getTotalPooledEther() external view returns (uint256);

    /// @notice Get buffered ETH (waiting to be deposited to beacon chain)
    function getBufferedEther() external view returns (uint256);

    /// @notice Get total shares minted
    function totalShares() external view returns (uint256);

    /// @notice Event emitted when ETH is staked
    event submitted(address indexed from, uint256 amount, uint256 shares, address referral);

    /// @notice Event emitted when shares are burned for withdrawal
    event withdrawn(address indexed from, uint256 shares, uint256 amount);
}
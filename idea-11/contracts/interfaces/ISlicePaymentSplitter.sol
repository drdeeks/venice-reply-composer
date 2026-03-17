// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Interface for Slice payment splitter contract
/// @dev This is a simplified interface matching typical payment splitter patterns
/// In production, this should be replaced with the actual Slice contract interface
interface ISlicePaymentSplitter {
    /// @notice Distribute funds to all contributors according to their shares
    /// @param amount Amount to distribute (in wei)
    function distribute(uint256 amount) external payable;

    /// @notice Add a new contributor with a share percentage
    /// @param contributor Address of the contributor
    /// @param shareBasisPoints Share in basis points (1/100 of 1%)
    function addContributor(address contributor, uint256 shareBasisPoints) external;

    /// @notice Remove a contributor
    /// @param contributor Address to remove
    function removeContributor(address contributor) external;

    /// @notice Get the share percentage of a contributor (in basis points)
    /// @param contributor Address to query
    /// @return Share basis points
    function getShare(address contributor) external view returns (uint256);

    /// @notice Get total shares (should equal 10000 basis points = 100%)
    /// @return Total share basis points
    function getTotalShares() external view returns (uint256);

    /// @notice Get number of contributors
    /// @return Contributor count
    function getContributorCount() external view returns (uint256);

    /// @notice Get contributor address by index (1-based)
    /// @param index Contributor index (1 to count)
    /// @return Contributor address
    function getContributor(uint256 index) external view returns (address);
}
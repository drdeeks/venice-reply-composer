// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISlicePaymentSplitter.sol";

/// @dev Mock implementation of Slice payment splitter for local testing
/// In production, replace with actual Slice contract address
contract MockSliceSplitter is ISlicePaymentSplitter {
    mapping(address => uint256) public shares;
    uint256 public totalShares;
    address[] public contributorList;

    event MockDistribute(address indexed from, uint256 amount);
    event MockAdded(address indexed contributor, uint256 share);
    event MockRemoved(address indexed contributor);
    event MockWithdrawal(address indexed to, uint256 amount);

    constructor() {
        // Initialize with no contributors
    }

    /// @notice Distribute funds (mock implementation)
    function distribute(uint256 amount) external override {
        require(msg.sender != address(0), "No caller");
        require(amount > 0, "No amount to distribute");

        emit MockDistribute(msg.sender, amount);
        
        // In a real implementation, this would split among contributors
        // For testing we just emit the event
    }

    /// @notice Add a new contributor
    function addContributor(address contributor, uint256 shareBasisPoints) external override {
        require(contributor != address(0), "Invalid contributor");
        require(shareBasisPoints > 0, "Zero share");
        
        // Don't allow duplicates
        require(shares[contributor] == 0, "Contributor already exists");
        
        shares[contributor] = shareBasisPoints;
        totalShares += shareBasisPoints;
        contributorList.push(contributor);
        
        emit MockAdded(contributor, shareBasisPoints);
    }

    /// @notice Remove a contributor
    function removeContributor(address contributor) external override {
        uint256 share = shares[contributor];
        require(share > 0, "Contributor not found");
        
        totalShares -= share;
        shares[contributor] = 0;
        
        emit MockRemoved(contributor);
    }

    /// @notice Get share of a contributor
    function getShare(address contributor) external view override returns (uint256) {
        return shares[contributor];
    }

    /// @notice Get total shares
    function getTotalShares() external view override returns (uint256) {
        return totalShares;
    }

    /// @notice Get contributor count
    function getContributorCount() external view override returns (uint256) {
        return contributorList.length;
    }

    /// @notice Get contributor at index
    function getContributor(uint256 index) external view override returns (address) {
        require(index < contributorList.length, "Index out of bounds");
        return contributorList[index];
    }

    /// @notice Withdraw funds (for testing)
    function withdraw(address payable to, uint256 amount) external {
        require(amount > 0, "No amount");
        require(address(this).balance >= amount, "Insufficient balance");
        
        to.transfer(amount);
        emit MockWithdrawal(to, amount);
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
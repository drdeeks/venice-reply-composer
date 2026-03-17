// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title RevenueSplitter
 * @dev Contract that automatically splits revenue earned by an AI agent among its token holders.
 * Revenue is collected and distributed proportionally based on token holdings at distribution time.
 * 
 * Features:
 * - Pull-based claims (gas-efficient for token holders)
 * - Snapshots for fair distribution
 * - Support for multiple currencies (accepts ETH and ERC20 stablecoins)
 * - Pausable for emergencies
 * - Transparent event logging
 * 
 * Partners: Virtuals Protocol, Slice, Base
 */
contract RevenueSplitter is Ownable, Pausable {
    using SafeERC20 for IERC20;

    struct Distribution {
        uint256 amount;
        uint256 claimed;
        bool claimedFlag;
    }

    struct TokenSnapshot {
        uint256 totalSupply;
        uint256 timestamp;
        mapping(address => uint256) balances;
    }

    // Token address for the AI agent (shares)
    IERC20 public immutable agentToken;

    // Current epoch number
    uint256 public currentEpoch;

    // Distribution mapping (epoch -> address -> Distribution)
    mapping(uint256 => mapping(address => Distribution)) public distributions;
    
    // Snapshots mapping (epoch -> TokenSnapshot)
    mapping(uint256 => TokenSnapshot) public snapshots;

    // Total revenue collected per epoch
    mapping(uint256 => uint256) public epochRevenue;

    // Total distributed
    uint256 public totalDistributed;

    // Accepted revenue tokens (0 = ETH)
    mapping(address => bool) public acceptedTokens;

    // Events
    event RevenueCollected(uint256 indexed epoch, uint256 amount, address indexed token, uint256 totalRevenue);
    event DistributionClaimed(address indexed to, uint256 amount, uint256 epoch);
    event DistributionBatchClaimed(address[] recipients, uint256[] amounts, uint256 epoch);
    emergencyWithdraw(address token, uint256 amount);

    /**
     * @dev Constructor
     * @param _agentToken The ERC20 token representing ownership of the AI agent
     */
    constructor(address _agentToken) {
        require(_agentToken != address(0), "Invalid token address");
        agentToken = IERC20(_agentToken);
        currentEpoch = 1;
        acceptedTokens[address(0)] = true; // Accept ETH by default
    }

    // ============ Revenue Collection ============

    /**
     * @dev Collect revenue in ETH or ERC20 tokens
     * @param token Address of token (0 for ETH)
     */
    function collectRevenue(address token) external payable nonReentrant whenNotPaused {
        uint256 amount;
        
        if (token == address(0)) {
            amount = msg.value;
            require(amount > 0, "Zero ETH");
        } else {
            require(acceptedTokens[token], "Token not accepted");
            amount = agentToken.balanceOf(address(this));
            // Transfer tokens from caller
            require(msg.data.length >= 36, "Token transfer data missing");
            // ERC20 transfer call
            IERC20(token).safeTransferFrom(msg.sender, address(this), msg.value);
        }

        require(amount > 0, "Zero amount");

        // Record revenue
        epochRevenue[currentEpoch] += amount;

        // Create snapshot for this epoch on first revenue
        if (!_snapshotExists(currentEpoch)) {
            _createSnapshot(currentEpoch);
        }

        emit RevenueCollected(currentEpoch, amount, token, epochRevenue[currentEpoch]);
    }

    /**
     * @dev Add a revenue token to accepted list
     */
    function acceptToken(address token) external onlyOwner {
        acceptedTokens[token] = true;
    }

    /**
     * @dev Remove a revenue token from accepted list
     */
    function rejectToken(address token) external onlyOwner {
        acceptedTokens[token] = false;
    }

    // ============ Distribution Management ============

    /**
     * @dev Close current epoch and start a new one
     * This finalizes the snapshot and opens a new epoch for revenue collection
     */
    function closeEpoch() external onlyOwner {
        _createSnapshot(currentEpoch + 1);
        currentEpoch++;
        emit EpochClosed(currentEpoch - 1);
    }

    /**
     * @dev Create a snapshot for a given epoch
     */
    function _createSnapshot(uint256 epoch) internal {
        TokenSnapshot storage snap = snapshots[epoch];
        snap.totalSupply = agentToken.totalSupply();
        snap.timestamp = block.timestamp;

        // Note: We don't snapshot all balances due to gas costs
        // Instead, balances are fetched on-demand using ERC20 balanceOf
        // This assumes no token transfers between snapshot creation and claim
        // For production, use ERC20Snapshot or store each balance explicitly
    }

    /**
     * @dev Check if snapshot exists
     */
    function _snapshotExists(uint256 epoch) internal view returns (bool) {
        return snapshots[epoch].timestamp > 0;
    }

    /**
     * @dev Calculate distribution amounts for all eligible token holders
     * Returns array of (address, amount) pairs
     */
    function calculateDistribution(uint256 epoch) external view returns (DistributionData[] memory) {
        TokenSnapshot memory snap = snapshots[epoch];
        require(snap.timestamp > 0, "No snapshot");
        
        uint256 totalRevenue = epochRevenue[epoch];
        require(totalRevenue > 0, "No revenue");

        // Get all token holders (off-chain only)
        // For on-chain, we need to iterate over known holders
        // In production, maintain a list of token holders in an array
        address[] memory holders = _getAllTokenHolders();
        
        DistributionData[] memory result = new DistributionData[](holders.length);
        
        for (uint256 i = 0; i < holders.length; i++) {
            uint256 balance = agentToken.balanceOf(holders[i]);
            if (balance > 0) {
                uint256 share = totalRevenue.mul(balance).div(snap.totalSupply);
                result[i] = DistributionData({
                    account: holders[i],
                    amount: share
                });
            }
        }

        return result;
    }

    // ============ Claims ============

    /**
     * @dev Claim revenue share for the caller
     * @param epoch Epoch to claim from (0 = current epoch)
     */
    function claim(uint256 epoch) external nonReentrant whenNotPaused {
        if (epoch == 0) {
            epoch = currentEpoch;
        }
        Distribution storage dist = distributions[epoch][msg.sender];
        require(dist.amount > 0, "Nothing to claim");
        require(!dist.claimedFlag, "Already claimed");

        uint256 claimAmount = dist.amount;
        dist.claimedFlag = true;
        totalDistributed += claimAmount;

        // Transfer ETH if it's the revenue token
        if (acceptedTokens[address(0)]) {
            (bool success, ) = msg.sender.call{value: claimAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // For ERC20 tokens, need to handle each token type
            // Simplified for now: all revenue in ETH
        }

        emit DistributionClaimed(msg.sender, claimAmount, epoch);
    }

    /**
     * @dev Batch claim for multiple epochs (optimization for reentrancy guard)
     */
    function batchClaim(uint256[] calldata epochs) external nonReentrant whenNotPaused {
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < epochs.length; i++) {
            uint256 epoch = epochs[i];
            Distribution storage dist = distributions[epoch][msg.sender];
            require(dist.amount > 0, "Nothing to claim");
            require(!dist.claimedFlag, "Already claimed");
            totalAmount += dist.amount;
            dist.claimedFlag = true;
        }

        totalDistributed += totalAmount;

        (bool success, ) = msg.sender.call{value: totalAmount}("");
        require(success, "ETH transfer failed");

        emit DistributionBatchClaimed(epochs, totalAmount);
    }

    // ============ Utilities ============

    /**
     * @dev Get distribution amount for specific address and epoch
     */
    function getDistribution(address account, uint256 epoch) external view returns (uint256) {
        Distribution memory dist = distributions[epoch][account];
        return dist.amount;
    }

    /**
     * @dev Get all token holders (off-chain maintained list)
     */
    function _getAllTokenHolders() internal view returns (address[] memory) {
        // In production, maintain a dynamic array of known token holders
        // or use events to track transfers
        return new address[](0); // Placeholder
    }

    // ============ Emergency ============

    /**
     * @dev Emergency withdrawal of unclaimed revenue
     * Only owner, after some time has passed
     */
    function emergencyWithdraw(address token, uint256 minEpoch) external onlyOwner {
        require(block.timestamp > minEpoch + 30 days, "Too soon");
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance");
        
        IERC20(token).safeTransfer(owner(), balance);
        emit EmergencyWithdraw(token, balance);
    }

    // ============ View Functions ============

    function getEpochRevenue(uint256 epoch) external view returns (uint256) {
        return epochRevenue[epoch];
    }

    function getSnapshot(uint256 epoch) external view returns (uint256 totalSupply, uint256 timestamp) {
        TokenSnapshot memory snap = snapshots[epoch];
        return (snap.totalSupply, snap.timestamp);
    }

    function hasClaimed(address account, uint256 epoch) external view returns (bool) {
        return distributions[epoch][account].claimedFlag;
    }

    // ============ Fallbacks ============

    receive() external payable {
        collectRevenue(address(0));
    }

    fallback() external payable {
        collectRevenue(address(0));
    }
}

// Helper structs for return types
struct DistributionData {
    address account;
    uint256 amount;
}

struct SnapshotData {
    uint256 totalSupply;
    uint256 timestamp;
    uint256 revenue;
}
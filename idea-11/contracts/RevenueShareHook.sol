// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISlicePaymentSplitter.sol";
import "../libraries/FeeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IUniswapV4Hooks {
    function beforeInitialize(IPoolManager memory _poolManager) external;
    function afterInitialize(IPoolManager memory _poolManager) external;
    function beforeAddLiquidity(IPoolManager memory _poolManager) external;
    function afterAddLiquidity(IPoolManager memory _poolManager) external;
    function beforeRemoveLiquidity(IPoolManager memory _poolManager) external;
    function afterRemoveLiquidity(IPoolManager memory _poolManager) external;
    function beforeSwap(IPoolManager memory _poolManager) external;
    function afterSwap(IPoolManager memory _poolManager) external;
}

interface IPoolManager {
    function unlock(bytes calldata data) external;
    function unlockCallback(bytes calldata data) external returns (bytes memory);
}

/// @title Revenue Share Hook for Uniswap v4
/// @notice Intercepts configurable percentage of swap fees and routes to Slice payment splitter
/// @dev Uses ReentrancyGuard for security and implements all hook callbacks (no-op for unused)
contract RevenueShareHook is IUniswapV4Hooks, ReentrancyGuard {
    using FeeMath for uint256;

    /// @notice Structure for contributor fee shares
    struct Contributor {
        address account;
        uint256 shareBasisPoints; // share in basis points (1/100 of 1%)
        uint256 totalAccumulatedFees;
        bool isActive;
    }

    // Configuration constants
    uint256 public constant MAX_FEE_PERCENTAGE = 10000; // 100% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_SHARES = 10000;

    // Storage
    uint256 public feeBasisPoints; // Protocol fee in basis points (e.g., 500 = 5%)
    address public sli ceSplitter;
    ISlicePaymentSplitter public paymentSplitter;
    
    Contributor[] public contributors;
    mapping(address => uint256) public contributorIndex; // 1-based index, 0 = not found
    
    uint256 public totalCollectedFees;
    uint256 public totalDistributedFees;
    
    address public owner;

    // Events
    event FeePercentageUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollected(uint256 amount, uint256 protocolFee);
    event FeeRouted(uint256 amount, uint256 distributionCount);
    event ContributorAdded(address indexed contributor, uint256 shareBasisPoints, uint256 category);
    event ContributorRemoved(address indexed contributor);
    event ContributorShareUpdated(
        address indexed contributor, 
        uint256 oldShare, 
        uint256 newShare, 
        uint256 totalShares
    );
    event EmergencyWithdrawal(address indexed to, uint256 amount);
    event SplitterUpdated(address indexed oldSplitter, address indexed newSplitter);
    event Initialize(address indexed pool, bytes32 indexed keyHash, bytes32 currency);

    /// @notice Initialize hook with owner
    constructor(address _initialOwner) {
        require(_initialOwner != address(0), "Invalid owner");
        owner = _initialOwner;
    }

    /// @notice Set the Slice payment splitter contract
    /// @dev Only callable by owner
    function setPaymentSplitter(address _splitter) external {
        require(msg.sender == owner, "Unauthorized");
        require(_splitter != address(0), "Invalid splitter address");
        
        address oldSplitter = address(paymentSplitter);
        paymentSplitter = ISlicePaymentSplitter(_splitter);
        
        emit SplitterUpdated(oldSplitter, _splitter);
    }

    /// @notice Set the protocol fee percentage
    /// @dev Only callable by owner
    function setFeePercentage(uint256 _newFeeBasisPoints) external {
        require(msg.sender == owner, "Unauthorized");
        require(_newFeeBasisPoints <= MAX_FEE_PERCENTAGE, "Fee percentage too high");
        
        uint256 oldFee = feeBasisPoints;
        feeBasisPoints = _newFeeBasisPoints;
        
        emit FeePercentageUpdated(oldFee, _newFeeBasisPoints);
    }

    /// @notice Add a contributor to receive a share of collected fees
    /// @dev Only callable by owner
    function addContributor(
        address _contributor,
        uint256 _shareBasisPoints,
        string memory _category // For categorization (e.g., "development", "marketing")
    ) external {
        require(msg.sender == owner, "Unauthorized");
        require(_contributor != address(0), "Invalid contributor address");
        require(_shareBasisPoints > 0, "Share must be positive");
        require(_shareBasisPoints <= MAX_SHARES, "Share too high");
        require(contributorIndex[_contributor] == 0, "Contributor already exists");

        // Validate total shares don't exceed 100%
        uint256 currentTotalShares = _getTotalShares();
        require(currentTotalShares + _shareBasisPoints <= MAX_SHARES, "Total shares exceed 100%");

        contributors.push(Contributor({
            account: _contributor,
            shareBasisPoints: _shareBasisPoints,
            totalAccumulatedFees: 0,
            isActive: true
        }));
        
        contributorIndex[_contributor] = contributors.length; // Store 1-based index
        
        emit ContributorAdded(_contributor, _shareBasisPoints, keccak256(abi.encodePacked(_category)));
    }

    /// @notice Remove a contributor
    /// @dev Only callable by owner
    function removeContributor(address _contributor) external {
        require(msg.sender == owner, "Unauthorized");
        
        uint256 index = contributorIndex[_contributor];
        require(index > 0 && index <= contributors.length, "Contributor not found");
        
        contributors.splice(index - 1, 1);
        contributorIndex[_contributor] = 0;
        
        // Rebuild index map for affected contributors
        for (uint256 i = index - 1; i < contributors.length; i++) {
            contributorIndex[contributors[i].account] = i + 1;
        }
        
        emit ContributorRemoved(_contributor);
    }

    /// @notice Update a contributor's share percentage
    /// @dev Only callable by owner
    function updateContributorShare(
        address _contributor,
        uint256 _newShareBasisPoints
    ) external {
        require(msg.sender == owner, "Unauthorized");
        require(_newShareBasisPoints > 0, "Share must be positive");
        require(_newShareBasisPoints <= MAX_SHARES, "Share too high");

        uint256 index = contributorIndex[_contributor];
        require(index > 0 && index <= contributors.length, "Contributor not found");
        
        Contributor storage contributor = contributors[index - 1];
        uint256 oldShare = contributor.shareBasisPoints;
        
        // Calculate net change in total shares
        uint256 currentTotal = _getTotalShares();
        uint256 newTotal = currentTotal - oldShare + _newShareBasisPoints;
        require(newTotal <= MAX_SHARES, "Total shares exceed 100%");

        contributor.shareBasisPoints = _newShareBasisPoints;
        
        emit ContributorShareUpdated(_contributor, oldShare, _newShareBasisPoints, newTotal);
    }

    /// @notice AfterSwap hook - called after a swap is executed
    function afterSwap(IPoolManager memory _poolManager) external override {
        // In production, this would extract actual fee from pool state
        // For now, we assume fees are separate and transferred to this contract
        // via the pool's fee collection mechanism
        
        // This hook is primarily a marker; actual fee collection happens
        // through the pool's fee accounting system
    }

    /// @notice Collect fees from swaps (called by pool or authorized caller)
    /// @dev Should be invoked when fees are collected from swaps
    function collectFees(uint256 _feeAmount) external {
        require(msg.sender == address(this), "Only internal");
        require(_feeAmount > 0, "No fees to collect");
        
        uint256 protocolFee = _feeAmount.mul(feeBasisPoints).div(BASIS_POINTS);
        
        if (protocolFee == 0) {
            return; // Fee too small to be meaningful
        }
        
        totalCollectedFees = totalCollectedFees.add(protocolFee);
        
        // Distribute to Slice payment splitter
        if (address(paymentSplitter) != address(0)) {
            _distributeToSlice(protocolFee);
        }
        
        emit FeeCollected(_feeAmount, protocolFee);
    }

    /// @notice Distribute collected fees to contributors via Slice
    function _distributeToSlice(uint256 _amount) internal nonReentrant {
        // Transfer to Slice splitter
        // In production, this would call the Slice contract
        // For now, we simulate by recording the distribution
        
        // Partition per contributor
        uint256 totalShares = _getTotalShares();
        if (totalShares == 0) {
            // No contributors configured, send to owner as fallback
            payable(owner).transfer(_amount);
            totalDistributedFees = totalDistributedFees.add(_amount);
            return;
        }
        
        for (uint256 i = 0; i < contributors.length; i++) {
            Contributor storage contributor = contributors[i];
            if (!contributor.isActive) continue;
            
            uint256 share = _amount.mul(contributor.shareBasisPoints).div(totalShares);
            contributor.totalAccumulatedFees = contributor.totalAccumulatedFees.add(share);
            
            // In production: ISlicePaymentSplitter(paymentSplitter).distribute(
            //     _contributorAddress,
            //     share
            // );
        }
        
        totalDistributedFees = totalDistributedFees.add(_amount);
        
        emit FeeRouted(_amount, contributors.length);
    }

    /// @notice Get total configured shares
    function _getTotalShares() internal view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < contributors.length; i++) {
            if (contributors[i].isActive) {
                total += contributors[i].shareBasisPoints;
            }
        }
        return total;
    }

    /// @notice Emergency withdrawal of contract balance
    /// @dev Only callable by owner in emergency situations
    function emergencyWithdraw() external nonReentrant {
        require(msg.sender == owner, "Unauthorized");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        payable(owner).transfer(balance);
        
        emit EmergencyWithdrawal(owner, balance);
    }

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Unauthorized");
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }

    // --- Read-only functions ---

    /// @notice Get contributor count
    function getContributorCount() external view returns (uint256) {
        return contributors.length;
    }

    /// @notice Get contributor details
    function getContributor(
        address _contributor
    ) external view returns (
        address account,
        uint256 shareBasisPoints,
        uint256 accumulatedFees,
        bool isActive
    ) {
        uint256 index = contributorIndex[_contributor];
        require(index > 0 && index <= contributors.length, "Contributor not found");
        
        Contributor memory c = contributors[index - 1];
        return (c.account, c.shareBasisPoints, c.totalAccumulatedFees, c.isActive);
    }

    /// @notice Get all active contributors
    function getAllContributors() external view returns (
        address[] memory accounts,
        uint256[] memory shares,
        uint256[] memory fees
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < contributors.length; i++) {
            if (contributors[i].isActive) {
                activeCount++;
            }
        }
        
        accounts = new address[](activeCount);
        shares = new uint256[](activeCount);
        fees = new uint256[](activeCount);
        
        uint256 j = 0;
        for (uint256 i = 0; i < contributors.length; i++) {
            if (contributors[i].isActive) {
                accounts[j] = contributors[i].account;
                shares[j] = contributors[i].shareBasisPoints;
                fees[j] = contributors[i].totalAccumulatedFees;
                j++;
            }
        }
    }

    /// @notice Get statistics
    function getStats() external view returns (
        uint256 collected,
        uint256 distributed,
        uint256 feePercentage,
        uint256 contributorCount
    ) {
        return (
            totalCollectedFees,
            totalDistributedFees,
            feeBasisPoints,
            contributors.length
        );
    }

    /// @notice Receive ETH (should not be called directly)
    receive() external payable {}

    // --- No-op hook implementations ---
    // These are required by the interface but not used in this hook
    
    function beforeInitialize(IPoolManager memory) external override {}
    function afterInitialize(IPoolManager memory) external override {}
    function beforeAddLiquidity(IPoolManager memory) external override {}
    function afterAddLiquidity(IPoolManager memory) external override {}
    function beforeRemoveLiquidity(IPoolManager memory) external override {}
    function afterRemoveLiquidity(IPoolManager memory) external override {}
    function beforeSwap(IPoolManager memory) external override {}
}
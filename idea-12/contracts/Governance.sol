// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Governance is
    AccessControl,
    UUPSUpgradeable
{
    using SafeMath for uint256;

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant PROPOSAL_ROLE = keccak256("PROPOSAL_ROLE");

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 executionTime;
        uint256 quorumPercentage; // Basis points
        uint256 yeaPercentage; // Basis points
        uint256 yeaVotes;
        uint256 nayVotes;
        uint256 totalVotes;
        mapping(address => bool) voted;
        bool executed;
        bytes[] actions;
        uint256 creationBlock;
    }

    Proposal[] public proposals;
    mapping(uint256 => Proposal) public proposalById;
    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description);
    event ProposalVoted(uint256 indexed id, address indexed voter, bool support, uint256 shares);
    event ProposalExecuted(uint256 indexed id);

    /// @dev Initialize the governance contract
    function initialize(address initialGovernor) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, initialGovernor);
        _setupRole(GOVERNANCE_ROLE, initialGovernor);
        _setupRole(PROPOSAL_ROLE, initialGovernor);

        proposalCount = 0;
    }

    /// @notice Create a new proposal
    function createProposal(
        string memory description,
        uint256 executionTime,
        uint256 quorumPercentage,
        uint256 yeaPercentage,
        bytes[] memory actions
    ) external onlyRole(PROPOSAL_ROLE) {
        require(executionTime > block.timestamp, "Execution time must be in future");
        require(quorumPercentage > 0 && quorumPercentage <= 10000, "Invalid quorum");
        require(yeaPercentage > 0 && yeaPercentage <= 10000, "Invalid yea percentage");

        proposalCount++;
        uint256 id = proposalCount;

        Proposal memory p = Proposal({
            id: id,
            proposer: msg.sender,
            description: description,
            executionTime: executionTime,
            quorumPercentage: quorumPercentage,
            yeaPercentage: yeaPercentage,
            yeaVotes: 0,
            nayVotes: 0,
            totalVotes: 0,
            voted: mapping(address => bool)(),
            executed: false,
            actions: actions,
            creationBlock: block.number
        });

        proposals.push(p);
        proposalById[id] = p;

        emit ProposalCreated(id, msg.sender, description);
    }

    /// @notice Vote on a proposal
    function vote(uint256 proposalId, bool support, uint256 shares) external {
        Proposal storage p = proposalById[proposalId];
        require(p.id != 0, "Proposal not found");
        require(!p.executed, "Proposal already executed");
        require(block.timestamp < p.executionTime, "Voting period ended");
        require(!p.voted[msg.sender], "Already voted");
        require(shares > 0, "Zero shares");

        // In production, this would check actual token balance
        // Simplified: assume shares = token balance
        p.totalVotes = p.totalVotes.add(shares);

        if (support) {
            p.yeaVotes = p.yeaVotes.add(shares);
        } else {
            p.nayVotes = p.nayVotes.add(shares);
        }

        p.voted[msg.sender] = true;

        emit ProposalVoted(proposalId, msg.sender, support, shares);
    }

    /// @notice Execute a proposal if conditions are met
    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposalById[proposalId];
        require(p.id != 0, "Proposal not found");
        require(!p.executed, "Proposal already executed");
        require(block.timestamp >= p.executionTime, "Too early to execute");

        // Check quorum
        uint256 quorum = p.quorumPercentage.mul(p.totalVotes).div(10000);
        if (quorum > p.totalVotes) {
            revert("Quorum not met");
        }

        // Check yea percentage
        uint256 yeaRequired = p.yeaPercentage.mul(p.totalVotes).div(10000);
        if (p.yeaVotes < yeaRequired) {
            revert("Yea percentage not met");
        }

        // Execute actions
        for (uint256 i = 0; i < p.actions.length; i++) {
            (bool success, ) = address(treasury).call(p.actions[i]);
            require(success, "Action execution failed");
        }

        p.executed = true;
        emit ProposalExecuted(proposalId);
    }

    /// @notice Get proposal details
    function getProposalDetails(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory description,
        uint256 executionTime,
        uint256 quorumPercentage,
        uint256 yeaPercentage,
        uint256 yeaVotes,
        uint256 nayVotes,
        uint256 totalVotes,
        bool executed
    ) {
        Proposal memory p = proposalById[proposalId];
        return (
            p.id,
            p.proposer,
            p.description,
            p.executionTime,
            p.quorumPercentage,
            p.yeaPercentage,
            p.yeaVotes,
            p.nayVotes,
            p.totalVotes,
            p.executed
        );
    }

    // =====================
    // UUPS Upgradeability
    // =====================

    function _authorizeUpgrade(address newImplementation) internal onlyRole(getDefaultAdminRole()) override {}
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

/**
 * @title Verifiable On-Chain Job Board
 * @notice A job board system that integrates with Talent Protocol and Merit Systems
 * to enable trustless credential verification.
 */
contract JobBoard is AccessControl, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMPLOYER_ROLE = keccak256("EMPLOYER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Job status
    enum JobStatus { Active, Filled, Cancelled }

    // Application status
    enum ApplicationStatus { Submitted, UnderReview, Accepted, Rejected }

    // Job posting structure
    struct Job {
        uint256 id;
        string title;
        string description;
        string requirements; // IPFS hash of detailed requirements
        uint256 salaryMin;
        uint256 salaryMax;
        uint256 deadline;
        JobStatus status;
        address employer;
        bytes32[] requiredSkillAttestations; // Merit attestation IDs
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Candidate profile structure
    struct Profile {
        address wallet;
        string talentProfileId; // Talent Protocol profile ID
        uint256 builderScore; // Talent Protocol builder score
        bool isVerified;
        bytes32[] skillAttestations; // Merit attestation IDs
        string resumeCid; // IPFS hash of resume
        uint256 lastUpdated;
    }

    // Application structure
    struct Application {
        uint256 id;
        uint256 jobId;
        address candidate;
        string coverLetter;
        string applicationDataCid; // IPFS hash of additional data
        ApplicationStatus status;
        uint256 appliedAt;
        bytes32[] credentialProofs; // ZK proofs or attestation confirmations
    }

    // Storage
    EnumerableMap.UintToAddressMap private _jobs; // jobId => employer
    EnumerableMap.UintToAddressMap private _applications; // applicationId => candidate
    mapping(uint256 => Job) private _jobDetails;
    mapping(uint256 => Application) private _applicationDetails;
    mapping(address => Profile) private _profiles;
    mapping(address => bool) private _employers;
    mapping(uint256 => EnumerableSet.UintSet) private _jobApplications; // jobId => applicationIds

    // Events
    event JobPosted(uint256 indexed jobId, address indexed employer, string title);
    event JobUpdated(uint256 indexed jobId, address indexed employer);
    event JobStatusChanged(uint256 indexed jobId, JobStatus status);
    event JobFilled(uint256 indexed jobId, address indexed candidate);
    event JobCancelled(uint256 indexed jobId, address indexed employer);
    event ProfileCreated(address indexed wallet, string talentProfileId, uint256 builderScore);
    event ProfileUpdated(address indexed wallet, uint256 builderScore);
    event SkillAttestationAdded(address indexed wallet, bytes32 indexed attestationId);
    event ApplicationSubmitted(uint256 indexed applicationId, uint256 indexed jobId, address indexed candidate);
    event ApplicationStatusChanged(uint256 indexed applicationId, ApplicationStatus status);
    event ApplicationWithdrawn(uint256 indexed applicationId, address indexed candidate);

    // Job counters
    uint256 private _jobCounter;
    uint256 private _applicationCounter;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @notice Create or update a candidate profile
     * @param talentProfileId Talent Protocol profile ID
     * @param builderScore Talent Protocol builder score
     * @param skillAttestations Array of Merit attestation IDs
     * @param resumeCid IPFS hash of resume
     */
    function createOrUpdateProfile(
        string memory talentProfileId,
        uint256 builderScore,
        bytes32[] memory skillAttestations,
        string memory resumeCid
    ) external {
        require(talentProfileId.length > 0, "Invalid profile ID");
        require(builderScore > 0, "Invalid builder score");

        Profile storage profile = _profiles[msg.sender];
        profile.wallet = msg.sender;
        profile.talentProfileId = talentProfileId;
        profile.builderScore = builderScore;
        profile.skillAttestations = skillAttestations;
        profile.resumeCid = resumeCid;
        profile.lastUpdated = block.timestamp;

        if (!profile.isVerified) {
            profile.isVerified = true;
            emit ProfileCreated(msg.sender, talentProfileId, builderScore);
        } else {
            emit ProfileUpdated(msg.sender, builderScore);
        }
    }

    /**
     * @notice Post a new job
     * @param title Job title
     * @param description Job description
     * @param requirements IPFS hash of detailed requirements
     * @param salaryMin Minimum salary
     * @param salaryMax Maximum salary
     * @param deadline Application deadline
     * @param requiredSkillAttestations Required Merit attestation IDs
     */
    function postJob(
        string memory title,
        string memory description,
        string memory requirements,
        uint256 salaryMin,
        uint256 salaryMax,
        uint256 deadline,
        bytes32[] memory requiredSkillAttestations
    ) external returns (uint256 jobId) {
        require(hasRole(EMPLOYER_ROLE, msg.sender), "Not authorized");
        require(salaryMin <= salaryMax, "Invalid salary range");
        require(deadline > block.timestamp, "Deadline must be in future");

        _jobCounter++;
        jobId = _jobCounter;

        Job storage job = _jobDetails[jobId];
        job.id = jobId;
        job.title = title;
        job.description = description;
        job.requirements = requirements;
        job.salaryMin = salaryMin;
        job.salaryMax = salaryMax;
        job.deadline = deadline;
        job.status = JobStatus.Active;
        job.employer = msg.sender;
        job.requiredSkillAttestations = requiredSkillAttestations;
        job.createdAt = block.timestamp;
        job.updatedAt = block.timestamp;

        _jobs.set(jobId, msg.sender);

        emit JobPosted(jobId, msg.sender, title);
    }

    /**
     * @notice Update job status
     * @param jobId Job ID
     * @param status New status
     */
    function updateJobStatus(uint256 jobId, JobStatus status) external {
        require(_jobDetails[jobId].employer == msg.sender, "Not authorized");
        Job storage job = _jobDetails[jobId];
        job.status = status;
        job.updatedAt = block.timestamp;

        emit JobStatusChanged(jobId, status);
    }

    /**
     * @notice Fill a job with a candidate
     * @param jobId Job ID
     * @param candidateAddress Candidate wallet address
     */
    function fillJob(uint256 jobId, address candidateAddress) external nonReentrant {
        require(_jobDetails[jobId].employer == msg.sender, "Not authorized");
        require(_jobDetails[jobId].status == JobStatus.Active, "Job not active");

        _jobDetails[jobId].status = JobStatus.Filled;
        _jobDetails[jobId].updatedAt = block.timestamp;

        emit JobFilled(jobId, candidateAddress);
    }

    /**
     * @notice Submit job application
     * @param jobId Job ID
     * @param coverLetter Cover letter
     * @param applicationDataCid IPFS hash of additional application data
     * @param credentialProofs Array of credential proofs (attestation confirmations)
     */
    function applyToJob(
        uint256 jobId,
        string memory coverLetter,
        string memory applicationDataCid,
        bytes32[] memory credentialProofs
    ) external returns (uint256 applicationId) {
        Job storage job = _jobDetails[jobId];
        require(job.status == JobStatus.Active, "Job not active");
        require(block.timestamp < job.deadline, "Application deadline passed");
        require(_profiles[msg.sender].isVerified, "Profile not verified");

        // Verify required skills are attested
        bytes32[] memory requiredSkills = job.requiredSkillAttestations;
        bytes32[] memory candidateSkills = _profiles[msg.sender].skillAttestations;

        for (uint256 i = 0; i < requiredSkills.length; i++) {
            bool hasSkill = false;
            for (uint256 j = 0; j < candidateSkills.length; j++) {
                if (requiredSkills[i] == candidateSkills[j]) {
                    hasSkill = true;
                    break;
                }
            }
            require(hasSkill, "Missing required skill attestation");
        }

        _applicationCounter++;
        applicationId = _applicationCounter;

        Application storage application = _applicationDetails[applicationId];
        application.id = applicationId;
        application.jobId = jobId;
        application.candidate = msg.sender;
        application.coverLetter = coverLetter;
        application.applicationDataCid = applicationDataCid;
        application.status = ApplicationStatus.Submitted;
        application.appliedAt = block.timestamp;
        application.credentialProofs = credentialProofs;

        _applications.set(applicationId, msg.sender);
        _jobApplications.get(jobId).add(applicationId);

        emit ApplicationSubmitted(applicationId, jobId, msg.sender);
    }

    /**
     * @notice Update application status
     * @param applicationId Application ID
     * @param status New status
     */
    function updateApplicationStatus(
        uint256 applicationId,
        ApplicationStatus status
    ) external {
        Application storage application = _applicationDetails[applicationId];
        require(
            _jobDetails[application.jobId].employer == msg.sender,
            "Not authorized"
        );

        application.status = status;

        emit ApplicationStatusChanged(applicationId, status);

        if (status == ApplicationStatus.Accepted) {
            emit JobFilled(application.jobId, application.candidate);
        }
    }

    /**
     * @notice Verify candidate credentials for a specific job
     * @param jobId Job ID
     * @param candidateAddress Candidate wallet address
     * @return isEligible Whether candidate is eligible
     * @return missingSkills Missing required skills
     */
    function verifyCandidate(
        uint256 jobId,
        address candidateAddress
    )
        external
        view
        returns (
            bool isEligible,
            bytes32[] memory missingSkills
        )
    {
        Job storage job = _jobDetails[jobId];
        Profile storage profile = _profiles[candidateAddress];

        if (!profile.isVerified) {
            return (false, job.requiredSkillAttestations);
        }

        // Check required skills
        for (uint256 i = 0; i < job.requiredSkillAttestations.length; i++) {
            bool hasSkill = false;
            for (uint256 j = 0; j < profile.skillAttestations.length; j++) {
                if (job.requiredSkillAttestations[i] == profile.skillAttestations[j]) {
                    hasSkill = true;
                    break;
                }
            }
            if (!hasSkill) {
                missingSkills.push(job.requiredSkillAttestations[i]);
            }
        }

        isEligible = missingSkills.length == 0;
    }

    /**
     * @notice Get job details
     */
    function getJob(uint256 jobId)
        external
        view
        returns (
            uint256 id,
            string memory title,
            string memory description,
            string memory requirements,
            uint256 salaryMin,
            uint256 salaryMax,
            uint256 deadline,
            JobStatus status,
            address employer,
            bytes32[] memory requiredSkillAttestations,
            uint256 createdAt,
            uint256 updatedAt
        )
    {
        Job storage job = _jobDetails[jobId];
        return (
            job.id,
            job.title,
            job.description,
            job.requirements,
            job.salaryMin,
            job.salaryMax,
            job.deadline,
            job.status,
            job.employer,
            job.requiredSkillAttestations,
            job.createdAt,
            job.updatedAt
        );
    }

    /**
     * @notice Get candidate profile
     */
    function getProfile(address wallet)
        external
        view
        returns (
            address profileWallet,
            string memory talentProfileId,
            uint256 builderScore,
            bool isVerified,
            bytes32[] memory skillAttestations,
            string memory resumeCid,
            uint256 lastUpdated
        )
    {
        Profile storage profile = _profiles[wallet];
        return (
            profile.wallet,
            profile.talentProfileId,
            profile.builderScore,
            profile.isVerified,
            profile.skillAttestations,
            profile.resumeCid,
            profile.lastUpdated
        );
    }

    /**
     * @notice Get application details
     */
    function getApplication(uint256 applicationId)
        external
        view
        returns (
            uint256 id,
            uint256 jobId,
            address candidate,
            string memory coverLetter,
            string memory applicationDataCid,
            ApplicationStatus status,
            uint256 appliedAt,
            bytes32[] memory credentialProofs
        )
    {
        Application storage application = _applicationDetails[applicationId];
        return (
            application.id,
            application.jobId,
            application.candidate,
            application.coverLetter,
            application.applicationDataCid,
            application.status,
            application.appliedAt,
            application.credentialProofs
        );
    }

    /**
     * @notice Get all active jobs
     */
    function getActiveJobs()
        external
        view
        returns (uint256[] memory jobIds)
    {
        uint256 total = _jobs.length();
        jobIds = new uint256[](total);
        for (uint256 i = 0; i < total; i++) {
            jobIds[i] = _jobs.at(i);
        }
    }

    /**
     * @notice Get applications for a job
     */
    function getJobApplications(uint256 jobId)
        external
        view
        returns (uint256[] memory applicationIds)
    {
        return _jobApplications.get(jobId).values();
    }

    /**
     * @notice Admin: Grant role
     */
    function grantRole(bytes32 role, address account) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.grantRole(role, account);
    }

    /**
     * @notice Admin: Revoke role
     */
    function revokeRole(bytes32 role, address account) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.revokeRole(role, account);
    }
}

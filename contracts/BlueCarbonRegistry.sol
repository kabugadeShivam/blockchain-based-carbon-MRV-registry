// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title BlueCarbonRegistry
/// @notice Prototype registry for blue-carbon restoration projects and MRV records.
/// @dev Raw evidence stays off-chain. Only cryptographic hashes and verified outcomes are anchored on-chain.
contract BlueCarbonRegistry is ERC1155, AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct Project {
        uint256 id;
        address owner;
        string name;
        string ecosystem;
        string location;
        string evidenceHash;
        uint256 createdAt;
        bool active;
    }

    struct MRVRecord {
        uint256 id;
        uint256 projectId;
        string evidenceHash;
        uint256 estimatedCredits;
        uint256 verifiedCredits;
        address submittedBy;
        address verifiedBy;
        uint256 submittedAt;
        uint256 verifiedAt;
        bool verified;
    }

    uint256 public nextProjectId = 1;
    uint256 public nextMRVId = 1;

    mapping(uint256 => Project) public projects;
    mapping(uint256 => MRVRecord) public mrvRecords;
    mapping(uint256 => uint256[]) private projectMRVs;
    mapping(uint256 => bool) public creditTokenCreated;

    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name, string evidenceHash);
    event MRVSubmitted(uint256 indexed mrvId, uint256 indexed projectId, string evidenceHash, uint256 estimatedCredits);
    event MRVVerified(uint256 indexed mrvId, uint256 indexed projectId, address indexed verifier, uint256 verifiedCredits);
    event CreditsRetired(uint256 indexed projectId, address indexed account, uint256 amount, string retirementReason);

    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    function registerProject(
        string calldata name,
        string calldata ecosystem,
        string calldata location,
        string calldata evidenceHash
    ) external returns (uint256 projectId) {
        projectId = nextProjectId++;
        projects[projectId] = Project({
            id: projectId,
            owner: msg.sender,
            name: name,
            ecosystem: ecosystem,
            location: location,
            evidenceHash: evidenceHash,
            createdAt: block.timestamp,
            active: true
        });
        emit ProjectRegistered(projectId, msg.sender, name, evidenceHash);
    }

    function submitMRV(
        uint256 projectId,
        string calldata evidenceHash,
        uint256 estimatedCredits
    ) external returns (uint256 mrvId) {
        require(projects[projectId].active, "Project inactive");
        require(projects[projectId].owner == msg.sender || hasRole(VERIFIER_ROLE, msg.sender), "Not project owner");
        require(bytes(evidenceHash).length > 0, "Evidence hash required");
        require(estimatedCredits > 0, "Credits must be positive");

        mrvId = nextMRVId++;
        mrvRecords[mrvId] = MRVRecord({
            id: mrvId,
            projectId: projectId,
            evidenceHash: evidenceHash,
            estimatedCredits: estimatedCredits,
            verifiedCredits: 0,
            submittedBy: msg.sender,
            verifiedBy: address(0),
            submittedAt: block.timestamp,
            verifiedAt: 0,
            verified: false
        });
        projectMRVs[projectId].push(mrvId);
        emit MRVSubmitted(mrvId, projectId, evidenceHash, estimatedCredits);
    }

    function verifyMRV(uint256 mrvId, uint256 verifiedCredits) external onlyRole(VERIFIER_ROLE) {
        MRVRecord storage record = mrvRecords[mrvId];
        require(record.id != 0, "MRV not found");
        require(!record.verified, "Already verified");
        require(verifiedCredits > 0 && verifiedCredits <= record.estimatedCredits, "Invalid credit amount");

        record.verified = true;
        record.verifiedCredits = verifiedCredits;
        record.verifiedBy = msg.sender;
        record.verifiedAt = block.timestamp;

        uint256 projectId = record.projectId;
        creditTokenCreated[projectId] = true;
        _mint(projects[projectId].owner, projectId, verifiedCredits, "");

        emit MRVVerified(mrvId, projectId, msg.sender, verifiedCredits);
    }

    function retireCredits(uint256 projectId, uint256 amount, string calldata reason) external {
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender, projectId) >= amount, "Insufficient credits");
        _burn(msg.sender, projectId, amount);
        emit CreditsRetired(projectId, msg.sender, amount, reason);
    }

    function getProjectMRVs(uint256 projectId) external view returns (uint256[] memory) {
        return projectMRVs[projectId];
    }

    function setVerifier(address account, bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (enabled) {
            _grantRole(VERIFIER_ROLE, account);
        } else {
            _revokeRole(VERIFIER_ROLE, account);
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title BlueCarbonRegistry
/// @notice SIH25038 prototype for a hybrid blue-carbon registry and MRV audit trail.
/// @dev Raw photos, GPS payloads, reports and IoT data stay off-chain. Hashes and verification outcomes are anchored on-chain.
contract BlueCarbonRegistry is ERC1155, AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant NGO_ROLE = keccak256("NGO_ROLE");
    enum ReviewStatus { SUBMITTED, VERIFIED, REJECTED }

    struct Project { uint256 id; address owner; string name; string ecosystem; string location; string evidenceHash; uint256 createdAt; bool active; }
    struct MRVRecord { uint256 id; uint256 projectId; string evidenceHash; string reviewHash; uint256 estimatedCredits; uint256 verifiedCredits; address submittedBy; address reviewedBy; uint256 submittedAt; uint256 reviewedAt; ReviewStatus status; }

    uint256 public nextProjectId = 1;
    uint256 public nextMRVId = 1;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => MRVRecord) public mrvRecords;
    mapping(uint256 => uint256[]) private projectMRVs;
    mapping(uint256 => bool) public creditTokenCreated;

    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name, string evidenceHash);
    event MRVSubmitted(uint256 indexed mrvId, uint256 indexed projectId, string evidenceHash, uint256 estimatedCredits);
    event MRVReviewed(uint256 indexed mrvId, uint256 indexed projectId, address indexed verifier, bool approved, uint256 credits, string reviewHash);
    event CreditsRetired(uint256 indexed projectId, address indexed account, uint256 amount, string retirementReason);

    constructor() ERC1155("") { _grantRole(DEFAULT_ADMIN_ROLE,msg.sender); _grantRole(VERIFIER_ROLE,msg.sender); _grantRole(NGO_ROLE,msg.sender); }

    function registerProject(string calldata name,string calldata ecosystem,string calldata location,string calldata evidenceHash) external onlyRole(NGO_ROLE) returns(uint256 projectId){
        projectId=nextProjectId++; projects[projectId]=Project(projectId,msg.sender,name,ecosystem,location,evidenceHash,block.timestamp,true); emit ProjectRegistered(projectId,msg.sender,name,evidenceHash);
    }

    function submitMRV(uint256 projectId,string calldata evidenceHash,uint256 estimatedCredits) external returns(uint256 mrvId){
        require(projects[projectId].active,"Project inactive"); require(projects[projectId].owner==msg.sender||hasRole(VERIFIER_ROLE,msg.sender),"Not project owner"); require(bytes(evidenceHash).length>0,"Evidence hash required"); require(estimatedCredits>0,"Credits must be positive");
        mrvId=nextMRVId++; mrvRecords[mrvId]=MRVRecord(mrvId,projectId,evidenceHash,"",estimatedCredits,0,msg.sender,address(0),block.timestamp,0,ReviewStatus.SUBMITTED); projectMRVs[projectId].push(mrvId); emit MRVSubmitted(mrvId,projectId,evidenceHash,estimatedCredits);
    }

    function reviewMRV(uint256 mrvId,bool approved,uint256 verifiedCredits,string memory reviewHash) public onlyRole(VERIFIER_ROLE){
        MRVRecord storage record=mrvRecords[mrvId]; require(record.id!=0,"MRV not found"); require(record.status==ReviewStatus.SUBMITTED,"Already reviewed"); require(bytes(reviewHash).length>0,"Review hash required");
        record.reviewHash=reviewHash; record.reviewedBy=msg.sender; record.reviewedAt=block.timestamp;
        if(approved){ require(verifiedCredits>0&&verifiedCredits<=record.estimatedCredits,"Invalid credit amount"); record.status=ReviewStatus.VERIFIED; record.verifiedCredits=verifiedCredits; creditTokenCreated[record.projectId]=true; _mint(projects[record.projectId].owner,record.projectId,verifiedCredits,""); }
        else { record.status=ReviewStatus.REJECTED; record.verifiedCredits=0; }
        emit MRVReviewed(mrvId,record.projectId,msg.sender,approved,verifiedCredits,reviewHash);
    }

    function verifyMRV(uint256 mrvId,uint256 verifiedCredits) external onlyRole(VERIFIER_ROLE){ reviewMRV(mrvId,true,verifiedCredits,"legacy-approval"); }
    function rejectMRV(uint256 mrvId,string calldata reviewHash) external onlyRole(VERIFIER_ROLE){ reviewMRV(mrvId,false,0,reviewHash); }
    function retireCredits(uint256 projectId,uint256 amount,string calldata reason) external { require(amount>0,"Amount must be positive"); require(balanceOf(msg.sender,projectId)>=amount,"Insufficient credits"); _burn(msg.sender,projectId,amount); emit CreditsRetired(projectId,msg.sender,amount,reason); }
    function getProjectMRVs(uint256 projectId) external view returns(uint256[] memory){ return projectMRVs[projectId]; }
    function setVerifier(address account,bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE){ if(enabled)_grantRole(VERIFIER_ROLE,account);else _revokeRole(VERIFIER_ROLE,account); }
    function setNGO(address account,bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE){ if(enabled)_grantRole(NGO_ROLE,account);else _revokeRole(NGO_ROLE,account); }
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155,AccessControl) returns(bool){ return super.supportsInterface(interfaceId); }
}

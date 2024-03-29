// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract BaseMetashipStaking is ERC1155Holder, Ownable { 

    event BaseMetashipStaked(address indexed from, uint indexed stakedAt, string uuid, uint stakedTill);
    event BaseMetashipUnstaked(address indexed to, uint indexed unstakedAt, string uuid, uint stakedTill);

    IERC1155 metashipsAddress;
    mapping(address => mapping(string => uint)) public stakes;
    mapping(address => uint) public addressStakingCount;
    uint256 constant TOKEN_ID = 51271482805962209305201228596472484421057665279277761912030118523405984596968;
    uint32 public stakingCountLimit = 3;
    uint32 oneDayInSeconds = 60*60*24;

    
    function setStakingCountLimit(uint32 newStakingCountLimit) external onlyOwner {
        stakingCountLimit = newStakingCountLimit;
    }

    function setNftContractAddress(address _nftContract) external onlyOwner {
        metashipsAddress = IERC1155(_nftContract);
    }

    function stake1Day(string calldata uuid) external payable {
        require(addressStakingCount[msg.sender] < stakingCountLimit, "Increased staking count limit");
        require(stakes[msg.sender][uuid] == 0, "This metaship is already staked");
        
        uint stakeTill = block.timestamp + oneDayInSeconds;
        metashipsAddress.safeTransferFrom(msg.sender, address(this), TOKEN_ID, 1, "0x0");
        stakes[msg.sender][uuid] = stakeTill;
        addressStakingCount[msg.sender] += 1;
        emit BaseMetashipStaked(msg.sender, block.timestamp, uuid, stakeTill);
    }

    function stake100Day(string calldata uuid) external payable {
        require(addressStakingCount[msg.sender] < stakingCountLimit, "Increased staking count limit");
        require(stakes[msg.sender][uuid] == 0, "This metaship is already staked");

        uint stakeTill = block.timestamp + oneDayInSeconds * 100;
        metashipsAddress.safeTransferFrom(msg.sender, address(this), TOKEN_ID, 1, "0x0");
        stakes[msg.sender][uuid] = stakeTill;
        addressStakingCount[msg.sender] += 1;
        emit BaseMetashipStaked(msg.sender, block.timestamp, uuid, stakeTill);
    }

    function unstake(string calldata uuid) external payable {
        require(stakes[msg.sender][uuid] != 0, 'This metaship has not been set for staking');
        
        uint stakeTill = stakes[msg.sender][uuid];
        metashipsAddress.safeTransferFrom(address(this), msg.sender, TOKEN_ID, 1, "0x0");
        stakes[msg.sender][uuid] = 0;
        addressStakingCount[msg.sender] -= 1;

        emit BaseMetashipUnstaked(msg.sender, block.timestamp, uuid, stakeTill);
    }
}
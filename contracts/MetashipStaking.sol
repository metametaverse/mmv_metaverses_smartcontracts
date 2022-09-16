// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MetashipStaking is Ownable {
    event MetashipStaked(address indexed from, uint indexed tokenId, uint indexed stakedAt, uint stakedTill);
    event MetashipUnstaked(address indexed to, uint indexed tokenId, uint indexed unstakedAt, uint stakedTill);

    IERC721 metashipsAddress;
    mapping(address => mapping(uint => uint)) public stakes;
    mapping(address => uint) public addressStakingCount;
    uint32 public stakingCountLimit = 3;
    uint32 oneDayInSeconds = 60*60*24;

    function setStakingCountLimit(uint32 newStakingCountLimit) external onlyOwner {
        stakingCountLimit = newStakingCountLimit;
    }

    function setNftContractAddress(address _nftContract) external onlyOwner {
        metashipsAddress = IERC721(_nftContract);
    }

    function stake1Day(uint tokenId) external payable {
        require(addressStakingCount[msg.sender] < stakingCountLimit, "Increased staking count limit");
        
        uint stakeTill = block.timestamp + oneDayInSeconds;
        metashipsAddress.transferFrom(msg.sender, address(this), tokenId);
        stakes[msg.sender][tokenId] = stakeTill;
        addressStakingCount[msg.sender] += 1;
        emit MetashipStaked(msg.sender, tokenId, block.timestamp, stakeTill);
    }

    function stake100Day(uint tokenId) external payable {
        require(addressStakingCount[msg.sender] < stakingCountLimit, "Increased staking count limit");

        uint stakeTill = block.timestamp + oneDayInSeconds * 100;
        metashipsAddress.transferFrom(msg.sender, address(this), tokenId);
        stakes[msg.sender][tokenId] = stakeTill;
        addressStakingCount[msg.sender] += 1;
        emit MetashipStaked(msg.sender, tokenId, block.timestamp, stakeTill);
    }

    function unstake(uint tokenId) external payable {
        uint stakeTill = stakes[msg.sender][tokenId];
        metashipsAddress.transferFrom(address(this), msg.sender, tokenId);
        addressStakingCount[msg.sender] -= 1;

        emit MetashipUnstaked(msg.sender, tokenId, block.timestamp, stakeTill);
    }
}
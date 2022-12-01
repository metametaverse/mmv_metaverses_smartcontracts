pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

library Library {
  struct data {
     uint val;
     bool isValue;
   }
}

contract BaseMetashipStaking is ERC165, IERC1155Receiver, Ownable {
    using Library for Library.data;

    event Log(uint logged);
    event Received(address operator, address from, uint256 id, uint256 value, bytes data, uint256 gas);
    event BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data, uint256 gas);
    event BaseMetashipStaked(address indexed from, string indexed uuid, uint indexed stakedAt, uint stakedTill);
    event BaseMetashipUnstaked(address indexed to, string indexed uuid, uint indexed unstakedAt, uint stakedTill);

    bytes4 private _recRetval = 0xf23a6e61;
    bool private _recReverts = false;
    bytes4 private _batRetval = 0xbc197c81;
    bool private _batReverts = false;

    ERC1155 metashipsAddress;
    // mapping(address => mapping(string => Library.data)) public stakes;
    mapping(address => mapping(string => uint)) public stakes;
    mapping(address => uint) public addressStakingCount;
    // uint256 tokenId = 51271482805962209305201228596472484421057665279277761912030118523405984596968;
    uint256 tokenId = 2;
    uint32 public stakingCountLimit = 3;
    uint32 oneDayInSeconds = 60*60*24;

    
    constructor() {}
    
     function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data) external override returns(bytes4) {
        require(!_recReverts, "ERC1155ReceiverMock: reverting on receive");
        emit Received(operator, from, id, value, data, gasleft());
        return _recRetval;
    }
    function onERC1155BatchReceived(address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external override returns(bytes4) {
        require(!_batReverts, "ERC1155ReceiverMock: reverting on batch receive");
        emit BatchReceived(operator, from, ids, values, data, gasleft());
        return _batRetval;
    }

    function setStakingCountLimit(uint32 newStakingCountLimit) external onlyOwner {
        stakingCountLimit = newStakingCountLimit;
    }

    function setNftContractAddress(address _nftContract) external onlyOwner {
        metashipsAddress = ERC1155(_nftContract);
    }

    function stake1Day(string calldata uuid) external payable {
        require(addressStakingCount[msg.sender] < stakingCountLimit, "Increased staking count limit");
        emit Log(stakes[msg.sender][uuid]);
        // require(stakes[msg.sender][uuid] != 0, "This metaship is already staked");
        
        uint stakeTill = block.timestamp + oneDayInSeconds;
        metashipsAddress.safeTransferFrom(msg.sender, address(this), tokenId, 1, "0x0");
        // stakes[msg.sender][uuid].isValue = true;
        // stakes[msg.sender][uuid].val = stakeTill;
        addressStakingCount[msg.sender] += 1;
        emit BaseMetashipStaked(msg.sender, uuid, block.timestamp, stakeTill);
    }

    function stake100Day(string calldata uuid) external payable {
        require(addressStakingCount[msg.sender] < stakingCountLimit, "Increased staking count limit");
        // require(stakes[msg.sender][uuid].isValue, "This metaship is already staked");

        uint stakeTill = block.timestamp + oneDayInSeconds * 100;
        metashipsAddress.safeTransferFrom(msg.sender, address(this), tokenId, 1, "0x0");
        // stakes[msg.sender][uuid].isValue = true;
        // stakes[msg.sender][uuid].val = stakeTill;
        addressStakingCount[msg.sender] += 1;
        emit BaseMetashipStaked(msg.sender, uuid, block.timestamp, stakeTill);
    }

    function unstake(string calldata uuid) external payable {
        require(stakes[msg.sender][uuid] > 0, 'This metaship has not been set for staking');
        
        uint stakeTill = stakes[msg.sender][uuid];
        metashipsAddress.safeTransferFrom(address(this), msg.sender, tokenId, 1, "0x0");
        addressStakingCount[msg.sender] -= 1;

        emit BaseMetashipUnstaked(msg.sender, uuid, block.timestamp, stakeTill);
    }
}
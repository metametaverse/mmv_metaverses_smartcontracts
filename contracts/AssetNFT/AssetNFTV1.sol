// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AssetNFT is ERC1155Upgradeable, OwnableUpgradeable {
    event AssetMinted(string id, uint tokenId, uint amount, address by);

    using Counters for Counters.Counter;

    Counters.Counter private tokenIDs;
    bool allowMint;
    mapping(address => bool) blackList;
    mapping(uint => address) creators;

    function initialize(string calldata _baseUri) public initializer {
        OwnableUpgradeable.__Ownable_init();
        OwnableUpgradeable.transferOwnership(msg.sender);
        ERC1155Upgradeable.__ERC1155_init(_baseUri);
        allowMint = true;
    }

    function mint(string calldata inventoryItemId, uint amount) external {
        require(allowMint, "Mint not allowed");
        require(!blackList[msg.sender], "Access denied");
        tokenIDs.increment();
        _mint(msg.sender, tokenIDs.current(), amount, '0x00');
        creators[tokenIDs.current()] = msg.sender;
        emit AssetMinted(inventoryItemId, tokenIDs.current(), amount, msg.sender);
    }

    function setBaseUri(string memory newBaseUri) external onlyOwner {
        _setURI(newBaseUri);
    }

    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        return string(abi.encodePacked(ERC1155Upgradeable.uri(tokenId), Strings.toString(tokenId)));
    }
}

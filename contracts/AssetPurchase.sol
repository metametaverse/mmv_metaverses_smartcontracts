// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AssetPurchase is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    event AssetPublished(address by, string id, string sk, uint256 tokenId, uint256 price);
    event AssetSold(address buyer, uint256 tokenId);
    event AssetListingCancelled(address by, uint256 tokenId);

    struct AssetInfo {
        uint256 price;
        address seller;
    }

    mapping(uint256 => AssetInfo) tokenIdInfo;

    constructor() {
    }

    Counters.Counter private _tokenIDs;
    uint256 public fee = 0;

    function setCommision(uint256 _fee) external onlyOwner {
        fee = _fee;
    }

    function sell(string calldata id, string calldata sk, uint256 price) external {
        require(!Address.isContract(msg.sender), "Not allowed for smart contracts.");
        _tokenIDs.increment();
        tokenIdInfo[_tokenIDs.current()] = AssetInfo(price, msg.sender);

        emit AssetPublished(msg.sender, id, sk, _tokenIDs.current(), price);
    }

    function buy(uint256 tokenId) external payable nonReentrant {
        require(!Address.isContract(msg.sender), "Not allowed for smart contracts.");

        require(tokenIdInfo[tokenId].price > 0, "Token id does not exist");
        require(tokenIdInfo[tokenId].price <= msg.value, "Not enough funds");

        payable(tokenIdInfo[tokenId].seller).transfer(tokenIdInfo[tokenId].price - tokenIdInfo[tokenId].price / 100 * (100 - fee));

        emit AssetSold(msg.sender, tokenId);
    }

    function cancelListing(uint256 tokenId) external {
        require(tokenIdInfo[tokenId].seller == msg.sender, "You are not asset owner");
        tokenIdInfo[tokenId] = AssetInfo(0, address(0));

        emit AssetListingCancelled(msg.sender, tokenId);
    }

    function withdrowal(address to) external onlyOwner {
        payable(to).transfer(address(this).balance);
    }
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetPurchase is Ownable {
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

    function sell(string calldata id, string calldata sk, uint256 price) external {
        _tokenIDs.increment();
        tokenIdInfo[_tokenIDs.current()] = AssetInfo(price, msg.sender);

        emit AssetPublished(msg.sender, id, sk, _tokenIDs.current(), price);
    }

    function buy(uint256 tokenId) external payable {
        require(tokenIdInfo[tokenId].price > 0, "Token id does not exist");
        require(tokenIdInfo[tokenId].price <= msg.value, "Not enough funds");

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
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AssetPurchase is Initializable, OwnableUpgradeable, ReentrancyGuard {
    using Counters for Counters.Counter;

    event AssetPublished(
        address by,
        uint256 pricePerItem,
        uint256 tokenId,
        uint256 amount,
        uint256 nonce
    );
    event AssetSold(address buyer, uint256 tokenId, uint256 amount, uint256 nonce);
    event AssetListingCancelled(address by, uint256 tokenId, uint256 nonce);

    struct AssetInfo {
        uint256 price;
        address seller;
        uint256 tokenId;
        uint256 amount;
        bool sold;
    }

    IERC1155 nftSmartContractAddress;
    mapping(uint256 => AssetInfo) nonceListing;
    uint256 public fee = 0;
    Counters.Counter private nonce;

    function initialize(IERC1155 _nftAddress) public initializer {
        OwnableUpgradeable.__Ownable_init();
        OwnableUpgradeable.transferOwnership(msg.sender);

        nftSmartContractAddress = _nftAddress;
    }

    function setCommision(uint256 _fee) external onlyOwner {
        fee = _fee;
    }

    function sell(
        uint256 tokenId,
        uint256 pricePerItem,
        uint256 amount
    ) external {
        require(
            !Address.isContract(msg.sender),
            "Not allowed for smart contracts."
        );
        require(amount > 0, "Amount should be greather than 0");
        nonce.increment();

        nonceListing[nonce.current()] = AssetInfo(
            pricePerItem,
            msg.sender,
            tokenId,
            amount,
            false
        );

        emit AssetPublished(msg.sender, pricePerItem, tokenId, amount, nonce.current());
    }

    function buy(
        uint256 _nonce,
        uint256 tokenId,
        uint256 amount
    ) external payable nonReentrant {
        require(
            !Address.isContract(msg.sender),
            "Not allowed for smart contracts."
        );

        require(nonceListing[_nonce].price > 0, "Listing doesn't exists");
        require(nonceListing[_nonce].price * amount <= msg.value, "Not enough funds");
        require(nonceListing[_nonce].amount >= amount, "Insufficient amount");
        require(!nonceListing[_nonce].sold, "Already sold");
        require(nftSmartContractAddress.balanceOf(nonceListing[_nonce].seller, tokenId) >= amount, "Insufficient seller balance");

        nonceListing[_nonce] = AssetInfo(
            nonceListing[_nonce].price,
            nonceListing[_nonce].seller,
            tokenId,
            nonceListing[_nonce].amount - amount,
            true
        );

        payable(nonceListing[_nonce].seller).transfer(
            nonceListing[_nonce].price * amount -
                (nonceListing[_nonce].price * amount / 100) *
                fee
        );

        nftSmartContractAddress.safeTransferFrom(
            nonceListing[_nonce].seller,
            msg.sender,
            tokenId,
            amount,
            "0x00"
        );

        emit AssetSold(msg.sender, tokenId, amount, _nonce);
    }

    function cancelListing(uint256 _nonce, uint256 tokenId) external {
        require(
            nonceListing[_nonce].seller == msg.sender,
            "You are not asset owner"
        );
        require(!nonceListing[_nonce].sold, "Already sold");

        nonceListing[_nonce] = AssetInfo(0, address(0), 0, 0, false);

        emit AssetListingCancelled(msg.sender, tokenId, _nonce);
    }

    function withdrowal(address to) external onlyOwner {
        payable(to).transfer(address(this).balance);
    }
}

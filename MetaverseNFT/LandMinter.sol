// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./LandMinterUtils.sol";
import "./LandMinterTypes.sol";

contract LandMinter is ERC721, Ownable {
    using Counters for Counters.Counter;

    mapping(uint => LandDetails) public tokenIdlandDetails;
    mapping(uint => uint[]) public parentIdMintedLandIds;
    mapping(address => uint[]) public addressTokenIds;
    mapping(address => FreeAllocationDetails[]) public addressFreePendingAllocations;

    event TokenAssigned(address indexed to, address indexed from, uint indexed tokenId);

    constructor() ERC721("MMV Land", "MVLD") { }

    Counters.Counter private _tokenIDs;

    function assignTokenToAddress(uint8 _x, uint8 _y, uint8 _z, uint _parentId, address _to) external onlyOwner {
        require(Utils.CheckCoordinateNotMinted(tokenIdlandDetails, parentIdMintedLandIds, _x, _y, _z, _parentId), "This metaverse alredy minted");
        uint tokenId = calculateTokenId();
        require(!_exists(tokenId), "Token already minted");

        tokenIdlandDetails[tokenId] = LandDetails(_x, _y, _z, _parentId, LandType.Undefined);
        parentIdMintedLandIds[_parentId].push(tokenId);

        _mint(_to, tokenId);

        if (Utils.GetTier(tokenIdlandDetails, tokenId) == 0) {
            Utils.GiveBonusAllocations(addressFreePendingAllocations, tokenIdlandDetails, _to, tokenId);
        }

        emit TokenAssigned(_to, address(0), tokenId);
    }

    function mint(uint8 _x, uint8 _y, uint8 _z, uint _parentId, LandType _landType) external payable {
        require(Utils.CheckCoordinateNotMinted(tokenIdlandDetails, parentIdMintedLandIds, _x, _y, _z, _parentId), "This metaverse alredy minted");
        require(checkParentTokenExists(_parentId), "Parent metaverse hasn't been minted yet");
        
        uint tokenId = calculateTokenId();
        require(!_exists(tokenId), "Token already minted");
        uint price = Utils.GetPrice();
        require(msg.value >= price, "No enoght funds");

        tokenIdlandDetails[tokenId] = LandDetails(_x, _y, _z, _parentId, _landType);
        parentIdMintedLandIds[_parentId].push(tokenId);
            Utils.GiveBonusAllocations(addressFreePendingAllocations, tokenIdlandDetails, msg.sender, tokenId);

        _mint(msg.sender, tokenId);

        emit TokenAssigned(msg.sender, address(0), tokenId);
    }

    function claim(uint8 _x, uint8 _y, uint8 _z, uint _parentId, LandType _landType) external {
        require(Utils.CheckCoordinateNotMinted(tokenIdlandDetails, parentIdMintedLandIds, _x, _y, _z, _parentId), "This metaverse alredy minted");
        require(Utils.UseFreeAllocationAvailable(addressFreePendingAllocations, msg.sender, _parentId, _landType), "You don't have free metaverses of selected type to claim");
        require(checkParentTokenExists(_parentId), "Parent metaverse hasn't been minted yet");

        uint tokenId = calculateTokenId();
        require(!_exists(tokenId), "Token already minted");

        tokenIdlandDetails[tokenId] = LandDetails(_x, _y, _z, _parentId, _landType);
        parentIdMintedLandIds[_parentId].push(tokenId);

        _mint(msg.sender, tokenId);

        emit TokenAssigned(msg.sender, address(0), tokenId);
    }

    function withdrowal(address _address) external onlyOwner {
        payable(_address).transfer(address(this).balance);
    }

    function getTokenDetails(uint _tokenId) external view returns(LandDetails memory) {
        require(_exists(_tokenId), "Details requested for non existed token");
        return tokenIdlandDetails[_tokenId];
    }

    function getTokensDetailsByAddress(address _address) external view returns(LandDetails[] memory) {
        uint[] memory tokenIds = addressTokenIds[_address];

        LandDetails[] memory lands = new LandDetails[](tokenIds.length);

        for(uint i = 0; i < tokenIds.length; i++) {
            lands[i] = tokenIdlandDetails[i];
        }

        return lands;
    }

    function getFreeAllocationsByAddress(address _address) external view returns(FreeAllocationDetails[] memory) {
        return addressFreePendingAllocations[_address];
    }

    function calculateTokenId() private returns(uint) {
        _tokenIDs.increment();

        return _tokenIDs.current();
    }

    function checkParentTokenExists(uint _parentTokenId) private view returns(bool) {
        if (_parentTokenId == 0) {
            return true;
        }

        return _exists(_parentTokenId);
    }
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MetashipNftBsc is ERC721, Ownable {
    using Counters for Counters.Counter;

    struct MintRequest {
        address to;
        uint tokenId;
    }

    constructor() ERC721("MetashipNft", "MMSH") Ownable() {
    }

    Counters.Counter private _tokenIDs;

    uint16 totalSupply = 5016;
    string baseUri = "ipfs://QmRfFojd9LpnrJtZ6k5mbmN7J73oCMDxgTqAfyZX3UpPzB/";

    function _baseURI() internal view virtual override returns (string memory) {
        return baseUri;
    }

    function setBaseURI(string memory newBaseUri) external onlyOwner {
        baseUri = newBaseUri;
    }


    function Mint(uint[] memory tokenIds) external onlyOwner {
        for(uint i = 0; i < tokenIds.length; ++i) {
            require(tokenIds[i] > 0 && tokenIds[i] < 5016, "Incorrect tokenId");
            _mint(msg.sender, tokenIds[i]);
        }
    }

    function Burn(uint tokenId) external {
        require(ERC721.ownerOf(tokenId) == msg.sender, "You are not an owner");
        _burn(tokenId);
    }
}
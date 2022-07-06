// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MetashipNft is ERC721, Ownable {
    using Counters for Counters.Counter;

    constructor() ERC721("MetashipNft", "MMSH") {
    }

    Counters.Counter private _tokenIDs;

    uint16 totalSupply = 5016;

    function _baseURI() internal view virtual override returns (string memory) {
        return "ipfs://QmfXc56vg6LmZ3DKYjqbtwt1TwmBiS52UJSkYrRpTPJ7H1/";
    }

    function Mint() external {
        for(uint8 i = 0; i < 100; i++ ) {
            _tokenIDs.increment();
            _mint(address(owner()), _tokenIDs.current());

            if(_tokenIDs.current() >= totalSupply) {
                break;
            }
        }
    }

}
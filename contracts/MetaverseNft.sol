// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./LandMinterUtils.sol";
import "./LandMinterTypes.sol";

contract MetaverseNft is ERC721, Ownable {
    using Counters for Counters.Counter;

    mapping(uint256 => LandDetails) public tokenIdlandDetails;

    event TokenAssigned(
        address indexed to,
        address indexed from,
        uint256 indexed tokenId,
        int8 x,
        int8 y,
        int8 z,
        uint256 parentTokenId
    );

    constructor() ERC721("MMV Land", "MMLD") {}

    Counters.Counter private _tokenIDs;
    string baseUri = "ipfs://bafybeicabn7qaby4scd56y6t75n3bf72vlluby7fzrfqumdcnbfr5hprni/";

    function mintByCoordinates(
        int8 x,
        int8 y,
        int8 z,
        address to
    ) external onlyOwner {
        require(
            x <= 7 && x >= -7 && y <= 7 && y >= -7 && z <= 7 && z >= -7,
            "Wrong coordinates for tier 0"
        );
        uint256 tokenId = uint256(
            int256(int16(x + 7) * 225 + int16(y + 7) * 15 + (z + 7) + 1)
        );
        tokenIdlandDetails[_tokenIDs.current()] = LandDetails(x, y, z, 0);
        _mint(to, tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseUri;
    }

    function setBaseUri(string memory newBaseUri) external onlyOwner {
        baseUri = newBaseUri;
    }

    function getTokenDetails(uint256 _tokenId)
        external
        view
        returns (LandDetails memory)
    {
        require(_exists(_tokenId), "Details requested for non existed token");
        return tokenIdlandDetails[_tokenId];
    }
}

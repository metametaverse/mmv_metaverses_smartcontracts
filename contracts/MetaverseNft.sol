// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

struct LandDetails {
    int8 x;
    int8 y;
    int8 z;
    uint parentTokenId;
}

contract MetaverseNft is ERC721, Ownable {
    using Counters for Counters.Counter;

    mapping(uint256 => LandDetails) public tokenIdLandDetails;
    mapping(address => bool) operators;
    mapping(uint256 => string) customTokenCID;

    event TokenAssigned(
        address indexed to,
        address indexed from,
        uint256 indexed tokenId,
        int8 x,
        int8 y,
        int8 z,
        uint256 parentTokenId
    );

    constructor() ERC721("MetaMetaverse Lands", "MMVL") {}

    Counters.Counter private tokenIDs;
    string baseUri = "ipfs://bafybeiex6vy2hjfvq24g524z33v63a6ir4rbdci7wwmo4qqpd4mnwctczq/";

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
        tokenIdLandDetails[tokenIDs.current()] = LandDetails(x, y, z, 0);
        _mint(to, tokenId);
    }

    function setOperator(address operator, bool active) public onlyOwner{
        operators[operator] = active;
    }

    function setCustomTokenCid(uint tokenId, string calldata cid) external {
        require(operators[msg.sender], "Only operators permitted");

        customTokenCID[tokenId] = cid;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseUri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (bytes(customTokenCID[tokenId]).length > 0) {
            _requireMinted(tokenId);
            return string(abi.encodePacked("ipfs://", customTokenCID[tokenId]));
        } else {
            return super.tokenURI(tokenId);
        }
    }

    function setBaseUri(string memory newBaseUri) external onlyOwner {
        baseUri = newBaseUri;
    }

    function getTokenDetails(uint256 tokenId)
        external
        view
        returns (LandDetails memory)
    {
        require(_exists(tokenId), "Details requested for non existed token");
        return tokenIdLandDetails[tokenId];
    }
}

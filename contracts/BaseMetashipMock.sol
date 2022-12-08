// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BaseMetashipMock is ERC1155, Ownable {
    uint256 public constant tokenId = 51271482805962209305201228596472484421057665279277761912030118523405984596968;
    uint256 public constant Acceleration = 1;

    constructor() ERC1155("") {
        _mint(msg.sender, tokenId, 1000, "");
    }
}
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BaseMetaship is ERC1155, Ownable {
    uint256 public constant Acceleration = 1;

    constructor() ERC1155("") {
        _mint(msg.sender, 2, 1000, "");
    }
}
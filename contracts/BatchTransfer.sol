// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BatchTransfer is Ownable {
    IERC721 ntfAddress;

    constructor() Ownable() {
        //TODO change for prod
        ntfAddress = IERC721(0xeC2343D9b4431fa7FC3Be12dD9d31b735fcDfA3F);
    }


    function setAddress(address _address) external onlyOwner {
        ntfAddress = IERC721(_address);
    }

    function batchTransfer(uint[] memory ids, address from, address to) external onlyOwner {

        for(uint i = 0; i < ids.length; ++i) {
            ntfAddress.safeTransferFrom(from, to, ids[i], "0x00");
        }
    }

}
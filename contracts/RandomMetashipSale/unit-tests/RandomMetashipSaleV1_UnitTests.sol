// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "../RandomMetashipSaleV1.sol";

contract RandomMetshipSaleV1UnitTests is RandomMetashipSaleV1 {
    function rwCallback(
        uint256 requestId,
        uint256[] memory randomWords
    ) external {
        fulfillRandomWords(requestId, randomWords);
    }
}

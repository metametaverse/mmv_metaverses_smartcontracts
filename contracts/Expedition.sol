// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ExpeditionManager is Ownable {

    event ExpeditionStarted(string expeditionId, address by);
    event ClaimBonus(string expeditionId, address by);
    event RefillMetashipFuel(string metashipId, address by);
    event RefillMetashipShield(string metashipId, address by);

    constructor() {
    }

    function startExpedition(string calldata expeditionId) external {
        emit ExpeditionStarted(expeditionId, msg.sender);
    }

    function claimBonus(string calldata expeditionId) external {
        emit ClaimBonus(expeditionId, msg.sender);
    }

    function refillMetashipFuel(string calldata metashipId) external {
        emit RefillMetashipFuel(metashipId, msg.sender);
    }

    function refillMetashipShield(string calldata metashipId) external {
        emit RefillMetashipShield(metashipId, msg.sender);
    }
}
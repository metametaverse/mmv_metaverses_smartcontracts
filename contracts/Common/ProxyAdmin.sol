// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import {ITransparentUpgradeableProxy} from "../Common/ITransparentUpgradeableProxy.sol";
 
contract ProxyAdmin is Ownable {
    /**
     * @dev Sets the initial owner who can perform upgrades.
     */

    constructor() Ownable() {}

    /**
     * @dev Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-upgradeTo}.
     *
     * Requirements:
     *
     * - This contract must be the admin of `proxy`.
     */
    function upgrade(ITransparentUpgradeableProxy proxy, address implementation) public virtual onlyOwner {
        proxy.upgradeTo(implementation);
    }
}
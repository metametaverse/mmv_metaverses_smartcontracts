// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library StorageSlot {
    struct AddressSlot {
        address value;
    }

    function getAddressSlot(
        bytes32 slot
    ) internal pure returns (AddressSlot storage r) {
        assembly {
            r.slot := slot
        }
    }
}

contract Proxy {
    bytes32 private constant IMPLEMENTATION_SLOT =
        bytes32(uint(keccak256("eip1967.proxy.implementation")) - 1);
    // 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103
    bytes32 private constant ADMIN_SLOT =
        bytes32(uint(keccak256("eip1967.proxy.admin")) - 1);

    constructor(address _admin, address _implementation) {
        _setAdmin(_admin);
        _setImplementation(_implementation);
    }

    function upgradeTo(address _implementation) external {
        require(msg.sender == _getAdmin(), "admin only");
        _setImplementation(_implementation);
    }

    function _getAdmin() private view returns (address) {
        return StorageSlot.getAddressSlot(ADMIN_SLOT).value;
    }

    function _setAdmin(address _admin) private {
        require(_admin != address(0), "admin = zero address");
        StorageSlot.getAddressSlot(ADMIN_SLOT).value = _admin;
    }

    function _getImplementation() private view returns (address) {
        return StorageSlot.getAddressSlot(IMPLEMENTATION_SLOT).value;
    }

    function _setImplementation(address _implementation) private {
        require(_implementation.code.length > 0, "implementation is not contract");
        StorageSlot.getAddressSlot(IMPLEMENTATION_SLOT).value = _implementation;
    }

    function _fallback() private {
        _delegate(_getImplementation());
    }

    fallback() external payable {
        _fallback();
    }

    receive() external payable {
        _fallback();
    }


    function _delegate(address impl) internal virtual {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}

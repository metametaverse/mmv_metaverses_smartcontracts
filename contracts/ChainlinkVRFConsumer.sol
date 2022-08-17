// SPDX-License-Identifier: MIT
// An example of a consumer contract that relies on a subscription for funding.
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

interface IVRFConsumerCallback {
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        external;
}

contract VRFv2Consumer is VRFConsumerBaseV2, Ownable {
    VRFCoordinatorV2Interface COORDINATOR;

    // Your subscription ID.
    uint64 s_subscriptionId;

    // Rinkeby coordinator. For other networks,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    //address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;

    // The gas lane to use, which specifies the maximum gas price to bump to.
    // For a list of available gas lanes on each network,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    bytes32 keyHash =
        0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;

    //Max Gas Limit = 2500000 for Eth Mainnet
    uint32 callbackGasLimit = 2500000;

    // The default is 3, but you can set this higher.
    uint16 requestConfirmations = 3;

    uint256[] public s_randomWords;

    mapping(uint256 => address) requestIdCallbackTo;
    mapping(address => bool) whitelistedCaller;

    constructor(uint64 subscriptionId, address vrfCoordinator) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
    }

    function setKeyHash(bytes32 newKeyHash) external onlyOwner {
      keyHash = newKeyHash;
    }

    function whiteListAddress(address _address) external onlyOwner {
      whitelistedCaller[_address] = true;
    }

    // numwords maximum 500
    function requestRandomWords(uint32 numWords, address callbackTo)
        external
        onlyOwner
        returns (uint256)
    {
        // Will revert if subscription is not set and funded.
        uint256 s_requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requestIdCallbackTo[s_requestId] = callbackTo;

        return s_requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        address callbackTo = requestIdCallbackTo[requestId];

        IVRFConsumerCallback(callbackTo).fulfillRandomWords(
            requestId,
            randomWords
        );
    }

  modifier onlyWhitelistedCaller() {
    require(whitelistedCaller[msg.sender]);
    _;
  }
}

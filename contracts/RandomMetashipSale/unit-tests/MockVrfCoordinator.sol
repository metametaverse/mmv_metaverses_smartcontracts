//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract MockVRFCoordinator {
    uint256 public counter = 0;
    uint256 public currentRequestId = 0;
    address public _consumer;

    struct RdResponseData {
        address consumer;
        uint256[] randomWords;
    }

    mapping(uint256 => RdResponseData) public requestIdResponse;
    mapping(uint256 => uint256) public indexRandom;

    function getResponse(uint256 rId) external view returns (RdResponseData memory) {
        return requestIdResponse[rId];
    }

    function setRandomWords(uint256 index, uint256 randomWord) external {
        indexRandom[index] = randomWord;
    }

    function setConsumer(address _address) external {
        _consumer = _address;
    }

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32 numWords
    ) external returns (uint256 requestId) {
        currentRequestId++;
        uint256[] memory randomWords = new uint256[](numWords);
        for (uint256 i = counter; i < counter + numWords; i++) {
            randomWords[i - counter] = indexRandom[i + 1];
        }

        counter += numWords;

        requestIdResponse[currentRequestId] = RdResponseData(
            msg.sender,
            randomWords
        );
        return currentRequestId;
    }

    function fulfillRandomWords(uint256 requestId) external {
        VRFConsumerBaseV2 consumer = VRFConsumerBaseV2(
            _consumer
        );
        consumer.rawFulfillRandomWords(
            requestId,
            requestIdResponse[requestId].randomWords
        );
    }
}

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract MintRandomNft is Ownable, VRFConsumerBaseV2 {
    event RandomlyMinted(
        address indexed to,
        address indexed from,
        uint256[] tokenIds
    );

    //TODO CHANGE FOR MAINNET
    bytes32 keyHash =
        0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;
    uint64 subscriptionId;
    VRFCoordinatorV2Interface COORDINATOR;

    constructor(uint64 _subscriptionId, address _vrfCoordinator)
        VRFConsumerBaseV2(_vrfCoordinator)
    {
        subscriptionId = _subscriptionId;
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
    }

    IERC721 _tokenContract = IERC721(address(0));
    address _saleFrom;

    uint256 nonce = 0;
    // uint16 offset = 670;
    uint256 public CurrentPrice = 0.2 ether;

    mapping(uint8 => mapping(uint16 => bool)) public merkleTree;
    uint8 depth = 13;

    uint16 totalSupply = 5016;
    uint16 public currentSupply = 20;
    uint16 maxBatchCount = 20;

    mapping(uint256 => address) requestIdAddress;

    function setTokenContract(address tokenAddress, address saleFrom)
        external
        onlyOwner
    {
        _tokenContract = IERC721(tokenAddress);
        _saleFrom = saleFrom;
    }

    function setCurrentSupply(uint16 supply) external onlyOwner {
        currentSupply = supply;
    }

    function setMaximumBatchCount(uint16 _maxBatchCount) external onlyOwner {
        maxBatchCount = _maxBatchCount;
    }

    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
    }

    function markMetashipAsSold(uint16 tokenId) external onlyOwner {
        recalculateMerkle(tokenId, true);
        nonce++;

        if(nonce % 100 == 0) {
            CurrentPrice = CurrentPrice * 103 / 100;
        }
    }

    function getAlreadySoldCount() external view returns (uint256) {
        return nonce;
    }

    function getAvailableSupply() external view returns (uint256) {
        return currentSupply - nonce;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        allocateRandomlyMintedTokens(requestId, randomWords);
    }

    function allocateRandomlyMintedTokens(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal {
        uint256 length = randomWords.length;
        uint256[] memory tokenIds = new uint256[](length);

        for (uint32 i = 0; i < randomWords.length; i++) {
            uint16 tokenId = getRandomTokenId(randomWords[i]);

            //TODO if tokens sold but not everithing filled => refund buyer.
            while (_tokenContract.ownerOf(tokenId) != _saleFrom) {
                require(!merkleTree[depth][1], "All metaships already minted");
                uint16 position = tokenId;
                tokenId = findNearest(position);
                recalculateMerkle(tokenId, true);
            }

            _tokenContract.transferFrom(
                _saleFrom,
                requestIdAddress[requestId],
                tokenId
            );

            tokenIds[i] = tokenId;
        }

        emit RandomlyMinted(requestIdAddress[requestId], _saleFrom, tokenIds);
    }

    function requestRandomWords(uint32 numWords) internal returns (uint256) {
        uint256 s_requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            3,
            2500000,
            numWords
        );

        return s_requestId;
    }

    function mintRandom(uint16 count) external payable {
        validatePrice(count);
        require(!merkleTree[depth][1], "All metaships already minted");
        require(
            nonce + count <= currentSupply,
            "All metaships from current batch already sold, wait for next batch"
        );
        require(count <= maxBatchCount, "Maximum allowed batch count 20");

        nonce += count;

        uint256 requestId = requestRandomWords(count);
        requestIdAddress[requestId] = msg.sender;
    }

    function withdrowal(address _address) external onlyOwner {
        payable(_address).transfer(address(this).balance);
    }

    function getRandomTokenId(uint256 randomNumber) internal returns (uint16) {
        uint16 rd = uint16(1 + (randomNumber % totalSupply));
        uint16 position = rd;

        if (!merkleTree[0][position]) {
            recalculateMerkle(position, true);
        } else {
            rd = findNearest(position);
            recalculateMerkle(rd, true);
        }
        return rd;
    }

    function recalculateMerkle(uint16 index, bool newValue) private {
        uint8 level = 0;
        bool currentValue = merkleTree[level][index];
        bool calculatedValue = newValue;
        uint16 position = index;
        uint16 levelLength = totalSupply;

        while (calculatedValue != currentValue && level <= depth) {
            if (levelLength % 2 != 0) {
                merkleTree[level][levelLength + 1] = true;
            }

            merkleTree[level][position] = calculatedValue;

            if (position % 2 == 0) {
                calculatedValue =
                    merkleTree[level][position] &&
                    merkleTree[level][position - 1];
            } else {
                calculatedValue =
                    merkleTree[level][position] &&
                    merkleTree[level][position + 1];
            }

            level++;
            levelLength = (levelLength + 1) / 2;
            position = (position + 1) / 2;

            currentValue = merkleTree[level][position];
        }
    }

    function findNearest(uint16 index) private view returns (uint16) {
        uint8 level = 0;
        uint16 position = index;

        while (merkleTree[level][position]) {
            level++;
            position = (position + 1) / 2;
        }

        while (level != 0) {
            level--;
            if (!merkleTree[level][position * 2 - 1]) {
                position = position * 2 - 1;
            } else {
                position = position * 2;
            }
        }

        return position;
    }

    function validatePrice(uint256 count) private {
        uint256 leftToPriceUpdate = 100 - (nonce % 100);
        uint256 requiredPrice;
        if (leftToPriceUpdate <= count) {
            requiredPrice = CurrentPrice * leftToPriceUpdate;
            CurrentPrice = (CurrentPrice * 103) / 100;
            requiredPrice += (count - leftToPriceUpdate) * CurrentPrice;
        } else {
            requiredPrice = count * CurrentPrice;
        }

        require(msg.value >= requiredPrice, "Not enough ether");
    }
}

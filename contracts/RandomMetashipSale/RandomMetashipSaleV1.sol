// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./MathLibrary.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "./VRFConsumerBaseV2Upgradable.sol";

// import "hardhat/console.sol";

contract RandomMetashipSaleV1 is
    Initializable,
    OwnableUpgradeable,
    VRFConsumerBaseV2Upgradable
{
    event RandomlyMinted(
        address indexed to,
        address indexed from,
        uint256[] tokenIds
    );

    struct CurrentSaleInfo {
        bool started;
        bool finished;
        uint256 currentPrice;
        uint256 batchSize;
        uint256 merkleDepth;
        uint256 sold;
        uint256 precentageStep;
        uint256 priceIncreaseAmountStep;
        address saleFrom;
    }

    struct RequestInfo {
        uint256 saleId;
        address sender;
        uint256 amount;
    }

    mapping(uint256 => CurrentSaleInfo) public saleInfo;
    mapping(uint256 => mapping(uint256 => uint256)) positionTokenId;
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool))) merkleTree;
    mapping(uint256 => RequestInfo) requestInfo;

    IERC721 public nftSmartContractAddress;

    uint256 public currentSaleId;
    uint256 public maxBatchSize;
    bytes32 keyHash;
    uint64 subscriptionId;
    VRFCoordinatorV2Interface COORDINATOR;

    function initialize(address _vrfCoordinator, uint64 _subscriptionId)
        public
        initializer
    {
        maxBatchSize = 20;

        VRFConsumerBaseV2Upgradable.initialize(_vrfCoordinator);
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;

        OwnableUpgradeable.__Ownable_init();
        OwnableUpgradeable.transferOwnership(msg.sender);

        saleInfo[0].finished = true;
    }

    function setTokensForSale(
        uint256 saleId,
        uint256[] memory tokenIds,
        uint256 alreadySetAmount
    ) external onlyOwner {
        require(
            !saleInfo[saleId].started,
            "Sale already started and cannot be changed"
        );
        setSaleTokenIds(saleId, alreadySetAmount, tokenIds);
    }

    function setMaxBatchSize(uint size) external onlyOwner {
        maxBatchSize = size;
    }

    function setSale(
        uint256 _saleId,
        uint256 _currentPrice,
        uint256 _precentageStep,
        uint256 _priceIncreaseAmountStep,
        uint256 _batchSize,
        address _saleFrom
    ) external onlyOwner {
        require(
            positionTokenId[_saleId][_batchSize] > 0,
            "Tokens for sale hasn't been set yes"
        );
        setSellInfo(
            _saleId,
            _currentPrice,
            _batchSize,
            _precentageStep,
            _priceIncreaseAmountStep,
            _saleFrom
        );
    }

    function startSale(uint256 saleId) external onlyOwner {
        require(
            saleInfo[currentSaleId].finished || saleId == 1,
            "Previous sale hasn't been finished yet"
        );
        require(
            saleInfo[saleId].currentPrice > 0,
            "Price should be defined for sale"
        );
        require(saleInfo[saleId].batchSize > 0, "Batch size should be defined");
        require(
            saleInfo[saleId].precentageStep > 0,
            "PercentageStep should be defined for sale"
        );
        require(
            saleInfo[saleId].priceIncreaseAmountStep > 0,
            "priceIncreaseAmountStep should be defined for sale"
        );
        require(
            saleInfo[saleId].saleFrom != address(0),
            "saleFrom should be defined for sale"
        );
        require(!saleInfo[saleId].finished, "Sale has been already finished");
        saleInfo[saleId].started = true;
        currentSaleId = saleId;
    }

    function finishSale(uint256 saleId) external onlyOwner {
        saleInfo[saleId].finished = true;
    }

    function withdrowal(address _address) external onlyOwner {
        payable(_address).transfer(address(this).balance);
    }

    function setNftSmartContractAddress(address _address) external onlyOwner {
        nftSmartContractAddress = IERC721(_address);
    }

    function buy(uint256 saleId, uint256 amount) external payable {
        validatePrice(saleId, amount);

        require(
            saleInfo[saleId].started && !saleInfo[saleId].finished,
            "Sale already closed or not started yet"
        );
        require(!getRoot(saleId), "All metaships already sold");
        require(
            saleInfo[saleId].sold + amount <= saleInfo[saleId].batchSize,
            "All metaships from current batch already sold, wait for next batch"
        );
        require(amount <= maxBatchSize, "Maximum allowed batch count 20");

        saleInfo[saleId].sold += amount;

        uint256 requestId = requestRandomWords(uint32(amount));
        requestInfo[requestId] = RequestInfo(saleId, msg.sender, amount);
    }

    function requestRandomWords(uint32 numWords) private returns (uint256) {
        uint256 s_requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            3,
            2500000,
            numWords
        );

        return s_requestId;
    }

    function validatePrice(uint256 saleId, uint256 count) private {
        uint256 leftToPriceUpdate = saleInfo[saleId].priceIncreaseAmountStep -
            (saleInfo[saleId].sold % saleInfo[saleId].priceIncreaseAmountStep);
        uint256 requiredPrice;
        if (leftToPriceUpdate <= count) {
            requiredPrice = saleInfo[saleId].currentPrice * leftToPriceUpdate;
            saleInfo[saleId].currentPrice =
                (saleInfo[saleId].currentPrice *
                    (100 + saleInfo[saleId].precentageStep)) /
                100;
            requiredPrice +=
                (count - leftToPriceUpdate) *
                saleInfo[saleId].currentPrice;
        } else {
            requiredPrice = count * saleInfo[saleId].currentPrice;
        }

        require(msg.value >= requiredPrice, "Not enough ether");
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        virtual
        override
    {
        RequestInfo storage request = requestInfo[requestId];
        uint256[] memory tokenIds = new uint256[](request.amount);
        for (uint32 i = 0; i < request.amount; i++) {
            uint256 availablePosition = findNearestPosition(
                request.saleId,
                1 + (randomWords[i] % saleInfo[request.saleId].batchSize)
            );
            uint256 tokenId = positionTokenId[request.saleId][
                availablePosition
            ];

            nftSmartContractAddress.transferFrom(
                saleInfo[request.saleId].saleFrom,
                request.sender,
                tokenId
            );

            tokenIds[i] = tokenId;

            recalculateMerkle(request.saleId, availablePosition);
        }

        emit RandomlyMinted(
            request.sender,
            saleInfo[request.saleId].saleFrom,
            tokenIds
        );
    }

    function setSaleTokenIds(
        uint256 sellId,
        uint256 alreadySetAmount,
        uint256[] memory tokenIds
    ) private {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            positionTokenId[sellId][alreadySetAmount + i + 1] = tokenIds[i];
        }
    }

    // TODO already initialized check
    function setSellInfo(
        uint256 saleId,
        uint256 currentPrice,
        uint256 batchSize,
        uint256 precentageStep,
        uint256 priceIncreaseAmountStep,
        address _saleFrom
    ) private {
        uint256 depth = MathLibrary.log2(batchSize);
        saleInfo[saleId] = CurrentSaleInfo(
            false,
            false,
            currentPrice,
            batchSize,
            depth,
            0,
            precentageStep,
            priceIncreaseAmountStep,
            _saleFrom
        );

        uint256 i = 0;
        uint256 currentPosition = batchSize + 1;
        while (i < depth) {
            merkleTree[saleId][i][currentPosition] = true;
            i++;
            currentPosition = currentPosition / 2 + 1;
        }
    }

    function getRoot(uint256 saleId) private view returns (bool) {
        saleInfo[saleId].merkleDepth;
        return merkleTree[saleId][saleInfo[saleId].merkleDepth][1];
    }

    function findNearestPosition(uint256 sellId, uint256 position)
        public
        view
        returns (uint256)
    {
        require(!getRoot(sellId), "Already sold");
        mapping(uint256 => mapping(uint256 => bool))
            storage merkle = merkleTree[sellId];

        uint256 i = 0;
        uint256 currentNumber = position;

        if (!merkle[i][currentNumber]) return currentNumber;

        do {
            i++;
            currentNumber = currentNumber % 2 == 0
                ? currentNumber / 2
                : currentNumber / 2 + 1;
        } while (merkle[i][currentNumber]);

        while (i > 0) {
            currentNumber = !merkle[i - 1][currentNumber * 2 - 1]
                ? currentNumber * 2 - 1
                : currentNumber * 2;
            i--;
        }
        return currentNumber;
    }

    function recalculateMerkle(uint256 saleId, uint256 position) private {
        uint256 i = 0;
        uint256 currentPosition = position;

        do {
            merkleTree[saleId][i][currentPosition] = true;

            uint256 neighborPosition = currentPosition % 2 == 0
                ? currentPosition - 1
                : currentPosition + 1;

            uint256 abovePosition = currentPosition % 2 == 0
                ? currentPosition / 2
                : currentPosition / 2 + 1;

            bool oldValue = merkleTree[saleId][i + 1][abovePosition];

            merkleTree[saleId][i + 1][abovePosition] =
                merkleTree[saleId][i][currentPosition] &&
                merkleTree[saleId][i][neighborPosition];

            if (oldValue == merkleTree[saleId][i + 1][abovePosition]) break;
            i++;
            currentPosition = abovePosition;
        } while (i < saleInfo[saleId].merkleDepth);
    }
}

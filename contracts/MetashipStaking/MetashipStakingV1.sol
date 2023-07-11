// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MetashipStakingV1 is Initializable, OwnableUpgradeable {
    event MetashipStaked(
        address indexed from,
        uint256 indexed tokenId,
        uint256 indexed stakedAt,
        uint256 stakedTill
    );
    event MetashipUnstaked(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed unstakedAt,
        uint256 stakedTill
    );

    modifier onlyOperator() {
        require(msg.sender == operator, "Operator only accessable");
        _;
    }

    uint256 public stakingCountLimit;
    bool public stakingAvailable;
    bool public allowEarlyUnstake;
    address operator;
    address metashipNftAddress;
    uint256 oneDayInSeconds;

    mapping(uint256 => uint256) public periodDays;
    mapping(address => mapping(uint256 => uint256)) public stakes;
    mapping(address => uint256) public addressStakingCount;

    function initialize(
        address _metashipNftAddress,
        uint256 _stakingCountLimit,
        uint256[] memory periodIds,
        uint256[] memory durationDays
    ) public initializer {
        require(
            periodIds.length == durationDays.length,
            "Wrong input parameters for periodIds and durationDays"
        );
        oneDayInSeconds = 86400;
        metashipNftAddress = _metashipNftAddress;
        stakingCountLimit = _stakingCountLimit;
        stakingAvailable = true;
        allowEarlyUnstake = true;

        for (uint i = 0; i < periodIds.length; i++) {
            periodDays[periodIds[i]] = durationDays[i];
        }

        operator = msg.sender;
        OwnableUpgradeable.__Ownable_init();
        OwnableUpgradeable.transferOwnership(msg.sender);
    }

    function setPeriod(
        uint256[] memory periodIds,
        uint256[] memory durationDays
    ) external onlyOperator {
        for (uint i = 0; i < periodIds.length; i++) {
            periodDays[periodIds[i]] = durationDays[i];
        }
    }

    function setAllowEarlyUnstake(
        bool _allowEarlyUnstake
    ) external onlyOperator {
        allowEarlyUnstake = _allowEarlyUnstake;
    }

    function setStakingAvailable(bool _stakingAvailable) external onlyOperator {
        stakingAvailable = _stakingAvailable;
    }

    function setStakingCountLimit(
        uint32 newStakingCountLimit
    ) external onlyOperator {
        stakingCountLimit = newStakingCountLimit;
    }

    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
    }

    function setNftContractAddress(address _nftContract) external onlyOperator {
        metashipNftAddress = _nftContract;
    }

    function stake(uint256 tokenId, uint256 stakingOptionId) external {
        require(stakingAvailable, "Staking is not available at this moment");
        require(
            addressStakingCount[msg.sender] < stakingCountLimit,
            "staking count limit exceeded"
        );
        require(periodDays[stakingOptionId] > 0, "Wrong staking option");

        uint256 stakeTill = block.timestamp +
            oneDayInSeconds *
            periodDays[stakingOptionId];
        IERC721(metashipNftAddress).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );
        stakes[msg.sender][tokenId] = stakeTill;
        addressStakingCount[msg.sender] += 1;
        emit MetashipStaked(msg.sender, tokenId, block.timestamp, stakeTill);
    }

    function unstake(uint256 tokenId) external {
        uint256 stakeTill = stakes[msg.sender][tokenId];
        require(stakeTill > 0, "No metaship staked with that tokenId using this account");
        require(
            allowEarlyUnstake || (block.timestamp > stakeTill),
            "Metaship locked till the end of staking period"
        );

        addressStakingCount[msg.sender] -= 1;
        stakes[msg.sender][tokenId] = 0;

        IERC721(metashipNftAddress).transferFrom(
            address(this),
            msg.sender,
            tokenId
        );

        emit MetashipUnstaked(msg.sender, tokenId, block.timestamp, stakeTill);
    }

    function forceUnstake(
        address staker,
        uint256 tokenId
    ) external onlyOperator {
        uint256 stakeTill = stakes[staker][tokenId];
        require(stakeTill > 0, "No such staking");
        IERC721(metashipNftAddress).transferFrom(
            address(this),
            staker,
            tokenId
        );

        addressStakingCount[staker] -= 1;
        stakes[staker][tokenId] = 0;
        emit MetashipUnstaked(staker, tokenId, block.timestamp, stakeTill);
    }
}

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintRandomNft is Ownable {

    event RandomlyMinted(address indexed to, address indexed from, uint indexed tokenId, string memo);

    IERC721 _tokenContract = IERC721(address(0));
    address _saleFrom;

    uint nonce = 0;
    uint public CurrentPrice = 0.1 ether;

    mapping(uint8 => mapping(uint16 => bool)) public merkleTree;
    uint8 depth = 13;

    uint16 totalSupply = 5016;

    function setTokenContract(address tokenAddress, address saleFrom) external onlyOwner {
        _tokenContract = IERC721(tokenAddress);
        _saleFrom = saleFrom;
    }

    function random() internal returns (uint16) {
        uint16 randomnumber = uint16(uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))) % totalSupply);
        nonce++;
        return 1 + randomnumber;
    }

    function mintRandom(string calldata memo) external payable returns (uint16) {
        require(!merkleTree[depth][1], "All metaships already minted");
        require(msg.value >= CurrentPrice, "Not enough ether");
        
        uint16 tokenId = getRandomTokenId();

        _tokenContract.transferFrom(_saleFrom, msg.sender, tokenId);

        if(nonce % 100 == 0) {
            CurrentPrice = CurrentPrice * 103 / 100;
        }

        emit RandomlyMinted(msg.sender, _saleFrom, tokenId, memo);

        return tokenId;
    }

    function getRandomTokenId() internal returns(uint16) {
        uint16 rd = random();
        if (!merkleTree[0][rd]) {
            recalculateMerkle(rd, true);
        } else {
            rd = findNearest(rd);
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

        while(calculatedValue != currentValue && level <= depth) {

            if (levelLength % 2 != 0){
                merkleTree[level][levelLength + 1] = true;
            }

            merkleTree[level][position] = calculatedValue;

            if (position % 2 == 0){
                calculatedValue = merkleTree[level][position] && merkleTree[level][position - 1];
            } else {
                calculatedValue = merkleTree[level][position] && merkleTree[level][position + 1];
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

        while(merkleTree[level][position]) {
            level++;
            position = (position + 1) / 2;
        }

        while(level != 0) {
            level --;
            if(!merkleTree[level][position * 2 - 1]){
                position = position * 2 - 1;
            } else {
                position = position * 2;
            }
        }

        return position;
    }
}
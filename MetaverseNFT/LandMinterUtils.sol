// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./LandMinterTypes.sol";

library Utils {
    function GetTier(mapping(uint => LandDetails) storage _tokenIdlandDetails, uint _tokenId) internal view returns (uint8) {
      uint8 tier = 0;
        uint tempParentId = _tokenIdlandDetails[_tokenId].parentTokenId;

        while(tempParentId != 0){
            tempParentId = _tokenIdlandDetails[tempParentId].parentTokenId;
            tier++;
        }

        return tier;
    }

    function GiveBonusAllocations(
        mapping(address => FreeAllocationDetails[]) storage _addressFreePendingAllocations,
        mapping(uint => LandDetails) storage _tokenIdlandDetails,
        address _address,
        uint _tokenId) internal {
        uint8 tier = GetTier(_tokenIdlandDetails, _tokenId);

        if (tier == 0) {
            _addressFreePendingAllocations[_address].push(FreeAllocationDetails(LandType.Metaverse, _tokenId, 2));
            _addressFreePendingAllocations[_address].push(FreeAllocationDetails(LandType.Minigame, _tokenId, 2));
        } 
        else if (tier == 1) {
            _addressFreePendingAllocations[_address].push(FreeAllocationDetails(LandType.Metaverse, _tokenId, 1));
            _addressFreePendingAllocations[_address].push(FreeAllocationDetails(LandType.Minigame, _tokenId, 1));
        }
    }

    function UseFreeAllocationAvailable(
        mapping(address => FreeAllocationDetails[]) storage _addressFreePendingAllocations,
        address _address,
        uint _parentId,
        LandType _landType) internal returns(bool) {
        
        if (_parentId == 0) {
            return false;
        }

        FreeAllocationDetails[] storage freeAllocationsDetails = _addressFreePendingAllocations[_address];

        for(uint i = 0; i < freeAllocationsDetails.length; i++) {
            if (freeAllocationsDetails[i].parentId == _parentId
            && freeAllocationsDetails[i].landType == _landType
            && freeAllocationsDetails[i].count > 0) {
                
                if (freeAllocationsDetails[i].count == 1){
                    DeleteFreeAllocationByIndex(freeAllocationsDetails, i);
                } else {
                    FreeAllocationDetails memory tempDetails = FreeAllocationDetails(
                        freeAllocationsDetails[i].landType,
                        freeAllocationsDetails[i].parentId,
                        freeAllocationsDetails[i].count - 1);
                    
                    freeAllocationsDetails[i] = tempDetails;
                }
                return true;
            }
        }

        return false;
    }

    function GetPrice() internal pure returns(uint) {
        return 0.05 ether;
    }

    function CheckCoordinateNotMinted(
        mapping(uint => LandDetails) storage _tokenIdlandDetails,
        mapping(uint => uint[]) storage _parentIdMintedLandIds,
        uint8 _x,
        uint8 _y,
        uint8 _z,
        uint _parentId) internal view returns(bool) {

        bool alreadyMinted = false;
        uint[] memory tokenIds = _parentIdMintedLandIds[_parentId];
        for (uint i = 0; i < tokenIds.length; i++) {
            LandDetails memory alreadyMintedLandDetails = _tokenIdlandDetails[tokenIds[i]];
            if (alreadyMintedLandDetails.x == _x && alreadyMintedLandDetails.y == _y && alreadyMintedLandDetails.z == _z)
            {
                alreadyMinted = true;
                break;
            }
        }

        return !alreadyMinted;
    }

    function ChackParentIdAlreadyMinted(mapping(uint => address) storage _owners, uint tokenId) internal view returns(bool) {
        return _owners[tokenId] != address(0);
    }

    function DeleteFreeAllocationByIndex(FreeAllocationDetails[] storage freeAllocationsDetails, uint index) private {
        freeAllocationsDetails[index] = freeAllocationsDetails[freeAllocationsDetails.length - 1];
        freeAllocationsDetails.pop();
    }
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

enum LandType {
    Undefined,
    Metaverse,
    Minigame,
    NftGallery
}

struct LandDetails {
    uint8 x;
    uint8 y;
    uint8 z;
    uint parentTokenId;
    LandType landType;
}

struct FreeAllocationDetails {
    LandType landType;
    uint parentId;
    uint8 count;
}
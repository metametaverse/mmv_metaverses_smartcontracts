// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

enum LandType {
    Undefined,
    Metaverse,
    Minigame,
    NftGallery
}

struct LandDetails {
    int8 x;
    int8 y;
    int8 z;
    uint parentTokenId;
}

struct FreeAllocationDetails {
    LandType landType;
    uint parentId;
    uint8 count;
}
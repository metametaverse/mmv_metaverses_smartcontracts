import { ethers } from 'hardhat';
import fs from 'fs';


const proxyAddresses = {
    dev: '0x5f53A23A03Db0Bd2C182Ad4aA02101525CA37C29',
    stage: '0xc749D5612C2C29963ed8A6509D9e767668dB1c43',
    production: ''
};

const vrfCoordinatorAddresses = {
    dev: '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D',
    stage: '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D',
    production: '0x271682DEB8C4E0901D1a1550aD2e64D568E69909'
}

const keyHashes = {
    dev: '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15',
    stage: '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15',
    production: '0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef'
}

const nftMetashipAddresses = {
    dev: '0xec2343d9b4431fa7fc3be12dd9d31b735fcdfa3f',
    stage: '0xec2343d9b4431fa7fc3be12dd9d31b735fcdfa3f',
    production: '0xa712db506be314b78d98df53a501dbb1d1807af6'
}

const subscriptionIds = {
    dev: 3900,
    stage: 3900,
    production: null
};

const env = 'stage';
const proxyAddress = proxyAddresses[env];
const vrfCoordinatorAddress = vrfCoordinatorAddresses[env];
const keyHash = keyHashes[env];
const nftAddress = nftMetashipAddresses[env];

const sobscriptionId = subscriptionIds[env];

(async () => {

    const [acc1] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("RandomMetashipSaleV1", acc1);
    const proxy = await contractFactory.attach(proxyAddress);

    const initTx = await proxy.initialize(vrfCoordinatorAddress, sobscriptionId, keyHash, nftAddress);
    await initTx.wait();

    console.log('Owner', await proxy.owner());
})().then(_ => console.log('done'));
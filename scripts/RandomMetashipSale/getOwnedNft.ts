import { ethers } from 'hardhat';
import fs from 'fs';

const env = 'stage';
const currentOwner = '0x96c41ec74a28E7F80bA2a0E977856A0564c7f956'.toLowerCase();
const metashipSmartContractAddress = '0xeC2343D9b4431fa7FC3Be12dD9d31b735fcDfA3F';
const filePath = `E:/preparedMetashipIds_${env}.json`;

(async () => {
    const contractFactory = await ethers.getContractFactory("MetashipNft");
    const metashipNftContract = await contractFactory.attach(metashipSmartContractAddress);

    const results: number[] = [];

    for (let i = 2001; i <= 3000; i++) {
        const res = await metashipNftContract.ownerOf(ethers.formatUnits(i.toString(), 0));
        if (res.toLowerCase() === currentOwner.toLowerCase()) {
            results.push(i);
        }

        if (i % 100 === 0) console.log(i);
    }

    const json = JSON.stringify({ results: results })
    console.log(results.length);

    fs.writeFileSync(filePath, json, 'utf8');
})().then(_ => console.log('done'));
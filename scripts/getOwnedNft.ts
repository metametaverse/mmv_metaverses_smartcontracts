import { ethers } from 'hardhat';
import fs from 'fs';

(async () => {
    // 0x7805D3a3318c66B6BF87853B7663c04F6272a45c
    const contractFactory = await ethers.getContractFactory("MetashipNft");
    const metashipNftContract = await contractFactory.attach('0xeC2343D9b4431fa7FC3Be12dD9d31b735fcDfA3F');

    const results: number[] = [];

    for (let i = 1000; i <= 2000; i++) {
        const res = await metashipNftContract.ownerOf(ethers.formatUnits(i.toString(), 0));
        if (res.toLowerCase() === '0x9c1EAc34425E6341a937A27B90609136b2541f65'.toLowerCase()) {
            results.push(i);
        }

        if (i % 100 === 0) console.log(i);
    }

    const json = JSON.stringify({ results: results })

    fs.writeFileSync('E:/preparedMetashipIds.json', json, 'utf8');
})().then(_ => console.log('done'));
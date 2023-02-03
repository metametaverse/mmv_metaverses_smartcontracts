const { ethers } = require('hardhat');
const fs = require('fs');

(async () => {
    const contractFactory = await ethers.getContractFactory("MetashipNft");
    const metashipNftContract = await contractFactory.attach('0xeC2343D9b4431fa7FC3Be12dD9d31b735fcDfA3F');

    const results = [];

    for (let i = 1; i <= 5016; i++) {
        const res = await metashipNftContract.ownerOf(ethers.utils.formatUnits(i.toString(), 0));
        results.push({ tokenId: i, owner: res });
        if(i % 100 === 0){
            console.log(i);
        }
    }

    const json = JSON.stringify({results: results})

    fs.writeFileSync('E:/testNetMetashipOwners.json', json, 'utf8');

    console.log('done');
})()
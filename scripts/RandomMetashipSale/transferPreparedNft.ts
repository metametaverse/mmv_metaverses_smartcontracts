import { ethers } from 'hardhat';
import fs from 'fs';
import { Contract } from 'ethers';

const env = 'stage';

const sendTo = {
    dev: '0x7805D3a3318c66B6BF87853B7663c04F6272a45c',
    stage: '0x96c41ec74a28E7F80bA2a0E977856A0564c7f956',
    production: ''
};

(async () => {
    // dev 0x7805D3a3318c66B6BF87853B7663c04F6272a45c
    // stage 0x96c41ec74a28E7F80bA2a0E977856A0564c7f956
    const transferTo = sendTo[env];

    const [acc1] = await ethers.getSigners();
    const acc1Address = await acc1.getAddress();
    const contractFactory = await ethers.getContractFactory("BatchTransfer");
    const batchTransfer = await contractFactory.attach('0xb3a5D2CBbA9F3C628b493546d73223D4E2e2Edab');

    const json = fs.readFileSync(`E:/preparedMetashipIds_${env}.json`, 'utf-8');
    const tokenIds = (JSON.parse(json).results) as number[];
    console.log(tokenIds.length);

    let i = 0;
    while (tokenIds.length > 0) {
        const batch = tokenIds.splice(0, 100);
        const batchTransferTx = await batchTransfer.batchTransfer(batch, acc1Address, transferTo);
        await batchTransferTx.wait();
        i++;
        console.log(i);
    }

})().then(_ => console.log('done'));
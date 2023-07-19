import { ethers } from 'hardhat';
import fs from 'fs';

const saleFromAddresses = {
    dev: '0x7805D3a3318c66B6BF87853B7663c04F6272a45c',
    stage: '0x96c41ec74a28E7F80bA2a0E977856A0564c7f956',
    production: ''
};

const proxyAddresses = {
    dev: '0x5f53A23A03Db0Bd2C182Ad4aA02101525CA37C29',
    stage: '0xc749D5612C2C29963ed8A6509D9e767668dB1c43',
    production: ''
};

const env = 'stage';
const proxyAddress = proxyAddresses[env];
const saleId = 1;
const saleFromAddress = saleFromAddresses[env];
const filePath = `E:/preparedMetashipIds_${env}.json`;

(async () => {
    const [acc1] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("RandomMetashipSaleV1", acc1);
    const proxy = await contractFactory.attach(proxyAddress);

    const owner = await proxy.owner();
    console.log(owner);

    const json = fs.readFileSync(filePath, 'utf-8');
    const tokenIds = JSON.parse(json).results as number[];
    const length = tokenIds.length;
    console.log('Length: ', length);
    let i = 0;
    while (tokenIds.length > 0) {
        const batch = tokenIds.splice(0, 100);
        const setTokensForSaleTx = await proxy.setTokensForSale(saleId, batch, i * 100);
        await setTokensForSaleTx.wait();
        i++;
        console.log(i);
    }

    const setSaleTx = await proxy.setSale(saleId, ethers.parseEther("0.02"), 3, 10, length, saleFromAddress);
    await setSaleTx.wait();
    console.log('Sale set');

    const startSaleTx = await proxy.startSale(saleId);
    await startSaleTx.wait();
})().then(_ => console.log('done'));
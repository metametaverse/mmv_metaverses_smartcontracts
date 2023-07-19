import { ethers } from 'hardhat';
import fs from 'fs';

const proxyAddress = '0x45D0a9e1Fb8a4F9Cccc4aC989C792414927930b1';
const vrfCoordinatorAddress = '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D';
const nftMetashipAddress = '0xec2343d9b4431fa7fc3be12dd9d31b735fcdfa3f';
const sobscriptionId = 3900;
const saleId = 2;
const oldSaleId = 1;
const saleFromAddress = '0x7805D3a3318c66B6BF87853B7663c04F6272a45c';
(async () => {

    const [acc1] = await ethers.getSigners();
    const acc1Address = await acc1.getAddress();
    const contractFactory = await ethers.getContractFactory("RandomMetashipSaleV1");
    const proxy = await contractFactory.attach(proxyAddress);

    // const initTx = await proxy.initialize(vrfCoordinatorAddress, sobscriptionId);
    // await initTx.wait();

    // const finishSaleTx = await proxy.finishSale(oldSaleId, {gasLimit: 300000});
    // await finishSaleTx.wait();

    const json = fs.readFileSync('E:/preparedMetashipIds.json', 'utf-8');
    const tokenIds = JSON.parse(json).results as number[];
    const length = tokenIds.length;
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

    // const setNftAddressTx = await proxy.setNftSmartContractAddress(nftMetashipAddress);
    // await setNftAddressTx.wait();

    const startSaleTx = await proxy.startSale(saleId);
    await startSaleTx.wait();


})().then(_ => console.log('done'));
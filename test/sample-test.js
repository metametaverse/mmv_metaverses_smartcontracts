const { expect, assert } = require('chai');
const { ethers } = require('hardhat');
// import {ethers} from "hardhat";

describe('RandomMinter', function () {
    if(0 === 0)
        return;
        
    it('Should transfer random nft from owner wallet to smart contract caller', async function () {
        [acc1, acc2, acc3, acc4] = await ethers.getSigners();
        const MetashipsNft = await ethers.getContractFactory('MetashipNft', acc1);
        const metashipNftContract = await MetashipsNft.deploy();
        await metashipNftContract.deployed();

        const tokenIds = [];

        console.log('Pre mint metaships to address', acc1.address);
        const transactions = [];
        for (let i = 0; i <= 50; i++) {
            let tx = await metashipNftContract.Mint();
            transactions.push(tx);
        }

        await Promise.all(transactions);

        for (let i = 1; i <= 672; i++) {
            const tx = await metashipNftContract
                .connect(acc1)
                .transferFrom(acc1.address, acc4.address, ethers.utils.formatUnits(i.toString(), 0));
            await tx.wait();
        }

        const RandomMetashipMint = await ethers.getContractFactory('MintRandomNft');
        const randomMetashipNftContract = await RandomMetashipMint.deploy();
        await randomMetashipNftContract.deployed();

        const randomMetashipNftContractAddress = randomMetashipNftContract.address;

        // SET approval for contract address
        console.log(`SET approval for all for operator ${randomMetashipNftContractAddress}`);
        tx = await metashipNftContract.setApprovalForAll(randomMetashipNftContractAddress, true);
        await tx.wait();

        // Define token contract of metaships nft
        tx = await randomMetashipNftContract.setTokenContract(metashipNftContract.address, acc1.address);
        await tx.wait();

        // mintRandom from acc2
        tx = await randomMetashipNftContract
            .connect(acc2)
            .mintRandom('test mint', { value: ethers.utils.parseEther('0.2') });
        let txResult = await tx.wait();
        let event = txResult.events[2];
        let eventData = await event.decode(event.data, event.topics);

        expect(eventData.from).to.be.equal(acc1.address);
        expect(eventData.to).to.be.equal(acc2.address);
        expect(eventData.memo).to.be.equal('test mint');

        tokenIds.push(+ethers.utils.formatUnits(eventData.tokenId, 0));

        //Verify owner of minted token
        let ownerAddress = await metashipNftContract.ownerOf(eventData.tokenId);
        expect(ownerAddress).to.be.equal(acc2.address);

        // mintRandom from acc3
        tx = await randomMetashipNftContract
            .connect(acc3)
            .mintRandom('test mint acc3', { value: ethers.utils.parseEther('0.2') });
        txResult = await tx.wait();
        event = txResult.events[2];
        eventData = await event.decode(event.data, event.topics);

        expect(eventData.from).to.be.equal(acc1.address);
        expect(eventData.to).to.be.equal(acc3.address);
        expect(eventData.memo).to.be.equal('test mint acc3');

        tokenIds.push(+ethers.utils.formatUnits(eventData.tokenId, 0));

        //Verify owner of minted token
        ownerAddress = await metashipNftContract.ownerOf(eventData.tokenId);
        expect(ownerAddress).to.be.equal(acc3.address);

        console.log('here333');

        let availableSupply = await randomMetashipNftContract.getAvailableSupply();
        let availableSupplyFormatted = +ethers.utils.formatUnits(availableSupply, 0);
        console.log(availableSupplyFormatted);
        expect(availableSupplyFormatted).to.be.equal(18);
        
        await randomMetashipNftContract.connect(acc1).setCurrentSupply(100);

        let mintTxs = [];
        for (let i = 0; i < 98; i++) {
            const transaction = await randomMetashipNftContract
                .connect(acc2)
                .mintRandom('test mint', { value: ethers.utils.parseEther('0.2') });
            txResult = await transaction.wait();
            event = txResult.events[2];
            eventData = await event.decode(event.data, event.topics);
            mintTxs.push(transaction);
            tokenIds.push(+ethers.utils.formatUnits(eventData.tokenId, 0));
        }

        //await Promise.all(mintTxs);

        let currentPrice = await randomMetashipNftContract.CurrentPrice();
        console.log(ethers.utils.formatEther(currentPrice));

        let alreadySoldCount = await randomMetashipNftContract.getAlreadySoldCount();
        let alreadySoldCountFormated = +ethers.utils.formatUnits(alreadySoldCount, 0);
        console.log(alreadySoldCountFormated);

        expect(alreadySoldCountFormated).to.be.equal(100);
        expect(currentPrice).to.be.equal(ethers.utils.parseEther('0.206'));

        await expect(
            randomMetashipNftContract
                .connect(acc3)
                .mintRandom('test mint acc3', { value: ethers.utils.parseEther('0.2') })
        ).to.be.revertedWith('Not enough ether');

        mintTxs = [];
        let value = 0.206;
        console.log('here444');

        const currentSupply = await randomMetashipNftContract.currentSupply();
        console.log(+ethers.utils.formatUnits(currentSupply, 0));

        await expect(
            randomMetashipNftContract
                .connect(acc2)
                .mintRandom('test mint', { value: ethers.utils.parseEther(value.toString()) })
        ).to.be.revertedWith('All metaships from current batch already sold, wait for next batch');

        await randomMetashipNftContract.connect(acc1).setCurrentSupply(4300);

        for (let i = 1; i <= 4200; i++) {
            const transaction = await randomMetashipNftContract
                .connect(acc2)
                .mintRandom('test mint', { value: ethers.utils.parseEther(value.toString()) });
            mintTxs.push(transaction);
            if (i % 100 === 0) {
                value = value * 1.0300000000001;
            }

            txResult = await transaction.wait();
            event = txResult.events[2];
            eventData = await event.decode(event.data, event.topics);
            mintTxs.push(transaction);
            tokenIds.push(+ethers.utils.formatUnits(eventData.tokenId, 0));
        }

        //await Promise.all(mintTxs);

        currentPrice = await randomMetashipNftContract.CurrentPrice();
        const price = +ethers.utils.formatEther(currentPrice);
        expect(price).to.be.greaterThan(0.71).lessThan(0.72);

        console.log('here555');

        await expect(
          randomMetashipNftContract
              .connect(acc3)
              .mintRandom('test mint acc3', { value: ethers.utils.parseEther('0.2') })
          ).to.be.revertedWith('Not enough ether');

        await randomMetashipNftContract.connect(acc1).setCurrentSupply(4346);


        mintTxs = [];
        for (let i = 0; i < 44; i++) {
            const transaction = await randomMetashipNftContract
                .connect(acc2)
                .mintRandom('test mint', { value: ethers.utils.parseEther(value.toString()) });
            mintTxs.push(transaction);

            txResult = await transaction.wait();
            event = txResult.events[2];
            eventData = await event.decode(event.data, event.topics);
            mintTxs.push(transaction);
            tokenIds.push(+ethers.utils.formatUnits(eventData.tokenId, 0));
        }

        //await Promise.all(mintTxs);

        expect(
            randomMetashipNftContract
                .connect(acc2)
                .mintRandom('test mint', { value: ethers.utils.parseEther(value.toString()) })
        ).to.be.revertedWith('All metaships already minted');

        let balance = await metashipNftContract.connect(acc3).balanceOf(acc3.address);
        let balanceParsed = +ethers.utils.formatUnits(balance, 0);
        expect(balanceParsed).to.be.equal(1);

        balance = await metashipNftContract.connect(acc2).balanceOf(acc2.address);
        balanceParsed = +ethers.utils.formatUnits(balance, 0);
        expect(balanceParsed).to.be.equal(4343);

        tokenIds.sort((a, b) => a - b);
        console.log(balanceParsed);
        console.log(tokenIds);

        expect(tokenIds[0]).to.be.equal(673);
        expect(tokenIds.pop()).to.be.equal(5016);
    });
});

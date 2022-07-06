const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
// import {ethers} from "hardhat";

describe("RandomMinter", function () {

  it("Should transfer random nft from owner wallet to smart contract caller", async function () {
    expect(4.385).to.be.greaterThan(4.38).lessThan(4.39);
    console.log('ok');
    [acc1, acc2, acc3] = await ethers.getSigners();
    const MetashipsNft = await ethers.getContractFactory("MetashipNft", acc1);
    const metashipNftContract = await MetashipsNft.deploy();
    await metashipNftContract.deployed();

    console.log('Pre mint metaships to address', acc1.address);
    const transactions = [];
    for(let i = 0; i <= 50; i++){
      let tx = await metashipNftContract.Mint();
      transactions.push(tx);
    }

    await Promise.all(transactions);

    const RandomMetashipMint = await ethers.getContractFactory("MintRandomNft");
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
    tx = await randomMetashipNftContract.connect(acc2).mintRandom("test mint", {value: ethers.utils.parseEther("0.1")});
    let txResult = await tx.wait();
    let event = txResult.events[2];
    let eventData = await event.decode(event.data, event.topics);

    expect(eventData.from).to.be.equal(acc1.address);
    expect(eventData.to).to.be.equal(acc2.address);
    expect(eventData.memo).to.be.equal("test mint");

    //Verify owner of minted token
    let ownerAddress = await metashipNftContract.ownerOf(eventData.tokenId);
    expect(ownerAddress).to.be.equal(acc2.address);

    // mintRandom from acc3
    tx = await randomMetashipNftContract.connect(acc3).mintRandom("test mint acc3", {value: ethers.utils.parseEther("0.1")});
    txResult = await tx.wait();
    event = txResult.events[2];
    eventData = await event.decode(event.data, event.topics);

    expect(eventData.from).to.be.equal(acc1.address);
    expect(eventData.to).to.be.equal(acc3.address);
    expect(eventData.memo).to.be.equal("test mint acc3");

    //Verify owner of minted token
    ownerAddress = await metashipNftContract.ownerOf(eventData.tokenId);
    expect(ownerAddress).to.be.equal(acc3.address);

    let mintTxs = [];
    for(let i = 0; i < 98; i++) {
      const transaction = await randomMetashipNftContract.connect(acc2).mintRandom("test mint", {value: ethers.utils.parseEther("0.1")});
      mintTxs.push(transaction);
    }

    await Promise.all(mintTxs);

    let currentPrice = await randomMetashipNftContract.CurrentPrice();
    console.log(currentPrice);
    console.log(ethers.utils.formatEther(currentPrice));
    
    expect(currentPrice).to.be.equal(ethers.utils.parseEther('0.103'));

    await expect(randomMetashipNftContract.connect(acc3).mintRandom("test mint acc3", {value: ethers.utils.parseEther("0.1")})).to.be.revertedWith('Not enough ether');

    mintTxs = [];
    let value = 0.103;
    for(let i = 1; i <= 4900; i++) {

      const transaction = await randomMetashipNftContract.connect(acc2).mintRandom("test mint", {value: ethers.utils.parseEther(value.toString())});
      mintTxs.push(transaction);
      if (i % 100 === 0){
        value = value * 1.0300000000001;
      }
    }

    await Promise.all(mintTxs);

    currentPrice = await randomMetashipNftContract.CurrentPrice();
    console.log(currentPrice);
    const price = +ethers.utils.formatEther(currentPrice);
    expect(price).to.be.greaterThan(0.438).lessThan(0.439);

    mintTxs = [];
    for(let i = 0; i < 16; i++){
      const transaction = await randomMetashipNftContract.connect(acc2).mintRandom("test mint", {value: ethers.utils.parseEther(value.toString())});
      mintTxs.push(transaction);
    }

    await Promise.all(mintTxs);

    expect(randomMetashipNftContract.connect(acc2).mintRandom("test mint", {value: ethers.utils.parseEther(value.toString())}))
      .to.be.revertedWith('All metaships already minted');
  })
});

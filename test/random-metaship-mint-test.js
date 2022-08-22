const { expect, assert } = require('chai');
const { utils } = require('ethers');
const { ethers, ContractTransaction } = require('hardhat');

describe('RandomMinter', function () {
    it('Should fail after 100 sold', async function () {
        [acc1, acc2, acc3, acc4] = await ethers.getSigners();
        const nftContract = await deployNftSmartContract(acc1);
        const vrfCoordinator = await deployVrfCoordinatorMockSmartContract(acc1);
        const randomMetashipMinterContract = await deployRandomNftMinterSmartContract(vrfCoordinator);

        let tx = await vrfCoordinator.setConsumer(randomMetashipMinterContract.address);
        await tx.wait();

        await preMintNftCollection(nftContract, randomMetashipMinterContract.address, acc1, acc4);
        await setContractAddress(randomMetashipMinterContract, nftContract.address, acc1.address);
        await prepareRandomWords(vrfCoordinator, acc1);

        tx = await randomMetashipMinterContract.connect(acc1).setCurrentSupply(5016);
        await tx.wait();

        let currentPrice = 0.2;

        for (let i = 1; i <= 100; i++) {
            try {
                let tx = await randomMetashipMinterContract
                    .connect(acc2)
                    .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) });
                await tx.wait();

                // const res = await vrfCoordinator.getResponse(i);
                // console.log("random: ", +ethers.utils.formatUnits(res.randomWords[0], 0));
                // //const random = +ethers.utils.parseUnits(res.randomWords[0], 0);
                // //console.log('random: ', random);
                tx = await vrfCoordinator.fulfillRandomWords(i);
                await tx.wait();
            } catch (ex) {
                console.log(currentPrice);
                throw ex;
            }
        }

        await expect(
            randomMetashipMinterContract
                .connect(acc2)
                .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) })
        ).to.be.revertedWith('Not enough ether');

        currentPrice = currentPrice * 103 / 100;
        
        tx = await randomMetashipMinterContract
                    .connect(acc2)
                    .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) });
        await tx.wait();
    });

    it('Should sell all nfts and fail after 5016 sold', async function () {
        [acc1, acc2, acc3, acc4] = await ethers.getSigners();
        const nftContract = await deployNftSmartContract(acc1);
        const vrfCoordinator = await deployVrfCoordinatorMockSmartContract(acc1);
        const randomMetashipMinterContract = await deployRandomNftMinterSmartContract(vrfCoordinator);

        let tx = await vrfCoordinator.setConsumer(randomMetashipMinterContract.address);
        await tx.wait();

        await preMintNftCollection(nftContract, randomMetashipMinterContract.address, acc1, acc4);
        await setContractAddress(randomMetashipMinterContract, nftContract.address, acc1.address);
        await prepareRandomWords(vrfCoordinator, acc1);

        tx = await randomMetashipMinterContract.connect(acc1).setCurrentSupply(5016);
        await tx.wait();

        let currentPrice = 0.2;

        for (let i = 1; i <= 5016; i++) {
            if ((i - 1) % 100 === 0 && i !== 1) {
                currentPrice = +((currentPrice * 103) / 100).toFixed(2);
            }
            try {
                let tx = await randomMetashipMinterContract
                    .connect(acc2)
                    .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) });
                await tx.wait();

                // const res = await vrfCoordinator.getResponse(i);
                // console.log("random: ", +ethers.utils.formatUnits(res.randomWords[0], 0));
                // //const random = +ethers.utils.parseUnits(res.randomWords[0], 0);
                // //console.log('random: ', random);
                tx = await vrfCoordinator.fulfillRandomWords(i);
                await tx.wait();
            } catch (ex) {
                console.log(currentPrice);
                throw ex;
            }
        }

        await expect(
            randomMetashipMinterContract
                .connect(acc2)
                .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) })
        ).to.be.revertedWith('All metaships already minted');
    });

    it('Should sell all nfts and fail after 5016 sold when 500 nfts on another wallet', async function () {
        [acc1, acc2, acc3, acc4] = await ethers.getSigners();
        const nftContract = await deployNftSmartContract(acc1);
        const vrfCoordinator = await deployVrfCoordinatorMockSmartContract(acc1);
        const randomMetashipMinterContract = await deployRandomNftMinterSmartContract(vrfCoordinator);

        let tx = await vrfCoordinator.setConsumer(randomMetashipMinterContract.address);
        await tx.wait();

        await preMintNftCollection(nftContract, randomMetashipMinterContract.address, acc1, acc4);
        await setContractAddress(randomMetashipMinterContract, nftContract.address, acc1.address);
        await prepareRandomWords(vrfCoordinator, acc1);
        await sendRandomTokensToAnotherAddress(nftContract, acc1, acc4);

        tx = await randomMetashipMinterContract.connect(acc1).setCurrentSupply(5016);
        await tx.wait();

        let currentPrice = 0.2;

        for (let i = 1; i <= 4516; i++) {
            if ((i - 1) % 100 === 0 && i !== 1) {
                currentPrice = +((currentPrice * 103) / 100).toFixed(2);
            }

            try {
                let tx = await randomMetashipMinterContract
                    .connect(acc2)
                    .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) });
                await tx.wait();

                tx = await vrfCoordinator.fulfillRandomWords(i, { gasLimit: ethers.utils.formatUnits('2500000', 0) });
                await tx.wait();
            } catch (ex) {
                console.log(currentPrice);
                throw ex;
            }
        }

        const mintNft = async () => {
            tx = await randomMetashipMinterContract
                .connect(acc2)
                .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) });
            await tx.wait();

            tx = await vrfCoordinator.fulfillRandomWords(i, { gasLimit: ethers.utils.formatUnits('2500000', 0) });
            await tx.wait();
        }

        await expect(
            mintNft()
        ).to.be.revertedWith('All metaships already minted');
    });

    it('Should sell all nfts and fail after 5016 sold when 25 first nfts on another wallet', async function () {
        [acc1, acc2, acc3, acc4] = await ethers.getSigners();
        const nftContract = await deployNftSmartContract(acc1);
        const vrfCoordinator = await deployVrfCoordinatorMockSmartContract(acc1);
        const randomMetashipMinterContract = await deployRandomNftMinterSmartContract(vrfCoordinator);

        let tx = await vrfCoordinator.setConsumer(randomMetashipMinterContract.address);
        await tx.wait();

        await preMintNftCollection(nftContract, randomMetashipMinterContract.address, acc1, acc4);
        await setContractAddress(randomMetashipMinterContract, nftContract.address, acc1.address);
        await prepareRandomWords(vrfCoordinator, acc1);
        await sendFirstTokensToAnotherAddress(nftContract, acc1, acc4, 25);

        tx = await randomMetashipMinterContract.connect(acc1).setCurrentSupply(5016);
        await tx.wait();

        let currentPrice = 0.2;

        const soldTokens = new Set([]);

        for (let i = 1; i <= 4991; i++) {
            if ((i - 1) % 100 === 0 && i !== 1) {
                currentPrice = +((currentPrice * 103) / 100).toFixed(2);
            }

            // if (i % 300 == 0) console.log(i);

            try {
                let tx = await randomMetashipMinterContract
                    .connect(acc2)
                    .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) });
                await tx.wait();

                tx = await vrfCoordinator.fulfillRandomWords(i, { gasLimit: ethers.utils.formatUnits('2500000', 0) });
                const res = await tx.wait();

                const sig = 'RandomlyMinted(address,address,uint256[])';
                const topicHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(sig));

                const log = res.logs.filter((s) => s.topics[0] === topicHash)[0];

                const iFace = new ethers.utils.Interface(`[{
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "from",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256[]",
                            "name": "tokenIds",
                            "type": "uint256[]"
                        }
                    ],
                    "name": "RandomlyMinted",
                    "type": "event"
                }]`);

                const parsedLog = iFace.parseLog(log);
                parsedLog.args['tokenIds'].forEach((s) => {
                    soldTokens.add(+ethers.utils.formatUnits(s, 0));
                });
            } catch (ex) {
                console.log(currentPrice);
                console.log(i);
                throw ex;
            }
        }

        let mintNftFunction = async () => {
            let tx = await randomMetashipMinterContract
                .connect(acc2)
                .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) });
            await tx.wait();
            tx = await vrfCoordinator.fulfillRandomWords(4997, { gasLimit: ethers.utils.formatUnits('2500000', 0) });
            await tx.wait();
        };

        const soldTokensSorded = Array.from(soldTokens);
        soldTokensSorded.sort((c, d) => c - d);

        await expect(mintNftFunction()).to.be.revertedWith('All metaships already minted');
        await expect(soldTokensSorded[0]).to.be.equal(26);
        await expect(soldTokensSorded[soldTokensSorded.length - 1]).to.be.equal(5016);
        await expect(soldTokensSorded.length).to.be.equal(4991);
    });

    it('Should sell all nfts with batches and fail after 5016 sold', async function () {
        [acc1, acc2, acc3, acc4] = await ethers.getSigners();
        const nftContract = await deployNftSmartContract(acc1);
        const vrfCoordinator = await deployVrfCoordinatorMockSmartContract(acc1);
        const randomMetashipMinterContract = await deployRandomNftMinterSmartContract(vrfCoordinator);
        
        let tx = await vrfCoordinator.setConsumer(randomMetashipMinterContract.address);
        await tx.wait();

        await preMintNftCollection(nftContract, randomMetashipMinterContract.address, acc1, acc4);
        await setContractAddress(randomMetashipMinterContract, nftContract.address, acc1.address);
        await prepareRandomWords(vrfCoordinator, acc1);
        
        tx = await randomMetashipMinterContract.connect(acc1).setCurrentSupply(5016);
        await tx.wait();

        let currentPrice = 0.2;

        for (let i = 1; i <= 250; i++) {
            if ((i - 1) % 5 === 0 && i !== 1) {
                currentPrice = +((currentPrice * 103) / 100).toFixed(2);
            }

            if (i % 10 === 0) {
                console.log(i);
            }

            try {
                let tx = await randomMetashipMinterContract
                    .connect(acc2)
                    .mintRandom(20, { value: ethers.utils.parseEther((currentPrice * 20).toString()) });
                await tx.wait();

                tx = await vrfCoordinator.fulfillRandomWords(i);
                await tx.wait();
            } catch (ex) {
                console.log(currentPrice);
                console.log(i);
                throw ex;
            }
        }
        currentPrice = +((currentPrice * 103) / 100).toFixed(2);

        tx = await randomMetashipMinterContract
            .connect(acc2)
            .mintRandom(16, { value: ethers.utils.parseEther((currentPrice * 16).toString()) });
        await tx.wait();

        tx = await vrfCoordinator.fulfillRandomWords(251);
        await tx.wait();

        await expect(
            randomMetashipMinterContract
                .connect(acc2)
                .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) })
        ).to.be.revertedWith('All metaships already minted');
    });

    it('Should sell all nfts with batches and fail after 5016 sold when 500 sent on another address', async function () {
        [acc1, acc2, acc3, acc4] = await ethers.getSigners();
        const nftContract = await deployNftSmartContract(acc1);
        const vrfCoordinator = await deployVrfCoordinatorMockSmartContract(acc1);
        const randomMetashipMinterContract = await deployRandomNftMinterSmartContract(vrfCoordinator);

        let tx = await vrfCoordinator.setConsumer(randomMetashipMinterContract.address);
        await tx.wait();

        await preMintNftCollection(nftContract, randomMetashipMinterContract.address, acc1, acc4);
        await setContractAddress(randomMetashipMinterContract, nftContract.address, acc1.address);
        await prepareRandomWords(vrfCoordinator, acc1);
        await sendRandomTokensToAnotherAddress(nftContract, acc1, acc2);

        tx = await randomMetashipMinterContract.connect(acc1).setCurrentSupply(5016);
        await tx.wait();

        let currentPrice = 0.2;

        for (let i = 1; i <= 225; i++) {
            if ((i - 1) % 5 === 0 && i !== 1) {
                currentPrice = +((currentPrice * 103) / 100).toFixed(2);
            }

            if (i % 10 === 0) {
                console.log(i);
            }

            try {
                let tx;
                if(i < 100){
                    tx = await randomMetashipMinterContract
                    .connect(acc2)
                    .mintRandom(20, { value: ethers.utils.parseEther((currentPrice * 20).toString()) });
                } else {
                    tx = await randomMetashipMinterContract
                    .connect(acc3)
                    .mintRandom(20, { value: ethers.utils.parseEther((currentPrice * 20).toString()) });
                }
                
                await tx.wait();

                tx = await vrfCoordinator.fulfillRandomWords(i);
                await tx.wait();
            } catch (ex) {
                console.log(currentPrice);
                console.log(i);
                throw ex;
            }
        }
        currentPrice = +((currentPrice * 103) / 100).toFixed(2);

        tx = await randomMetashipMinterContract
            .connect(acc2)
            .mintRandom(16, { value: ethers.utils.parseEther((currentPrice * 16).toString()) });
        await tx.wait();

        tx = await vrfCoordinator.fulfillRandomWords(226);
        await tx.wait();

        await expect(
            randomMetashipMinterContract
                .connect(acc2)
                .mintRandom(1, { value: ethers.utils.parseEther(currentPrice.toString()) })
        ).to.be.revertedWith('All metaships already minted');
    });
});

async function deployNftSmartContract(acc) {
    const MetashipsNft = await ethers.getContractFactory('MetashipNft', acc);
    const nftContract = await MetashipsNft.deploy();
    await nftContract.deployed();

    return nftContract;
}

async function preMintNftCollection(nftContract, randomMetashipNftContractAddress, acc1, acc2) {
    console.log('Pre mint metaships to address', acc1.address);

    for (let i = 0; i <= 50; i++) {
        let tx = await nftContract.connect(acc1).Mint();
        await tx.wait();
    }

    console.log('Pre-mint completed');

    console.log(`SET approval for all for operator ${randomMetashipNftContractAddress}`);
    tx = await nftContract.connect(acc1).setApprovalForAll(randomMetashipNftContractAddress, true);
    await tx.wait();

    console.log('NFT preparation done.');
}

async function deployRandomNftMinterSmartContract(vrfCoordinator) {
    console.log('Deploy Random NFT Minter with VRF Address: ', vrfCoordinator.address);

    const RandomMetashipMint = await ethers.getContractFactory('MintRandomNft');
    const randomMetashipNftContract = await RandomMetashipMint.deploy(123, vrfCoordinator.address);
    await randomMetashipNftContract.deployed();

    console.log('Random NFT Minter Deployment Completed');
    return randomMetashipNftContract;
}

async function deployVrfCoordinatorMockSmartContract() {
    console.log('Deploy Vrf Coordinator Mock');

    const VrfCoordinator = await ethers.getContractFactory('MockVRFCoordinator');
    const vrfCoordinatorSmartContract = await VrfCoordinator.deploy();
    await vrfCoordinatorSmartContract.deployed();
    console.log('Vrf Coordinator Deployment Completed');
    return vrfCoordinatorSmartContract;
}

async function setContractAddress(rdMetashipMinterContract, nftContractAddress, saleFromAddress) {
    console.log(`Set Token Contract: ${nftContractAddress}. Sale From: ${saleFromAddress}`);
    let tx = await rdMetashipMinterContract.setTokenContract(nftContractAddress, saleFromAddress);
    await tx.wait();
    console.log('Token Contract Set');
}

async function prepareRandomWords(vrfCoordinator, acc) {
    const randomTokenIds = getRandomNumbers(5016); //[4,7,2,6,3,9,1,10,8,5];

    for (let i = 0; i < 5016; i++) {
        const tokenId = ethers.utils.parseUnits(randomTokenIds[i].toString(), 0);

        const tx = await vrfCoordinator.connect(acc).setRandomWords(i + 1, tokenId);
        await tx.wait();
    }

    console.log('Random Words Prepared');
}

async function sendRandomTokensToAnotherAddress(nftContract, acc1, acc2) {
    const randomTokenIds = getRandomNumbers(500);

    for (let i = 0; i < 500; i++) {
        const tx = await nftContract.transferFrom(
            acc1.address,
            acc2.address,
            ethers.utils.formatUnits(randomTokenIds[i].toString(), 0)
        );
        await tx.wait();
    }

    console.log('Random tokens sent to wallet: ', acc2.address);
}

async function sendFirstTokensToAnotherAddress(nftContract, acc1, acc2, count) {
    for (let i = 1; i <= count; i++) {
        const tx = await nftContract.transferFrom(
            acc1.address,
            acc2.address,
            ethers.utils.formatUnits(i.toString(), 0)
        );
        await tx.wait();
    }

    console.log(`First ${count} tokens sent to wallet: `, acc2.address);
}

function getRandomNumbers(count) {
    const randomTokenIdsSet = new Set([]);

    while (randomTokenIdsSet.size < count) {
        let rd = Math.floor(1 + ((Math.random() * 125478569842) % 5016));
        if (rd === 0) {
            rd = 1;
        } else if (rd > 5016) {
            rd = 5016;
        }

        randomTokenIdsSet.add(rd);
    }

    const randomTokenIds = Array.from(randomTokenIdsSet);
    return randomTokenIds;
}

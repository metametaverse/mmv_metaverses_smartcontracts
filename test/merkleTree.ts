import { describe, it } from "mocha";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

const keyHash = '0x48656c6c6f576f726c6400000000000000000000000000000000000000000000';
describe("MerkleTree", function () {
    it("Basic", async function () {
        const [acc1, acc2] = await ethers.getSigners();
        const acc1Address = await acc1.getAddress();
        const acc2Address = await acc2.getAddress();

        const nftDeployer = await ethers.getContractFactory('NftForTest', acc1 as any);
        const nft = await nftDeployer.deploy() as Contract;
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();

        const vrfCoordinatorDeployer = await ethers.getContractFactory("MockVRFCoordinator", acc1 as any);
        const vrfCoordinator = await vrfCoordinatorDeployer.deploy() as Contract;
        await vrfCoordinator.waitForDeployment();
        const vrfCoordinatorAddress = vrfCoordinator.getAddress();

        const proxyAdminDeployer = await ethers.getContractFactory('ProxyAdmin', acc1 as any);
        const proxyAdmin = await proxyAdminDeployer.deploy() as Contract;
        await proxyAdmin.waitForDeployment();
        const proxyAdminAddress = await proxyAdmin.getAddress();
        console.log('ProxyAdmin:', proxyAdminAddress);

        const implementationDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const implementation = await implementationDeployer.deploy() as Contract;
        await implementation.waitForDeployment();
        const implementationAddress = await implementation.getAddress();
        console.log('Implementation:', implementationAddress);

        const proxyDeployer = await ethers.getContractFactory('Proxy', acc1 as any);
        const proxy = await proxyDeployer.deploy(proxyAdminAddress, implementationAddress) as Contract;
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();
        console.log('Proxy:', proxyAddress);

        const contractDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const contract = await contractDeployer.attach(proxyAddress);

        const initTx = await contract.initialize(vrfCoordinatorAddress, 3900, keyHash, nftAddress);
        await initTx.wait();

        for (let i = 0; i < 10; i++) {
            const mintTx = await nft.Mint();
            await mintTx.wait();

            const tokenIds = Array.from(Array(100).keys()).map(s => s + + 100 * i + 1);

            const setTokenIdsForSaleTx = await contract.setTokensForSale(1, tokenIds, i * 100);
            const res = await setTokenIdsForSaleTx.wait();
            console.log(res.gasUsed);
        }

        const setSaleTx = await contract.setSale(1, ethers.parseEther("0.02"), 3, 100, 1000, acc1Address);
        await setSaleTx.wait();

        await expect((contract.connect(acc2) as Contract).buy(1, 1, { value: ethers.parseEther('0.03'), gasLimit: 300000 })).to.be.revertedWith('Sale already closed or not started yet')

        const startSaleTx = await contract.startSale(1);
        await startSaleTx.wait();

        const setApproveTx = await nft.setApprovalForAll(proxyAddress, true);
        await setApproveTx.wait();

        const setConsumerTx = await vrfCoordinator.setConsumer(proxyAddress);
        await setConsumerTx.wait();

        await prepareRandomWords(vrfCoordinator, acc1);

        const gases = [];
        for (let i = 1; i <= 1000; i++) {
            const buyTx = await (contract.connect(acc2) as Contract).buy(1, 1, { value: ethers.parseEther('0.03'), gasLimit: 300000 });
            await buyTx.wait();

            const fulfillTx = await vrfCoordinator.fulfillRandomWords(i);
            const res = await fulfillTx.wait();
            gases.push(+ethers.formatUnits(res.gasUsed, 0));
        }

        console.log(Math.max(...gases));

        await expect(contract.buy(1, 1, { value: ethers.parseEther('0.05') })).to.be.revertedWith('All metaships already sold');
    });

    it("BatchPurchase", async function () {
        const [acc1, acc2] = await ethers.getSigners();
        const acc1Address = await acc1.getAddress();
        const acc2Address = await acc2.getAddress();

        const nftDeployer = await ethers.getContractFactory('NftForTest', acc1 as any);
        const nft = await nftDeployer.deploy() as Contract;
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();

        const vrfCoordinatorDeployer = await ethers.getContractFactory("MockVRFCoordinator", acc1 as any);
        const vrfCoordinator = await vrfCoordinatorDeployer.deploy() as Contract;
        await vrfCoordinator.waitForDeployment();
        const vrfCoordinatorAddress = vrfCoordinator.getAddress();

        const proxyAdminDeployer = await ethers.getContractFactory('ProxyAdmin', acc1 as any);
        const proxyAdmin = await proxyAdminDeployer.deploy() as Contract;
        await proxyAdmin.waitForDeployment();
        const proxyAdminAddress = await proxyAdmin.getAddress();
        console.log('ProxyAdmin:', proxyAdminAddress);

        const implementationDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const implementation = await implementationDeployer.deploy() as Contract;
        await implementation.waitForDeployment();
        const implementationAddress = await implementation.getAddress();
        console.log('Implementation:', implementationAddress);

        const proxyDeployer = await ethers.getContractFactory('Proxy', acc1 as any);
        const proxy = await proxyDeployer.deploy(proxyAdminAddress, implementationAddress) as Contract;
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();
        console.log('Proxy:', proxyAddress);

        const contractDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const contract = await contractDeployer.attach(proxyAddress);

        const initTx = await contract.initialize(vrfCoordinatorAddress, 3900, keyHash, nftAddress);
        await initTx.wait();

        for (let i = 0; i < 10; i++) {
            const mintTx = await nft.Mint();
            await mintTx.wait();

            const tokenIds = Array.from(Array(100).keys()).map(s => s + + 100 * i + 1);

            const setTokenIdsForSaleTx = await contract.setTokensForSale(1, tokenIds, i * 100);
            const res = await setTokenIdsForSaleTx.wait();
            console.log(res.gasUsed);
        }

        const setSaleTx = await contract.setSale(1, ethers.parseEther("0.02"), 3, 100, 1000, acc1Address);
        await setSaleTx.wait();

        const startSaleTx = await contract.startSale(1);
        await startSaleTx.wait();

        const setApproveTx = await nft.setApprovalForAll(proxyAddress, true);
        await setApproveTx.wait();

        const setConsumerTx = await vrfCoordinator.setConsumer(proxyAddress);
        await setConsumerTx.wait();

        await prepareRandomWords2(vrfCoordinator, acc1);

        const gases = [];
        console.log('here');
        for (let i = 1; i <= 50; i++) {
            const buyTx = await (contract.connect(acc2) as Contract).buy(1, 20, { value: ethers.parseEther('0.6'), gasLimit: 1000000 });
            await buyTx.wait();

            const fulfillTx = await vrfCoordinator.fulfillRandomWords(i);
            const res = await fulfillTx.wait();
            gases.push(+ethers.formatUnits(res.gasUsed, 0));
        }

        console.log(Math.max(...gases));

        await expect(contract.buy(1, 1, { value: ethers.parseEther('0.05') })).to.be.revertedWith('All metaships already sold');
    });

    it("PriceIncreased", async function () {
        const [acc1, acc2] = await ethers.getSigners();
        const acc1Address = await acc1.getAddress();
        const acc2Address = await acc2.getAddress();

        const nftDeployer = await ethers.getContractFactory('NftForTest', acc1 as any);
        const nft = await nftDeployer.deploy() as Contract;
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();

        const vrfCoordinatorDeployer = await ethers.getContractFactory("MockVRFCoordinator", acc1 as any);
        const vrfCoordinator = await vrfCoordinatorDeployer.deploy() as Contract;
        await vrfCoordinator.waitForDeployment();
        const vrfCoordinatorAddress = vrfCoordinator.getAddress();

        const proxyAdminDeployer = await ethers.getContractFactory('ProxyAdmin', acc1 as any);
        const proxyAdmin = await proxyAdminDeployer.deploy() as Contract;
        await proxyAdmin.waitForDeployment();
        const proxyAdminAddress = await proxyAdmin.getAddress();
        console.log('ProxyAdmin:', proxyAdminAddress);

        const implementationDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const implementation = await implementationDeployer.deploy() as Contract;
        await implementation.waitForDeployment();
        const implementationAddress = await implementation.getAddress();
        console.log('Implementation:', implementationAddress);

        const proxyDeployer = await ethers.getContractFactory('Proxy', acc1 as any);
        const proxy = await proxyDeployer.deploy(proxyAdminAddress, implementationAddress) as Contract;
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();
        console.log('Proxy:', proxyAddress);

        const contractDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const contract = await contractDeployer.attach(proxyAddress);

        const initTx = await contract.initialize(vrfCoordinatorAddress, 3900, keyHash, nftAddress);
        await initTx.wait();

        for (let i = 0; i < 10; i++) {
            const mintTx = await nft.Mint();
            await mintTx.wait();

            const tokenIds = Array.from(Array(100).keys()).map(s => s + + 100 * i + 1);

            const setTokenIdsForSaleTx = await contract.setTokensForSale(1, tokenIds, i * 100);
            const res = await setTokenIdsForSaleTx.wait();
        }

        const setSaleTx = await contract.setSale(1, ethers.parseEther("0.02"), 3, 100, 1000, acc1Address);
        await setSaleTx.wait();

        const startSaleTx = await contract.startSale(1);
        await startSaleTx.wait();

        console.log('CurrentPrice:', await getCurrentPrice(contract));

        const setApproveTx = await nft.setApprovalForAll(proxyAddress, true);
        await setApproveTx.wait();

        const setConsumerTx = await vrfCoordinator.setConsumer(proxyAddress);
        await setConsumerTx.wait();

        await prepareRandomWords2(vrfCoordinator, acc1);

        const gases = [];
        console.log('here');
        for (let i = 1; i <= 100; i++) {
            const buyTx = await (contract.connect(acc2) as Contract).buy(1, 1, { value: ethers.parseEther('0.02'), gasLimit: 1000000 });
            await buyTx.wait();

            const fulfillTx = await vrfCoordinator.fulfillRandomWords(i);
            const res = await fulfillTx.wait();
            gases.push(+ethers.formatUnits(res.gasUsed, 0));
        }

        const currentPrice = await getCurrentPrice(contract);
        expect(currentPrice).to.be.equal(0.0206);
        await expect(contract.buy(1, 1, { value: ethers.parseEther('0.02') })).to.be.revertedWith('Not enough ether');

        for (let i = 1; i <= 900; i++) {
            const buyTx = await (contract.connect(acc2) as Contract).buy(1, 1, { value: ethers.parseEther('0.04'), gasLimit: 1000000 });
            await buyTx.wait();

            const fulfillTx = await vrfCoordinator.fulfillRandomWords(i);
            const res = await fulfillTx.wait();
            gases.push(+ethers.formatUnits(res.gasUsed, 0));
        }

        const currentPrice2 = await getCurrentPrice(contract);
        expect(currentPrice2).to.be.equal(0.026878327586882435);
        await expect(contract.buy(1, 1, { value: ethers.parseEther('0.05') })).to.be.revertedWith('All metaships already sold');
    });

    it("SecondSale", async function () {
        const [acc1, acc2] = await ethers.getSigners();
        const acc1Address = await acc1.getAddress();
        const acc2Address = await acc2.getAddress();

        const nftDeployer = await ethers.getContractFactory('NftForTest', acc1 as any);
        const nft = await nftDeployer.deploy() as Contract;
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();

        const vrfCoordinatorDeployer = await ethers.getContractFactory("MockVRFCoordinator", acc1 as any);
        const vrfCoordinator = await vrfCoordinatorDeployer.deploy() as Contract;
        await vrfCoordinator.waitForDeployment();
        const vrfCoordinatorAddress = vrfCoordinator.getAddress();

        const proxyAdminDeployer = await ethers.getContractFactory('ProxyAdmin', acc1 as any);
        const proxyAdmin = await proxyAdminDeployer.deploy() as Contract;
        await proxyAdmin.waitForDeployment();
        const proxyAdminAddress = await proxyAdmin.getAddress();
        console.log('ProxyAdmin:', proxyAdminAddress);

        const implementationDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const implementation = await implementationDeployer.deploy() as Contract;
        await implementation.waitForDeployment();
        const implementationAddress = await implementation.getAddress();
        console.log('Implementation:', implementationAddress);

        const proxyDeployer = await ethers.getContractFactory('Proxy', acc1 as any);
        const proxy = await proxyDeployer.deploy(proxyAdminAddress, implementationAddress) as Contract;
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();
        console.log('Proxy:', proxyAddress);

        const contractDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const contract = await contractDeployer.attach(proxyAddress);

        const initTx = await contract.initialize(vrfCoordinatorAddress, 3900, keyHash, nftAddress);
        await initTx.wait();

        for (let i = 0; i < 10; i++) {
            const mintTx = await nft.Mint();
            await mintTx.wait();

            const tokenIds = Array.from(Array(100).keys()).map(s => s + 100 * i + 1);

            const setTokenIdsForSaleTx = await contract.setTokensForSale(1, tokenIds, i * 100);
            const res = await setTokenIdsForSaleTx.wait();
        }

        const setSaleTx = await contract.setSale(1, ethers.parseEther("0.02"), 3, 100, 1000, acc1Address);
        await setSaleTx.wait();

        const startSaleTx = await contract.startSale(1);
        await startSaleTx.wait();
        console.log('CurrentPrice:', await getCurrentPrice(contract));

        const setApproveTx = await nft.setApprovalForAll(proxyAddress, true);
        await setApproveTx.wait();

        const setConsumerTx = await vrfCoordinator.setConsumer(proxyAddress);
        await setConsumerTx.wait();

        await prepareRandomWords2(vrfCoordinator, acc1);

        const gases = [];
        console.log('here');
        for (let i = 1; i <= 100; i++) {
            const buyTx = await (contract.connect(acc2) as Contract).buy(1, 1, { value: ethers.parseEther('0.02'), gasLimit: 1000000 });
            await buyTx.wait();

            const fulfillTx = await vrfCoordinator.fulfillRandomWords(i);
            const res = await fulfillTx.wait();
            gases.push(+ethers.formatUnits(res.gasUsed, 0));
        }

        const stopSaleTx = await contract.finishSale(1);
        await stopSaleTx.wait();
        await expect(contract.buy(1, 1, { value: ethers.parseEther('0.0206') })).to.be.revertedWith('Sale already closed or not started yet');

        const tokenIds = Array.from(Array(100).keys()).map(s => s + 101);
        const setTokenIdsForSaleTx = await contract.setTokensForSale(2, tokenIds, 0);
        await setTokenIdsForSaleTx.wait();

        const setSale2Tx = await contract.setSale(2, ethers.parseEther("0.02"), 3, 10, 100, acc1Address);
        await setSale2Tx.wait();

        const startSale2Tx = await contract.startSale(2);
        await startSale2Tx.wait();

        await expect(contract.buy(1, 1, { value: ethers.parseEther('0.0206') })).to.be.revertedWith('Sale already closed or not started yet');

        const transferTx = await (nft.connect(acc2) as Contract).transferFrom(acc2Address, acc1Address, 101)
        await transferTx.wait();
        console.log('start debugging');
        for (let i = 1; i <= 100; i++) {
            const buyTx = await (contract.connect(acc2) as Contract).buy(2, 1, { value: ethers.parseEther('0.03'), gasLimit: 1000000 });
            await buyTx.wait();

            const fulfillTx = await vrfCoordinator.fulfillRandomWords(100 + i);
            const res = await fulfillTx.wait();
            gases.push(+ethers.formatUnits(res.gasUsed, 0));
        }

        await expect((contract.connect(acc2) as Contract).buy(2, 1, { value: ethers.parseEther('0.03'), gasLimit: 1000000 })).to.be.revertedWith('All metaships already sold')
    });

    it("AccountBalanceAndWithdrowal", async function () {
        const [acc1, acc2] = await ethers.getSigners();
        const acc1Address = await acc1.getAddress();
        const acc2Address = await acc2.getAddress();

        const nftDeployer = await ethers.getContractFactory('NftForTest', acc1 as any);
        const nft = await nftDeployer.deploy() as Contract;
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();

        const vrfCoordinatorDeployer = await ethers.getContractFactory("MockVRFCoordinator", acc1 as any);
        const vrfCoordinator = await vrfCoordinatorDeployer.deploy() as Contract;
        await vrfCoordinator.waitForDeployment();
        const vrfCoordinatorAddress = vrfCoordinator.getAddress();

        const proxyAdminDeployer = await ethers.getContractFactory('ProxyAdmin', acc1 as any);
        const proxyAdmin = await proxyAdminDeployer.deploy() as Contract;
        await proxyAdmin.waitForDeployment();
        const proxyAdminAddress = await proxyAdmin.getAddress();
        console.log('ProxyAdmin:', proxyAdminAddress);

        const implementationDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const implementation = await implementationDeployer.deploy() as Contract;
        await implementation.waitForDeployment();
        const implementationAddress = await implementation.getAddress();
        console.log('Implementation:', implementationAddress);

        const proxyDeployer = await ethers.getContractFactory('Proxy', acc1 as any);
        const proxy = await proxyDeployer.deploy(proxyAdminAddress, implementationAddress) as Contract;
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();
        console.log('Proxy:', proxyAddress);

        const contractDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const contract = await contractDeployer.attach(proxyAddress);

        const initTx = await contract.initialize(vrfCoordinatorAddress, 3900, keyHash, nftAddress);
        await initTx.wait();

        for (let i = 0; i < 10; i++) {
            const mintTx = await nft.Mint();
            await mintTx.wait();

            const tokenIds = Array.from(Array(100).keys()).map(s => s + 100 * i + 1);

            const setTokenIdsForSaleTx = await contract.setTokensForSale(1, tokenIds, i * 100);
            const res = await setTokenIdsForSaleTx.wait();
        }

        const setSaleTx = await contract.setSale(1, ethers.parseEther("0.02"), 3, 100, 1000, acc1Address);
        await setSaleTx.wait();

        const startSaleTx = await contract.startSale(1);
        await startSaleTx.wait();

        console.log('CurrentPrice:', await getCurrentPrice(contract));

        const setApproveTx = await nft.setApprovalForAll(proxyAddress, true);
        await setApproveTx.wait();

        const setConsumerTx = await vrfCoordinator.setConsumer(proxyAddress);
        await setConsumerTx.wait();

        await prepareRandomWords3(vrfCoordinator, acc1);

        const gases = [];
        for (let i = 1; i <= 1000; i++) {

            const currentPrice = await getCurrentPriceString(contract);

            const buyTx = await (contract.connect(acc2) as Contract).buy(1, 1, { value: ethers.parseEther(currentPrice), gasLimit: 1000000 });
            await buyTx.wait();

            const fulfillTx = await vrfCoordinator.fulfillRandomWords(i);
            const res = await fulfillTx.wait();
            gases.push(+ethers.formatUnits(res.gasUsed, 0));
        }

        await expect(contract.buy(1, 1, { value: ethers.parseEther('0.1') })).to.be.revertedWith('All metaships already sold');
        const currentPrice = await getCurrentPrice(contract);

        expect(currentPrice).to.be.equal(0.026878327586882435);

        const balance = +ethers.formatEther(await ethers.provider.getBalance(proxyAddress));
        expect(balance).to.be.greaterThan(22.9);
        expect(balance).to.be.lessThan(23);

        const balanceAcc2Init = +ethers.formatEther(await ethers.provider.getBalance(acc2Address));
        const withDrowalTx = await contract.withdrowal(acc2Address);
        await withDrowalTx.wait();
        const balanceAcc2 = +ethers.formatEther(await ethers.provider.getBalance(acc2Address));

        expect(balanceAcc2 - balanceAcc2Init).to.be.greaterThan(balance - 0.005);
        expect(balanceAcc2 - balanceAcc2Init).to.be.lessThan(balance + 0.005);
    });

    it("OnlyOperator", async function () {
        const [acc1, acc2] = await ethers.getSigners();
        const acc1Address = await acc1.getAddress();
        const acc2Address = await acc2.getAddress();

        const nftDeployer = await ethers.getContractFactory('NftForTest', acc1 as any);
        const nft = await nftDeployer.deploy() as Contract;
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();

        const vrfCoordinatorDeployer = await ethers.getContractFactory("MockVRFCoordinator", acc1 as any);
        const vrfCoordinator = await vrfCoordinatorDeployer.deploy() as Contract;
        await vrfCoordinator.waitForDeployment();
        const vrfCoordinatorAddress = vrfCoordinator.getAddress();

        const proxyAdminDeployer = await ethers.getContractFactory('ProxyAdmin', acc1 as any);
        const proxyAdmin = await proxyAdminDeployer.deploy() as Contract;
        await proxyAdmin.waitForDeployment();
        const proxyAdminAddress = await proxyAdmin.getAddress();
        console.log('ProxyAdmin:', proxyAdminAddress);

        const implementationDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const implementation = await implementationDeployer.deploy() as Contract;
        await implementation.waitForDeployment();
        const implementationAddress = await implementation.getAddress();
        console.log('Implementation:', implementationAddress);

        const proxyDeployer = await ethers.getContractFactory('Proxy', acc1 as any);
        const proxy = await proxyDeployer.deploy(proxyAdminAddress, implementationAddress) as Contract;
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();
        console.log('Proxy:', proxyAddress);

        const contractDeployer = await ethers.getContractFactory('RandomMetashipSaleV1', acc1 as any);
        const contract = await contractDeployer.attach(proxyAddress);

        const initTx = await contract.initialize(vrfCoordinatorAddress, 3900, keyHash, nftAddress);
        await initTx.wait();

        for (let i = 0; i < 10; i++) {
            const mintTx = await nft.Mint();
            await mintTx.wait();

            const tokenIds = Array.from(Array(100).keys()).map(s => s + + 100 * i + 1);

            const setTokenIdsForSaleTx = await contract.setTokensForSale(1, tokenIds, i * 100);
            const res = await setTokenIdsForSaleTx.wait();
            console.log(res.gasUsed);
        }

        const setSaleTx = await contract.setSale(1, ethers.parseEther("0.02"), 3, 100, 1000, acc1Address);
        await setSaleTx.wait();

        await expect((contract.connect(acc2) as Contract).buy(1, 1, { value: ethers.parseEther('0.03'), gasLimit: 300000 })).to.be.revertedWith('Sale already closed or not started yet')

        await expect(contract.markAsSold(1, 3)).to.be.revertedWith('Sale not started or already finished');

        const startSaleTx = await contract.startSale(1);
        await startSaleTx.wait();

        const setApproveTx = await nft.setApprovalForAll(proxyAddress, true);
        await setApproveTx.wait();

        const markAsSoldTx = await contract.markAsSold(1, 2);
        await markAsSoldTx.wait();

        await expect((contract.connect(acc2) as Contract).markAsSold(1, 3)).to.be.revertedWith('Only operator permitted');

        const setOperatorTx = await contract.setOperator(acc2Address);
        await setOperatorTx.wait();

        const markAsSold2Tx = await (contract.connect(acc2) as Contract).markAsSold(1, 3);
        await markAsSold2Tx.wait();
    });
});

async function prepareRandomWords(vrfCoordinator: Contract, acc: Signer) {
    const randomTokenIds = getRandomNambers(1000); //[4,7,2,6,3,9,1,10,8,5];

    for (let i = 0; i < 1000; i++) {
        const tokenId = ethers.parseUnits(randomTokenIds[i].toString(), 0);

        const tx = await (vrfCoordinator.connect(acc) as Contract).setRandomWords(i + 1, tokenId);
        await tx.wait();
    }

    console.log('Random Words Prepared');
}

async function prepareRandomWords2(vrfCoordinator: Contract, acc: Signer) {
    const randomTokenIds = getRandomNambers2(1000); //[4,7,2,6,3,9,1,10,8,5];

    for (let i = 0; i < 1000; i++) {
        const tokenId = ethers.parseUnits(randomTokenIds[i].toString(), 0);

        const tx = await (vrfCoordinator.connect(acc) as Contract).setRandomWords(i + 1, tokenId);
        await tx.wait();
    }

    console.log('Random Words Prepared');
}

async function prepareRandomWords3(vrfCoordinator: Contract, acc: Signer) {
    const randomTokenIds = getRandomNambers3(1000); //[4,7,2,6,3,9,1,10,8,5];

    for (let i = 0; i < 1000; i++) {
        const tokenId = ethers.parseUnits(randomTokenIds[i].toString(), 0);

        const tx = await (vrfCoordinator.connect(acc) as Contract).setRandomWords(i + 1, tokenId);
        await tx.wait();
    }

    console.log('Random Words Prepared');
}

function getRandomNambers3(count: number) {
    const randomTokenIdsSet = new Set<number>([]);

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

async function getCurrentPrice(contract: Contract) {
    const currentSaleId = +ethers.formatUnits(await contract.currentSaleId(), 0);
    const currentPrice = +ethers.formatUnits((await contract.saleInfo(currentSaleId))[2], 18);
    return currentPrice;
}

async function getCurrentPriceString(contract: Contract) {
    const currentSaleId = +ethers.formatUnits(await contract.currentSaleId(), 0);
    const currentPrice = ethers.formatUnits((await contract.saleInfo(currentSaleId))[2], 18);
    return currentPrice;
}

function getRandomNambers2(amount: number) {
    const arr = [];
    for (let i = 1; i <= 980; i++) {
        arr.push(i);
    }

    for (let i = 1; i <= 20; i++) {
        arr.push(i);
    }

    return arr;
}

function getRandomNambers(amount: number) {
    const arr = [];
    for (let i = 1; i <= amount; i++) {
        if (i === 1000) {
            arr.push(1);
        } else { arr.push(i); }
    }

    return arr;
}
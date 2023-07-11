import { describe, it } from "mocha";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

//npx hardhat test --grep "StakingProxy"

async function TestStaking(contract: Contract, nft: Contract, acc2: Signer, acc1Address: string, acc2Address: string, proxyAddress: string) {
    const setApproveTx = await (nft.connect(acc2) as Contract).setApprovalForAll(proxyAddress, true);
    await setApproveTx.wait();

    const stakeTx = await (contract.connect(acc2) as Contract).stake(1, 1);
    await stakeTx.wait();
    const stakeTxTimestamp = (await ethers.provider.getBlock(stakeTx.blockNumber))?.timestamp;

    const addressStakingCount = +ethers.formatUnits(await contract.addressStakingCount(acc2Address), 0);
    expect(addressStakingCount).to.be.equal(1);
    console.log('addressStakingCount verification 1 passed')

    const stakedTillTimestamp = +ethers.formatUnits(await contract.stakes(acc2Address, 1), 0);
    expect(stakedTillTimestamp).to.be.equal(stakeTxTimestamp! + 86400)
    console.log('Timestamp verification 1 passed');

    const stake2Tx = await (contract.connect(acc2) as Contract).stake(2, 1);
    await stake2Tx.wait();
    const stake2TxTimestamp = (await ethers.provider.getBlock(stake2Tx.blockNumber))?.timestamp;
    const stakedTill2Timestamp = +ethers.formatUnits(await contract.stakes(acc2Address, 2), 0);

    const stake3Tx = await (contract.connect(acc2) as Contract).stake(3, 2);
    await stake3Tx.wait();
    const stake3TxTimestamp = (await ethers.provider.getBlock(stake3Tx.blockNumber))?.timestamp;
    const stakedTill3Timestamp = +ethers.formatUnits(await contract.stakes(acc2Address, 3), 0);

    const addressStakingCount3 = +ethers.formatUnits(await contract.addressStakingCount(acc2Address), 0);
    expect(addressStakingCount3).to.be.equal(3);
    expect(stakedTill2Timestamp).to.be.equal(stake2TxTimestamp! + 86400);
    expect(stakedTill3Timestamp).to.be.equal(stake3TxTimestamp! + 10 * 86400);
    console.log('Total 3 staked passed');

    await expect((contract.connect(acc2) as Contract).stake(4, 2)).to.be.revertedWith("staking count limit exceeded")
    console.log('Staking count limit exceeded passed!');

    const unstakeTx = await (contract.connect(acc2) as Contract).unstake(1);
    await unstakeTx.wait();

    const addressStakingCount4 = +ethers.formatUnits(await contract.addressStakingCount(acc2Address), 0);
    expect(addressStakingCount4).to.be.equal(2);
    console.log('Unstake 1 passed');

    const setAllowEarlyUnstakeTx = await contract.setAllowEarlyUnstake(false);
    await setAllowEarlyUnstakeTx.wait();

    await expect((contract.connect(acc2) as Contract).unstake(2)).to.be.revertedWith("Metaship locked till the end of staking period");
    console.log("Metaship unstake loked passed");

    await time.setNextBlockTimestamp(stakedTill2Timestamp + 1);

    const unstake3Tx = await (contract.connect(acc2) as Contract).unstake(2);
    await unstake3Tx.wait();
    console.log('Unstake with time passed');

    const stake4Tx = await (contract.connect(acc2) as Contract).stake(1, 2);
    await stake4Tx.wait();

    await expect((contract.connect(acc2) as Contract).setStakingCountLimit(4)).to.be.revertedWith('Operator only accessable');
    console.log("setStakingCountLimit operatorOnly passed");

    const setStakingCountLimitTx = await contract.setStakingCountLimit(4);
    await setStakingCountLimitTx.wait();

    const stake5Tx = await (contract.connect(acc2) as Contract).stake(4, 2);
    await stake5Tx.wait();
    console.log('Raised staking count limit passed');

    const setAllowEarlyUnstake2Tx = await contract.setAllowEarlyUnstake(true);
    await setAllowEarlyUnstake2Tx.wait();

    const unstake2Tx = await (contract.connect(acc2) as Contract).unstake(4);
    await unstake2Tx.wait();

    await expect((contract.connect(acc2) as Contract).stake(4, 3)).to.be.revertedWith('Wrong staking option');
    console.log('Wrong staking option passed');

    await expect((contract.connect(acc2) as Contract).unstake(5)).to.be.revertedWith('No metaship staked with that tokenId using this account');
    console.log('No metaship staked with that tokenId using this account passed');

    const disableStakingTx = await contract.setStakingAvailable(false);
    await disableStakingTx.wait();

    await expect((contract.connect(acc2) as Contract).stake(4, 2)).to.be.revertedWith('Staking is not available at this moment');
    console.log('Disable staking passed');

    const setPeriodTx = await contract.setPeriod([1, 2], [1, 100]);
    await setPeriodTx.wait();

    const period1_2 = +ethers.formatUnits(await contract.periodDays(1), 0);
    const period2_2 = +ethers.formatUnits(await contract.periodDays(2), 0);

    expect(period1_2).to.be.equal(1);
    expect(period2_2).to.be.equal(100);
    console.log('Set Period passed');

    //revert to default
    const setPeriod2Tx = await contract.setPeriod([1, 2], [1, 10]);
    await setPeriod2Tx.wait();

    const disableStaking2Tx = await contract.setStakingAvailable(true);
    await disableStaking2Tx.wait();

    const setStakingCountLimit2Tx = await contract.setStakingCountLimit(3);
    await setStakingCountLimit2Tx.wait();

    const unstake4Tx = await (contract.connect(acc2) as Contract).unstake(1);
    await unstake4Tx.wait();

    const unstake6Tx = await (contract.connect(acc2) as Contract).unstake(3);
    await unstake6Tx.wait();
    console.log('revert to default passed');
}

describe("MetashipStaking", function () {
    it("StakingProxy", async function () {
        const [acc1, acc2] = await ethers.getSigners();
        const acc1Address = await acc1.getAddress();
        const acc2Address = await acc2.getAddress();

        const nftDeployer = await ethers.getContractFactory('NftForTest', acc1 as any);
        const nft = await nftDeployer.deploy() as Contract;
        await nft.waitForDeployment();
        const nftAddress = await nft.getAddress();

        const proxyAdminDeployer = await ethers.getContractFactory('ProxyAdmin', acc1 as any);
        const proxyAdmin = await proxyAdminDeployer.deploy() as Contract;
        await proxyAdmin.waitForDeployment();
        const proxyAdminAddress = await proxyAdmin.getAddress();
        console.log('ProxyAdmin:', proxyAdminAddress);

        const implementationDeployer = await ethers.getContractFactory('MetashipStakingV1', acc1 as any);
        const implementation = await implementationDeployer.deploy() as Contract;
        await implementation.waitForDeployment();
        const implementationAddress = await implementation.getAddress();
        console.log('Implementation:', implementationAddress);

        const proxyDeployer = await ethers.getContractFactory('Proxy', acc1 as any);
        const proxy = await proxyDeployer.deploy(proxyAdminAddress, implementationAddress) as Contract;
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();
        console.log('Proxy:', proxyAddress);

        const contractDeployer = await ethers.getContractFactory('MetashipStakingV1', acc1 as any);
        const contract = await contractDeployer.attach(proxyAddress);

        const contract2Deployer = await ethers.getContractFactory('MetashipStakingV2ForUnitTests', acc1 as any);
        const contract2 = await contract2Deployer.attach(proxyAddress);

        const tx = await contract.initialize(nftAddress, 3, [1, 2], [1, 10], { gasLimit: 3000000 });
        await tx.wait();

        const owner = await contract.owner();
        const period1 = +ethers.formatUnits(await contract.periodDays(1), 0);
        const period2 = +ethers.formatUnits(await contract.periodDays(2), 0);
        const stakingCountLimit = +ethers.formatUnits(await contract.stakingCountLimit(), 0);

        expect(owner).to.be.equal(acc1.address);
        expect(period1).to.be.equal(1);
        expect(period2).to.be.equal(10);
        expect(stakingCountLimit).to.be.equal(3);
        console.log('Initialization passed');
        console.log('\n');

        const mintTx = await nft.Mint();
        await mintTx.wait();

        for (let i = 1; i <= 5; i++) {
            const tx = await nft.transferFrom(
                acc1Address,
                acc2Address,
                ethers.formatUnits(i.toString(), 0)
            );
            await tx.wait();
        }

        const nftOwner = await nft.ownerOf(1);
        expect(nftOwner).to.be.equal(acc2Address);

        await TestStaking(contract, nft, acc2, acc1Address, acc2Address, proxyAddress);

        const stakeTx = await (contract.connect(acc2) as Contract).stake(1, 1);
        await stakeTx.wait();

        const implementation2Deployer = await ethers.getContractFactory('MetashipStakingV2ForUnitTests', acc1 as any);
        const implementation2 = await implementation2Deployer.deploy() as Contract;
        await implementation2.waitForDeployment();
        const implementation2Address = await implementation2.getAddress();
        console.log('Implementation2:', implementation2Address);

        console.log('stakes before update: ', await contract.stakes(acc2Address, 1));

        const proxyUpgradeTx = await proxyAdmin.upgrade(proxyAddress, implementation2Address);
        await proxyUpgradeTx.wait();
        console.log('Proxy upgrade pass');

        console.log('stakes after update: ', await contract.stakes(acc2Address, 1));

        const unstakeTx = await (contract.connect(acc2) as Contract).unstake(1);
        await unstakeTx.wait();
        console.log('Unstake after implementation upgrade passed');
        console.log('testVariable after unstake: ', await contract2.testVariable());

        console.log('\n\nSecond workflow for upgraded implementation');
        await TestStaking(contract, nft, acc2, acc1Address, acc2Address, proxyAddress);
        console.log('Test completed successfully');
    });
})
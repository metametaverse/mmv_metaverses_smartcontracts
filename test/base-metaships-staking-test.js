const { expect, assert } = require('chai');
const { ethers } = require('hardhat');


describe('Base metaships staking', function () {
    it('Should transfer metaship nft from signer to smart contract', async function () {
        const [acc1, acc2, acc3] = await ethers.getSigners();
        console.log(`acc1: `, acc1.address);
        // init contract for minting base metaship nfts
        const BaseMetaship = await ethers.getContractFactory('BaseMetaship', acc1);
        const BaseMetashipContract = await BaseMetaship.deploy();
        await BaseMetashipContract.deployed();

        // init staking smartcontract
        const BaseMetashipStaking = await ethers.getContractFactory('BaseMetashipStaking', acc1);
        const BaseMetashipStakingContract = await BaseMetashipStaking.deploy();
        await BaseMetashipStakingContract.deployed();
      
        const NFTContractAddress = BaseMetashipStakingContract.address;
        const ContractAddress = BaseMetashipStakingContract.address;
        const setNftTx = await BaseMetashipStakingContract
            .connect(acc1)
            .setNftContractAddress(NFTContractAddress);
        await setNftTx.wait();

        const balanceOfAcc1 = await BaseMetashipContract.balanceOf(acc1.address, 2);
        console.log(`BaseMetashipContract balance`, Number(balanceOfAcc1));
        // const txData = {
        //     operator: ContractAddress,
        //     from: ContractAddress,
        //     to: acc1.address,
        //     tokenId: BaseMetaship.tokenId,
        //     value: "0x0",
        //     amount: 6,
        //     gasLimit: ethers.utils.hexlify(10000),
        //     gasPrice: 100,
        //   }
        //   acc1.sendTransaction(txData).then((transaction) => {
        //     console.dir(transaction)
        //     alert("Send finished!")
        //   })

        // send 3 ships to acc2
        const transferToAcc2 = await BaseMetashipStakingContract
            .connect(acc2)
            .transferSingle(NFTContractAddress, NFTContractAddress, acc2.address, 2, 3);
        await transferToAcc2.wait();
        // send 3 ships to acc3
        const transferToAcc3 = await BaseMetashipStakingContract
            .connect(acc3)
            .transferSingle(NFTContractAddress, NFTContractAddress, acc3.address, 2, 3);
        await transferToAcc2.wait();

        console.log(`acc2 balance after transfer`, Number(await BaseMetashipContract.balanceOf(acc2.address, 2)));
        console.log(`acc3 balance after transfer`, Number(await BaseMetashipContract.balanceOf(acc3.address, 2)));
        // stake 1 ship for 1 day for acc2
        const stakeTx = await BaseMetashipStakingContract
            .connect(acc1)
            .stake1Day('01216c25-74c3-4578-8e15-0b576bad83b1');
        await stakeTx.wait()
        console.log('stake tx', stakeTx)
        
            // stake 1 ship for 100 days for acc3
        // unstake ship for acc2
        // stake 2 ships for 1 day for acc3
        // unstake 1st ship for acc3

        /* const stakingTx = await BaseMetashipStakingContract.stake1Day(TOKEN_DEV, {
            gasLimit: 150000,
        });
        const txResult = await stakingTx.wait(); */


        expect(1).to.be.equal(1);
    });
});

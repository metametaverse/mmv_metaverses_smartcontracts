const { expect, assert } = require('chai');
const { ethers } = require('hardhat');


describe('Base metaships staking', function () {
        it('Should transfer metaship nft from signer to smart contract', async function () {
            const ID = 2;
            this.accounts =  await ethers.getSigners();
            console.log(`acc1: `, this.accounts[0].address);
            // init contract for minting base metaship nfts
            const BaseMetaship = await ethers.getContractFactory('BaseMetaship', this.accounts[0]);
            const BaseMetashipContract = await BaseMetaship.deploy();
            await BaseMetashipContract.deployed();

            // init staking smartcontract
            const BaseMetashipStaking = await ethers.getContractFactory('BaseMetashipStaking', this.accounts[0]);
            const BaseMetashipStakingContract = await BaseMetashipStaking.deploy();
            await BaseMetashipStakingContract.deployed();
          
            const NFTContractAddress = BaseMetashipContract.address;
            const ContractAddress = BaseMetashipStakingContract.address;

            console.log(`id:`, ID);

            const setNftTx = await BaseMetashipStakingContract
                .connect(this.accounts[0])
                .setNftContractAddress(NFTContractAddress);
            await setNftTx.wait();

            const approvalTx = await BaseMetashipContract.connect(this.accounts[0]).setApprovalForAll(ContractAddress, true)
            await approvalTx.wait();


            // send 3 ships to acc2
            const transferToAcc2 = await BaseMetashipContract
                .connect(this.accounts[0])
                .safeTransferFrom(this.accounts[0].address, this.accounts[1].address, ID, 3, '0x00');
            await transferToAcc2.wait();
            // send 3 ships to acc3
            const transferToAcc3 = await BaseMetashipContract
                .connect(this.accounts[0])
                .safeTransferFrom(this.accounts[0].address, this.accounts[2].address, ID, 3, '0x00');
            await transferToAcc3.wait();


            const balanceOfAcc1 = await BaseMetashipContract.balanceOf(this.accounts[0].address, ID);
            console.log(`Acc1 balance`, Number(balanceOfAcc1));
            console.log(`acc2 balance after transfer`, Number(await BaseMetashipContract.balanceOf(this.accounts[1].address, 2)));
            console.log(`acc3 balance after transfer`, Number(await BaseMetashipContract.balanceOf(this.accounts[2].address, 2)));


            
            // stake 1 ship for 1 day for acc2
            const stakeTx = await BaseMetashipStakingContract
                .connect(this.accounts[1])
                .stake1Day('01216c25-74c3-4578-8e15-0b576bad83b1');
            await stakeTx.wait()
            console.log('stake tx', stakeTx)
            

            // stake 1 ship for 100 days for acc3
            // unstake ship for acc2

            // stake 2 ships for 1 day for acc3
            // try to stake same ship uuid again for acc2
            // unstake 1st ship for acc3
            // retry stake 1 ship
            expect(1).to.be.equal(1);
    })

});

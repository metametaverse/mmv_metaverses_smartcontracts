const { expect } = require('chai');
const { ethers } = require('hardhat');

const ID = 51271482805962209305201228596472484421057665279277761912030118523405984596968n;

describe('Base metaships staking', function () {
        it('Should transfer metaship nft from signer to smart contract', async function () {
            this.accounts =  await ethers.getSigners();
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

            const setNftTx = await BaseMetashipStakingContract
                .connect(this.accounts[0])
                .setNftContractAddress(NFTContractAddress);
            await setNftTx.wait();
            const setCountLimit = await BaseMetashipStakingContract
                .connect(this.accounts[0])
                .setStakingCountLimit(3);
            await setCountLimit.wait();

            const approvalTx1 = await BaseMetashipContract.connect(this.accounts[1]).setApprovalForAll(ContractAddress, true)
            const approvalTx2 = await BaseMetashipContract.connect(this.accounts[2]).setApprovalForAll(ContractAddress, true)
            await approvalTx1.wait();
            await approvalTx2.wait();


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
            console.log(`acc2 balance after transfer`, Number(await BaseMetashipContract.balanceOf(this.accounts[1].address, ID)));
            console.log(`acc3 balance after transfer`, Number(await BaseMetashipContract.balanceOf(this.accounts[2].address, ID)));
            
            // stake 1 ship for 1 day for acc2
            const stakeTx = await BaseMetashipStakingContract
                .connect(this.accounts[1])
                .stake1Day('01216c25-74c3-4578-8e15-0b576bad85b1');
            const res = await stakeTx.wait()
            console.log('stake tx', res.events[0])
            
            
            // try to stake same ship uuid again for acc2
            // const sameStakeTx = await BaseMetashipStakingContract
            //     .connect(this.accounts[1])
            //     .stake1Day('01216c25-74c3-4578-8e15-0b576bad85b1');
            // await sameStakeTx.wait()
            // stake 1 ship for 100 days for acc3
            const stake100Tx = await BaseMetashipStakingContract
                .connect(this.accounts[2])
                .stake1Day('01216c25-74c3-4578-8e15-0b576bad84b1');
            await stake100Tx.wait()
            // unstake ship for acc2
            const unstakeTx = await BaseMetashipStakingContract
                .connect(this.accounts[1])
                .unstake('01216c25-74c3-4578-8e15-0b576bad85b1');
            await unstakeTx.wait()

            const contractBalance = Number(await BaseMetashipContract.balanceOf(ContractAddress, ID))
            console.log(`contractBalance`, contractBalance);
            // retry stake 1 ship
            expect(contractBalance).to.be.equal(1);
    })

});
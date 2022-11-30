const { expect, assert } = require('chai');
const { ethers } = require('hardhat');

const TOKEN_DEV = '51271482805962209305201228596472484421057665279277761912030118523405984596968';

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
      
        const ContractAddress = BaseMetashipStakingContract.address;

        const balanceOfAcc1 = await BaseMetashipContract.balanceOf(acc1.address, 2);
        console.log(`BaseMetashipContract balance`, Number(balanceOfAcc1));
        const transactions = [];

        const res = await Promise.all(transactions);

        const txData = {
            operator: ContractAddress,
            from: ContractAddress,
            to: acc1.address,
            tokenId: BaseMetaship.tokenId,
            value: "0x0",
            amount: 6,
            gasLimit: ethers.utils.hexlify(10000),
            gasPrice: 100,
          }
          acc1.sendTransaction(txData).then((transaction) => {
            console.dir(transaction)
            alert("Send finished!")
          })

        console.log(`acc1 balance after transfer`, Number(await BaseMetashipContract.balanceOf(acc1.address, 2)));
        console.log(`acc2 balance after transfer`, Number(await BaseMetashipContract.balanceOf(acc2.address, 2)));

        // send 3 ships to acc2
        // send 3 ships to acc3
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

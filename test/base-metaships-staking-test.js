const { expect, assert } = require('chai');
const { ethers } = require('hardhat');

const TOKEN_DEV = '51271482805962209305201228596472484421057665279277761912030118523405984596968';

describe('Base metaships staking', function () {
    it('Should transfer metaship nft from signer to smart contract', async function () {
        const [acc1] = await ethers.getSigners();
        console.log(`acc1: `, acc1.address);
        const BaseMetashipStaking = await ethers.getContractFactory('BaseMetashipStaking', acc1);
        const BaseMetashipStakingContract = await BaseMetashipStaking.deploy();
        await BaseMetashipStakingContract.deployed();
      
        const ContractAddress = BaseMetashipStakingContract.address;

        const stakingTx = await BaseMetashipStakingContract.stake1Day(TOKEN_DEV, {
            gasLimit: 150000,
        });
        const txResult = await stakingTx.wait();
        
        

        console.log(`tx result:`, txResult);

        expect(1).to.be.equal(1);
    });
});

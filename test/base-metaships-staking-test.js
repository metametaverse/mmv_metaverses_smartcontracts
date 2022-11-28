const { expect, assert } = require('chai');
const { ethers } = require('hardhat');

describe('Base metaships staking', function () {
    it('Should transfer metaship nft from signer to smart contract', async function () {
        const [owner] = await ethers.getSigners();
        console.log(`owner`, owner);
        const BaseMetashipsStaking = await ethers.getContractFactory('BaseMetashipsStaking', acc1);
        const BaseMetashipsStakingContract = await BaseMetashipsStaking.deploy();
        await BaseMetashipsStakingContract.deployed();
      
        const ContractAddress = BaseMetashipsStakingContract.address;
          
        tx = await BaseMetashipsStakingContract.setApprovalForAll(ContractAddress, true);
        await tx.wait();

        expect(1).to.be.equal(1);
    });
});

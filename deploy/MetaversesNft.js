async function main() {
    [acc1] = await ethers.getSigners();
        const MetashipsNft = await ethers.getContractFactory('MetaverseNft', acc1);
        console.log('deploying contract from address: ', acc1.address);
        console.log('balance: ', (await acc1.getBalance()).toString());
        
        const metashipNftContract = await MetashipsNft.deploy();
        const deployed = await metashipNftContract.deployed();

        console.log('Contract address: ', deployed.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
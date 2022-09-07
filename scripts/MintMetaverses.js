const json = require('./landsToMint_stage.json');

async function main() {
  const scAddress = '0x3E397a1a5b119212B089432d52897e434E3A69c4'
  const [acc1] = await ethers.getSigners();
  const MetashipsNft = await ethers.getContractFactory('MetaverseNft', acc1);
  const contract = await MetashipsNft.attach(scAddress);
  console.log('Attached to: ', scAddress);

  const owners = Object.keys(json);
  for (let i = 0; i < owners.length; i++) {
    const owner = owners[i];

    console.log('Minting for owner ', owner);
    const landsToMint = json[owner];

    for (let j = 0; j < landsToMint.length; j++) {
      const x = landsToMint[j].x;
      const y = landsToMint[j].y;
      const z = landsToMint[j].z;
      console.log(`${x},${y},${z}`);
      const tx = await contract.mintByCoordinates(x, y, z, owner, {gasLimit: 300000});
      console.log(`Transaction sent`);
      await tx.wait();

      console.log(`Land with coordinates: [${x},${y},${z}] minted for ${landsToMint[j].owner}`);
    }
  }

  console.log('Metaverses minted for each owner');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
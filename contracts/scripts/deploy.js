const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying AdRegistry contract...');

  // Get the contract factory
  const AdRegistry = await ethers.getContractFactory('AdRegistry');

  // Deploy the contract
  const adRegistry = await AdRegistry.deploy();
  await adRegistry.waitForDeployment();

  const contractAddress = await adRegistry.getAddress();
  console.log('AdRegistry deployed to:', contractAddress);

  // Verify the deployment by checking owner
  const owner = await adRegistry.owner();
  console.log('Contract owner:', owner);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    owner,
    network: network.name,
    chainId: network.config.chainId,
    deployedAt: new Date().toISOString(),
  };

  console.log('\nDeployment Info:', deploymentInfo);

  console.log('\nNext steps:');
  console.log('1. Update config/contracts.ts with the deployed address:', contractAddress);
  console.log('2. Verify the contract on the block explorer if needed');
  console.log('3. Test the contract functions on the frontend');
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
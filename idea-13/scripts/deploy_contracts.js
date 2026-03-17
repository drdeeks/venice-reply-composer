const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('Deploying Verifiable Job Board contracts...');

  // Get contract factories
  const JobBoard = await ethers.getContractFactory('JobBoard');
  
  // Deploy JobBoard contract
  const jobBoard = await JobBoard.deploy();
  await jobBoard.deployed();

  console.log('JobBoard deployed to:', jobBoard.address);

  // Save contract addresses to JSON
  const contractAddresses = {
    jobBoard: jobBoard.address,
    timestamp: Date.now()
  };

  fs.writeFileSync('contracts/addresses.json', JSON.stringify(contractAddresses, null, 2));
  console.log('Contract addresses saved to contracts/addresses.json');

  // Grant initial roles
  const [deployer] = await ethers.getSigners();
  console.log('Setting up initial roles...');
  
  // Admin role
  const adminRole = await jobBoard.ADMIN_ROLE();
  await jobBoard.grantRole(adminRole, deployer.address);

  // Employer role for deployer
  const employerRole = await jobBoard.EMPLOYER_ROLE();
  await jobBoard.grantRole(employerRole, deployer.address);

  // Verifier role for deployer
  const verifierRole = await jobBoard.VERIFIER_ROLE();
  await jobBoard.grantRole(verifierRole, deployer.address);

  console.log('Initial roles set up successfully');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
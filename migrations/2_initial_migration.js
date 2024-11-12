const Marketplace = artifacts.require("Marketplace");

module.exports = async function(deployer, network, accounts) {
  // Deploy the contract
  await deployer.deploy(Marketplace);

  const marketplace = await Marketplace.deployed();
  const address = marketplace.address;

  // Save the contract address to a JSON file
  const fs = require('fs');
  const path = require('path');

  const contractAddressPath = path.join(__dirname, '../src/abis/Marketplace-address.json');
  const data = JSON.stringify({ address: address }, null, 2); // Format as JSON
  fs.writeFileSync(contractAddressPath, data);

  console.log(`Marketplace contract deployed at address: ${address}`);
};
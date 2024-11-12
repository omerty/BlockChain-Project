// migrations/1_initial_migration.js
const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  // Deploy the Migrations contract first
  deployer.deploy(Migrations);
};

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost
      port: 7545,            // Ethereum port
      network_id: "*",       // Any network
    },
  },

  compilers: {
    solc: {
      version: "0.5.0",      // Use the version compatible with your contract
    }
  },
};

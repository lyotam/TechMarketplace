module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 22000,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    nodeone: {
      host: "127.0.0.1",
      port: 22000,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    nodetwo: {
      host: "127.0.0.1",
      port: 22001,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    nodethree: {
      host: "127.0.0.1",
      port: 22002,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
  },
};

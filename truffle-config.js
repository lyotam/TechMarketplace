var LOCAL_HOST = "127.0.0.1";
var QM_PORT = 22000;

module.exports = {
  networks: {
    development: {
      host: LOCAL_HOST,
      port: 22003,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    nodeone: {
      host: LOCAL_HOST,
      port: 22000,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    nodetwo: {
      host: LOCAL_HOST,
      port: 22001,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    nodethree: {
      host: LOCAL_HOST,
      port: 22002,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    marketmanager: {
      host: LOCAL_HOST,
      port: 22003,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm: {
      host: "10.50.0.5",
      port: QM_PORT,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm_nodeone: {
      host: "10.50.0.2",
      port: QM_PORT,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm_nodetwo: {
      host: "10.50.0.3",
      port: QM_PORT,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm_nodethree: {
      host: "10.50.0.4",
      port: QM_PORT,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm_marketmanager: {
      host: "10.50.0.5",
      port: QM_PORT,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm_mac: {
      host: LOCAL_HOST,
      port: 20400,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
  },
};

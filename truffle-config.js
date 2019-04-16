var LOCAL_HOST = "127.0.0.1";
var QM_HOST = "192.168.33.11";

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
      host: QM_HOST,
      port: 20400,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm_nodeone: {
      host: QM_HOST,
      port: 20100,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm_nodetwo: {
      host: QM_HOST,
      port: 20200,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm_nodethree: {
      host: QM_HOST,
      port: 20300,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
    qm_marketmanager: {
      host: QM_HOST,
      port: 20400,
      network_id: "*", // Match any network id
      gasPrice: 0,
      gas: 4500000,
    },
  },
};

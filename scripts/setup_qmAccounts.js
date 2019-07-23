const fs = require('fs');
const accounts = require("../src/json/accounts.json");

const NUM_ACCOUNTS = 4;
const PROJECT_NAME = "QuorumNetwork";
const QM_HOST = "http://10.50.0.";
const LOCAL_HOST = "http://127.0.0.1";

const extractAccountDetails = async function(op_system) {
  var pubKeys = [];
  var addresses = [];

  console.log("Extracting nodes pub keys & addresses:");

  for (i = 1; i <= NUM_ACCOUNTS; i++) {
    var pubkey = fs.readFileSync(`../quorum-maker/${PROJECT_NAME}/node${i}/node/keys/node${i}.pub`);
    console.log(`Node${i} pub key: `, pubkey.toString());
    pubKeys.push(pubkey.toString());

    var node4key = JSON.parse(fs.readFileSync(`../quorum-maker/${PROJECT_NAME}/node${i}/node/qdata/keystore/node${i}key`));
    var address = "0x" + node4key.address;
    console.log(`Node${i} address: `, address);
    addresses.push(address);
  }

  accounts.forEach((account, index) => {

    switch(op_system) {
      case "mac":
        account.provider = `${LOCAL_HOST}:${(index * 100) + 20100}`;
        break;
      default:
        account.provider = `${QM_HOST + (index + 2)}:22000`;
    }

    account.pubKey = pubKeys[index];
    account.address = addresses[index];
  });

  fs.writeFileSync("src/json/accounts.json", JSON.stringify(accounts, null, 2));

  console.log("\nQuorum Maker network configurations completed successfully");
};


module.exports = async function() {

  try {

    await extractAccountDetails(process.argv[4]);

    await web3.personal.unlockAccount(web3.eth.accounts[0], "", 360000);
    
    console.log(`\nAccount ${web3.eth.accounts[0]} Unlocked`);
    
  } catch (error) {
    console.log(error);
  }
};
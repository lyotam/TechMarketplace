const fs = require('fs');
const accounts = require("../src/json/accounts.json");

const NUM_ACCOUNTS = 4;
const PROJECT_NAME = "TechMarketplaceNetwork";
const HOST = "http://192.168.33.11";

var pubKeys = [];
var addresses = [];

console.log("Extracting nodes pub keys & addresses:");

for (i = 1; i <= NUM_ACCOUNTS; i++) {
    var pubkey = fs.readFileSync(`../../quorum-maker/${PROJECT_NAME}/node${i}/node/keys/node${i}.pub`);
    console.log(`Node${i} pub key: `, pubkey.toString());
    pubKeys.push(pubkey.toString());

    var node4key = JSON.parse(fs.readFileSync(`../../quorum-maker/${PROJECT_NAME}/node${i}/node/qdata/keystore/node${i}key`));
    console.log(`Node${i} address: `, node4key.address);
    addresses.push(node4key.address);
}

accounts.forEach((account, index) => {
    account.provider = `${HOST}:20${index + 1}00`;
    account.pubKey = pubKeys[index];
    account.address = addresses[index];
});

fs.writeFileSync("../src/json/accounts1.json", JSON.stringify(accounts, null, 2));

console.log("\nQuorum Maker network configurations completed successfully");
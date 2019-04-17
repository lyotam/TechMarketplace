const fs = require('fs');
const accounts = require("../src/json/accounts.json");

const NUM_ACCOUNTS = 4;
const PROJECT_NAME = "TechMarketplaceNetwork";
const HOST = "http://10.50.0.";

var pubKeys = [];
var addresses = [];

console.log("Extracting nodes pub keys & addresses:");

for (i = 1; i <= NUM_ACCOUNTS; i++) {
    var pubkey = fs.readFileSync(`../../quorum-maker/${PROJECT_NAME}/node${i}/node/keys/node${i}.pub`);
    console.log(`Node${i} pub key: `, pubkey.toString());
    pubKeys.push(pubkey.toString());

    var node4key = JSON.parse(fs.readFileSync(`../../quorum-maker/${PROJECT_NAME}/node${i}/node/qdata/keystore/node${i}key`));
    var address = "0x" + node4key.address;
    console.log(`Node${i} address: `, address);
    addresses.push(address);
}

accounts.forEach((account, index) => {
    account.provider = `${HOST + (index + 2)}:22000`;
    account.pubKey = pubKeys[index];
    account.address = addresses[index];
});

fs.writeFileSync("../src/json/accounts.json", JSON.stringify(accounts, null, 2));

console.log("\nQuorum Maker network configurations completed successfully");
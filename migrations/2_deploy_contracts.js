var TechToken = artifacts.require("TechToken");
var SafeMath = artifacts.require("SafeMath");
var Market = artifacts.require("Market");
var BidManager = artifacts.require("BidManager");

const PUBLIC_KEYS = require("../src/json/accounts.json").slice(0, 3).map(account => account.pubKey);

var techTokenAddress;
var bidManagerAddress;

module.exports = function (deployer) {

  deployer.then(async () => {

    deployer.deploy(SafeMath, { privateFor: PUBLIC_KEYS });
    deployer.link(SafeMath, TechToken);

    await deployer.deploy(TechToken, { privateFor: PUBLIC_KEYS }).then(() => {
      console.log("techTokenAddress: ", TechToken.address)
      techTokenAddress = TechToken.address;
    });

    await deployer.deploy(BidManager, { privateFor: PUBLIC_KEYS }).then(() => {
      console.log("bidManagerAddress: ", BidManager.address)
      bidManagerAddress = BidManager.address;
    });

    await deployer.deploy(Market, techTokenAddress, bidManagerAddress, { privateFor: PUBLIC_KEYS });
  })
};
var TechToken = artifacts.require("TechToken");
var SafeMath = artifacts.require("SafeMath");
var Market = artifacts.require("Market");
var BidManager = artifacts.require("BidManager");

var account1key = "BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo=";
var account2key = "QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc=";
var account3key = "1iTZde/ndBHvzhcl7V68x44Vx7pl8nwx9LqnM/AfJUg=";

var publicKeys = [account1key, account2key, account3key];
var techTokenAddress;
var bidManagerAddress;

module.exports = function(deployer) {

  deployer.then(async () => {

    deployer.deploy(SafeMath, {privateFor: publicKeys});
    deployer.link(SafeMath, TechToken);

    await deployer.deploy(TechToken, {privateFor: publicKeys}).then(() => {
      console.log("techTokenAddress: ", TechToken.address)
      techTokenAddress = TechToken.address;
    });

    await deployer.deploy(BidManager, {privateFor: publicKeys}).then(() => {
      console.log("bidManagerAddress: ", BidManager.address)
      bidManagerAddress = BidManager.address;
    });

    await deployer.deploy(Market, techTokenAddress, bidManagerAddress, {privateFor: publicKeys});
  })
};
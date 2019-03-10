var TechToken = artifacts.require("TechToken");
var SafeMath = artifacts.require("SafeMath");
var Market = artifacts.require("Market");

var Token = artifacts.require("Token");
var Marketplace = artifacts.require("Marketplace");

var account1key = "BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo=";
var account2key = "QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc=";
var account3key = "1iTZde/ndBHvzhcl7V68x44Vx7pl8nwx9LqnM/AfJUg=";

var publicKeys = [account1key, account2key, account3key];
var techTokenAddress;
var tokenAddress;

module.exports = function(deployer) {

  // deployer.then(async () => {

  //   deployer.deploy(SafeMath, {privateFor: publicKeys});
  //   deployer.link(SafeMath, TechToken);

  //   await deployer.deploy(TechToken, {privateFor: publicKeys}).then(() => {
  //     console.log("techTokenAddress: ", TechToken.address)
  //     techTokenAddress = TechToken.address;
  //   });

  //   await deployer.deploy(Market, techTokenAddress, {privateFor: publicKeys});
  // })

  deployer.then(async () => {

    deployer.deploy(SafeMath, {privateFor: publicKeys});
    deployer.link(SafeMath, Token);

    await deployer.deploy(Token, {privateFor: publicKeys}).then(() => {
      console.log("tokenAddress: ", Token.address)
      tokenAddress = Token.address;
    });

    await deployer.deploy(Marketplace, tokenAddress, {privateFor: publicKeys});
  })

};

//          "oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8=", // Account four pub key (base64)

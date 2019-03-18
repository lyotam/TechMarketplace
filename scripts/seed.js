const Market = artifacts.require("Market");
const TechToken = artifacts.require("TechToken");
const data = require("../src/json/items.json");
const accounts = require("../src/json/accounts.json");

var account1key = "BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo=";
var account2key = "QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc=";
var account3key = "1iTZde/ndBHvzhcl7V68x44Vx7pl8nwx9LqnM/AfJUg=";

var publicKeys = [account1key, account2key, account3key];

const getItems = async function() {
  const size = await this.getSize();
  if (size > 0) {
    return Promise.all(
      Array(size.toNumber())
        .fill(0)
        .map(async (key, index) => {
          return await this.getItem(index);
        }),
    );
  }
};

const createItems = async function() {
  return Promise.all(
    data.map(async (item, index) => {

      var owner = accounts[index % accounts.length].address;
      console.log("owner: ", owner);

      return await this.createItem(owner, item.name, item.image, item.price, {
        privateFor: publicKeys
      });
    }),
  );
};

module.exports = async function() {

  try {
    const marketplace = await Market.deployed();
    marketplace.getItems = getItems.bind(marketplace);
    marketplace.createItems = createItems.bind(marketplace);

    await marketplace.createItems();

    console.log(await marketplace.getItems());

    const token = await TechToken.deployed();
    
    accounts.forEach(async account => {
      await token.transfer(account.address, 10, {privateFor: publicKeys});
    });

    console.log("approveAndCall response: ", await token.approveAndCall("0x89fa20d397c039a847bc1ae58081d875b3785a47", 10, 0, {
      privateFor: publicKeys, 
    }));

  } catch (error) {
    console.log(error);
  }
};

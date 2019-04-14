const Market = artifacts.require("Market");
const TechToken = artifacts.require("TechToken");
const BidManager = artifacts.require("BidManager");

const data = require("../src/json/items.json");
const accounts = require("../src/json/accounts.json");

const PUBLIC_KEYS = accounts.slice(0,3).map(account => account.key);
const NUM_ACCOUNTS = 3;
const TXN_GAS = 900000;


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

      var owner = accounts[index % NUM_ACCOUNTS].address;
      
      return await this.createItem(owner, item.name, item.image, item.price, {
        privateFor: PUBLIC_KEYS,
        gas: TXN_GAS
      });
    }),
  );
};

module.exports = async function() {

  try {
    const market = await Market.deployed();
    market.getItems = getItems.bind(market);
    market.createItems = createItems.bind(market);

    await market.createItems();

    console.log(await market.getItems());

    const token = await TechToken.deployed();
    
    accounts.forEach(async account => {
      await token.transfer(account.address, 10, {
        privateFor: PUBLIC_KEYS,
        gas: TXN_GAS  
      });
    });

    const bidManager = await BidManager.deployed();

    await bidManager.setMarket(market.address, {
      privateFor: PUBLIC_KEYS,
      gas: TXN_GAS  
    });

  } catch (error) {
    console.log(error);
  }
};

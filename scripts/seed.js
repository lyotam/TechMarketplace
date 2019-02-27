const Market = artifacts.require("Market");
const data = require("../src/json/items.json");
// const secret_data = require("../src/json/secret_items.json");
const accounts = require("../src/json/accounts.json");

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
        privateFor: [
          "QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc=",
          "1iTZde/ndBHvzhcl7V68x44Vx7pl8nwx9LqnM/AfJUg=",
        ],
      });
    }),
  );
};

// const createSecretItems = async function() {
//   return Promise.all(
//     secret_data.map(async item => {
//       return await this.createItem(accounts[0].address, item.name, item.image, item.price, {
//         privateFor: [
//           "QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc=",
//         ],
//       });
//     }),
//   );
// };

module.exports = async function() {

  try {
    const contract = await Market.deployed();
    contract.getItems = getItems.bind(contract);
    contract.createItems = createItems.bind(contract);
    // contract.createSecretItems = createSecretItems.bind(contract);

    await contract.createItems();
    // await contract.createSecretItems();

    console.log(await contract.getItems());
  } catch (error) {
    console.log(error);
  }
};

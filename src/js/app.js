App = {
  ACCOUNT_NAME_IDX: 0,
  ACCOUNT_KEY_IDX: 1,
  ITEM_ID_IDX: 0,
  ITEM_SELLER_IDX: 1,
  ITEM_PRICE_IDX: 4,
  ITEM_STATE_ID_IDX: 0,
  ITEM_STATE_IDX: 1,
  ITEM_BUYER_IDX: 6,
  ITEM_STATE_SOLD: 1,
  NULL_ADDRESS: "0x0000000000000000000000000000000000000000",

  web3Provider: null,
  contracts: {},
  account: null,
  inclusivePrivateFor: null,
  address2account: {},
  marketAddress: "",

  /**
   * Initializes web application using current account and provider
   */
  init: function(accounts) {
    App.accounts = accounts;
    App.account = App.getAccount(window.location.pathname);

    /* Initialize web3 */
    App.web3Provider = new Web3.providers.HttpProvider(App.account.provider);

    web3 = new Web3(App.web3Provider);

    App.account.hash = web3.eth.accounts[0];

    /* Holds all other accounts' keys */
    App.inclusivePrivateFor = $(App.accounts)
      .not([App.account])
      .get()
      .map(function(acc) {
        return acc.key;
      });
    App.inclusivePrivateFor.push("oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8="); // node 4 address ----- change

    console.log("inclusivePrivateFor: ", App.inclusivePrivateFor);

    accounts.forEach(function(account) {
      App.address2account[account.address] = [account.name, account.key];
    });
    App.address2account[App.NULL_ADDRESS] = ["Unknown", ""]; 

    return App.initContracts();
  },

  /**
   * Initializes smart contract on web application
   */
  initContracts: async function() {
    var marketData = await $.getJSON("Market.json");
    App.contracts.Market = await TruffleContract(marketData);
    await App.contracts.Market.setProvider(App.web3Provider);

    var tokenData = await $.getJSON("TechToken.json");
    App.contracts.CashToken = await TruffleContract(tokenData);
    await App.contracts.CashToken.setProvider(App.web3Provider);

    var bidManagerData = await $.getJSON("BidManager.json");
    App.contracts.BidManager = await TruffleContract(bidManagerData);
    await App.contracts.BidManager.setProvider(App.web3Provider);

    await App.fetchItems();

    return App.setupPage();
  },

  /**
   * Retrieves items from Market.sol smart contract
   */
  fetchItems: function() {
    var instance;
    var itemRow = $("#itemRow");
    var itemTemplate = $("#itemTemplate");

    App.contracts.BidManager.deployed() // Move to separate listner func that is called after BidManager creation 
    .then(bidManager => {

        /* BidCreated event listener */
        bidManager.BidCreated().watch(function(error, result) {
          if (!error) {
            console.log("Received Event BidCreated - {bidId: %s, itemId: %s, buyer: %s}", Number(result.args.bidId), Number(result.args.itemId), result.args.buyer);

            var seller = $(`[data-id="${Number(result.args.itemId)}"]`).data("seller"); 
            console.log("item seller: ", seller);

            if (seller == App.account.hash) {
              console.log("I'm the seller and I'm about to finalize deal");
              
              // instance.markItemSold(Number(result.args.itemId), {
              //   from: App.account.hash,
              //   privateFor: App.inclusivePrivateFor,
              // });
            }             
          } else
              console.log(error);
        });
      });

    App.contracts.Market.deployed()
      .then(contract => {

        // set market address
        App.marketAddress = contract.address;

        /* ItemSold event listener */
        contract.ItemSold().watch(function(error, result) {
          if (!error) {

            console.log("Received Event ItemSold - {itemId: %s, Seller: %s}", Number(result.args.itemId), result.args.seller);

            if (result.args.seller == App.account.hash) {
              console.log("finalizing Item State");
              
              instance.markItemSold(Number(result.args.itemId), {
                from: App.account.hash,
                privateFor: App.inclusivePrivateFor,
              });
            }             
          } else
              console.log(error);
        });

        /* ItemStateSold event listener */
        contract.ItemStateSold().watch(function(error, result) {
          if (!error) {

            console.log("Received Event ItemStateSold - {itemId: %s}", Number(result.args.itemId));
            console.log("Updating Item State");

            instance.getItem(Number(result.args.itemId))
              .then(function(marketplaceItem) {
  
                var card = $(`[data-id="${marketplaceItem[0]}"]`);   
                App.fillElement(marketplaceItem, card);
                App.fetchBalance();
            });      
          } else
                console.log(error);
        });
      }); 

    App.contracts.Market.deployed()
      .then(function(result) {
        instance = result;
        return instance.getSize();
      })
      .then(async function loop(size) {
        
        for (id = 0; id < size; id++) {

          await instance.getItem(id)
            .then(function(marketplaceItem) {

              // console.log("marketplaceItem: ", marketplaceItem);
  
              var itemEl = App.fillElement(marketplaceItem, itemTemplate);
              itemEl.find(".marketplace-item").attr("data-id", marketplaceItem[App.ITEM_ID_IDX]);
              itemEl.find(".marketplace-item").attr("data-seller", marketplaceItem[App.ITEM_SELLER_IDX]);
              itemEl.find(".marketplace-item").attr("data-price", marketplaceItem[App.ITEM_PRICE_IDX]);
  
              itemRow.append(itemEl.html());
          });
        }
      });

    return App.fetchBalance();
  },

  /**
   * Retrieves balance for current account from smart contract
   */
  fetchBalance: function() {
    App.contracts.Market.deployed()
      .then(function(instance) {
        return instance.getBalance(App.account.hash);
      })
      .then(function(balance) {
        $(".account-balance").text(Number(balance));
      })
      .catch(function(error) {
        console.log(error);
      });
  },

  /**
   * Sets up HTML elements based on available contract data
   */
  setupPage: function() {
    var template = $("#account-item");
    $("#account-name").text(App.account.name);
    $("#account-image").text(App.account.image);

    Object.keys(App.accounts).forEach(function(key, index) {
      var account = App.accounts[key];
      template.find(".dropdown-item").attr("href", "/" + (index + 1));
      template.find(".dropdown-item").text(account.name);
      template.find(".dropdown-item").toggleClass("active", App.account === account);
      $(".dropdown-menu").append(template.html());
    });

    return App.bindEvents();
  },

  /**
   * Updates HTML card element with data for marketplace item
   */
  fillElement: function(data, element) {

    var price = Number(data[4]);
    var isOwnedByAccount = data[App.ITEM_SELLER_IDX] == App.account.hash;
    var isSold = Number(data[7]) == App.ITEM_STATE_SOLD;
    var nickname = data[5].length > 0 ? `"${data[5]}"` : "";
    var seller = `Seller: "${App.address2account[data[App.ITEM_SELLER_IDX]][App.ACCOUNT_NAME_IDX]}"`;
    var buyer =  isSold ? `Buyer: "${App.address2account[data[App.ITEM_BUYER_IDX]][App.ACCOUNT_NAME_IDX]}"` : "";

    // console.log("Item State: ", isSold);

    element.find(".btn-buy").toggle(!isSold);
    element.find(".btn-sold").toggle(isSold);
    element.find(".btn-buy-privately").toggle(!isSold);
    element.find(".btn-buy").toggleClass("disabled", isOwnedByAccount);
    element.find(".btn-buy-privately").toggleClass("disabled", isOwnedByAccount);

    element.find(".card-item-name").text(data[2]);
    element.find(".card-img-top").attr("src", data[3]);
    element.find(".card-price-amount").text(price);
    element.find(".card-item-nickname").text(nickname);

    element.find(".card-item-seller").text(seller);
    element.find(".btn-sold").toggle(isSold);
    element.find(".card-item-buyer").text(buyer);

    return element;
  },

  /**
   * Bind actions with HTML elements
   */
  bindEvents: function() {
    $(document).on("click", ".btn-buy", function(event) {
      App.handleBuying(event, false);    
    });
    $(document).on("click", ".btn-buy-privately", function(event) {
      App.handleBuying(event, true);    
    });
    $(document).on("keypress", ".card-input-name", App.handleNickname);
    $(document).on("click", ".btn-edit", App.toggleEdit);
  },

  /**
   * Shows/hides nickname input element for market item
   */
  toggleEdit: function(event) {
    var parent = $(event.target).closest(".card-info-wrapper");

    parent.find(".btn-edit").toggle(false);
    parent.find(".card-info").toggle(false);
    parent.find(".card-input-name").toggle(true);
  },

  /**
   * Handles action when user clicks 'Buy'. Calls
   * the buying action on the smart contract.
   */
  handleBuying: async function(event, isPrivate) {
    event.preventDefault();
    var button = $(event.target);
    var card = button.closest(".marketplace-item");
    var itemId = card.data("id");
    var itemSeller = card.data("seller");
    var itemPrice = card.data("price");
    var txnPrivateFor = App.inclusivePrivateFor;

    button.toggleClass("disabled");
    button.prop("disabled", true);

    console.log("isPrivate: ", isPrivate);

    if (isPrivate) {
      txnPrivateFor = [App.address2account[itemSeller][App.ACCOUNT_KEY_IDX], "oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8="]; // do it more elegentlly 
    }
    console.log("txnPrivateFor: ", txnPrivateFor);

    await App.contracts.CashToken.deployed()
      .then(function(tokenContract) {
        console.log("App.marketAddress: ", App.marketAddress);
        return tokenContract.approve(App.marketAddress, itemPrice, {
            from: App.account.hash,
            privateFor: txnPrivateFor, // change that only account + bank can see  
        })
        .then((res) => {
          button.toggleClass("disabled");
          console.log(res);
          App.fetchBalance();
        })
        .catch(function(error) {
          button.toggleClass("disabled");
          button.prop("disabled", false);

          console.log(error);
        });
      });

    await App.contracts.BidManager.deployed()
      .then(function(bidManager){
        console.log("Creating bid: {itemId: %s, bidPrice: %s}", itemId, itemPrice);
        console.log("bidManager.createBid(%s, %s, { from: %s, privateFor: %s, });", itemId, itemPrice, App.account.hash, txnPrivateFor.toString());
        return bidManager.createBid(itemId, itemPrice, {
          from: App.account.hash,
          privateFor: txnPrivateFor,   
        });
      })
      .then((res) => {
        console.log(res);
      })
      .catch(function(error) {
        button.toggleClass("disabled");
        button.prop("disabled", false);

        console.log(error);
      });

    // App.contracts.Market.deployed()
    //   .then(function(contract) {
    //     instance = contract;
    //     return instance.getItem(itemId);
    //   })

    //   .then(function(item) {
    //     if (isPrivate) {
    //       var itemSeller = item[App.ITEM_SELLER_IDX];
    //       txnPrivateFor = [App.address2account[itemSeller][App.ACCOUNT_KEY_IDX], "oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8="]; // do it more elegentlly 
    //     }
    //     console.log("txnPrivateFor: ", txnPrivateFor);

    //     var itemPrice = Number(item[4]);
    //     return App.contracts.CashToken.deployed()
    //     .then(function(tokenContract) {
    //       console.log("instance.address: ", instance.address);
    //       return tokenContract.approve(instance.address, itemPrice, {
    //           from: App.account.hash,
    //           privateFor: txnPrivateFor, // change that only account + bank can see  
    //       })
    //       .then(instance.buyItem(itemId, {
    //         from: App.account.hash,
    //         privateFor: txnPrivateFor,
    //       }))
    //       .then(() => {
    //         button.toggleClass("disabled");
    //         App.fetchBalance();
    //       })
    //       .catch(function(error) {
    //         button.toggleClass("disabled");
    //         button.prop("disabled", false);

    //         console.log(error);
    //       });
    //     })})
  },

  /**
   * Handles action when user nicknames item. Creates
   * private transaction to update nickname on the contract.
   */
  // handleNickname: function(event) {
  //   if (event.which == 13) {
  //     // 'Enter' keypress
  //     var instance;
  //     var itemState;
  //     var name = event.target.value;
  //     var card = $(event.target).closest(".marketplace-item");
  //     var itemId = card.data("id");

  //     App.contracts.Market.deployed()
  //       .then(function(contract) {
  //         instance = contract;
  //         return instance.setNickname(itemId, name, {
  //           from: App.account.hash,
  //           privateFor: [],
  //         });
  //       })
  //       .then(function() {
  //         return instance.getItemState(itemId);
  //       })
  //       .then(function(state) {
  //         itemState = state[App.ITEM_STATE_IDX];
  //         return instance.getItem(itemId);
  //       })
  //       .then(function(data) {
  //         card.find(".btn-edit").toggle(true);
  //         card.find(".card-info").toggle(true);
  //         card.find(".card-input-name").toggle(false);

  //         return App.fillElement(data, card);
  //       })
  //       .catch(function(error) {
  //         console.log(error);
  //       });
  //   }
  // },

  /**
   * Switches accounts based on browser routes
   */
  getAccount: function(pathname) {
    switch (window.location.pathname) {
      case "/1":
        return App.accounts[0];
      case "/2":
        return App.accounts[1];
      case "/3":
        return App.accounts[2];
      default:
        return App.accounts[0];
    }
  },
};

$(function() {
  $(window).load(function() {
    $.getJSON("json/accounts.json").then(function(data) {
      App.init(data);
    });
  });
});
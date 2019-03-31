App = {
  ACCOUNT_NAME_IDX: 0,
  ACCOUNT_KEY_IDX: 1,
  ITEM_ID_IDX: 0,
  ITEM_SELLER_IDX: 1,
  ITEM_NAME_IDX: 2,
  ITEM_IMG_IDX: 3,
  ITEM_PRICE_IDX: 4,
  ITEM_NICKNAME_IDX: 5,
  ITEM_BUYER_IDX: 6,
  ITEM_STATE_IDX: 7,
  ITEM_STATE_SOLD: 1,
  NULL_ADDRESS: "0x0000000000000000000000000000000000000000",
  BANK_ADDRESS: "0x9186eb3d20cbd1f5f992a950d808c4495153abd5",
  TXN_GAS: 900000,

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

    /* Holds an array of all other accounts' public keys */
    App.inclusivePrivateFor = $(App.accounts)
      .not([App.account])
      .get()
      .map(function(acc) {
        return acc.key;
      });

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

    // $.getJSON("Market.json", function(data) {
    //     App.contracts.Market = TruffleContract(data);
    //     App.contracts.Market.setProvider(App.web3Provider);
  
    //     return App.fetchItems
    //     .then(App.setupMarketListeners())
    //     .then($.getJSON("BidManager.json", function(data) {
    //         App.contracts.BidManager = TruffleContract(data);
    //         App.contracts.BidManager.setProvider(App.web3Provider);
      
    //         return App.setupBidManagerListeners();
    //     }));
    // })

    // $.getJSON("TechToken.json", function(data) {
    //     App.contracts.CashToken = TruffleContract(data);
    //     App.contracts.CashToken.setProvider(App.web3Provider);
    // });

    var marketData = await $.getJSON("Market.json");
    App.contracts.Market = await TruffleContract(marketData);
    await App.contracts.Market.setProvider(App.web3Provider);
    await App.fetchItems();
    await App.setupMarketListeners();

    var tokenData = await $.getJSON("TechToken.json");
    App.contracts.CashToken = await TruffleContract(tokenData);
    await App.contracts.CashToken.setProvider(App.web3Provider);

    var bidManagerData = await $.getJSON("BidManager.json");
    App.contracts.BidManager = await TruffleContract(bidManagerData);
    await App.contracts.BidManager.setProvider(App.web3Provider);
    await App.setupBidManagerListeners();

    return App.setupPage();
  },

  /**
   * Setup BidManager.sol event listeners
   */
  setupBidManagerListeners: function() {
    App.contracts.BidManager.deployed()
    .then(bidManager => {

        /* BidCreated event listener */
        bidManager.BidCreated().watch(function(error, result) {
          if (!error) {
            console.log("Received Event BidCreated - {bidId: %s, itemId: %s, buyer: %s, seller: %s}", result.args.bidId, Number(result.args.itemId), result.args.buyer, result.args.seller);

            // var seller = result.args.seller; 
            // console.log("item seller: ", seller);

            if (result.args.seller == App.account.hash) {
              console.log("Seller received bid and executing the deal");

              App.contracts.Market.deployed()
                .then(market => {
                  console.log("market: ", market.address);
                  return market.executeSale(Number(result.args.itemId), result.args.bidId, {
                    from: App.account.hash,
                    privateFor: App.inclusivePrivateFor, //[App.getPublicKey(result.args.buyer), App.getPublicKey(App.BANK_ADDRESS)],  //TODO: 1) move to function 2)currently will only execute privately -- to change?
                    gas: App.TXN_GAS
                  });
                })
                .then((res) => {
                  console.log(res);
                })
                .catch(function(error) {      
                  console.log(error);
                });
            }             
          } else
              console.log(error);
        });
      });
  },

    /**
   * Setup Market.sol event listeners
   */
  setupMarketListeners: function() {
    App.contracts.Market.deployed()
      .then(market => {

        // set market address
        App.marketAddress = market.address;

        /* ItemSold event listener */
        market.ItemSold().watch(function(error, result) {
          if (!error) {

            console.log("Received Event ItemSold - {itemId: %s, Seller: %s}", Number(result.args.itemId), result.args.seller);
            App.fetchBalance();

            if (result.args.seller == App.account.hash) {
              console.log("finalizing Item State");
              
              market.markItemSold(Number(result.args.itemId), {
                from: App.account.hash,
                privateFor: App.inclusivePrivateFor,
                gas: App.TXN_GAS
              });
            }             
          } else
              console.log(error);
        });

        /* ItemStateSold event listener */
        market.ItemStateSold().watch(function(error, result) {
          if (!error) {

            console.log("Received Event ItemStateSold - {itemId: %s}", Number(result.args.itemId));
            console.log("Updating Item State");

            market.getItem(Number(result.args.itemId))
              .then(function(marketplaceItem) {
  
                var card = $(`[data-id="${marketplaceItem[App.ITEM_ID_IDX]}"]`).last();
                console.log("CARD (ItemStateSold): ", card);   
                App.fillElement(marketplaceItem, card);
                App.fetchBalance();
            });      
          } else
                console.log(error);
        });

        /* ItemReofferRequest event listener */
        market.ItemReofferRequest().watch(function(error, result) {
          if (!error) {
            console.log("Received Event ItemReofferRequest - {itemId: %s, Seller: %s, Buyer: %s}", Number(result.args.itemId), result.args.seller, result.args.buyer);
            
            if (result.args.seller == App.account.hash) {
              console.log("Reoffering item %s for sale", Number(result.args.itemId));

              market.reofferItemForSale(Number(result.args.itemId), result.args.buyer, {
                from: App.account.hash,
                privateFor: App.inclusivePrivateFor,
                gas: App.TXN_GAS
              })
              .then((res) => {       
                console.log(res);
              })
              .catch(function(error) {      
                console.log(error);
              });   
            }
          } else
                console.log(error);
        });

        /* ItemOnSale event listener */
        market.ItemOnSale().watch(function(error, result) {
          if (!error) {

            console.log("Received Event ItemOnSale - {itemId: %s}", Number(result.args.itemId));
            console.log("Updating Item State");

            market.getItem(Number(result.args.itemId))  //TODO: MOVE TO FUNCTION
              .then(function(marketplaceItem) {
      
                var card = $(`[data-id="${marketplaceItem[App.ITEM_ID_IDX]}"]`);
                card.attr("data-seller", marketplaceItem[App.ITEM_SELLER_IDX]); 
                App.fillElement(marketplaceItem, card);
            });      
          } else
                console.log(error);
        });
      }); 
  },

  /**
   * Retrieves items from Market.sol smart contract
   */
  fetchItems: function() {
    var instance;
    var itemRow = $("#itemRow");
    var itemTemplate = $("#itemTemplate");

    App.contracts.Market.deployed()
      .then(function(result) {
        instance = result;
        return instance.getSize();
      })
      .then(async function loop(size) {
        
        for (id = 0; id < size; id++) {

          await instance.getItem(id)
            .then(function(marketplaceItem) {

              // console.log("marketplaceItem: ", marketplaceItem);                 //TODO: change to itemEl.find(".marketplace-item") var
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

    var price = Number(data[App.ITEM_PRICE_IDX]);
    var isSold = Number(data[App.ITEM_STATE_IDX]) == App.ITEM_STATE_SOLD;
    var isOwnedByAccount = (data[App.ITEM_SELLER_IDX] == App.account.hash && !isSold) || data[App.ITEM_BUYER_IDX] == App.account.hash;
    var nickname = data[App.ITEM_NICKNAME_IDX].length > 0 ? `"${data[App.ITEM_NICKNAME_IDX]}"` : "";
    var seller = `Seller: "${App.getName(data[App.ITEM_SELLER_IDX])}"`;
    var buyer =  isSold ? `Buyer: "${App.getName(data[App.ITEM_BUYER_IDX])}"` : "";

    element.find(".btn-bid").toggle(!isSold);
    element.find(".btn-sold").toggle(isSold && !isOwnedByAccount);
    element.find(".btn-sell").toggle(isSold && isOwnedByAccount);
    element.find(".btn-bid-privately").toggle(!isSold);
    element.find(".btn-bid").toggleClass("disabled", isOwnedByAccount);
    element.find(".btn-bid-privately").toggleClass("disabled", isOwnedByAccount);

    element.find(".card-item-name").text(data[App.ITEM_NAME_IDX]);
    element.find(".card-img-top").attr("src", data[App.ITEM_IMG_IDX]);
    element.find(".card-price-amount").text(price);
    element.find(".card-item-nickname").text(nickname);

    element.find(".card-item-seller").text(seller);
    element.find(".card-item-buyer").text(buyer);

    return element;
  },

  /**
   * Bind actions with HTML elements
   */
  bindEvents: function() {
    $(document).on("click", ".btn-bid", function(event) {
      App.handleBidding(event, false);    
    });
    $(document).on("click", ".btn-bid-privately", function(event) {
      App.handleBidding(event, true);    
    });
    $(document).on("click", ".btn-sell", App.handleSelling);
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
   * Handles action when user clicks 'Bid'. Calls
   * the creatBid action on the BidManager, after 
   * approving Market the bid amount tokens.
   */
  handleBidding: async function(event, isPrivate) {
    event.preventDefault();
    var button = $(event.target);
    var card = button.closest(".marketplace-item");
    var bidButton = card.find(".btn-bid");
    var bidPrivatelyButton = card.find(".btn-bid-privately");
    var itemId = card.data("id");
    var itemSeller = card.data("seller");
    var itemPrice = card.data("price");
    var txnPrivateFor = isPrivate ? [App.getPublicKey(itemSeller), App.getPublicKey(App.BANK_ADDRESS)] : App.inclusivePrivateFor; //TODO: move to function

    bidButton.toggleClass("disabled", true);
    bidPrivatelyButton.toggleClass("disabled", true);

    console.log("isPrivate: ", isPrivate);
    console.log("txnPrivateFor: ", txnPrivateFor);
    console.log("itemSeller (handleBidding): ", itemSeller);
    card.attr("data-isprivate", isPrivate);
    console.log("isPrivate changed in card to: ", card.data("isprivate"));

    await App.contracts.CashToken.deployed()
      .then(function(tokenContract) {
        console.log("App.marketAddress: ", App.marketAddress);
        return tokenContract.approve(App.marketAddress, itemPrice, {
          from: App.account.hash,
          privateFor: txnPrivateFor, //TODO: change that only account + bank can see?
          gas: App.TXN_GAS
        })
        .then((res) => {
          console.log("tokenContract.approve() => ", res);
        })
        .catch(function(error) {
          bidButton.toggleClass("disabled", false);
          bidPrivatelyButton.toggleClass("disabled", false);
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
          gas: App.TXN_GAS 
        });
      })
      .then((res) => {
          console.log("bidManager.createBid() => ", res);
        })
        .catch(function(error) {
          bidButton.toggleClass("disabled", false);
          bidPrivatelyButton.toggleClass("disabled", false);
          console.log(error);
      });
  },

    /**
   * Handles action when user clicks 'Sell'. Calls
   * the creatBid action on the BidManager, after 
   * approving Market the bid amount tokens.
   */
  handleSelling: async function(event) {
    event.preventDefault();
    var button = $(event.target);
    var card = button.closest(".marketplace-item");
    var itemId = card.data("id");
    var itemSeller = card.data("seller");
    var isPrivate = card.data("isprivate");
    var txnPrivateFor = isPrivate ? [App.getPublicKey(itemSeller), App.getPublicKey(App.BANK_ADDRESS)] : App.inclusivePrivateFor; //TODO: move to function

    console.log("isPrivate (handleSelling): ", isPrivate);

    button.toggleClass("disabled");
    button.prop("disabled", true);

    await App.contracts.Market.deployed()
      .then(function(market) {
        if (isPrivate) {
          console.log("requestItemReoffer as txn was private");
          return market.requestItemReoffer(itemId, {
            from: App.account.hash,
            privateFor: txnPrivateFor,
            gas: App.TXN_GAS
          })
        }
        else {
          console.log("reofferItemForSale as txn was public");
          return market.reofferItemForSale(itemId, App.account.hash, {
            from: App.account.hash,
            privateFor: txnPrivateFor,
            gas: App.TXN_GAS
          })
        }
      })
      .then((res) => {
        button.toggleClass("disabled");     //TODO: check if needed
        console.log(res);
      })
      .catch(function(error) {
        button.toggleClass("disabled");
        button.prop("disabled", false);
        console.log(error);
      });
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
   * Returns the Public Key associated with given address
   */
  getPublicKey: function(address) {
    return App.address2account[address][App.ACCOUNT_KEY_IDX];
  },

  /**
   * Returns the account name associated with given address
   */
  getName: function(address) {
    return App.address2account[address][App.ACCOUNT_NAME_IDX];
  },

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
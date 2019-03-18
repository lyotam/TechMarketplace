App = {
  ACCOUNT_NAME_IDX: 0,
  ACCOUNT_KEY_IDX: 1,
  ITEM_SELLER_IDX: 1,
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
    App.inclusivePrivateFor.push("oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8="); // node 4 pub key ----- change

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

    await $.getJSON("TechToken.json", function(data) {
      App.contracts.CashToken = TruffleContract(data);
      App.contracts.CashToken.setProvider(App.web3Provider);

      // Approval listener 
      App.contracts.CashToken.deployed()
        .then(contract => {
          contract.Approval().watch(function(error, result) {
            if (!error) {
              console.log("Received Event Approval - {tokenOwner: %s, Spender: %s, Tokens Approved: %s}", result.args.tokenOwner, result.args.spender, Number(result.args.tokens));           
            } else
                console.log(error);
          });
        }); 
    }).then( 

    await $.getJSON("Market.json", function(data) {
      App.contracts.Market = TruffleContract(data);
      App.contracts.Market.setProvider(App.web3Provider);
      })
    )
    .then(await App.fetchItems())
    .then(await App.setupPage()); 
  },

  /**
   * Retrieves items from Market.sol smart contract
   */
  fetchItems: function() {
    var instance;
    var itemRow = $("#itemRow");
    var itemTemplate = $("#itemTemplate");

    App.contracts.Market.deployed()
      .then(contract => {

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

            instance.getItemState(Number(result.args.itemId))
        
            .then(itemState => {
  
              return instance.getItem(Number(itemState[App.ITEM_STATE_ID_IDX]))
              .then(function(marketplaceItem) {
  
                var card = $(`[data-id="${marketplaceItem[0]}"]`);   
                App.fillElement(marketplaceItem, card, itemState[App.ITEM_STATE_IDX]);
                App.fetchBalance();
              });
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

          await instance.getItemState(id)          
          .then(itemState => {

            return instance.getItem(Number(itemState[App.ITEM_STATE_ID_IDX]))
            .then(function(marketplaceItem) {

              // console.log("marketplaceItem: ", marketplaceItem);
  
              var itemEl = App.fillElement(marketplaceItem, itemTemplate, itemState[App.ITEM_STATE_IDX]);
              itemEl.find(".marketplace-item").attr("data-id", marketplaceItem[0]);
  
              itemRow.append(itemEl.html());
            });
          })
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
  fillElement: function(data, element, itemState) {

    var price = Number(data[4]);
    var isOwnedByAccount = data[App.ITEM_SELLER_IDX] == App.account.hash;
    var isSold = Number(itemState) == App.ITEM_STATE_SOLD;
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
    var instance;
    var button = $(event.target);
    var card = button.closest(".marketplace-item");
    var itemId = card.data("id");
    var txnPrivateFor = App.inclusivePrivateFor;

    console.log("isPrivate: ", isPrivate);

    button.toggleClass("disabled");
    button.prop("disabled", true);

    const techToken = await App.contracts.CashToken.deployed();



    console.log("TechToken Address: ", techToken.address);

    await console.log("approveAndCall response: ", await techToken.approveAndCall("0xabd5d13022b508d113d4d4f1a89fe36ff1a2f0a6", 3, 0, {
      from: "0xca843569e3427144cead5e4d5999a3d0ccf92b8e", 
      privateFor: ["BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo=", "1iTZde/ndBHvzhcl7V68x44Vx7pl8nwx9LqnM/AfJUg=", "oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8="], 
    }))

    await App.fetchBalance();

      //   return contract.balanceOf("0xca843569e3427144cead5e4d5999a3d0ccf92b8e");
      // })

      // .then(function(response) {

      //   console.log("approveAndCall response: ", response);

      //   button.toggleClass("disabled");
      //   App.fetchBalance();
      // })
      // .catch(function(error) {
      //   button.toggleClass("disabled");
      //   button.prop("disabled", false);

      //   console.log(error);
      // });


    // App.contracts.Market.deployed()
    //   .then(function(contract) {
    //     instance = contract;
    //     return instance.getItem(itemId);
    //   })

      // .then(function(item) {
      //   if (isPrivate) {
      //     var itemSeller = item[App.ITEM_SELLER_IDX];
      //     txnPrivateFor = [App.address2account[itemSeller][App.ACCOUNT_KEY_IDX], "oNspPPgszVUFw0qmGFfWwh1uxVUXgvBxleXORHj07g8="]; // do it more elegentlly 
      //   }
      //   console.log("txnPrivateFor: ", txnPrivateFor);

      //   var itemPrice = Number(item[4]);
      //   return App.contracts.CashToken.deployed()
      //   .then(function(tokenContract) {
      //     console.log("instance.address: ", instance.address);
      //     console.log("tokenContract(%s).approveAndCall(%s, %s, %s, {from: %s, privateFor: %s, })", tokenContract.address, instance.address, itemPrice, itemId, App.account.hash, txnPrivateFor);
      //     return tokenContract.approveAndCall(instance.address, itemPrice, itemId, {
      //         from: App.account.hash,
      //         privateFor: txnPrivateFor, // change that only account + bank can see? 
      //     })
      //     // .then(instance.buyItem(itemId, {
      //     //   from: App.account.hash,
      //     //   privateFor: txnPrivateFor,
      //     // }))
      //     .then((response) => {

      //       console.log("approveAndCall response: ", response);

      //       button.toggleClass("disabled");
      //       App.fetchBalance();
      //     })
      //     .catch(function(error) {
      //       button.toggleClass("disabled");
      //       button.prop("disabled", false);

      //       console.log(error);
      //     });
      //   })});
  },

  /**
   * Handles action when user nicknames item. Creates
   * private transaction to update nickname on the contract.
   */
  handleNickname: function(event) {
    if (event.which == 13) {
      // 'Enter' keypress
      var instance;
      var itemState;
      var name = event.target.value;
      var card = $(event.target).closest(".marketplace-item");
      var itemId = card.data("id");

      App.contracts.Market.deployed()
        .then(function(contract) {
          instance = contract;
          return instance.setNickname(itemId, name, {
            from: App.account.hash,
            privateFor: [],
          });
        })
        .then(function(response) {
          console.log("response: ", response);
          return instance.getItemState(itemId);
        })
        .then(function(state) {
          itemState = state[App.ITEM_STATE_IDX];
          return instance.getItem(itemId);
        })
        .then(function(data) {
          card.find(".btn-edit").toggle(true);
          card.find(".card-info").toggle(true);
          card.find(".card-input-name").toggle(false);

          return App.fillElement(data, card, itemState);
        })
        .catch(function(error) {
          console.log(error);
        });
    }
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
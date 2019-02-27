  App = {
    NAME_IDX: 0,
    KEY_IDX: 1,
    ITEM_SELLER_IDX: 1,
    ITEM_STATE_ID_IDX: 0,
    ITEM_STATE_IDX: 1,
    ITEM_BUYER_IDX: 6,
    ITEM_STATE_SOLD: 1,
  
    web3Provider: null,
    contracts: {},
    account: null,
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
  
      Object.keys(accounts).forEach(function(key) {
        var account = accounts[key];
        App.address2account[account.address] = [account.name, account.key];
      });
  
      return App.initContract();
    },
  
    /**
     * Initializes smart contract on web application
     */
    initContract: function() {
      $.getJSON("Market.json", function(data) {
        App.contracts.Market = TruffleContract(data);
  
        App.contracts.Market.setProvider(App.web3Provider);
  
        return App.fetchItems();
      });
  
      return App.setupPage();
    },
  
    /**
     * Retrieves items from Market.sol smart contract
     */
    fetchItems: function() {
      var instance;
      var itemState;
      var itemRow = $("#itemRow");
      var itemTemplate = $("#itemTemplate");
  
      App.contracts.Market.deployed()
        .then(function(result) {
          instance = result;
          return instance.getSize();
        })
        .then(function(size) {
          for (id = 0; id < size; id++) {
  
            instance.getItemState(id)
            .then(function(state) {
  
              console.log("itemState: ", state[0]);
              itemState = state[App.ITEM_STATE_IDX];
              return instance.getItem(Number(state[App.ITEM_STATE_ID_IDX]));
            })
            .then(function(marketplaceItem) {
  
              console.log("marketplaceItem: ", marketplaceItem);
  
              var itemEl = App.fillElement(marketplaceItem, itemTemplate, itemState);
              itemEl.find(".marketplace-item").attr("data-id", marketplaceItem[0]);
  
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
          $(".account-balance").text(Number(web3.fromWei(balance)).toFixed(2));
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
  
      var ether = Number(web3.fromWei(data[4])).toFixed(2);
      // var isOwned = data[App.ITEM_SELLER_IDX] !== "0x0000000000000000000000000000000000000000";
      var isOwnedByAccount = data[App.ITEM_SELLER_IDX] == App.account.hash;
      var isSold = Number(itemState) == App.ITEM_STATE_SOLD;
      var nickname = data[5].length > 0 ? `"${data[5]}"` : "";
      var seller = `Seller: "${App.address2account[data[App.ITEM_SELLER_IDX]][App.NAME_IDX]}"`;
      var buyer =  isSold ? `Buyer: "${App.address2account[data[App.ITEM_BUYER_IDX]][App.NAME_IDX]}"` : "";
  
      console.log("Item State: ", isSold);
  
      element.find(".btn-buy").toggle(!isSold);
      element.find(".btn-sold").toggle(isSold);
      element.find(".btn-buy-privately").toggle(!isSold);
      element.find(".btn-buy").toggleClass("disabled", isOwnedByAccount);
      element.find(".btn-buy-privately").toggleClass("disabled", isOwnedByAccount);
  
      element.find(".card-item-name").text(data[2]);
      element.find(".card-img-top").attr("src", data[3]);
      element.find(".card-price-amount").text(ether);
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
      // $(document).on("click", ".btn-sell", App.handleSelling);
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
    handleBuying: function(event, isPrivate) {
      event.preventDefault();
      var instance;
      var itemState;
      var button = $(event.target);
      var card = button.closest(".marketplace-item");
      var itemId = card.data("id");
  
      console.log("Card: ", card);
  
      button.toggleClass("disabled");
      button.prop("disabled", true);
  
      // Creates array of keys from other accounts
      var inclusivePrivateFor = 
      $(App.accounts)
      .not([App.account])
      .get()
      .map(function(acc) {
        return acc.key;
      });
  
      App.contracts.Market.deployed()
        .then(function(contract) {
          instance = contract;
          return instance.getItem(itemId);
        })
        .then(function(item) {
  
          var itemSeller = item[App.ITEM_SELLER_IDX];
          console.log("itemSeller: ", itemSeller);
          console.log("address2account: ", App.address2account);
  
          var txnPrivateFor = isPrivate ? [App.address2account[itemSeller][App.KEY_IDX]] : inclusivePrivateFor;
  
          console.log("isPrivate: ", isPrivate);
          console.log("inclusivePrivateFor: ", inclusivePrivateFor);
  
          return instance.buyItem(itemId, {
            from: App.account.hash,
            privateFor: txnPrivateFor,
          });
        })
        .then(function() {
          return instance.finalizeItemState(itemId, {
            from: App.account.hash,
            privateFor: inclusivePrivateFor,
          });
        })
        .then(function() {
          return instance.getItemState(itemId);
        })
        .then(function(state) {
          itemState = state[App.ITEM_STATE_IDX];
          return instance.getItem(itemId);
        })
        .then(function(data) {
          button.toggleClass("disabled");
          button.prop("disabled", false);
  
          App.fetchBalance();
          return App.fillElement(data, card, itemState);
        })
        .catch(function(error) {
          button.toggleClass("disabled");
          button.prop("disabled", false);
  
          console.log(error);
        });
    },
  
    /**
     * Handles action when user clicks 'Sell'. Calls
     * the selling action on the smart contract.
     */
    // handleSelling: function(event) {
    //   event.preventDefault();
    //   var instance;
    //   var button = $(event.target);
    //   var card = button.closest(".marketplace-item");
    //   var itemId = card.data("id");
  
    //   button.toggleClass("disabled");
    //   button.prop("disabled", true);
  
    //   App.contracts.Market.deployed()
    //     .then(function(contract) {
    //       instance = contract;
  
    //       // Creates array of keys of accounts excluding the current account
    //       var privateFor = $(App.accounts)
    //         .not([App.account])
    //         .get()
    //         .map(function(acc) {
    //           return acc.key;
    //         });
  
    //       return instance.sellItem(itemId, {
    //         from: App.account.hash,
    //         privateFor: privateFor,
    //       });
    //     })
    //     .then(function() {
    //       return instance.getItem(itemId);
    //     })
    //     .then(function(data) {
    //       button.toggleClass("disabled");
    //       button.prop("disabled", false);
  
    //       App.fetchBalance();
    //       return App.fillElement(data, card);
    //     })
    //     .catch(function(error) {
    //       button.toggleClass("disabled");
    //       button.prop("disabled", false);
  
    //       console.log(error);
    //     });
    // },
  
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
          .then(function() {
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
  
  
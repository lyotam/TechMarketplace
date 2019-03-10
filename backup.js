Market.deployed().then(function(contract) { return contract.getItem(itemId); });

Market.deployed().then(function(contract) { return contract.buyItem(4, { privateFor: ["BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo=" ,], }) } );

Market.deployed().then(function(contract) { 
  return contract.finalizeItemState(1, { privateFor: ["QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc=" , "1iTZde/ndBHvzhcl7V68x44Vx7pl8nwx9LqnM/AfJUg=",], }) } );

// handleBuying : 240
var itemSeller = item[App.ITEM_SELLER_IDX];

var txnPrivateFor = isPrivate ? [App.address2account[itemSeller][App.ACCOUNT_KEY_IDX]] : App.inclusivePrivateFor;

// bindEvents : 214
$(document).on("click", ".btn-buy-privately", function(event) {
  App.handleBuying(event, true);    
});
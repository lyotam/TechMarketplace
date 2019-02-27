pragma solidity ^0.4.17;

contract Market {
  Item[] public items;
  mapping(address => uint256) public balances;
  enum ItemState {Available, Sold}

  ItemOffer[] public itemOffers;

  struct ItemOffer {
      address seller;
      ItemState itemState;
  }

  struct Item {
    address seller;
    string name;
    string image;
    uint256 price;
    string nickname;
    address buyer;
  }

    event ItemSold(uint itemId, address seller);
    event ItemStateFinalized(uint itemId);


  // private contract
  // add backup on local mac
  // vs code instatead of atom
  // tessera - 2 jvms or 1
  // where are the public keys configured, how does a new node joins with it's keys
  // web3 creation with truffle
  // double spending with private transaction


  constructor(address accountA, address accountB, address accountC) public { 
    balances[accountA] = 10 ether;
    balances[accountB] = 10 ether;
    balances[accountC] = 10 ether;
  }

  function getBalance(address node) public view returns (uint256){
    return balances[node];
  }

  function createItem(address _seller, string _name, string _image, uint256 _price) public {
    Item memory _item = Item(_seller, _name, _image, _price, "" , address(0));
    items.push(_item);
    itemOffers.push(ItemOffer(_seller, ItemState.Available));
  }

  function buyItem(uint id) public returns (uint) {
    require(id >= 0 && id <= items.length);
    require(msg.sender != items[id].seller);
    require(balances[msg.sender] >= items[id].price);
    require(itemOffers[id].itemState == ItemState.Available);

    balances[msg.sender] -= items[id].price;
    balances[items[id].seller] += items[id].price;
    items[id].buyer = msg.sender;

    emit ItemSold(id, items[id].seller);

    return id;
  }

  function finalizeItemState(uint id) public returns (uint) {
    require(itemOffers[id].seller == msg.sender);
    
    itemOffers[id].itemState = ItemState.Sold;

    emit ItemStateFinalized(id);
  }

  function setNickname(uint id, string newNickname) public returns (uint) {
    require(id >= 0 && id <= items.length);

    items[id].nickname = newNickname;

    return id;
  }

  function getSize() public view returns (uint) {
    return items.length;
  }

  function getItem(uint id) public view returns (uint, address, string, string, uint256, string, address) {
    Item memory item = items[id];
    return (id, item.seller, item.name, item.image, item.price, item.nickname, item.buyer);
  }

  function getItemState(uint id) public view returns (uint, uint) {
    return (id, uint(itemOffers[id].itemState));
  }
}
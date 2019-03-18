pragma solidity ^0.4.23;

import "./IERC20.sol";
import "./IApproveAndCallFallBack.sol";

contract Market is IApproveAndCallFallBack {

    Item[] public items;
    enum ItemState {Available, Sold}
    ItemOffer[] public itemOffers;
    IERC20 public cashToken;

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
    event ItemStateSold(uint itemId);

    modifier validItemId(uint id) {
        require(id >= 0 && id <= items.length, "Invalid item id");
        _;
    }


    constructor(address cashTokenAddress) public {
        cashToken = IERC20(cashTokenAddress);
    }

    function getBalance(address account) public view returns (uint) {
        return cashToken.balanceOf(account);
    }

    function createItem(address _seller, string _name, string _image, uint256 _price) public {
        Item memory _item = Item(_seller, _name, _image, _price, "", address(0));
        items.push(_item);
        itemOffers.push(ItemOffer(_seller, ItemState.Available));
    }

    function buyItem(uint id) public validItemId(id) returns (uint) {
        require(msg.sender != items[id].seller, "Seller can't purchase item");
        require(getBalance(msg.sender) >= items[id].price, "Insufficient funds");
        require(itemOffers[id].itemState == ItemState.Available, "Item is not for sale");

        require(cashToken.transferFrom(msg.sender, items[id].seller, items[id].price), "Token transfer failed");
        items[id].buyer = msg.sender;

        emit ItemSold(id, items[id].seller);

        return id;
    }

    function markItemSold(uint id) public returns (uint) {
        require(itemOffers[id].seller == msg.sender, "Only seller can finalize item");
        
        itemOffers[id].itemState = ItemState.Sold;

        emit ItemStateSold(id);
    }

    function setNickname(uint id, string newNickname) public validItemId(id) returns (uint) {
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

    function receiveApproval(address from, uint256 tokens, uint data) public {
        require(from != items[data].seller, "Seller can't purchase item");
        require(tokens >= items[data].price, "Insufficient funds");
        require(itemOffers[data].itemState == ItemState.Available, "Item is not for sale");

        require(cashToken.transferFrom(from, items[data].seller, items[data].price), "Token transfer failed");
        items[data].buyer = from;

        emit ItemSold(data, items[data].seller);
    }
}
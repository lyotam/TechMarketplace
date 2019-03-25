pragma solidity ^0.4.23;

import "./IERC20.sol";
import "./TechToken.sol";  // Remove!
import "./BidManager.sol";

contract Market {

    Item[] private items;
    enum ItemState {Available, Sold}
    TechToken private cashToken;
    BidManager private bidManager;

    struct Item {
        address seller;
        string name;
        string image;
        uint256 price;
        string nickname;
        address buyer;
        ItemState itemState;
    }

    event ItemSold(uint itemId, address seller);
    event ItemStateSold(uint itemId);

    modifier validItemId(uint id) {
        require(id >= 0 && id <= items.length, "Invalid item id");
        _;
    }


    constructor(address cashTokenAddress, address bidManagerAddress) public {
        cashToken = TechToken(cashTokenAddress);
        bidManager = BidManager(bidManagerAddress);
    }

    function getBalance(address account) public view returns (uint) {
        return cashToken.balanceOf(account);
    }

    function createItem(address _seller, string _name, string _image, uint256 _price) public {
        Item memory _item = Item(_seller, _name, _image, _price, "", address(0), ItemState.Available);
        items.push(_item);
    }

    function sellItem(uint itemId, bytes32 bidId) public {
        require(items[itemId].itemState == ItemState.Available, "Item is not for sale");

        (uint bidPrice, address buyer) = bidManager.acceptBid(bidId, itemId);

        require(getBalance(buyer) >= bidPrice, "Buyer has insufficient funds");
        require(buyer != items[itemId].seller, "Seller can't purchase item");

        require(cashToken.transferFrom(buyer, items[itemId].seller, bidPrice), "Token transfer failed");
        items[itemId].buyer = buyer;
        items[itemId].itemState = ItemState.Sold;

        emit ItemSold(itemId, items[itemId].seller);
    }

    // function buyItem(uint id) public validItemId(id) returns (uint) {
    //     require(msg.sender != items[id].seller, "Seller can't purchase item");
    //     require(getBalance(msg.sender) >= items[id].price, "Insufficient funds");

    //     require(cashToken.transferFrom(msg.sender, items[id].seller, items[id].price), "Token transfer failed");
    //     items[id].buyer = msg.sender;

    //     emit ItemSold(id, items[id].seller);

    //     return id;
    // }

    function markItemSold(uint id) public returns (uint) {
        require(items[id].seller == msg.sender, "Only seller can mark item as sold");
        
        items[id].itemState = ItemState.Sold;

        emit ItemStateSold(id);
    }

    function setNickname(uint id, string newNickname) public validItemId(id) returns (uint) {
        items[id].nickname = newNickname;

        return id;
    }

    function getSize() public view returns (uint) {
        return items.length;
    }

    function getItem(uint id) public view returns (uint, address, string, string, uint256, string, address, uint) {
        Item memory item = items[id];
        return (id, item.seller, item.name, item.image, item.price, item.nickname, item.buyer, uint(item.itemState));
    }

    // function getItemState(uint id) public view returns (uint, uint) {
    //     return (id, uint(itemOffers[id].itemState));
    // }

    function getItemPrice(uint itemId) public view returns (uint) {
        return items[itemId].price;
    }
}
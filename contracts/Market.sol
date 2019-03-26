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
    event ItemReofferRequest(uint itemId, address seller, address buyer);
    event ItemOnSale(uint itemId);     // need it?

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

    function executeSale(uint itemId, bytes32 bidId) public {
        require(items[itemId].itemState == ItemState.Available, "Item is not for sale");

        (uint bidPrice, address buyer) = bidManager.acceptBid(bidId, itemId);

        require(getBalance(buyer) >= bidPrice, "Buyer has insufficient funds");
        require(buyer != items[itemId].seller, "Seller can't purchase item");

        require(cashToken.transferFrom(buyer, items[itemId].seller, bidPrice), "Token transfer failed");
        items[itemId].buyer = buyer;
        items[itemId].itemState = ItemState.Sold;

        emit ItemSold(itemId, items[itemId].seller);
    }

    function requestItemReoffer(uint itemId) public {
        require(items[itemId].buyer == msg.sender, "Only item buyer can request to reoffer it for sale");

        emit ItemReofferRequest(itemId, items[itemId].seller, msg.sender);
    }

    function reofferItemForSale(uint itemId, address newOwner) public {
        require(items[itemId].itemState == ItemState.Sold, "Item is not yet sold");
        require(items[itemId].seller == msg.sender || items[itemId].buyer == msg.sender, "Only item owner can reoffer it for sale");

        items[itemId].seller = newOwner;
        items[itemId].buyer = address(0);
        items[itemId].itemState = ItemState.Available;

        emit ItemOnSale(itemId);
    }

    function markItemSold(uint itemId) public {
        require(items[itemId].seller == msg.sender, "Only seller can mark item as sold");
        
        items[itemId].itemState = ItemState.Sold;

        emit ItemStateSold(itemId);
    }

    function setNickname(uint itemId, string newNickname) public validItemId(itemId) returns (uint) {
        items[itemId].nickname = newNickname;

        return itemId;
    }

    function getSize() public view returns (uint) {
        return items.length;
    }

    function getItem(uint itemId) public view returns (uint, address, string, string, uint256, string, address, uint) {
        Item memory item = items[itemId];
        return (itemId, item.seller, item.name, item.image, item.price, item.nickname, item.buyer, uint(item.itemState));
    }

    function getItemPrice(uint itemId) public view returns (uint) {
        return items[itemId].price;
    }

    function getItemPrice(uint itemId, uint256 price) public {
        require(items[itemId].seller == msg.sender, "Only seller can set item price");
    
        items[itemId].price = price;
    }
            

}
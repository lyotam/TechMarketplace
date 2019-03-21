pragma solidity ^0.4.23;

contract Bid {

    uint itemId;
    uint bidPrice;
    address buyer;

    constructor(uint _itemId, uint _bidPrice, address _buyer) public {
        itemId = _itemId;
        bidPrice = _bidPrice;
        buyer = _buyer;
    }

    function getItemId() public view returns (uint) {
        return itemId;
    }

    function getBidPrice() public view returns (uint) {
        return bidPrice;
    }

    function getBuyer() public view returns (address) {
        return buyer;
    }

}

pragma solidity ^0.4.23;

import "./Market.sol";

contract BidManager {

    mapping(bytes32 => Bid) private bids;
    mapping(uint256 => bytes32[]) private bidIdsForItem;
    address market;
    address owner;

    struct Bid {
        uint256 itemId;
        uint bidPrice;
        address buyer;
    }

    event BidCreated(bytes32 bidId, uint256 itemId, address buyer, address seller);
    event BidAccepted(bytes32 bidId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner can execute this");
        _;
    }

    modifier onlyMarket() {
        require(msg.sender == market, "Only Market can execute this");
        _;
    }


    constructor() public {
        owner = msg.sender;
    }

    function createBid(uint256 itemId, uint bidPrice) public returns (bytes32) {
        require(bidPrice > 0, "Bid price must be greater than 0");
        require(bidPrice >= Market(market).getItemPrice(itemId), "Bid price must be at least the item asking price");
        bytes32 bidId = keccak256(abi.encodePacked(itemId, bidPrice, msg.sender));
        require(bids[bidId].bidPrice == 0, "Bid already exists");

        bids[bidId] = Bid(itemId, bidPrice, msg.sender);
        bidIdsForItem[itemId].push(bidId);
        
        emit BidCreated(bidId, itemId, msg.sender, Market(market).getItemSeller(itemId));
        return bidId;
    }

    function acceptBid(bytes32 bidId, uint256 itemId) public onlyMarket returns (uint, address) {
        require(bids[bidId].bidPrice > 0, "Bid doesn't exist");
        require(bids[bidId].itemId == itemId, "Bid itemId doesn't match provided itemId");

        uint bidPrice = bids[bidId].bidPrice;
        address buyer = bids[bidId].buyer;

        for (uint i = 0; i < bidIdsForItem[itemId].length; i++) {
            delete bids[bidIdsForItem[itemId][i]];
        }
        delete bidIdsForItem[itemId];

        emit BidAccepted(bidId);
        return (bidPrice, buyer);
    }

    function setMarket(address marketAddress) public onlyOwner {
        market = marketAddress;
    }
}
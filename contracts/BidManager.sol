pragma solidity ^0.4.23;

import "./Market.sol";

contract BidManager {

    mapping(uint256 => Bid) private bids;
    mapping(uint256 => uint256[]) private bidIdsForItem;
    address market;
    address owner;

    // change to mapping(itemid => mapping(bidId => Bid))?

    struct Bid {
        uint256 itemId;
        uint bidPrice;
        address buyer;
    }

    // add mapping(bidId -> bids) and terminate all bids when one is accepted

    event BidCreated(uint256 bidId, uint256 itemId, address buyer);
    event BidAccepted(uint256 bidId);

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

    function createBid(uint256 itemId, uint bidPrice) public returns (uint256) {
        require(bidPrice > 0, "Bid price must be greater than 0");
        require(bidPrice >= Market(market).getItemPrice(itemId), "Bid price must be at least the item asking price");
        uint256 bidId = uint256(keccak256(abi.encodePacked(itemId, bidPrice, msg.sender)));
        require(bids[bidId].bidPrice == 0, "Bid already exists");

        bids[bidId] = Bid(itemId, bidPrice, msg.sender);
        bidIdsForItem[itemId].push(bidId);
        
        emit BidCreated(bidId, itemId, msg.sender);
        return bidId;
    }

    function acceptBid(uint256 bidId, uint256 itemId) public onlyMarket returns (uint, address) {
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

    function getMarket() public view returns (address) {
        return market;
    }
}
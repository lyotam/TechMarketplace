pragma solidity ^0.4.23;


contract QTestContract {

    uint public pNum;
    Item public item;

    struct Item {
        uint pub;
        uint priv;
    }

    event AlreadyFive();
    event NotFive();


    constructor(uint _pNum) public {
        pNum = _pNum;
        item = Item(1, 2);
    }

    function getPNum() public view returns (uint) {
        return pNum;
    }

    function setPNum(uint _pNum) public returns (uint preNum) {
        preNum = pNum;
        pNum = _pNum;
        item.priv = _pNum;
    }

    function onlyFive() public {
        if (pNum == 5) {
            pNum = 25;
            emit AlreadyFive();
        }
        else {
            pNum = 10;
            emit NotFive();
        }
    }
}
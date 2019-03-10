pragma solidity ^0.4.23;

import "./Token.sol";

contract Marketplace {

    Token public cashToken;

    constructor(address cashTokenAddress) public {
        cashToken = Token(cashTokenAddress);
    }

    function getTotalSupply() public view returns (uint) {
        return cashToken.totalSupply();
    }
}
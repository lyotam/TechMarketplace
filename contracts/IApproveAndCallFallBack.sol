// ----------------------------------------------------------------------------
// Contract function to receive approval and execute function in one call
//
// Borrowed from MiniMeToken
// ----------------------------------------------------------------------------

pragma solidity ^0.4.23;

interface IApproveAndCallFallBack {
    function receiveApproval(address from, uint256 tokens, uint data) external;
}
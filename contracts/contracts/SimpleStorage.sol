// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract SimpleStorage {
    uint public v;

    function set(uint newV) external {
        v = newV;
    }

    function get() external view returns (uint) {
        return v;
    }
}

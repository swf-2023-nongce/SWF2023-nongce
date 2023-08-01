// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract MockVerifier {
    function verify(
        uint256[] memory pubInputs,
        bytes memory proof
    ) public view returns (bool) {
        return pubInputs.length % 2 == 1;
    }
}

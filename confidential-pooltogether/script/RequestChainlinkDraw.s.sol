// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RngRequestCoordinator} from "../src/reference/RngRequestCoordinator.sol";

interface Vm {
    function envAddress(string calldata name) external returns (address);
    function envUint(string calldata name) external returns (uint256);
    function startBroadcast() external;
    function stopBroadcast() external;
}

/// @notice Sends one explicitly funded RNG request through the deployed coordinator.
/// @dev Set environment variables only in the shell or CI secret store. This script
///      does not contain or print a private key.
contract RequestChainlinkDraw {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    event RequestSubmitted(address indexed coordinator, uint64 indexed drawId, uint32 requestId);

    function run() external returns (uint32 requestId) {
        address coordinatorAddress = vm.envAddress("SEPOLIA_RNG_COORDINATOR_CONTRACT");
        uint64 drawId = uint64(vm.envUint("SEPOLIA_DRAW_ID"));
        uint256 funding = vm.envUint("SEPOLIA_RNG_REQUEST_FUNDING_WEI");

        vm.startBroadcast();
        requestId = RngRequestCoordinator(payable(coordinatorAddress)).requestDraw{value: funding}(drawId);
        vm.stopBroadcast();

        emit RequestSubmitted(coordinatorAddress, drawId, requestId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RngRequestCoordinator} from "../src/reference/RngRequestCoordinator.sol";

interface Vm {
    function envAddress(string calldata name) external returns (address);
    function envUint(string calldata name) external returns (uint256);
    function startBroadcast() external;
    function stopBroadcast() external;
}

interface IConfidentialPoolRngConfig {
    function epochEnd() external view returns (uint64);
    function rngCoordinator() external view returns (address);
    function rngProvider() external view returns (address);
}

/// @notice Sends one explicitly funded RNG request through the deployed coordinator.
/// @dev Set environment variables only in the shell or CI secret store. This script
///      does not contain or print a private key.
contract RequestChainlinkDraw {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    event RequestSubmitted(address indexed coordinator, uint64 indexed drawId, uint32 requestId);

    function run() external returns (uint32 requestId) {
        address poolAddress = vm.envAddress("SEPOLIA_POOL_CONTRACT");
        address coordinatorAddress = vm.envAddress("SEPOLIA_RNG_COORDINATOR_CONTRACT");
        address expectedAdapter = vm.envAddress("SEPOLIA_RNG_ADAPTER_CONTRACT");
        uint64 drawId = uint64(vm.envUint("SEPOLIA_DRAW_ID"));
        uint256 funding = vm.envUint("SEPOLIA_RNG_REQUEST_FUNDING_WEI");

        require(poolAddress != address(0), "pool-zero");
        require(coordinatorAddress != address(0), "coordinator-zero");
        require(expectedAdapter != address(0), "adapter-zero");
        require(funding != 0, "funding-zero");

        IConfidentialPoolRngConfig pool = IConfidentialPoolRngConfig(poolAddress);
        require(block.timestamp >= pool.epochEnd(), "epoch-still-open");
        require(pool.rngCoordinator() == coordinatorAddress, "wrong-coordinator");
        require(pool.rngProvider() == expectedAdapter, "pool-adapter-mismatch");

        RngRequestCoordinator coordinator = RngRequestCoordinator(payable(coordinatorAddress));
        require(coordinator.PROVENANCE_VERSION() == 1, "wrong-provenance-version");
        require(address(coordinator.rng()) == expectedAdapter, "wrong-adapter");

        RngRequestCoordinator.DrawRequest memory existingRequest = coordinator.getDrawRequest(drawId);
        require(!existingRequest.bound, "draw-already-bound");

        vm.startBroadcast();
        requestId = coordinator.requestDraw{value: funding}(drawId);
        vm.stopBroadcast();

        emit RequestSubmitted(coordinatorAddress, drawId, requestId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRequestableRng, RngRequestCoordinator} from "../src/reference/RngRequestCoordinator.sol";

interface Vm {
    function envAddress(string calldata name) external returns (address);
    function startBroadcast() external;
    function stopBroadcast() external;
}

/// @notice Deploys the timestamp-aware coordinator against an existing RNG adapter.
/// @dev The adapter address comes from the environment and no transaction is sent
///      unless Forge is invoked with its explicit --broadcast flag.
contract DeployRngCoordinator {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    event CoordinatorDeployed(address indexed coordinator, address indexed adapter, uint256 provenanceVersion);

    function run() external returns (RngRequestCoordinator coordinator) {
        address adapterAddress = vm.envAddress("SEPOLIA_RNG_ADAPTER_CONTRACT");
        require(adapterAddress != address(0), "adapter-zero");

        vm.startBroadcast();
        coordinator = new RngRequestCoordinator(IRequestableRng(adapterAddress));
        vm.stopBroadcast();

        emit CoordinatorDeployed(address(coordinator), adapterAddress, coordinator.PROVENANCE_VERSION());
    }
}

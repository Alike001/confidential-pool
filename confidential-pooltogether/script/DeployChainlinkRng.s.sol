// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ChainlinkVrfRngAdapter} from "../src/reference/ChainlinkVrfRngAdapter.sol";
import {RngRequestCoordinator} from "../src/reference/RngRequestCoordinator.sol";
import {VRFV2PlusClient} from "../src/vendor/chainlink/VRFV2PlusClient.sol";

interface Vm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

/// @notice Deploys the RNG adapter and atomic draw coordinator for Sepolia.
/// @dev This script does not request randomness or broadcast unless invoked
///      with Foundry's explicit --broadcast flag.
contract DeployChainlinkRng {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address internal constant SEPOLIA_VRF_WRAPPER = 0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1;
    uint32 internal constant CALLBACK_GAS_LIMIT = 100_000;
    uint16 internal constant REQUEST_CONFIRMATIONS = 3;
    uint32 internal constant NUM_WORDS = 1;
    uint256 internal constant FAILURE_TIMEOUT_BLOCKS = 7_200;

    event Deployment(address indexed adapter, address indexed coordinator, address wrapper);

    function run() external returns (ChainlinkVrfRngAdapter adapter, RngRequestCoordinator coordinator) {
        bytes memory extraArgs = VRFV2PlusClient._argsToBytes(
            VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
        );

        vm.startBroadcast();
        adapter = new ChainlinkVrfRngAdapter(
            SEPOLIA_VRF_WRAPPER,
            CALLBACK_GAS_LIMIT,
            REQUEST_CONFIRMATIONS,
            NUM_WORDS,
            FAILURE_TIMEOUT_BLOCKS,
            extraArgs
        );
        coordinator = new RngRequestCoordinator(adapter);
        vm.stopBroadcast();

        emit Deployment(address(adapter), address(coordinator), SEPOLIA_VRF_WRAPPER);
    }
}

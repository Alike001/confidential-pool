// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRng} from "../src/interfaces/IRng.sol";
import {RngLifecycleAdapter} from "../src/reference/RngLifecycleAdapter.sol";

contract MockRng is IRng {
    struct State {
        uint256 requestedAt;
        bool complete;
        bool failed;
        uint256 random;
    }

    mapping(uint32 requestId => State state) private _states;

    function setRequest(uint32 requestId, uint256 requestedAt, bool complete, bool failed, uint256 random) external {
        _states[requestId] = State(requestedAt, complete, failed, random);
    }

    function requestedAtBlock(uint32 requestId) external view returns (uint256) {
        return _states[requestId].requestedAt;
    }

    function isRequestComplete(uint32 requestId) external view returns (bool) {
        return _states[requestId].complete;
    }

    function isRequestFailed(uint32 requestId) external view returns (bool) {
        return _states[requestId].failed;
    }

    function randomNumber(uint32 requestId) external view returns (uint256) {
        return _states[requestId].random;
    }
}

contract RngLifecycleAdapterTest {
    function testBindsAndPermissionlesslyFinalizesCompletedRequest() public {
        MockRng rng = new MockRng();
        RngLifecycleAdapter adapter = new RngLifecycleAdapter(rng);
        rng.setRequest(1, block.number, false, false, 0);

        adapter.bindRequest(1, 1);
        RngLifecycleAdapter.DrawRequest memory request = adapter.getRequest(1);
        require(request.bound, "request not bound");
        require(request.requestId == 1, "wrong request id");

        (bool incomplete, ) = address(adapter).call(
            abi.encodeWithSelector(adapter.finalizeDraw.selector, 1)
        );
        require(!incomplete, "incomplete request finalized");

        rng.setRequest(1, block.number, true, false, 12345);
        uint256 randomNumber = adapter.finalizeDraw(1);
        require(randomNumber == 12345, "wrong random number");

        (bool duplicate, ) = address(adapter).call(
            abi.encodeWithSelector(adapter.finalizeDraw.selector, 1)
        );
        require(!duplicate, "duplicate finalization succeeded");
    }

    function testRejectsFailedAndUnknownRequests() public {
        MockRng rng = new MockRng();
        RngLifecycleAdapter adapter = new RngLifecycleAdapter(rng);

        (bool unknown, ) = address(adapter).call(
            abi.encodeWithSelector(adapter.bindRequest.selector, 1, 99)
        );
        require(!unknown, "unknown request bound");

        rng.setRequest(2, block.number, false, true, 12345);
        adapter.bindRequest(2, 2);
        (bool failed, ) = address(adapter).call(
            abi.encodeWithSelector(adapter.finalizeDraw.selector, 2)
        );
        require(!failed, "failed request finalized");
    }

    function testRejectsZeroRandomness() public {
        MockRng rng = new MockRng();
        RngLifecycleAdapter adapter = new RngLifecycleAdapter(rng);
        rng.setRequest(1, block.number, true, false, 0);
        adapter.bindRequest(1, 1);

        (bool zeroRandom, ) = address(adapter).call(
            abi.encodeWithSelector(adapter.finalizeDraw.selector, 1)
        );
        require(!zeroRandom, "zero randomness accepted");
    }
}

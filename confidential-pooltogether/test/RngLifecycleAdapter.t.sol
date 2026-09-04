// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRng} from "../src/interfaces/IRng.sol";
import {RngLifecycleAdapter} from "../src/reference/RngLifecycleAdapter.sol";
import {
    IRequestableRng,
    RngRequestCoordinator
} from "../src/reference/RngRequestCoordinator.sol";
import {
    ChainlinkVrfRngAdapterReference,
    IChainlinkVrfWrapperLike
} from "../src/reference/ChainlinkVrfRngAdapterReference.sol";
import {ChainlinkVrfRngAdapter} from "../src/reference/ChainlinkVrfRngAdapter.sol";
import {IVRFV2PlusWrapper} from "../src/vendor/chainlink/IVRFV2PlusWrapper.sol";

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

contract RequestableMockRng is IRequestableRng {
    uint32 private _nextRequestId = 1;
    mapping(uint32 requestId => MockRng.State state) private _states;

    function requestRandom() external payable returns (uint32 requestId) {
        requestId = _nextRequestId++;
        _states[requestId] = MockRng.State(block.number, false, false, 0);
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

contract MockChainlinkVrfWrapper is IChainlinkVrfWrapperLike {
    uint256 private _nextProviderRequestId = 100;

    function requestRandomness(
        uint32,
        uint16,
        uint32,
        bytes calldata
    ) external returns (uint256 requestId, uint256 requestPrice) {
        requestId = ++_nextProviderRequestId;
        requestPrice = 1;
    }

    function fulfill(
        ChainlinkVrfRngAdapterReference adapter,
        uint256 providerRequestId,
        uint256[] calldata randomWords
    ) external {
        adapter.rawFulfillRandomWords(providerRequestId, randomWords);
    }
}

contract MockOfficialChainlinkVrfWrapper is IVRFV2PlusWrapper {
    uint256 private _nextProviderRequestId = 500;
    uint256 public lastRequestId;

    function calculateRequestPrice(uint32, uint32) external pure returns (uint256) {
        return 1;
    }

    function calculateRequestPriceNative(uint32, uint32) external pure returns (uint256) {
        return 1;
    }

    function estimateRequestPrice(uint32, uint32, uint256) external pure returns (uint256) {
        return 1;
    }

    function estimateRequestPriceNative(uint32, uint32, uint256) external pure returns (uint256) {
        return 1;
    }

    function requestRandomWordsInNative(
        uint32,
        uint16,
        uint32,
        bytes calldata
    ) external payable returns (uint256 requestId) {
        require(msg.value == 1, "wrong-price");
        requestId = ++_nextProviderRequestId;
        lastRequestId = requestId;
    }

    function link() external view returns (address) {
        return address(this);
    }

    function linkNativeFeed() external view returns (address) {
        return address(this);
    }

    function fulfill(
        ChainlinkVrfRngAdapter adapter,
        uint256 providerRequestId,
        uint256[] calldata randomWords
    ) external {
        adapter.rawFulfillRandomWords(providerRequestId, randomWords);
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

    function testRequiresSameBlockRequestBinding() public {
        MockRng rng = new MockRng();
        RngLifecycleAdapter adapter = new RngLifecycleAdapter(rng);
        uint256 staleBlock = block.number > 0 ? block.number - 1 : 0;
        rng.setRequest(1, staleBlock, false, false, 0);

        (bool stale, ) = address(adapter).call(
            abi.encodeWithSelector(adapter.bindRequest.selector, 1, 1)
        );
        require(!stale, "stale request bound");
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

    function testCoordinatorBindsProviderRequestAtomically() public {
        RequestableMockRng rng = new RequestableMockRng();
        RngRequestCoordinator coordinator = new RngRequestCoordinator(rng);

        uint32 requestId = coordinator.requestDraw(1);
        require(coordinator.PROVENANCE_VERSION() == 1, "wrong provenance version");
        RngRequestCoordinator.DrawRequest memory request = coordinator.getDrawRequest(1);
        require(request.bound, "request not bound");
        require(request.requestId == requestId, "wrong request id");
        require(request.requestedAtBlock == block.number, "wrong request block");
        require(request.requestedAtTimestamp == block.timestamp, "wrong request timestamp");
    }

    function testCoordinatorAuthenticatesOperatorAndDrawIdentity() public {
        RequestableMockRng rng = new RequestableMockRng();
        RngRequestCoordinator coordinator = new RngRequestCoordinator(rng);

        (bool zeroDraw, ) = address(coordinator).call(
            abi.encodeWithSelector(coordinator.requestDraw.selector, 0)
        );
        require(!zeroDraw, "zero draw accepted");

        (bool duplicate, ) = address(coordinator).call(
            abi.encodeWithSelector(coordinator.requestDraw.selector, 1)
        );
        require(duplicate, "coordinator self-call unexpectedly failed");
        (bool second, ) = address(coordinator).call(
            abi.encodeWithSelector(coordinator.requestDraw.selector, 1)
        );
        require(!second, "duplicate draw bound");
    }

    function testChainlinkAdapterMapsCallbackAndPreservesSameBlockBinding() public {
        MockChainlinkVrfWrapper wrapper = new MockChainlinkVrfWrapper();
        ChainlinkVrfRngAdapterReference adapter = new ChainlinkVrfRngAdapterReference(
            wrapper,
            100_000,
            3,
            1,
            20,
            hex""
        );
        RngRequestCoordinator coordinator = new RngRequestCoordinator(adapter);

        uint32 requestId = coordinator.requestDraw(1);
        require(requestId == 1, "wrong local request id");
        RngRequestCoordinator.DrawRequest memory drawRequest = coordinator.getDrawRequest(1);
        require(drawRequest.requestedAtBlock == block.number, "wrong request block");
        require(drawRequest.requestedAtTimestamp == block.timestamp, "wrong request timestamp");
        require(!adapter.isRequestComplete(requestId), "request completed early");

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 987654321;
        wrapper.fulfill(adapter, 101, randomWords);

        require(adapter.isRequestComplete(requestId), "request not completed");
        require(adapter.randomNumber(requestId) == randomWords[0], "wrong random word");
    }

    function testChainlinkAdapterRejectsUnauthorizedAndDuplicateCallbacks() public {
        MockChainlinkVrfWrapper wrapper = new MockChainlinkVrfWrapper();
        ChainlinkVrfRngAdapterReference adapter = new ChainlinkVrfRngAdapterReference(
            wrapper,
            100_000,
            3,
            1,
            20,
            hex""
        );
        adapter.requestRandom();

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 1;
        (bool unauthorized, ) = address(adapter).call(
            abi.encodeWithSelector(adapter.rawFulfillRandomWords.selector, 101, randomWords)
        );
        require(!unauthorized, "unauthorized callback accepted");

        wrapper.fulfill(adapter, 101, randomWords);
        (bool duplicate, ) = address(wrapper).call(
            abi.encodeWithSelector(wrapper.fulfill.selector, adapter, 101, randomWords)
        );
        require(!duplicate, "duplicate callback accepted");
    }

    function testOfficialChainlinkConsumerBaseMapsNativeRequestAndCallback() public {
        MockOfficialChainlinkVrfWrapper wrapper = new MockOfficialChainlinkVrfWrapper();
        ChainlinkVrfRngAdapter adapter = new ChainlinkVrfRngAdapter(
            address(wrapper),
            100_000,
            3,
            1,
            20,
            hex""
        );
        RngRequestCoordinator coordinator = new RngRequestCoordinator(adapter);

        uint32 requestId = coordinator.requestDraw{value: 1}(1);
        require(requestId == 1, "wrong local request id");
        require(adapter.requestedAtBlock(requestId) == block.number, "wrong request block");
        require(!adapter.isRequestComplete(requestId), "request completed early");

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 123456789;
        wrapper.fulfill(adapter, wrapper.lastRequestId(), randomWords);
        require(adapter.isRequestComplete(requestId), "request not completed");
        require(adapter.randomNumber(requestId) == randomWords[0], "wrong random word");
    }
}

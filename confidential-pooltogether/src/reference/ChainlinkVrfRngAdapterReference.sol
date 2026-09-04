// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRequestableRng} from "./RngRequestCoordinator.sol";

/// @notice Minimal ABI used by the earlier Chainlink-shaped adapter proof.
interface IChainlinkVrfWrapperLike {
    function requestRandomness(
        uint32 callbackGasLimit,
        uint16 requestConfirmations,
        uint32 numWords,
        bytes calldata extraArgs
    ) external returns (uint256 requestId, uint256 requestPrice);
}

/// @notice Reference adapter for request-ID translation and callback checks.
/// @dev The official integration lives in ChainlinkVrfRngAdapter.sol.
contract ChainlinkVrfRngAdapterReference is IRequestableRng {
    struct Request {
        uint256 providerRequestId;
        uint256 requestedAt;
        uint256 random;
        bool fulfilled;
    }

    IChainlinkVrfWrapperLike public immutable wrapper;
    uint32 public immutable callbackGasLimit;
    uint16 public immutable requestConfirmations;
    uint32 public immutable numWords;
    uint256 public immutable failureTimeoutBlocks;
    bytes public extraArgs;

    uint32 private _nextRequestId;
    mapping(uint32 requestId => Request request) private _requests;
    mapping(uint256 providerRequestId => uint32 requestId) private _providerToLocal;

    constructor(
        IChainlinkVrfWrapperLike wrapper_,
        uint32 callbackGasLimit_,
        uint16 requestConfirmations_,
        uint32 numWords_,
        uint256 failureTimeoutBlocks_,
        bytes memory extraArgs_
    ) {
        require(address(wrapper_) != address(0), "wrapper-zero");
        require(numWords_ > 0, "num-words-zero");
        require(failureTimeoutBlocks_ > 0, "timeout-zero");
        wrapper = wrapper_;
        callbackGasLimit = callbackGasLimit_;
        requestConfirmations = requestConfirmations_;
        numWords = numWords_;
        failureTimeoutBlocks = failureTimeoutBlocks_;
        extraArgs = extraArgs_;
    }

    function requestRandom() external payable returns (uint32 requestId) {
        requestId = ++_nextRequestId;
        (uint256 providerRequestId, ) = wrapper.requestRandomness(
            callbackGasLimit,
            requestConfirmations,
            numWords,
            extraArgs
        );
        require(providerRequestId != 0, "provider-request-zero");
        require(_providerToLocal[providerRequestId] == 0, "provider-request-reused");

        _requests[requestId] = Request({
            providerRequestId: providerRequestId,
            requestedAt: block.number,
            random: 0,
            fulfilled: false
        });
        _providerToLocal[providerRequestId] = requestId;
    }

    function rawFulfillRandomWords(uint256 providerRequestId, uint256[] calldata randomWords) external {
        require(msg.sender == address(wrapper), "not-wrapper");
        uint32 requestId = _providerToLocal[providerRequestId];
        require(requestId != 0, "unknown-provider-request");
        require(!_requests[requestId].fulfilled, "request-fulfilled");
        require(randomWords.length >= numWords, "not-enough-words");
        require(randomWords[0] != 0, "random-zero");

        _requests[requestId].random = randomWords[0];
        _requests[requestId].fulfilled = true;
    }

    function requestedAtBlock(uint32 requestId) external view returns (uint256) {
        return _requests[requestId].requestedAt;
    }

    function isRequestComplete(uint32 requestId) external view returns (bool) {
        return _requests[requestId].fulfilled;
    }

    function isRequestFailed(uint32 requestId) external view returns (bool) {
        Request memory request = _requests[requestId];
        return request.requestedAt != 0 && !request.fulfilled && block.number > request.requestedAt + failureTimeoutBlocks;
    }

    function randomNumber(uint32 requestId) external view returns (uint256) {
        Request memory request = _requests[requestId];
        require(request.fulfilled, "rng-request-incomplete");
        return request.random;
    }
}

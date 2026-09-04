// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRng} from "../interfaces/IRng.sol";

/// @notice Small reference adapter for the PoolTogether V5 IRng lifecycle.
/// @dev This is intentionally separate from the FHEVM slice. It proves the
///      provider boundary without selecting a particular oracle or chain.
contract RngLifecycleAdapter {
    IRng public immutable rng;
    address public immutable coordinator;

    struct DrawRequest {
        uint32 requestId;
        uint256 requestedAtBlock;
        bool bound;
        bool finalized;
    }

    mapping(uint64 drawId => DrawRequest request) private _requests;

    event RngRequestBound(uint64 indexed drawId, uint32 indexed requestId, uint256 requestedAtBlock);
    event DrawRandomnessFinalized(uint64 indexed drawId, uint32 indexed requestId, uint256 randomNumber);

    constructor(IRng rng_) {
        require(address(rng_) != address(0), "rng-zero");
        rng = rng_;
        coordinator = msg.sender;
    }

    /// @notice Binds one provider request to one draw exactly once.
    /// @dev The provider request must already exist. A production wrapper may
    ///      combine provider request creation and this binding in one transaction
    ///      when the provider requires V5's same-block rule.
    function bindRequest(uint64 drawId, uint32 requestId) external {
        require(msg.sender == coordinator, "not-coordinator");
        require(drawId != 0, "draw-id-zero");
        DrawRequest storage drawRequest = _requests[drawId];
        require(!drawRequest.bound, "request-bound");

        uint256 requestedAtBlock = rng.requestedAtBlock(requestId);
        require(requestedAtBlock != 0 && requestedAtBlock <= block.number, "unknown-rng-request");

        drawRequest.requestId = requestId;
        drawRequest.requestedAtBlock = requestedAtBlock;
        drawRequest.bound = true;
        emit RngRequestBound(drawId, requestId, requestedAtBlock);
    }

    /// @notice Finalizes a completed request; anyone may call this keeper action.
    function finalizeDraw(uint64 drawId) external returns (uint256 randomNumber) {
        DrawRequest storage drawRequest = _requests[drawId];
        require(drawRequest.bound, "request-not-bound");
        require(!drawRequest.finalized, "draw-finalized");
        require(!rng.isRequestFailed(drawRequest.requestId), "rng-request-failed");
        require(rng.isRequestComplete(drawRequest.requestId), "rng-request-incomplete");

        randomNumber = rng.randomNumber(drawRequest.requestId);
        require(randomNumber != 0, "random-zero");
        drawRequest.finalized = true;
        emit DrawRandomnessFinalized(drawId, drawRequest.requestId, randomNumber);
    }

    function getRequest(uint64 drawId) external view returns (DrawRequest memory) {
        return _requests[drawId];
    }
}

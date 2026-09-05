// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRng} from "../interfaces/IRng.sol";

/// @notice Extension required by a provider adapter that creates requests itself.
interface IRequestableRng is IRng {
    function requestRandom() external payable returns (uint32 requestId);
}

/// @notice Minimal proof of atomic provider-request and draw binding.
/// @dev This is a reference seam, not a PoolTogether replacement. A production
///      coordinator would also carry epoch state, retry policy, keeper rewards,
///      and the confidential pool's draw commitment.
contract RngRequestCoordinator {
    uint256 public constant PROVENANCE_VERSION = 1;
    IRequestableRng public immutable rng;
    address public immutable operator;

    struct DrawRequest {
        uint32 requestId;
        uint256 requestedAtBlock;
        uint256 requestedAtTimestamp;
        bool bound;
    }

    mapping(uint64 drawId => DrawRequest request) private _drawRequests;

    event DrawRngRequested(
        uint64 indexed drawId,
        uint32 indexed requestId,
        uint256 requestedAtBlock,
        uint256 requestedAtTimestamp
    );
    event RngRefundWithdrawn(address indexed recipient, uint256 amount);

    constructor(IRequestableRng rng_) {
        require(address(rng_) != address(0), "rng-zero");
        rng = rng_;
        operator = msg.sender;
    }

    /// @notice Creates and binds one provider request atomically.
    function requestDraw(uint64 drawId) external payable returns (uint32 requestId) {
        require(msg.sender == operator, "not-operator");
        require(drawId != 0, "draw-id-zero");
        require(!_drawRequests[drawId].bound, "draw-bound");

        requestId = rng.requestRandom{value: msg.value}();
        uint256 requestedAtBlock = rng.requestedAtBlock(requestId);
        require(requestedAtBlock == block.number, "rng-not-same-block");

        _drawRequests[drawId] = DrawRequest({
            requestId: requestId,
            requestedAtBlock: requestedAtBlock,
            requestedAtTimestamp: block.timestamp,
            bound: true
        });
        emit DrawRngRequested(drawId, requestId, requestedAtBlock, block.timestamp);
    }

    function getDrawRequest(uint64 drawId) external view returns (DrawRequest memory) {
        return _drawRequests[drawId];
    }

    /// @notice Recovers provider overpayment refunds received by this coordinator.
    function withdrawRefund(address payable recipient) external {
        require(msg.sender == operator, "not-operator");
        require(recipient != address(0), "recipient-zero");
        uint256 amount = address(this).balance;
        require(amount != 0, "refund-zero");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "refund-withdraw-failed");
        emit RngRefundWithdrawn(recipient, amount);
    }

    /// @dev Allows the provider adapter to refund an overpayment after a request.
    receive() external payable {}
}

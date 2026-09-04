// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice PoolTogether-compatible randomness provider boundary.
/// @dev This mirrors the V5 DrawManager interface. Request creation, funding,
///      completion, and retry policy remain provider/keeper concerns.
interface IRng {
    /// @notice Returns the block in which a request was created.
    function requestedAtBlock(uint32 requestId) external returns (uint256);

    /// @notice Returns whether a request has completed successfully.
    function isRequestComplete(uint32 requestId) external view returns (bool);

    /// @notice Returns whether the provider marked a request as failed.
    function isRequestFailed(uint32 requestId) external view returns (bool);

    /// @notice Returns the finalized random value for a completed request.
    function randomNumber(uint32 requestId) external returns (uint256);
}

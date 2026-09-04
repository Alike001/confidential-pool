// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;

/// @notice Public, independently reproducible randomness helpers for the bounded build.
/// @dev The reduction mirrors PoolTogether V5's UniformRandomNumber library. The caller may
///      use the result as the public input to an encrypted winner comparison, but the entropy
///      transcript itself remains independently checkable onchain.
library DrawTranscript {
    error UpperBoundZero();

    function userSpecificRandom(
        uint64 drawId,
        address vault,
        address user,
        uint8 tier,
        uint32 prizeIndex,
        uint256 drawRandomNumber
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encode(drawId, vault, user, tier, prizeIndex, drawRandomNumber)));
    }

    function uniform(uint256 entropy, uint256 upperBound) internal pure returns (uint256) {
        if (upperBound == 0) revert UpperBoundZero();

        uint256 min = (type(uint256).max - upperBound + 1) % upperBound;
        uint256 random = entropy;
        while (random < min) {
            random = uint256(keccak256(abi.encodePacked(random)));
        }
        return random % upperBound;
    }
}

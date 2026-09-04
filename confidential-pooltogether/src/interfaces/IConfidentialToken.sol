// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.24;

/// @notice Version-neutral boundary for the ERC-7984 adapter.
/// @dev `bytes32` represents FHEVM handles here. The concrete adapter must bind these methods
///      to the target token's `euint64`/`externalEuint64` ABI and preserve ACL authorization.
interface IConfidentialToken {
    function confidentialTransfer(address to, bytes32 encryptedAmount, bytes calldata inputProof)
        external
        returns (bytes32 transferred);

    function confidentialTransfer(address to, bytes32 amount) external returns (bytes32 transferred);

    function confidentialTransferFrom(
        address from,
        address to,
        bytes32 encryptedAmount,
        bytes calldata inputProof
    ) external returns (bytes32 transferred);

    function confidentialBalanceOf(address account) external view returns (bytes32);
}

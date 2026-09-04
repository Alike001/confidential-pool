// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @notice Contract boundary for the bounded confidential PoolTogether build.
/// @dev `bytes32` handles keep this interface independent from a particular FHEVM package version.
///      The implementation adapter will bind them to the selected external encrypted types.
interface IConfidentialPrizePool {
    struct DrawCommitment {
        uint64 drawId;
        uint128 aggregateSupply;
        uint128 vaultContributionFraction;
        uint128 tierOdds;
        bytes32 randomCommitment;
        bytes32 encryptedPrize;
    }

    event EncryptedDeposit(address indexed account);
    event EncryptedWithdrawalRequested(address indexed account);
    event EncryptedClaimRequested(address indexed account, uint64 indexed drawId, uint8 tier, uint32 prizeIndex);
    event DrawCommitted(uint64 indexed drawId, bytes32 randomCommitment);
    event DrawOpened(uint64 indexed drawId, uint128 aggregateSupply, bytes32 randomNumber);

    function deposit(bytes32 encryptedAmount, bytes calldata inputProof) external;

    function requestWithdrawal(bytes32 encryptedAmount, bytes calldata inputProof) external;

    function commitDraw(DrawCommitment calldata snapshot, bytes calldata inputProof) external;

    function revealDraw(uint64 drawId, uint256 drawRandomNumber, bytes32 salt) external;

    function claimPrize(
        uint64 drawId,
        uint8 tier,
        uint32 prizeIndex,
        bytes32 encryptedPrize,
        bytes calldata inputProof
    ) external;

    function encryptedBalance(address account) external view returns (bytes32);

    function encryptedClaimablePrize(address account, uint64 drawId, uint8 tier, uint32 prizeIndex)
        external
        view
        returns (bytes32);

    function claimed(address account, uint64 drawId, uint8 tier, uint32 prizeIndex) external view returns (bool);
}

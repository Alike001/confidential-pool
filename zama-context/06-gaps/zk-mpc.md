# ZK–MPC boundary for randomness and decryption

## Challenge question

Do we need MPC for draw randomness, threshold decryption, or recovery, and what does it add beyond the Zama Protocol's existing machinery?

## Possible roles

- generate or combine randomness so no single actor controls the draw;
- keep decryption authority distributed;
- create or manage CRS material for ZK proofs;
- provide recovery when one service is unavailable.

## Evidence observed

The KMS research identifies threshold MPC and distributed CRS setup for ZK proofs. The FHEVM workspace separately contains proof workers and KMS connector/decryption workflows. PoolTogether V5 also has a separate RNG and Draw Manager lifecycle.

## Questions specific to this bounty

- Is PoolTogether's RNG source sufficient, or does confidential winner selection need another randomness ceremony?
- Which values can safely be public randomness, and which must be encrypted before use?
- Who can authorize decryption of a winner's prize?
- Does threshold decryption protect against one KMS operator, or is the protocol configuration still the dominant trust assumption?
- What failure state appears onchain if the MPC/KMS threshold is not reached?

## Research boundary

MPC is currently an adjacent mechanism to investigate, not an assumption that must be added to the first implementation.

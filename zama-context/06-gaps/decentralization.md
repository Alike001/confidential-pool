# Decentralization gaps for confidential prize savings

## Challenge question

Can a draw remain fair and a winner claim remain possible if the party operating randomness, FHE execution, relaying, or decryption is unavailable or malicious?

## Boundaries to trace

- who can start and finish a draw;
- who supplies or selects randomness;
- who can cause encrypted computation to run;
- who can request public decryption;
- who can receive user-decryption responses;
- whether the Prize Vault or prize contract has admin-controlled configuration;
- whether a claimer can learn more than the winner.

## Evidence observed

The Zama research already identifies registered coprocessor/KMS signers, thresholds, Gateway configuration, and operator tooling. The PoolTogether V5 source uses a Draw Manager/RNG boundary and a configured Claimer boundary. These two trust graphs must be combined rather than documented separately.

## Questions

- Can any actor complete a draw without a Zama-controlled account?
- Is liveness guaranteed if the preferred RNG or relayer fails?
- Can an operator censor one participant's encrypted state?
- Which state transitions are enforced by onchain ACL and which depend on offchain services?
- What is the recovery path for KMS/coprocessor downtime?

## Not concluded

This page does not label either system centralized or decentralized. It records the exact authorities and failure assumptions that the combined design must disclose.

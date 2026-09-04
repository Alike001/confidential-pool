# Repository: kms

## Role

Key Management System for the Zama Protocol.

## Observed capabilities

The README describes threshold key generation, threshold decryption, key-share resharing, and distributed CRS setup for ZK proofs. It separates a core cryptography/MPC layer from a service layer and supports gRPC interaction and FHEVM integration.

## Relationship to FHEVM

FHEVM’s KMS Connector is the event/transport/orchestration boundary; the `kms` repository contains the KMS implementation it calls.

## Sources

- [`kms`](https://github.com/zama-ai/kms)
- [`threshold-fhe`](https://github.com/zama-ai/threshold-fhe)

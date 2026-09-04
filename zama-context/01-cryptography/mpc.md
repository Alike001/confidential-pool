# Multi-party computation (MPC)

## Scope

Understand why Zama uses MPC and how it differs from FHE.

## Sources

- [Zama Litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- [`kms` README](https://github.com/zama-ai/kms)
- [`threshold-fhe` README](https://github.com/zama-ai/threshold-fhe)

## Verified facts

Zama’s KMS uses threshold MPC for distributed FHE key generation and threshold decryption. The KMS README describes a maliciously secure and robust MPC protocol using secret sharing. Its features include threshold key generation, threshold decryption, key-share resharing, and distributed CRS setup for ZK proofs.

## Layman model

Instead of giving one person the entire master key, the key is split among several people. A threshold number of them must cooperate before decryption can happen.

## Inferences

MPC protects the decryption authority and key lifecycle; it is not the primary mechanism used to perform every application computation. Zama’s architecture uses FHE for computation and MPC mainly around keys/decryption.

## Unknowns

- Current deployment thresholds and failure assumptions.
- Which hardware or enclave assumptions are active in each environment.
- How context/epoch rotation affects key-share availability and recovery.

## Not included

No cryptographic audit of the KMS or threshold protocol.

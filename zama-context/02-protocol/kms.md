# Key Management Service (KMS)

## Verified facts

The protocol KMS is a threshold-MPC system for FHE key generation, key-share management, CRS generation, and threshold decryption. In FHEVM, `kms-connector` is the bridge to KMS Core rather than the cryptographic implementation itself.

The connector has three main components:

- `GatewayListener` writes Gateway events to Postgres.
- `KmsWorker` picks persisted requests and calls KMS Core over gRPC.
- `TransactionSender` publishes KMS responses back to Gateway or Ethereum.

Evidence: `fhevm/kms-connector/docs/architecture.md:1-75`.

The connector uses durable tables, notification channels, event locks, retries, polling, block catch-up, ciphertext retrieval, ACL checks, and context/epoch processing: `fhevm/kms-connector/docs/architecture.md:103-211`.

## Transitional evidence

KMS-generation request processing and contract placement have evolved. The Gateway-side `KMSGeneration.sol` is now historical/view-only, while current key/CRS operations are routed through Ethereum-side configuration and KMS Connector processors.

## Unknowns

- Current threshold and operator set.
- Exact KMS Core API and deployment security assumptions in production.
- Recovery guarantees during context/epoch rotation.

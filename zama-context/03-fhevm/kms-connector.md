# FHEVM KMS Connector

## Verified facts

`kms-connector` bridges Gateway/Ethereum events to KMS Core and publishes responses. It is divided into `gw-listener`, `kms-worker`, and `tx-sender` crates, supported by API, endpoint, proxy, configuration, database migrations, and monitoring code.

The documented flow is:

```text
Gateway event → GatewayListener → Postgres
Postgres → KmsWorker → KMS Core over gRPC
KMS response → Postgres → TransactionSender → Gateway/Ethereum
```

The connector implements duplicate-safe persistence, work locks, retries, polling after missed notifications, block catch-up, ACL checks, ciphertext retrieval, decryption processing, and key/CRS/context processing.

## Evidence

- Architecture: `fhevm/kms-connector/docs/architecture.md:1-75`, `103-211`.
- Decryption processor: `fhevm/kms-connector/crates/kms-worker/src/core/event_processor/decryption.rs:35-200`.
- KMS-generation processor: `fhevm/kms-connector/crates/kms-worker/src/core/event_processor/kms.rs:14-111`.
- Transaction sender: `fhevm/kms-connector/crates/tx-sender/src/core/tx_sender.rs:161-220`.

## Inference

This connector is a major reliability boundary: it turns asynchronous protocol events into durable KMS work and eventually into on-chain responses.

## Unknowns

- Operational failure rates and queue depth under load.
- Production storage/attestation layout for ciphertext material.
- Current KMS context and epoch rotation procedure.

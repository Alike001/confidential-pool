# FHEVM coprocessor

## Verified facts

The coprocessor workspace contains separate services for reading host/Gateway events, persisting work, verifying ZK proofs, executing TFHE operations, scheduling dependency graphs, monitoring consensus/drift, and submitting transactions.

The core runtime uses Postgres queues and notifications. The TFHE worker reconstructs transaction dependencies and distinguishes local dependencies from boundary ciphertexts. It includes fast/slow scheduling paths, retryable execution-panic handling, terminal error handling, and database locks.

## Evidence

- Workspace: `fhevm/coprocessor/fhevm-engine/Cargo.toml:1-15`.
- Ingestion: `fhevm/coprocessor/fhevm-engine/host-listener/src/database/ingest.rs:68-160`.
- Scheduler/worker state: `fhevm/coprocessor/fhevm-engine/tfhe-worker/src/tfhe_worker.rs:33-115`, `926-1030`.
- Proof worker: `fhevm/coprocessor/fhevm-engine/zkproof-worker/src/verifier.rs:179-253`.
- Transaction publication: `fhevm/coprocessor/fhevm-engine/transaction-sender/src/transaction_sender.rs:31-63`.

## Inferences

The coprocessor’s infrastructure problem includes orchestration and durable execution semantics as much as cryptographic computation.

## Unknowns

- Throughput and latency by worker type.
- Failure behavior when database state and chain state diverge beyond the tested recovery paths.
- Current deployment topology and operator observability.

# Coprocessor

## Verified facts

The coprocessor is a Rust workspace, not a single executable. Its crates include `host-listener`, `gw-listener`, `tfhe-worker`, `zkproof-worker`, `transaction-sender`, `scheduler`, `consensus-detector`, and shared services.

Observed responsibilities:

- `host-listener` reads host-chain logs, reconstructs operation/dependency information, and writes work to Postgres.
- `gw-listener` reads Gateway events and stores proof/ciphertext/configuration work.
- `tfhe-worker` schedules and executes FHE operations from persisted work.
- `zkproof-worker` verifies input proofs from a database queue.
- `transaction-sender` submits proof-verification and ciphertext-commit responses.

## Evidence

- Workspace members: `fhevm/coprocessor/fhevm-engine/Cargo.toml:1-15`.
- Host ingestion and operand-boundary reconstruction: `fhevm/coprocessor/fhevm-engine/host-listener/src/database/ingest.rs:68-160`.
- Gateway event loop: `fhevm/coprocessor/fhevm-engine/gw-listener/src/gw_listener.rs:212-279`.
- TFHE worker cycle: `fhevm/coprocessor/fhevm-engine/tfhe-worker/src/tfhe_worker.rs:926-1030`.
- ZK proof workers: `fhevm/coprocessor/fhevm-engine/zkproof-worker/src/verifier.rs:179-253`.

## Inferences

The hardest part of the coprocessor is not only FHE arithmetic. It is also dependency reconstruction, durable scheduling, block/reorg handling, retries, error classification, and response publication.

## Unknowns

- Measured bottleneck among FHE, ZK, database, RPC, and transaction publication.
- Actual operator deployment topology.
- Which scheduler modes are used in production.

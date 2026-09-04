# Reality Research: FHEVM code versus the Zama Litepaper

## Scope

Reverse-engineer the current public `zama-ai/fhevm` repository from the bottom upward, beginning with `host-contracts`, `gateway-contracts`, the Rust coprocessor workspace, and `kms-connector`. Compare observed code responsibilities with the [Zama Protocol Litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper). This report records reality and pressure points; it does not propose a design or fix.

## Sources Checked

- Local shallow checkout: [`fhevm/`](./fhevm/), commit `75eedbfe06ea6f009db5972a5e26910d00872484`, fetched 2026-09-03.
- [Zama Protocol Litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- [FHE on Blockchain documentation](https://docs.zama.org/protocol/protocol)
- Local source files listed in the findings below.

## Verified Facts

### 1. Host contracts: symbolic execution and permissions are on-chain

The host side is not a normal Solidity implementation of FHE arithmetic. `FHEVMExecutor` exposes FHE operations such as addition, subtraction, comparisons, conditional selection, random generation, sums, membership checks, and multiplication/division. It validates handle types and ACL usage, derives a deterministic result handle, and emits an event for off-chain processing.

Evidence:

- `FHEVMExecutor` describes itself as implementing symbolic execution and deterministic ciphertext-handle generation: `host-contracts/contracts/FHEVMExecutor.sol:27-31`.
- `fheAdd` validates inputs, checks HCU limits, and emits `FheAdd`: `host-contracts/contracts/FHEVMExecutor.sol:198-214`.
- `_binaryOp` hashes the operation, operands, boundary bits, ACL address, chain ID, recent block hash, and timestamp, then mints the result handle: `host-contracts/contracts/FHEVMExecutor.sol:1078-1108`.
- `verifyInput` delegates input validation to `InputVerifier`, adds a transient ACL permission, and emits `VerifyInput`: `host-contracts/contracts/FHEVMExecutor.sol:849-867`.

The ACL is a real permission system rather than a documentation concept. It supports persistent use permissions, transient permissions, decryption permissions, and delegated user decryption:

- `ACL.allow` stores persistent `(handle, account)` permission: `host-contracts/contracts/ACL.sol:230-240`.
- `ACL.allowForDecryption` marks handles eligible for decryption: `host-contracts/contracts/ACL.sol:242-267`.
- `ACL.isAllowed` combines transient and persistent permissions: `host-contracts/contracts/ACL.sol:515-517`.
- Delegated decryption requires both persistent permissions and an active delegation: `host-contracts/contracts/ACL.sol:529-554`.

### 2. Host input verification uses coprocessor-signed results

The host `InputVerifier` is responsible for checking the input handle format, chain ID, proof payload structure, handle version, and EIP-712 signatures. The input proof contains handles and coprocessor signatures. It verifies that the returned input handle matches the handle listed in the proof and caches accepted proofs.

Evidence: `host-contracts/contracts/InputVerifier.sol:244-333`.

This is an important separation from the simple diagram: the host chain does not appear to perform the full ZK proof computation itself. The host contract verifies a coprocessor-backed result, while the coprocessor stack has a dedicated `zkproof-worker`.

### 3. Gateway contracts are several coordination contracts, not one Gateway contract

The `gateway-contracts/contracts/` directory separates protocol coordination into:

- `InputVerification.sol` — accepts proof-verification requests, charges a fee, receives coprocessor responses, and reaches consensus over matching signed responses.
- `Decryption.sol` — accepts public or user decryption requests, validates access/conformance, receives KMS responses, and reaches consensus over decryption results or user shares.
- `CiphertextCommits.sol` — receives ciphertext metadata/digests and only finalizes material after the configured coprocessor majority agrees on the same data.
- `GatewayConfig.sol` — configuration and registered operators/host chains.
- `ProtocolPayment.sol` — protocol fee accounting.
- `KMSGeneration.sol` — currently a view-only historical contract on the Gateway side; its comments say fresh deployments are no longer supported there because current KMS generation lives on Ethereum: `gateway-contracts/contracts/KMSGeneration.sol:12-18`, `107-123`.

Evidence for response consensus:

- Input verification stores request data, charges the sender, and emits `VerifyProofRequest`: `gateway-contracts/contracts/InputVerification.sol:184-213`.
- Coprocessor responses are checked against registered signers, deduplicated, stored by digest, and finalized once the configured threshold is reached: `gateway-contracts/contracts/InputVerification.sol:223-292`.
- Ciphertext material follows the same majority pattern: `gateway-contracts/contracts/CiphertextCommits.sol:123-190`, with threshold lookup at `:317-325`.
- Public decryption retrieves committed ciphertext material, pins a KMS context, charges a fee, and emits a request: `gateway-contracts/contracts/Decryption.sol:332-383`.
- Public decryption responses are grouped by digest and finalized after the relevant KMS consensus threshold: `gateway-contracts/contracts/Decryption.sol:390-458`.

### 4. The “coprocessor” is a multi-service Rust workspace

`coprocessor/fhevm-engine/Cargo.toml` defines a workspace with these crates:

- `host-listener`
- `gw-listener`
- `tfhe-worker`
- `zkproof-worker`
- `transaction-sender`
- `sns-worker`
- `fhevm-engine-common`
- `scheduler`
- `consensus-detector`
- `upgrade-controller`
- test and stress-test harnesses

The coprocessor README identifies two high-level services—an Executor and a Coprocessor—but the source tree implements the work as multiple independently runnable services.

Observed responsibilities:

- `host-listener` consumes host-chain logs, reconstructs operation/dependency information, persists work, and derives authoritative operand-boundary masks: `coprocessor/fhevm-engine/host-listener/src/database/ingest.rs:68-160`.
- `gw-listener` polls Gateway logs and persists proof requests, proof responses, ciphertext-commit events, and Gateway configuration events: `coprocessor/fhevm-engine/gw-listener/src/gw_listener.rs:212-279`.
- `tfhe-worker` loads work from Postgres, manages dependence chains, and executes FHE operations in worker cycles: `coprocessor/fhevm-engine/tfhe-worker/src/tfhe_worker.rs:926-1030`.
- The TFHE worker has explicit scheduling concepts such as transaction-local versus boundary dependencies, slow lanes, retries, error stamps, and dependency-chain locking: `coprocessor/fhevm-engine/tfhe-worker/src/tfhe_worker.rs:33-115`.
- `zkproof-worker` reads verification requests from Postgres, loads keys/CRS, and runs multiple proof workers over the `verify_proof` queue: `coprocessor/fhevm-engine/zkproof-worker/src/verifier.rs:179-253`.
- `transaction-sender` owns on-chain submission operations for proof verification and ciphertext commits: `coprocessor/fhevm-engine/transaction-sender/src/transaction_sender.rs:31-63`.

### 5. KMS connector is a durable asynchronous bridge

`kms-connector` is not the KMS cryptographic implementation itself. It is an operational bridge between Gateway events, a Postgres queue, KMS Core over gRPC, and response transactions.

Its own architecture document defines three components:

- `GatewayListener` reads Gateway events and writes them to Postgres.
- `KmsWorker` picks events, calls KMS Core, and stores responses.
- `TransactionSender` picks responses and submits them back to Gateway or Ethereum.

Evidence: `kms-connector/docs/architecture.md:1-75`.

The connector explicitly implements duplicate-safe inserts, event locks, retry/unlock behavior, response deletion after successful submission, block-based catch-up, and polling after missed database notifications: `kms-connector/docs/architecture.md:103-211`.

The KMS connector’s code has separate processors for decryption, key generation/CRS generation, protocol configuration, and ciphertext retrieval/validation:

- `kms-connector/crates/kms-worker/src/core/event_processor/decryption.rs:35-200`
- `kms-connector/crates/kms-worker/src/core/event_processor/kms.rs:14-111`
- `kms-connector/crates/kms-worker/src/core/event_processor/ciphertext/manager.rs:30-80`
- `kms-connector/crates/tx-sender/src/core/tx_sender.rs:161-220`

### 6. The cryptographic engine is adjacent to FHEVM, not contained entirely inside it

The FHEVM coprocessor workspace depends on the `tfhe` and `tfhe-zk-pok` crates. The organization’s separate [`tfhe-rs`](https://github.com/zama-ai/tfhe-rs) repository is the low-level TFHE implementation, while [`kms`](https://github.com/zama-ai/kms) contains the KMS implementation.

The FHEVM workspace manifest records the cryptographic dependencies and enables Boolean, short-integer, integer, and ZK-PoK features: `coprocessor/fhevm-engine/Cargo.toml:19-28`, `coprocessor/fhevm-engine/Cargo.toml:65-70`.

## Code-versus-litepaper comparison

| Litepaper claim | What the code shows |
|---|---|
| Host chains symbolically execute FHE | `FHEVMExecutor` derives handles and emits operation events; it does not perform ciphertext arithmetic in Solidity. |
| Coprocessors verify inputs and compute FHE | Responsibilities are split among `gw-listener`, `zkproof-worker`, `host-listener`, `tfhe-worker`, and `transaction-sender`. |
| Gateway coordinates the protocol | Gateway functionality is split into several upgradeable Solidity contracts plus off-chain listeners and senders. |
| KMS performs secure threshold decryption | `kms-connector` validates ACL/context, calls KMS Core, persists responses, and submits consensus responses; cryptographic KMS code lives in the separate `kms` repository. |
| Results are publicly verifiable/consensus-backed | Gateway contracts collect coprocessor/KMS signatures and finalize matching digests after configured thresholds. |
| Protocol supports multi-chain operation | Handles encode chain information; listeners maintain host-chain configuration and decryption processing across configured chains. |

## Solved, partially solved, and real problem areas

These labels describe the evidence observed in the code, not a product recommendation.

### Already implemented in the inspected repository

- Solidity-facing encrypted types and a broad FHE operation surface.
- Deterministic symbolic handles and event-based off-chain execution.
- On-chain ACL and programmable decryption permissions.
- Coprocessor-signed input verification and ciphertext material consensus.
- KMS response consensus and separate public/user decryption paths.
- Durable Postgres-backed event processing with retries, catch-up, and health/metrics surfaces.
- Test suites, local mocks, Docker/Helm deployment assets, and stress-test infrastructure.

### Clearly transitional or only partially settled in the inspected code

- `KMSGeneration` has moved operationally from the Gateway side to Ethereum; the Gateway contract remains for historical reads.
- Legacy decryption request paths remain in `Decryption.sol` for the relayer-SDK deprecation window: `gateway-contracts/contracts/Decryption.sol:461-470`.
- The system has compatibility paths for pre/post ciphertext formats and multiple stack-version/cutover modes (`gcs_mode`), increasing the number of active protocol states.
- The coprocessor worker contains explicit legacy-row fallbacks and comments describing retryable versus terminal errors, indicating that database and execution semantics have evolved over time.
- The codebase contains a dedicated consensus detector, drift detection, reorg handling, and replay/catch-up logic; these are operationally necessary but add substantial system complexity.

### Real infrastructure problems exposed by the implementation

- **Reliable event-to-result delivery:** correctness depends on not losing, duplicating, or misordering events across blockchains, Postgres, workers, KMS Core, and transaction submission.
- **Reorg and replay correctness:** listeners must reconstruct state after downtime or chain reorganization while avoiding duplicate protocol responses.
- **Dependency scheduling:** FHE operations form transaction and cross-operation dependency graphs; the worker must distinguish local dependencies from ciphertexts already materialized in storage.
- **Ciphertext material availability:** decryption requires committed ciphertext metadata/digests, ACL checks, key/context selection, and retrieval of ciphertext material before KMS work can succeed.
- **Key/context lifecycle:** key generation, CRS generation, epochs, contexts, resharing, expiry, and migration must stay aligned across Gateway, Ethereum, KMS Core, and workers.
- **Consensus and operator drift:** multiple coprocessors/KMS nodes must agree on signed results, while listeners monitor registered senders and detect inconsistent behavior.
- **Performance and backpressure:** FHE execution, proof verification, database queues, transaction sending, and multi-chain polling have different throughput and latency profiles.
- **Upgrade compatibility:** UUPS contracts, versioned handles, legacy request paths, dual event emissions, and stack cutovers create compatibility obligations for clients and operators.

## Inferences

- The highest-value infrastructure opportunities are likely to be at the boundaries between components rather than in another application contract; the repository’s complexity is concentrated in orchestration, durability, scheduling, and lifecycle coordination.
- “Coprocessor” is a conceptual role in the litepaper but a distributed production system in code.
- ZK is important in the input-verification path, but FHE execution and ciphertext lifecycle remain the dominant runtime concerns in the inspected repository.

## Unknowns And Questions

- What exact threat model and trust assumptions are enforced by each current deployment mode?
- Which components are independently operated by external operators versus packaged and managed by Zama?
- What are the measured bottlenecks under production workloads: TFHE compute, ZK proof verification, Postgres, RPC providers, ciphertext storage, KMS, or transaction submission?
- Which compatibility paths are scheduled for removal, and which are permanent protocol guarantees?
- What are the current production configurations for coprocessor/KMS thresholds, key contexts, and chain registration?

## Not Included

- No code changes were made inside the `fhevm` checkout.
- No claim that an observed complexity is a vulnerability.
- No implementation proposal or product selection.
- No cryptographic, smart-contract, or operational security audit.

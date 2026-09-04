# Protocol architecture

## Scope

Map the protocol components described by the litepaper to the code and services observed in FHEVM.

## Sources

- [FHE on Blockchain documentation](https://docs.zama.org/protocol/protocol)
- [Zama Litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- [`fhevm` local checkout](../fhevm/)

## Verified facts

The protocol is organized around host chains, Gateway contracts, coprocessors, a KMS, and client/relayer services. The implementation does not contain one monolithic Gateway or Coprocessor: each is split across several contracts, Rust crates, databases, listeners, and transaction senders.

The local FHEVM workspace includes:

- Solidity host contracts and libraries.
- Solidity Gateway contracts.
- Rust host listener, Gateway listener, TFHE worker, ZK-proof worker, transaction sender, scheduler, consensus detector, and upgrade controller.
- KMS Connector crates and database migrations.

## Inference

The litepaper diagram is a conceptual dataflow. The code reveals a distributed asynchronous system whose important boundaries are events, handles, signatures, Postgres queues, ciphertext material, key contexts, and on-chain response transactions.

## Unknowns

- Exact production topology and deployment ownership.
- Whether every code path in the checkout is active in the current mainnet configuration.
- End-to-end latency and failure budgets.

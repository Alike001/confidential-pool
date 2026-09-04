# Zero-knowledge proofs (ZK)

## Scope

Understand what ZK does inside the Zama stack and what it does not do.

## Sources

- [Zama Litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- [`fhevm` host `InputVerifier`](../fhevm/host-contracts/contracts/InputVerifier.sol)
- [`fhevm` `zkproof-worker`](../fhevm/coprocessor/fhevm-engine/zkproof-worker/src/verifier.rs)

## Verified facts

The litepaper assigns ZK proofs a supporting role: checking that encrypted inputs supplied by users were correctly formed. The FHEVM workspace includes a dedicated `zkproof-worker` and enables `tfhe-zk-pok`/ZK-PoK dependencies in its Rust workspace.

The host `InputVerifier` checks input-handle format, chain ID, proof-payload structure, handle version, and EIP-712 signatures from coprocessors. It confirms that the resulting input handle matches the handle listed in the proof payload.

## Layman model

ZK is like proving “I know the correct answer” without showing the answer or all your working. It is a proof mechanism, not the encrypted calculator itself.

## Inferences

Zama’s ZK path is coupled to input verification and coprocessor attestations. It should not be described as “Zama is a ZK chain”; FHE is the mechanism that preserves and computes over encrypted application state.

## Unknowns

- Exact proof construction and soundness assumptions for each current TFHE/ZK version.
- Which proof work is performed by the coprocessor and which checks are performed on-chain.
- Production proof latency and failure behavior under load.

## Not included

No ZK circuit audit or comparison of every competing ZK system.

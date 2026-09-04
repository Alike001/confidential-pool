# Fully Homomorphic Encryption (FHE)

## Scope

Understand the cryptographic primitive Zama uses for encrypted computation.

## Sources

- [Zama Litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- [`tfhe-rs` README](https://github.com/zama-ai/tfhe-rs)
- [`concrete` README](https://github.com/zama-ai/concrete)
- [`fhevm` README](https://github.com/zama-ai/fhevm)

## Verified facts

FHE allows computation directly on ciphertexts without first decrypting them. Zama’s TFHE-rs repository implements Boolean and integer arithmetic over encrypted data and provides Rust, C, and client-side WASM APIs.

FHEVM exposes encrypted types and operators to Solidity developers. In the host contracts, FHE operations are represented by handles and emitted events; the heavy ciphertext computation is performed by the off-chain coprocessor stack.

## Layman model

FHE is a locked calculator: the calculator can add, compare, or transform a number inside a locked box without opening the box.

## Inferences

FHE is the part of Zama that keeps state encrypted during processing. This is why it is different from a system that only proves a result after computing on plaintext data.

## Unknowns

- Which FHE operations dominate real workloads.
- How latency and cost change with ciphertext type, dependency depth, and hardware backend.
- Which TFHE-rs features are stable protocol guarantees versus implementation details.

## Not included

No independent cryptographic proof or performance benchmark.

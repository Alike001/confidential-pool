# Repository: fhevm

## Role

The central open-source implementation of the Zama Confidential Blockchain Protocol for EVM-compatible chains.

## Observed structure

- `host-contracts/` — host-chain Solidity contracts and libraries.
- `gateway-contracts/` — Gateway Solidity contracts.
- `coprocessor/` — Rust FHEVM compute/listener/scheduler workspace.
- `kms-connector/` — Rust Gateway/KMS integration service.
- `library-solidity/` — Solidity developer-facing FHE library support.
- `relayer/`, `sdk/`, `shared/` — client/integration components.
- `charts/`, Docker files, and test suites — deployment and validation assets.

## Current checkout

Local shallow checkout: `zama-context/fhevm/`, commit `75eedbfe06ea6f009db5972a5e26910d00872484`, fetched 2026-09-03.

## Sources

- [`fhevm` GitHub repository](https://github.com/zama-ai/fhevm)
- [`fhevm/README.md`](./../fhevm/README.md)
- [Protocol architecture docs](https://docs.zama.org/protocol/protocol)

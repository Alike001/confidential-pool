# Zama repository catalog

Curated from the public [`zama-ai` organization](https://github.com/zama-ai) and repository READMEs/API metadata on 2026-09-03.

## Core protocol and cryptography

| Repository | Role | Link |
|---|---|---|
| `fhevm` | Full-stack FHEVM framework for confidential EVM applications | [github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm) |
| `tfhe-rs` | Rust TFHE library for encrypted Boolean and integer arithmetic | [github.com/zama-ai/tfhe-rs](https://github.com/zama-ai/tfhe-rs) |
| `kms` | Threshold-MPC key management for TFHE | [github.com/zama-ai/kms](https://github.com/zama-ai/kms) |
| `threshold-fhe` | Threshold FHE/MPC research snapshot; README says it is not actively maintained | [github.com/zama-ai/threshold-fhe](https://github.com/zama-ai/threshold-fhe) |
| `hpu_fpga` | FPGA hardware accelerator for homomorphic operations | [github.com/zama-ai/hpu_fpga](https://github.com/zama-ai/hpu_fpga) |
| `verifiable-fhe-paper` | Code associated with verifiable FHE research | [github.com/zama-ai/verifiable-fhe-paper](https://github.com/zama-ai/verifiable-fhe-paper) |

## Blockchain integration and developer tools

| Repository | Role | Link |
|---|---|---|
| `sdk` | Current TypeScript SDK for confidential smart contracts | [github.com/zama-ai/sdk](https://github.com/zama-ai/sdk) |
| `relayer-sdk` | JavaScript relayer SDK; current SDK README describes it as legacy/reference | [github.com/zama-ai/relayer-sdk](https://github.com/zama-ai/relayer-sdk) |
| `fhevm-hardhat-template` | Hardhat starter project | [github.com/zama-ai/fhevm-hardhat-template](https://github.com/zama-ai/fhevm-hardhat-template) |
| `fhevm-foundry-template` | Foundry starter project | [github.com/zama-ai/fhevm-foundry-template](https://github.com/zama-ai/fhevm-foundry-template) |
| `fhevm-react-template` | React/Next.js starter project | [github.com/zama-ai/fhevm-react-template](https://github.com/zama-ai/fhevm-react-template) |
| `fhevm-mocks` | Local mock/testing utilities | [github.com/zama-ai/fhevm-mocks](https://github.com/zama-ai/fhevm-mocks) |
| `forge-fhevm` | Foundry-native FHEVM testing library | [github.com/zama-ai/forge-fhevm](https://github.com/zama-ai/forge-fhevm) |
| `protocol-registry` | Generated public contract-address registry for mainnet/testnet | [github.com/zama-ai/protocol-registry](https://github.com/zama-ai/protocol-registry) |
| `coprocessor-operator` | Helm/deployment tooling for coprocessor operators | [github.com/zama-ai/coprocessor-operator](https://github.com/zama-ai/coprocessor-operator) |
| `mpc-operator` | Helm/deployment tooling for MPC operators | [github.com/zama-ai/mpc-operator](https://github.com/zama-ai/mpc-operator) |
| `protocol-apps` | First-party protocol applications and backend services | [github.com/zama-ai/protocol-apps](https://github.com/zama-ai/protocol-apps) |

## Broader FHE products and learning resources

| Repository | Role | Link |
|---|---|---|
| `concrete` | FHE compiler with Python API | [github.com/zama-ai/concrete](https://github.com/zama-ai/concrete) |
| `concrete-ml` | Privacy-preserving ML built on Concrete | [github.com/zama-ai/concrete-ml](https://github.com/zama-ai/concrete-ml) |
| `tfhe-rs-handbook` | TFHE-rs handbook/documentation | [github.com/zama-ai/tfhe-rs-handbook](https://github.com/zama-ai/tfhe-rs-handbook) |
| `awesome-zama` | Curated Zama/FHE ecosystem and research index | [github.com/zama-ai/awesome-zama](https://github.com/zama-ai/awesome-zama) |
| `dapps` | Public dApp examples and integrations | [github.com/zama-ai/dapps](https://github.com/zama-ai/dapps) |
| `bounty-program` | Public contribution and bounty program | [github.com/zama-ai/bounty-program](https://github.com/zama-ai/bounty-program) |

## Important repository-status notes

- The organization contains archived, forked, experimental, and production-oriented repositories together. Repository presence alone does not indicate equal maturity.
- `threshold-fhe` explicitly points readers to `kms` for actively maintained code.
- The current `sdk` README presents `sdk` as the default TypeScript SDK and `relayer-sdk` as legacy/reference.
- `protocol-registry` is generated from an internal source and warns that manual edits will be overwritten.

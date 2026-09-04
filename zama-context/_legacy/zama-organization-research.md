# Reality Research: Zama organization and confidentiality stack

## Scope

Explain whether Zama is “like ZK,” identify the cryptographic roles of FHE, ZK, and MPC in the Zama Protocol, and map the public `zama-ai` GitHub organization. This is a current-reality brief, not a security audit or implementation plan.

## Sources Checked

- [Zama Confidential Blockchain Protocol Litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- [Zama Protocol documentation hub](https://docs.zama.org/protocol)
- [FHE on Blockchain architecture](https://docs.zama.org/protocol/protocol)
- [Zama official site](https://www.zama.org/)
- [Zama GitHub organization](https://github.com/zama-ai)
- Public GitHub API metadata and README files for the repositories listed below.

## Verified Facts

### Zama is cryptography, but its main primitive is FHE

Zama’s core technology is Fully Homomorphic Encryption (FHE). FHE allows a party to compute on ciphertexts without first decrypting them. In the blockchain setting, encrypted values can remain encrypted while smart-contract logic updates them.

The litepaper describes the Zama Protocol as a confidentiality layer for existing public blockchains, not a new L1 or L2. It combines:

- **FHE** for computation over encrypted data.
- **Zero-knowledge proofs** for checking that encrypted user inputs were formed correctly.
- **Multi-party computation (MPC)** for distributed key generation and threshold decryption.

### Zama is related to ZK, but it is not the same thing

| Technology | Main job | Zama’s use |
|---|---|---|
| FHE | Compute while data stays encrypted | Core privacy and encrypted state/computation |
| ZK proof | Prove a claim without revealing the secret behind the claim | Validate encrypted inputs, including ZKPoKs |
| MPC | Let several parties jointly perform a key or computation task without one party holding the whole secret | KMS key generation and threshold decryption |

The simplest distinction is: **ZK is mainly a proof system; FHE is an encrypted-computation system.** A ZK proof can show that a hidden computation or statement is valid. FHE gives the application encrypted values that can continue to be stored and operated on. Zama uses ZK as one supporting component rather than as its primary computation model.

### Protocol architecture

The documentation identifies these components:

- **FHEVM Solidity library:** encrypted types and operators for Solidity contracts.
- **Host contracts:** on-chain contracts that represent the confidential application and orchestrate FHE workflows.
- **Coprocessors:** nodes that verify encrypted inputs, execute FHE computations, store resulting ciphertexts, and commit results.
- **Gateway:** protocol coordination layer for input verification, access control, decryption requests, and cross-chain ciphertext movement.
- **KMS:** threshold-MPC network for FHE key generation, rotation, and secure decryption.
- **Relayer/oracle:** off-chain service that forwards user requests to the Gateway.

The host chain performs symbolic execution: it creates references/handles to encrypted results and emits events; the heavy FHE work is performed by coprocessors. This lets normal blockchain execution remain separate from the expensive encrypted computation.

### What privacy means here

Zama’s privacy is programmable. A contract can specify who may decrypt a value: for example, only a sender and recipient, or an authorized auditor. Confidentiality does not automatically mean that every piece of transaction metadata disappears; the underlying chain can still expose addresses, timing, and contract interactions.

### Token and network operation

The litepaper describes `$ZAMA` as the protocol token for fees and staking. Fees cover actions such as encrypted-input proof verification, decryption, and bridging. The documented token model burns collected fees and mints rewards for operators. Operators run coprocessor or KMS nodes; token holders can delegate stake. Governance can change protocol parameters, and operators may be slashed for misconduct.

### Public GitHub organization map

The organization contains both protocol infrastructure and broader FHE research/product tooling:

- `fhevm` — full-stack confidential smart-contract framework; contains host contracts, gateway contracts, Solidity library, coprocessor, KMS connector, relayer, SDK, deployment charts, and integration tests.
- `tfhe-rs` — Rust implementation of TFHE for Boolean and integer arithmetic over encrypted data; also exposes C and client-side WASM APIs.
- `kms` — decentralized threshold key-management service for TFHE, including threshold key generation, decryption, key-share resharing, and CRS setup for ZK proofs.
- `sdk` — current TypeScript SDK for confidential dApps, including encryption, decryption, access-control interaction, shield/unshield flows, and React support.
- `relayer-sdk` — JavaScript SDK for interacting with FHEVM; the current `sdk` README identifies it as the legacy SDK kept for reference.
- `protocol-apps` — first-party protocol applications and services, including confidential wrappers, staking, governance, and ZAMA token contracts.
- `protocol-registry` — generated public source of truth for deployed protocol contract addresses on mainnet and testnet; it is not intended to be edited manually.
- `coprocessor-operator` and `mpc-operator` — deployment/operator tooling for protocol infrastructure.
- `hpu_fpga` — SystemVerilog implementation of a Homomorphic Processing Unit targeting AMD Alveo V80 FPGA hardware to accelerate TFHE workloads.
- `concrete` — FHE compiler with a Python-oriented developer experience.
- `concrete-ml` — privacy-preserving machine-learning tools built on Concrete.
- `fhevm-hardhat-template`, `fhevm-react-template`, `fhevm-mocks`, and `forge-fhevm` — developer onboarding and local testing tools.
- `awesome-zama` — curated index of Zama protocol, FHE research, documentation, repositories, and ecosystem resources.

## Inferences

- Zama should be understood as a **stack/ecosystem**, not just a token and not just a smart-contract library.
- The organization spans three practical layers: cryptographic engines (`tfhe-rs`, KMS), blockchain integration (`fhevm`, SDKs, operators), and applications/tooling (`protocol-apps`, templates, Concrete ML).
- The protocol’s privacy model is closer to “publicly verifiable encrypted state” than to a fully opaque privacy chain.

## Unknowns And Questions

- The public repository list and README files do not by themselves prove that every repository is production-critical or currently deployed.
- GitHub metadata is not a substitute for an independent cryptographic or smart-contract audit.
- Exact supported chains, fee schedules, operator set, and deployment status should be checked in the live protocol registry and current documentation before building or transacting.

## Not Included

- Investment advice or a valuation of `$ZAMA`.
- A security audit of the cryptographic implementations.
- A recommendation to deploy a production application.

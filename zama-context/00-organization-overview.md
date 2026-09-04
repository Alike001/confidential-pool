# Zama organization overview

## Scope

Understand Zama as an organization, technology stack, protocol, and developer ecosystem.

## Sources

- [Zama official site](https://www.zama.org/)
- [Zama Protocol documentation](https://docs.zama.org/protocol)
- [Zama GitHub organization](https://github.com/zama-ai)
- [`awesome-zama`](https://github.com/zama-ai/awesome-zama)

## Verified facts

Zama is an open-source cryptography company focused on Fully Homomorphic Encryption for blockchain and AI. The Zama Confidential Blockchain Protocol is presented as a confidentiality layer for existing public blockchains, not as a replacement L1/L2.

Its public repositories cover:

- FHE cryptography: `tfhe-rs`, `threshold-fhe`, `kms`.
- Blockchain execution: `fhevm`, host/gateway contracts, coprocessors, operator tooling.
- Developer access: `sdk`, `relayer-sdk`, templates, mocks, Foundry/Hardhat tooling.
- Applications: `protocol-apps`, dApps, confidential wrappers, staking and governance.
- Broader FHE: `concrete`, `concrete-ml`, FPGA/HPU acceleration, research artifacts.

## Inferences

Zama is best understood as a vertically integrated FHE ecosystem. The protocol is only one layer; the organization also controls or maintains cryptographic libraries, runtime infrastructure, developer tooling, applications, and research/acceleration projects.

## Unknowns

- Which public repositories are production-critical versus experimental or historical.
- Which components are operated by Zama versus independent protocol operators.
- Current production configuration, operator topology, and measured bottlenecks.

## Not included

No investment assessment, security audit, or product recommendation.

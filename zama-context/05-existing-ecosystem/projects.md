# Existing ecosystem projects: bounty lens

## Scope

This page now focuses on the systems that matter to the confidential PoolTogether bounty. The broad Zama ecosystem inventory remains useful background, but it is not the immediate product-selection question.

## Systems to compare

### PoolTogether V5

The reference economic system: Prize Vault, underlying ERC-4626 yield vault, TWAB Controller, Prize Pool, Draw Manager/RNG, liquidator, and Claimer. Its public implementation gives us the baseline behavior that must be preserved or consciously simplified.

### Zama FHEVM and Protocol

The reference confidentiality system: encrypted input registration, FHE operations, ACL, coprocessor execution, gateway/KMS flows, and public or user decryption. It supplies primitives and services; it does not supply PoolTogether's economic policy.

### PoolTogether client and operations repositories

The client monorepo and V5 operational repositories show the user-facing and automation work around vault discovery, draw completion, yield liquidation, and prize claiming. These are relevant because a production-quality bounty submission needs more than a Solidity contract.

### Zama confidential-token examples and libraries

These are the closest application references for encrypted balances, encrypted transfers, user decryption, and ACL. They should be treated as implementation evidence only after checking the version and deployment path used by the bounty.

## Research questions

- Which PoolTogether components are essential to the bounty's promise?
- Which Zama components are already provided and only need integration?
- Where does the adaptation introduce a new contract, a new client flow, or a new operational service?
- Which existing projects demonstrate the expected quality bar for UX, testing, and deployment?

## Sources

- [PoolTogether V5 Prize Pool](https://github.com/GenerationSoftware/pt-v5-prize-pool)
- [PoolTogether V5 Prize Vault](https://github.com/GenerationSoftware/pt-v5-vault)
- [PoolTogether V5 TWAB Controller](https://github.com/GenerationSoftware/pt-v5-twab-controller)
- [PoolTogether client monorepo](https://github.com/GenerationSoftware/pooltogether-client-monorepo)
- [Zama FHEVM](https://github.com/zama-ai/fhevm)
- [Zama organization repositories](https://github.com/zama-ai)

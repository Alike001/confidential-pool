# FHEVM host-contracts

## Scope

Read the Solidity layer deployed on host chains.

## Verified facts

`FHEVMExecutor` is the Solidity interaction point for FHE operations. It validates types and permissions, derives output handles, applies HCU limits, and emits events for off-chain workers. Its operation enum includes arithmetic, bitwise, comparison, branching, randomness, input verification, collection operations, and multiplication/division.

`InputVerifier` validates input-proof payload structure and coprocessor signatures. `ACL` controls encrypted-handle use and decryption. `ConfidentialBridge` and related contracts support cross-chain handle movement.

## Evidence

- `fhevm/host-contracts/contracts/FHEVMExecutor.sol:27-31`, `198-214`, `849-867`, `1078-1108`.
- `fhevm/host-contracts/contracts/InputVerifier.sol:244-333`.
- `fhevm/host-contracts/contracts/ACL.sol:230-267`, `515-554`.

## Inference

The host chain stores the protocol’s symbolic representation of computation rather than executing full FHE arithmetic inside the EVM.

## Unknowns

- Full operation-to-database-row mapping for every executor operator.
- Actual gas/HCU tradeoffs in production contracts.
- Complete transfer trace through bridge and host-chain reorg handling.

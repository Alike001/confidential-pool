# FHEVM gateway-contracts

## Verified facts

The Gateway Solidity package is a set of upgradeable coordination contracts:

- `InputVerification.sol` handles proof requests and coprocessor response consensus.
- `Decryption.sol` handles public/user decryption requests and KMS response consensus.
- `CiphertextCommits.sol` stores committed ciphertext metadata after coprocessor consensus.
- `GatewayConfig.sol` manages registered chains/operators/configuration.
- `ProtocolPayment.sol` handles fee accounting.

The code uses EIP-712 signatures, registered sender checks, response deduplication, digest-based consensus, pausing, and upgrade authorization.

## Evidence

- Input proof flow: `fhevm/gateway-contracts/contracts/InputVerification.sol:184-292`.
- Public decryption flow: `fhevm/gateway-contracts/contracts/Decryption.sol:332-458`.
- Ciphertext commitment flow: `fhevm/gateway-contracts/contracts/CiphertextCommits.sol:123-190`.
- Historical KMS-generation placement: `fhevm/gateway-contracts/contracts/KMSGeneration.sol:12-18`, `107-123`.

## Unknowns

- Deployed versions and configuration by chain.
- Exact response threshold rules in each current environment.
- Which legacy paths remain reachable by supported clients.

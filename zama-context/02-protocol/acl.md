# Access-control layer (ACL)

## Verified facts

The host ACL controls which addresses may use an encrypted handle and which handles may be decrypted. It supports persistent permissions, transient permissions, decryption permissions, delegated user decryption, account denylisting, and pausing.

Evidence:

- Persistent permission: `fhevm/host-contracts/contracts/ACL.sol:230-240`.
- Decryption permission: `fhevm/host-contracts/contracts/ACL.sol:242-267`.
- Combined access check: `fhevm/host-contracts/contracts/ACL.sol:515-517`.
- Delegated decryption check: `fhevm/host-contracts/contracts/ACL.sol:529-554`.

`FHEVMExecutor.verifyInput` gives the consuming contract a transient permission for a verified input: `fhevm/host-contracts/contracts/FHEVMExecutor.sol:849-867`.

## Inferences

Privacy is application-programmable. A dApp can keep values private from the public while allowing selected users, contracts, or auditors to decrypt according to its ACL rules.

## Unknowns

- Whether application developers consistently configure least-privilege ACLs.
- How ACL state is mirrored and validated across host chains, Gateway, relayers, and KMS.

# Confidential PoolTogether architecture

## Purpose

This is a mapping document, not the final implementation architecture. It identifies what must remain economically equivalent to PoolTogether and what must be replaced by Zama primitives.

## Side-by-side mapping

| PoolTogether responsibility | Public V5 idea | Confidential adaptation to investigate |
|---|---|---|
| Pool / vault | ERC-4626-like deposit and withdrawal | Confidential asset or encrypted accounting layer; preserve principal ownership |
| User balance | Vault share balance | Encrypted balance handle, with user-only decryption where appropriate |
| Historical balance | TWAB observations | Encrypted or privacy-preserving weight history; determine whether public timestamps and encrypted amounts are sufficient |
| Yield | Underlying yield vault plus liquidation | Keep principal and yield accounting separate; decide which yield path is realistic on Sepolia |
| Prize pool | Prize liquidity and tier accounting | Encrypted claim amounts and possibly encrypted contribution/weight data |
| Draw | Random number plus draw state | Verifiable randomness plus encrypted winner computation |
| Winner test | `isWinner` based on TWAB and tier odds | FHE comparison/selection or a private eligibility proof; no plaintext branch on encrypted data |
| Claim | Anyone or a claimer calls `claimPrize` | User-specific claim, encrypted payout, or verified decryption followed by confidential transfer |
| Access | Public reads of balances and winner status | ACL controls contract computation and user/winner decryption access |

## Proposed research boundary

The target should be decomposed into four separate privacy questions:

1. **Deposit privacy:** can the asset amount and resulting balance stay encrypted?
2. **Weight privacy:** can the draw use historical balance without exposing the weight?
3. **Winner privacy:** can the contract compute eligibility without publicly revealing every non-winner?
4. **Prize privacy:** can only the winner learn the prize amount while the contract still prevents double claims?

## Zama primitives to inspect

The local FHEVM documentation identifies these relevant operations and flows:

- encrypted inputs converted with `FHE.fromExternal` and an input proof;
- encrypted arithmetic and comparisons such as `FHE.add`, `FHE.sub`, `FHE.lt`, and `FHE.select`;
- ACL grants such as `FHE.allowThis` and `FHE.allow`;
- encrypted random values such as `FHE.randEbool` and the encrypted-random-number documentation linked by the bounty;
- public decryption marked with `FHE.makePubliclyDecryptable` and checked with `FHE.checkSignatures`;
- user decryption through the relayer/KMS path, where the user decrypts locally.

These are candidates for the mapping. Their exact types, supported arithmetic, cost, and deployment compatibility must be verified before implementation.

## Important constraint

FHE hides values during computation; it does not magically hide all public blockchain metadata. Addresses, transaction timing, gas usage, contract calls, and any value intentionally made publicly decryptable can still leak information. The design must document those leakage channels.

## Current status

Phase 2 has passed the primitive and local settlement gates. The leading candidate for the bounty MVP is a fixed draw epoch with encrypted user contribution, encrypted aggregate contribution, encrypted winner/payout result, public draw transcript, and confidential-token settlement. The encrypted epoch experiment now passes late-deposit, mid-period-withdrawal, and public-denominator winner vectors against the plaintext model. This is not a final production architecture until it is merged into the product-shaped contract and the live token transfer path is tested.

The full V5 historical TWAB ring buffer remains a later compatibility track, not an MVP requirement. See [`twab-reconstruction.md`](./twab-reconstruction.md).

## Sources

- [Zama FHEVM repository](https://github.com/zama-ai/fhevm)
- [Local FHEVM encryption/decryption notes](../02-protocol/lifecycle.md)
- [Local FHEVM host-contracts notes](../03-fhevm/host-contracts.md)
- [Official Zama Season 4 announcement](https://www.zama.org/post/zama-developer-program-mainnet-season-4)

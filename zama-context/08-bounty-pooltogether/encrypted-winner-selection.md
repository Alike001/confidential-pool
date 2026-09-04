# Encrypted winner selection

## The difficult question

How can the system decide whether a user wins according to an encrypted balance, while preserving both privacy and a publicly credible fairness story?

## Start from the public V5 algorithm

The current V5 `isWinner` path does the following:

1. identify the last awarded draw;
2. derive tier odds and the historical draw range;
3. hash draw, vault, user, tier, prize index, and the draw random number;
4. reduce that value uniformly against the vault's historical total supply;
5. read the user's TWAB and the vault TWAB total supply;
6. calculate the vault's contribution fraction;
7. calculate the winning zone;
8. compare the random value with that zone.

The implementation is in [`PrizePool.isWinner`](./_repos/pt-v5-prize-pool/src/PrizePool.sol) and [`TierCalculationLib`](./_repos/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol).

## Operation-by-operation mapping

| Public operation | Confidential question | Candidate Zama operation to verify |
|---|---|---|
| Store user balance | Who may read the balance? | `euint` storage plus ACL |
| Update balance | Can deposits and withdrawals update encrypted state? | encrypted input, `FHE.add` / `FHE.sub` |
| Record TWAB | Can historical amounts be aggregated without plaintext observations? | encrypted state transitions; assess storage and circuit cost |
| Compute total weight | Can the denominator remain hidden? | encrypted accumulation or a carefully scoped public aggregate |
| Compute winning zone | Can products and fixed-point scaling be done safely? | encrypted multiplication/comparison; verify supported widths and overflow behavior |
| Derive randomness | Is the random source unpredictable and unbiased? | encrypted random numbers or public verifiable randomness combined with encrypted computation |
| Compare eligibility | Can a boolean result stay private? | `FHE.lt`, `FHE.eq`, or `FHE.select` |
| Pay winner | How does the contract act on an encrypted boolean? | encrypted amount selection, confidential token transfer, or user-specific claim flow |
| Verify draw | What should be publicly proven? | public decryption proof, input proof, protocol commitments/signatures, or a combination |

## Candidate designs to compare

### A. User-specific private eligibility check

Each participant asks the contract whether their own encrypted weight wins. The contract computes an encrypted boolean and grants the user access to the result. This avoids publishing every user's result, but the user can still reveal their own result voluntarily, and repeated calls may leak timing or participation information.

### B. Encrypted payout selected by the contract

The contract computes `payout = select(winner, prize, 0)` and stores an encrypted claim amount. The winner decrypts or privately transfers it. This avoids a plaintext branch, but the token and claim protocol must support encrypted amounts and double-claim protection.

### C. Encrypted winner identity

The contract keeps the selected winner address encrypted and later decrypts it publicly or to a restricted audience. This can make a single draw easy to explain, but public decryption may reveal more than the bounty requires, and encrypted address selection is a separate type/cost question.

### D. Fixed participant slots

The application limits a draw to a known set of slots and evaluates each slot. This is easier to reason about for a demonstration but introduces a scalability and enrollment policy problem.

## Main technical risk

The public V5 algorithm uses variable-width fixed-point arithmetic, a uniform reduction, historical lookups, and potentially many users. A direct encrypted translation may be too expensive or may require operations that are not available in the required FHEVM version. We must benchmark and simplify deliberately rather than assuming that every Solidity expression maps one-to-one to an FHE operation.

## Current primitive findings

The current Zama Solidity documentation says encrypted integers support arithmetic, comparisons, `min`/`max`, `select`, division, remainder, and encrypted random generation. It also documents an important restriction: encrypted `div` and `rem` use plaintext divisors. Bounded encrypted randomness is documented for power-of-two upper bounds. This means the V5 expression `uniform(random, historicalTotalSupply)` cannot be copied mechanically if the total supply remains encrypted; its random-reduction and scaling strategy needs a separate design and test vector.

The local FHEVM source snapshot also exposes `FHE.mul` for two encrypted integers of the same width, `FHE.lt`/`FHE.ge` comparisons that return an encrypted boolean, and `FHE.select` for encrypted branching. These make a threshold-style test plausible, but they do not solve the choice of numeric scale, overflow behavior, or how to derive a user-specific random value without revealing the hidden denominator.

The documented input path is: the frontend encrypts a value bound to a contract and sender, produces a ZK proof of knowledge, and the contract calls `FHE.fromExternal`. The documented user result path is: the contract grants ACL access to the ciphertext, the relayer/KMS re-encrypts it to the user's public key, and the user decrypts locally. Public results use a separate publicly-decryptable flag and onchain signature/proof checking.

These facts narrow Phase 2: we need to test integer widths, multiplication depth, plaintext-divisor constraints, random bounds, ACL transitions, and the exact claim settlement path.

## Current conclusion

The first thing to prototype is not the frontend. It is a tiny test contract that evaluates one user's encrypted weight against one draw random value, exposes only an encrypted boolean or encrypted payout to the intended user, and records enough public metadata to explain fairness without publishing the weight.

## Sources

- [PoolTogether V5 `PrizePool.sol`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)
- [PoolTogether V5 `TierCalculationLib.sol`](./_repos/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol)
- [FHEVM conditional operations example](../fhevm/docs/examples/fheifthenelse.md)
- [FHEVM public decryption example](../fhevm/docs/examples/heads-or-tails.md)
- [FHEVM encryption/decryption protocol notes](../fhevm/docs/protocol/d_re_ecrypt_compute.md)
- [Zama encrypted-input guide](https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs)
- [Zama supported encrypted types](https://docs.zama.org/protocol/solidity-guides/smart-contract/types)
- [Zama encrypted random numbers](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random)
- [Zama user decryption](https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption)
- [Local FHEVM Solidity library](../fhevm/library-solidity/lib/FHE.sol)

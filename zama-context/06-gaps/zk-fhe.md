# ZK–FHE boundary for the winner test

## Challenge question

Which facts should be proven with ZK, and which should be computed with FHE, when a draw depends on hidden balances?

## Likely division of labor

- **ZK/input proof:** show that an encrypted deposit or encrypted input was formed correctly for the intended contract and sender.
- **FHE:** add, compare, select, and carry hidden balances or winner bits without decrypting them.
- **Decryption proof:** if a final value is revealed, prove that it is the true decryption of the stored ciphertext.
- **Application fairness logic:** define the draw formula, randomness binding, inclusion rules, and claim semantics.

## Evidence observed

The Zama workspace contains a `zkproof-worker`, TFHE/ZK proof dependencies, input-proof request/response contracts, and separate FHE execution workers. The FHEVM examples also show input proofs, encrypted comparisons, `FHE.select`, and public decryption verification.

## Questions specific to this bounty

- Is the encrypted winner calculation itself accompanied by a public proof, a signed protocol result, or only an onchain operation graph?
- Can a user prove eligibility without revealing their encrypted weight?
- Does the chosen random-number reduction require an FHE operation that is unavailable or too expensive?
- How do we prevent a caller from asking the contract about arbitrary users and learning results through behavior?
- What is the minimum public transcript needed for an independent fairness explanation?

## Research boundary

This page tracks the boundary. It is not a proposal to replace FHE with ZK or to claim that every FHE computation has a user-facing ZK proof.

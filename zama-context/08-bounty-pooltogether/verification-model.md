# Verification model

## Separate three meanings of “verifiable”

The bounty's fairness requirement can be misunderstood unless we separate:

1. **Input authenticity:** did the user submit a well-formed encrypted value tied to the allowed contract and sender?
2. **Computation integrity:** did the confidential computation follow the intended operation graph?
3. **Result authenticity:** if a value is revealed, is it the true decryption of the stored ciphertext?

These are not all the same proof.

## PoolTogether's public baseline

In V5, an observer can inspect the draw random number, draw identifiers, tier parameters, contribution accounting, and the public `isWinner` calculation. Anyone can independently recompute a candidate's result because the candidate's TWAB and the relevant inputs are public.

## What changes with Zama

With Zama, the inputs and intermediate values can remain encrypted. The local FHEVM documentation describes encrypted-input proofs, coprocessor execution of FHE instructions, ACL replication, and decryption paths. For public decryption, the contract can mark a ciphertext publicly decryptable and later check a KMS-signed decryption proof onchain. For user decryption, the KMS re-encrypts the plaintext to the user's public key and the user decrypts locally.

## Candidate fairness story

The eventual dApp should be able to explain, in plain language:

- which draw identifier and randomness were committed to;
- which deterministic formula was evaluated;
- which encrypted inputs were authorized;
- which party, if any, is allowed to learn the result;
- what onchain proof or protocol verification prevents an operator from substituting a different result;
- how a winner claims exactly once.

## Open design choices

### Private result, public draw transcript

Publish the draw ID, randomness commitment, parameters, and protocol events, but keep the winner bit and payout encrypted. This maximizes privacy, but observers cannot independently recompute the exact winner without access to the encrypted inputs.

### Publicly decrypt one final result

Keep participant weights encrypted but publicly decrypt one final winner or aggregate result with an onchain decryption proof. This is easier to audit socially, but the final result itself is public and may reveal information.

### Winner-only decryption

Keep the result private and grant access only to a winner or claimant. This best matches private prizes, but the public fairness narrative must rely on protocol verification and a clearly documented claim path.

## Important correction

Zama's ZK proofs around encrypted inputs and its decryption verification should not be described as “a ZK proof of the entire PoolTogether draw” unless the actual deployment provides that exact proof. We should use precise language until the protocol and contracts are verified.

## Sources

- [FHEVM coprocessor architecture](../fhevm/docs/protocol/architecture/coprocessor.md)
- [FHEVM relayer/oracle architecture](../fhevm/docs/protocol/architecture/relayer_oracle.md)
- [FHEVM encryption and decryption](../fhevm/docs/protocol/d_re_ecrypt_compute.md)
- [FHEVM public decryption example](../fhevm/docs/examples/heads-or-tails.md)
- [PoolTogether V5 `PrizePool.sol`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)

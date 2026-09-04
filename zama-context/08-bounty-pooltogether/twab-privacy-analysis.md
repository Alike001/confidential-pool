# Reality Research: TWAB total supply and privacy leakage

## Scope

This note answers two questions before we treat the confidential winner-selection boundary as sound:

1. Where does PoolTogether V5's `vaultTotalAverageSupply` come from?
2. Does publishing that aggregate allow reconstruction of individual positions?

The note also defines the three primitive experiments that should be tested next. It does not select the final product architecture.

## Sources checked

- Local V5 source snapshot: [`PrizePool.sol`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)
- Local V5 source snapshot: [`TwabController.sol`](./_repos/pt-v5-twab-controller/src/TwabController.sol)
- Local V5 source snapshot: [`TwabLib.sol`](./_repos/pt-v5-twab-controller/src/libraries/TwabLib.sol)
- PoolTogether [V5 protocol design](https://dev.pooltogether.com/protocol/design/)
- PoolTogether [TwabController reference](https://dev.pooltogether.com/protocol/reference/twab-controller/twabcontroller/)
- Zama [FHEVM supported types and operations](https://docs.zama.org/protocol/solidity-guides/smart-contract/types)
- Zama [encrypted random numbers](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random)
- Zama [user decryption](https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption)

## Verified facts

### `vaultTotalAverageSupply` is computed, not stored as one named value

PoolTogether's design page uses `vaultTotalAverageSupply(start, end)` as explanatory shorthand. In the inspected V5 code, the actual return variable is `_vaultTwabTotalSupply`.

The call chain is:

```text
PrizePool.isWinner(...)
  └─ getVaultUserBalanceAndTotalSupplyTwab(...)
       └─ draw IDs → start/end timestamps
       └─ TwabController.getTotalSupplyTwabBetween(vault, start, end)
            └─ totalSupplyObservations[vault]
                 └─ TwabLib.getTwabBetween(...)
```

`PrizePool.getVaultUserBalanceAndTotalSupplyTwab` obtains the time range from the selected tier's accrual window. It calls `drawOpensAt(startDrawId)` and `drawClosesAt(endDrawId)` for the endpoints.

`TwabController.getTotalSupplyTwabBetween` reads the vault's `totalSupplyObservations` account. It does not iterate over every user at query time. The controller maintains a separate aggregate observation ring buffer as balances change.

`TwabLib.getTwabBetween` retrieves or extrapolates endpoint observations and computes:

```text
total-supply TWAB
  = (end cumulative balance - start cumulative balance)
    / (end timestamp - start timestamp)
```

The cumulative value is updated from the active balance over elapsed time:

```text
new cumulative
  = old cumulative + active balance × elapsed seconds
```

The aggregate is therefore the average of the vault's active/delegated supply over the accrual interval—not merely the current `totalSupply` at draw time. PoolTogether documents the same observation and cumulative-balance model. [PoolTogether V5 design](https://dev.pooltogether.com/protocol/design/)

### “Supply” means active delegated weight in the TWAB system

V5 tracks both an owned balance and a delegated balance. Historical eligibility uses delegated balance. The aggregate observation is maintained by the controller's total-supply update path and represents the active weight counted for the vault, including the effect of sponsorship/delegation rules.

So the safer notation is:

```text
S(T) = average active vault weight during interval T
```

Rather than assuming it is always a simple sum of every address's owned balance. In the no-delegation case it is equivalent to the time average of all user balances:

```text
S(T) = Σᵢ TWABᵢ(T)
```

With delegation, the protocol's active/delegated accounting is the source of truth.

### Publishing the aggregate does not automatically reveal every balance

If a single scalar `S(T)` is published for one interval and there are many unknown user weights, it gives one equation:

```text
w₁ + w₂ + ... + wₙ = S(T)
```

That is underdetermined when `n` is large. The aggregate alone normally does not identify each individual position.

However, this is not a strong guarantee of privacy. Reconstruction becomes possible or easier when an observer has auxiliary information.

### Conditions that make reconstruction possible or practical

The aggregate can reveal an individual or sharply narrow their position when:

- the pool has only one participant, so `S(T) = w₁`;
- only one participant changes balance during an interval, so the aggregate delta reveals that participant's change;
- all but one participant's balances are known or can be estimated;
- deposits or withdrawals expose plaintext token amounts through the token transfer layer;
- an observer knows entry/exit times and sees a sequence of aggregate TWABs over multiple intervals;
- the pool is small and participant identities are known from transaction timing;
- public prize payouts, withdrawals, or user disclosures provide enough equations to solve the remaining unknowns;
- delegation or sponsorship status is public and reduces the set of possible active participants.

The important point is that a time series of aggregates is more revealing than one aggregate. For period `k`:

```text
Sₖ = Σᵢ wᵢ,ₖ
```

If the observer can associate a change with one user, then:

```text
ΔSₖ ≈ Δwⱼ,ₖ
```

The exact inference depends on what other transaction data remains public.

### Current V5 is not a useful privacy baseline

In ordinary V5, the aggregate is not the only public information. The system also exposes ordinary user balances, total supply, TWAB queries, transfer amounts, observation data, and events. Therefore current V5 provides no balance confidentiality; the aggregate question matters only for a redesigned confidential implementation.

## Privacy assessment

### Answer to the question

Yes, exposing aggregate supply can leak enough information to reconstruct individual positions in small, low-entropy, or externally observable pools. No, the aggregate by itself does not mathematically reconstruct arbitrary individual positions in a large pool with sufficiently hidden membership, amounts, timing, and activity.

Therefore:

```text
public aggregate supply
≠ automatically unsafe
public aggregate supply
≠ strong individual-balance privacy
```

The correct claim would be conditional privacy: individual balances are hidden from the chain and ordinary observers, subject to metadata and auxiliary-information leakage.

### Privacy boundary for the experiment

To test “private balances” honestly, the experiment must keep all of these out of plaintext transaction data:

- deposit and withdrawal amounts;
- share/balance values in events;
- per-user TWAB balances and cumulative balances;
- per-user winner booleans;
- confidential prize amounts.

It must separately measure whether the following remain public:

- pool-wide total-supply TWAB;
- deposit/withdrawal timing;
- caller and recipient addresses;
- aggregate yield and prize contributions;
- draw randomness and tier parameters;
- claim and withdrawal frequency.

If the total-supply TWAB is public, it should be documented as an aggregate leakage channel, not described as fully private accounting.

## TWAB representation question

The current V5 observation contains public time metadata plus numeric state: active balance and cumulative balance. A confidential representation would have to decide whether to:

- keep period/timestamp/index metadata public and encrypt numeric fields;
- encrypt per-user balance and cumulative balance while maintaining a separate aggregate observation;
- encrypt the aggregate observation too, which removes this leakage channel but makes V5's variable-bound random reduction harder;
- use a bounded fixed-point representation and explicitly test overflow/wraparound.

The average operation itself is comparatively compatible with FHE when the duration is public: encrypted cumulative subtraction followed by division by a plaintext duration. Current FHEVM documentation states that encrypted division and remainder require a plaintext divisor, and encrypted arithmetic is unchecked, so numeric width and overflow are experimental requirements. [Zama encrypted types](https://docs.zama.org/protocol/solidity-guides/smart-contract/types)

Ring-buffer indices, observation cardinality, and update timing may also reveal activity even when amounts are encrypted. The ciphertext handle must therefore not be treated as the entire privacy model.

## Three primitive experiments

### Experiment 1: public randomness, encrypted winning-zone comparison

Keep the draw ID, public randomness, tier odds, and possibly the public aggregate supply visible. Encrypt the user TWAB and derive an encrypted winning zone. Test whether the protocol can produce an encrypted `ebool` for the winner condition and grant only the intended user permission to decrypt it.

This tests the smallest likely cryptographic boundary, but it does not eliminate leakage from a public aggregate or public input amounts.

### Experiment 2: encrypted random value with fixed power-of-two range

Generate an encrypted random value with a fixed power-of-two domain and compare it to an encrypted threshold. This avoids using an encrypted upper bound directly and matches the current documented bounded-randomness constraint. Zama's current documentation says bounded encrypted randomness requires a power-of-two upper bound and must execute in a transaction. [Zama encrypted randomness](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random)

The experiment must measure whether scaling the winning zone into the fixed domain preserves the intended probability closely enough for the bounty's fairness claim.

### Experiment 3: redesigned unbiased reduction

Test a replacement for V5's variable-bound rejection-sampling/modulo step that is expressible with FHE operations and has a defensible fairness argument. The original V5 helper uses an upper bound equal to the total-supply TWAB, so a direct encrypted translation would require a variable encrypted modulus/rejection path.

FHEVM does not permit an unbounded loop whose termination depends on an encrypted condition; a bounded loop with encrypted selection is the documented pattern. [Zama branching guidance](https://docs.zama.org/protocol/solidity-guides/smart-contract/logics/loop)

## Inferences

- `vaultTotalAverageSupply` is an aggregate observation account maintained incrementally by the TWAB Controller; it is not recomputed by summing user records inside `isWinner`.
- Hiding only the user balance while publishing plaintext deposits, withdrawals, or balance-change amounts would not provide meaningful confidentiality.
- A public aggregate may be acceptable for a demonstration with explicit leakage documentation, but it should not be called end-to-end private accounting.
- The smallest cryptographic boundary may indeed be the user-specific eligibility computation, but the privacy result depends on the public metadata around that computation.
- Encrypting the aggregate supply strengthens privacy but collides with the exact V5 random-reduction primitive, making the three experiments a genuine decision gate.

## Unknowns and questions

- What participant count and transaction pattern make aggregate-supply reconstruction practically feasible for the intended demo?
- Should the demo disclose an aggregate TWAB, an encrypted aggregate TWAB, or only a fixed public denominator?
- What exact fixed-point scale and encrypted width avoid wraparound in cumulative TWAB state?
- Can Experiment 1 preserve an unbiased distribution when the random reduction uses a public aggregate?
- Can Experiment 2 or 3 provide an auditable onchain fairness transcript without publicly decrypting every user's winner bit?
- Does a winner-only user decryption flow prevent third parties from querying or correlating winner results? Zama's user-decryption model is permission-based and keeps the plaintext offchain for unauthorized observers. [Zama user decryption](https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption)

## Not included

- No final confidential PoolTogether architecture.
- No smart-contract implementation.
- No claim that aggregate publication is safe under all threat models.
- No conclusion yet about which of the three experiments should become the bounty submission.

# Phase 2 experiment test plan

## Purpose

Compare three winner-selection approaches against the reconstructed V5 baseline in [`phase-2a-iswinner-baseline.md`](./phase-2a-iswinner-baseline.md). This is a test plan only. The build plan remains gated on the result.

## Baseline contract

For each test case, the reference result is:

```text
P = keccak256(drawId, vault, user, tier, prizeIndex, drawRandomNumber)
Q = unbiasedUniform(P, vaultTotalAverageSupply)
W = floor₁₈(floor₁₈(userTwab × tierOdds) × vaultContributionFraction)
winner = (vaultTotalAverageSupply > 0) AND (Q < W)
```

The reference must preserve the actual V5 details: tier-specific accrual ranges, delegated TWABs, contribution accumulators, SD59x18 truncation, and rejection-sampling modulo correction.

## Required baseline vectors

| Case | Expected result |
|---|---|
| Average total supply is zero | Always not winner |
| User TWAB is zero | Winning zone is zero |
| Vault contribution fraction is zero | Winning zone is zero |
| Tier odds are one and vault fraction is one | Winning zone equals user TWAB, subject to conversion |
| User owns all active supply, odds and vault fraction are one | Every valid prize slot wins |
| Half the active supply, odds and vault fraction are one | Approximately half of reduced samples win |
| Invalid tier | Revert |
| Invalid prize index | Revert |
| Multiple accrual durations | User and total TWAB endpoints differ by tier |
| Delegated/sponsored balance | Eligibility follows active delegated balance, not owned balance alone |
| Modulo-bias boundary | Rejection behavior matches `UniformRandomNumber` |

## Candidate A — public randomness, encrypted winning-zone comparison

### Question

Can the draw randomness and reduced random sample remain public while the user-specific winning zone and winner bit remain encrypted?

### Test

- Keep the draw transcript and tier parameters public.
- Derive the user-specific PRN exactly as V5.
- Use a public `S` only if required for the reduction.
- Encrypt `U`, derive encrypted `W`, and compute an encrypted comparison.
- Grant the winner bit only to the intended user/claim path.

### Pass conditions

- Matches the baseline winner result over deterministic vectors.
- Does not expose `U`, `W`, or the winner bit in events or return data.
- Documents the leakage from public `S`, public transaction amounts, and repeated claims.
- FHE operation count and depth are within the target network limits.

## Candidate B — encrypted random value with a fixed power-of-two range

### Question

Can both the random value and the threshold remain encrypted if the random domain is a fixed power of two?

### Test

- Choose a fixed domain `M = 2ᵏ`.
- Generate encrypted random `Q` in `[0, M - 1]`.
- Convert the V5 winning probability into an encrypted threshold approximately equal to `M × W / S`.
- Compare encrypted `Q` and encrypted threshold.

### Pass conditions

- Measured probability is statistically consistent with `W / S` over representative values.
- No encrypted variable-bound modulo or data-dependent loop is required.
- The encrypted random result is available only during a transaction and receives correct ACL permissions.
- Rounding and small-`S` behavior are explicitly measured.

Zama's current documentation says bounded encrypted randomness requires a power-of-two upper bound, and random generation must occur in a transaction. [Zama encrypted randomness](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random)

## Candidate C — redesigned unbiased reduction

### Question

Can we replace V5's variable-bound rejection/modulo helper with an FHE-compatible reduction that preserves the same probability model?

### Test

- Specify the new reduction mathematically before implementing it.
- Prove or bound its bias relative to `W / S`.
- Test bounded-round behavior if rejection is retained.
- Compare gas, HCU, circuit depth, and failure behavior with Candidates A and B.

### Pass conditions

- Bias is zero or below an explicitly justified threshold.
- The algorithm has a fixed, auditable execution bound.
- It does not require decrypting `S`, `W`, or the winner bit.
- An external observer can verify the public draw transcript without learning private participant weights.

## Comparison matrix

| Criterion | Candidate A | Candidate B | Candidate C |
|---|---|---|---|
| V5 probability match | Exact only if public reduction is retained | Approximate unless scaling is exact | Goal is exact or bounded bias |
| Individual weight privacy | Depends on public metadata and `S` | Stronger candidate | Depends on construction |
| Encrypted arithmetic | Threshold and comparison | Threshold, scaling, comparison | Construction-dependent |
| Variable encrypted modulo | Possibly avoided if `S` public | Avoided | May be redesigned |
| Onchain verification | Public transcript plus private result | Encrypted transcript/result | Must be designed and tested |
| Winner-only decryption | Required | Required | Required |
| Main risk | Aggregate and query leakage | Probability rounding | Complexity and proof burden |

## Measurements to record

- Exact baseline output for every vector.
- Candidate output and difference from baseline.
- Empirical win frequency for representative `U`, `S`, `o`, and `f` values.
- FHE operation count and circuit depth.
- Gas and transaction count.
- Ciphertext widths and overflow behavior.
- Public events, handles, inputs, and timing metadata.
- Who can decrypt each intermediate and final ciphertext under ACL.
- Whether a caller can learn non-winner results by repeated queries.

## Build-planning gate

Detailed product planning begins only after one candidate satisfies all of these:

1. Probability behavior is understood and acceptable.
2. Privacy leakage is explicit and acceptable for the bounty.
3. FHE cost is practical on the target deployment.
4. Winner-only decryption works end to end.
5. The public fairness transcript is defensible.

Until then, the work remains a cryptographic and protocol experiment, not a product build.

## Not included

- No selected candidate.
- No contract implementation.
- No frontend design.
- No deployment plan beyond the later build-planning gate.

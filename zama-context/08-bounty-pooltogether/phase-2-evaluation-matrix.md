# Reality Research: Phase 2 candidate evaluation matrix

## Scope

This matrix records the current evidence for the three winner-selection candidates. It is a decision record, not a product architecture. A candidate must pass the probability, privacy, cost, verification, and decryption criteria before detailed build planning starts.

## Criteria

| Criterion | Required evidence |
|---|---|
| Probability correctness | Exact V5 equivalence, or an explicitly accepted and bounded approximation with representative vectors |
| Privacy leakage | User balances, winning zones, and winner status are protected, with public metadata and side channels documented |
| FHE cost | HCU and depth remain practical after including the actual claim and accounting path |
| Onchain verifiability | An observer can verify draw inputs, parameter commitments, and the fairness rule without decrypting every user's private state |
| Winner-only decryption | Only the intended user or authorized claim path can obtain the plaintext winner/prize result |
| Denominator handling | The design has a supported way to use `S` or avoids requiring encrypted-denominator division |

## Current evidence

| Criterion | Candidate A: public reduction | Candidate B: fixed-domain encrypted random | Candidate C: redesigned reduction |
|---|---|---|---|
| Probability correctness | **Pass, conditional.** Exact if public `S` and V5 rejection/modulo reduction are retained and encrypted fixed-point arithmetic matches V5. | **Partial.** `Pr = floor(MW/S)/M`; one-sided error `< 1/M`. | **Unknown.** No tested construction. |
| Privacy leakage | **Partial.** User-specific `U`, `W`, and winner bit can be encrypted, but public `S` and activity remain leakage channels. | **Partial/unknown.** Random sample is encrypted, but public activity remains; hidden `S` conversion is unresolved. | **Unknown.** Better privacy target, but transcript and side channels are unspecified. |
| FHE cost | **Measured in isolation.** 4,057,032 global HCU; 4,057,000 maximum depth. Accounting harness adds 259,032 HCU for deposit, 535,032 for withdrawal accounting, and 272,064 for claim. | **Measured in isolation.** 174,000 global HCU and maximum depth. The accounting surface is independent of the random-domain choice. | **Unknown.** |
| Native gas | **Measured locally.** 350,173 gas for the harness call. | **Measured locally.** 220,451 gas for the harness call. | **Unknown.** |
| Onchain verifiability | **Strongest current story.** Public reduced randomness can be independently recomputed. | **Requires a public commitment or trusted verification path for encrypted randomness.** | **Requires a new transcript and proof model.** |
| Winner-only decryption | **Pass in harness.** Alice decrypted the winner bit and claimable prize; Bob was rejected. | **Pass in harness.** The winner bit was caller-authorized; random diagnostic access was test-only. | **Unknown.** |
| Denominator handling | **Pass if `S` is public.** | **Partial.** Exact encrypted division was demonstrated in bounded `euint16` chunks, but full-width cost and multi-transaction complexity are unresolved. | **Unresolved.** |
| Overall status | **Closest to viable, but privacy is conditional and cost needs full-path testing.** | **Cheapest random primitive; private denominator is possible but not yet practical for the full protocol.** | **Research track only.** |

## Evidence notes

The isolated harness uses `U = 250`, tier odds `0.5`, vault fraction `0.8`, producing `W = 100`. It verifies the strict comparison `Q < W`, ACL behavior, and the current bounded-random API. It does not implement a vault, TWAB controller, prize pool, claims, or withdrawals.

The Candidate B sweep used representative supply and winning-zone values. Its maximum observed absolute errors were:

| Domain `M` | Maximum observed absolute error in the finite sweep |
|---:|---:|
| 256 | 0.003402217742 |
| 1,024 | 0.000968750000 |
| 65,536 | 0.000014766570 |
| 4,294,967,296 | 0.000000000225 |

The values are arithmetic results, not live-randomness confidence intervals.

## Decision gate

No candidate passes the complete gate yet.

- Candidate A is the leading baseline for a minimal implementation if the bounty accepts aggregate-supply leakage and the full-path HCU is practical.
- Candidate B is the leading cost baseline if its approximation is acceptable and a denominator strategy is found without exposing individual positions.
- Candidate C should not enter implementation planning until its reduction is specified, bounded, and tested.

## Next evidence required

1. Embed the threshold calculation in a minimal encrypted accounting path and measure full-path HCU/depth.
2. Decide the acceptable absolute probability error, especially for small pools and small winning zones.
3. Test claim behavior for non-winners and repeated queries to identify winner-oracle leakage.
4. Test deposit, withdrawal, and payout event surfaces for plaintext amount leakage.
5. Determine whether the fairness transcript must expose `S`, commit to it, or avoid it entirely.

The separate accounting/claim harness now provides an initial result for item 3 and part of item 4: encrypted deposit and withdrawal calls emitted account-only events, winner and payout results stayed encrypted, and winner/non-winner claim calls both completed successfully. This does not prove that a production claim path is leak-free; the harness does not settle assets or model relayers, gas normalization, batching, or repeated-query limits. Native gas differed between winner and non-winner claim calls in the observed run, so that remains an open side-channel question.

The private-denominator harness provides a bounded result for item 6: exact encrypted division is possible with fixed rounds, but the tested 16-bit circuit requires initialization plus four continuation transactions. The practical resolution is documented in [`phase-2-practical-resolution.md`](./phase-2-practical-resolution.md).

## Sources

- [`phase-2a-iswinner-baseline.md`](./phase-2a-iswinner-baseline.md)
- [`phase-2-experiment-results.md`](./phase-2-experiment-results.md)
- [`phase-2-probability-leakage-analysis.md`](./phase-2-probability-leakage-analysis.md)
- [`twab-privacy-analysis.md`](./twab-privacy-analysis.md)
- [`experiments/README.md`](./experiments/README.md)

## Current implementation boundary

The local product-shaped contract now implements a bounded Candidate-A-style path: public draw reduction, encrypted user TWAB/winning zone, encrypted payout, and operator commit/reveal as an interim transcript safeguard. This is a feasibility slice, not final production architecture. Candidate selection remains open until entropy provenance, privacy leakage, full-path FHE cost, and live Sepolia settlement pass together.

There is no Sepolia performance claim and no frontend or production deployment yet.

# Phase 2 practical resolution

## Decision question

Can we solve both open problems—private denominator handling and winner/non-winner side channels—well enough to begin a bounded bounty build?

## Evidence

### Private denominator

The fixed-round encrypted long-division harness computes exact floor division with an encrypted denominator in a bounded `euint16` domain. A 16-round one-transaction circuit reverted with the local `HCUTransactionDepthLimitExceeded` error. Splitting the same work into four-round chunks completed successfully over five transactions:

| Measurement | Result |
|---|---:|
| Final four-round chunk HCU | 3,688,256 |
| Final four-round chunk maximum depth | 2,013,000 |
| Transactions for one 16-bit quotient | 5, including initialization |
| Arithmetic correctness | Exact for `25,600 / 1,000`, `25,599 / 1,000`, `341 / 3`, and `65,534 / 32,767` |

This proves that the plaintext-divisor restriction is not a mathematical impossibility. It does not make private division a good default for V5. A wider type requires more fixed rounds, and chunking creates sequencing, liveness, intermediate-state authorization, retry, and partial-progress concerns. The experiment does not measure a 128-bit implementation.

### Winner/non-winner side channel

The accounting/claim harness uses the same encrypted comparison and `FHE.select` structure for winners and non-winners. Both calls complete successfully, emit no plaintext winner or payout amount, and produce encrypted results. The same user received HCU values of `272,064` for both winner and non-winner claims in the observed run.

Native gas still varied. In the observed run, the same-user winner claim used approximately `280,800` gas and the same-user non-winner claim approximately `263,700` gas. Therefore the design removes a direct public-revert oracle but does not prove constant-gas behavior. Storage transitions, calldata bytes, handle creation, transaction timing, and relayer behavior remain part of the leakage surface.

## Practical resolution

For the bounded bounty implementation, the smallest defensible design is:

1. Use a draw-scoped, public or publicly committed aggregate denominator `S` for the V5 random reduction. This preserves the exact V5 probability rule without requiring encrypted-denominator division.
2. Keep the user TWAB, winning zone, winner bit, and claimable payout encrypted.
3. Use encrypted `FHE.select` rather than a plaintext branch, and make winner and non-winner claim calls both succeed.
4. Do not emit plaintext deposit amounts, withdrawal amounts, winner booleans, winning zones, or payout amounts.
5. Settle prizes through confidential-token accounting where supported, rather than decrypting a payout into a public transfer.
6. Treat caller address, transaction timing, calldata length, gas, claim frequency, and the public aggregate as explicit residual metadata leakage.
7. Prefer relayed or batched claims with a fixed request envelope if the final product requirements demand stronger linkage resistance; this is a mitigation, not a cryptographic elimination of all metadata leakage.

## What this resolves

- Private denominator: resolved as an available but impractical multi-transaction circuit; avoided in the minimal design.
- Direct winner oracle: mitigated by an encrypted, non-reverting claim path.
- Plaintext payout leakage: avoided in the harness and reserved for confidential-token settlement.
- Exact V5 probability: preserved by keeping the aggregate denominator available to the public reduction.

## What remains open

- Whether the bounty accepts public aggregate-supply leakage as the confidentiality boundary.
- Whether real cUSDT settlement supports the required encrypted payout transfer and principal withdrawal flow on Sepolia.
- Whether gas and timing differences are materially correlated with the private outcome on the deployed stack.
- Whether repeated claims can be rate-limited or batched without making user participation linkable.
- Whether the full V5 TWAB update path fits the HCU and transaction budget.

## Build gate status

This evidence is sufficient to begin a **bounded build plan**, not a production-equivalent architecture. The first implementation should explicitly target:

- public committed aggregate denominator;
- encrypted user-specific eligibility;
- encrypted claimable cUSDT accounting;
- non-reverting claim requests;
- bounded participant and numeric ranges;
- a documented metadata-leakage threat model.

The plan should not claim fully private PoolTogether accounting unless the aggregate, transaction metadata, and payout surface are separately addressed.

## Sources

- [`phase-2-evaluation-matrix.md`](./phase-2-evaluation-matrix.md)
- [`phase-2-experiment-results.md`](./phase-2-experiment-results.md)
- [`phase-2-probability-leakage-analysis.md`](./phase-2-probability-leakage-analysis.md)
- [`experiments/README.md`](./experiments/README.md)
- [Zama FHEVM ACL and user-decryption guidance](https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial/turn_it_into_fhevm.md)

## Not included

- No final contract architecture.
- No frontend or deployment implementation.
- No security-audit conclusion.

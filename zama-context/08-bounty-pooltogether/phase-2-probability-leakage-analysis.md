# Reality Research: Phase 2 probability and leakage analysis

## Scope

This note extends the Phase 2 primitive results in [`phase-2-experiment-results.md`](./phase-2-experiment-results.md). It records a wider mathematical sweep of Candidate B and separates verified protocol facts from privacy inferences. It does not select the final confidential PoolTogether architecture.

## Sources checked

- Local V5 `PrizePool.isWinner`: [`src/PrizePool.sol`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)
- Local V5 winner mathematics: [`src/libraries/TierCalculationLib.sol`](./_repos/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol)
- Local V5 vault deposit/withdrawal implementation: [`src/PrizeVault.sol`](./_repos/pt-v5-vault/src/PrizeVault.sol)
- Local TWAB privacy analysis: [`twab-privacy-analysis.md`](./twab-privacy-analysis.md)
- Zama encrypted types and operations: <https://docs.zama.org/protocol/solidity-guides/smart-contract/types>
- Zama encrypted randomness: <https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random>
- Zama user decryption: <https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption>

## Verified facts

### V5 baseline

The inspected V5 code follows this order for `isWinner`:

1. Read the last awarded draw.
2. Validate the tier.
3. Derive tier odds and the tier's historical accrual range.
4. Validate the prize index.
5. Hash draw ID, vault, user, tier, prize index, and the draw random number into a user-specific random value.
6. Read the vault contribution fraction for the range.
7. Read the user's TWAB and the vault's total-supply TWAB for the same range.
8. Return `uniform(random, totalSupply) < winningZone`.

The winning zone is calculated from the user TWAB, tier odds, and vault contribution fraction. The total-supply TWAB is the upper bound for the random reduction; it is not part of the winning-zone numerator.

### Candidate B probability

For a fixed power-of-two domain `M`, the tested Candidate B reduction uses:

```text
T = floor(M × W / S)
Pr[win] = T / M
```

For `0 ≤ W ≤ S`, the absolute error satisfies:

```text
0 ≤ W/S - floor(M × W/S)/M < 1/M
```

The error is one-sided: the floor operation can only reduce the probability. The relative error can be very large when `W/S` is small; if `M × W < S`, the threshold is zero and the candidate gives that prize slot zero probability.

### Wider representative sweep

The following sweep enumerated `S ∈ {1, 2, 3, 7, 10, 31, 100, 1,000, 10,000, 1,000,000}` and representative `W` values `{0, 1, floor(S/10), floor(S/3), floor(S/2), S}`. The reported maximum is absolute probability error over that finite set.

| Fixed domain `M` | Maximum absolute error | Vector producing maximum |
|---:|---:|---|
| 256 | 0.003402217742 | `S=31, W=15` |
| 1,024 | 0.000968750000 | `S=1,000, W=333` |
| 65,536 | 0.000014766570 | `S=31, W=15` |
| 4,294,967,296 | 0.000000000225 | `S=1,000,000, W=1` |

These values are consistent with the theoretical `< 1/M` bound. They are not a statistical test of live FHE randomness; they are exact arithmetic results for the threshold conversion.

## Privacy leakage matrix

The following is an analysis of what an observer can learn if the confidential implementation encrypts user-specific values but leaves surrounding protocol metadata public.

| Observable | Direct information | Possible inference | Depends on |
|---|---|---|---|
| Deposit amount in public token transfer | Exact amount and timestamp | Current or historical position | Whether deposits use a confidential transfer/wrapper |
| Withdrawal amount | Exact redeemed amount and timestamp | Position, exit timing, or remaining balance | Redemption design and liquidity model |
| Caller address | Participant identity | Pool membership and activity graph | Whether addresses are linkable to deposits |
| Public total-supply TWAB | Aggregate historical active weight | Individual weight in small or low-entropy pools | Number of participants and auxiliary knowledge |
| Public draw randomness | Draw transcript and common entropy | Correlation with user-specific result if result is public | Whether winner result is kept encrypted |
| Public claim success/revert | Whether a queried position won | Binary oracle for repeated eligibility queries | Claim API and revert/event behavior |
| Public prize transfer | Payout recipient and amount | Winner identity and prize size | Whether payout is confidential or delayed through an encrypted balance |
| Timing and gas | Call participation and rough path | Input class or branch correlation | Contract control flow and batching |
| Encrypted handle presence | That an encrypted computation occurred | Activity, not plaintext value | Event and storage design |

## Inferences

- Publishing `S` does not algebraically determine arbitrary user balances, but it creates an equation that becomes useful when combined with public transaction deltas or a small participant set.
- Candidate A's public reduction makes the fairness transcript easy to inspect, but it leaves the aggregate and all public activity channels available for correlation.
- Candidate B's encrypted random value hides the random sample itself from ordinary chain observers, but it does not by itself hide deposit timing, caller identity, public withdrawals, or the denominator-conversion assumptions.
- Increasing `M` reduces absolute rounding bias, but it does not remove the need to represent `M × W / S` safely or solve division by a confidential `S`.
- A winner-only decryption permission protects the plaintext winner bit from unauthorized decryption requests; it does not prevent a public claim endpoint from becoming a winner oracle.
- A private payout amount is a separate requirement from a private winner bit. A design that encrypts eligibility but pays a plaintext ERC-20 amount still reveals the prize after a successful claim.

## Unknowns and questions

- What fixed domain `M` is practical for the target encrypted integer width and acceptable bias threshold?
- What is the maximum expected `S` and `W`, including TWAB cumulative values, before fixed-point multiplication risks overflow?
- Can the implementation obtain a denominator for Candidate B without exposing the historical total-supply TWAB or requiring unsupported encrypted-denominator division?
- Does the bounty's fairness requirement accept a bounded one-sided approximation, or must it preserve V5's exact probability model?
- Can claims be designed so that a non-winner cannot repeatedly submit queries and observe a distinguishable revert, event, gas, or timing outcome?
- Can the payout path keep the prize amount confidential while still allowing a winner to withdraw principal at any time?

## Current research status

Candidate A has the clearest exactness story and Candidate B has the clearest cost story. Neither has passed the complete evaluation gate because privacy depends on the surrounding transaction and claim surface, and Candidate B still lacks a resolved hidden-denominator construction. Candidate C has not yet produced a tested construction.

The next artifact should be a complete evaluation matrix with explicit thresholds for acceptable probability error, HCU, gas, leakage, and claim behavior. Product architecture planning should begin only after that matrix identifies a candidate that passes all required criteria.

## Not included

- No final architecture.
- No production contract changes.
- No live Sepolia measurements.
- No claim that encrypted winner bits alone provide end-to-end financial privacy.

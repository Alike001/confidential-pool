# Reality Research: Phase 2A — reconstructing PoolTogether V5 `isWinner`

## Scope

This document reconstructs the current V5 winner test mathematically before comparing FHE alternatives. It is a baseline specification, not a confidential architecture and not an implementation.

The inspected source snapshots are listed in [`README.md`](./README.md). The main implementation is [`PrizePool.isWinner`](./_repos/pt-v5-prize-pool/src/PrizePool.sol), with helper math in [`TierCalculationLib`](./_repos/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol) and random reduction in [`UniformRandomNumber`](./_repos/pt-v5-prize-pool/lib/uniform-random-number/src/UniformRandomNumber.sol).

## Sources checked

- [`PrizePool.isWinner`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)
- [`PrizePool.getVaultUserBalanceAndTotalSupplyTwab`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)
- [`PrizePool.getVaultPortion`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)
- [`TierCalculationLib`](./_repos/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol)
- [`UniformRandomNumber`](./_repos/pt-v5-prize-pool/lib/uniform-random-number/src/UniformRandomNumber.sol)
- [`TwabController`](./_repos/pt-v5-twab-controller/src/TwabController.sol)
- [`TwabLib`](./_repos/pt-v5-twab-controller/src/libraries/TwabLib.sol)
- [`PRBMath SD59x18 conversions`](./_repos/pt-v5-prize-pool/lib/prb-math/src/sd59x18/Conversions.sol)
- [`PRBMath SD59x18 multiplication`](./_repos/pt-v5-prize-pool/lib/prb-math/src/sd59x18/Math.sol)
- PoolTogether [V5 winner eligibility explanation](https://dev.pooltogether.com/protocol/design/)

## 1. Inputs and notation

For one awarded draw, vault, user, tier, and prize index, define:

| Symbol | V5 value | Meaning |
|---|---|---|
| `D` | `lastAwardedDrawId` | Draw being checked |
| `N` | `numberOfTiers` | Number of active tiers |
| `t` | `_tier` | Tier being checked |
| `p` | `_prizeIndex` | Prize slot inside the tier |
| `R` | `_winningRandomNumber` | Random number awarded for the draw |
| `o` | `tierOdds` | Frequency/odds factor for tier `t` |
| `U` | `userTwab` | User's average active delegated balance over the accrual range |
| `S` | `vaultTotalAverageSupply` / `_vaultTwabTotalSupply` | Vault's average active delegated total supply over the same range |
| `f` | `vaultContributionFraction` / `vaultPortion` | Vault's share of prize liquidity over the same accrual range |
| `W` | `winningZone` | Integer interval size assigned to this user for this prize slot |
| `Q` | reduced PRN | Uniform random integer in `[0, S - 1]` |

The current V5 public function returns a plaintext `bool`. It checks a particular prize slot, not “did this user win anything in the entire draw?”

## 2. Accrual range selected by the tier

The tier's odds are calculated by `TierCalculationLib.getTierOdds`:

```text
a = 1 - N
o = (1 / grandPrizePeriodDraws) ^ sqrt((t + a) / a)
```

Since `a = 1 - N`, this can also be written for valid tiers as:

```text
o = (1 / grandPrizePeriodDraws) ^ sqrt((N - 1 - t) / (N - 1))
```

This gives the lowest tier the grand-prize frequency and the highest tier an odds factor of approximately `1`.

The code then estimates the accrual duration in draws:

```text
frequencyInDraws = min(ceil(1 / o), grandPrizePeriodDraws)
startDrawId = D - frequencyInDraws + 1
```

The subtraction is clamped to draw `1` when the history is shorter than the requested range. The actual implementation uses SD59x18 fixed-point math and `ceil` for the frequency estimate.

The time interval is:

```text
startTimestamp = drawOpensAt(startDrawId)
endTimestamp   = drawClosesAt(D)
```

Therefore grand-prize tiers use a longer history and frequent tiers use a shorter history.

## 3. `vaultTotalAverageSupply` / `S`

`PrizePool` calls `TwabController.getTotalSupplyTwabBetween(vault, startTimestamp, endTimestamp)`. The controller reads the aggregate account:

```text
totalSupplyObservations[vault]
```

It does not loop through user accounts during the winner check. The controller maintains this aggregate observation history as the vault updates balances.

`TwabLib.getTwabBetween` computes:

```text
S = (S_cumulative_end - S_cumulative_start)
    / (endTimestamp - startTimestamp)
```

The cumulative values are maintained using:

```text
newCumulative = oldCumulative + activeBalance × elapsedSeconds
```

The endpoint observations may be temporary extrapolations from the last stored observation. Timestamps are period-aligned and the observation ring buffer is searched for the relevant endpoints.

In no-delegation mode:

```text
S = Σᵢ TWABᵢ
```

With delegation, `S` is the total active delegated weight tracked by the controller, while `U` is the queried user's delegated weight. It is not necessarily the sum of owned balances grouped by owner.

## 4. `userTwab` / `U`

The same helper calls:

```text
TwabController.getTwabBetween(vault, user, startTimestamp, endTimestamp)
```

This reads `userObservations[vault][user]` and applies the same cumulative-difference-over-duration calculation. Historical eligibility uses the user's active delegated balance, not simply the balance at the moment of the draw.

The purpose of `U` is to make the user's winning interval proportional to the amount of active capital they maintained over the tier's accrual period.

## 5. `vaultContributionFraction` / `f`

`PrizePool.getVaultPortion` reads contribution accumulator values over the same draw range:

```text
vaultContributed = vaultAccumulator[vault].getDisbursedBetween(start, end)
totalContributed = totalAccumulator.getDisbursedBetween(start, end)
totalDonated     = vaultAccumulator[DONATOR].getDisbursedBetween(start, end)
```

For an ordinary vault:

```text
f = vaultContributed / (totalContributed - totalDonated)
```

The result is an SD59x18 fixed-point fraction. If the queried vault is the special `DONATOR` address, `f = 0`. If total contribution is zero, the function returns zero.

`f` is not the user's share of the vault. It determines what fraction of the prize liquidity is attributable to this vault when several vaults share one Prize Pool.

## 6. User-specific pseudo-random number

V5 derives entropy for each possible prize slot:

```text
P = uint256(keccak256(abi.encode(
      D,
      vault,
      user,
      t,
      p,
      R
    )))
```

Including the user, vault, tier, and prize index domain-separates the checks. The same awarded draw random number therefore produces different pseudo-random values for different users and prize slots.

The hash is public in ordinary V5 because every input and the returned `isWinner` result are public.

## 7. Winning zone calculation

The source computes:

```solidity
uint256(convert(convert(int256(U)).mul(o).mul(f)))
```

Mathematically:

```text
W = floor₁₈(floor₁₈(U × o) × f)
```

where `floor₁₈` means the truncation introduced by each SD59x18 multiplication, followed by the final conversion to an integer. PRBMath documents the final SD59x18 conversion as rounding toward zero; all values in this path are intended to be nonnegative.

Conceptually:

```text
winning zone
  = user historical weight
  × tier frequency factor
  × this vault's liquidity fraction
```

If `U = 250`, `S = 1000`, `o = 0.5`, and `f = 0.8`, then:

```text
W = 250 × 0.5 × 0.8 = 100
```

The user's chance for that particular prize slot is therefore approximately `100 / 1000 = 10%`, subject to integer and fixed-point rounding.

## 8. Random-number reduction

V5 does not compare the full 256-bit hash directly with `W`. It maps the hash into the vault's average supply range:

```text
Q = UniformRandomNumber.uniform(P, S)
```

If `S == 0`, `TierCalculationLib.isWinner` returns `false` before calling the helper.

For `S > 0`, the helper computes:

```text
min = (2²⁵⁶ - S) mod S
random = P
```

Then:

```text
while random < min:
    random = uint256(keccak256(abi.encodePacked(random)))

Q = random mod S
```

The rejection step removes modulo bias. Assuming the initial hash and subsequent rehashes behave as uniform independent entropy, `Q` is uniform over `[0, S - 1]`.

This loop is data-dependent in the clear implementation. In an FHE implementation, a loop whose termination depends on an encrypted condition cannot be used directly; a fixed maximum number of rounds and encrypted selection would be required, or the reduction algorithm would need to change.

## 9. Final winner predicate

The exact final predicate is:

```text
isWinner(D, vault, user, t, p, R)
  = (S ≠ 0) AND (Q < W)
```

Expanded:

```text
isWinner
  = UniformRandomNumber.uniform(
      keccak256(D, vault, user, t, p, R),
      vaultTotalAverageSupply
    )
    < floor₁₈(floor₁₈(userTwab × tierOdds) × vaultContributionFraction)
```

For ideal uniform `Q`, the per-slot probability is:

```text
Pr[win] = W / S
```

provided `0 ≤ W ≤ S`. V5's intended inputs make that inequality natural: `U` is a portion of active supply, while `o` and `f` are fractions no greater than one. The implementation still needs test vectors for rounding and boundary behavior.

## 10. What Phase 2 must preserve

Any candidate replacement must be compared against this baseline, not only against the simplified phrase “random number below balance.” It must account for:

- tier-dependent accrual duration;
- active/delegated TWAB rather than spot balance;
- aggregate supply over the same interval;
- vault contribution share over the same interval;
- per-user/per-tier/per-prize domain-separated entropy;
- modulo-bias correction;
- integer and fixed-point rounding;
- `S == 0`, zero contribution, zero user weight, and invalid tier/index behavior.

## Verified facts

- `vaultTotalAverageSupply` is the design-document name for the value returned as `_vaultTwabTotalSupply` in the inspected implementation.
- It comes from the TWAB Controller's aggregate observation account.
- `userTwab` and total-supply TWAB are queried over the same tier-specific accrual interval.
- `vaultContributionFraction` comes from Prize Pool contribution accumulators, not from the TWAB Controller.
- The random reduction uses rejection sampling followed by modulo.
- The current `isWinner` result is a plaintext boolean.

## Inferences

- Under an ideal hash model, the reduction makes each prize-slot sample uniform over the integer supply range, so the intended probability is the winning-zone size divided by average total supply.
- The smallest computationally sensitive part appears to be the final comparison and the arithmetic that produces `W`, but exact V5 compatibility also depends on how `Q` is produced.
- A candidate that changes the reduction domain changes the probability model unless its scaling and rounding are proven equivalent or its deviation is measured and accepted.

## Unknowns and questions

- How much probability deviation is introduced by each fixed-point and integer truncation in realistic parameter ranges?
- How many rejection rounds are needed in practice for the actual supply ranges, and what fixed bound would be safe for an FHE circuit?
- Can an encrypted threshold be compared against a public reduced random value without leaking enough information through repeated queries?
- Can a fixed power-of-two domain reproduce the intended `W / S` probability without exposing `S`?

## Not included

- No FHE contract.
- No chosen confidential architecture.
- No claim that a public aggregate or public winner proof satisfies the final bounty privacy requirement.

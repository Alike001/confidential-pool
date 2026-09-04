# V5 TWAB reconstruction for the confidential adaptation

## The important correction

`userTwab` is not the user's current balance. PoolTogether V5 derives it from a time series of observations maintained by `TwabController`.

For a vault and account, V5 stores:

```text
AccountDetails:
  balance              current token balance
  delegateBalance      balance that counts for prize chances
  nextObservationIndex ring-buffer write position
  cardinality          number of initialized observations

Observation:
  cumulativeBalance    integral of balance over time
  balance              delegate balance at checkpoint
  timestamp            period-relative checkpoint time
```

The total supply has a separate account and observation ring buffer. That is where the denominator used by the Prize Pool comes from.

## How observations are written

`TwabERC20` does not keep its own ordinary balance as the source of truth. Its `_mint`, `_burn`, and `_transfer` methods call the `TwabController`, which updates the user account and the vault's total-supply account.

When a delegate balance changes, the controller records an observation unless the timestamp has passed the controller's final representable time. If the current timestamp is in the same overwrite period as the newest observation, V5 rewrites that newest observation. Otherwise it advances the ring buffer. The default architecture is designed for one observation per period and at least one year of history when the period is one day.

The new cumulative value is:

```text
newCumulative = previousCumulative
              + previousBalance × (newTimestamp - previousTimestamp)
```

The stored `balance` on the new observation is the updated delegate balance. This is why a transfer both changes the current balance and establishes the correct starting point for future time integration.

## How a TWAB is queried

For a range `[start, end]`, V5:

1. snaps timestamps to period ends on or after the requested times;
2. finds the observation at or before each endpoint using the ring buffer;
3. creates temporary endpoint observations when an exact checkpoint is absent;
4. extrapolates cumulative balance using the last known balance;
5. computes:

```text
TWAB = (endCumulative - startCumulative) / (endTimestamp - startTimestamp)
```

PoolTogether asks for two values over the same draw range:

```text
userTwab          = TWAB(vault, user, drawRange)
vaultTotalAverageSupply = TWAB(vault, totalSupply, drawRange)
```

The Prize Pool then feeds those values into the winning-zone calculation. The denominator is therefore a historical average total supply, not a snapshot at draw execution.

## What the confidential version must preserve

The economic invariant is not “encrypt the current balance.” It is:

```text
the encrypted user time integral and encrypted total-supply time integral
must produce the same averages as the public V5 reference for the same history
```

The following can remain public in a bounded design:

- period length and period offset;
- period boundaries and draw timestamps;
- vault address and account address;
- observation indices/cardinality, if their publication is acceptable;
- draw range and public aggregate parameters.

The following are candidates for encryption:

- user balance and delegate balance;
- cumulative balance values;
- the resulting user TWAB;
- the resulting total-supply TWAB if aggregate supply is also private;
- the winning zone and winner result.

## Practical design options

### Option 1: encrypted observation ring buffer

Mirror V5's ring buffer with encrypted balances and cumulative balances. This is closest to the reference implementation, but expensive: every balance update may create several FHE operations and every historical query may require encrypted subtraction, multiplication by time, and division.

### Option 2: encrypted draw epochs

Choose a fixed draw period and maintain one encrypted contribution accumulator per user per finalized draw epoch. At draw close, finalize the epoch and use that ciphertext directly as the user's draw weight. This is cheaper and easier to reason about, but it is a deliberate adaptation rather than a byte-for-byte TWAB port.

### Option 3: public period metadata plus encrypted balance checkpoints

Keep the period schedule and checkpoint positions public, but encrypt only the balance fields and cumulative values. This preserves the V5 query shape while accepting metadata leakage about when accounts changed.

## MVP recommendation

Do not port the full 17,520-slot V5 ring buffer into FHE for the bounty MVP. Use a fixed draw epoch with encrypted user contribution and an encrypted aggregate contribution, and clearly state that it preserves the draw-period probability model rather than full arbitrary historical lookup.

The implementation must still include a plaintext reference model that compares the epoch calculation with V5's formula for deposits, withdrawals, and mid-period balance changes. The current encrypted slice remains a feasibility harness until that model exists.

## Sources inspected

- [`TwabController.sol`](./_repos/pt-v5-twab-controller/src/TwabController.sol)
- [`TwabLib.sol`](./_repos/pt-v5-twab-controller/src/libraries/TwabLib.sol)
- [`TwabERC20.sol`](./_repos/pt-v5-vault/src/TwabERC20.sol)
- [`PrizePool.sol`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)
- [`TierCalculationLib.sol`](./_repos/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol)

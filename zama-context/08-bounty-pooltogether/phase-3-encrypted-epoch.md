# Phase 3 encrypted epoch experiment

## Status

The fixed draw-epoch accumulator passes its focused FHEVM tests. It is the first encrypted implementation that preserves the important TWAB property: balance changes are weighted by how long the balance was held during the draw interval.

Implementation: [`Phase3EncryptedEpochAccumulator.sol`](../fhevm/library-solidity/examples/Phase3EncryptedEpochAccumulator.sol)

Tests: [`Phase3EncryptedEpochAccumulator.ts`](../fhevm/library-solidity/test/phase2/Phase3EncryptedEpochAccumulator.ts)

## State model

For each user, the experiment stores encrypted:

```text
balance
cumulativeBalance
twab
```

It stores only timestamps and finalization flags publicly. The aggregate side maintains the same encrypted balance and cumulative-balance fields for the whole pool.

On every encrypted deposit or withdrawal, it first accrues:

```text
cumulativeBalance += balance × (currentTime - lastUpdatedTime)
```

At epoch close:

```text
twab = cumulativeBalance / (epochEnd - epochStart)
```

The division denominator is public and fixed for the epoch, so this experiment avoids the expensive private-denominator path measured earlier.

## Vectors passed

| Scenario | Expected encrypted TWAB | Result |
| --- | ---: | --- |
| Deposit `100` at time `90` in a `0..100` epoch | `10` | Pass |
| Deposit `100` at `0`, withdraw `80` at `40` | `52` | Pass |
| Aggregate supply follows the same timeline | matching aggregate average | Pass |
| Another user attempts to decrypt the user TWAB | unauthorized | Pass |
| Encrypted user TWAB + public denominator + reduced random | encrypted winner bit | Pass |

## Boundary and limitations

This is a bounded epoch accumulator, not a full V5 `TwabController` port. It does not have the 17,520-slot ring buffer, arbitrary historical queries, delegation to the sponsorship address, period snapping, or V5's one-observation-per-period overwrite behavior.

The product-shaped slice now replaces its encrypted current-balance stand-in with this finalized epoch TWAB and feeds the result into the existing V5-style winner-zone calculation.

## Composition decision still open

The encrypted aggregate TWAB is useful for private accounting, but Candidate A's inexpensive winner test needs a public denominator to reduce the draw randomness before the encrypted comparison. We therefore still need to choose one of three explicit boundaries:

1. use a public draw-scoped aggregate denominator and keep the aggregate epoch accumulator as an auditable private diagnostic;
2. publicly decrypt the finalized aggregate TWAB with a protocol decryption proof;
3. reduce randomness against the encrypted aggregate, accepting the much higher private-division cost measured in Phase 2.

The current MVP recommendation remains option 1. It preserves the low-cost V5 comparison while making the aggregate privacy limitation explicit.

That composition now passes in `Phase3EncryptedEpochAccumulator.sol`: with an epoch-average user TWAB of `10`, public denominator `10`, 50% contribution fraction, and reduced random values `4` and `5`, the encrypted results are respectively `true` and `false`. The winner handle is granted to the account only.

The existing `ConfidentialPoolTogetherSlice` now contains the epoch lifecycle, transcript reduction, encrypted prize reserve, confidential-token settlement, and an operator-restricted commit/reveal draw lifecycle. The remaining work is production hardening: unbiased entropy, real yield integration, multi-draw state, and live transfer testing.

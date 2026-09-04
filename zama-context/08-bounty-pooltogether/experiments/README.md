# Phase 2 primitive harness

This directory documents the research harness location and purpose. The harness is kept beside the pinned FHEVM checkout because it depends on FHEVM's local host-contract deployment and mocked coprocessor test setup.

## Code

- [`Phase2WinnerPrimitive.sol`](../../fhevm/library-solidity/examples/Phase2WinnerPrimitive.sol)
- [`Phase2WinnerPrimitive.fixture.ts`](../../fhevm/library-solidity/test/phase2/Phase2WinnerPrimitive.fixture.ts)
- [`Phase2WinnerPrimitive.ts`](../../fhevm/library-solidity/test/phase2/Phase2WinnerPrimitive.ts)
- [`Phase2AccountingClaimPrimitive.sol`](../../fhevm/library-solidity/examples/Phase2AccountingClaimPrimitive.sol)
- [`Phase2AccountingClaimPrimitive.fixture.ts`](../../fhevm/library-solidity/test/phase2/Phase2AccountingClaimPrimitive.fixture.ts)
- [`Phase2AccountingClaimPrimitive.ts`](../../fhevm/library-solidity/test/phase2/Phase2AccountingClaimPrimitive.ts)
- [`Phase2PrivateDenominatorPrimitive.sol`](../../fhevm/library-solidity/examples/Phase2PrivateDenominatorPrimitive.sol)
- [`Phase2PrivateDenominatorPrimitive.fixture.ts`](../../fhevm/library-solidity/test/phase2/Phase2PrivateDenominatorPrimitive.fixture.ts)
- [`Phase2PrivateDenominatorPrimitive.ts`](../../fhevm/library-solidity/test/phase2/Phase2PrivateDenominatorPrimitive.ts)

## What it tests

- encrypted user TWAB input;
- V5-style fixed-point winning-zone arithmetic;
- public reduced-random comparison;
- encrypted fixed-domain randomness;
- ACL permissions;
- winner-only user decryption;
- protection of the intermediate winning zone.
- deterministic fixed-domain probability-error vectors;
- local HCU and native-gas signals for the isolated Candidate A and Candidate B paths.
- encrypted balance updates, encrypted withdrawal requests, and an encrypted non-reverting claim surface.

## Run

From `zama-context/fhevm/library-solidity`:

```text
set -a; source .env.example; set +a; npm test -- --grep '^Phase2WinnerPrimitive'
```

This is a primitive experiment, not a PoolTogether contract or product prototype.

The latest focused run passed 6 tests. It reported approximately 4,057,032 HCU for Candidate A and 174,000 HCU for Candidate B in the local FHEVM executor. These values are useful for relative comparison only; they are not deployment estimates.

The accounting/claim harness is intentionally separate from that count. It tests whether plaintext amounts and winner booleans can be omitted from application events, whether a non-winner claim can complete without a public revert, and whether only the relevant user can decrypt the resulting claimable amount.

Its latest focused run passed 3 tests and reported 259,032 HCU for deposit, 535,032 HCU for withdrawal accounting, and approximately 272,000 HCU for both winner and non-winner claims. Native gas was approximately 247,500, 342,000, 280,800, and 289,200 respectively, and differed between the two claim calls, so the harness does not establish side-channel resistance.

The private-denominator harness uses fixed-round encrypted long division in a deliberately small `euint16` domain. It tests whether `floor(numerator / encryptedDenominator)` can be computed without `FHE.div`'s plaintext-divisor requirement. Its result is a feasibility measurement, not a production recommendation.

The private-denominator run passed 3 tests after the mocked coprocessor indexer was made sequential. Exact division required four continuation transactions after initialization; the final four-round chunk reported 3,688,256 HCU and 2,013,000 maximum depth. This establishes feasibility in a bounded domain but makes the multi-transaction trade-off explicit.

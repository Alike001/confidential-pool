# Rolling epochs and candidate final ABI

## Status

The recurring-pool candidate is implemented locally in:

- `zama-context/fhevm/library-solidity/examples/ConfidentialPoolEpochAccounting.sol`
- `zama-context/fhevm/library-solidity/examples/ConfidentialPoolTogether.sol`
- nested FHEVM commit `c02c378`

It compiles and passes ten focused FHE tests: seven core recurring tests plus three adversarial tests. The original 14-test fixed-epoch suite and the first five rolling tests passed together (`19 passing`); the two later recurring-specific tests and the three adversarial tests also passed in focused runs. This candidate has not yet been deployed to Sepolia and does not replace the hardened fixed-epoch evidence deployment.

## Why the ABI changed

The fixed-epoch slice accepted `aggregateSupply` from the draw operator. The encrypted total TWAB could be inspected in local diagnostics, but the contract did not cryptographically prove that the public denominator supplied at draw commit was the decryption of that encrypted total.

The recurring candidate closes that trust gap:

1. The contract finalizes encrypted total TWAB for each epoch.
2. `requestAggregateDecryption(epochId)` marks that exact ciphertext publicly decryptable.
3. An offchain caller asks the Zama relayer/KMS for the clear value and proof.
4. `finalizeAggregateSupply(epochId, aggregateSupply, proof)` verifies the ordered handle/value pair with `FHE.checkSignatures`.
5. `commitDrawFromRng` reads the verified denominator from storage; the operator can no longer pass a different supply.

Public decryption is intentional because the selected privacy model keeps the aggregate denominator public while protecting individual balances, TWABs, winning zones, and payouts.

## Epoch model

Epochs have a fixed duration and continuous boundaries:

```text
epoch 1: [firstEpochStart, firstEpochStart + duration)
epoch 2: [epoch 1 end, epoch 1 end + duration)
epoch n: [previous end, previous end + duration)
```

`advanceEpoch()` is permissionless and advances one epoch per call. If a deployment is stale by several epochs, any caller can advance it repeatedly. Deposits and withdrawals require the current epoch to be open, preventing a balance change from being assigned retroactively to an elapsed epoch.

The encrypted principal balance carries across epochs. Each epoch stores separate encrypted user and total cumulative balances and TWABs.

## Sequential user checkpoints

A balance carried into later epochs cannot be changed until its elapsed user epochs are finalized in order. This preserves historical TWAB correctness without looping over an unbounded number of epochs inside a deposit or withdrawal.

Example:

```text
deposit in epoch 1
        ↓
epoch 1 ends and epoch 2 starts
        ↓
finalizeUser(1, account)
        ↓
deposit or withdraw during epoch 2
```

Anyone can call `finalizeUser`, so a user does not depend on an operator. The frontend must read `nextEpochToFinalize(account)` and present required checkpoint transactions before a new balance-changing action.

This is a bounded liveness tradeoff: a user who ignores many epochs may need several permissionless checkpoint transactions. A full PoolTogether-style observation ring buffer could avoid that UX but would materially expand FHE state and complexity.

## Candidate write ABI

### Constructor

```solidity
constructor(
    IRollingConfidentialToken payoutToken,
    IConfidentialRngProvider rngProvider,
    IConfidentialRngCoordinator rngCoordinator,
    uint64 firstEpochStart,
    uint64 epochDuration
)
```

### User and epoch operations

```solidity
onConfidentialTransferReceived(operator, from, amount, data)
requestWithdrawal(encryptedAmount, inputProof)
advanceEpoch()
finalizeUser(epochId, account)
requestAggregateDecryption(epochId)
finalizeAggregateSupply(epochId, aggregateSupply, decryptionProof)
```

### Draw and claim operations

```solidity
commitDrawFromRng(
    epochId,
    tierOdds,
    vaultContributionFraction,
    rngRequestId,
    encryptedPrize,
    inputProof
)
finalizeDrawFromRng(epochId)
claimPrize(epochId, tier, prizeIndex)
```

The draw identifier is the epoch identifier for the bounded submission. This gives the coordinator one unambiguous `epochId → RNG request` binding and prevents multiple competing draws for one epoch.

## Candidate read ABI

```solidity
currentEpochId()
epochDuration()
epochInfo(epochId)
drawInfo(epochId)
nextEpochToFinalize(account)
encryptedBalance(account)
encryptedUserTwab(epochId, account)
encryptedTotalTwab(epochId)
encryptedYieldReserve()
encryptedClaimablePrize(account, epochId, tier, prizeIndex)
claimed(account, epochId, tier, prizeIndex)
rngRequestUsed(requestId)
```

## Events for frontend and audit

```text
EpochStarted
UserEpochFinalized
AggregateDecryptionRequested
AggregateSupplyFinalized
EncryptedDeposit
EncryptedYieldFunded
EncryptedWithdrawalRequested
DrawRngCommitted
DrawOpened
EncryptedClaimRequested
```

Amount-bearing user events remain encrypted or amount-free. The public aggregate, epoch windows, RNG request, random word, draw parameters, account participation/claim identity, transaction timing, and gas remain public metadata.

## Verified local behaviors

1. Encrypted principal carries from epoch 1 into epoch 2.
2. Separate user TWABs are correct across recurring epochs.
3. A balance change after rollover requires sequential checkpointing.
4. A forged aggregate value fails KMS signature verification.
5. A draw cannot commit before the aggregate denominator is finalized.
6. A winning claim settles an encrypted payout.
7. A non-winning claim completes and stores encrypted zero.
8. Partial encrypted withdrawal works during an open epoch.
9. A second-epoch withdrawal produces the correct second-epoch TWAB.
10. The original hardened fixed-epoch tests remain green.
11. Weighted two-user winner/non-winner claims retain identical public calldata, application log shape, and gas.
12. Consecutive epoch draws require distinct coordinator-bound RNG requests.
13. Any keeper can complete a draw after its delayed or previously failed RNG request recovers.

## Frontend lifecycle implied by the ABI

```text
open epoch
  → encrypt deposit / withdrawal
  → epoch closes
  → finalize user TWAB when needed
  → request aggregate public decryption
  → obtain KMS proof
  → finalize public denominator
  → request coordinator-bound Chainlink RNG
  → commit encrypted prize
  → permissionlessly open draw
  → submit normal-shaped claim
  → authorize user decryption of payout
  → advance / continue next epoch
```

The landing and application experience remain one route. The first viewport should show the current epoch, any checkpoint requirement, the primary deposit/withdraw action, private position, and draw state.

## Remaining freeze gates

- Run the complete fixed-epoch and recurring suites together as one final local regression.
- Add operational relayer/KMS timeout and public-decryption retry handling to the keeper/frontend path.
- Measure gas/HCU for epoch advance, user checkpoint, public-decryption request/finalization, and draw/claim.
- Decide and document real yield versus controlled encrypted yield.
- Add deployment, public-decryption keeper, draw, and strict-auditor scripts for this ABI.
- Run a complete multi-wallet lifecycle on a fresh Sepolia deployment.
- Verify deployed source and publish the final versioned manifest before wiring production frontend writes.

## Current decision

Use this recurring/KMS-proven architecture as the candidate final submission ABI. Keep the fixed-epoch contract and deployment as historical evidence until the recurring version passes the remaining freeze gates and a fresh Sepolia lifecycle.

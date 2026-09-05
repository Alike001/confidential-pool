# Recurring Sepolia Runbook

> Historical deployment guide. Pool `0x31ceb5d5de22e28d2D985e594665524ca61f5628` is superseded and must not receive new lifecycle transactions. Follow [`final-recurring-runbook.md`](./final-recurring-runbook.md) for the active two-wallet release candidate.

## Status

This document records the first recurring deployment at `0x31ceb5d5de22e28d2D985e594665524ca61f5628` in block `11636762`. It proved recurring epoch and aggregate-finalization mechanics but reused a coordinator draw slot, so it is historical evidence only.

The complete public deployment record is in [`recurring-sepolia-deployment.md`](./recurring-sepolia-deployment.md).

All commands below include the required directory. Store real RPC and wallet values only in `.env`; never commit them.

## 1. Configure

Use `scripts/recurring-sepolia.env.example` as the variable checklist. Set `POOL_FIRST_EPOCH_START` to a future Unix timestamp and `POOL_EPOCH_DURATION` to the recurring cadence in seconds. The coordinator must be fresh for this pool: draw ID `1` must be unbound. The deployment script now rejects reused coordinators before estimating or broadcasting a pool deployment.

## 2. Dry-run deployment

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
DEPLOY_BROADCAST=false npx hardhat run scripts/deployRecurringConfidentialPoolTogetherSepolia.ts --network sepolia
```

When the token, RNG, coordinator, epoch start, duration, expected pool address, and gas estimate are correct, rerun with `DEPLOY_BROADCAST=true`. Record the pool address, transaction hash, and deployment block in `.env` and the final deployment manifest.

## 3. Deposit and fund the controlled-yield reserve

The existing confidential token scripts are ABI-compatible with the recurring pool:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
SETUP_BROADCAST=false DEPOSIT_BROADCAST=true npx hardhat run scripts/liveSepoliaDeposit.ts --network sepolia
```

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
YIELD_SETUP_BROADCAST=false YIELD_FUND_BROADCAST=true npx hardhat run scripts/liveSepoliaFundYield.ts --network sepolia
```

The reserve is still controlled/operator-funded. Do not label it strategy-generated yield.

## 4. Close and advance the epoch

After the epoch end, inspect first:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
EPOCH_ACTION=inspect EPOCH_ID=1 EPOCH_BROADCAST=false npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

Then advance the current epoch. Anyone may execute this keeper action:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
EPOCH_ACTION=advance EPOCH_ID=1 EPOCH_BROADCAST=true npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

## 5. Finalize user and public aggregate TWABs

Checkpoint each participating user sequentially:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
EPOCH_ACTION=finalize-user EPOCH_ID=1 EPOCH_ACCOUNT=0xUSER EPOCH_BROADCAST=true npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

Authorize the aggregate TWAB for public KMS decryption:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
EPOCH_ACTION=request-aggregate EPOCH_ID=1 EPOCH_BROADCAST=true npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

After relayer propagation, retrieve the KMS result and submit its proof. The script retries transient not-ready responses using the configured `KMS_*` values:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
EPOCH_ACTION=finalize-aggregate EPOCH_ID=1 EPOCH_BROADCAST=true npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

## 6. Request RNG and run the draw

Use the existing Foundry coordinator request from `/home/ali/Desktop/zama/confidential-pooltogether`, with draw ID equal to the epoch ID. Return here after Chainlink assigns the request ID.

Inspect and commit the draw:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
DRAW_ACTION=commit DRAW_ID=1 DRAW_BROADCAST=true npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia
```

Once the provider reports fulfillment, finalize permissionlessly:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
DRAW_ACTION=finalize DRAW_ID=1 DRAW_BROADCAST=true npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia
```

## 7. Prepare, settle, and inspect a claim

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
DRAW_ACTION=prepare-claim DRAW_ID=1 DRAW_BROADCAST=true npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia
```

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
DRAW_ACTION=claim DRAW_ID=1 DRAW_BROADCAST=true npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia
```

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
DRAW_ACTION=inspect-claim DRAW_ID=1 DRAW_BROADCAST=false npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia
```

## 8. Withdraw principal

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
WITHDRAW_BROADCAST=true npx hardhat run scripts/liveSepoliaWithdraw.ts --network sepolia
```

If the wallet has missed epoch checkpoints, finalize those epochs in order before retrying the withdrawal.

## 9. Run the strict auditor

Fill the `AUDIT_*` expected values from the planned lifecycle, then run:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a
AUDIT_REQUIRE_COMPLETE=true npx hardhat run scripts/auditRecurringSepoliaLifecycle.ts --network sepolia
```

The release passes only when the final line is:

```text
RECURRING_LIFECYCLE_COMPLETE: true
```

The auditor rejects missing bytecode, incorrect immutable wiring, broken epoch continuity, an unverified aggregate denominator, RNG provenance mismatches, missing or duplicate lifecycle events, incorrect ordering, incomplete two-step claims, and incorrect decrypted end balances.

## Remaining operational gate

Before frontend writes are enabled, complete this lifecycle with at least two wallets and two epochs on Sepolia, make the strict auditor return `true`, verify source code, and record every transaction in a deployment manifest.

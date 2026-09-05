# Final recurring Sepolia runbook

This is the authoritative two-wallet release sequence for the refund-safe final candidate. The addresses are frozen, but frontend writes remain disabled until this run completes and both strict user audits pass.

```text
pool:        0xE0d284649E955d03B02F3cf927D60271d41C52D1
coordinator: 0xa90A46B27147C532Bb6844d49d285FEba9819074
adapter:     0x2387Ac275b6ADa26959c587d93abFbd491A64D5A
wallet A:    0xdE67A35B322e5A31e8215B5245CA4e48d7977F71
wallet B:    0x46854AC6B18C384C9a0b0b3aB7bF27a6fCE6c16a
epoch 1:     1788607872 → 1788611472
epoch 2:     1788611472 → 1788615072
```

Never retry a broadcast after a timeout or connection reset until the transaction receipt or resulting contract state has been inspected. Execute one gate at a time.

## 1. Close and finalize an epoch

Set `TARGET_EPOCH=1` for the first pass and `TARGET_EPOCH=2` for the second.

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

TARGET_EPOCH=1
EPOCH_ACTION=inspect EPOCH_ID="$TARGET_EPOCH" EPOCH_BROADCAST=false \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

Continue only when the reported latest timestamp is at or beyond the epoch end. Advance once, then checkpoint both wallets in order:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

TARGET_EPOCH=1
EPOCH_ACTION=advance EPOCH_ID="$TARGET_EPOCH" EPOCH_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia

EPOCH_ACTION=finalize-user EPOCH_ID="$TARGET_EPOCH" \
EPOCH_ACCOUNT=0xdE67A35B322e5A31e8215B5245CA4e48d7977F71 \
EPOCH_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia

SEPOLIA_PRIVATE_KEY="$SEPOLIA_SECOND_PRIVATE_KEY" \
EPOCH_ACTION=finalize-user EPOCH_ID="$TARGET_EPOCH" \
EPOCH_ACCOUNT=0x46854AC6B18C384C9a0b0b3aB7bF27a6fCE6c16a \
EPOCH_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

Authorize and KMS-finalize the public aggregate:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

TARGET_EPOCH=1
EPOCH_ACTION=request-aggregate EPOCH_ID="$TARGET_EPOCH" EPOCH_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia

EPOCH_ACTION=finalize-aggregate EPOCH_ID="$TARGET_EPOCH" EPOCH_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

Expected epoch-1 aggregate: `1773333`. Expected encrypted user TWABs are `936666` for wallet A and `836666` for wallet B. The aggregate is one unit above the sum of the individually floored user values because the total accumulator sums both time-weighted numerators before its single final division.

## 2. Request post-close randomness

Re-estimate the fee after closure:

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a

gas_price=$(cast gas-price --rpc-url "$SEPOLIA_RPC_URL")
cast call 0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1 \
  "estimateRequestPriceNative(uint32,uint32,uint256)(uint256)" \
  100000 1 "$gas_price" \
  --rpc-url "$SEPOLIA_RPC_URL"
```

Set `SEPOLIA_DRAW_ID` to the target epoch and set `SEPOLIA_RNG_REQUEST_FUNDING_WEI` above the quote. Simulate first, then broadcast exactly once:

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a

forge script script/RequestChainlinkDraw.s.sol:RequestChainlinkDraw \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY"

forge script script/RequestChainlinkDraw.s.sol:RequestChainlinkDraw \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY" \
  --broadcast
```

Recover the authoritative request ID:

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a

cast call "$SEPOLIA_RNG_COORDINATOR_CONTRACT" \
  "getDrawRequest(uint64)((uint32,uint256,uint256,bool))" \
  "$SEPOLIA_DRAW_ID" \
  --rpc-url "$SEPOLIA_RPC_URL"
```

Copy that nonzero request ID into `DRAW_RNG_REQUEST_ID` in `/home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env`. Require `bound=true`, a request timestamp at or after the epoch end, `isRequestComplete=true`, and `isRequestFailed=false` before continuing.

## 3. Commit, open, and claim

For each write below, run once with `DRAW_BROADCAST=false`; broadcast only after the dry run succeeds.

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

TARGET_EPOCH=1
DRAW_ACTION=commit DRAW_ID="$TARGET_EPOCH" DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia

DRAW_ACTION=finalize DRAW_ID="$TARGET_EPOCH" DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia

DRAW_ACTION=prepare-claim DRAW_ID="$TARGET_EPOCH" DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia

DRAW_ACTION=claim DRAW_ID="$TARGET_EPOCH" DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia

SEPOLIA_PRIVATE_KEY="$SEPOLIA_SECOND_PRIVATE_KEY" \
DRAW_ACTION=prepare-claim DRAW_ID="$TARGET_EPOCH" DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia

SEPOLIA_PRIVATE_KEY="$SEPOLIA_SECOND_PRIVATE_KEY" \
DRAW_ACTION=claim DRAW_ID="$TARGET_EPOCH" DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia
```

Run `DRAW_ACTION=inspect-claim` with `DRAW_BROADCAST=false` separately for each wallet to record its owner-authorized payout and current confidential-token balance.

## 4. Withdraw and audit

After both epoch-1 claims settle, dry-run and broadcast `scripts/liveSepoliaWithdraw.ts` for each wallet to withdraw `1000000` principal units during epoch 2.

Finally run `scripts/auditRecurringSepoliaLifecycle.ts` separately for both wallets against epoch 1. Supply the exact expected aggregate, user TWAB, payout, final wallet balance, initial zero reserve handle, and `AUDIT_EXPECTED_YIELD_FUNDING_COUNT=1`. The operator remains wallet A through `POOL_DRAW_OPERATOR_ADDRESS`; `AUDIT_ACCOUNT` selects the user being audited. Promotion requires both strict runs to print:

```text
RECURRING_LIFECYCLE_COMPLETE: true
```

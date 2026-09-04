# Hardened Sepolia lifecycle runbook

This runbook is only for the provenance-version-1 deployment:

```text
pool:        0xF99747C771c09909f6Ad56F43D742c7757ECD9E0
coordinator: 0xabc4d6ca46A91cFF083cD0086B81337adC7ed6cA
adapter:     0x2387Ac275b6ADa26959c587d93abFbd491A64D5A
operator:    0xdE67A35B322e5A31e8215B5245CA4e48d7977F71
draw:        1
epoch end:   1788553090
TWAB:        831388
prize:       100000 encrypted cUSDTMock units
```

Run one numbered section at a time. Never retry a broadcast merely because the RPC connection drops; first inspect the transaction, coordinator binding, or contract state. Every command begins in the directory whose ignored `.env` it consumes.

## 1. Confirm the epoch is closed

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a

latest=$(cast block latest --field timestamp --rpc-url "$SEPOLIA_RPC_URL")
end=$(cast call "$SEPOLIA_POOL_CONTRACT" \
  "epochEnd()(uint64)" \
  --rpc-url "$SEPOLIA_RPC_URL" | awk '{print $1}')

echo "Sepolia timestamp: $latest"
echo "epoch end:         $end"
echo "remaining:         $((end-latest)) seconds"
```

Do not continue until `remaining` is zero or negative. The request script independently enforces the same gate.

## 2. Re-estimate native VRF funding

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a

gas_price=$(cast gas-price --rpc-url "$SEPOLIA_RPC_URL")
quote=$(cast call 0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1 \
  "estimateRequestPriceNative(uint32,uint32,uint256)(uint256)" \
  100000 1 "$gas_price" \
  --rpc-url "$SEPOLIA_RPC_URL" | awk '{print $1}')

echo "gas price:          $gas_price"
echo "VRF quote:          $quote wei"
echo "configured funding: $SEPOLIA_RNG_REQUEST_FUNDING_WEI wei"
```

The configured funding must exceed the quote with a reasonable gas-price margin. Excess payment is refunded by the adapter to the coordinator, but this bounded coordinator has no refund-withdrawal function; that is a known production gap.

## 3. Simulate the request

This performs no live write because `--broadcast` is absent:

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a

forge script script/RequestChainlinkDraw.s.sol:RequestChainlinkDraw \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY"
```

The simulation must pass its closed-epoch, pool, coordinator, adapter, operator, provenance-version, funding, and unused-draw checks.

## 4. Broadcast exactly one request

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a

forge script script/RequestChainlinkDraw.s.sol:RequestChainlinkDraw \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY" \
  --broadcast
```

Record the transaction hash and returned local `requestId`. Do not assume it is `4` even though that is the expected next adapter ID.

## 5. Recover the authoritative request ID

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

The tuple is `(requestId, requestedAtBlock, requestedAtTimestamp, bound)`. Require a nonzero request ID, a timestamp at or after `1788553090`, and `bound == true`. Put that exact ID into `SEPOLIA_RNG_REQUEST_ID` in `/home/ali/Desktop/zama/confidential-pooltogether/.env` and `DRAW_RNG_REQUEST_ID` in `/home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env`.

## 6. Check fulfillment

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a

cast call "$SEPOLIA_RNG_ADAPTER_CONTRACT" \
  "isRequestComplete(uint32)(bool)" \
  "$SEPOLIA_RNG_REQUEST_ID" \
  --rpc-url "$SEPOLIA_RPC_URL"

cast call "$SEPOLIA_RNG_ADAPTER_CONTRACT" \
  "isRequestFailed(uint32)(bool)" \
  "$SEPOLIA_RNG_REQUEST_ID" \
  --rpc-url "$SEPOLIA_RPC_URL"
```

Continue only when complete is `true` and failed is `false`. Then read the public random word:

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a

cast call "$SEPOLIA_RNG_ADAPTER_CONTRACT" \
  "randomNumber(uint32)(uint256)" \
  "$SEPOLIA_RNG_REQUEST_ID" \
  --rpc-url "$SEPOLIA_RPC_URL"
```

## 7. Commit the encrypted draw

Dry run first:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

DRAW_ACTION=commit \
DRAW_BROADCAST=false \
npx hardhat run scripts/liveSepoliaDraw.ts --network sepolia
```

After the dry run reports draw `1`, aggregate TWAB `831388`, the authoritative request ID, and a successful gas estimate, broadcast:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

DRAW_ACTION=commit \
DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaDraw.ts --network sepolia
```

## 8. Open the draw

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

DRAW_ACTION=finalize \
DRAW_BROADCAST=false \
npx hardhat run scripts/liveSepoliaDraw.ts --network sepolia
```

If estimation succeeds, broadcast from the same required directory:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

DRAW_ACTION=finalize \
DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaDraw.ts --network sepolia
```

## 9. Finalize the user's encrypted TWAB

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

DRAW_ACTION=finalize-user \
DRAW_BROADCAST=false \
npx hardhat run scripts/liveSepoliaDraw.ts --network sepolia
```

If estimation succeeds, broadcast from the same required directory:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

DRAW_ACTION=finalize-user \
DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaDraw.ts --network sepolia
```

## 10. Claim and decrypt the private result

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

DRAW_ACTION=claim \
DRAW_BROADCAST=false \
npx hardhat run scripts/liveSepoliaDraw.ts --network sepolia
```

If estimation succeeds, broadcast from the same required directory:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

DRAW_ACTION=claim \
DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaDraw.ts --network sepolia
```

If the RPC disconnects after printing a transaction hash, do not retry. Recover state read-only:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

DRAW_ACTION=inspect-claim \
DRAW_BROADCAST=false \
npx hardhat run scripts/liveSepoliaDraw.ts --network sepolia
```

For this one-user, full-odds fixture, the expected winner-only decrypted payout is `100000`.

## 11. Withdraw principal

Dry run first:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

WITHDRAW_BROADCAST=false \
npx hardhat run scripts/liveSepoliaWithdraw.ts --network sepolia
```

Then broadcast only if the script decrypts `1000000` pool principal and estimates successfully:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

WITHDRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaWithdraw.ts --network sepolia
```

The final conservation target is zero user principal remaining in the pool and a wallet cUSDTMock balance increased by the `1000000` returned principal while retaining the claimed prize.

## 12. Run the read-only completion audit

The auditor derives the request ID from the coordinator, decodes every lifecycle event, cross-checks the opened aggregate and random word, and decrypts only the user's authorized principal, payout, and wallet balance. It sends no transaction.

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
set -a
source .env
set +a

AUDIT_REQUIRE_COMPLETE=true \
npx hardhat run scripts/auditSepoliaLifecycle.ts --network sepolia
```

Completion requires the final line `HARDENED_LIFECYCLE_COMPLETE: true`. A pre-draw baseline run returned `false` while correctly recovering the existing `1000000` encrypted principal, `1000000` wallet cUSDTMock, exact deposit and yield transaction hashes, empty request binding, and no draw/claim/withdrawal events.

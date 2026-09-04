# Sepolia RNG smoke test

These scripts exercise only the randomness boundary. They do not deploy the FHEVM pool, the confidential token, or a yield source.

## Before running

Create a fresh Sepolia-only wallet. Never reuse a wallet holding real funds, and never send its private key to anyone. Copy the repository template into a local ignored file:

```sh
cp .env.example .env
set -a
source .env
set +a
```

Fund the wallet with Sepolia ETH from a faucet. Native VRF payment is charged by the wrapper, so the wallet needs enough ETH for deployment gas and the randomness request. The private key stays in the shell environment and is consumed only by Foundry.

## 1. Compile

```sh
forge build
```

## 2. Deploy the adapter and coordinator

Keep the deployer key outside the repository and provide an RPC URL through the shell or CI secret store:

```sh
export SEPOLIA_RPC_URL="..."
forge script script/DeployChainlinkRng.s.sol:DeployChainlinkRng \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY" \
  --broadcast
```

Record the emitted adapter and coordinator addresses. The script uses the Ethereum Sepolia VRF wrapper address pinned in `src/config/sepolia.mjs`.

## 3. Create one request

The request and draw binding must be in one transaction. `SEPOLIA_RNG_REQUEST_FUNDING_WEI` must cover the current native VRF price; do not hardcode a price in source code. Estimate it using the wrapper and current gas price:

```sh
gas_price=$(cast gas-price --rpc-url "$SEPOLIA_RPC_URL")
cast call 0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1 \
  "estimateRequestPriceNative(uint32,uint32,uint256)(uint256)" \
  100000 1 "$gas_price" \
  --rpc-url "$SEPOLIA_RPC_URL"
```

Add a safety margin for gas-price movement and deployment cost. A zero result from `calculateRequestPriceNative` under `eth_call` is not a usable funding quote because the wrapper price depends on the transaction gas price; use the explicit estimate method above.

```sh
export SEPOLIA_RNG_COORDINATOR_CONTRACT="0x..."
export SEPOLIA_DRAW_ID=1
export SEPOLIA_RNG_REQUEST_FUNDING_WEI="..."

forge script script/RequestChainlinkDraw.s.sol:RequestChainlinkDraw \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY" \
  --broadcast
```

## 4. Inspect completion

The provider callback is asynchronous. After Chainlink fulfills the request, inspect the adapter using the returned local request ID:

```sh
cast call "$ADAPTER" "isRequestComplete(uint32)(bool)" 1 --rpc-url "$SEPOLIA_RPC_URL"
cast call "$ADAPTER" "randomNumber(uint32)(uint256)" 1 --rpc-url "$SEPOLIA_RPC_URL"
```

The second call must only succeed after fulfillment. The current adapter's timeout is a local liveness policy and is not proof that the provider cryptographically failed.

## Current limitations

- This smoke test does not yet call the FHEVM draw contract.
- It does not implement PoolTogether's auction rewards or retries.
- The vendored Chainlink subset is pinned for review; it is not the complete npm package.
- A live request spends testnet native currency and should be run only with a dedicated test wallet.

# Sepolia RNG smoke test

These scripts exercise only the randomness boundary. They do not deploy the FHEVM pool, the confidential token, or a yield source.

## Before running

Create a fresh Sepolia-only wallet. Never reuse a wallet holding real funds, and never send its private key to anyone. Copy the repository template into a local ignored file:

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
cp .env.example .env
set -a
source .env
set +a
```

Fund the wallet with Sepolia ETH from a faucet. Native VRF payment is charged by the wrapper, so the wallet needs enough ETH for deployment gas and the randomness request. The private key stays in the shell environment and is consumed only by Foundry.

## 1. Compile

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
forge build
```

## 2. Deploy the adapter and coordinator

Keep the deployer key outside the repository and provide an RPC URL through the shell or CI secret store:

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
export SEPOLIA_RPC_URL="..."
forge script script/DeployChainlinkRng.s.sol:DeployChainlinkRng \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY" \
  --broadcast
```

Record the emitted adapter and coordinator addresses. The script uses the Ethereum Sepolia VRF wrapper address pinned in `src/config/sepolia.mjs`.

The adapter and coordinator have different jobs. Send the request to the coordinator address, then inspect completion on the adapter address. The deployment checkpoint and verified addresses are recorded in [`zama-context/08-bounty-pooltogether/sepolia-rng-deployment.md`](../../zama-context/08-bounty-pooltogether/sepolia-rng-deployment.md).

If a compatible adapter already exists, deploy only the provenance-version-1 coordinator:

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a
export SEPOLIA_RNG_ADAPTER_CONTRACT="0x..."
forge script script/DeployRngCoordinator.s.sol:DeployRngCoordinator \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY" \
  --broadcast
```

The coordinator records both the request block and timestamp atomically. A hardened pool checks that record against its epoch end and the configured adapter.

## 3. Create one request

The request and draw binding must be in one transaction. `SEPOLIA_RNG_REQUEST_FUNDING_WEI` must cover the current native VRF price; do not hardcode a price in source code. Estimate it using the wrapper and current gas price:

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

Add a safety margin for gas-price movement and deployment cost. A zero result from `calculateRequestPriceNative` under `eth_call` is not a usable funding quote because the wrapper price depends on the transaction gas price; use the explicit estimate method above.

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a
export SEPOLIA_OPERATOR_ADDRESS="0x..."
export SEPOLIA_POOL_CONTRACT="0x..."
export SEPOLIA_RNG_ADAPTER_CONTRACT="0x..."
export SEPOLIA_RNG_COORDINATOR_CONTRACT="0x..."
export SEPOLIA_DRAW_ID=1
export SEPOLIA_RNG_REQUEST_FUNDING_WEI="..."

forge script script/RequestChainlinkDraw.s.sol:RequestChainlinkDraw \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY" \
  --broadcast
```

The request script performs read-only checks before broadcasting: the pool epoch
has closed, the pool and coordinator expose the expected operator, the pool
points to the expected coordinator and adapter, provenance version `1`, nonzero
funding, and an unbound draw ID. A mismatch aborts before a request transaction
is sent. The coordinator still authenticates the actual transaction signer
onchain.

## 4. Inspect completion

The provider callback is asynchronous. First confirm the request ID atomically bound to the draw by the coordinator. Record that returned request ID as `SEPOLIA_RNG_REQUEST_ID`; never infer it from an earlier deployment:

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

Then inspect the configured adapter using that exact ID:

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

cast call "$SEPOLIA_RNG_ADAPTER_CONTRACT" \
  "randomNumber(uint32)(uint256)" \
  "$SEPOLIA_RNG_REQUEST_ID" \
  --rpc-url "$SEPOLIA_RPC_URL"
```

The `randomNumber` call must only be treated as usable after `isRequestComplete` is `true` and `isRequestFailed` is `false`. The current adapter's timeout is a local liveness policy and is not proof that the provider cryptographically failed.

## Current limitations

- This smoke test does not yet call the FHEVM draw contract.
- It does not implement PoolTogether's auction rewards or retries.
- The vendored Chainlink subset is pinned for review; it is not the complete npm package.
- A live request spends testnet native currency and should be run only with a dedicated test wallet.

# Sepolia RNG deployment checkpoint

## What happened

The Chainlink RNG adapter and atomic draw coordinator were deployed successfully to Ethereum Sepolia at block `11632465`.

| Component | Address | Evidence |
|---|---|---|
| `ChainlinkVrfRngAdapter` | `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A` | `callbackGasLimit()` returns `100000`; `i_vrfV2PlusWrapper()` returns the published Sepolia wrapper |
| `RngRequestCoordinator` | `0x9Ce976b5A46aC5d126e71bcDfdbBC7442d3489B5` | `getDrawRequest(1)` returns an empty request; its `rng()` points at the adapter |

The deployment transactions were:

- `0x4a0731ddebf22add186708b8f2926bc01e92585df71488702dddc42d6705570e`
- `0xf598844ca08fed25c203471cad8200599f8967fadd1ae29fff285b6dbe550ccc`

The first transaction created the adapter and the second created the coordinator, according to the transaction receipts and ABI behavior. If a Foundry summary displays the labels in the opposite order, use the receipt `contractAddress` plus the read-only checks above.

## Cost interpretation

The deployment consumed approximately `0.001411319395324458 ETH` in transaction gas across both deployments. This is separate from the Chainlink randomness fee.

The observed explicit native VRF estimate was `271554552416188` wei, approximately `0.000271554552 ETH`. That estimate changes with gas price. The request transaction also needs ordinary Sepolia gas, so a request funding value with a safety margin is appropriate. The adapter refunds unused request funding to the coordinator.

## Current state

No randomness request has been submitted yet:

- coordinator draw `1`: not bound;
- adapter local request `1`: incomplete because it does not exist yet.

The next request must be sent to the **coordinator**, not directly to the adapter. The logical draw ID is `1`; the local RNG request ID will be returned by the script, while Chainlink's wider provider ID remains internal to the adapter.

## Next commands

Run these from `confidential-pooltogether/` with the same Sepolia wallet used for deployment:

```sh
export SEPOLIA_RNG_COORDINATOR_CONTRACT=0x9Ce976b5A46aC5d126e71bcDfdbBC7442d3489B5
export ADAPTER=0x2387Ac275b6ADa26959c587d93abFbd491A64D5A
export SEPOLIA_DRAW_ID=1
export SEPOLIA_RNG_REQUEST_FUNDING_WEI=400000000000000

forge script script/RequestChainlinkDraw.s.sol:RequestChainlinkDraw \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY" \
  --broadcast
```

Then inspect the local request ID returned by the script:

```sh
cast call "$ADAPTER" "isRequestComplete(uint32)(bool)" 1 --rpc-url "$SEPOLIA_RPC_URL"
cast call "$ADAPTER" "randomNumber(uint32)(uint256)" 1 --rpc-url "$SEPOLIA_RPC_URL"
```

The first call should initially return `false`. The second call should revert until Chainlink fulfills the callback. After fulfillment, it should return a nonzero random word.

## Important limitation

This checkpoint proves deployment and the provider boundary only. The deployed coordinator is not yet connected to the confidential FHEVM pool, so a successful random callback will not yet open an encrypted PoolTogether draw.

## Sources

- [Chainlink VRF v2.5 supported networks](https://docs.chain.link/vrf/v2-5/supported-networks)
- [Chainlink VRF v2.5 getting started](https://docs.chain.link/vrf/v2-5/getting-started)

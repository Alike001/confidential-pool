# Sepolia RNG deployment checkpoint

## What happened

The Chainlink RNG adapter and atomic draw coordinator were deployed successfully to Ethereum Sepolia at block `11632465`.

The deployed coordinator is now historical: it records the request block but predates the timestamp/provenance-version fields required by the hardened pool. The adapter remains reusable. A fresh coordinator must be deployed before the next pool.

## Hardened coordinator deployment

A timestamp-aware coordinator was deployed against the existing adapter and verified onchain:

| Field | Value |
| --- | --- |
| Coordinator | `0xabc4d6ca46A91cFF083cD0086B81337adC7ed6cA` |
| Transaction | `0xb84f7e3ec39f2e392b6522827fa74ed5365507685a9fa1685e134f5a2a210736` |
| Block | `11634983` |
| Provenance version | `1` |
| RNG adapter | `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A` |
| Operator | `0xdE67A35B322e5A31e8215B5245CA4e48d7977F71` |
| Gas used | `370634` |

Read-only calls confirmed all three configuration values. This coordinator is the required provenance dependency for the next hardened pool; the original coordinator remains historical evidence only.

| Component                | Address                                      | Evidence                                                                                            |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ChainlinkVrfRngAdapter` | `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A` | `callbackGasLimit()` returns `100000`; `i_vrfV2PlusWrapper()` returns the published Sepolia wrapper |
| `RngRequestCoordinator`  | `0x9Ce976b5A46aC5d126e71bcDfdbBC7442d3489B5` | `getDrawRequest(1)` returns an empty request; its `rng()` points at the adapter                     |

The deployment transactions were:

- `0x4a0731ddebf22add186708b8f2926bc01e92585df71488702dddc42d6705570e`
- `0xf598844ca08fed25c203471cad8200599f8967fadd1ae29fff285b6dbe550ccc`

The first transaction created the adapter and the second created the coordinator, according to the transaction receipts and ABI behavior. If a Foundry summary displays the labels in the opposite order, use the receipt `contractAddress` plus the read-only checks above.

## Cost interpretation

The deployment consumed approximately `0.001411319395324458 ETH` in transaction gas across both deployments. This is separate from the Chainlink randomness fee.

The observed explicit native VRF estimate was `271554552416188` wei, approximately `0.000271554552 ETH`. That estimate changes with gas price. The request transaction also needs ordinary Sepolia gas, so a request funding value with a safety margin is appropriate. The adapter refunds unused request funding to the coordinator.

## Live request result

The first live request was submitted and fulfilled successfully.

| Observation          | Result                                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coordinator draw     | `1` bound to local request `1`                                                                                                                                             |
| Request transaction  | [`0x803e2e75f1ca1c06f645d884b272657f2568512849a0ab959e5e4eaf0e8eb7aa`](https://sepolia.etherscan.io/tx/0x803e2e75f1ca1c06f645d884b272657f2568512849a0ab959e5e4eaf0e8eb7aa) |
| Request block        | `11632527`                                                                                                                                                                 |
| Callback transaction | [`0xbe0db23b48dc0ac82ef6dffd6aa0e1a3df407cbc58b7acdd7152bf4df678e9fb`](https://sepolia.etherscan.io/tx/0xbe0db23b48dc0ac82ef6dffd6aa0e1a3df407cbc58b7acdd7152bf4df678e9fb) |
| Adapter completion   | `true`                                                                                                                                                                     |
| Random word          | `30893444001510450800972496451683106932918560680717279051904389633394519713945`                                                                                            |

The request transaction and callback were separate transactions, as expected for an asynchronous VRF provider. The random word is public entropy; it is not a balance, fee, or encrypted value.

Subsequent requests must be sent to the **coordinator**, not directly to the adapter. Coordinator draw ID `1` and local RNG request ID `1` were consumed by this smoke test. Chainlink's wider provider ID remains internal to the adapter.

## Next commands

Run these from `confidential-pooltogether/` with the same Sepolia wallet used for deployment:

```sh
export SEPOLIA_RNG_COORDINATOR_CONTRACT=0x9Ce976b5A46aC5d126e71bcDfdbBC7442d3489B5
export ADAPTER=0x2387Ac275b6ADa26959c587d93abFbd491A64D5A
export SEPOLIA_DRAW_ID=2
export SEPOLIA_RNG_REQUEST_FUNDING_WEI=400000000000000

forge script script/RequestChainlinkDraw.s.sol:RequestChainlinkDraw \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY" \
  --broadcast
```

Then inspect the local request ID returned by the script:

```sh
cast call "$ADAPTER" "isRequestComplete(uint32)(bool)" 2 --rpc-url "$SEPOLIA_RPC_URL"
cast call "$ADAPTER" "randomNumber(uint32)(uint256)" 2 --rpc-url "$SEPOLIA_RPC_URL"
```

The first call should initially return `false`. The second call should revert until Chainlink fulfills the callback. After fulfillment, it should return a nonzero random word.

Immediately before the second request, the wrapper estimate was `240310090715567` wei at gas price `963014621` wei. The configured `400000000000000` wei funding retains a safety margin, and the adapter refunds any excess to the coordinator.

## Second live request result

Coordinator draw ID `2` created adapter request ID `2` successfully:

| Observation          | Result                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| Request transaction  | `0xc2a3f7ed300d4d478eb1c2d0f1d54ffb3ebbc76f3ef22737f467f331dbe3ae7f`            |
| Request block        | `11634077`                                                                      |
| Callback transaction | `0xf81c990b61c3dba3dfac169266eb66ceea24c2f1fb68817f03964dc80dec3c57`            |
| Callback block       | `11634081`                                                                      |
| Adapter completion   | `true`                                                                          |
| Random word          | `87468147253494357102084847928792574748831858826098532431828595605665764920070` |

The pre-draw contract audit then superseded the pool because of realistic-scale fixed-point overflow and post-epoch withdrawal restrictions. Request `2` was never committed to that pool. It must not be reused for a replacement epoch because its public random word would be known before the replacement deposits; a new request is required after the corrected epoch closes.

## Corrected-epoch request result

After the corrected pool's epoch closed, coordinator draw ID `3` created adapter request ID `3`:

| Observation         | Result                                                                       |
| ------------------- | ---------------------------------------------------------------------------- |
| Request transaction | `0xda05db5be419425a930e52cd62b821f3ce7e053f7d5326a8b679fd43ce594e0a`         |
| Request block       | `11634464`                                                                   |
| Request timestamp   | `1788537540`, after epoch end `1788537136`                                   |
| Adapter completion  | `true`                                                                       |
| Adapter failure     | `false`                                                                      |
| Random word         | `60160812288156326909590926746516868176912866938967395740703180826601721750731` |

The request cost `0.000298867832633286 ETH` in transaction gas. Immediately beforehand, the wrapper quote was `268858746087406` wei, and the configured `400000000000000` wei request funding retained a safety margin. This request is eligible to be bound to corrected pool draw ID `1` because it was created only after the epoch and all deposits closed.

## Important limitation

This checkpoint proves deployment, three live provider callbacks, and post-epoch entropy timing. Adapter request `3` is configured for the confidential FHEVM pool but is not yet bound in the pool's draw state; that requires the separate encrypted-prize commit transaction.

## Sources

- [Chainlink VRF v2.5 supported networks](https://docs.chain.link/vrf/v2-5/supported-networks)
- [Chainlink VRF v2.5 getting started](https://docs.chain.link/vrf/v2-5/getting-started)

# Sepolia randomness provider boundary

## Research question

Can the current confidential PoolTogether slice replace its local RNG mock with a real, verifiable randomness provider on Ethereum Sepolia without changing the privacy boundary or claiming stronger fairness than the provider supplies?

## Verified PoolTogether interface

PoolTogether V5 deliberately separates draw management from the randomness implementation. Its `IRng` interface exposes four facts:

```solidity
requestedAtBlock(uint32 requestId) returns (uint256)
isRequestComplete(uint32 requestId) returns (bool)
isRequestFailed(uint32 requestId) returns (bool)
randomNumber(uint32 requestId) returns (uint256)
```

The current V5 `DrawManager` requires the RNG request to have been made in the same block as `startDraw`. It then waits for completion and passes `randomNumber(requestId)` into `PrizePool.awardDraw`. The request ID stored by PoolTogether is a `uint32`; a provider adapter may use a wider provider-native request ID internally.

This matters for our slice: `commitDrawFromRng` currently verifies that a request exists and is not from a future block, but it does not yet enforce V5's same-block rule or perform request creation and draw binding atomically. It is therefore an interface experiment, not a drop-in replacement for `DrawManager`.

## Sepolia candidate: Chainlink VRF v2.5

The current Chainlink supported-networks page lists Ethereum Sepolia for VRF v2.5. It publishes the following testnet configuration:

| Item | Ethereum Sepolia value |
|---|---|
| LINK token | `0x779877A7B0D9E8603169DdbD7836e478b4624789` |
| VRF coordinator | `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B` |
| VRF wrapper | `0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1` |
| key hash | `0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae` |
| minimum confirmations | `3` |
| maximum callback gas limit | `2,500,000` |

Chainlink's v2.5 direct-funding example uses `VRFV2PlusWrapperConsumerBase`, requests one or more random words, and receives the result through `fulfillRandomWords`. The result is public contract state after fulfillment. That is compatible with Candidate A, where public draw randomness is reduced against a public or committed aggregate and only the user-specific winner calculation is encrypted.

## Required adapter behavior

The adapter we eventually deploy must do all of the following:

1. Create a provider request and record the provider-native request ID.
2. Assign a stable `uint32` PoolTogether-compatible request ID.
3. Record the request block at creation time.
4. Accept only the provider's authenticated callback for that request.
5. Report incomplete, failed, or fulfilled state without reverting unexpectedly.
6. Return a nonzero random word only after fulfillment.
7. Bind one request to one draw and prevent reuse.
8. Expose enough public transcript data for an observer to recompute the draw reduction.
9. Pay the provider from an explicit reserve or funded request budget.

The adapter should not decrypt any FHE state. Its only output to the confidential pool is public randomness and lifecycle status.

The local reference workspace now includes `ChainlinkVrfRngAdapterReference`. It maps the provider's wider request ID to a V5-compatible `uint32`, authenticates the wrapper callback, stores the first random word, and applies an explicit timeout policy for liveness experiments. The timeout is only a local policy; it is not cryptographic evidence that a Chainlink request failed.

## Atomicity question

There are two viable integration shapes, but they have different trust and implementation costs:

### Shape A — request first, bind second

The operator calls the adapter to create a VRF request, then calls the pool to bind that request. This is easy to test, but the pool must enforce the intended epoch/draw binding and cannot honestly claim V5's same-block `startDraw` rule unless both calls occur in one transaction through a coordinator.

### Shape B — coordinator-mediated request and bind

One coordinator contract calls the provider adapter and immediately records the returned request in the draw state during the same transaction. Later, anyone may finalize the draw after the provider callback. This is closer to the V5 lifecycle and removes a loose request-ID handoff, but it adds a coordinator and provider-specific callback plumbing.

The generic local `RngLifecycleAdapter` now enforces the V5 same-block binding rule. A separate reference `RngRequestCoordinator` also proves that a request can be created and bound in one transaction. The FHEVM `ConfidentialPoolTogetherSlice` intentionally remains a looser Shape-A experiment: it accepts a previously created request so the encrypted draw path can be tested independently. Shape B is the production candidate to test next.

## Fairness and privacy boundary

Using Chainlink VRF would improve entropy provenance compared with a single operator's commit/reveal seed. It would not hide the random number: VRF fulfillment is public. The design still relies on FHE for the private part:

```text
public VRF word
  -> public draw transcript and reduction
  -> encrypted user TWAB and winning zone
  -> encrypted winner/payout
  -> winner-authorized decryption or confidential-token settlement
```

The aggregate supply, draw parameters, user address, transaction timing, and claim activity remain possible metadata leaks. The provider choice solves entropy provenance; it does not solve those other leaks.

## Current decision

Chainlink VRF v2.5 is a credible Ethereum Sepolia integration candidate because its official documentation publishes a supported coordinator/wrapper configuration and its callback model maps naturally to the four-method RNG boundary. It is not selected as final infrastructure yet.

Before selecting it, we need a minimal adapter proof with:

- a mocked callback path that mirrors the provider base contract;
- one request mapped to one `uint32` ID;
- one coordinator transaction that creates and binds a request;
- duplicate, unknown, incomplete, and failed request tests;
- the same-block binding test required by V5;
- a public transcript test showing the returned word feeds the same reduction as the plaintext baseline;
- a Sepolia dry run using testnet ETH/LINK and the exact deployed addresses.

The local adapter proof now covers the request mapping, same-block coordinator binding, authenticated callback, duplicate callback rejection, native payment, and official consumer-base callback behavior. It still does not cover a live provider callback, live fee pricing, deployment funding, transcript reduction, or provider-specific retry behavior.

## Dependency integration result

The current stable npm package is `@chainlink/contracts@1.5.0`. Its package metadata includes a broad set of ecosystem dependencies, including several chain-specific contract packages and a GitHub-sourced `@zksync/contracts` dependency. A trial install was stopped before completion; it created no lockfile or tracked files in this workspace.

For this reason, the product workspace does not add the full npm package. Instead, it contains a deliberately pinned, minimal Solidity subset from the `contracts-v1.5.0` tag: `VRFV2PlusWrapperConsumerBase`, `IVRFV2PlusWrapper`, and `LinkTokenInterface`. The official consumer-base behavior is now exercised locally, but the vendored subset must be reviewed against the exact release before deployment and must not be presented as a substitute for the complete package's release process.

The read-only Sepolia check used `https://ethereum-sepolia-rpc.publicnode.com` and confirmed chain ID `11155111` plus non-empty bytecode at the published LINK token, VRF wrapper, and VRF coordinator addresses. This proves address presence only; it does not prove that our deployer is funded, that the wrapper will accept our callback gas limit, or that a request can be fulfilled.

The workspace now contains explicit Foundry scripts under [`confidential-pooltogether/script/`](../../confidential-pooltogether/script/): one deploys the adapter and coordinator, and one submits a separately funded request. They require an external RPC URL, private key, and native funding at execution time; none are stored in the repository and no broadcast has been performed.

The public Sepolia read-only check returned chain ID `11155111` and block `11632427`. At the observed gas price `1,099,012,821` wei, the wrapper's explicit `estimateRequestPriceNative(100000, 1, gasPrice)` returned `274246999944647` wei. A direct `calculateRequestPriceNative` call returned zero under `eth_call`, confirming that the explicit gas-price estimate is the safer preflight input for a transaction-funded request. This quote is volatile and must be recomputed immediately before requesting randomness.

## Sources

- [PoolTogether V5 `IRng`](https://github.com/GenerationSoftware/pt-v5-draw-manager/blob/main/src/interfaces/IRng.sol)
- [PoolTogether V5 `DrawManager`](https://github.com/GenerationSoftware/pt-v5-draw-manager/blob/main/src/DrawManager.sol)
- [PoolTogether V5 deployment configuration](https://github.com/GenerationSoftware/pt-v5-mainnet#rng-parameters)
- [Chainlink VRF v2.5 supported networks](https://docs.chain.link/vrf/v2-5/supported-networks)
- [Chainlink VRF v2.5 direct-funding example](https://docs.chain.link/vrf/v2-5/getting-started)

## Not included

- No claim that the adapter is production-ready.
- No live Sepolia transaction has been sent.
- No final choice between Chainlink, Witnet, Zama-native encrypted randomness, or a multi-party provider.
- No change to the confidential product architecture based solely on provider availability.

# Confidential PoolTogether build workspace

This is the implementation workspace for the bounded bounty design. It is intentionally separate from `zama-context/fhevm`, which remains a pinned research checkout.

## Current slice

- `src/reference/pool-model.mjs` — plaintext economic and V5 winner-selection reference model.
- `src/reference/twab-epoch.mjs` — fixed draw-epoch average-balance reference model for the confidential adaptation.
- `src/reference/DrawTranscript.sol` — public V5-style user-specific entropy and unbiased reduction helpers.
- `src/interfaces/IConfidentialPrizePool.sol` — FHEVM-version-neutral contract boundary.
- `src/interfaces/IRng.sol` — PoolTogether V5-compatible randomness-provider boundary.
- `src/reference/RngLifecycleAdapter.sol` — tested request-binding/finalization seam for an `IRng` provider.
- `src/reference/RngRequestCoordinator.sol` — atomic request-and-draw-binding proof for a requestable provider.
- `src/reference/ChainlinkVrfRngAdapter.sol` — pinned Chainlink VRF v2.5 native-payment adapter proof.
- `src/reference/ChainlinkVrfRngAdapterReference.sol` — minimal ABI callback proof retained for comparison.
- `src/vendor/chainlink/` — minimal Solidity subset pinned from Chainlink contracts tag `contracts-v1.5.0`.
- `script/` — explicit deploy and request scripts for the Sepolia RNG smoke test.
- `src/interfaces/IConfidentialToken.sol` — version-neutral ERC-7984 settlement boundary.
- `src/config/sepolia.mjs` — single source of truth for the verified Sepolia cUSDTMock and Chainlink VRF v2.5 targets.
- `zama-context/fhevm/library-solidity/scripts/liveSepoliaDeposit.ts` — guarded Sepolia mock-USDT setup, encrypted deposit, and user-decryption probe.
- `test/DrawTranscript.t.sol` — Foundry checks for transcript determinism and reduction bounds.
- `test/reference/pool-model.test.mjs` — invariant and boundary tests.
- `test/reference/twab-epoch.test.mjs` — mid-period deposit/withdrawal vectors for the epoch model.

The reference model uses the exact fixed-point winning-zone formula and V5 rejection/modulo semantics. Its random input is supplied as an already-derived user-specific value; hashing the draw transcript into that value belongs in the Solidity implementation layer. The reference workspace now also has a tested V5-compatible RNG request lifecycle adapter, while the FHEVM research checkout has a separate encrypted fixed-epoch accumulator that matches the plaintext TWAB vectors.

The interface deliberately exposes no plaintext amount events. Its `aggregateSupply` field is public by design for the first bounded path and must be described as aggregate metadata, not private accounting.

The next production adapter must call the transcript helper (or reproduce its exact semantics) when constructing a claim. The current product-shaped slice derives the reduced value from the draw transcript; the lower-level candidate-A harness still accepts a reduced value directly for isolated cost measurement only.

The current asset decision is documented in `zama-context/08-bounty-pooltogether/asset-settlement.md`: use ERC-7984's handle-only confidential transfer for an encrypted payout. The official registry currently lists Sepolia `cUSDTMock` at `0x4E7B06D78965594eB5EF5414c357ca21E1554491`; this is testnet evidence, not a production cUSDT confirmation.

The local FHEVM slice now includes an ERC-7984-shaped payout-token mock and verifies the pool-to-token ACL handoff. It records an encrypted draw prize, encrypted yield reserve, and fixed draw-epoch TWAB, so claims no longer use a current-balance stand-in or supply an arbitrary prize at claim time. Draw opening supports both operator commit/reveal and a provider-backed `IRng` path; the provider path is exercised with a local mock, not a production Sepolia oracle. The reference workspace now also compiles the pinned Chainlink consumer base and tests native payment plus callback mapping, but it remains a test proof until live provider behavior, entropy provenance, real yield integration, full V5 compatibility, and live transfer behavior are checked.

The Sepolia `cUSDTMock` target is verified for the bounded prototype. Pool `0xa4f2c74Fe1325e218AC9cEDc176DA7C4e175f3a2` completed encrypted deposit/yield funding, post-epoch Chainlink randomness, draw opening, encrypted winner evaluation, winner-only `100,000`-unit prize settlement, and full `1,000,000`-unit principal withdrawal. Final decrypted balances were pool principal `0` and wallet cUSDT `1,100,000`. The smallest live lifecycle is complete; real yield, multi-user/full V5 scope, hardening, and frontend work remain.

## Checks

```text
npm run test:reference
forge build
```

The provider smoke-test commands are documented in [`script/README.md`](./script/README.md). They require an externally supplied Sepolia RPC URL, deployer key, and funded test wallet.

No production frontend, real yield adapter, or full Sepolia lifecycle integration has been added yet. The FHEVM checkout under `zama-context/fhevm` contains the separately tracked Phase 2 experiments and first product-shaped encrypted slice.

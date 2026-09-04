# Plan: bounded confidential PoolTogether bounty build

## Inputs

- [`bounty-requirements.md`](../../zama-context/08-bounty-pooltogether/bounty-requirements.md)
- [`v5-reverse-engineering.md`](../../zama-context/08-bounty-pooltogether/v5-reverse-engineering.md)
- [`phase-2a-iswinner-baseline.md`](../../zama-context/08-bounty-pooltogether/phase-2a-iswinner-baseline.md)
- [`phase-2-experiment-results.md`](../../zama-context/08-bounty-pooltogether/phase-2-experiment-results.md)
- [`phase-2-practical-resolution.md`](../../zama-context/08-bounty-pooltogether/phase-2-practical-resolution.md)
- [`phase-2-evaluation-matrix.md`](../../zama-context/08-bounty-pooltogether/phase-2-evaluation-matrix.md)
- Pinned local FHEVM checkout at `zama-context/fhevm`.

The plan is intentionally narrower than a full PoolTogether V5 port. It preserves the user-facing promise—deposit, yield-funded prizes, private eligibility, encrypted payout, and principal withdrawal—while keeping the aggregate denominator public or publicly committed.

## Assumptions

- One asset, one vault, one draw cadence, and a bounded participant set for the first slice.
- A draw-scoped aggregate denominator can be published or committed without exposing individual balances.
- User-specific TWAB/weight, winner bit, and payout amount use FHEVM encrypted types.
- Confidential-token settlement is the target path for prizes; public payout fallback must be visibly labeled as a privacy limitation.
- The local mocked coprocessor is allowed only in tests. The judged Sepolia path must use the real Zama-supported integration.
- Full V5 tier trees, multiple vaults, delegated TWABs, auctions, and permissionless batch claimers are deferred unless required by the chosen scope.

## Remaining open questions

- Yield source: real supported adapter versus clearly labeled controlled/demo adapter.
- Whether the final submission needs more PoolTogether V5 compatibility than the bounded fixed-epoch, one-tier architecture.
- Which public metadata disclosures require mitigation versus explicit documentation.
- Maximum encrypted numeric width and participant count that fit the target HCU/depth budget.

## Prototype Reintegration Gate

The hybrid product-first visual direction is approved. Prototype reintegration is complete in `.thoughts/prototype-reintegration/2026-09-04-confidential-pool.md`: every important mock is classified and mapped to the wallet, Zama Relayer SDK, Sepolia contracts, confidential token, RNG provenance, or development-only fixtures. The product should use one application route with a compact landing/explanation layer rather than build a second marketing site. A rolling-epoch/KMS-proven denominator candidate is implemented locally; production write integration remains gated by its adversarial/live freeze gates and the honest yield boundary. The private-denominator multi-transaction circuit remains a feasibility experiment, not the MVP denominator path.

## Phase 1: freeze the economic boundary — complete for the reference slice

### Goal

Specify the smallest PoolTogether-like economic loop that can be tested against a plaintext reference model.

### Work

- Define deposit shares, principal accounting, yield contribution, draw cadence, and one prize rule.
- Define the draw snapshot containing public randomness, parameters, and the aggregate denominator commitment/value.
- Define exact behavior for zero supply, zero user weight, withdrawals before a draw, duplicate claims, and unavailable yield.

### Real Integration Path

Use the actual selected asset/vault interfaces once verified. The economic adapter must expose principal separately from prize yield.

### Mock/Simulation Policy

Controlled yield may be used in local tests only. A Sepolia demo must label simulated or externally supplied yield and must not imply audited production yield integration.

### Checks

- Plaintext reference tests for deposits, withdrawals, yield, draw snapshots, and claims.
- Invariants: principal is not awarded as prize; claim is one-time; withdrawal does not exceed recorded principal.

### Acceptance Criteria Covered

Deposit, yield-funded prize, and principal withdrawal requirements.

### Result

The reference model and version-neutral interface compile and pass their checks in `confidential-pooltogether/`. The model has deterministic tests for the V5 winning-zone arithmetic, rejection sampling, strict comparison, principal/yield separation, non-winner completion, duplicate claims, and withdrawal limits.

### Stop Condition

Stop if the public aggregate snapshot cannot be defined without contradicting the bounty's intended confidentiality claim.

## Phase 2: implement encrypted accounting — first slice complete

### Goal

Replace user-specific balances/weights and claimable prizes with encrypted state while preserving the Phase 1 reference behavior.

### Work

- Add encrypted user balance/share state.
- Add encrypted deposit and withdrawal updates with explicit ACL permissions.
- Use fixed-point widths and overflow bounds derived from the selected asset and bounded pool size.
- Emit account/activity events without plaintext amounts.

### Real Integration Path

Use current FHEVM input proofs, encrypted arithmetic, ACL, and user decryption through the supported relayer path. [FHEVM ACL guidance](https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial/turn_it_into_fhevm.md)

### Mock/Simulation Policy

The local FHEVM mocked coprocessor remains a unit-test aid. It cannot be used as evidence of Sepolia latency, HCU, or KMS availability.

### Checks

- Encrypted balance updates against the plaintext reference model.
- Unauthorized user decryption rejection.
- No amount fields in application events or calldata beyond encrypted input material.
- HCU/depth measurements for deposit and withdrawal.

### Acceptance Criteria Covered

Confidential deposits, balances, and principal accounting.

### Result

`ConfidentialPoolTogetherSlice.sol` now passes eight focused FHEVM integration tests. The slice proves encrypted balance updates, fixed draw-epoch TWAB accounting, encrypted fixed-point eligibility, winner-only payout decryption, non-reverting non-winner claims, private over-withdrawal acceptance, local ERC-7984-shaped settlement, operator commit/reveal authentication, and permissionless finalization through a V5-compatible provider boundary. It remains a research/product slice because the provider is still a local mock, it does not implement V5's full historical ring buffer, and it has no production yield adapter.

### Stop Condition

Stop if encrypted accounting exceeds the selected HCU/depth budget or if principal settlement requires plaintext balances.

## Phase 3: implement the exact public-denominator winner path

### Goal

Preserve V5's probability model while encrypting the user-specific winning zone and winner result.

### Work

- Commit or store draw ID, vault identifier, tier/prize parameters, public randomness, and aggregate denominator `S`.
- Reproduce V5's public rejection-sampling/modulo reduction.
- Compute encrypted `W` from encrypted user weight and public odds/fraction.
- Compare public reduced random with encrypted `W` and store encrypted winner state.

### Real Integration Path

Use FHEVM `fromExternal`, encrypted multiply/divide by public constants, encrypted comparison, `FHE.allowThis`, and user-only authorization.

### Mock/Simulation Policy

The public reduction is deterministic and can be reference-tested locally. The encrypted path must be run through the real FHEVM integration before claiming production-oriented behavior.

### Checks

- Deterministic equivalence to V5 over boundary vectors.
- Zero supply and zero winning-zone behavior.
- Tier/prize index validation.
- HCU/depth and gas budget.
- Public transcript can recompute the reduced random value.

### Current Result

The product-shaped FHEVM slice derives user-specific entropy from the public draw transcript and performs the V5-style rejection-sampling reduction onchain before the encrypted comparison. The encrypted user weight is a finalized fixed draw-epoch TWAB. The hardened Sepolia path now binds each draw to a coordinator-recorded, post-epoch Chainlink request and has live-proven confidential asset settlement. Full V5 historical compatibility remains intentionally outside the current bounded architecture.

The ERC-7984 handle-only transfer, pool-to-token transient ACL handoff, encrypted winner payout, and encrypted principal return are proven end to end on Sepolia using the registry-valid `cUSDTMock` wrapper.

### Acceptance Criteria Covered

Verifiable draw fairness and private user-specific eligibility.

### Stop Condition

Stop if full-path cost is materially above the target or if the public aggregate must be described as private total accounting.

## Phase 4: implement encrypted claim and confidential payout

### Goal

Let winners retrieve an encrypted prize without exposing winner status or payout amount through the normal claim call.

### Work

- Make winner and non-winner claim calls follow the same encrypted operation shape and both complete successfully.
- Use encrypted selection to produce either the encrypted prize or encrypted zero.
- Prevent repeat claims with public draw/user/prize identity while keeping the payout value encrypted.
- Transfer or credit the result using the verified confidential-token path.

### Real Integration Path

Use the Zama-supported confidential asset interface and relayer user-decryption flow. Do not decrypt a payout into a public ERC-20 transfer in the privacy-preserving path.

### Mock/Simulation Policy

The current claim harness proves ACL and non-reverting behavior only. It does not settle assets and cannot support a production claim.

### Checks

- Winner receives the correct encrypted payout.
- Non-winner receives encrypted zero without revert.
- Unauthorized decryption fails.
- Repeat claim is rejected by public claim state without exposing the private payout value.
- Compare winner/non-winner HCU and native gas over repeated runs.

### Acceptance Criteria Covered

Private winnings, one-time claiming, and user-visible claim flow.

### Stop Condition

Stop if cUSDT cannot receive the encrypted result or if the claim endpoint exposes an exploitable winner oracle.

### Current Result

The hardened Sepolia lifecycle paid a `100000` encrypted prize, allowed only the user to decrypt it, preserved an amount-free public claim event, and returned `1000000` encrypted principal. The strict auditor confirmed a final wallet balance of `2100000` and zero principal remaining in the pool.

## Phase 5: frontend and operational flow

### Goal

Make the pending encryption, coprocessor, decryption, and withdrawal states understandable to ordinary users.

### Work

- Wallet/network onboarding.
- Encrypted deposit and withdrawal forms.
- Draw status and public fairness transcript.
- Private result/payout panel visible only after authorized decryption.
- Clear disclosure of public aggregate and residual metadata leakage.
- Error, retry, and relayer timeout states.

### Real Integration Path

Use the real Sepolia RPC, relayer SDK, contract addresses, and confidential asset interfaces.

### Mock/Simulation Policy

Mock data may power storybook/local UI fixtures only and must be visibly separated from live chain state.

### Checks

- Fresh-user end-to-end flow.
- Reload/reconnect while decryption is pending.
- Mobile wallet and wrong-network behavior.
- Verify no plaintext balances or payouts are rendered from public RPC data.

### Acceptance Criteria Covered

Working dApp and understandable confidentiality/fairness UX.

### Stop Condition

Stop if the UI must display plaintext values that the contract design intended to keep private.

## Phase 6: verification and Sepolia readiness

### Goal

Prove the implementation matches the bounded scope and is ready for a public demonstration.

### Work

- Run plaintext-reference, encrypted integration, ACL, privacy-surface, and failure tests.
- Verify contracts and publish addresses/configuration.
- Test repeated deposits, withdrawals, draw completion, winner claim, non-winner claim, and recovery from delayed services.
- Record exact version pins and operational dependencies.

### Checks

- Verification audit against bounty requirements and this plan.
- No production path depends on local mocks.
- Known limitations appear in README, UI, and submission materials.
- Sepolia gas/HCU observations are labeled as network-specific measurements.

### Acceptance Criteria Covered

Production-oriented demonstration quality and honest technical disclosure.

### Stop Condition

Do not submit if the live path cannot complete the full deposit → draw → private claim → withdrawal loop.

## Verification Checkpoint

Before submission, independently verify:

- public transcript reproduces the draw rule;
- private user data is not emitted in plaintext;
- winner-only decryption permissions are correct;
- principal cannot be consumed as prize;
- non-winner behavior does not expose a direct public result;
- cUSDT/payout settlement matches the stated confidentiality claim;
- all deliberate simplifications from V5 are documented.

## Handoff Notes

The reference model, encrypted epoch accumulator, product-shaped accounting/claim slice, coordinator-bound Chainlink boundary, and confidential-token lifecycle are implemented and live-proven for one fixed epoch. The approved frontend reintegration map is complete, and a recurring contract candidate now adds permissionless epoch advancement, draw-scoped user TWABs, sequential checkpoints, and a KMS-proven public denominator. The next implementation action is to harden that ABI, resolve the genuine-versus-controlled yield boundary, update operational scripts, and complete a fresh Sepolia lifecycle before enabling frontend writes. Then complete broader adversarial/privacy testing, contract verification, deployment operations, and submission materials. Do not expand into a full V5 repository port or private-denominator circuit unless the bounty scope proves that expansion necessary.

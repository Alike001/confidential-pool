# Implementation plan

## Current status

Phase 2 research has produced a bounded build direction. The practical resolution is documented in [`phase-2-practical-resolution.md`](./phase-2-practical-resolution.md), and the executable phased plan is [`2026-09-03-confidential-pooltogether.md`](../../.thoughts/plans/2026-09-03-confidential-pooltogether.md). The local implementation uses a public draw-scoped aggregate denominator, encrypted user-specific eligibility, encrypted payout accounting, and a non-reverting claim surface. It does not attempt full-width private denominator division or a complete V5 port. The local slice also separates encrypted principal from an encrypted yield reserve and stores an encrypted prize per draw.

Current phase map: Phase 1 is complete; Phases 2–4 produced a locally tested bounded design; and Phase 5's hardened fixed-epoch lifecycle is complete on Sepolia. Phase 6 has 14 focused fixed-epoch tests plus a strict live auditor that returned `HARDENED_LIFECYCLE_COMPLETE: true`. The recurring candidate implements permissionless rolling epochs, draw-scoped TWABs, sequential checkpoints, KMS-proven public aggregate denominators, and depth-safe two-step claims; 11 focused checks pass together. The approved frontend is implemented with live reads, lazy Zama SDK encryption/decryption, and release-gated writes. Final pool `0x7C942fe70E1C7EA0cC2d1d37fad1018200C3e401` now holds two independently encrypted `1000000`-unit deposits and a `500000`-unit sponsored encrypted reserve. Remaining production work is the two-wallet/two-epoch live transcript, strict audits, browser-wallet QA, source verification, write activation, and submission packaging.

## Guiding rule

Reverse-engineer both systems before choosing the implementation boundary. The first build should prove the smallest correct economic and confidentiality loop, then expand only where the evidence supports it.

## Phases

### Phase 1 — Reverse-engineer current PoolTogether

Status: research first pass complete; plaintext reference boundary implemented.

- document the V5 system components;
- trace deposit, yield, liquidation, draw, winner check, claim, and withdrawal;
- read the V5 contracts that implement Prize Vault, TWAB Controller, Prize Pool, Draw Manager, RNG auction, and Claimer;
- record which parts are essential for the bounty and which are full-protocol features.

Primary outputs: `pooltogether-current-architecture.md` and `prize-mechanism.md`.

### Phase 2 — Reverse-engineer Zama primitives needed for the draw

Status: primitive experiments and epoch-integrated accounting are complete locally. Four Chainlink VRF requests have been fulfilled live, including request `4` through the hardened timestamp-aware coordinator. Current-SDK encryption/decryption, confidential transfers, deposit accounting, encrypted reserve funding, winner-only payout access, and post-epoch withdrawal are live-proven on the hardened deployment.

Next implementation/research pass:

- verify encrypted input types and proof flow;
- verify encrypted integer widths and supported arithmetic/comparison operations;
- verify encrypted randomness options;
- verify ACL behavior for contract, user, and winner-only access;
- verify public versus user decryption and onchain proof checking;
- measure the cost of one-user winner evaluation and bounded multi-user evaluation.

Primary output: `encrypted-winner-selection.md`, with updates to the existing `01`–`04` Zama notes.

The current implementation evidence is recorded in [`phase-2-encrypted-slice.md`](./phase-2-encrypted-slice.md) and [`fhevm-sepolia-deployment.md`](./fhevm-sepolia-deployment.md). The slice includes confidential asset settlement, encrypted prize-reserve accounting, a fixed-epoch TWAB adaptation, coordinator-bound Chainlink randomness, and a provider-backed finalization path. It is not yet production-ready because the full V5 ring buffer and tier system are intentionally out of scope, the yield source is controlled rather than strategy-generated, the Sepolia asset is `cUSDTMock`, and the production frontend and broader adversarial validation are unfinished.

### Phase 3 — Design the confidential PoolTogether architecture

Status: bounded candidate design integrated and proven through one complete Sepolia lifecycle. Fixed-epoch TWAB accounting, realistic-scale public-denominator winner composition, provider-backed finalization, ERC-7984 settlement, encrypted claim, and post-epoch withdrawal pass locally and live. A two-user weighted winner/non-winner path and repeated draws using distinct RNG requests pass locally. Real yield integration, broader multi-user behavior, full V5 scope, and production hardening remain open.

- choose the confidentiality boundary for deposits, weights, winner status, and prize amounts;
- choose one asset and one vault model for the first slice;
- decide how yield is represented on Sepolia;
- choose a draw lifecycle and claim lifecycle;
- write the fairness transcript in user-facing language.

Primary outputs: `confidential-architecture.md`, `verification-model.md`, and `threat-model.md`.

### Phase 4 — Identify what Zama already provides

Status: complete for the bounded architecture; revisit only if the yield adapter or frontend requires an additional Zama component.

- map every required primitive to official contracts, libraries, SDKs, and protocol services;
- separate “provided by Zama” from “we must implement”;
- note unsupported operations, version constraints, and operational dependencies;
- avoid rebuilding gateway, coprocessor, KMS, ACL, or confidential-token infrastructure unless the bounty requires an adapter.

### Phase 5 — Implement the smallest correct protocol

Status: complete locally and on the hardened Sepolia deployment.

The first implementation target should be one coherent loop:

```text
confidential deposit
        → encrypted weight
        → deterministic draw
        → private winner result
        → authorized prize claim
        → principal withdrawal
```

Only after this works should we add multiple tiers, multi-vault accounting, permissionless claimers, or a full liquidation auction.

### Phase 6 — Polish UX, testing, and verification

Status: in progress.

- wallet and encryption onboarding;
- clear pending states for coprocessor/decryption work;
- invariant tests for principal and claims;
- fairness test vectors against a plaintext reference model;
- privacy and leakage tests;
- failure and retry handling;
- frontend explanation of what is and is not public.

Progress: the first multi-user fairness/privacy regression, isolated claim-surface comparison, repeated-draw RNG-replay regression, and onchain request-provenance regression are complete. From identical pre-claim state, the latest local winner and non-winner paths have the same calldata, application log shapes, and `676599` gas. Each provider request can be committed to at most one draw. The pool requires a coordinator record whose draw ID, request ID, provider request block, and timestamp agree, and whose timestamp is at or after epoch close. Transaction recovery is implemented for uncertain broadcasts and already-claimed payout inspection. One complete hardened live timing/relayer path now passes the strict auditor. Broader metadata/adversarial review, multi-wallet live testing, contract/API cleanup, and frontend work remain.

### Phase 7 — Deploy to Sepolia

Status: core contracts and full lifecycle are deployed and proven; source verification, frontend configuration, and repeatable operator/deployment packaging remain.

- deploy only after local and testnet invariants pass;
- verify contracts and record addresses/versions;
- test fresh-user flow, repeat deposits, withdrawal, draw completion, winner claim, and non-winner behavior;
- document external services and operational assumptions.

### Phase 8 — Submission

Status: pending the recurring live audit, frontend write activation/browser QA, and final evidence pass.

- working website;
- source repository;
- three-minute real-person walkthrough;
- written explanation of fairness and privacy;
- X thread or article;
- final evidence pack with deployments and known limitations.

## Immediate next gate

The hardened Sepolia gate is complete. Pool `0xF99747C771c09909f6Ad56F43D742c7757ECD9E0` completed encrypted deposit, encrypted yield funding, a coordinator-bound post-epoch Chainlink request, encrypted draw, user TWAB finalization, winner-only claim, and full principal withdrawal. The strict auditor reconstructed the entire transcript and returned `HARDENED_LIFECYCLE_COMPLETE: true`.

Frontend prototype discovery and reintegration are complete. Multi-user/repeated-draw, RNG-recovery, and gas/HCU vectors now pass for the recurring candidate documented in [`rolling-epochs-final-abi.md`](./rolling-epochs-final-abi.md). Deployment, retrying public-decryption keeper, draw/claim, and strict-auditor scripts are ready. The yield boundary is documented in [`yield-boundary.md`](./yield-boundary.md). The immediate gate is a fresh recurring Sepolia release before enabling production frontend writes.

## Remaining delivery sequence

1. **Inspect and approve the prototype — complete.** The live Replit prototype was inspected at desktop/intermediate/mobile widths, the hybrid product-first direction was approved, and every mock was classified in `.thoughts/prototype-reintegration/2026-09-04-confidential-pool.md`. The production route will include compact landing content around the live app rather than a separate marketing-site build.
2. **Freeze the submission contract scope — candidate implemented, costed, and adversarially exercised locally.** The recurring candidate has a fixed cadence, one coordinator-bound RNG request per epoch/draw, draw-scoped encrypted TWABs, permissionless epoch advancement, encrypted withdrawals, a KMS-proven public denominator, and two-step claims. Eleven focused checks pass together. The strict auditor is implemented; freeze now depends on live validation.
3. **Resolve yield honestly — complete for the bounded Sepolia MVP.** Use a testnet-sponsored encrypted prize reserve and disclose that deposited principal is not supplied to a live lending market. The production batched-adapter requirements are documented separately.
4. **Harden the final ABI — local gate complete; live gate in progress.** Multi-wallet, repeated epochs/draws, non-winner behavior, keeper recovery, and HCU/gas checks pass locally. Complete the final two-wallet/two-epoch transcript and strict audits; keep the coordinator refund-recovery limitation disclosed.
5. **Reintegrate and build the real frontend — implemented, activation pending.** The approved visual states now map to wallet/network onboarding, Zama input encryption, ERC-7984 transfers, live public draw evidence, owner decryption, checkpoints, claims, and withdrawals. Keep writes gated until the live strict audit and browser-wallet QA pass.
6. **Create the final Sepolia release — deployed, validation pending.** The stable candidate address/config manifest is wired into the frontend. Complete its recurring transcript, verify source code, run browser-wallet QA, and then enable writes.
7. **Package the submission.** Clean public repository, architecture/privacy documentation, known limitations, deployed website, reproducible test/run instructions, three-minute walkthrough, screenshots, evidence links, and submission/X copy.

Do not call the submission production-ready until the frontend exercises the proven live path, the yield source is integrated or bounded explicitly, deployed source/configuration is verifiable, metadata leakage is reviewed, and every deliberate departure from full V5 is disclosed.

## Decision gates

The original Phase 2 → Phase 3 gate and bounded Phase 5 live gate are satisfied. The remaining production gate is:

- keep the sponsored-reserve limitation visible and do not imply live lending yield;
- validate live multi-wallet probability and metadata leakage;
- validate the new strict auditor and complete recurring Sepolia lifecycle;
- build and test the production frontend and deployment operations;
- decide which V5 compatibility features are required for the bounty submission.

Do not call the submission production-oriented until the live frontend path, yield disclosure/integration decision, contract verification, and remaining privacy/adversarial checks are complete and the bounded departures from V5 are stated honestly.

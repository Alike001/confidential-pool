# Implementation plan

## Current status

Phase 2 research has produced a bounded build direction. The practical resolution is documented in [`phase-2-practical-resolution.md`](./phase-2-practical-resolution.md), and the executable phased plan is [`2026-09-03-confidential-pooltogether.md`](../../.thoughts/plans/2026-09-03-confidential-pooltogether.md). The local implementation uses a public draw-scoped aggregate denominator, encrypted user-specific eligibility, encrypted payout accounting, and a non-reverting claim surface. It does not attempt full-width private denominator division or a complete V5 port. The local slice also separates encrypted principal from an encrypted yield reserve and stores an encrypted prize per draw.

Current phase map: Phase 1 complete; Phases 2–4 have produced a locally tested and live-proven bounded design; Phase 5's smallest lifecycle is complete on Sepolia. Phase 6 now has 14 focused tests. They include deterministic two-user winner/non-winner comparison, repeated-draw RNG-replay rejection, and coordinator-enforced draw/request/timestamp provenance. Production architecture is still gated by deploying and live-validating that coordinator boundary, a real yield adapter, broader multi-user testing, full V5 scope decisions, UX, and metadata-leakage review.

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

Status: primitive experiments and epoch-integrated accounting are complete locally; provider-backed finalization is implemented; three Chainlink VRF requests are live-fulfilled. Current-SDK encryption/decryption, confidential transfers, deposit accounting, encrypted reserve funding, winner-only payout access, and post-epoch withdrawal are live-proven on the corrected deployment.

Next implementation/research pass:

- verify encrypted input types and proof flow;
- verify encrypted integer widths and supported arithmetic/comparison operations;
- verify encrypted randomness options;
- verify ACL behavior for contract, user, and winner-only access;
- verify public versus user decryption and onchain proof checking;
- measure the cost of one-user winner evaluation and bounded multi-user evaluation.

Primary output: `encrypted-winner-selection.md`, with updates to the existing `01`–`04` Zama notes.

The current implementation evidence is recorded in [`phase-2-encrypted-slice.md`](./phase-2-encrypted-slice.md). The local slice now includes confidential asset settlement, encrypted prize-reserve accounting, a fixed-epoch TWAB adaptation, operator-authenticated commit/reveal, and a provider-backed finalization path. It is not yet production-ready because the local provider is only a mock, the full V5 ring buffer is not implemented, the yield source is not integrated, and the token is still a local mock.

### Phase 3 — Design the confidential PoolTogether architecture

Status: bounded candidate design integrated and proven through one complete Sepolia lifecycle. Fixed-epoch TWAB accounting, realistic-scale public-denominator winner composition, provider-backed finalization, ERC-7984 settlement, encrypted claim, and post-epoch withdrawal pass locally and live. A two-user weighted winner/non-winner path and repeated draws using distinct RNG requests pass locally. Real yield integration, broader multi-user behavior, full V5 scope, and production hardening remain open.

- choose the confidentiality boundary for deposits, weights, winner status, and prize amounts;
- choose one asset and one vault model for the first slice;
- decide how yield is represented on Sepolia;
- choose a draw lifecycle and claim lifecycle;
- write the fairness transcript in user-facing language.

Primary outputs: `confidential-architecture.md`, `verification-model.md`, and `threat-model.md`.

### Phase 4 — Identify what Zama already provides

- map every required primitive to official contracts, libraries, SDKs, and protocol services;
- separate “provided by Zama” from “we must implement”;
- note unsupported operations, version constraints, and operational dependencies;
- avoid rebuilding gateway, coprocessor, KMS, ACL, or confidential-token infrastructure unless the bounty requires an adapter.

### Phase 5 — Implement the smallest correct protocol

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

- wallet and encryption onboarding;
- clear pending states for coprocessor/decryption work;
- invariant tests for principal and claims;
- fairness test vectors against a plaintext reference model;
- privacy and leakage tests;
- failure and retry handling;
- frontend explanation of what is and is not public.

Progress: the first multi-user fairness/privacy regression, isolated claim-surface comparison, repeated-draw RNG-replay regression, and onchain request-provenance regression are complete. From identical pre-claim state, the latest local winner and non-winner paths have the same calldata, application log shapes, and `676599` gas. Each provider request can be committed to at most one draw. The pool now requires a coordinator record whose draw ID, request ID, provider request block, and timestamp agree, and whose timestamp is at or after epoch close. Transaction recovery is implemented for uncertain broadcasts and already-claimed payout inspection. Live timing/relayer analysis, broader metadata review, and frontend work remain.

### Phase 7 — Deploy to Sepolia

- deploy only after local and testnet invariants pass;
- verify contracts and record addresses/versions;
- test fresh-user flow, repeat deposits, withdrawal, draw completion, winner claim, and non-winner behavior;
- document external services and operational assumptions.

### Phase 8 — Submission

- working website;
- source repository;
- three-minute real-person walkthrough;
- written explanation of fairness and privacy;
- X thread or article;
- final evidence pack with deployments and known limitations.

## Immediate next gate

Continue Phase 6 hardening around the now-proven loop. Contract-level post-epoch RNG provenance passes locally, and provenance-version-1 coordinator `0xabc4d6ca46A91cFF083cD0086B81337adC7ed6cA` plus hardened pool `0xF99747C771c09909f6Ad56F43D742c7757ECD9E0` are deployed and verified on Sepolia. Its `1,000,000`-unit encrypted deposit and `100,000`-unit encrypted yield reserve are confirmed. The next gate is one post-epoch live request through the new coordinator, then draw/claim/withdrawal completion. After that, continue broader multi-user probability tests, metadata analysis, transaction-recovery UX, contract/API cleanup, and a production-quality frontend. In parallel, replace explicitly funded mock yield with a real yield adapter or clearly bounded integration. See [`fhevm-sepolia-deployment.md`](./fhevm-sepolia-deployment.md).

Do not call the pool deployment production-ready until the live confidential-token transfer, relayer decryption flow, fresh-request lifecycle, real yield source, full V5 compatibility, and metadata-leakage review pass.

## Decision gates

The original Phase 2 → Phase 3 gate and bounded Phase 5 live gate are satisfied. The remaining production gate is:

- define and integrate the real yield source rather than operator-funded mock yield;
- validate broader multi-user probability, repeated-draw ordering, and adversarial paths;
- deploy and live-validate the locally passing post-epoch RNG provenance contracts;
- validate full-path HCU/depth, liveness, recovery, and metadata leakage;
- build and test the production frontend and deployment operations;
- decide which V5 compatibility features are required for the bounty submission.

Do not proceed from Phase 3 to Phase 5 until we know what “production-oriented” means for the chosen simplified boundary and can state the remaining risks honestly.

# Implementation plan

## Current status

Phase 2 research has produced a bounded build direction. The practical resolution is documented in [`phase-2-practical-resolution.md`](./phase-2-practical-resolution.md), and the executable phased plan is [`2026-09-03-confidential-pooltogether.md`](../../.thoughts/plans/2026-09-03-confidential-pooltogether.md). The local implementation uses a public draw-scoped aggregate denominator, encrypted user-specific eligibility, encrypted payout accounting, and a non-reverting claim surface. It does not attempt full-width private denominator division or a complete V5 port. The local slice also separates encrypted principal from an encrypted yield reserve and stores an encrypted prize per draw.

Current phase map: Phase 1 complete; Phases 2–3 have a passing local feasibility slice; Phase 4 is partially proven locally; the V5-compatible RNG lifecycle seam is now tested; the Chainlink adapter and one live Sepolia request have passed the provider smoke test; Phases 5–8 have not started. Production architecture remains gated by a real yield adapter, live FHEVM settlement, full V5 compatibility, and metadata-leakage review.

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

Status: primitive experiments and epoch-integrated product-shaped accounting slice complete locally; operator commit/reveal and provider-backed finalization are implemented; Chainlink VRF adapter deployment and one live Sepolia fulfillment are proven; live confidential-token transfer and production interface gates remain open.

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

Status: candidate design integrated into the product-shaped slice. Fixed-epoch TWAB accounting, public-denominator winner composition, operator commit/reveal, and provider-backed finalization pass locally; the FHEVM slice is now configured for canonical Sepolia host contracts; real yield integration, live transfer, and full V5 compatibility remain open.

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

Connect the now-verified Sepolia RNG adapter to the FHEVM slice. The next test should deploy the pool with the canonical Sepolia FHEVM configuration, use a fresh RNG request, and then exercise encrypted deposit, epoch finalization, provider-backed draw opening, winner-only decryption, and handle-only cUSDTMock settlement. See [`fhevm-sepolia-deployment.md`](./fhevm-sepolia-deployment.md).

Do not call the pool deployment production-ready until the live confidential-token transfer, relayer decryption flow, fresh-request lifecycle, real yield source, full V5 compatibility, and metadata-leakage review pass.

## Decision gates

The original Phase 2 → Phase 3 gate is satisfied for the bounded local slice. The remaining production gate is:

- select a verifiable unbiased RNG provider and prove its adapter boundary;
- connect the verified provider adapter to a deployed FHEVM pool;
- define the real yield source and reserve accounting;
- test the confidential-token transfer on Sepolia;
- validate full-path HCU/depth and metadata leakage.

Do not proceed from Phase 3 to Phase 5 until we know what “production-oriented” means for the chosen simplified boundary and can state the remaining risks honestly.

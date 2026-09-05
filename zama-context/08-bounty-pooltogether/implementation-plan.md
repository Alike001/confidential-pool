# Implementation plan

## Current status

Phase 2 research produced a bounded build direction. The final implementation uses a public KMS-proven draw denominator, encrypted user-specific eligibility, encrypted payout accounting, and a non-reverting claim surface. It intentionally does not attempt full-width private denominator division or a complete V5 port.

Phases 1–7 are complete for the bounded submission. The official form's explicit “FHE randomness, no offchain RNG” requirement caused the final architecture correction. The guarded immutable wrapper/pool pair is deployed and source-matched, and its complete live lifecycle passed the strict auditor. Hosted wallet QA and submission media/publication remain.

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

Status: complete for the bounded design. Current-SDK encryption/decryption, confidential transfers, epoch TWAB accounting, KMS aggregate proof, encrypted `FHE.randEuint64()` sampling, encrypted reserve funding, winner-only payout access, and withdrawal pass both the phase-2 suite and strict live proof.

Next implementation/research pass:

- verify encrypted input types and proof flow;
- verify encrypted integer widths and supported arithmetic/comparison operations;
- verify encrypted randomness options;
- verify ACL behavior for contract, user, and winner-only access;
- verify public versus user decryption and onchain proof checking;
- measure the cost of one-user winner evaluation and bounded multi-user evaluation.

Primary output: `encrypted-winner-selection.md`, with updates to the existing `01`–`04` Zama notes.

Historical feasibility evidence is recorded in [`phase-2-encrypted-slice.md`](./phase-2-encrypted-slice.md), [`fhevm-sepolia-deployment.md`](./fhevm-sepolia-deployment.md), and [`aave-backed-sepolia-release.md`](./aave-backed-sepolia-release.md). The authoritative submission-candidate record is [`fhe-random-sepolia-release.md`](./fhe-random-sepolia-release.md).

### Phase 3 — Design the confidential PoolTogether architecture

Status: bounded architecture selected and locally complete. Fixed-epoch TWAB accounting, a KMS-proven public denominator, encrypted fixed-domain sampling, confidential settlement, Aave-generated yield, encrypted claims, and withdrawals pass locally. The previous public-RNG design remains regression evidence; it is not the submission architecture.

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

Status: complete locally and validated through the final FHE-random Sepolia lifecycle.

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

Status: responsive frontend implementation, local regression testing, source verification, strict live lifecycle evidence, and write-enabled Vercel publication are complete. Hosted injected-wallet QA remains.

- wallet and encryption onboarding;
- clear pending states for coprocessor/decryption work;
- invariant tests for principal and claims;
- fairness test vectors against a plaintext reference model;
- privacy and leakage tests;
- failure and retry handling;
- frontend explanation of what is and is not public.

Progress: multi-user fairness/privacy, equalized claim surfaces, encrypted-random claim slots, Aave backing conservation, adversarial behavior, and HCU/gas checks pass locally. The active release also passed the strict live lifecycle audit.

### Phase 7 — Deploy to Sepolia

Status: guarded final pair deployed, source-matched, and validated end to end. The write-enabled hosted build is live; browser-wallet QA remains as release presentation work.

- deploy only after local and testnet invariants pass;
- verify contracts and record addresses/versions;
- test fresh-user flow, repeat deposits, withdrawal, draw completion, winner claim, and non-winner behavior;
- document external services and operational assumptions.

### Phase 8 — Submission

Status: packaging in progress. Remaining items are hosted wallet QA, walkthrough media, final copy review, X post, and external form.

- working website;
- source repository;
- three-minute real-person walkthrough;
- written explanation of fairness and privacy;
- X thread or article;
- final evidence pack with deployments and known limitations.

## Immediate next gate

The contract release and hosted-build gates are passed. The immediate gate is hosted injected-wallet QA, followed by media and submission review.

## Remaining delivery sequence

1. **Inspect and approve the prototype — complete.** The live Replit prototype was inspected at desktop/intermediate/mobile widths, the hybrid product-first direction was approved, and every mock was classified in `.thoughts/prototype-reintegration/2026-09-04-confidential-pool.md`. The production route will include compact landing content around the live app rather than a separate marketing-site build.
2. **Freeze the submission contract scope — complete.** The recurring release has a fixed cadence, draw-scoped encrypted TWABs, permissionless epoch advancement, encrypted withdrawals, a KMS-proven public denominator, and an HCU-safe four-transaction private claim path.
3. **Resolve yield honestly — complete.** LINK is supplied to Aave, transferable aLINK backs caLINK one-for-one, and only measured backing surplus can be harvested into the encrypted prize reserve. Public shield/redemption boundaries and the app-specific wrapper are disclosed.
4. **Harden the final ABI — complete locally.** Multi-wallet, repeated epochs, non-winner behavior, encrypted FHE randomness, and HCU/gas checks pass.
5. **Reintegrate and build the real frontend — complete locally.** The production Vite frontend maps wallet/network onboarding, Aave setup, Zama input encryption, confidential deposits/withdrawals, KMS checkpoints, all FHE claim stages, and owner-authorized decryption.
6. **Create the final Sepolia release — complete.** Contracts are deployed, source-matched, and wired into frontend configuration. The full encrypted cycle passed `FHE_RANDOM_AAVE_LIFECYCLE_COMPLETE: true`.
7. **Package and submit — in progress.** QA the write-enabled Vercel build with an injected wallet, record the real-person walkthrough, publish the X post, and submit the one-shot form.

Do not call the contracts audited or claim anonymity. The final materials must keep the app-specific wrapper, public boundary amounts, public aggregate denominator, external protocol dependencies, one-tier scope, and manual keeper operations explicit.

## Decision gates

The research, architecture, and local implementation gates are satisfied. Submission readiness now requires:

- one hosted injected-wallet QA pass;
- a concise real-person demo video that shows generated yield, encrypted participation, FHE randomness, private payout, and principal recovery;
- a final link/claim review;
- submission through the Zama form and required X announcement.

The project is production-oriented pre-audit software, not production-audited software.

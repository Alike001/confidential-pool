# Implementation plan

## Current status

Phase 2 research produced a bounded build direction. The final implementation uses a public KMS-proven draw denominator, encrypted user-specific eligibility, encrypted payout accounting, and a non-reverting claim surface. It intentionally does not attempt full-width private denominator division or a complete V5 port.

Phases 1–7 are complete for the bounded submission. The active Sepolia release is pool `0xdE9A7DC790e6dE0304A046210044F38904309120` with app-specific Aave aLINK-backed confidential token `0x4734EC2CC7e18D4C39fccB97E16E77701819655F`. It completed real Aave-yield harvesting, an encrypted draw, winner-only payout decryption, and full principal withdrawal; the strict auditor returned `RECURRING_LIFECYCLE_COMPLETE: true`. The repository and responsive Vercel frontend are public, and both application contracts have Sourcify creation/runtime bytecode matches. Remaining delivery work is hosted injected-wallet QA, demo media, and the external submission form.

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

Status: complete for the bounded design. Current-SDK encryption/decryption, confidential transfers, epoch TWAB accounting, KMS aggregate proof, Chainlink-bound randomness, encrypted reserve funding, winner-only payout access, and withdrawal are locally and live-proven.

Next implementation/research pass:

- verify encrypted input types and proof flow;
- verify encrypted integer widths and supported arithmetic/comparison operations;
- verify encrypted randomness options;
- verify ACL behavior for contract, user, and winner-only access;
- verify public versus user decryption and onchain proof checking;
- measure the cost of one-user winner evaluation and bounded multi-user evaluation.

Primary output: `encrypted-winner-selection.md`, with updates to the existing `01`–`04` Zama notes.

Historical feasibility evidence is recorded in [`phase-2-encrypted-slice.md`](./phase-2-encrypted-slice.md) and [`fhevm-sepolia-deployment.md`](./fhevm-sepolia-deployment.md). The authoritative generated-yield release is [`aave-backed-sepolia-release.md`](./aave-backed-sepolia-release.md).

### Phase 3 — Design the confidential PoolTogether architecture

Status: bounded architecture selected and complete. Fixed-epoch TWAB accounting, public-denominator FHE winner composition, Chainlink-backed finalization, confidential settlement, Aave-generated yield, encrypted claims, and withdrawals pass locally and live. Two-user weighted outcomes and repeated draws pass the regression suite; the final live candidate proves the complete one-user production path.

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

Status: source verification, final live lifecycle, responsive frontend implementation, and disconnected hosted QA are complete. One manual hosted injected-wallet signing pass remains before form submission.

- wallet and encryption onboarding;
- clear pending states for coprocessor/decryption work;
- invariant tests for principal and claims;
- fairness test vectors against a plaintext reference model;
- privacy and leakage tests;
- failure and retry handling;
- frontend explanation of what is and is not public.

Progress: multi-user fairness/privacy, equalized claim surfaces, RNG replay rejection, post-close provenance, uncertain-broadcast recovery, Aave backing conservation, adversarial behavior, and HCU/gas checks pass. The active release completed its full live lifecycle and strict audit. Remaining production assurance is a professional audit and broader live multi-participant operation, not a missing bounty flow.

### Phase 7 — Deploy to Sepolia

Status: complete for the bounded release. The Aave-backed pool, caLINK wrapper, coordinator, and adapter are deployed; both application contracts have Sourcify creation/runtime matches; the strict release audit passes; and frontend writes target the frozen addresses.

- deploy only after local and testnet invariants pass;
- verify contracts and record addresses/versions;
- test fresh-user flow, repeat deposits, withdrawal, draw completion, winner claim, and non-winner behavior;
- document external services and operational assumptions.

### Phase 8 — Submission

Status: packaging in progress. Repository and website publication are complete. Remaining items are hosted injected-wallet QA, walkthrough media, final submission copy review, and the external form/X post.

- working website;
- source repository;
- three-minute real-person walkthrough;
- written explanation of fairness and privacy;
- X thread or article;
- final evidence pack with deployments and known limitations.

## Immediate next gate

The implementation gate is complete. The only remaining release gate is submission QA: manually exercise the hosted wallet connection and one safe confidential read/write interaction, record the walkthrough, review the final claims against the documented privacy boundary, and submit.

## Remaining delivery sequence

1. **Inspect and approve the prototype — complete.** The live Replit prototype was inspected at desktop/intermediate/mobile widths, the hybrid product-first direction was approved, and every mock was classified in `.thoughts/prototype-reintegration/2026-09-04-confidential-pool.md`. The production route will include compact landing content around the live app rather than a separate marketing-site build.
2. **Freeze the submission contract scope — complete.** The recurring release has a fixed cadence, one coordinator-bound RNG request per epoch/draw, draw-scoped encrypted TWABs, permissionless epoch advancement, encrypted withdrawals, a KMS-proven public denominator, and two-step claims. Local and strict live validation pass.
3. **Resolve yield honestly — complete.** LINK is supplied to Aave, transferable aLINK backs caLINK one-for-one, and only measured backing surplus can be harvested into the encrypted prize reserve. Public shield/redemption boundaries and the app-specific wrapper are disclosed.
4. **Harden the final ABI — complete for the bounded release.** Multi-wallet, repeated epochs/draws, non-winner behavior, keeper recovery, refund recovery, and HCU/gas checks pass locally and on Sepolia.
5. **Reintegrate and build the real frontend — complete.** The production Vite frontend maps wallet/network onboarding, Aave setup, Zama input encryption, confidential deposits and withdrawals, live draw evidence, owner decryption, checkpoints, and claims. It is deployed on Vercel; hosted injected-wallet QA remains.
6. **Create the final Sepolia release — complete.** The stable release addresses are source-verified, live-audited, and wired into the frontend.
7. **Package and submit — in progress.** The clean public repository, architecture/privacy documentation, known limitations, deployed website, reproducible tests, and evidence links are ready. The walkthrough video, final manual wallet QA, form submission, and optional X post remain.

Do not call the contracts audited or claim anonymity. The final materials must keep the app-specific wrapper, public boundary amounts, public aggregate denominator, external protocol dependencies, one-tier scope, and manual keeper operations explicit.

## Decision gates

The research, architecture, implementation, and live Sepolia gates are satisfied. Submission readiness now requires:

- one hosted injected-wallet QA pass;
- a concise demo video that shows generated yield, encrypted participation, verifiable randomness, private payout, and principal recovery;
- a final link/claim review;
- submission through the Zama form and optional X announcement.

The project is production-oriented pre-audit software, not production-audited software.

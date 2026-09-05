# Confidential PoolTogether bounty research

This folder is the challenge-specific research database. It studies PoolTogether's current economic mechanism beside Zama's confidentiality infrastructure before any product direction is approved.

## Reading order

1. [`bounty-requirements.md`](./bounty-requirements.md)
2. [`pooltogether-current-architecture.md`](./pooltogether-current-architecture.md)
3. [`prize-mechanism.md`](./prize-mechanism.md)
4. [`encrypted-winner-selection.md`](./encrypted-winner-selection.md)
5. [`confidential-architecture.md`](./confidential-architecture.md)
6. [`verification-model.md`](./verification-model.md)
7. [`threat-model.md`](./threat-model.md)
8. [`implementation-plan.md`](./implementation-plan.md)
9. [`v5-reverse-engineering.md`](./v5-reverse-engineering.md)
10. [`twab-privacy-analysis.md`](./twab-privacy-analysis.md)
11. [`phase-2a-iswinner-baseline.md`](./phase-2a-iswinner-baseline.md)
12. [`phase-2-experiment-test-plan.md`](./phase-2-experiment-test-plan.md)
13. [`phase-2-experiment-results.md`](./phase-2-experiment-results.md)
14. [`phase-2-probability-leakage-analysis.md`](./phase-2-probability-leakage-analysis.md)
15. [`phase-2-evaluation-matrix.md`](./phase-2-evaluation-matrix.md)
16. [`phase-2-practical-resolution.md`](./phase-2-practical-resolution.md)
17. [`draw-randomness.md`](./draw-randomness.md)
18. [`rng-provider-sepolia.md`](./rng-provider-sepolia.md)
19. [`sepolia-rng-deployment.md`](./sepolia-rng-deployment.md)
20. [`fhevm-sepolia-deployment.md`](./fhevm-sepolia-deployment.md)
21. [`hardened-live-runbook.md`](./hardened-live-runbook.md)
22. [`replit-frontend-design-brief.md`](./replit-frontend-design-brief.md)
23. [`rolling-epochs-final-abi.md`](./rolling-epochs-final-abi.md)
24. [`rolling-epochs-cost-envelope.md`](./rolling-epochs-cost-envelope.md)
25. [`recurring-sepolia-runbook.md`](./recurring-sepolia-runbook.md)
26. [`recurring-sepolia-deployment.md`](./recurring-sepolia-deployment.md)
27. [`final-recurring-runbook.md`](./final-recurring-runbook.md)
28. [`yield-boundary.md`](./yield-boundary.md)
29. [`submission-package.md`](./submission-package.md)
30. [`publication-runbook.md`](./publication-runbook.md)
31. [`../../confidential-pooltogether/README.md`](../../confidential-pooltogether/README.md)
32. [`aave-backed-sepolia-release.md`](./aave-backed-sepolia-release.md)
33. [`experiments/`](./experiments/)

## Current decision boundary

Earlier cUSDTMock pools remain historical evidence for fixed and recurring FHE lifecycles, including multi-user winner/non-winner outcomes and complete principal recovery. They no longer define the submission target because their prize reserves were sponsored.

The active release is pool `0xdE9A7DC790e6dE0304A046210044F38904309120` with app-specific Aave aLINK-backed confidential token `0x4734EC2CC7e18D4C39fccB97E16E77701819655F` and coordinator `0xd39ee872B5cb97d7A6576862549DEBF7AE753CeC`. Its live LINK supply, caLINK shield, encrypted `9 caLINK` deposit, and Aave-generated encrypted yield harvest are complete. Draw, private claim, principal withdrawal, final hosted-wallet QA, video, and form submission remain. The authoritative evidence record is [`aave-backed-sepolia-release.md`](./aave-backed-sepolia-release.md).

## Local source checkouts

The `_repos/` directory contains shallow checkouts used for source-level inspection. They are evidence snapshots, not dependencies of the future application:

- `pt-v5-prize-pool` — `fedd70f3b62086895ee4f0f2224f941e4cdb89b0`
- `pt-v5-vault` — `b8226ab5a88db218dd3e79fae0c0ce6824f05ea6`
- `pt-v5-twab-controller` — `29926961b2ecfa89e0f61a6d874c71b6f8e29112`
- `pt-v5-draw-manager` — `1fe208b28f371d393c8889323b4f11e8cc58fcb4`
- `pt-v5-draw-auction` — `8d782af06932ca7b5796c10084f78d6f45614ada`
- `pt-v5-cgda-liquidator` — `c90e92126dbe64047ba3fb83e2dcc3417be0a1ed`
- `pt-v5-claimer` — `0ea6b676aec4e3ea5d6f7344e5a682b850e520a2`
- `pt-v5-mainnet` — `14acd502765e8f355789c92ce05c00eb06befef2`

The checkouts were fetched on 2026-09-03 and should be refreshed before relying on deployment details.

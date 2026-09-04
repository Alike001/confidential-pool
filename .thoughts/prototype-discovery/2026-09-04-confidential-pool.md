# Prototype Discovery: Confidential Pool

## Prototype Inspected

- Public deployment: `https://confidential-pool-prototype--alike0.replit.app`
- Inspected: 2026-09-04
- Method: live Playwright interaction and accessibility snapshots at 1440×900, 780px, and 390×844; full-page and viewport screenshots; direct visual inspection with `view_image`; production bundle/network and console inspection.
- Runtime result: page loaded successfully with six static requests, no failed application request, and no console warning or error.
- Scope: frontend-only local-state prototype. No real wallet, Zama SDK, RPC, contract, encryption, decryption, or transaction integration is present.

## Screen Map

The prototype is one long page with anchor navigation rather than separate routes:

1. Header: wordmark, How it works, Privacy, Fairness, Sepolia, wallet control, mobile menu.
2. Compact product introduction and current-draw panel.
3. Position workspace: Deposit/Withdraw tabs, amount input, masked values, encryption/decryption controls, operation progress.
4. Local prototype-state panel with deposit, pending, winner, non-winner, claimed, and withdrawn fixtures.
5. Three-step explanation: Deposit, Draw, Claim.
6. Public/private boundary comparison.
7. Fairness evidence rows.
8. Footer navigation.

## User Flows

### Simulated connection

`Connect wallet` changes the local header state to `Disconnect` and changes the hero action to `Open my position`. It does not request an injected wallet or display an account/network mismatch state.

### Simulated deposit

The user selects Deposit, enters an amount, and chooses `Encrypt & deposit`. The prototype changes to the pending fixture and displays four completed local stages: Wallet confirmation, Encrypting position, Submitted to pool, and Deposit complete.

### Private position reveal

Private values are masked by default. `Decrypt my position` reveals local example values for wallet balance, position/TWAB, and odds. This is directionally correct for user-authorized decryption, but it does not model relayer/KMS waiting, signature denial, expiry, or recovery.

### Winner/non-winner/claim

The fixture selector exposes winner and non-winner states. Winner adds `Decrypt & claim prize`; non-winner explicitly avoids exposing other users. Claimed shows a local `100 cUSDT` success status. The prototype does not yet separate claim submission from winner-only decryption or model an uncertain transaction.

### Withdrawal

The Withdraw tab changes the amount/action copy and the withdrawn fixture marks the position closed. It does not explain that principal can be withdrawn while a draw is pending, nor model partial/over-withdrawal behavior.

## Revealed Product Requirements

- A single-page dApp can carry the MVP if the pool workspace remains the dominant surface.
- Users need distinct public draw state and private account state.
- Deposit and withdrawal require visible encryption, signature, submission, confirmation, and recovery phases.
- Decryption must be an explicit user action; masked values are the correct default.
- Winner and non-winner outcomes need equivalent public-facing claim behavior while private result detail appears only after authorization.
- Public evidence must be legible to non-technical users and link to detailed explorer/provenance data.
- A prototype/demo fixture switch is useful for QA but must not ship in the live user surface.

## Revealed Technical Requirements

- React component boundaries: AppShell, Header/NetworkControl, DrawSummary, DrawLifecycle, PositionWorkspace, DepositForm, WithdrawalForm, PrivateValue, OperationProgress, ClaimPanel, PublicPrivateBoundary, EvidenceTable, and transaction notices.
- Wallet state: disconnected, connecting, connected, wrong chain, rejected, unsupported wallet, and reconnecting.
- Zama state: SDK initialization, input encryption/proof generation, encrypted transaction pending, user decryption authorization, relayer/KMS pending, completed, rejected, expired, and retryable failure.
- Chain state: epoch/draw query, deposit cutoff, RNG request/fulfillment, draw opening, TWAB finalization, claimed identity, and withdrawal receipt.
- Persistent recovery: save pending transaction hashes and recover mined/reverted state after reload or RPC disconnect.
- Dynamic configuration: chain ID, pool, confidential token, coordinator, adapter, explorer base URL, supported epoch/draw, and ABI/version manifest.

## Data Model Candidates

### DrawView

- `drawId`
- `epochStart`
- `epochEnd`
- `phase`
- `prizeHandle`
- `publicPrizeLabel` only if intentionally public
- `rngRequestId`
- `rngRequestedAtBlock`
- `rngRequestedAtTimestamp`
- `rngComplete`
- `rngFailed`
- `randomWord`
- `aggregateTwab`
- `commitTxHash`
- `openTxHash`

### PrivatePositionView

- `account`
- `principalHandle`
- `twabHandle`
- `payoutHandle`
- `walletBalanceHandle`
- `revealedPrincipal`
- `revealedTwab`
- `revealedPayout`
- `revealedWalletBalance`
- `claimed`
- `decryptionState`

### OperationRecord

- `kind`: deposit, withdraw, claim, decrypt
- `stage`
- `txHash`
- `submittedAt`
- `receiptStatus`
- `errorCategory`
- `retryPolicy`

## API And Event Candidates

- Browser wallet provider for account, chain, signing, and transaction submission.
- Zama relayer SDK for encrypted input construction/proof and authorized user decryption.
- ERC-7984 confidential-token reads/transfers and wrapper onboarding.
- Pool reads for epoch/draw metadata and encrypted handles.
- Pool events: `EncryptedDeposit`, `EncryptedYieldFunded`, `DrawRngCommitted`, `DrawOpened`, `EncryptedClaimRequested`, and `EncryptedWithdrawalRequested`.
- Coordinator `getDrawRequest(drawId)` plus adapter completion/failure/randomness reads.
- Sepolia explorer links for contracts and lifecycle transactions.
- No application database is required for the bounded MVP; pending-operation recovery can begin in local storage and reconcile against chain receipts.

## Auth, Permissions, And Security Implications

- Wallet connection is identity, not authentication to a backend.
- Never request or store a private key, seed phrase, or plaintext confidential amount in application logs/analytics.
- Decrypted values must remain in memory by default and must not be persisted without explicit design review.
- UI must distinguish public RPC reads from user-authorized decryptions.
- Wrong account or wrong chain must invalidate cached private results.
- Explorer/evidence labels such as `verified` must be derived from real deployment configuration, not static copy.
- Claim and withdrawal recovery must inspect a known transaction/state before offering a retry.

## State And Edge Cases

Present in prototype:

- disconnected/connected;
- deposit/withdraw tabs;
- deposit, pending, winner, non-winner, claimed, withdrawn;
- masked/revealed private values;
- mobile navigation.

Missing or incomplete:

- wrong network and chain switching;
- wallet rejection and disconnect during an operation;
- SDK/relayer/KMS loading and failure;
- insufficient public gas or confidential token balance;
- wrapping/approval prerequisite;
- epoch closed while composing a deposit;
- RNG delayed/failed;
- draw not open;
- TWAB not finalized;
- duplicate/already-mined claim recovery;
- partial and over-withdrawal;
- empty/zero prize reserve;
- multi-epoch history;
- stale configuration and unsupported deployment version.

## Target-stack Translation

Use the prototype as visual evidence, not production source. The target should remain React + Vite, with typed contract adapters, a Zama SDK service boundary, wallet/network hooks, read-only draw/evidence queries, confidential transaction actions, operation-recovery state, and centralized deployment configuration. Mock fixtures should live behind development-only adapters or Storybook-like state fixtures and be excluded from the production route.

## Mocked Prototype Surfaces

- wallet connection and account state;
- static Sepolia indicator;
- static draw ID, prize, countdown, and lifecycle;
- deposit and withdrawal balances;
- TWAB and odds;
- encryption/decryption and operation timing;
- winner, non-winner, claimed, and withdrawn outcomes;
- all evidence values and copy buttons;
- `Sepolia · verified` labels;
- pool `0x8C2a…91dE`, coordinator `0x6B17…eA43`, adapter `0x1A04…0f7B`, request text, and transaction hash;
- all explorer behavior.

The real hardened evidence is pool `0xF99747C771c09909f6Ad56F43D742c7757ECD9E0`, coordinator `0xabc4d6ca46A91cFF083cD0086B81337adC7ed6cA`, adapter `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A`, request ID `4`, and the transaction set recorded in `zama-context/08-bounty-pooltogether/fhevm-sepolia-deployment.md`.

## Required Prototype Reintegration

Prototype reintegration is mandatory before implementation because all core flows depend on live wallet, Zama, confidential token, pool, coordinator, adapter, and explorer behavior. Each mocked surface must be assigned to a real integration, development-only fixture, explicit out-of-scope state, or documented blocker.

The final contract ABI should be frozen before wiring the full frontend. In particular, the current one-epoch contract must either be extended to rolling epochs/periodic draws or documented as a bounded demo departure from the bounty requirement.

## Spec Deltas

- Keep the current white/yellow/charcoal editorial system, sharp rules, masked-value treatment, and plain-language public/private explanation.
- Remove the `Local prototype state` panel from production; retain it only in a development fixture route.
- Replace illustrative evidence with real deployment configuration and explorer links.
- Replace `Values are illustrative and never connect to a live contract` with accurate live-path disclosure once integrated.
- Add explicit principal-withdrawable messaging and yield-source disclosure.
- Add a short, accurate explanation that Zama FHE computes eligibility over encrypted user values while Chainlink provides public randomness.
- Use `cUSDTMock` on Sepolia wherever the deployed asset is a mock; do not label it production cUSDT.
- Remove the Replit watermark from the final hosted product.

## Story Deltas

- As a disconnected user, I can understand the protocol without exposing or entering financial data.
- As a connected user on the wrong network, I can switch to Sepolia safely.
- As a depositor, I can follow encryption, signature, submission, confirmation, and recovery as separate stages.
- As a participant, I can decrypt only my principal/TWAB/result and understand that this authorization is private to me.
- As a non-winner, I receive a normal completed flow without learning anyone else's state.
- As a winner, I can recover an already-submitted claim after an RPC disconnect without double-submitting.
- As a verifier, I can reproduce the public draw provenance from real contract and transaction links.
- As a withdrawing user, I can request a partial or full encrypted principal withdrawal and recover the transaction state.

## Plan Deltas

1. Fix the prototype's mobile overflow before accepting it as a visual specification.
2. Select a hybrid visual direction: current Replit brand system plus the product-first Codex workspace concepts.
3. Freeze rolling-epoch/final ABI and yield boundary.
4. Run prototype reintegration to map every mock to a real contract/SDK action.
5. Implement the frontend locally in the final public repository.
6. Verify desktop/mobile fidelity and every live state against the accepted concept.
7. Deploy without third-party prototype branding and run a fresh multi-wallet lifecycle.

## Quality Profile Deltas

- Mobile is currently a release blocker. At 390px, `document.documentElement.scrollWidth` is `585px`; the position workspace and prototype-state panel overflow by `195px`, clipping odds and controls. The base grid needs `minmax(0, 1fr)` behavior and child `min-width: 0`, with single-column private metrics/actions on narrow screens.
- The connected wallet can coexist with helper copy saying `Connect a wallet to begin a private deposit` after selecting the deposit fixture; state-derived copy must use one authoritative wallet/session source.
- Desktop visual quality is strong, approximately 8/10: distinctive type, clear hierarchy, restrained palette, coherent borders, and good educational rhythm.
- The first viewport remains more marketing-led than ideal for a dApp. The product-first concept makes deposit, private position, current draw, and evidence visible together.
- Interactive controls are accessible by role/test ID and the page produced no console warnings in the inspected path.
- `Made with Replit` overlays application content and is unsuitable for the judged deployment.

## Open Questions

- Approve the hybrid product-first concept or keep the current long-page composition after mobile fixes?
- Is the final public name `Confidential Pool`, or should branding be frozen before implementation?
- Will the final contract support rolling epochs and periodic draws?
- Which real or controlled yield boundary will the submission claim?
- Should private odds be shown after decryption, or explained without displaying a precise number to reduce inference risk?

## Evidence

- `zama-context/08-bounty-pooltogether/prototype-evidence/replit-desktop-1440x900.png`
- `zama-context/08-bounty-pooltogether/prototype-evidence/replit-desktop-full.png`
- `zama-context/08-bounty-pooltogether/prototype-evidence/replit-mobile-top-390x844.png`
- `zama-context/08-bounty-pooltogether/prototype-evidence/replit-mobile-overflow-390x844.png`
- `zama-context/08-bounty-pooltogether/prototype-evidence/codex-product-first-desktop-v1.png`
- `zama-context/08-bounty-pooltogether/prototype-evidence/codex-product-first-mobile-v1.png`
- `zama-context/08-bounty-pooltogether/replit-frontend-design-brief.md`
- `zama-context/08-bounty-pooltogether/fhevm-sepolia-deployment.md`


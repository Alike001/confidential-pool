# Prototype Reintegration: Confidential Pool

## Verdict

The hybrid visual direction is approved on 2026-09-04: retain the Replit prototype's white/yellow/charcoal identity, editorial typography, sharp borders, masked private-value treatment, and educational sections, while adopting the Codex product-first workspace and mobile stacking.

The MVP should be one public application route, not a separate marketing site plus dApp. A compact introduction, three-step explanation, privacy boundary, and fairness evidence provide the landing-page function, while the deposit/withdraw workspace and current draw remain in the first viewport. A later standalone marketing route is `REAL_LATER`, not required for the bounty proof.

The prototype is approved as design evidence only. Its local wallet, encryption, draw, balances, claims, withdrawals, and evidence must not ship. Real frontend implementation is allowed only after the final submission ABI and deployment boundary are frozen. The current fixed-epoch deployment proves the protocol, but the final submission should add rolling epochs/periodic draws or explicitly narrow and disclose the departure from the bounty requirement.

## Inputs Checked

- `.thoughts/prototype-discovery/2026-09-04-confidential-pool.md`
- `.thoughts/quality/2026-09-03-confidential-pooltogether.md`
- `.thoughts/plans/2026-09-03-confidential-pooltogether.md`
- `zama-context/08-bounty-pooltogether/replit-frontend-design-brief.md`
- `zama-context/08-bounty-pooltogether/bounty-requirements.md`
- `zama-context/08-bounty-pooltogether/confidential-architecture.md`
- `zama-context/08-bounty-pooltogether/implementation-plan.md`
- `zama-context/08-bounty-pooltogether/fhevm-sepolia-deployment.md`
- `zama-context/fhevm/library-solidity/examples/ConfidentialPoolTogetherSlice.sol`
- Live Replit prototype and the discovery evidence captured at desktop, intermediate, and mobile widths.
- Current Zama Relayer SDK documentation for [browser initialization and encrypted inputs](https://github.com/zama-ai/relayer-sdk/blob/main/docs/webapp.md) and [wallet-authorized user decryption](https://github.com/zama-ai/relayer-sdk/blob/main/docs/user-decryption.md).

No exported Replit source is present locally. The final frontend will therefore be implemented from the approved visual evidence and design tokens unless a source export is later supplied.

## Screen-to-Reality Matrix

| Surface or state | User intent and visible behavior | Real source/action | Boundary and recovery | Decision |
|---|---|---|---|---|
| Header and network | Identify the product, see Sepolia, connect wallet | EIP-1193 wallet account/chain state; switch to chain `11155111` | Rejected connection, unsupported wallet, account change, disconnect, and wrong chain must have distinct states | `REAL_MVP` |
| Compact introduction | Understand private savings and public proof | Static, reviewed product copy | Must say `cUSDTMock` for the Sepolia asset and avoid production/audit claims | `REAL_MVP` |
| Current draw | See draw ID, epoch timing, phase, and countdown | Pool epoch/draw reads plus coordinator and adapter reads | RPC loading/stale state; countdown derives from chain timestamp/config, not a hard-coded timer | `REAL_MVP` |
| Lifecycle rail | Understand deposit-open, epoch-close, RNG, draw-open, and claim phases | Pool events and state; coordinator `getDrawRequest`; adapter request status | Delayed/failed RNG and missing coordinator binding need truthful states | `REAL_MVP` |
| Deposit form | Enter an amount and deposit confidentially | Zama Relayer SDK encrypted input/proof plus ERC-7984 confidential token transfer callback | SDK initialization, proof upload, wallet rejection, pending receipt, revert, and uncertain RPC result are separate stages | `REAL_MVP` |
| Token setup | Obtain/wrap test asset before depositing | Sepolia `cUSDTMock` wrapper and underlying test token flow | Explicitly label faucet/mint/wrap behavior as testnet setup | `REAL_MVP` for demo onboarding; never imply production cUSDT |
| Withdraw form | Withdraw partial or full principal without exposing amount | Relayer SDK encrypted `euint128` input and pool `requestWithdrawal` | Over-withdrawal returns encrypted zero; transaction recovery must reconcile the receipt and latest encrypted balance handle | `REAL_MVP` |
| Private position | Keep principal/TWAB/balance masked until requested | Pool encrypted-handle reads and batch `userDecrypt` after EIP-712 wallet authorization | Do not persist plaintext results; invalidate them on account/network change; show relayer/KMS timeout/retry | `REAL_MVP` |
| Private odds | Understand eligibility without exposing it publicly | Derived only from user-decrypted TWAB plus public draw parameters, if included | Precise odds can increase inference risk; default to explanation and make exact display a post-review option | `REAL_LATER` unless privacy review approves |
| Result ready | Learn whether this account won | Read encrypted payout handle, then user-authorized decryption | Before decryption, say only `Encrypted result ready`; do not show winner/non-winner | `REAL_MVP` |
| Claim | Submit one normal-shaped claim and privately learn payout | Pool `claimPrize`, encrypted token settlement, `encryptedClaimablePrize`, and `claimed` | Recover an already-mined claim after disconnect; never use a public revert or success label as a winner oracle | `REAL_MVP` |
| Yield/prize | Understand where prize liquidity came from | Encrypted yield reserve plus the selected yield adapter/disclosure | Current live path is operator-funded controlled yield; UI must disclose this unless replaced by a genuine strategy | `BLOCKED` on final product claim; controlled-yield disclosure is viable |
| Fairness evidence | Verify contracts, RNG request, and lifecycle transactions | Deployment manifest, pool/coordinator/adapter reads, and Sepolia explorer links | Evidence labels must be computed from current config; stale/mismatched deployment config is a hard error | `REAL_MVP` |
| Public/private explanation | Understand what observers can and cannot see | Reviewed static explanation backed by the threat model | Must disclose addresses, timing, gas, public aggregate TWAB, draw transcript, and claim identity metadata | `REAL_MVP` |
| Transaction progress | Know whether to wait, retry, or inspect | Wallet submission, transaction hash, receipt, contract event, relayer/KMS state | Persist only public pending-operation metadata locally; inspect known transaction before offering retry | `REAL_MVP` |
| Prototype state selector | Review all visual states | Local fixtures | Must be excluded from the production route/build or placed behind an explicit development-only route | `SIMULATED_DEMO_ONLY` |
| Separate marketing site | Browse a larger brand/SEO experience | Static content and optional routing | Adds navigation, hosting, accessibility, and content-review work without strengthening the live proof | `REAL_LATER` |

## Integration Inventory

| Integration | Purpose | Current evidence | MVP requirement |
|---|---|---|---|
| Browser EIP-1193 wallet | Account, Sepolia chain, signatures, transactions | Not present in prototype | Required |
| Zama Relayer SDK | SDK init, encrypted input/proof generation, user decryption | Current Node scripts and live Sepolia lifecycle; official browser flow verified | Required |
| Pool contract | Deposit callback accounting, withdrawal, draw state, TWAB finalization, claim, encrypted handles | Hardened pool `0xF99747C771c09909f6Ad56F43D742c7757ECD9E0` completed one lifecycle | Required; final ABI must be frozen |
| ERC-7984-shaped cUSDTMock | Confidential deposits, payouts, and principal return | Live wrapper `0x4E7B06D78965594eB5EF5414c357ca21E1554491` | Required and visibly labeled as a mock/testnet asset |
| RNG coordinator | Draw-to-request binding and timestamp provenance | `0xabc4d6ca46A91cFF083cD0086B81337adC7ed6cA` | Required |
| Chainlink VRF adapter | Public verifiable random word | `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A`; request `4` fulfilled | Required |
| Sepolia RPC | Public reads, simulation, submission, receipt recovery | Live lifecycle succeeded but prior free endpoints rate-limited/timed out | Required; configure fallback/read resilience without embedding secrets |
| Block explorer | Human-verifiable contract and transaction evidence | Hardened transaction set recorded locally | Required |
| Local storage | Pending public transaction recovery and UI preferences | Not implemented | Required for transaction hashes/stages only; never decrypted values or secrets |
| Backend/database | None needed for the bounded MVP | No dependency | `OUT_OF_SCOPE` |
| Analytics | Optional | None | `OUT_OF_SCOPE` unless privacy-reviewed and amount-free |

## Mocked Prototype Surface Register

| Prototype mock | Required replacement |
|---|---|
| Connect/disconnect toggle | Real wallet connector and account/network state machine |
| Static Sepolia dot | Chain ID validation and switch flow |
| Static draw/prize/countdown | Contract/config/event-derived draw view |
| Fake balances, TWAB, odds, and payout | Encrypted handles plus explicit user decryption |
| Instant encryption stages | Actual SDK init, encrypted-input upload/proof, wallet transaction, and receipt stages |
| Local winner/non-winner selector | Encrypted claim followed by authorized decryption only |
| Local claimed/withdrawn states | Contract claim flag, encrypted payout/balance handles, and transaction receipts |
| Illustrative addresses and `verified` labels | Hardened/final manifest addresses and explorer-backed evidence |
| Fake request/transaction IDs | Coordinator, adapter, pool events, and real transaction hashes |
| Replit watermark | Independent final hosting |

## No-Shipping-Mock Decisions

- `REAL_MVP`: wallet/network, contract reads/writes, Zama encryption/proofs, authorized decryption, confidential token movement, draw state, claim, withdrawal, real evidence, error/recovery states, and responsive layout.
- `REAL_LATER`: standalone marketing site, exact private-odds display, draw history beyond what the final rolling-epoch scope needs, and analytics.
- `SIMULATED_DEMO_ONLY`: visual state fixtures on a development-only route/build.
- `OUT_OF_SCOPE`: backend account system, database, fiat onboarding, full PoolTogether V5 tier/vault/auction compatibility, and mainnet asset claims.
- `BLOCKED`: honest final yield wording until we choose a genuine strategy or formally accept controlled encrypted funding; final frontend contract adapter until the rolling-epoch/fixed-epoch ABI decision is frozen.

## Spec Deltas

- Treat the approved experience as a product page with embedded landing content, not two separately maintained sites.
- The first desktop viewport must include current draw, primary account action, private position, and a route to evidence.
- Mobile must stack every grid at 390px with zero horizontal overflow; add `min-width: 0` to grid children and use `minmax(0, 1fr)` tracks.
- Pre-decryption result copy is `Encrypted result ready. Decrypt to learn your outcome.` Only authorized decrypted state may say winner or non-winner.
- Replace all prototype addresses with a typed deployment manifest and validate chain ID plus bytecode before enabling writes.
- Use `cUSDTMock` consistently in Sepolia UI and documentation.
- Keep decrypted values in memory only by default.
- The landing explanation must state that Zama computes user eligibility over encrypted values while Chainlink provides public randomness; the public aggregate and metadata leakage remain disclosed.

## Story Deltas

- As a visitor, I can understand the value proposition and privacy boundary without connecting a wallet.
- As a connected Sepolia user, I can acquire/wrap the test asset, encrypt a deposit, and recover the transaction after reload.
- As a participant, I see only that an encrypted result is ready until I authorize decryption.
- As a winner or non-winner, I use the same claim surface and privately learn my payout afterward.
- As a withdrawing user, I can request a partial or full encrypted withdrawal and privately confirm the resulting balance.
- As a verifier, I can open the real pool, coordinator, adapter, RNG, draw, claim, and withdrawal evidence on Sepolia.
- As a mobile user, I can complete the judged path at 390px without clipping or horizontal scrolling.

## Quality Profile Deltas

- Add browser integration tests for disconnected, wrong-chain, wallet rejection, SDK initialization failure, RPC uncertainty, delayed decryption, winner, non-winner, partial withdrawal, and reload recovery.
- Treat any fake `verified`, winner, amount, address, or transaction display in the production build as a release blocker.
- Add a build-time production guard that excludes development fixtures.
- Test at 390, 780, and 1440px, with keyboard navigation and reduced motion.
- Add CSP/secret checks and verify that private keys, seed phrases, plaintext confidential values, and decryption keys never enter the repository, logs, analytics, or local storage.

## Plan Prerequisites

1. Freeze the public name and consolidate the public repository layout.
2. Harden and freeze the locally implemented rolling-epoch/KMS-proven candidate ABI.
3. Decide genuine yield adapter versus prominently disclosed controlled encrypted yield.
4. Freeze the final pool/token/coordinator ABI and versioned Sepolia deployment manifest.
5. Then implement the approved frontend with real wallet, Relayer SDK, contract, and evidence adapters.

## Blockers And Open Questions

- `Confidential Pool` remains a working name, not a frozen brand.
- The implementation is split between the research root, reference contract repository, and nested FHEVM checkout; it must be consolidated before public release.
- The live evidence pool has immutable `epochStart`/`epochEnd`. A recurring candidate now passes ten focused core and adversarial tests locally, but it still needs gas/HCU measurement, operational scripts, and a fresh Sepolia lifecycle before replacing that deployment.
- The current prize reserve is controlled operator-funded yield, not strategy-generated yield.
- A fresh live multi-wallet winner/non-winner run has not yet been captured against the final contract release.
- Source verification, stable public hosting, video, X/article, and final submission copy remain undone.

## Planning Gate Decision

Planning is allowed for the smaller real-integration slice: frontend shell, typed deployment configuration, wallet/network state, read-only draw/evidence adapters, operation-state model, and development fixtures.

Production write integration is gated by hardening/deploying the recurring candidate ABI and the yield disclosure decision. The current hardened deployment remains valid protocol evidence, but it should not be treated as the final recurring-pool release.

## Evidence

- Approved Replit/Codex hybrid screenshots in `zama-context/08-bounty-pooltogether/prototype-evidence/`.
- Hardened Sepolia lifecycle in `zama-context/08-bounty-pooltogether/fhevm-sepolia-deployment.md`.
- Current contract surface in `zama-context/fhevm/library-solidity/examples/ConfidentialPoolTogetherSlice.sol`.
- Prototype discovery report in `.thoughts/prototype-discovery/2026-09-04-confidential-pool.md`.

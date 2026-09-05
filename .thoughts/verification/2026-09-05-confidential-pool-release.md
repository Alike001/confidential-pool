# Verification Audit: Confidential Pool final guarded release

## Verdict

**Conditional pass.** The implementation and Sepolia release pass the technical bounty requirements. The remaining conditions are presentation/external-account tasks: one injected-wallet QA walkthrough, the real-person demo video, the X announcement, and the one-shot submission form.

## Artifacts Checked

- `README.md`
- `zama-context/08-bounty-pooltogether/submission-package.md`
- `zama-context/08-bounty-pooltogether/implementation-plan.md`
- `zama-context/08-bounty-pooltogether/fhe-random-sepolia-release.md`
- `zama-context/08-bounty-pooltogether/fhe-random-keeper-runbook.md`
- `zama-context/fhevm/library-solidity/examples/FheRandomConfidentialPoolTogether.sol`
- `zama-context/fhevm/library-solidity/examples/ConfidentialPoolEpochAccounting.sol`
- `zama-context/fhevm/library-solidity/examples/AaveYieldConfidentialToken.sol`
- `zama-context/fhevm/library-solidity/test/phase2/`
- `confidential-pooltogether/frontend/src/`
- final root commit `f8393ac`
- final FHE fork commit `8addf2a`

## Requirement Traceability

| Requirement | Implementation evidence | Verification evidence | Result |
| --- | --- | --- | --- |
| Shared asset pool | Encrypted caLINK balances and epoch accounting in `ConfidentialPoolEpochAccounting.sol` | Deposit tx `0x5386de0b754743ba7602c1ed4e22e11ee8937b16ebc82d499d4179eb2eb7ef51`; owner decryption returned `9 caLINK` | Pass |
| Generated yield funds prizes | `AaveYieldConfidentialToken.harvestYield()` mints only backing surplus to the encrypted reserve | Harvest tx `0xf2ad1504522b122ade360d7eaab707c3a4446e81d1314a0643fc4b3bfa495efc`; final backing remained above issued liabilities | Pass |
| Periodic draws | Permissionless rolling epoch accounting plus draw opening for finalized epochs | Epoch advance tx `0x0656c4094f82b75f489eadf6a6170d79d67f1f29fdd5828d82f0aac8d59c8deb`; draw-open tx `0x6a08dc1b818c192053f2dd38cdf82963a8492b97f71325334ff5c229df5f602f` | Pass |
| Deposits and balances encrypted | External encrypted inputs, ciphertext balance/TWAB state, and account ACL grants | 49-test FHE suite plus live owner-only balance/TWAB decryption | Pass |
| Onchain FHE randomness | `FHE.randEuint64()` in `prepareClaim`; encrypted threshold comparison | Prepare-random tx `0x8338e11808aed67428d48a9227764f059961acc24ebe342a13fd8f1fbd05a582`; nonzero ciphertext handle | Pass |
| Deposit-weighted winner selection | V5-style winning zone, fixed `2^64` threshold, strict encrypted comparison | Exact user and aggregate TWAB both `6720000000000000000`; weight and threshold txs mined | Pass |
| Winner-only prize decryption | Claim payout is ACL-authorized to the claimant; random sample is not | Claim tx `0x174442f7d6e338ad8038971982fc32e787fcf7c2d4a290042d1e0b3b6b33b3cb`; claimant decrypted `100000000000000` | Pass |
| Principal withdrawable | Encrypted withdrawal acceptance and KMS-backed confidential-token exit boundary | Withdrawal tx `0xa82c02b191863acddf5c8c23dfacd90bd1f7dc710f26254be16158534552af7f`; pool principal became zero | Pass |
| Verifiable onchain lifecycle | KMS proof for public aggregate, public stage events, source-matched contracts | Strict auditor returned `FHE_RANDOM_AAVE_LIFECYCLE_COMPLETE: true`; Sourcify matches `47164756` and `47164757` | Pass |
| Sepolia web dApp | Write-enabled React/Vite app points at the final guarded pair | Production URL returned HTTP 200 and deployed JS contained the final pool address | Pass |

## Acceptance Criteria Coverage

| Criterion | Evidence | Status |
| --- | --- | --- |
| Deposit → draw → claim → withdraw works on Sepolia | Complete strict-audit transaction sequence | Pass |
| No offchain RNG | Final pool directly calls `FHE.randEuint64()` | Pass |
| Prize comes from generated yield, not sponsored reserve | Aave surplus-only harvest and backing invariant | Pass |
| Extra prize indices cannot create repeated attempts | `(tier 0, prizeIndex 0)` guard and adversarial regression test | Pass |
| Frontend is polished and responsive | 1440×1100 and 390×844 production screenshots; no clipping or error overlay | Pass |
| Browser wallet can execute every hosted action | Code paths and CLI lifecycle pass, but final injected-wallet clicks still require human approvals | Manual check required |
| Real-person video is at most three minutes | Outline exists; recording does not yet exist | Pending |
| X announcement and one-shot form | External personal-account actions | Pending |

## Quality Gates

| Gate | Result |
| --- | --- |
| Phase-2 FHE/Aave suite | 49 passing |
| Foundry suite | 13 passing |
| JavaScript reference models | 12 passing |
| Script TypeScript check | Pass |
| React/Vite production build | Pass |
| Strict Sepolia lifecycle auditor | `FHE_RANDOM_AAVE_LIFECYCLE_COMPLETE: true` |
| Sourcify creation/runtime match | Pass for final pool and caLINK wrapper |
| Vercel production deployment | Ready; deployment `dpl_vSVGzax1k7Ctmj43zGkUQunHPQyo` |

## Deviations From Plan

- Public Chainlink randomness was replaced by encrypted Zama FHE randomness after the official form clarified that no offchain RNG should be used. Historical Chainlink deployments remain regression evidence only.
- Full PoolTogether V5 tiering and liquidation auctions were reduced to one guarded prize slot. This is an explicit smallest-correct confidential adaptation, not a full V5 port.
- The aggregate TWAB is public after KMS proof; individual balances, TWABs, thresholds, random samples, winner bits, and payouts remain encrypted.
- Keeper automation is documented but not deployed. Epoch advancement and aggregate finalization remain runbook operations.

## Gaps And Risks

- A real injected wallet must still verify the hosted connect, network-switch, setup, encrypted deposit, decryption, claim-stage, and withdrawal controls.
- The app-specific caLINK wrapper is not a canonical Zama asset. Shield and redemption amounts are public boundary values.
- The contracts are production-oriented pre-audit software, not professionally audited.
- Small anonymity sets and repeated public action timing can support inference even when values remain encrypted.

## Follow-ups

1. Run the hosted injected-wallet checklist against `https://frontend-two-chi-54.vercel.app`.
2. Record the real-person, normal-speed walkthrough in three minutes or less.
3. Insert the final video URL into `submission-package.md`.
4. Publish the X announcement tagging `@zama` and `#ZamaDeveloperProgram`.
5. Review every link once, then submit the one-shot bounty form.

## Evidence Log

- Final pool: `0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88`
- Final confidential Aave wrapper: `0x78da50E954d2fC69C10688032c8c07D2ABC52750`
- Strict-audit TWAB: `6720000000000000000`
- Strict-audit payout: `100000000000000`
- Strict-audit final pool principal: `0`
- Strict-audit final wallet confidential balance: `10000099999999999995`
- Strict-audit backing / issued / pending yield: `10000977372955696152 / 10000133278130322198 / 844094825373954`
- Frontend: `https://frontend-two-chi-54.vercel.app`

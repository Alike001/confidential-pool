# Phase 2 encrypted slice

## Status

The first product-shaped FHEVM slice passes its focused integration suite against the local mocked coprocessor. It is a feasibility milestone, not a Sepolia-ready contract.

Implementation: [`ConfidentialPoolTogetherSlice.sol`](../fhevm/library-solidity/examples/ConfidentialPoolTogetherSlice.sol)

Tests: [`ConfidentialPoolTogetherSlice.ts`](../fhevm/library-solidity/test/phase2/ConfidentialPoolTogetherSlice.ts)

## What the slice proves

| Concern | Slice behavior | Privacy boundary |
| --- | --- | --- |
| Deposit | User calls the confidential token's `confidentialTransferAndCall`; the pool callback adds the encrypted transferred amount | Amount is absent from the event; caller can decrypt their balance |
| Yield funding | Designated provider uses the token callback path with a funding-kind marker; the pool adds the encrypted amount to its reserve | Reserve amount is not emitted or publicly branch-tested |
| Withdrawal | Uses encrypted `le` and `select`, then sends the accepted amount through the token | An over-request completes without a public success/failure branch |
| Draw | The slice supports operator commit/reveal and an `IRng`-style provider request; provider-backed finalization is permissionless after completion | Provider request status and public draw parameters are visible; user-specific eligibility remains encrypted |
| Eligibility | Finalizes the user's encrypted draw-period TWAB, then computes `floor(floor(TWAB × odds) × fraction)` | Intermediate winning zone is not granted to the caller |
| Claim | Selects the stored encrypted draw prize or encrypted zero, then caps it against the encrypted reserve | Only the caller can decrypt the payout result; reserve sufficiency is not public |
| Non-winner | Same claim call completes and returns encrypted zero to the caller | No direct public revert/result oracle |

## Exact operation tested

The product-shaped contract now maintains an encrypted fixed draw epoch:

```text
accrue        = balance × elapsedSeconds
userTwab      = cumulativeBalance / epochDuration
firstProduct  = userTwab × tierOdds
secondProduct = firstProduct × vaultContributionFraction
W             = floor(secondProduct / 1e18 / 1e18)
winner        = publicReducedRandom < W
payout        = winner ? encryptedPrize : encryptedZero
```

This matches the fixed-point shape reconstructed from V5 for positive values. The slice does not maintain V5's full historical ring buffer, so it must be described as a fixed-epoch TWAB adaptation rather than a V5-compatible `TwabController` implementation.

## What remains deliberately incomplete

- The product-shaped slice derives user-specific entropy from `keccak256(drawId, vault, user, tier, prizeIndex, drawRandomNumber)` and applies V5-style rejection sampling. The operator is now authenticated and the random value is bound to the draw parameters by commit/reveal. This still does not provide unbiased randomness if the single operator can choose the seed before committing.
- The older `Phase2WinnerPrimitive` remains a lower-level experiment that accepts an already-reduced random value for isolated FHE cost testing.
- TWAB finalization is a separate transaction from claiming because combining epoch division, winner selection, reserve solvency, and token transfer exceeded the local FHE transaction-depth limit.
- No real Sepolia ERC-7984 transfer occurs; only the local token mock is exercised.
- The yield reserve is only an encrypted accounting bucket funded by a designated provider in the local mock; no real yield source or Prize Vault adapter exists.
- The draw stores an encrypted prize, but the local opener is not yet a production-authorized prize-tier manager.
- Claim identity is public and one-time, but there is no full V5 claim bitmap or permissionless claimer flow.
- No multi-tier prize accounting, fee accounting, liquidation, or permissionless claiming exists.
- The local coprocessor is test infrastructure, not Sepolia evidence.

## Acceptance evidence

The focused suite covers:

1. encrypted balance plus V5-style winning-zone eligibility and winner-only payout access;
2. successful non-winning claim with encrypted zero payout;
3. an underfunded winning claim that returns encrypted zero without exposing reserve insufficiency;
4. over-withdrawal that completes and leaves the encrypted balance unchanged;
5. duplicate-claim rejection using public claim identity;
6. late deposit producing a TWAB of `10` rather than a closing balance of `100`;
7. operator authorization, nonzero randomness, and commitment/reveal mismatch checks;
8. incomplete, failed, and completed provider-backed RNG lifecycle behavior.

The draw transcript, encrypted epoch accounting, local asset-settlement portions, operator commit/reveal checks, and provider-backed draw finalization now pass. The next implementation gate is replacing the local mock with a selected external unbiased RNG/VRF, connecting the accounting model to a real yield source/Prize Vault adapter, and replacing the mock with the verified Sepolia ERC-7984 wrapper. No real cUSDT transaction has been sent.

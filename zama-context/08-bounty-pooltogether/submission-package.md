# Confidential Pool submission package

## Title

Confidential Pool

## One-line summary

Save privately. Win transparently: a Sepolia prize-savings pool where deposits, time-weighted balances, eligibility, and payouts stay encrypted while the draw remains publicly verifiable.

## Problem

Prize-savings protocols make participation verifiable, but ordinary public ledgers also reveal every user's deposits, withdrawals, balances, and financial position. That transparency can expose savings behavior and allow observers to reconstruct a participant's odds.

## Solution

Confidential Pool adapts the essential PoolTogether loop to Zama FHEVM. Users deposit confidential cUSDTMock, build an encrypted time-weighted average balance (TWAB), participate in a Chainlink-backed draw, privately settle a winner or non-winner payout through the same public transaction shape, and withdraw principal. The protocol deliberately reveals only the epoch-wide aggregate denominator needed for public draw verification.

## What works today

- confidential ERC-7984 deposits and withdrawals;
- recurring one-hour epochs with encrypted user and total TWAB accumulators;
- sequential user checkpoints across epoch boundaries;
- KMS-proven public aggregate-supply finalization;
- post-close Chainlink VRF request binding with block and timestamp provenance;
- encrypted winner-zone evaluation using Sepolia-supported FHE operations;
- identical non-reverting prepare/settle claim flow for winners and non-winners;
- owner-only decryption of user TWAB, position, and payout;
- operator-only recovery of Chainlink overpayment refunds;
- responsive React frontend with live Sepolia reads and encrypted writes.

## Architecture

```text
React/Vite frontend
        |
        | Zama SDK input encryption / owner decryption
        v
RecurringConfidentialPoolTogether
        |-- encrypted principal and TWAB state
        |-- KMS-proven public aggregate denominator
        |-- encrypted winner comparison and payout
        |
        +--> cUSDTMock (ERC-7984 confidential settlement)
        |
        +--> RngRequestCoordinator
                    |
                    +--> ChainlinkVrfRngAdapter --> Chainlink VRF v2.5
```

## Fairness and privacy model

The epoch boundary, tier configuration, aggregate TWAB, Chainlink request provenance, random word, draw opening, and claim identities are public. Individual deposits, balances, TWABs, winning bits, reserve amount, and payouts are encrypted. Each user's draw randomness is derived from the public draw transcript and user identity, then compared with that user's encrypted winning zone. Winner and non-winner claims use the same public calls and do not branch by reverting.

The system provides confidentiality, not anonymity. Wallet addresses, transaction timing, calldata size, gas, and action type remain observable. The aggregate denominator is intentionally public and can leak more in very small anonymity sets; the UI and threat model disclose this limitation.

## Final Sepolia release

- Pool: `0xE0d284649E955d03B02F3cf927D60271d41C52D1`
- Refund-safe RNG coordinator: `0xa90A46B27147C532Bb6844d49d285FEba9819074`
- Chainlink VRF adapter: `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A`
- Confidential token: `0x4E7B06D78965594eB5EF5414c357ca21E1554491`
- Network: Ethereum Sepolia (`11155111`)
- Pool Sourcify exact match: [record](https://sourcify.dev/server/v2/contract/11155111/0xE0d284649E955d03B02F3cf927D60271d41C52D1?fields=all)
- Coordinator Sourcify exact match: [record](https://sourcify.dev/server/v2/contract/11155111/0xa90A46B27147C532Bb6844d49d285FEba9819074?fields=all)
- Adapter Sourcify exact match: [record](https://sourcify.dev/server/v2/contract/11155111/0x2387Ac275b6ADa26959c587d93abFbd491A64D5A?fields=all)

## Verified live evidence

The final two-wallet epoch produced encrypted user TWABs that privately decrypted to `936666` and `836666`. Zama KMS proved the public aggregate `1773333`; the one-unit difference from the sum of individually floored values is caused by dividing the summed total accumulator only once. Chainlink request `8` was made after epoch close and atomically bound to draw `1`. Wallet A privately decrypted payout `0`; wallet B privately decrypted payout `100000`. Both wallets withdrew their full `1000000` principal and ended with zero pool principal. Both strict account audits returned:

```text
RECURRING_LIFECYCLE_COMPLETE: true
```

The exact transaction-by-transaction transcript is in [`recurring-sepolia-deployment.md`](./recurring-sepolia-deployment.md).

## Local verification

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
forge test

cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
DOTENV_CONFIG_PATH=.env.example npx hardhat test --network hardhat \
  test/phase2/ConfidentialPoolTogether.ts \
  test/phase2/ConfidentialPoolTogether.adversarial.ts \
  test/phase2/ConfidentialPoolTogether.HCU.ts \
  test/phase2/ConfidentialPoolTogetherSlice.ts
npm run check:lifecycle-scripts

cd /home/ali/Desktop/zama/confidential-pooltogether/frontend
npm install
npm run build
npm run preview
```

Current results: 13 Foundry tests, 25 focused FHE tests, lifecycle TypeScript/lint checks, and the frontend production build pass.

## Three-minute demo outline

1. **0:00–0:20 — Problem:** Public prize savings reveal every participant's position and odds.
2. **0:20–0:40 — Product:** Open Confidential Pool, connect Sepolia, and show the live epoch/draw card.
3. **0:40–1:10 — Private savings:** Deposit cUSDTMock and show that the application event publishes no plaintext amount.
4. **1:10–1:35 — Verifiable draw:** Show the KMS-proven aggregate, coordinator-bound Chainlink request, and source-verification links.
5. **1:35–2:05 — Private outcome:** Show the same prepare/settle flow for both users, then owner-decrypt the winner's `100000` payout and the non-winner's zero.
6. **2:05–2:30 — Principal safety:** Withdraw the full principal and show the authorized before/after decryptions.
7. **2:30–3:00 — Architecture and limits:** Explain the FHE boundary, public metadata, sponsored reserve, and path to a batched real-yield adapter.

## Screenshot shot list

1. Landing/app hero with “Save privately. Win transparently.” and live Sepolia draw.
2. Connected private-position card showing encrypted placeholders before owner decryption.
3. Public draw evidence card with pool, coordinator, request, and Sourcify links.
4. Owner-decrypted winner payout and confirmed claim state.
5. Mobile layout showing the current draw and deposit workspace.

## Known limitations

- The Sepolia asset is `cUSDTMock`, not mainnet cUSDT.
- The encrypted prize reserve is sponsored testnet funding; deposited principal is not supplied to a live lending strategy, so this release must not claim production yield generation.
- The bounded release has one tier and one prize index rather than full PoolTogether V5 tiering and liquidation auctions.
- Epoch advancement, user checkpointing, aggregate decryption, RNG requesting, and draw opening need automated keeper operations for an unattended deployment.
- The aggregate denominator and action metadata are public; small anonymity sets can leak information through inference.
- Hosted injected-wallet signing QA remains before the public demo URL is frozen.

## Links to fill before sending

- Public product/research repository: `TODO`
- Public FHE implementation fork/branch: `TODO`
- Public frontend: `TODO`
- Demo video: `TODO`
- Zama submission form: <https://forms.zama.org/developer-program-mainnet-season4-bounty-track>

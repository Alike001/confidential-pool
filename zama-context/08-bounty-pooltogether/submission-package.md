# Confidential Pool submission package

## Title

Confidential Pool

## One-line summary

Save privately. Win transparently: an Aave-backed Sepolia prize pool where deposits, time-weighted balances, winner eligibility, and payouts stay encrypted while every draw remains publicly verifiable.

## Problem

Ordinary prize-savings protocols expose each participant's deposits, withdrawals, balance history, odds, and winnings. Public verification should not require publishing a person's financial position.

## Solution

Confidential Pool combines Aave V3 yield, Zama FHE, and Chainlink VRF:

- users supply test LINK to Aave and shield the aLINK position as confidential `caLINK`;
- encrypted `caLINK` deposits build private recurring-epoch TWABs;
- Aave backing growth above issued principal is harvested into an encrypted prize reserve;
- post-epoch Chainlink randomness is bound onchain to the draw;
- Zama evaluates each user's winning zone over encrypted values;
- only the participant can decrypt the payout;
- encrypted principal withdrawals remain available during open epochs.

## Requirement coverage

| Zama bounty requirement | Evidence |
| --- | --- |
| Shared asset pool | One recurring pool holds encrypted caLINK positions |
| Generated yield | Live aLINK backing growth is measured and harvested; principal is excluded |
| Periodic prize draws | One-hour rolling epochs with coordinator-bound Chainlink VRF |
| Principal withdrawable | Encrypted withdrawal path plus KMS-proven backing redemption |
| Deposits and balances encrypted | FHE handles, amount-free pool events, wallet-authorized decryption |
| Winnings encrypted | Encrypted reserve, candidate payout, settlement, and user-only ACL |
| Verifiable winner selection | Public draw transcript and denominator feed the encrypted comparison |
| Sepolia | All final target contracts are deployed on chain `11155111` |

## Architecture

```text
React / Vite
    │ Zama SDK encryption and user-authorized decryption
    ▼
ConfidentialPoolTogether
    ├── encrypted principal, balances, TWABs, reserve, and payouts
    ├── KMS-proven public aggregate denominator
    ├── encrypted winning-zone comparison
    └── recurring epoch state machine
           ▲                         ▲
           │ encrypted caLINK        │ epoch-bound random word
           │                         │
AaveYieldConfidentialToken     RngRequestCoordinator
    │ one-for-one aLINK backing      │
    │ surplus-only harvest            └── ChainlinkVrfRngAdapter
    ▼                                        │
Aave V3 LINK reserve                      Chainlink VRF v2.5
```

## Privacy model

Private:

- in-pool deposits and withdrawals;
- user balances and time-weighted balances;
- winning zones, reserve values, and payout amounts;
- other participants' financial positions.

Public:

- wallet identity, transaction timing, gas, and action type;
- shield and final redemption values at the public/confidential boundary;
- aggregate Aave backing and generated yield;
- epoch timing, aggregate TWAB after KMS proof, VRF provenance, random word, and claim identity.

The product provides confidentiality, not anonymity. The public aggregate can leak information in a very small participant set, and repeated public actions can support inference. Winner and non-winner settlement deliberately use the same non-reverting call shape and matched application-event structure.

## Final Sepolia deployment

- Pool: [`0xdE9A7DC790e6dE0304A046210044F38904309120`](https://sepolia.etherscan.io/address/0xdE9A7DC790e6dE0304A046210044F38904309120)
- caLINK wrapper: [`0x4734EC2CC7e18D4C39fccB97E16E77701819655F`](https://sepolia.etherscan.io/address/0x4734EC2CC7e18D4C39fccB97E16E77701819655F)
- RNG coordinator: [`0xd39ee872B5cb97d7A6576862549DEBF7AE753CeC`](https://sepolia.etherscan.io/address/0xd39ee872B5cb97d7A6576862549DEBF7AE753CeC)
- Chainlink VRF adapter: [`0x2387Ac275b6ADa26959c587d93abFbd491A64D5A`](https://sepolia.etherscan.io/address/0x2387Ac275b6ADa26959c587d93abFbd491A64D5A)
- Aave V3 Pool: [`0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`](https://sepolia.etherscan.io/address/0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951)
- LINK: `0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5`
- aLINK: `0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24`

## Verified live evidence

Completed on the final release:

- LINK → Aave → aLINK → caLINK setup;
- encrypted `9 caLINK` deposit, privately verified as `9000000000000000000` units;
- two strategy-yield harvests with exact post-block backing invariants;
- encrypted reserve handle changed without publishing its plaintext;
- final verified harvest transaction: [`0x71e50941…c72dcf`](https://sepolia.etherscan.io/tx/0x71e50941a7192f69969f79e6eadeb8ab4cb664b8805c0772134ad2ac35c72dcf).

The final draw, winner-only claim, full principal withdrawal, and strict-audit transcript is complete in [`aave-backed-sepolia-release.md`](./aave-backed-sepolia-release.md). The strict auditor returned `RECURRING_LIFECYCLE_COMPLETE: true`.

Historical releases separately proved two-user weighted outcomes, recurring epochs, KMS aggregate verification, post-close VRF provenance, private winner/non-winner payouts, full principal recovery, and strict lifecycle audits. They are regression evidence, not the final generated-yield deployment.

## Local verification

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
npm run test:reference
forge test

cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
DOTENV_CONFIG_PATH=.env.example npx hardhat test --no-compile \
  test/phase2/AaveYieldConfidentialToken.ts \
  test/phase2/ConfidentialPoolTogether.ts \
  test/phase2/ConfidentialPoolTogether.adversarial.ts \
  test/phase2/ConfidentialPoolTogether.HCU.ts \
  test/phase2/ConfidentialPoolTogetherSlice.ts
npx tsc --project scripts/tsconfig.json --noEmit

cd /home/ali/Desktop/zama/confidential-pooltogether/frontend
npm install
npm run build
```

Current result: 12 reference-model tests, 13 Foundry tests, 30 FHE/Aave regression tests, script type/lint checks, and the frontend production build pass.

## Demo outline

1. **Problem:** public prize savings expose personal financial positions.
2. **Yield source:** show the Aave Pool, aLINK backing, issued liabilities, and live surplus harvest transaction.
3. **Private deposit:** prepare test caLINK, deposit through Zama SDK, and show the amount-free application event.
4. **Verifiable draw:** show epoch close, KMS aggregate proof, coordinator binding, and Chainlink VRF request.
5. **Private outcome:** prepare and settle the claim, then decrypt the payout only with the participant wallet.
6. **Principal safety:** withdraw the encrypted principal and verify the participant's pool principal becomes zero.
7. **Boundary:** explain what remains public, what remains encrypted, and why the custom wrapper is not presented as canonical Zama infrastructure.

## Production-oriented posture

- OpenZeppelin `SafeERC20` and `ReentrancyGuard` protect token/external-call boundaries.
- Pool configuration is one-time; yield minting is limited to measured backing surplus and the configured pool.
- KMS proofs authenticate public aggregate and redemption results.
- Draw requests are post-close, atomically coordinator-bound, replay-protected, and permissionlessly finalizable.
- Tests cover underfunding, over-withdrawal, bad KMS proofs, duplicate claims, RNG replay, delayed RNG recovery, two-user privacy, HCU depth, and backing conservation.
- The frontend includes mobile/desktop layouts, clear transaction stages, network guards, live evidence links, and explicit privacy disclosures.

The system is pre-audit software and is not described as audited. The possible OpenZeppelin audit offered to an exceptional bounty submission would be the next professional assurance step.

## Known limitations

- The caLINK wrapper is application-specific and is not registered as a canonical Zama wrapper.
- Shielding and public redemption reveal amounts at those boundaries.
- The first release uses one prize tier/index rather than all PoolTogether V5 tiers and liquidation auctions.
- Keeper automation is not yet deployed; epoch advancement, KMS aggregate finalization, RNG request, and draw opening are permissionless/operator runbook actions.
- Aave, Chainlink, Zama relayer/KMS, and Sepolia availability are external dependencies.
- The large Zama browser cryptography bundles are lazy-loaded only when a confidential action requires them, but remain substantial downloads.

## Links

- Product/research repository: <https://github.com/Alike001/confidential-pool>
- FHE implementation branch: <https://github.com/Alike001/fhevm/tree/feature/confidential-pool>
- Public frontend: <https://frontend-two-chi-54.vercel.app>
- Demo video: `TODO`
- Submission form: <https://forms.zama.org/developer-program-mainnet-season4-bounty-track>

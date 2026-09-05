# Confidential Pool submission package

## Title

Confidential Pool

## One-line summary

Save privately. Win transparently: an Aave-backed Sepolia prize pool where deposits, time-weighted balances, winner eligibility, and payouts stay encrypted while every draw remains publicly verifiable.

## Problem

Ordinary prize-savings protocols expose each participant's deposits, withdrawals, balance history, odds, and winnings. Public verification should not require publishing a person's financial position.

## Solution

Confidential Pool combines Aave V3 yield with Zama FHE:

- users supply test LINK to Aave and shield the aLINK position as confidential `caLINK`;
- encrypted `caLINK` deposits build private recurring-epoch TWABs;
- Aave backing growth above issued principal is harvested into an encrypted prize reserve;
- Zama generates an encrypted `FHE.randEuint64()` sample for each claim slot;
- Zama evaluates each user's encrypted winning zone and random threshold without plaintext balances or offchain RNG;
- only the participant can decrypt the payout;
- encrypted principal withdrawals remain available during open epochs.

## Requirement coverage

| Zama bounty requirement | Evidence |
| --- | --- |
| Shared asset pool | One recurring pool holds encrypted caLINK positions |
| Generated yield | Live aLINK backing growth is measured and harvested; principal is excluded |
| Periodic prize draws | Rolling epochs with encrypted Zama FHE random samples |
| Principal withdrawable | Encrypted withdrawal path plus KMS-proven backing redemption |
| Deposits and balances encrypted | FHE handles, amount-free pool events, wallet-authorized decryption |
| Winnings encrypted | Encrypted reserve, candidate payout, settlement, and user-only ACL |
| Verifiable winner selection | KMS-proven aggregate plus onchain FHE weight, threshold, random sampling, and comparison stages |
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
           ▲
           │ encrypted caLINK
AaveYieldConfidentialToken
    │ one-for-one aLINK backing
    │ surplus-only harvest
    ▼
Aave V3 LINK reserve
```

## Privacy model

Private:

- in-pool deposits and withdrawals;
- user balances and time-weighted balances;
- winning zones, random thresholds, random samples, winner bits, reserve values, and payout amounts;
- other participants' financial positions.

Public:

- wallet identity, transaction timing, gas, and action type;
- shield and final redemption values at the public/confidential boundary;
- aggregate Aave backing and generated yield;
- epoch timing, aggregate TWAB after KMS proof, claim identity, and FHE-stage completion metadata.

The product provides confidentiality, not anonymity. The public aggregate can leak information in a very small participant set, and repeated public actions can support inference. Winner and non-winner settlement deliberately use the same non-reverting call shape and matched application-event structure.

## Final Sepolia deployment

- Source-matched guarded pool: [`0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88`](https://sepolia.etherscan.io/address/0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88)
- Source-matched caLINK wrapper: [`0x78da50E954d2fC69C10688032c8c07D2ABC52750`](https://sepolia.etherscan.io/address/0x78da50E954d2fC69C10688032c8c07D2ABC52750)
- Aave V3 Pool: [`0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`](https://sepolia.etherscan.io/address/0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951)
- LINK: `0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5`
- aLINK: `0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24`

## Verified live evidence

Verified on the final guarded release:

- LINK → Aave → aLINK → caLINK setup;
- encrypted `9 caLINK` deposit, privately verified as `9000000000000000000` units;
- real Aave yield harvested with an exact post-block backing invariant;
- encrypted reserve handle changed without publishing its plaintext;
- final harvest transaction: [`0xf2ad1504…95efc`](https://sepolia.etherscan.io/tx/0xf2ad1504522b122ade360d7eaab707c3a4446e81d1314a0643fc4b3bfa495efc);
- exact KMS-proven aggregate TWAB `6720000000000000000` in [`0x80aaa07d…77962`](https://sepolia.etherscan.io/tx/0x80aaa07d93a34b51cf0c98dcd50f30c3a1ca7ecfa58cf78b5c6f5cd43f877962);
- encrypted weight, threshold, and `FHE.randEuint64()` stages completed onchain;
- winner-only payout decrypted to `100000000000000` units;
- full `9 caLINK` principal withdrawn in [`0xa82c02b1…af7f`](https://sepolia.etherscan.io/tx/0xa82c02b191863acddf5c8c23dfacd90bd1f7dc710f26254be16158534552af7f);
- strict auditor returned `FHE_RANDOM_AAVE_LIFECYCLE_COMPLETE: true`.

The complete transcript is in [`fhe-random-sepolia-release.md`](./fhe-random-sepolia-release.md). The previous Aave/Chainlink lifecycle remains historical regression evidence in [`aave-backed-sepolia-release.md`](./aave-backed-sepolia-release.md).

Historical releases separately proved two-user weighted outcomes, recurring epochs, KMS aggregate verification, post-close VRF provenance, private winner/non-winner payouts, full principal recovery, and strict lifecycle audits. They are regression evidence, not the final generated-yield deployment.

## Local verification

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
npm run test:reference
forge test

cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
DOTENV_CONFIG_PATH=.env.example npx hardhat test test/phase2/*.ts
npx tsc --project scripts/tsconfig.json --noEmit

cd /home/ali/Desktop/zama/confidential-pooltogether/frontend
npm install
npm run build
```

Current result: 12 reference-model tests, 13 Foundry tests, 49 FHE/Aave regression tests, script type checks, and the frontend production build pass.

## Demo outline

1. **Problem:** public prize savings expose personal financial positions.
2. **Yield source:** show the Aave Pool, aLINK backing, issued liabilities, and live surplus harvest transaction.
3. **Private deposit:** prepare test caLINK, deposit through Zama SDK, and show the amount-free application event.
4. **Verifiable draw:** show epoch close, KMS aggregate proof, then the encrypted weight, threshold, `FHE.randEuint64()`, and comparison transactions.
5. **Private outcome:** prepare and settle the claim, then decrypt the payout only with the participant wallet.
6. **Principal safety:** withdraw the encrypted principal and verify the participant's pool principal becomes zero.
7. **Boundary:** explain what remains public, what remains encrypted, and why the custom wrapper is not presented as canonical Zama infrastructure.

## Production-oriented posture

- OpenZeppelin `SafeERC20` and `ReentrancyGuard` protect token/external-call boundaries.
- Pool configuration is one-time; yield minting is limited to measured backing surplus and the configured pool.
- KMS proofs authenticate public aggregate and redemption results.
- Each claim slot is replay-protected; Zama generates its random sample only after the KMS-proven epoch aggregate exists.
- Tests cover underfunding, over-withdrawal, bad KMS proofs, duplicate claims, encrypted FHE randomness, two-user privacy, HCU depth, and backing conservation.
- The frontend includes mobile/desktop layouts, clear transaction stages, network guards, live evidence links, and explicit privacy disclosures.

The system is pre-audit software and is not described as audited. The possible OpenZeppelin audit offered to an exceptional bounty submission would be the next professional assurance step.

## Known limitations

- The caLINK wrapper is application-specific and is not registered as a canonical Zama wrapper.
- Shielding and public redemption reveal amounts at those boundaries.
- The first release uses one prize tier/index rather than all PoolTogether V5 tiers and liquidation auctions.
- Keeper automation is not yet deployed; epoch advancement, KMS aggregate finalization, and draw opening are permissionless/operator runbook actions.
- Aave, Zama relayer/KMS, and Sepolia availability are external dependencies.
- The large Zama browser cryptography bundles are lazy-loaded only when a confidential action requires them, but remain substantial downloads.

## Links

- Product/research repository: <https://github.com/Alike001/confidential-pool>
- FHE implementation branch: <https://github.com/Alike001/fhevm/tree/feature/confidential-pool>
- Public frontend: <https://frontend-two-chi-54.vercel.app>
- Final pool source match: <https://sourcify.dev/server/v2/contract/11155111/0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88?fields=all>
- Final caLINK source match: <https://sourcify.dev/server/v2/contract/11155111/0x78da50E954d2fC69C10688032c8c07D2ABC52750?fields=all>
- Demo video: `TODO`
- Submission form: <https://forms.zama.org/developer-program-mainnet-season4-bounty-track>

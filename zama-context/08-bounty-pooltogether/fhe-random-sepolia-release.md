# FHE-random Aave Sepolia release

## Status

The first FHE-random pair is deployed and source-verified on Ethereum Sepolia, but it is now classified as staging. Review found that the one-tier MVP needed an explicit guard limiting claims to `(tier 0, prizeIndex 0)`; without it, arbitrary indices could create extra independent attempts. The guard is implemented and tested at fork commit `8addf2a`. A fresh wrapper/pool pair is required because wrapper pool configuration is intentionally immutable.

This file must not say the final release is complete until the guarded pair is deployed and `auditFheRandomAaveSepoliaLifecycle.ts` returns `FHE_RANDOM_AAVE_LIFECYCLE_COMPLETE: true`.

This release supersedes the earlier Chainlink candidate as the submission target because the official bounty wording requires winner selection with FHE randomness and no offchain RNG. The older deployments remain historical engineering evidence.

## Superseded staging contracts

| Component | Address | Deployment evidence |
| --- | --- | --- |
| FHE-random recurring pool | `0x686227d54223cCF844a57C9D8bf95d1A5bE49B02` | tx `0x3cf786343f299b4aa4271f3020830b4bf3369dee0822aa811e8c9518ce3df731`, block `11641983`; Sourcify creation/runtime match `47164078` |
| Confidential Aave aLINK wrapper | `0x7885283CB34d02b81e671FEA7404C3c94f594Bdd` | tx `0x772241aa88bc5ac1ca9fdacb6170c4e926c067a9744a0e91b2c4ff62589e1f67`, block `11641968`; Sourcify creation/runtime match `47164079` |
| Wrapper pool configuration | pool fixed once to the address above | tx `0x2b6287db2478c9c6c596d3e0ce8a75490529298005e908a62cf268cac762c884`, block `11641984` |
| Aave V3 Pool | `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951` | external Sepolia dependency |
| Aave aLINK | `0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24` | yield-bearing backing asset |

The staging first epoch starts at Unix timestamp `1788632400`, lasts `600` seconds, and recurs permissionlessly. No bounty lifecycle funds should be deposited into this pair.

## Winner-selection design

For one user and prize slot, the pool computes the PoolTogether-style encrypted winning zone:

```text
winningZone = floor(floor(userTWAB × tierOdds / 1e18) × vaultFraction / 1e18)
```

It then maps that zone into a fixed `2^64` random domain:

```text
threshold = floor(winningZone × 2^64 / KMSVerifiedAggregateTWAB)
winner = FHE.randEuint64() < threshold
```

`userTWAB`, `winningZone`, `threshold`, random sample, winner bit, reserve, and payout are encrypted. The aggregate TWAB is intentionally public only after Zama KMS proof verification. The payout handle is ACL-authorized to the claimant; the random handle is retained for contract use and is not granted to the claimant.

The computation is split across weight, threshold, random comparison, and settlement transactions to remain below Sepolia's FHE HCU-depth limit without changing the arithmetic.

## Required live proof

The release is promoted only after one sequence proves:

1. public test LINK supplied to Aave and shielded as caLINK;
2. encrypted caLINK deposited into the shared pool;
3. real aLINK backing growth harvested into the encrypted prize reserve;
4. epoch and user TWAB finalized;
5. aggregate TWAB publicly decrypted with a verified KMS proof;
6. draw opened and all three encrypted claim-preparation stages mined;
7. encrypted FHE random handle is nonzero;
8. claimant alone decrypts the payout;
9. full encrypted principal withdrawal returns the pool balance to zero;
10. the strict auditor returns `FHE_RANDOM_AAVE_LIFECYCLE_COMPLETE: true`.

## Local verification snapshot

- 48/48 phase-2 FHE/Aave tests pass.
- 13/13 Foundry RNG/transcript tests pass.
- 12/12 JavaScript probability/TWAB model tests pass.
- TypeScript deployment and live-operation scripts compile.
- The React/Vite production frontend builds against the new ABI.

These results are pre-audit evidence, not a professional security audit.

## Source verification

- [Pool Sourcify record](https://sourcify.dev/server/v2/contract/11155111/0x686227d54223cCF844a57C9D8bf95d1A5bE49B02?fields=all)
- [caLINK Sourcify record](https://sourcify.dev/server/v2/contract/11155111/0x7885283CB34d02b81e671FEA7404C3c94f594Bdd?fields=all)

Both records report matching creation and runtime bytecode. Sourcify also forwarded the verified build to RouteScan and Blockscout. Etherscan forwarding encountered its shared public rate/daily limit; that does not affect the Sourcify matches.

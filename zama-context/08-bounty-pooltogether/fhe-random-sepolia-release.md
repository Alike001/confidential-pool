# FHE-random Aave Sepolia release

## Status

The guarded final pair is deployed, configured, source-matched, and validated end to end on Ethereum Sepolia. Review of the first staging pair found that the one-tier MVP needed an explicit guard limiting claims to `(tier 0, prizeIndex 0)`; without it, arbitrary indices could create extra independent attempts. The final pair contains the fix from fork commit `8addf2a`.

The final lifecycle completed successfully. The strict auditor returned `FHE_RANDOM_AAVE_LIFECYCLE_COMPLETE: true` after verifying real Aave yield, encrypted participation, the exact TWAB, KMS proof, FHE randomness, private payout, backing conservation, and full principal recovery.

This release supersedes the earlier Chainlink candidate as the submission target because the official bounty wording requires winner selection with FHE randomness and no offchain RNG. The older deployments remain historical engineering evidence.

## Guarded final contracts

| Component | Address | Deployment evidence |
| --- | --- | --- |
| FHE-random recurring pool | `0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88` | tx `0x9c69454fa2b58190daf18fbc0c9aed819f07084873a7b1dc9177babd64aabf6f`, block `11642177`; Sourcify creation/runtime match `47164756` |
| Confidential Aave aLINK wrapper | `0x78da50E954d2fC69C10688032c8c07D2ABC52750` | tx `0xed5d382424bf2a1c6c477e871202c341e4aa0df273af811fa53a956cd80d9f5d`, block `11642176`; Sourcify creation/runtime match `47164757` |
| Wrapper pool configuration | pool fixed once to the guarded address | tx `0x00426ecf7195a2ab0cc15544a6424cf6571ac8df1c4bae58ec96f5652d36ce33`, block `11642178` |
| Aave V3 Pool | `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951` | external Sepolia dependency |
| Aave aLINK | `0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24` | yield-bearing backing asset |

Epoch 1 runs from `1788634200` to `1788635100` and lasts `900` seconds.

## Complete live evidence

| Step | Transaction | Block | Result |
| --- | --- | --- | --- |
| Supply 10 test LINK to Aave | `0xdfe2641018ad6413967a20b1b79afe439e86fd453745821c05e771827921a123` | `11642188` | received yield-bearing aLINK |
| Shield aLINK as caLINK | `0x558d1f7e55ccd1ce48fc9597f0e88f721c54df6a70a33a13d234a4c96d146f41` | `11642190` | `9999999999999999995` issued confidential units |
| Encrypted 9 caLINK deposit | `0x5386de0b754743ba7602c1ed4e22e11ee8937b16ebc82d499d4179eb2eb7ef51` | `11642196` | owner-authorized decryption returned exactly `9000000000000000000` |
| Harvest real Aave yield | `0xf2ad1504522b122ade360d7eaab707c3a4446e81d1314a0643fc4b3bfa495efc` | `11642204` | `133278130322203` units moved into encrypted reserve; backing invariant exact |
| Advance epoch 1 | `0x0656c4094f82b75f489eadf6a6170d79d67f1f29fdd5828d82f0aac8d59c8deb` | `11642253` | epoch 1 total checkpoint finalized; epoch 2 opened |
| Finalize user TWAB | `0x1c1dde9249ef8bd96501d764b0be9005f510f2aa5c0f420d8002a7e7859b5337` | `11642255` | encrypted user TWAB checkpoint stored |
| Request aggregate decryption | `0x8857059224c40ee26696566a289bac846534351d2c6ff96299783edc4314b5f6` | `11642257` | epoch aggregate authorized for public KMS proof |
| Finalize KMS aggregate | `0x80aaa07d93a34b51cf0c98dcd50f30c3a1ca7ecfa58cf78b5c6f5cd43f877962` | `11642260` | exact aggregate `6720000000000000000` accepted with proof |
| Open draw 1 | `0x6a08dc1b818c192053f2dd38cdf82963a8492b97f71325334ff5c229df5f602f` | `11642264` | encrypted `100000000000000`-unit prize reserved from harvested yield |
| Prepare encrypted weight | `0xee145be90be72ef3663257e2628d9c675518d340b1d2afca8f4696c30cb11e1f` | `11642269` | user-specific winning zone remained encrypted |
| Prepare encrypted threshold | `0x068c0aaa6a09d7858dff215ad6bf4e30627fc6f9bc15b56281c2ce42e72135a9` | `11642272` | fixed-domain threshold remained encrypted |
| Generate and compare FHE randomness | `0x8338e11808aed67428d48a9227764f059961acc24ebe342a13fd8f1fbd05a582` | `11642275` | nonzero encrypted random handle and encrypted winner bit created |
| Settle encrypted claim | `0x174442f7d6e338ad8038971982fc32e787fcf7c2d4a290042d1e0b3b6b33b3cb` | `11642278` | claimant alone decrypted payout `100000000000000` |
| Withdraw full principal | `0xa82c02b191863acddf5c8c23dfacd90bd1f7dc710f26254be16158534552af7f` | `11642286` | pool principal decrypted to `0`; wallet balance became `10000099999999999995` |

The deposit block timestamp is `1788634428`. The independently calculated epoch-1 TWAB is:

```text
9000000000000000000 × (1788635100 − 1788634428) / 900
= 6720000000000000000
```

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

## Passed release gate

One strict sequence proved:

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

The final audit snapshot reported Aave backing `10000977372955696152`, issued confidential liabilities `10000133278130322198`, and additional pending yield `844094825373954`. Backing therefore remained greater than issued liabilities after claim and withdrawal.

## Local verification snapshot

- 49/49 phase-2 FHE/Aave tests pass.
- 13/13 Foundry RNG/transcript tests pass.
- 12/12 JavaScript probability/TWAB model tests pass.
- TypeScript deployment and live-operation scripts compile.
- The React/Vite production frontend builds against the new ABI.

These results are pre-audit evidence, not a professional security audit.

## Source verification

- [Guarded pool Sourcify record](https://sourcify.dev/server/v2/contract/11155111/0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88?fields=all)
- [Guarded caLINK Sourcify record](https://sourcify.dev/server/v2/contract/11155111/0x78da50E954d2fC69C10688032c8c07D2ABC52750?fields=all)

Both records report matching creation and runtime bytecode. Sourcify also forwarded the verified build to RouteScan and Blockscout. Etherscan forwarding encountered its shared public rate/daily limit; that does not affect the Sourcify matches.

## Hosted release

The write-enabled production frontend is live at <https://frontend-two-chi-54.vercel.app>. Vercel deployment `dpl_AFnjj8w26MVuL8LGwFAMQAL73GN9` completed successfully, the canonical URL returned HTTP `200`, and its deployed JavaScript contained the final guarded pool address. Desktop `1440×1100` and mobile `390×844` visual smoke checks passed. A mock EIP-1193 interaction test confirmed zero wallet RPC calls before the Connect click and `eth_requestAccounts` only after the click. Real injected-wallet signing remains a manual browser QA step.

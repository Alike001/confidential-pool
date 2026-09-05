# Confidential Pool

> Save privately. Win transparently.

Confidential Pool is an Aave-backed prize-savings application on Ethereum Sepolia. Users shield an Aave yield position, deposit into a shared pool, build an encrypted time-weighted balance, enter periodic FHE-random draws, privately learn their payout, and withdraw their principal.

The core privacy rule is simple: Aave proves where the yield came from, while Zama FHE keeps each participant's position, random sample, winner bit, and payout encrypted.

## Bounty fit

| Requirement | Implementation |
| --- | --- |
| Shared deposits | Confidential `caLINK` transfers enter one recurring pool |
| Generated yield | LINK is supplied to Aave V3; growth in the wrapper's aLINK backing is harvested |
| Periodic draws | Permissionless rolling epochs followed by an operator-opened prize round |
| Private positions | Deposit amounts, balances, user TWABs, winning zones, reserve values, and payouts are ciphertext |
| Verifiable winner selection | `FHE.randEuint64()` and encrypted weighted comparisons execute through Zama's onchain FHE runtime |
| Winner-only result | Zama ACL permissions allow only the participant to decrypt their payout handle |
| Principal withdrawal | Users submit encrypted withdrawals during an open epoch and can redeem backing through a KMS-proven boundary |
| Sepolia | Final Aave-backed contracts and frontend configuration target chain `11155111` |

## Architecture

```text
Public LINK
    │ supply
    ▼
Aave V3 ──► aLINK backing grows
    │
    │ shield (public boundary)
    ▼
caLINK confidential wrapper
    │ encrypted transfer
    ▼
Recurring Confidential Pool
    ├── encrypted principal balances and TWABs
    ├── encrypted Aave-yield prize reserve
    ├── KMS-proven aggregate denominator
    └── encrypted threshold, FHE random sample,
        winner comparison, and private payout
```

## Final FHE-random Sepolia deployment

| Component | Address |
| --- | --- |
| Guarded FHE-random pool | [`0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88`](https://sepolia.etherscan.io/address/0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88) |
| Confidential aLINK wrapper | [`0x78da50E954d2fC69C10688032c8c07D2ABC52750`](https://sepolia.etherscan.io/address/0x78da50E954d2fC69C10688032c8c07D2ABC52750) |
| Aave V3 Pool | [`0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`](https://sepolia.etherscan.io/address/0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951) |
| Aave aLINK | [`0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24`](https://sepolia.etherscan.io/address/0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24) |

This pair contains the explicit `(tier 0, prizeIndex 0)` guard from FHE fork commit `8addf2a`. Its complete Sepolia cycle passed the strict auditor: real Aave yield was harvested, `9 caLINK` was deposited privately, the exact `6.72 caLINK` aggregate TWAB was KMS-proven, winner selection used encrypted FHE randomness, the claimant alone decrypted the prize, and the full principal was withdrawn. See the [FHE-random release record](./zama-context/08-bounty-pooltogether/fhe-random-sepolia-release.md).

## Privacy boundary

Private in the pool:

- deposit and withdrawal amounts;
- current user balances;
- per-user time-weighted balances and winning zones;
- reserve value, random sample, winning threshold, winner bit, and payout amount.

Public by design:

- account addresses, action timing, and transaction metadata;
- shield and final redemption amounts at the public/confidential boundary;
- aggregate Aave backing and harvested yield;
- epoch configuration and the KMS-proven aggregate denominator;
- claim identity and the fact that each encrypted computation stage executed.

This provides confidentiality, not anonymity. Small participant sets and repeated public actions can still support inference. See the [threat model](./zama-context/08-bounty-pooltogether/threat-model.md).

## Repository map

- [`confidential-pooltogether/`](./confidential-pooltogether/) — winner-math/RNG research contracts, deployment utilities, and production React frontend.
- [`zama-context/`](./zama-context/) — reverse engineering, mathematical baseline, architecture decisions, threat model, runbooks, and submission evidence.
- [`Alike001/fhevm`, branch `feature/confidential-pool`](https://github.com/Alike001/fhevm/tree/feature/confidential-pool) — encrypted pool, Aave-backed token, tests, and guarded Sepolia scripts.

The FHEVM repository is a project fork used because the application contracts execute against Zama's own Solidity library and test harness. No code was pushed to the official `zama-ai/fhevm` repository.

## Verification

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
forge test

cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
DOTENV_CONFIG_PATH=.env.example npx hardhat test test/phase2/*.ts

cd /home/ali/Desktop/zama/confidential-pooltogether/frontend
npm run build
```

The contracts use OpenZeppelin's `SafeERC20` and `ReentrancyGuard`, include adversarial and invariant-focused tests, and are being prepared as a pre-audit codebase. They have **not** been professionally audited; the bounty's possible OpenZeppelin audit is a future selection benefit, not a current claim.

## Product links

- Main repository: <https://github.com/Alike001/confidential-pool>
- FHE implementation: <https://github.com/Alike001/fhevm/tree/feature/confidential-pool>
- Frontend: <https://solitary-rain-30c2.hammedoye10.workers.dev>
- Final pool source match: <https://sourcify.dev/server/v2/contract/11155111/0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88?fields=all>
- Final caLINK source match: <https://sourcify.dev/server/v2/contract/11155111/0x78da50E954d2fC69C10688032c8c07D2ABC52750?fields=all>
- Keeper runbook: [`zama-context/08-bounty-pooltogether/fhe-random-keeper-runbook.md`](./zama-context/08-bounty-pooltogether/fhe-random-keeper-runbook.md)
- Submission package: [`zama-context/08-bounty-pooltogether/submission-package.md`](./zama-context/08-bounty-pooltogether/submission-package.md)

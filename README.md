# Confidential Pool

> Save privately. Win transparently.

Confidential Pool is an Aave-backed prize-savings application on Ethereum Sepolia. Users shield an Aave yield position, deposit into a shared pool, build an encrypted time-weighted balance, enter periodic Chainlink VRF draws, privately learn their payout, and withdraw their principal.

The core privacy rule is simple: public infrastructure proves where the yield and randomness came from; Zama FHE protects each participant's financial position.

## Bounty fit

| Requirement | Implementation |
| --- | --- |
| Shared deposits | Confidential `caLINK` transfers enter one recurring pool |
| Generated yield | LINK is supplied to Aave V3; growth in the wrapper's aLINK backing is harvested |
| Periodic draws | Permissionless one-hour epochs bind post-close Chainlink VRF requests |
| Private positions | Deposit amounts, balances, user TWABs, winning zones, reserve values, and payouts are ciphertext |
| Verifiable winner selection | Public VRF provenance and aggregate denominator feed an FHE winning-zone comparison |
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
    └── FHE winner comparison and private payout
                 ▲
                 │ epoch-bound randomness
      Coordinator ──► Chainlink VRF v2.5
```

## Final Sepolia deployment

| Component | Address |
| --- | --- |
| Recurring pool | [`0xdE9A7DC790e6dE0304A046210044F38904309120`](https://sepolia.etherscan.io/address/0xdE9A7DC790e6dE0304A046210044F38904309120) |
| Confidential aLINK wrapper | [`0x4734EC2CC7e18D4C39fccB97E16E77701819655F`](https://sepolia.etherscan.io/address/0x4734EC2CC7e18D4C39fccB97E16E77701819655F) |
| RNG coordinator | [`0xd39ee872B5cb97d7A6576862549DEBF7AE753CeC`](https://sepolia.etherscan.io/address/0xd39ee872B5cb97d7A6576862549DEBF7AE753CeC) |
| Chainlink VRF adapter | [`0x2387Ac275b6ADa26959c587d93abFbd491A64D5A`](https://sepolia.etherscan.io/address/0x2387Ac275b6ADa26959c587d93abFbd491A64D5A) |
| Aave V3 Pool | [`0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`](https://sepolia.etherscan.io/address/0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951) |
| Aave aLINK | [`0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24`](https://sepolia.etherscan.io/address/0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24) |

The current live run has already proven the LINK → Aave → caLINK setup, an encrypted `9 caLINK` deposit, and strategy-generated yield entering only the encrypted prize reserve. The final epoch draw and principal-withdrawal evidence is being appended to the [Aave-backed release record](./zama-context/08-bounty-pooltogether/aave-backed-sepolia-release.md).

## Privacy boundary

Private in the pool:

- deposit and withdrawal amounts;
- current user balances;
- per-user time-weighted balances and winning zones;
- reserve value, winner bit, and payout amount.

Public by design:

- account addresses, action timing, and transaction metadata;
- shield and final redemption amounts at the public/confidential boundary;
- aggregate Aave backing and harvested yield;
- epoch configuration, KMS-proven aggregate denominator, VRF request, and random word.

This provides confidentiality, not anonymity. Small participant sets and repeated public actions can still support inference. See the [threat model](./zama-context/08-bounty-pooltogether/threat-model.md).

## Repository map

- [`confidential-pooltogether/`](./confidential-pooltogether/) — Chainlink reference contracts, deployment utilities, and production React frontend.
- [`zama-context/`](./zama-context/) — reverse engineering, mathematical baseline, architecture decisions, threat model, runbooks, and submission evidence.
- [`Alike001/fhevm`, branch `feature/confidential-pool`](https://github.com/Alike001/fhevm/tree/feature/confidential-pool) — encrypted pool, Aave-backed token, tests, and guarded Sepolia scripts.

The FHEVM repository is a project fork used because the application contracts execute against Zama's own Solidity library and test harness. No code was pushed to the official `zama-ai/fhevm` repository.

## Verification

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
forge test

cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
DOTENV_CONFIG_PATH=.env.example npx hardhat test --no-compile test/phase2/AaveYieldConfidentialToken.ts

cd /home/ali/Desktop/zama/confidential-pooltogether/frontend
npm run build
```

The contracts use OpenZeppelin's `SafeERC20` and `ReentrancyGuard`, include adversarial and invariant-focused tests, and are being prepared as a pre-audit codebase. They have **not** been professionally audited; the bounty's possible OpenZeppelin audit is a future selection benefit, not a current claim.

## Product links

- Main repository: <https://github.com/Alike001/confidential-pool>
- FHE implementation: <https://github.com/Alike001/fhevm/tree/feature/confidential-pool>
- Frontend: Vercel production URL will replace the historical GitHub Pages URL after final hosted-wallet QA.
- Submission package: [`zama-context/08-bounty-pooltogether/submission-package.md`](./zama-context/08-bounty-pooltogether/submission-package.md)

# Confidential Pool

**Save privately. Win transparently.**

Confidential Pool is a Sepolia prize-savings prototype built with Zama FHEVM and Chainlink VRF. It keeps deposits, balances, time-weighted balances, winner eligibility, and payouts encrypted while preserving a publicly auditable draw transcript.

## Release status

The bounded release has completed a two-wallet Sepolia lifecycle:

- both users made encrypted `1,000,000`-unit deposits;
- Zama KMS proved the epoch aggregate TWAB as `1,773,333`;
- Chainlink VRF request `8` was bound to the closed epoch;
- one wallet privately received `0` and the other `100,000` prize units;
- both users recovered their full principal;
- both strict lifecycle audits returned `RECURRING_LIFECYCLE_COMPLETE: true`.

Final pool: [`0xE0d284649E955d03B02F3cf927D60271d41C52D1`](https://sepolia.etherscan.io/address/0xE0d284649E955d03B02F3cf927D60271d41C52D1)

## Repository map

- [`confidential-pooltogether/`](./confidential-pooltogether/) — reference contracts, Chainlink RNG integration, deployment scripts, and React frontend.
- [`zama-context/`](./zama-context/) — bottom-up Zama and PoolTogether research, architecture decisions, threat model, live evidence, and submission package.
- `zama-context/fhevm/` — local Zama FHEVM implementation checkout. It is intentionally excluded from this Git history; the implementation is published on the [`feature/confidential-pool` branch](https://github.com/Alike001/fhevm/tree/feature/confidential-pool) of the project fork.

Start with the [submission package](./zama-context/08-bounty-pooltogether/submission-package.md), then read the [final recurring runbook](./zama-context/08-bounty-pooltogether/final-recurring-runbook.md) and [deployment evidence](./zama-context/08-bounty-pooltogether/recurring-sepolia-deployment.md).

## Privacy boundary

Individual positions, TWABs, winner bits, reserve values, and payouts remain encrypted. Epoch configuration, aggregate TWAB, RNG provenance, random word, wallet addresses, action timing, and claim calls remain public. This provides confidentiality, not anonymity; the [threat model](./zama-context/08-bounty-pooltogether/threat-model.md) documents the resulting inference risks.

## Scope boundary

This release uses Sepolia `cUSDTMock` and a sponsored encrypted prize reserve. It does not claim a production lending-yield integration or complete PoolTogether V5 compatibility. Those limitations are explicit in the [submission package](./zama-context/08-bounty-pooltogether/submission-package.md).

## Verification

Exact test commands and source-verification links are recorded in the [submission package](./zama-context/08-bounty-pooltogether/submission-package.md#local-verification). Repository publication is tracked in the [publication runbook](./zama-context/08-bounty-pooltogether/publication-runbook.md).

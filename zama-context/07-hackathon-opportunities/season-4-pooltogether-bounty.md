# Zama Developer Program Mainnet Season 4: Confidential PoolTogether

## Scope

Translate the Season 4 bounty into plain language and record the verified challenge requirements before deciding whether to enter.

## Sources checked

- [Official Zama Season 4 announcement](https://www.zama.org/post/zama-developer-program-mainnet-season-4)
- [Official Season 4 bounty form](https://forms.zama.org/developer-program-mainnet-season4-bounty-track)
- [PoolTogether overview](https://dev.pooltogether.com/protocol/introduction/)
- [PoolTogether V5 protocol design](https://dev.pooltogether.com/protocol/design/)
- [PoolTogether protocol reference](https://dev.pooltogether.com/protocol/reference/)

## The challenge in one sentence

Build a working PoolTogether-style savings app on Sepolia where people can deposit money, keep their original deposit available for withdrawal, and compete for yield-generated prizes without exposing their balances, deposit amounts, odds, or prize amounts onchain.

## PoolTogether in layman terms

PoolTogether is a “save money and get a chance to win” system:

1. People deposit tokens.
2. The deposits generate yield.
3. The original deposits belong to the savers and can be withdrawn.
4. The yield—not the principal—is collected as prize money.
5. A periodic random draw distributes prizes to some depositors.

The important idea is **no-loss savings**: users are trying to win someone else’s yield while keeping their own deposit.

PoolTogether’s current documentation describes vaults, a prize pool, yield liquidation, draw management, weighted-average balance tracking, and prize claiming as separate composable components.

## What Zama adds

Normal public-chain PoolTogether activity exposes the information that makes the game work:

- how much each person deposited;
- each person’s balance over time;
- each person’s approximate chance of winning;
- how much a winner received.

The bounty asks us to keep the process verifiable while encrypting those sensitive values with the Zama Protocol. The intended user experience is that winners can decrypt their own prizes, while observers cannot inspect everyone’s financial position.

## What must be built

The official bounty form requires:

- a functioning dApp;
- smart-contract and frontend code;
- a working demo deployed on a website;
- a three-minute video pitch/demo made by a real person;
- an X thread or article introducing the project;
- deployment targeting Sepolia.

The total reward pool is 5,000 cUSDT for up to three winners. The official deadline is September 5, 2026 at 23:59 AOE. Distribution can be adjusted based on submission quality, and an exceptional submission may receive the full pool.

## What “confidential” should mean here

At minimum, the design goal is to hide:

- deposit amounts;
- encrypted balances and balance history;
- winning amounts;
- individual odds or weight calculations.

The draw itself must still be explainable and verifiable. Privacy does not automatically hide every piece of blockchain metadata: wallet addresses, transaction timing, contract calls, and winner-claim activity may remain visible depending on the design.

## Why this is technically interesting

This challenge crosses almost every important Zama layer:

- FHEVM encrypted types and arithmetic for balances/weights.
- ZK-backed encrypted-input verification.
- Encrypted random-number generation or another verifiable randomness path.
- ACL rules for who may decrypt winner/prize information.
- Coprocessor execution for encrypted calculations.
- KMS-backed decryption and response handling.
- A frontend that makes encryption feel normal to users.

It is therefore a useful application test of the infrastructure research we have been doing.

## Verified facts versus interpretation

### Verified facts

- The challenge is a confidential PoolTogether-style prize savings app.
- It requires an actual dApp, deployed demo, real-person three-minute video, and X publication.
- The target network is Sepolia.
- The prize pool is 5,000 cUSDT, with up to three winners.
- PoolTogether’s model uses deposits, yield, periodic draws, and withdrawals of principal.

### Interpretation

The judges are likely evaluating more than “can an encrypted transfer work?” They want a polished demonstration of a complete confidential financial product: usable frontend, reliable contracts, understandable fairness story, and enough engineering quality to justify a possible later audit.

## Unknowns to resolve before building

- Whether the submission should implement a full PoolTogether V5-compatible vault/prize-pool flow or a focused production-quality adaptation.
- Which Sepolia yield source is available and suitable for the demo.
- The exact acceptable design for encrypted weighted winner selection.
- How winner notification and prize decryption should work without revealing non-winners’ balances.
- Required submission form fields and any judging rubric not visible in the announcement text.

## Not included

No product architecture, implementation plan, or final decision to enter has been made in this brief.

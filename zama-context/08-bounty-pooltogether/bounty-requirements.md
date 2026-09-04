# Bounty requirements: confidential PoolTogether

## Scope

This is the fixed target for the Zama Developer Program Mainnet Season 4 bounty. The deadline is recorded for completeness, but it is not a planning constraint for our reverse-engineering work.

## Verified challenge

The requested product is a confidential PoolTogether-style prize-savings application:

1. A user deposits an asset into a shared pool.
2. The pool generates yield.
3. Yield is distributed through periodic prize draws.
4. The user can withdraw their principal at any time, subject to the vault's actual liquidity rules.
5. Deposits, balances, odds, and winnings should remain encrypted.
6. The draw must remain verifiable onchain.

The official announcement calls for a production-oriented demonstration, not only an isolated encryption demo. The submission requirements include a working dApp, smart-contract and frontend code, a deployed website demo, a three-minute real-person video, and an X thread or article. Deployments should target Sepolia. The announced reward pool is 5,000 cUSDT for up to three winners.

## Layman interpretation

This is “save money for a chance to win the interest” with the financial details hidden. Everyone should be able to verify that the draw followed the rules, but an observer should not be able to read every participant's deposit, balance, or prize amount from the chain.

## What is explicitly not decided yet

- Whether to reproduce all of PoolTogether V5 or build a focused confidential adaptation.
- Whether one vault, one asset, and one winner per draw are sufficient for the first production-quality slice.
- How the winner is identified without exposing every participant's odds.
- Whether the prize is paid using a confidential token directly or by a separate encrypted claim balance.
- Which randomness, decryption, and verification path is acceptable for the final design.

## Full compatibility versus focused adaptation

The announcement asks for a “confidential version of PoolTogether” and a production-oriented dApp, but it does not state that entrants must reproduce every V5 contract, every tier, every vault, or every liquidator/claimer component. The safe interpretation for research is therefore:

- preserve the recognizable PoolTogether economic promise;
- implement a coherent, polished confidential flow;
- explain every deliberate simplification against V5;
- add V5 compatibility only where it improves the submission and remains testable.

This is an inference from the published requirements, not a confirmed judging clarification. We should look for an official rubric or ask Zama only if the architecture later depends on full V5 compatibility.

## Sources

- [Official Season 4 announcement](https://www.zama.org/post/zama-developer-program-mainnet-season-4)
- [Official Season 4 bounty form](https://forms.zama.org/developer-program-mainnet-season4-bounty-track)
- [PoolTogether introduction](https://dev.pooltogether.com/protocol/introduction/)
- [PoolTogether V5 design](https://dev.pooltogether.com/protocol/design/)

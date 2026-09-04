# Existing use cases: bounty lens

## Scope

Evaluate existing use cases by how directly they help us build confidential prize savings.

## Directly relevant patterns

- **Confidential token balances:** needed to hide deposits, shares, and payouts.
- **Confidential transfers:** needed if the prize token itself moves as an encrypted amount.
- **Private threshold/eligibility checks:** analogous to deciding whether an encrypted balance crosses a winning threshold.
- **Blind auctions:** useful reference for encrypted values, ACL, `FHE.select`, private outcomes, and delayed resolution.
- **Private games and lotteries:** useful reference for randomness, winner status, and claim UX.
- **User decryption:** needed so a winner can learn their own prize without publishing it.
- **Public decryption with proof:** useful when a final draw artifact must be publicly checked.

## Indirectly relevant patterns

- confidential voting and governance;
- confidential RWA and compliance flows;
- private payments and payroll;
- encrypted identifiers and access credentials.

These demonstrate privacy patterns but do not solve the PoolTogether-specific economics of yield, time-weighted balances, draw liquidity, and principal withdrawal.

## Research questions

- Does the example keep balances encrypted throughout, or only hide a one-time input?
- Does it require a public outcome or winner-only decryption?
- How does it authorize encrypted state updates?
- How many FHE operations does it perform per user and per draw?
- What does the frontend show while the coprocessor or KMS is processing?

## Sources

- [FHEVM repository](https://github.com/zama-ai/fhevm)
- [FHEVM sealed-bid auction example](../fhevm/docs/examples/sealed-bid-auction-tutorial.md)
- [FHEVM public decryption example](../fhevm/docs/examples/heads-or-tails.md)
- [Zama official site](https://www.zama.org/)
- [Season 4 bounty](../07-hackathon-opportunities/season-4-pooltogether-bounty.md)

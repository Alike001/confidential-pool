# Yield boundary

## Decision

The Sepolia submission will use a **testnet-sponsored encrypted prize reserve**. It will not claim that the deployed cUSDT principal is earning live lending yield.

This is the smallest honest boundary for the current asset and network. The confidential pool mechanics, time-weighted odds, KMS-proven denominator, Chainlink randomness, encrypted winner selection, winner-only payout, and principal withdrawal remain real onchain flows. The source of prize capital is controlled testnet funding.

## Why a live Aave adapter is not the current path

Three constraints combine:

1. Zama's cUSDTMock is a confidential wrapper around the project-specific Sepolia underlying token at `0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0`.
2. The current official Aave address-book source has no `AaveV3Sepolia` Ethereum-Sepolia market module, and the cUSDTMock underlying is not listed as an Aave reserve.
3. Zama unshielding is a public, asynchronous two-step flow: submit unwrap, wait for public decryption proof, then finalize. Moving deposits one user at a time would therefore expose linkable strategy amounts and undermine the privacy objective.

There is also a liquidity mismatch. The bounty requires principal withdrawal at any time. Supplying all unshielded principal to an external market would require either synchronous strategy withdrawals, an explicitly sized liquid buffer, or queued withdrawals.

Forcing an integration despite these constraints would produce a more fragile demo and a less honest privacy story.

## What “yield” means in the MVP

The deployer-configured `yieldProvider` funds cUSDT into `_encryptedYieldReserve` through the confidential token callback. The amount remains encrypted. Claims privately cap the candidate payout to zero when the reserve is insufficient, so reserve exhaustion does not reveal a winner through a revert.

Product wording must use one of these phrases:

- “testnet-sponsored prize reserve”;
- “demo yield reserve”;
- “sponsored testnet rewards.”

Product wording must not use these claims:

- “your deposit earns Aave yield”;
- “live lending yield”;
- “production yield strategy”;
- “risk-free yield.”

The UI should include a concise disclosure near pool details:

> Sepolia demo: prizes are funded by a sponsored encrypted reserve. Deposited principal is not supplied to a live lending market.

## Production migration path

A production yield adapter should be added only when a supported confidential asset and yield venue exist. Its minimum design requirements are:

1. Move liquidity in epoch-level batches, never directly in response to one user's deposit or withdrawal.
2. Keep enough confidential principal liquid to satisfy the advertised withdrawal policy.
3. Publish strategy identity, accounting rules, fees, and failure behavior.
4. Separate principal liabilities from realized yield and reconcile them onchain.
5. Treat public unshield/finalize amounts and timing as metadata in the threat model.
6. Support strategy pause, unwind, and delayed-settlement recovery without allowing an operator to seize user principal.
7. Re-run HCU, economic-invariant, insolvency, and multi-user metadata tests.

An ERC-4626 adapter alone is not sufficient; the confidential-to-public boundary and liquidity policy are the difficult parts.

## Submission implication

The project is a production-oriented confidentiality architecture demonstrated with test assets, not a claim that its testnet yield source is production-ready. The known limitation belongs in the landing/app disclosure, README, architecture diagram, demo narration, and bounty submission.

## Sources

- [Zama SDK unshield guide](https://docs.zama.org/protocol/sdk/guides/unshield-tokens.md)
- [Zama wrapped-token API](https://docs.zama.org/protocol/sdk/api-references/sdk/wrappedtoken.md)
- [Official Aave address book](https://github.com/aave-dao/aave-address-book/tree/main/src)

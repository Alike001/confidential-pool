# PoolTogether current architecture

## Scope

Reverse-engineer the current V5 architecture before adapting it to confidential values. The V5 system is a set of composable contracts rather than one “pool” contract.

## System map

```text
User
  │ deposit / withdraw
  ▼
Prize Vault ───────► underlying ERC-4626 yield vault
  │ shares and balance history
  ▼
TWAB Controller

Yield ──► Liquidator ──► prize token ──► Prize Pool
                                           │
Randomness ──► Draw Manager ──► award draw │
                                           ▼
                                  tiered prizes
                                           │
                             Claimer / user claim
```

## Verified facts from V5 documentation and source

### Prize Vault

`PrizeVault` accepts an underlying asset, deposits it into an underlying ERC-4626 yield vault, and mints vault shares to the depositor. In the source, `_depositAndMint` transfers the asset in, deposits into the yield vault, and mints the PoolTogether share after safety checks. The vault also burns shares and withdraws assets during a withdrawal.

The vault treats the depositor's shares as principal owed to users. Yield above total share debt and the configured buffer is available for liquidation. A liquidation pair can take the available yield as assets or vault shares and must contribute the prize token back to the Prize Pool.

### TWAB Controller

The Time-Weighted Average Balance Controller records balance observations in a ring buffer. It can return a user's average balance and the vault's average total supply over a historical time interval. This is what makes “deposit now, withdraw later” compatible with fair odds: the draw uses the balance held over the relevant period, not merely the balance at the exact draw block.

The V5 implementation stores balances and total supply as `uint96`-bounded values for gas and storage efficiency. A new observation is recorded when the configured period advances; otherwise the recent observation is updated.

### Prize Pool

The Prize Pool receives prize tokens from vaults, records contributions by draw, maintains a reserve, awards completed draws, and validates claims. A draw contains a random number and tiered liquidity. Claims are checked against the vault, account, draw, tier, and prize index.

### Draw Manager and randomness

The Draw Manager is an incentive layer around randomness and draw completion. In the inspected V5 implementation, a permissionless caller starts a draw request after the draw closes, and another caller can finish the draw once the RNG request is complete. The manager calls `PrizePool.awardDraw(randomNumber)` and allocates rewards from the reserve to draw participants.

### Claimer

The Claimer batches claims for winners and uses a variable-rate fee to incentivize third parties to claim on behalf of users. This matters to our design because confidentiality changes the normal “scan all accounts and call `isWinner`” workflow: a claimant may need a private proof or a user-specific eligibility check instead.

## Inference

For the bounty's smallest credible slice, the essential PoolTogether logic is likely:

- one deposit asset;
- one prize vault or simplified vault;
- principal accounting and withdrawal;
- a yield source or controlled testnet yield adapter;
- a periodic draw;
- weighted eligibility based on time held and balance;
- a confidential prize claim.

The full V5 tier system, multi-vault prize contributions, liquidation auctions, and third-party claim marketplace are useful reference designs but may be separate expansion work.

## Unknowns to resolve

- Which exact V5 deployment and asset should be treated as the compatibility baseline.
- Whether the bounty judges expect the V5 tiered algorithm or only the same economic behavior.
- Which Sepolia yield source is stable enough for a demonstration.
- Whether the final design should preserve multi-vault contribution fractions.

## Code evidence checked locally

- [`PrizeVault.sol`](./_repos/pt-v5-vault/src/PrizeVault.sol)
- [`TwabERC20.sol`](./_repos/pt-v5-vault/src/TwabERC20.sol)
- [`Claimable.sol`](./_repos/pt-v5-vault/src/abstract/Claimable.sol)
- [`TwabController.sol`](./_repos/pt-v5-twab-controller/src/TwabController.sol)
- [`PrizePool.sol`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)
- [`DrawManager.sol`](./_repos/pt-v5-draw-manager/src/DrawManager.sol)
- [`Claimer.sol`](./_repos/pt-v5-claimer/src/Claimer.sol)

## External sources

- [PoolTogether protocol design](https://dev.pooltogether.com/protocol/design/)
- [Prize Pool design](https://dev.pooltogether.com/protocol/design/prize-pool/)
- [Draw auction design](https://dev.pooltogether.com/protocol/design/draw-auction/)
- [Prize claimer design](https://dev.pooltogether.com/protocol/design/prize-claimer/)
- [PoolTogether V5 Prize Pool repository](https://github.com/GenerationSoftware/pt-v5-prize-pool)
- [PoolTogether V5 Prize Vault repository](https://github.com/GenerationSoftware/pt-v5-vault)
- [PoolTogether V5 TWAB Controller repository](https://github.com/GenerationSoftware/pt-v5-twab-controller)

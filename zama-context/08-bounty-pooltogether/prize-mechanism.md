# PoolTogether prize mechanism

## The economic loop

```text
principal deposited
        │
        ▼
underlying yield vault earns interest
        │
        ├── principal remains owed to vault share holders
        │
        ▼
available yield is liquidated into prize tokens
        │
        ▼
prize pool records contribution for a draw
        │
        ▼
random draw creates prize tiers
        │
        ▼
eligible users claim prizes
```

## Deposit and withdrawal

In V5, a user deposits an asset into a Prize Vault and receives vault shares. The source code uses an underlying ERC-4626 vault to generate yield, while the PoolTogether vault's total share supply represents the debt owed to depositors and fee accounting.

Withdrawal burns the owner's vault shares and sends the requested assets to the receiver. The source includes explicit checks for zero amounts, allowances, mint limits, and lossy or unavailable withdrawals. “Withdraw any time” is an economic goal, but the exact amount is still bounded by the actual underlying vault and global withdrawal limits.

## Time-weighted odds

The TWAB Controller records observations over time. A simple example:

- Alice holds 100 shares for a whole draw: TWAB = 100.
- Bob holds 200 shares for half and 0 for half: TWAB = 100.

For this draw, they have equal balance weight even though Bob's current balance may be zero. This prevents a user from depositing at the last second and receiving the same odds as someone who provided liquidity throughout the draw.

## Yield liquidation

V5 does not treat every deposit as a prize. The vault calculates available yield as assets above total debt and the yield buffer. A liquidation pair can withdraw that available yield as an accepted token form, while the liquidator sends the prize token into the Prize Pool. The Prize Pool records the contribution for the open draw and the contributing vault.

## Draw and tiers

At the end of a draw period, the Draw Manager obtains a random number and calls `awardDraw`. The Prize Pool uses accumulated contributions to update liquidity and tier data. V5 has multiple tiers, a reserve, and a prize count that grows with the tier. The exact tier schedule is part of the V5 economics, not a cryptographic primitive.

## Winner test in current V5

For a candidate winner, V5 derives a user-specific pseudo-random number from:

```text
hash(drawId, vault, user, tier, prizeIndex, winningRandomNumber)
```

It then obtains:

- the user's TWAB;
- the vault's TWAB total supply;
- the vault's share of prize contributions;
- the tier odds.

The candidate wins when the uniformly reduced user-specific random value falls inside the calculated winning zone. In simplified form:

```text
winning zone ≈ user TWAB × vault contribution fraction × tier odds
winner if random value < winning zone
```

The actual code also handles the total-supply denominator, uniform random-number reduction, tier frequency, prize index, zero-supply cases, and fixed-point arithmetic.

## Claims

The V5 Prize Pool checks `isWinner`, checks that the prize index exists, rejects duplicate claims, consumes tier liquidity, records the claim, and transfers the payout. A separate Claimer can batch claims and take a fee for doing the work.

## Inferences for our target

The confidential adaptation must protect at least three linked facts, not just the final payout:

1. the user's weight;
2. the total weight or odds denominator;
3. the result of the winner test.

If only the payout is encrypted while the first two remain public, observers can often reconstruct who was likely to win. The first implementation should therefore make an explicit privacy decision about the balance, historical weight, odds, and claim result separately.

## Sources

- [PoolTogether introduction](https://dev.pooltogether.com/protocol/introduction/)
- [PoolTogether V5 design](https://dev.pooltogether.com/protocol/design/)
- [Prize Vault reference](https://dev.pooltogether.com/protocol/reference/prize-vault/prizevault/)
- [Prize Pool reference](https://dev.pooltogether.com/protocol/reference/prize-pool/prizepool/)
- [TWAB Controller repository](https://github.com/GenerationSoftware/pt-v5-twab-controller)
- [TierCalculationLib.sol](./_repos/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol)

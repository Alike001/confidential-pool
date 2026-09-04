# Cross-chain gaps for the bounty

## Initial scope decision

The bounty targets Sepolia, so the first implementation should be single-chain unless the challenge requirements make bridging essential. Cross-chain prize liquidity is a later research question, not a prerequisite for the first correct loop.

## Why it still matters

PoolTogether V5 can isolate prize liquidity by chain, while the Zama Protocol has ciphertext handles, bridge components, and chain-aware contexts. Combining the two could require moving encrypted balances, draw state, ACLs, or prize claims between chains.

## Questions for later

- Can a TWAB or encrypted draw weight be moved without exposing it?
- Which chain owns the canonical draw and claim state?
- How are ACLs and KMS contexts kept consistent across chains?
- How are source/destination reorgs handled?
- Does bridging an encrypted prize create replay or double-claim risk?

## First-version boundary

No cross-chain feature should be added until the single-chain deposit → draw → private claim → withdrawal path is correct and measured.

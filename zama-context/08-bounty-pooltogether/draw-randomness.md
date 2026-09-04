# Draw randomness: current boundary and next decision

## What the local slice now guarantees

The product-shaped contract uses two transactions:

1. `commitDraw` records the public draw parameters, encrypted prize, and a hash commitment.
2. `revealDraw` accepts a random number and salt only if they reproduce that commitment.

The commitment includes:

```text
address(this)
drawId
aggregateSupply
tierOdds
vaultContributionFraction
drawRandomNumber
salt
```

Claims derive user-specific entropy from the revealed number, the vault address, the user, tier, and prize index. The reduction uses the V5 rejection-sampling rule before the encrypted comparison with the user's winning zone.

## What current PoolTogether V5 does instead

The checked V5 source separates draw coordination from the prize pool. `DrawManager` talks to an `IRng` provider:

- a keeper requests RNG and starts an auction after the draw closes;
- the RNG request must have been made in the same block as `startDraw`;
- the manager waits for the request to complete;
- `finishDraw` reads the provider's random number and passes it to `PrizePool.awardDraw`;
- failed RNG requests can be retried within bounded auction rules.

This is a better baseline than a permanently trusted `drawOperator`: the random value comes from a separate provider and draw completion is permissionless subject to the lifecycle checks. Our local slice currently compresses that machinery into one immutable operator so we can isolate the FHE boundary first. The production adapter should move toward an `IRng`-style provider boundary rather than simply shipping the operator's seed.

## Zama-native encrypted randomness

FHEVM exposes `FHE.randEuintX()` and bounded variants. The bounded form requires a power-of-two upper bound, which maps directly to Candidate B's fixed-domain experiment. The operation is executed in a transaction because it mutates PRNG state, and the resulting value stays encrypted.

This is useful for private winner computation, but it does not automatically satisfy the bounty's public-verifiability story: observers cannot independently inspect the random plaintext, and the contract still needs a clear policy for when the encrypted random value is generated, who may decrypt any result, and how replay is prevented. The pinned local checkout is version `0.14.0`; its local roadmap labels the random implementation as a mockup, while current FHEVM documentation describes the operation as encrypted onchain randomness. We must validate the exact Sepolia release and security model before treating it as production-ready.

The implementation workspace now contains the version-neutral [`IRng.sol`](../../confidential-pooltogether/src/interfaces/IRng.sol) seam. No Sepolia RNG provider has been selected or configured yet; the verified Sepolia cUSDT address is an asset target, not a randomness source.

Sources: [V5 DrawManager IRng interface](https://github.com/GenerationSoftware/pt-v5-draw-manager/blob/main/src/interfaces/IRng.sol), [V5 DrawManager](https://github.com/GenerationSoftware/pt-v5-draw-manager/blob/main/src/DrawManager.sol), [FHEVM random operations](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random), [pinned local roadmap](../fhevm/docs/protocol/roadmap.md).

Sources: [FHEVM random operations](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random), [pinned local roadmap](../fhevm/docs/protocol/roadmap.md).

## What this does not guarantee

Commit/reveal prevents the operator from changing the random number after seeing the commitment. It does not stop a single operator from trying many seeds offchain and committing the one that produces a preferred result. Therefore, this is an integrity mechanism, not yet an unbiased randomness mechanism.

The production design needs one of:

- a chain or protocol VRF whose output is unavailable before the commitment point;
- a Zama-supported randomness source with a public provenance check;
- a multi-party commit/reveal process where no one participant controls the final entropy;
- another publicly auditable entropy source whose timing cannot be manipulated by the draw operator.

## Required acceptance tests

- Changing any draw parameter, seed, or salt after commit must revert.
- A zero random number must be rejected, matching the V5 `PrizePool` boundary.
- A zero commitment must be rejected so a committed draw cannot be left permanently unrevealable by accident.
- A non-operator cannot commit or reveal.
- The same revealed transcript must produce the same reduced sample for every claimant.
- The plaintext reference model and Solidity implementation must agree on rejection sampling and strict `< winningZone` semantics.
- The final entropy source must be evaluated for operator bias, withholding, replay, and chain reorganization behavior.

## Current decision

Keep commit/reveal as an intermediate hardening milestone, but do not describe it as fair randomness in a bounty submission. Before the production architecture is finalized, test the chosen external or multi-party source against the V5 baseline and the privacy boundary.

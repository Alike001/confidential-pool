# Reality Research: PoolTogether V5 and the confidential adaptation

## Scope

This is a code-first reverse-engineering pass over the V5 components relevant to the bounty. It follows the requested order from architecture through withdrawal and records what each part does, why it exists, what it stores, what is public, what would need privacy, who calls it, what mathematics it uses, and what changes a confidential adaptation would require.

The code evidence is from shallow source snapshots in [`_repos/`](./_repos/) fetched on 2026-09-03. The exact commit list is in [`README.md`](./README.md).

The aggregate-supply privacy question raised by this pass is analyzed separately in [`twab-privacy-analysis.md`](./twab-privacy-analysis.md).

## Sources checked

- PoolTogether V5 [`PrizeVault.sol`](./_repos/pt-v5-vault/src/PrizeVault.sol)
- PoolTogether V5 [`TwabERC20.sol`](./_repos/pt-v5-vault/src/TwabERC20.sol)
- PoolTogether V5 [`Claimable.sol`](./_repos/pt-v5-vault/src/abstract/Claimable.sol)
- PoolTogether V5 [`TwabController.sol`](./_repos/pt-v5-twab-controller/src/TwabController.sol)
- PoolTogether V5 [`TwabLib.sol`](./_repos/pt-v5-twab-controller/src/libraries/TwabLib.sol)
- PoolTogether V5 [`PrizePool.sol`](./_repos/pt-v5-prize-pool/src/PrizePool.sol)
- PoolTogether V5 [`TieredLiquidityDistributor.sol`](./_repos/pt-v5-prize-pool/src/abstract/TieredLiquidityDistributor.sol)
- PoolTogether V5 [`TierCalculationLib.sol`](./_repos/pt-v5-prize-pool/src/libraries/TierCalculationLib.sol)
- PoolTogether V5 [`UniformRandomNumber.sol`](./_repos/pt-v5-prize-pool/lib/uniform-random-number/src/UniformRandomNumber.sol)
- PoolTogether V5 [`DrawManager.sol`](./_repos/pt-v5-draw-manager/src/DrawManager.sol)
- PoolTogether V5 [`RngAuction.sol`](./_repos/pt-v5-draw-auction/src/RngAuction.sol)
- PoolTogether V5 [`Claimer.sol`](./_repos/pt-v5-claimer/src/Claimer.sol)
- [PoolTogether V5 protocol design](https://dev.pooltogether.com/protocol/design/)
- [PoolTogether V5 Prize Pool design](https://dev.pooltogether.com/protocol/design/prize-pool/)
- [PoolTogether V5 Draw Auction design](https://dev.pooltogether.com/protocol/design/draw-auction/)
- [Zama FHEVM encrypted inputs](https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs)
- [Zama FHEVM supported types and operations](https://docs.zama.org/protocol/solidity-guides/smart-contract/types)
- [Zama FHEVM encrypted randomness](https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random)
- [Zama FHEVM ACL](https://docs.zama.org/protocol/solidity-guides/smart-contract/acl)

---

## 1. Overall architecture

### What it does

V5 separates the protocol into specialized components:

```text
User
  │
  ▼
Prize Vault ──► underlying ERC-4626 yield vault
  │                     │
  │ vault shares        │ yield
  ▼                     ▼
TWAB Controller      Liquidation Pair/Router
  │                     │ prize tokens
  └──────────────► Prize Pool ◄──── Draw Manager/RNG
                         │
                         ▼
                  Claimer / winner claim
```

### Why it exists

The separation isolates responsibilities. The vault handles deposits and withdrawals, TWAB handles historical eligibility, the liquidator converts yield into prize liquidity, the Prize Pool distributes liquidity, the Draw Manager finalizes randomness, and the Claimer automates claims.

### What state it stores

Across the system, the relevant state includes:

- vault asset, share, debt, yield, fee, and liquidation state;
- per-user and total-supply TWAB histories;
- prize-token contribution accumulators by vault and draw;
- tier liquidity, reserve, draw ID, and winning random number;
- claim records keyed by vault, winner, draw, tier, and prize index;
- RNG requests and draw-auction state;
- claimer fee and reward state.

### What data is public

The standard V5 implementation exposes or emits ordinary EVM data: user addresses, asset transfer amounts, vault share balances, total supply, TWAB observations, yield-vault balances, liquidations, prize contributions, draw IDs, the winning random number, tier parameters, claim events, payouts, and claimed flags.

### What data must become private

For the bounty, the minimum privacy boundary is:

- deposit amount and resulting user balance;
- historical balance/weight used to calculate odds;
- individual odds or winning-zone size;
- winner status until the authorized user learns it;
- prize amount and confidential payout.

Draw identifiers, timestamps, contract addresses, public parameters, and a public fairness transcript may remain public. Transaction timing, caller addresses, gas use, and any intentionally revealed outcome can still leak metadata.

### What calls what

- The user calls the Prize Vault.
- The Prize Vault calls the underlying ERC-4626 vault and the TWAB Controller.
- The liquidation pair calls the Prize Vault and then contributes prize tokens to the Prize Pool.
- The Draw Manager calls the RNG and `PrizePool.awardDraw`.
- The Claimer calls the vault's claim interface, which calls the Prize Pool.
- Anyone can query the public winner and claim functions in ordinary V5.

### What mathematics it uses

The system uses ERC-4626 conversions, time-weighted averages, accumulator arithmetic, fixed-point PRB-Math, tier odds, random-number reduction, multiplication, division, integer rounding, and claim/liquidity accounting.

### What we would have to change

We would need to preserve the public economic state machine while replacing sensitive numeric state and winner evaluation with FHE-compatible state. The architecture cannot simply encrypt one field: the winner calculation consumes several linked values.

---

## 2. Prize Vault

### What it does

`PrizeVault` accepts an underlying ERC-20 asset and mints PoolTogether vault shares. It routes the assets into an underlying ERC-4626 yield vault. It also exposes the withdrawal, yield, liquidation, and prize-claim integration points.

### Why it exists

It gives users a redeemable principal position while making the yield available to fund prizes. It also provides an accounting layer compatible with the TWAB Controller and Prize Pool.

### What state it stores

The source stores or references:

- immutable underlying asset and underlying decimals;
- immutable yield vault and yield buffer;
- yield fee percentage and fee recipient;
- accrued yield fee balance;
- liquidation pair address;
- Prize Pool, Claimer, and TWAB Controller references through inheritance;
- user share balances and total supply through `TwabERC20`/TWAB rather than ordinary ERC-20 storage.

### What data is public

In ordinary V5, `asset`, `totalAssets`, balances, total supply, conversion previews, maximum deposit/withdraw limits, yield balances, fee configuration, liquidation pair, and Deposit/Withdraw events are public. The underlying `safeTransferFrom` and `safeTransfer` operations reveal token amounts on the public chain.

### What data must become private

- user deposit amount and share balance;
- user redemption amount, if the bounty promises confidential withdrawals;
- possibly aggregate vault asset/debt/yield figures if publishing them would allow users to infer hidden balances.

The bounty explicitly requires encrypted deposits, balances, and winnings. It does not necessarily require hiding all aggregate yield or public token transfers, so this must be decided as a product privacy boundary.

### What calls it

- User calls `deposit`, `mint`, `withdraw`, or `redeem`.
- The vault calls the yield vault during deposit and withdrawal.
- The vault calls the TWAB Controller during mint, burn, and transfer.
- The configured Claimer calls `Claimable.claimPrize`.
- The configured liquidation pair calls `transferTokensOut` and `verifyTokensIn`.
- The owner calls configuration setters.

### What mathematics it uses

- Deposit shares are one-to-one with assets in this implementation: `previewDeposit(assets) = assets`.
- `totalDebt = totalSupply + yieldFeeBalance`.
- `totalPreciseAssets` is the underlying yield-vault redemption value plus latent asset balance.
- Available yield is total assets minus debt and the yield buffer.
- ERC-4626 conversion and rounding protect deposits and withdrawals.
- Liquidation fees use the relation `total liquidation = amount out + yield fee`.

### What we would have to change

The first confidential version may need a confidential share/accounting layer rather than `TwabERC20`, because ordinary ERC-20 balances and transfer events reveal amounts. The underlying yield adapter can potentially remain public if it receives an aggregate vault position, but principal-versus-yield invariants must be enforced without plaintext user balances.

---

## 3. TWAB Controller

### What it does

The TWAB Controller tracks current balances, delegated active balances, total supply, and historical observations. It returns a user's average active balance over a time range and the average total supply over the same range.

### Why it exists

It makes the odds depend on how long capital was supplied, not only on the balance at draw time. This allows users to deposit and withdraw freely without letting a last-minute deposit receive a full-period weight.

### What state it stores

The controller stores:

- immutable `PERIOD_LENGTH` and `PERIOD_OFFSET`;
- `userObservations[vault][user]` accounts;
- `totalSupplyObservations[vault]` accounts;
- `delegates[vault][user]` mappings.

Each account contains current `balance`, current `delegateBalance`, next observation index, cardinality, and a ring buffer of observations. Each observation contains cumulative balance, active balance, and timestamp. The ring buffer is bounded by the library's maximum cardinality.

### What data is public

The standard controller exposes current balances, total supply, delegation, observation accounts, historical balances, TWABs, and total-supply TWABs. It also emits balance changes and observation events containing amounts and observation data.

### What data must become private

- the user's active balance;
- the user's observation balances and cumulative balances;
- the total active supply if individual odds should not be inferable;
- delegation-linked active amounts if delegation is supported.

Period boundaries, draw timestamps, and observation existence/cardinality can remain public if they do not reveal amounts.

### What calls it

The Prize Vault's inherited `TwabERC20` calls `mint`, `burn`, and `transfer`. Users call `delegate`. The Prize Pool calls `getTwabBetween` and `getTotalSupplyTwabBetween` during `isWinner`.

### What mathematics it uses

The core observation update is:

```text
new cumulative balance
  = old cumulative balance
  + active balance × elapsed seconds
```

The range average is:

```text
TWAB
  = (end cumulative balance - start cumulative balance)
    / (end time - start time)
```

The implementation snaps times to periods, extrapolates missing endpoint observations using the last known active balance, and uses ring-buffer search.

### What we would have to change

An FHE version cannot directly store a normal `Observation` with plaintext balance and cumulative balance if those values are private. We would need to decide whether to:

- maintain encrypted cumulative balances and encrypted active balances;
- use a simpler encrypted per-draw snapshot;
- keep time metadata public and only encrypt numeric amounts;
- remove delegation and bounded historical ring-buffer complexity from the first slice.

The mathematical average also contains division by a public time interval, which is more FHE-friendly than division by an encrypted denominator, but ciphertext width and cumulative overflow still need testing.

---

## 4. Yield flow

### What it does

The yield flow moves user assets into the underlying ERC-4626 vault, measures the surplus above principal debt and buffer, sells that surplus through a liquidation pair, and contributes the received prize token to the Prize Pool.

### Why it exists

PoolTogether prizes are intended to come from yield rather than consuming depositor principal. The liquidator also makes yield-to-prize conversion permissionless and market-based.

### What state it stores

The Prize Vault stores yield buffer, yield fees, fee recipient, and liquidation pair. The underlying yield vault stores the actual yield position. The liquidation pair stores auction period, emission, pricing, and last-auction state. The Prize Pool stores contribution accumulators.

### What data is public

Current V5 exposes total assets, total debt, total yield, available yield, liquidation pair, auction state, swap amounts, token transfers, and prize-token contribution events. Liquidation amount and pricing are public.

### What data must become private

The bounty does not require hiding all aggregate yield operations. The sensitive part is the relationship between yield, individual deposits, and individual prize amounts. At minimum, user balances and the resulting per-user prize must be private. Aggregate yield contribution can remain public only if it does not undermine the intended privacy story.

### What calls what

1. A user deposits into the Prize Vault.
2. The vault deposits into the underlying yield vault.
3. A liquidation pair calls `PrizeVault.transferTokensOut`.
4. The pair transfers prize tokens into the Prize Pool and calls `verifyTokensIn`.
5. `verifyTokensIn` calls `PrizePool.contributePrizeTokens` for the vault.

The inspected CGDA `LiquidationPair` calculates a sale amount, calls the source to transfer output tokens, receives input tokens, and verifies the input with the source.

### What mathematics it uses

- available yield = total precise assets − total debt − yield buffer, floored at zero;
- yield fee is calculated proportionally to output amount;
- CGDA uses fixed-point exponential pricing and auction periods;
- contribution accumulators assign prize-token liquidity to draw ranges.

### What we would have to change

For the first confidential adaptation, a full CGDA liquidation auction may be unnecessary complexity. A controlled or simplified yield adapter can prove the principal/yield separation first. If a public asset transfer is used, the documentation must state that the token movement is public even if the internal user accounting is encrypted.

---

## 5. Prize Pool

### What it does

The Prize Pool receives prize tokens, records contributions, distributes liquidity among tiers and reserve, stores the latest draw randomness, checks winner eligibility, and pays valid claims.

### Why it exists

It is the settlement layer for prize liquidity and draw outcomes. Vaults contribute liquidity, but the Prize Pool centralizes the rules for distribution and claim consumption.

### What state it stores

The source stores:

- prize token and TWAB Controller references;
- draw period, first draw time, draw timeout, creator, and Draw Manager;
- per-vault contribution accumulators and a total accumulator;
- `_winningRandomNumber` and last awarded draw data inherited from the tier distributor;
- tier liquidity and reserve state;
- claim records keyed by vault, account, draw, tier, and prize index;
- reward balances, claim count, total withdrawn, pending rewards, and shutdown state.

### What data is public

Prize token, draw timing, draw IDs, winning random number, tier parameters, reserve, contribution queries, tier prize sizes/counts, claim status, reward balances, and claim/draw/contribution events are public.

### What data must become private

- per-user claim amount and winning status;
- per-user TWAB inputs used by `isWinner`;
- individual odds and winning-zone size;
- potentially per-vault contribution fractions if multiple vaults reveal participant odds.

The draw ID, public parameters, randomness commitment/result, aggregate reserve, and protocol events can remain public if they do not expose hidden participant weights.

### What calls it

- the configured Draw Manager calls `awardDraw`;
- Prize Vault/liquidation paths call `contributePrizeTokens`;
- users, vaults, or Claimer paths call `claimPrize`;
- the Draw Manager calls reward allocation and reserve functions.

### What mathematics it uses

- contribution accumulators distribute liquidity over draw ranges;
- fresh liquidity and reclaimed tier liquidity produce a new prize-token-per-share value;
- reserve receives its configured share and integer remainder;
- tier prize sizes use utilization rate, tier liquidity, and prize count;
- fixed-point SD59x18/UD60x18 arithmetic and integer casts are used throughout.

### What we would have to change

The settlement contract must stop using plaintext user balances and plaintext claim amounts as the source of truth. A confidential version likely needs an encrypted claim state plus a public one-time claim/nullifier record. The exact settlement method depends on whether the final payout is a confidential-token transfer, an encrypted claim balance, or an authorized decryption followed by a separate payment.

---

## 6. Draw lifecycle and RNG

### What it does

The draw lifecycle waits for a draw period to close, obtains randomness, and calls `PrizePool.awardDraw`. The inspected Draw Manager uses two permissionless steps: start a randomness request and finish the draw after the request completes. The separate Draw Auction repository documents an alternative multi-chain auction path for requesting RNG on L1 and relaying results to an L2 Prize Pool.

### Why it exists

The lifecycle prevents a draw from being finalized before its period ends and incentivizes third parties to keep draws moving without requiring a single operator to submit every transaction.

### What state it stores

Prize Pool stores draw timing, last awarded draw, winning random number, and timeout/shutdown state. Draw Manager stores RNG address, start-auction history, retry data, rewards, and draw-manager configuration. RngAuction stores sequence period, auction timing, selected RNG, and last auction result.

### What data is public

Draw periods, close times, draw IDs, RNG request IDs, auction participants/rewards, RNG completion status, awarded random number, and draw events are public.

### What data must become private

The randomness itself normally should not be hidden forever; it is part of the fairness transcript. The sensitive issue is how it combines with hidden participant weights. A confidential draw may keep the random value public while evaluating the threshold privately, or use an encrypted random value if the protocol requires it. The choice must be tied to an unbiased selection proof.

### What calls what

- anyone starts a draw request through the Draw Manager once the Prize Pool draw closes;
- the RNG service fulfills the request;
- anyone finishes the draw through the Draw Manager;
- Draw Manager reads the RNG result and calls `PrizePool.awardDraw`;
- in the auction/bridge design, RngAuction requests RNG and a relay path carries the result to the target chain.

### What mathematics it uses

- timestamp-to-draw arithmetic;
- auction elapsed-time and reward-fraction formulas;
- retry and timeout conditions;
- RNG service output treated as the entropy source for the draw.

### What we would have to change

We must decide whether to reuse public verifiable randomness and encrypt only the eligibility computation, or generate an encrypted random value inside FHEVM. The first option may be easier to explain and bind to a public draw transcript; the second may provide stronger secrecy but introduces random-state, availability, and verification questions. This is not yet a final decision.

---

## 7. Prize tiers

### What it does

The tier distributor divides prize liquidity among multiple prize tiers and a reserve. V5 starts with a configured number of tiers, supports four through eleven tiers, reserves two canary tiers, and can adjust the number of tiers using claim-count observations.

### Why it exists

Tiers create a distribution with frequent smaller prizes and rarer larger prizes. Adaptive tier count lets liquidity and claim activity affect the distribution over time.

### What state it stores

For each tier, the source stores `drawId`, `prizeSize`, and consumed `prizeTokenPerShare`. Globally it stores tier count, tier shares, canary shares, reserve shares, utilization rate, global prize-token-per-share, last awarded draw, and reserve.

### What data is public

Tier count, tier odds, prize count, prize size, remaining liquidity, reserve, utilization parameters, and claim count are public or queryable.

### What data must become private

Tier definitions and public prize sizes can remain public if the bounty only hides personal winnings. If winnings themselves must remain encrypted, the per-winner payout should be encrypted even when the tier's nominal prize size is public. If tier sizes are made private too, reserve and liquidity accounting become more complex.

### What calls it

Prize Pool calls internal tier-distribution functions during `awardDraw`, queries tier data during claims and winner checks, and the Claimer reads tier data to calculate claim fees.

### What mathematics it uses

- tier IDs range from 0 upward;
- prize count is `4 ** tier`;
- the grand prize tier has odds of `1 / grandPrizePeriodDraws`;
- tiers closer to the canary tiers have higher odds, with the last tiers set to every-draw odds;
- prize size is approximately `remaining tier liquidity × utilization rate / prize count`;
- liquidity is divided by total shares, with integer remainders sent to reserve.

### What we would have to change

The first confidential implementation may reduce the tier surface to one or a few fixed tiers while preserving the idea of periodic yield-funded prizes. If the full tier system is retained, tier count, odds, prize-index loops, and claim count all need to be checked for encrypted-operation cost and information leakage.

---

## 8. Winner eligibility and exact `isWinner` computation

### What it does

`PrizePool.isWinner(vault, user, tier, prizeIndex)` returns a plaintext boolean in ordinary V5. It checks whether the supplied user won a specific prize index in a specific tier of the latest awarded draw.

### Why it exists

It lets anyone verify a candidate's eligibility before submitting a claim. The claim path uses the same calculation to prevent unauthorized prize extraction.

### Exact call chain

The function at [`PrizePool.sol`](./_repos/pt-v5-prize-pool/src/PrizePool.sol) performs this sequence:

1. Read `_lastAwardedDrawId`; revert if no draw exists.
2. Check that `_tier < numberOfTiers`.
3. Read `tierOdds = getTierOdds(_tier, numberOfTiers)`.
4. Compute the historical range size with `estimatePrizeFrequencyInDraws(tierOdds, grandPrizePeriodDraws)`.
5. Compute `startDrawIdInclusive` from the latest draw and that range size.
6. Compute `tierPrizeCount = 4 ** tier` and reject an invalid prize index.
7. Compute a user-specific entropy value:

   ```text
   PRN = uint256(keccak256(
     abi.encode(drawId, vault, user, tier, prizeIndex, winningRandomNumber)
   ))
   ```

8. Compute the vault's prize contribution portion over the draw range:

   ```text
   vaultPortion = vaultContribution / totalContributionExcludingDonations
   ```

9. Read the user's TWAB and vault total-supply TWAB for the same range.
10. Call `TierCalculationLib.isWinner(PRN, userTwab, vaultTwabTotalSupply, vaultPortion, tierOdds)`.

### Exact math inside `TierCalculationLib.isWinner`

The library first returns false if the historical total supply is zero. Otherwise it computes:

```text
winningZone
  = convert(
      userTwab
      × tierOdds
      × vaultPortion
    )
```

All of `tierOdds` and `vaultPortion` are signed 59.18 fixed-point values. The result is converted to an unsigned integer.

It then computes:

```text
uniformRandom
  = UniformRandomNumber.uniform(PRN, vaultTwabTotalSupply)

winner
  = uniformRandom < winningZone
```

The uniform random helper compensates for modulo bias. It computes a rejection threshold, repeatedly hashes entropy if it falls below that threshold, and finally returns `random % upperBound`. This means the public algorithm includes both a potentially variable rejection loop and a modulus whose upper bound is the historical total supply.

### What state it reads

- latest draw ID;
- number of tiers and tier configuration;
- winning random number;
- vault contribution accumulator over a draw range;
- total contribution accumulator and donation accumulator;
- user's TWAB observations;
- vault total-supply TWAB observations.

### What data is public

Every input to the calculation is public in ordinary V5: user, vault, draw ID, tier, prize index, winning randomness, contribution totals, historical TWABs, total-supply TWABs, tier odds, and the returned boolean. Anyone can call it and reproduce the result.

### What data must become private

To hide individual odds, the confidential version should treat these as private inputs or private derived values:

- user TWAB;
- vault total-supply TWAB, if it would reveal the denominator or allow odds inference;
- vault contribution portion, if multiple vault contributions reveal a participant's effective odds;
- winning zone;
- winner boolean;
- prize amount/payout.

These can remain public for the first experiment if the scope is only “private payout,” but that would not satisfy the stronger interpretation of hidden deposits, balances, and odds.

### What calls it

Anyone can call `isWinner` as a view in the public system. `PrizePool.claimPrize` calls it internally during settlement. The Claimer indirectly triggers it through the vault claim path.

### What mathematics it uses

- Keccak-256 domain separation by draw, vault, user, tier, and prize index;
- historical draw-range calculation;
- time-weighted averages;
- contribution ratios;
- fixed-point multiplication and conversion;
- unbiased bounded random reduction;
- final integer comparison.

### What we would have to change

This is the core adaptation problem. A direct FHE translation is not one operation. It requires answers to all of these:

- Can the random entropy remain public while the threshold remains encrypted?
- How do we avoid `uniform(PRN, encryptedTotalSupply)` when the random helper uses modulo and a variable rejection loop?
- Can we express the winning zone in a fixed integer scale with public divisors only?
- Do we need to encrypt total weight, or is a public aggregate acceptable?
- How does the contract store an encrypted boolean and prevent a caller from probing arbitrary users?
- How does an encrypted winner boolean cause a payout without a plaintext Solidity branch?
- What is publicly verifiable: the draw randomness, the operation graph, a public decryption proof, or a combination?

### Current FHE mapping

| V5 value/operation | FHE candidate | Status |
|---|---|---|
| encrypted deposit/balance | `euint64`/`euint128` plus ACL | supported primitive; accounting design open |
| balance update | `FHE.add` / `FHE.sub` | supported primitive |
| cumulative balance | encrypted addition and public time multiplier | likely expressible; width/overflow open |
| TWAB division by public duration | encrypted division by plaintext divisor | documented capability; benchmark needed |
| winning-zone multiplication | encrypted multiplication | documented capability; scaling needed |
| winner comparison | `FHE.lt` returning `ebool` | supported primitive |
| encrypted branch/payout | `FHE.select` | supported primitive |
| public draw randomness | clear randomness bound to draw ID | likely simplest fairness transcript; not final |
| encrypted randomness | `FHE.randEuintX` | supported primitive; transaction-only and bound restrictions apply |
| `random % encryptedTotalSupply` | no direct mechanical translation | unresolved design problem |
| winner-only result | ACL + user decryption | supported flow; claim semantics open |
| public final result | public decryption + proof checking | supported flow; leaks final result |

---

## 9. Prize claiming

### What it does

The Prize Pool's `claimPrize` validates the tier and prize index, checks `isWinner`, rejects duplicate claims, consumes tier liquidity, records the claim, allocates any claimer reward, and transfers the payout. The Claimable extension chooses a prize recipient and invokes hooks. The Claimer batches claims for multiple winners and charges an incentive fee.

### Why it exists

PoolTogether prizes are pull-based: winning does not automatically loop over all users. A winner or third-party claimer must submit a transaction, and the claim record prevents reuse.

### What state it stores

- claimed flag keyed by vault, winner, draw, tier, and prize index;
- claim count;
- tier liquidity and total withdrawn;
- claimer reward balances and total pending rewards;
- optional winner hook configuration in the vault;
- Claimer fee parameters and claim errors.

### What data is public

Winner address, vault, draw, tier, prize index, payout, claim reward, recipient, claim events, and claimed status are public. In the Claimer, the arrays of winners and prize indices are public transaction inputs.

### What data must become private

- winner status before authorized disclosure;
- payout amount;
- potentially winner identity if the product promises anonymous winners;
- claim eligibility failures that would allow probing by arbitrary observers.

The one-time claim/nullifier state likely remains public as a boolean or commitment; otherwise the protocol cannot reliably prevent replay.

### What calls it

- direct user or authorized vault path calls `Claimable.claimPrize`;
- `Claimable` calls `PrizePool.claimPrize`;
- `Claimer.claimPrizes` calls the vault repeatedly for supplied winners and prize indices;
- Prize Pool transfers prize tokens and later lets reward recipients withdraw accumulated rewards.

### What mathematics it uses

- tier prize size and remaining liquidity;
- fee per claim and VRGDA curve in the Claimer;
- payout = prize size − claim reward;
- counters and safe integer conversions;
- boolean claim-record lookup.

### What we would have to change

A confidential claim should preferably be user-specific rather than a public array of winner addresses. Candidate patterns are:

- user asks for an encrypted winner bit and then claims only if it decrypts true;
- contract stores an encrypted payout and uses a confidential token transfer;
- contract publicly verifies one final winner/decryption result and pays that winner;
- a private claim proof or commitment authorizes a one-time payout.

The chosen flow must prevent a caller from learning non-winners' results and must preserve public no-double-claim verification.

---

## 10. Withdrawal

### What it does

The Prize Vault burns vault shares and withdraws the requested underlying assets. It supports both asset-based withdrawal and share-based redemption, allowance-based third-party calls, and preview/max-limit functions.

### Why it exists

Principal liquidity is the “no-loss savings” promise. Users should not need to lock their funds until a prize draw completes.

### What state it stores

Withdrawal uses:

- the user's share balance and total supply;
- underlying yield-vault share balance;
- latent asset balance held in the Prize Vault;
- total debt and yield buffer;
- yield-vault redemption limits;
- TWAB burn/observation state.

### What data is public

Withdrawal amount, receiver, owner, burned shares, token transfer, resulting balances, allowances, and events are public in ordinary V5. `maxWithdraw`, `maxRedeem`, and preview functions expose limits and conversions.

### What data must become private

If the bounty's privacy promise includes withdrawals, the withdrawal amount and encrypted balance must not be directly visible. The public chain will still reveal that an address interacted with the vault and may reveal timing and gas behavior.

### What calls it

The user or approved spender calls `withdraw` or `redeem`. The Prize Vault burns through `TwabERC20`, which calls the TWAB Controller, then calls the underlying yield vault's `redeem` path and transfers assets to the receiver.

### What mathematics it uses

- share/asset conversion with rounding direction;
- total assets versus total debt;
- yield-buffer safety;
- max redemption and withdrawal limits;
- latent-balance/dust accounting;
- time-weighted balance decrease in the TWAB Controller.

### What we would have to change

The confidential balance must be updated atomically with the underlying asset movement. If the underlying token transfer remains public, the UX must not claim full transfer confidentiality. The first implementation may use a confidential token or a wrapper with encrypted balance state, but it must prove that withdrawals cannot exceed the user's authorized encrypted balance and do not consume prize liquidity.

---

## Verified conclusions

1. V5's winner calculation is a per-user, per-tier, per-prize-index eligibility test, not a global random index lookup.
2. Historical TWAB is the central fairness mechanism for free deposits and withdrawals.
3. The public winner test consumes both user-specific and pool/vault-wide historical values.
4. The standard claim path reveals winner identity and payout through transaction data and events.
5. V5's tier and yield systems add substantial arithmetic and state beyond the core winner comparison.
6. A confidential adaptation can preserve the public draw transcript while hiding thresholds and eligibility, but the exact random-reduction strategy is an unresolved cryptographic design issue.

## Inferences

- A focused single-vault, fixed-tier adaptation is more realistic for the first confidential implementation than a literal encrypted port of all V5 components.
- The strongest first experiment should isolate the winner calculation, not begin with full yield liquidation or the complete tier system.
- The privacy boundary should include the user's weight and winning zone, not only the final payout, if “odds remain encrypted” is a real requirement.
- Delegation/sponsorship is part of V5 TWAB semantics but is probably an expansion boundary for the first confidential slice.

## Unknowns and next questions

- Which FHEVM numeric width and scale can safely represent the chosen balance and threshold?
- Can public randomness plus encrypted threshold produce an unbiased test without encrypted modulo/rejection sampling?
- Is the bounty's “verifiable onchain” requirement satisfied by protocol operation commitments and authorized decryption proofs, or does it expect a public final winner proof?
- Is a confidential asset already available on Sepolia for direct encrypted payout?
- What is the acceptable participant count and coprocessor latency for per-user eligibility checks?
- How should the system handle users who withdraw before a draw is finalized?

## Not included

This pass does not implement contracts, choose the final confidential architecture, or claim security audit status. The next artifact should be the Phase 2 primitive experiment defined in [`implementation-plan.md`](./implementation-plan.md), using the findings and unresolved questions above.

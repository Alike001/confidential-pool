import assert from "node:assert/strict";
import test from "node:test";

import { isWinner } from "../../src/reference/pool-model.mjs";
import { averageBalanceBetween, drawEpochWeights } from "../../src/reference/twab-epoch.mjs";

test("averages a balance over the draw interval instead of using the closing snapshot", () => {
  const average = averageBalanceBetween(
    [
      { time: 0, balance: 0 },
      { time: 90, balance: 100 },
    ],
    0,
    100,
  );

  assert.equal(average, 10n);
});

test("handles a mid-draw withdrawal using the balance held in each segment", () => {
  const average = averageBalanceBetween(
    [
      { time: 0, balance: 100 },
      { time: 40, balance: 20 },
    ],
    0,
    100,
  );

  assert.equal(average, 52n);
});

test("computes user and aggregate draw weights for the same interval", () => {
  const weights = drawEpochWeights({
    userEvents: [
      { time: 0, balance: 0 },
      { time: 20, balance: 100 },
    ],
    totalSupplyEvents: [
      { time: 0, balance: 0 },
      { time: 20, balance: 100 },
      { time: 70, balance: 200 },
    ],
    start: 0,
    end: 100,
  });

  assert.deepEqual(weights, { userTwab: 80n, totalSupplyTwab: 110n });
});

test("feeds the epoch average into the same V5 winner formula", () => {
  const weights = drawEpochWeights({
    userEvents: [
      { time: 0, balance: 0 },
      { time: 90, balance: 100 },
    ],
    totalSupplyEvents: [
      { time: 0, balance: 0 },
      { time: 90, balance: 100 },
    ],
    start: 0,
    end: 100,
  });

  assert.equal(weights.userTwab, 10n);
  assert.equal(weights.totalSupplyTwab, 10n);
  assert.equal(
    isWinner({
      userTwab: weights.userTwab,
      vaultTotalAverageSupply: weights.totalSupplyTwab,
      vaultContributionFraction: 500_000_000_000_000_000n,
      tierOdds: 1_000_000_000_000_000_000n,
      userSpecificRandomNumber: 14n,
      rerollRandoms: [],
    }),
    true,
  );
  assert.equal(
    isWinner({
      userTwab: weights.userTwab,
      vaultTotalAverageSupply: weights.totalSupplyTwab,
      vaultContributionFraction: 500_000_000_000_000_000n,
      tierOdds: 1_000_000_000_000_000_000n,
      userSpecificRandomNumber: 15n,
      rerollRandoms: [],
    }),
    false,
  );
});

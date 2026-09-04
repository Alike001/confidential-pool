import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PoolModel,
  SCALE,
  calculateWinningZone,
  isWinner,
  uniformRandomNumber,
} from '../../src/reference/pool-model.mjs';

const oddsOne = SCALE;
const fractionOne = SCALE;

test('reconstructs the V5 winning-zone fixed-point calculation', () => {
  assert.equal(
    calculateWinningZone({
      userTwab: 250n,
      tierOdds: SCALE / 2n,
      vaultContributionFraction: (SCALE * 8n) / 10n,
    }),
    100n,
  );
});

test('uses rejection sampling before modulo reduction', () => {
  const upperBound = 10n;
  const min = (2n ** 256n - upperBound) % upperBound;
  assert.equal(uniformRandomNumber(min - 1n, upperBound, [27n]), 7n);
});

test('preserves strict less-than and zero-supply behavior', () => {
  const base = {
    userTwab: 100n,
    vaultContributionFraction: fractionOne,
    tierOdds: oddsOne,
    vaultTotalAverageSupply: 1_000n,
  };
  assert.equal(isWinner({ ...base, userSpecificRandomNumber: 1_000n }), true);
  assert.equal(isWinner({ ...base, userSpecificRandomNumber: 1_100n }), false);
  assert.equal(
    isWinner({ ...base, vaultTotalAverageSupply: 0n, userSpecificRandomNumber: 0n }),
    false,
  );
});

test('keeps principal separate from yield-funded payouts', () => {
  const pool = new PoolModel();
  pool.deposit('alice', 1_000n);
  pool.addYield(50n);
  pool.openDraw({
    drawId: 1n,
    aggregateSupply: 1_000n,
    tierOdds: oddsOne,
    vaultContributionFraction: fractionOne,
  });

  const result = pool.requestClaim({
    account: 'alice',
    drawId: 1n,
    tier: 0,
    prizeIndex: 0,
    userTwab: 1_000n,
    userSpecificRandomNumber: 1_000n,
    prizeAmount: 50n,
  });

  assert.deepEqual(result, { winner: true, payout: 50n });
  assert.equal(pool.principalOf('alice'), 1_000n);
  assert.equal(pool.yieldReserve(), 0n);
  pool.withdraw('alice', 1_000n);
  assert.equal(pool.principalOf('alice'), 0n);
});

test('allows a non-winner request to complete without consuming yield', () => {
  const pool = new PoolModel();
  pool.deposit('alice', 1_000n);
  pool.addYield(20n);
  pool.openDraw({
    drawId: 1n,
    aggregateSupply: 1_000n,
    tierOdds: oddsOne,
    vaultContributionFraction: fractionOne,
  });

  const result = pool.requestClaim({
    account: 'alice',
    drawId: 1n,
    tier: 0,
    prizeIndex: 0,
    userTwab: 0n,
    userSpecificRandomNumber: 1_000n,
    prizeAmount: 20n,
  });

  assert.deepEqual(result, { winner: false, payout: 0n });
  assert.equal(pool.yieldReserve(), 20n);
});

test('rejects duplicate claims and over-withdrawal', () => {
  const pool = new PoolModel();
  pool.deposit('alice', 1_000n);
  pool.addYield(10n);
  pool.openDraw({
    drawId: 1n,
    aggregateSupply: 1_000n,
    tierOdds: oddsOne,
    vaultContributionFraction: fractionOne,
  });
  const claim = {
    account: 'alice',
    drawId: 1n,
    tier: 0,
    prizeIndex: 0,
    userTwab: 100n,
    userSpecificRandomNumber: 1_000n,
    prizeAmount: 10n,
  };
  pool.requestClaim(claim);
  assert.throws(() => pool.requestClaim(claim), /claim-exists/);
  assert.throws(() => pool.withdraw('alice', 1_001n), /principal-insufficient/);
});

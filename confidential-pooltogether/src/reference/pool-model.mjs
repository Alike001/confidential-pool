export const SCALE = 1_000_000_000_000_000_000n;
export const UINT256_MODULUS = 1n << 256n;

export function calculateWinningZone({ userTwab, vaultContributionFraction, tierOdds }) {
  if (userTwab < 0n || vaultContributionFraction < 0n || tierOdds < 0n) {
    throw new Error('negative-value');
  }

  const userTierWeight = (userTwab * tierOdds) / SCALE;
  return (userTierWeight * vaultContributionFraction) / SCALE;
}

export function uniformRandomNumber(initialRandom, upperBound, rerollRandoms = []) {
  if (upperBound <= 0n) throw new Error('upper-bound-zero');
  if (initialRandom < 0n || initialRandom >= UINT256_MODULUS) throw new Error('random-out-of-range');

  const min = (UINT256_MODULUS - upperBound) % upperBound;
  let random = initialRandom;
  let rerollIndex = 0;
  while (random < min) {
    if (rerollIndex >= rerollRandoms.length) throw new Error('missing-rejection-sample');
    random = rerollRandoms[rerollIndex++];
    if (random < 0n || random >= UINT256_MODULUS) throw new Error('random-out-of-range');
  }
  return random % upperBound;
}

export function isWinner({
  userTwab,
  vaultTotalAverageSupply,
  vaultContributionFraction,
  tierOdds,
  userSpecificRandomNumber,
  rerollRandoms,
}) {
  if (vaultTotalAverageSupply === 0n) return false;

  const reducedRandom = uniformRandomNumber(
    userSpecificRandomNumber,
    vaultTotalAverageSupply,
    rerollRandoms,
  );
  const winningZone = calculateWinningZone({
    userTwab,
    vaultContributionFraction,
    tierOdds,
  });
  return reducedRandom < winningZone;
}

export class PoolModel {
  #principal = new Map();
  #draws = new Map();
  #claims = new Set();
  #yieldReserve = 0n;

  deposit(account, amount) {
    this.#requirePositive(amount);
    this.#principal.set(account, this.principalOf(account) + amount);
  }

  withdraw(account, amount) {
    this.#requirePositive(amount);
    const current = this.principalOf(account);
    if (amount > current) throw new Error('principal-insufficient');
    this.#principal.set(account, current - amount);
  }

  addYield(amount) {
    this.#requirePositive(amount);
    this.#yieldReserve += amount;
  }

  principalOf(account) {
    return this.#principal.get(account) ?? 0n;
  }

  totalPrincipal() {
    let total = 0n;
    for (const amount of this.#principal.values()) total += amount;
    return total;
  }

  yieldReserve() {
    return this.#yieldReserve;
  }

  openDraw(snapshot) {
    if (snapshot.drawId <= 0n) throw new Error('draw-id-invalid');
    if (snapshot.aggregateSupply < 0n) throw new Error('aggregate-invalid');
    if (this.#draws.has(snapshot.drawId)) throw new Error('draw-exists');
    this.#draws.set(snapshot.drawId, Object.freeze({ ...snapshot }));
  }

  requestClaim({
    account,
    drawId,
    tier,
    prizeIndex,
    userTwab,
    tierOdds,
    vaultContributionFraction,
    userSpecificRandomNumber,
    rerollRandoms,
    prizeAmount,
  }) {
    this.#requirePositive(prizeAmount);
    const claimKey = `${account}:${drawId}:${tier}:${prizeIndex}`;
    if (this.#claims.has(claimKey)) throw new Error('claim-exists');

    const draw = this.#draws.get(drawId);
    if (!draw) throw new Error('draw-not-found');
    const winner = isWinner({
      userTwab,
      vaultTotalAverageSupply: draw.aggregateSupply,
      vaultContributionFraction: vaultContributionFraction ?? draw.vaultContributionFraction,
      tierOdds: tierOdds ?? draw.tierOdds,
      userSpecificRandomNumber,
      rerollRandoms,
    });

    this.#claims.add(claimKey);
    if (!winner) return { winner: false, payout: 0n };
    if (prizeAmount > this.#yieldReserve) throw new Error('yield-insufficient');

    this.#yieldReserve -= prizeAmount;
    return { winner: true, payout: prizeAmount };
  }

  #requirePositive(amount) {
    if (amount <= 0n) throw new Error('amount-zero');
  }
}

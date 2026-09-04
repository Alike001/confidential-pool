/**
 * Small reference model for the draw-epoch adaptation.
 *
 * Each event changes the balance from its timestamp onward. The model assumes
 * the draw boundaries are already finalized and aligned; period snapping is a
 * separate V5 concern documented in zama-context/08-bounty-pooltogether.
 */
export function averageBalanceBetween(events, start, end) {
  if (end < start) throw new Error("invalid-time-range");
  if (end === start) return 0n;

  const ordered = [...events].sort((a, b) => a.time - b.time);
  let balance = 0n;
  let cursor = start;
  let integral = 0n;

  for (const event of ordered) {
    if (event.time <= start) {
      balance = BigInt(event.balance);
      continue;
    }
    if (event.time >= end) break;
    integral += balance * BigInt(event.time - cursor);
    cursor = event.time;
    balance = BigInt(event.balance);
  }

  integral += balance * BigInt(end - cursor);
  return integral / BigInt(end - start);
}

export function drawEpochWeights({ userEvents, totalSupplyEvents, start, end }) {
  return {
    userTwab: averageBalanceBetween(userEvents, start, end),
    totalSupplyTwab: averageBalanceBetween(totalSupplyEvents, start, end),
  };
}

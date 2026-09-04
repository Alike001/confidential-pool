# Scaling gaps for confidential prize savings

## Challenge question

Can winner selection remain affordable as the number of participants and historical balance updates grows?

## Likely pressure points

- one encrypted state update per deposit or withdrawal;
- historical weight/TWAB maintenance;
- encrypted arithmetic and comparisons per participant;
- encrypted random-number reduction;
- dependency chains through the coprocessor;
- decryption or claim requests near draw time;
- frontend polling and relayer throughput.

## Architectural choices to measure

- evaluate every participant versus evaluate only the caller's eligibility;
- maintain encrypted history versus use a bounded draw snapshot;
- one winner versus multiple winners/tiered prizes;
- direct encrypted payout versus encrypted claim balance;
- onchain participant registry versus application-assisted discovery.

## Evidence observed

The Zama coprocessor research identifies worker pools, dependency scheduling, queues, caches, metrics, and retries. PoolTogether's V5 claim flow also expects external claimers to search accounts and batch claims. Confidentiality changes that operational model, so the current public approach cannot be copied blindly.

## Questions

- What is the measured latency for one encrypted winner test?
- What is the maximum practical participant count for a draw?
- Can participant-specific checks be parallelized?
- Which operations dominate cost: multiplication, comparison, selection, decryption, or proof handling?
- Can a failed computation be retried without changing the draw result?

# Threat model

## Assets to protect

- each user's deposit amount and current balance;
- historical balance or TWAB used to determine odds;
- total pool weight if it would reveal individual odds;
- winner status before the user chooses to disclose it;
- prize amount before authorized decryption or transfer;
- principal redemption rights;
- draw randomness and its relation to a specific draw;
- one-time claim state.

## Actors

- **Depositor:** wants principal access and private odds/prizes.
- **Non-winner:** should not learn other users' balances or prize amounts.
- **Claimer:** may submit or batch claims, but should not gain unauthorized plaintext access.
- **Draw participant:** triggers randomness or draw completion and may receive an incentive.
- **Vault/yield operator:** interacts with the yield source and may be an economic or availability dependency.
- **Relayer/KMS/coprocessor operator:** processes encrypted data and decryption requests; should not be treated as a trusted plaintext oracle without protocol evidence.
- **Contract owner/admin:** may configure components; privileged actions must be identified explicitly.
- **Observer/MEV actor:** sees public transactions, addresses, timing, gas, events, and any deliberately revealed values.

## Threats to test

### Privacy leakage

- deposit and withdrawal amounts visible in transaction calldata or token transfers;
- public events that expose encrypted values indirectly through sizes, timing, or claim status;
- a user-specific eligibility call that reveals participation or result through reverts or gas patterns;
- repeated queries that let an observer infer a balance threshold;
- public decryption of a result that allows reverse-engineering of hidden inputs.

### Fairness manipulation

- draw randomness selected or delayed by a privileged actor;
- an operator choosing which encrypted participants are included;
- replaying an old ciphertext or input proof in a new draw;
- changing tier/weight parameters after deposits but before the draw;
- using biased modulo/reduction for random selection;
- allowing a second claim for the same winner and draw.

### Principal safety

- paying prizes from principal rather than yield;
- a loss or insolvency in the underlying yield source;
- withdrawal limits that are not reflected in the user experience;
- rounding or fixed-point errors in the confidential accounting path;
- an encrypted state update that is not authorized by the correct caller.

### Availability and liveness

- no one starts or finishes a draw;
- decryption service or coprocessor delay blocks a claim;
- a failed RNG request stalls the draw;
- encrypted operations exceed gas or coprocessor capacity;
- a user cannot prove or retrieve their private result.

## Threat-model assumptions to state explicitly

- whether Sepolia yield is real, simulated, or supplied by a controlled adapter;
- whether the KMS/coprocessor is assumed honest-but-curious, cryptographically verifiable, or trusted for availability;
- whether a public winner announcement is acceptable;
- whether deposits use a confidential token from the start or a public token wrapped into confidential accounting;
- whether the first version supports a bounded participant count.

## Security posture

This is a design checklist, not a security audit. The bounty itself emphasizes production quality and possible later auditing, so every simplification must be labeled as a demo boundary rather than silently presented as a production guarantee.

## Current verification evidence

- A complete one-user Sepolia lifecycle proves encrypted deposit, fixed-epoch TWAB, post-epoch Chainlink randomness, encrypted winner evaluation, winner-only payout decryption, confidential prize settlement, and full principal withdrawal.
- A deterministic local two-user test gives Alice TWAB `400`, Bob TWAB `300`, and aggregate `700`. From the same pre-claim snapshot, both claim transactions use identical calldata, consume `676600` gas, and emit identical application-level log structures; authorized decryption returns payout `60` for Alice and `0` for Bob.
- Bob cannot decrypt Alice's payout handle. The reserve falls only by Alice's winning payout, from `100` to `40`.
- These checks remove a direct revert/result oracle and show no local gas delta in this vector. They do not prove that sender identity, timing, claim participation, event correlation, future state combinations, or relayer behavior is side-channel free.
- The two-user case is local, not live Sepolia evidence. More participant counts, deposit timings, repeated draws, claim ordering, underfunding, and adversarial parameter combinations remain to be tested.

## Sources

- [PoolTogether Prize Vault reference](https://dev.pooltogether.com/protocol/reference/prize-vault/prizevault/)
- [Zama protocol architecture](../02-protocol/architecture.md)
- [Zama ACL notes](../02-protocol/acl.md)
- [Zama lifecycle notes](../02-protocol/lifecycle.md)

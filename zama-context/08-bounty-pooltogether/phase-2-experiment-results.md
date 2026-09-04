# Reality Research: Phase 2 preliminary experiment results

## Scope

This is the first mathematical comparison of the three candidate winner-selection paths against the V5 baseline. It is not an FHEVM runtime benchmark and does not select the build architecture.

## Baseline used

For a user, vault, tier, and prize index:

```text
P = keccak256(drawId, vault, user, tier, drawRandomNumber)
Q = unbiasedUniform(P, S)
W = floor₁₈(floor₁₈(U × o) × f)
winner = (S > 0) AND (Q < W)
```

Where:

```text
U = userTwab
S = vaultTotalAverageSupply
o = tierOdds
f = vaultContributionFraction
```

The full reconstruction is in [`phase-2a-iswinner-baseline.md`](./phase-2a-iswinner-baseline.md).

## Mathematical finding 1: Candidate A can preserve V5 exactly

Candidate A keeps `S` public, computes the V5 reduction in cleartext, and moves the threshold calculation/comparison into FHE:

```text
Q = public unbiasedUniform(P, S)
W = encrypted floor₁₈(floor₁₈(U × o) × f)
winner = encrypted(Q < W)
```

If the encrypted arithmetic reproduces V5's fixed-point truncation, this preserves the V5 probability exactly. Its weakness is privacy: `S`, public balance activity, and public claim behavior remain possible side channels.

Preliminary status: **probability pass; privacy conditional; isolated cost measured**.

## Mathematical finding 2: Candidate B introduces bounded rounding error

Let `M = 2ᵏ` be a fixed power-of-two random domain. If the encrypted threshold is:

```text
T = floor(M × W / S)
```

then:

```text
Pr[win] = T / M
```

The absolute probability error is less than `1 / M`, but it is usually nonzero unless `M × W` is divisible by `S`.

Representative floor-threshold results:

| `S` | `W` | V5 `W/S` | `M` | Candidate B `T/M` | Error |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 100 | 0.100000000000 | 256 | 0.097656250000 | -0.002343750000 |
| 1,000 | 100 | 0.100000000000 | 65,536 | 0.099990844727 | -0.000009155273 |
| 3 | 1 | 0.333333333333 | 256 | 0.332031250000 | -0.001302083333 |
| 7 | 1 | 0.142857142857 | 256 | 0.140625000000 | -0.002232142857 |
| 7 | 1 | 0.142857142857 | 65,536 | 0.142852783203 | -0.000004359654 |
| 1,000,000 | 123,456 | 0.123456000000 | 256 | 0.121093750000 | -0.002362250000 |

Increasing `M` reduces approximation error. However, if `S` is encrypted, computing `M × W / S` still needs division by an encrypted denominator. Current FHEVM documentation states that encrypted division and remainder require a plaintext divisor. [Zama encrypted types and operations](https://docs.zama.org/protocol/solidity-guides/smart-contract/types)

Preliminary status: **bounded-bias result; private denominator expressible only through an expensive chunked circuit; isolated random/compare cost measured**.

The pinned FHEVM checkout also confirms that `FHE.randEuint128(upperBound)` can produce an encrypted fixed-domain sample in a transaction, and the focused harness observed samples below the requested power-of-two bound while keeping the winner bit user-authorized. This validates the primitive mechanically, not its production randomness provenance or the bounty's public-verifiability requirement. The dedicated test is [`Phase2WinnerPrimitive.ts`](../fhevm/library-solidity/test/phase2/Phase2WinnerPrimitive.ts).

## Mathematical finding 3: Candidate C is the hardest path

V5's exact reduction needs:

```text
Q = unbiasedUniform(P, S)
```

where `S` may be confidential. A direct encrypted translation needs either:

- encrypted modulo/remainder;
- encrypted division to implement quotient/remainder logic;
- a fixed-bounded rejection circuit;
- or a different probability construction.

The current FHEVM operation model does not provide arbitrary encrypted-divisor `div`/`rem`, and an FHE loop cannot terminate based on an encrypted condition. A fixed maximum loop with encrypted selection is possible in principle, but its correctness and cost must be measured. [Zama branching guidance](https://docs.zama.org/protocol/solidity-guides/smart-contract/logics/loop)

Preliminary status: **exactness goal; construction unresolved; highest research risk**.

## Privacy comparison

| Candidate | Public aggregate `S` | User weight `U` | Winner bit | Main leakage |
|---|---|---|---|---|
| A | Yes | Encrypted | Encrypted/user-only | Aggregate and activity metadata |
| B | Maybe | Encrypted | Encrypted/user-only | If `S` public, same aggregate leakage; if hidden, encrypted division problem |
| C | Goal is no | Encrypted | Encrypted/user-only | Depends on redesigned transcript and access pattern |

Even with encrypted `U`, all candidates must prevent plaintext deposit/withdrawal amounts and repeated public winner queries from becoming substitute balance or outcome channels.

## Current conclusion

The alternatives do not have equal status:

1. Candidate A is the only path that can clearly preserve the V5 probability model with a small FHE boundary, but it accepts aggregate-supply leakage.
2. Candidate B trades exact V5 equivalence for controllable rounding. A private denominator is expressible with fixed-round encrypted long division, but the tested approach requires multiple transactions even in a small `euint16` domain and is not yet suitable for full-width V5 state.
3. Candidate C is the only path that aims to hide `S` while preserving exact reduction, but it requires the most new cryptographic and circuit work.

No candidate is selected. The primitive boundary has now been tested in isolation. The next decision work is to validate wider numeric vectors, model privacy leakage under repeated draws, and determine whether the measured cost remains practical when embedded in the actual claim path.

## Runtime harness result

A research-only harness was added to the local FHEVM test workspace:

- [`Phase2WinnerPrimitive.sol`](../../fhevm/library-solidity/examples/Phase2WinnerPrimitive.sol)
- [`Phase2WinnerPrimitive.ts`](../../fhevm/library-solidity/test/phase2/Phase2WinnerPrimitive.ts)

The local FHEVM host stack compiled and deployed successfully. The focused test run passed **6 tests**:

- encrypted `euint128` input accepted through `FHE.fromExternal` and the input proof path;
- V5-style arithmetic produced `W = 100` for `U = 250`, `o = 0.5`, and `f = 0.8`;
- public reduced random values `99` and `100` confirmed strict `<` behavior;
- the intermediate winning zone was not user-decryptable, while Alice's winner bit was decryptable and Bob's was rejected;
- fixed-domain `FHE.randEuint128(1024)` stayed below its bound;
- non-power-of-two bound `1000` reverted.
- fixed-domain probability rounding was quantified against the V5 baseline;
- isolated HCU and native-gas signals were captured for Candidates A and B.

The latest local measurements were:

| Path | Global HCU | Maximum HCU depth | Native gas |
|---|---:|---:|---:|
| Candidate A: two encrypted multiplies, two encrypted divisions, and encrypted less-than | 4,057,032 | 4,057,000 | 350,173 |
| Candidate B: encrypted bounded random and encrypted less-than | 174,000 | 174,000 | 220,451 |

These are measurements of the research harness on the local FHEVM executor, not Sepolia estimates. Candidate A's cost is dominated by encrypted fixed-point arithmetic; Candidate B is much cheaper at this primitive boundary, but it does not yet solve the conversion from `W/S` when `S` is private.

The run command was:

```text
set -a; source .env.example; set +a; npm test -- --grep '^Phase2WinnerPrimitive'
```

The upstream FHEVM randomness suite also passed **15 tests** in the same local host setup. This validates the harness environment and primitive calls; it does not yet benchmark the full V5 random reduction or Candidate C.

The current test workspace uses the pinned local FHEVM checkout and its test-only host stack. It is not part of the future application dependency graph.

## Accounting and claim-surface result

A second research-only harness tests encrypted accounting around the winner result:

- [`Phase2AccountingClaimPrimitive.sol`](../../fhevm/library-solidity/examples/Phase2AccountingClaimPrimitive.sol)
- [`Phase2AccountingClaimPrimitive.ts`](../../fhevm/library-solidity/test/phase2/Phase2AccountingClaimPrimitive.ts)

The focused run passed **3 tests**:

- an encrypted deposit updated Alice's encrypted balance while the event contained only her address;
- an encrypted withdrawal request reduced the encrypted balance and stored the accepted amount without a plaintext amount event;
- winner and non-winner claim calls both completed successfully, with an encrypted payout result that only the relevant user could decrypt.

The local cost signals were:

| Operation | Global HCU | Maximum HCU depth | Native gas |
|---|---:|---:|---:|
| Encrypted deposit | 259,032 | 259,032 | ~247,500 |
| Encrypted withdrawal accounting | 535,032 | 535,000 | ~342,000 |
| Encrypted winner claim | 272,064 | 272,032 | ~280,800 |
| Encrypted non-winner claim | 272,096 | 272,032 | ~289,200 |

The winner and non-winner calls had almost identical HCU, but native gas differed by roughly 8,400 gas in the observed run. This means the non-reverting encrypted claim pattern is promising for reducing an obvious winner oracle, but it is not evidence that timing, gas, calldata size, or transaction correlation are side-channel free.

## Private-denominator result

A third research-only harness tests fixed-round encrypted long division:

- [`Phase2PrivateDenominatorPrimitive.sol`](../../fhevm/library-solidity/examples/Phase2PrivateDenominatorPrimitive.sol)
- [`Phase2PrivateDenominatorPrimitive.ts`](../../fhevm/library-solidity/test/phase2/Phase2PrivateDenominatorPrimitive.ts)

The harness computes exact floor division with an encrypted denominator in a bounded `euint16` domain. A single 16-round transaction exceeded the local HCU depth limit. Splitting the work into four rounds per continuation transaction completed successfully:

| Measurement | Result |
|---|---:|
| Final four-round chunk HCU | 3,688,256 |
| Final four-round chunk maximum depth | 2,013,000 |
| Transactions for one 16-bit quotient | 5, including initialization |
| Correctness vectors | `25,600/1,000`, `25,599/1,000`, `341/3`, `65,534/32,767` |

This proves that private denominator arithmetic is expressible, but the tested solution is multi-transaction and bounded-width. A full-width V5 implementation would require a substantially larger circuit or more chunks, so this is not the smallest viable bounty path.

## Interpretation and remaining experiments

The runtime result narrows the design space:

1. Candidate A is technically straightforward and probability-exact when the reduced random sample and `S` remain public. Its cost is high enough that the full claim path must avoid repeating the threshold arithmetic for every internal step.
2. Candidate B has a substantially smaller primitive cost and fits the current bounded-random API, but its probability is `floor(M × W / S) / M`, not exactly `W/S`. At `M = 1024`, the example `W/S = 100/1000` becomes `102/1024 = 0.099609375`.
3. Candidate C still has no implementation result. It should not be treated as available merely because a fixed-round FHE circuit could be sketched.

The next experiments are therefore:

- enumerate a larger set of `(S, W, M)` vectors and set an explicit acceptable bias bound;
- model information gained from public deposits, withdrawals, claims, and repeated winner outcomes;
- measure the full candidate threshold path with encrypted state rather than only the isolated primitive;
- treat a public or protocol-supplied denominator as the minimal viable path, while keeping chunked private division as a bounded research comparison;
- keep Candidate C as a bounded research track until an exact or formally bounded construction exists.

## Not included

- No production contract.
- No final privacy claim.
- No production Sepolia gas/HCU estimate.
- No full-pool statistical test with live FHE randomness yet; the harness only checks bounds and the arithmetic probability model.

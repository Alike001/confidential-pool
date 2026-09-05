# Rolling-Epoch Cost Envelope

## Result

The recurring pool stays below Zama's documented devnet limits of 20,000,000 total HCU and 5,000,000 HCU depth per transaction. These are local mocked-coprocessor measurements, not Sepolia receipts.

The first one-transaction claim reached `4,682,000` HCU depth. Splitting it into two confidential transactions provides enough production margin. The winning-zone implementation originally used the library's widened `FHE.mulDiv`, but live Sepolia tracing proved that the current executor implementation does not expose its `fheMulDiv` selector. The compatibility-fixed implementation uses supported `euint128` scalar multiplication and plaintext division while preserving both sequential fixed-point floors:

1. `prepareClaim` computes and stores the encrypted winner-dependent candidate payout.
2. `claimPrize` checks the encrypted reserve and confidentially transfers the resulting payout.

This preserves the two sequential fixed-point floors used by the V5-style winning-zone calculation. It does not reveal whether the candidate is zero.

## Measured transcript

| Action | Native gas | Total HCU | HCU depth | Depth-limit use |
|---|---:|---:|---:|---:|
| Deposit | 1,093,622 | 1,791,288 | 732,000 | 14.6% |
| Fund controlled yield | 884,935 | 1,435,160 | 732,000 | 14.6% |
| Partial withdrawal | 859,175 | 3,233,224 | 955,000 | 19.1% |
| Finalize user TWAB | 233,154 | 2,180,000 | 2,180,000 | 43.6% |
| Advance epoch | 248,263 | 2,180,000 | 2,180,000 | 43.6% |
| Request aggregate decryption | 75,960 | 0 | 0 | 0% |
| Finalize KMS aggregate | 121,836 | 0 | 0 | 0% |
| Commit draw | 317,898 | 0 | 0 | 0% |
| Finalize draw | 64,807 | 0 | 0 | 0% |
| Prepare encrypted claim | 276,398 | 4,043,096 | 4,043,032 | 80.9% |
| Settle encrypted claim | 552,854 | 894,064 | 570,000 | 11.4% |

The highest depth is now `4,043,032`, leaving `956,968` HCU of depth headroom. Every measured total-HCU value is far below the 20,000,000 cap.

## Test evidence

The executable measurement is:

`zama-context/fhevm/library-solidity/test/phase2/ConfidentialPoolTogether.HCU.ts`

It runs one complete epoch transcript and fails if any transaction exceeds either documented limit. Together with the seven core and three adversarial tests, the recurring suite currently has 11 passing checks.

## Interpretation limits

- Native gas comes from the local Hardhat FHE host stack and must be remeasured on Sepolia.
- HCU prices and protocol limits can change. Re-run this test against the dependency versions used for the final release.
- `prepareClaim` is still the deepest operation. New FHE work must not be added to it without a new measurement.
- The two public transactions reveal that a wallet attempted a claim, but their success, calldata shape, application-log shape, and gas do not reveal winner versus non-winner.

Current HCU limit source: [Zama HCU documentation](https://docs.zama.org/protocol/solidity-guides/development-guide/hcu.md).

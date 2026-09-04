# Competitors and adjacent approaches: bounty lens

## Scope

Do not compare products by slogans. Compare the exact privacy job required by the bounty: encrypted deposit/weight data, a fair draw, authorized prize disclosure, and a usable EVM application.

## Baseline systems

### Public PoolTogether V5

This is the economic baseline, not a privacy competitor. It already solves vault accounting, TWAB-based weighting, prize liquidity, draw lifecycle, and claims, but the standard winner calculation can read public balances and historical weights.

### ZK-only design

ZK can prove that a hidden computation or eligibility statement is correct without revealing the witness. It may be useful for proving a private draw or a claim, but by itself it does not provide general encrypted state that a public Solidity contract can keep computing over.

### MPC-based design

MPC can jointly compute a draw or decryption without one party holding the whole secret. It may help with randomness or key management, but it introduces a participant/network coordination and availability model that must be compared with Zama's FHE Protocol.

### TEE-based design

A trusted execution environment can run the draw over plaintext inside protected hardware. It may be fast, but confidentiality and correctness depend more heavily on hardware, attestation, and operator assumptions.

### Private-chain or separate service design

A separate private execution environment can hide balances by default, but it changes composability and trust assumptions relative to an EVM contract that remains publicly settled onchain.

## Questions specific to this bounty

- Can the method support encrypted state updates after deposits and withdrawals?
- Can a user prove or learn only their own result?
- Can an observer verify randomness, inclusion, and no-double-claim behavior?
- What is the latency for a draw and a claim?
- What happens if the privacy service is unavailable?
- Can it target Sepolia with a polished EVM frontend?

## Current conclusion

The useful comparison is not “Zama versus ZK.” It is “which combination gives us private weighted eligibility, verifiable randomness, safe claim settlement, and acceptable UX?” Zama's FHE is the primary candidate for encrypted state and computation; ZK, MPC, or TEEs may appear as supporting mechanisms rather than direct substitutes.

## Sources

- [Zama Litepaper](https://docs.zama.org/protocol/zama-protocol-litepaper)
- [Zama Protocol documentation](https://docs.zama.org/protocol)
- [PoolTogether V5 design](https://dev.pooltogether.com/protocol/design/)
- [PoolTogether V5 Prize Pool](https://github.com/GenerationSoftware/pt-v5-prize-pool)

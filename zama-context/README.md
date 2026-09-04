# Zama context

This is the canonical research database for understanding Zama before choosing what to build.

## Research rule

We research from the bottom upward:

```text
Application
    ↑
FHEVM
    ↑
Zama Protocol
    ↑
Gateway · Coprocessor · KMS
    ↑
TFHE-rs and cryptography
```

Every page should separate:

- **Verified facts** — supported by source code, official documentation, or repository metadata.
- **Inferences** — interpretations grounded in those facts.
- **Unknowns** — questions requiring more code, measurements, deployment data, or external research.

Product selection stays deferred until the infrastructure and gaps are better understood.

## Map

- [`00-organization-overview.md`](./00-organization-overview.md)
- [`01-cryptography/`](./01-cryptography/)
- [`02-protocol/`](./02-protocol/)
- [`03-fhevm/`](./03-fhevm/)
- [`04-repositories/`](./04-repositories/)
- [`05-existing-ecosystem/`](./05-existing-ecosystem/)
- [`06-gaps/`](./06-gaps/)
- [`07-hackathon-opportunities/`](./07-hackathon-opportunities/)
- [`08-bounty-pooltogether/`](./08-bounty-pooltogether/)

The local [`fhevm/`](./fhevm/) checkout is a shallow clone pinned to commit `75eedbfe06ea6f009db5972a5e26910d00872484`, fetched on 2026-09-03.

The earlier notes are preserved in [`_legacy/`](./_legacy/); the pages above are now canonical.

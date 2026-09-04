# Relationship between FHE, ZK, MPC, and cryptography

## The short answer

All three are cryptography, but they solve different problems:

| Primitive | Question it answers | Zama usage |
|---|---|---|
| FHE | “Can we compute without opening the data?” | Main encrypted computation/state primitive |
| ZK | “Can we prove this claim without revealing the secret?” | Input validity and proof-of-knowledge checks |
| MPC | “Can several parties jointly control a secret?” | KMS key generation and threshold decryption |

## System relationship

```text
User encrypts input
        ↓
ZK proof checks input validity
        ↓
FHEVM represents encrypted operations as handles/events
        ↓
Coprocessors compute over ciphertexts
        ↓
MPC-based KMS authorizes threshold decryption
```

## Verified facts

The litepaper explicitly presents Zama as combining FHE, ZK, and MPC to address different limitations of confidentiality systems. The code reflects this split: `zkproof-worker` handles proof work, `tfhe-worker` handles FHE execution, and KMS/KMS Connector handle key/decryption workflows.

## Inference

Calling Zama “a ZK project” is incomplete. A more accurate description is: **Zama is an FHE-based confidential-computation stack that uses ZK and MPC as supporting security components.**

## Unknowns

The exact boundaries between cryptographic verification, coprocessor signatures, KMS signatures, and on-chain consensus require a full end-to-end trace of one request.

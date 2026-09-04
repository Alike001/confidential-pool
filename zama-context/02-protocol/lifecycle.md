# Confidential request lifecycle

## Scope

Build a code-grounded lifecycle model before choosing an application.

## Current observed lifecycle

```text
Client encrypts input
  → host contract calls FHEVM/InputVerifier
  → host chain emits FHE or VerifyInput event
  → host-listener persists FHE work, or Gateway listener persists proof request
  → zkproof-worker / tfhe-worker processes database work
  → coprocessor transaction-sender submits signed result
  → Gateway reaches response consensus
  → ciphertext material is committed or decryption is requested
  → KMS Connector validates ACL/context and calls KMS Core
  → response is submitted to Gateway/Ethereum
  → authorized client decrypts result
```

## Verified facts

- `FHEVMExecutor` creates result handles and emits FHE operation events.
- `InputVerification.verifyProofRequest` emits proof requests and charges protocol fees.
- `CiphertextCommits.addCiphertextMaterial` stores ciphertext metadata after coprocessor consensus.
- `Decryption.publicDecryptionRequest` retrieves committed materials, pins context, charges a fee, and emits a request.
- KMS Connector uses GatewayListener → Postgres → KmsWorker → KMS Core → TransactionSender.

## Unknowns

The exact event ordering and storage path for a complete current confidential token transfer is not yet traced transaction-by-transaction.

# Gateway

## Verified facts

Gateway functionality is split across `InputVerification`, `Decryption`, `CiphertextCommits`, `GatewayConfig`, `ProtocolPayment`, and historical/view-only KMS-generation contracts.

`InputVerification` records a proof request, charges the sender, accepts responses from registered coprocessor transaction senders, groups matching responses by digest, and marks a request verified after the configured threshold.

`Decryption` handles public and user decryption requests. It stores requested handles, checks ciphertext conformance/material, pins KMS context IDs, validates KMS signatures, and reaches consensus over matching public results or user decryption shares.

`CiphertextCommits` collects ciphertext handle/key/digest metadata from coprocessors and finalizes material only after coprocessor majority consensus.

## Evidence

- `gateway-contracts/contracts/InputVerification.sol:184-292`
- `gateway-contracts/contracts/Decryption.sol:332-458`
- `gateway-contracts/contracts/CiphertextCommits.sol:123-190`

## Transitional evidence

`KMSGeneration.sol` describes itself as view-only on the Gateway side because current KMS generation lives on Ethereum, while legacy state remains queryable: `gateway-contracts/contracts/KMSGeneration.sol:12-18`, `107-123`.

## Unknowns

- Current deployed contract versions and thresholds by chain.
- Exact Gateway chain role in each production flow.
- Whether all compatibility/legacy branches remain necessary.

# Confidential asset settlement

## Current conclusion

The payout boundary should target ERC-7984 confidential fungible tokens. The pool should hold the prize asset and transfer an encrypted payout handle to the winner's address. The transfer must not decrypt the payout into a public ERC-20 amount.

This is an interface decision, not yet a live-token integration. The current official Zama testnet registry lists a Sepolia `cUSDTMock` wrapper, not a production `cUSDT` deployment:

```text
chain:   Ethereum Sepolia (11155111)
symbol:  cUSDTMock
address: 0x4E7B06D78965594eB5EF5414c357ca21E1554491
underlying USDT mock: 0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0
decimals: 6
```

This mock is suitable for a testnet integration experiment only. We must not describe it as production cUSDT or assume it is the same token used for bounty reward distribution.

On 2026-09-04, direct Sepolia RPC reads confirmed the wrapper metadata above, `supportsInterface(0x4958f2a4) == true`, and a valid registry association to the same underlying mock USDT. The handle-only call is the path the pool settlement adapter needs.

This is still read-only evidence. We have not sent a live encrypted transfer, because that requires a funded wallet, a real user-bound ciphertext, and the corresponding relayer/proof flow.

## Relevant ERC-7984 operations

The current documented interface exposes:

```solidity
function confidentialTransfer(
    address to,
    externalEuint64 encryptedAmount,
    bytes inputProof
) external returns (euint64 transferred);

function confidentialTransfer(address to, euint64 amount)
    external returns (euint64 transferred);

function confidentialTransferFrom(
    address from,
    address to,
    externalEuint64 encryptedAmount,
    bytes inputProof
) external returns (euint64 transferred);
```

The proof-bearing overload is for a freshly encrypted input. The handle-only overload is for a ciphertext already authorized for the token contract. That second form is the important one for a winner payout produced inside the pool contract.

## Proposed deposit and claim settlement

Deposits and payouts use different directions:

```text
user encrypts amount for token contract
        ↓
user calls token.confidentialTransferAndCall(pool, encryptedAmount, proof, data)
        ↓
token moves the encrypted amount and calls the pool receiver
        ↓
pool records the encrypted amount received as the user's principal
```

For prizes and withdrawals, the pool is the sender:

```text
pool computes encrypted payout
        ↓
pool authorizes payout handle for token contract
        ↓
pool calls confidentialTransfer(winner, payoutHandle)
        ↓
token updates encrypted balances
        ↓
winner decrypts their confidential token balance
```

The pool must own enough confidential prize liquidity before the transfer. The token contract must be able to consume the payout handle under its ACL rules. The returned transferred handle should remain encrypted and may be retained for user-facing confirmation. A failed or under-funded confidential transfer must produce an encrypted zero/actual amount rather than a public amount-based revert where the token standard permits it.

## Accounting slice added locally

The first product-shaped slice now separates two encrypted concepts:

- user principal, recorded by the deposit callback against the depositor;
- prize reserve, funded by a designated yield provider through the confidential-token callback using a public message kind.

When a draw is opened, its encrypted prize amount is imported and stored once. A claim computes an encrypted candidate payout, then selects either that amount or zero when the encrypted reserve is insufficient. The reserve is reduced by the selected payout.

The claim transaction does not reveal the winner bit, prize amount, or whether the reserve was sufficient. The local mock proves the example: a 100-unit reserve pays a 77-unit winning prize and leaves an encrypted reserve of 23 units.

This is deliberately a bounded accounting model. It does not yet prove that the reserve came from a real yield strategy, maintain historical TWAB observations, support multiple prize tiers, or prevent a production draw operator from choosing an arbitrary encrypted prize. Those are separate gates for the next architecture pass.

## What stays public

- token and pool contract addresses;
- winner's recipient address, unless a separate stealth/relayer design is used;
- draw ID, tier, prize index, and claim transaction metadata;
- public aggregate denominator and draw transcript;
- whether the claim identity has already been consumed.

## What stays encrypted

- deposit amount and token balance;
- user-specific draw weight/TWAB;
- winner bit and payout amount;
- transferred amount returned by the confidential token.

The recipient address being public means this is financial-value confidentiality, not full address privacy.

## SDK flow

The Relayer SDK supports two separate client operations:

1. create encrypted inputs bound to the target contract and user, producing ciphertext handles plus an input proof;
2. user-decrypt authorized handles by signing an EIP-712 request and sending it through the relayer.

The frontend should therefore show encryption/transaction/decryption as separate pending states. It should not infer a winner from a public event or transaction revert.

## Sources

- [OpenZeppelin confidential-contract interfaces](https://docs.openzeppelin.com/confidential-contracts/api/interfaces)
- [OpenZeppelin confidential token documentation](https://docs.openzeppelin.com/confidential-contracts/token)
- [Zama Relayer SDK encrypted inputs](https://github.com/zama-ai/relayer-sdk/blob/main/docs/input.md)
- [Zama Relayer SDK user decryption](https://github.com/zama-ai/relayer-sdk/blob/main/docs/user-decryption.md)
- [Zama Protocol Registry testnet deployments](https://raw.githubusercontent.com/zama-ai/protocol-registry/main/testnet.json)

## Live wrapper verification result

The live target passed these checks:

```text
chainId:       11155111
code:          non-empty (170 bytes)
name:          Confidential USDT (Mock)
symbol:        cUSDTMock
decimals:      6
underlying:    0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0
ERC-7984:      supported
registry:      valid
```

The official ERC-7984 interface includes both proof-bearing and already-authorized ciphertext overloads for `confidentialTransfer` and `confidentialTransferAndCall`. Our local adapter must therefore use the proof-bearing callback path for user deposits and the handle-only path for pool-generated withdrawals/prizes. The callback receiver must also return the expected encrypted boolean according to the deployed implementation.

## Next gate

The local ERC-7984-shaped proof now passes in `ConfidentialPayoutTokenMock.sol` and `ConfidentialPoolTogetherSlice.ts`. It proves the deposit callback, encrypted yield funding, draw-scoped encrypted prize, ACL handoff, encrypted balance movement, winner payout, and withdrawal settlement shape, but the mock is not the full standard implementation.

Before a Sepolia deployment, test an end-to-end encrypted deposit and handle-only payout against `0x4E7B06D78965594eB5EF5414c357ca21E1554491`. Do not label this mock as production cUSDT.

# FHEVM Sepolia deployment handoff

## Status

The first FHEVM slice is now configured for canonical Zama host contracts. `ConfidentialPoolTogetherSlice` inherits `ZamaEthereumConfig`, so construction selects the Sepolia ACL, coprocessor, and KMS verifier from `block.chainid`. It no longer points at the local test host addresses.

The local FHEVM test remains green after this change: 9 focused tests pass.

The first FHEVM pool skeleton was deployed to Sepolia, but live integration found an ERC-7984 callback incompatibility in that bytecode:

```text
pool:          0xf692D572BE4e38858e9838A9accDBB2902b602Bf
deployment tx: 0x28d5f788a5a285a0d905215bec679c5d02fa9ef36658c84b9ab457b972a46f1f
deployer:      0xdE67A35B322e5A31e8215B5245CA4e48d7977F71
epoch:         1788516598 → 1788523198
```

Read-only verification confirmed non-empty pool bytecode, the expected payout-token address, the expected RNG-adapter address, the configured epoch boundaries, and confidential protocol ID `10001`. This address is now **superseded and must not receive another deposit**. It cannot be patched in place.

The setup transactions remain valid: mock USDT was minted, approved, and wrapped successfully. The resulting cUSDTMock balance is still held by the deployer wallet; setup must not be repeated merely because the pool must be redeployed.

## Live callback finding and fix

The legacy `@zama-fhe/relayer-sdk` endpoint returned `404` at `/v1/keyurl`, so the live script now uses `@zama-fhe/sdk` `3.5.1`. Current-SDK encryption and a confidential self-transfer both succeeded on Sepolia. A transfer-and-call to the old pool then failed with:

```text
ACLNotAllowed(bytes32,address)
account: 0x4E7B06D78965594eB5EF5414c357ca21E1554491
```

That isolated the defect to the receiver callback. ERC-7984 uses the callback's encrypted boolean inside the token contract to decide whether to refund the transfer. The pool returned an encrypted `true` without granting the token transient access to it. Both deposit and yield-funding callback paths now call `FHE.allowTransient(accepted, msg.sender)` before returning. The local payout-token mock also implements ERC-7984's callback/refund step, and the new regression test passes.

## Existing Sepolia dependencies

```text
chain:       Ethereum Sepolia (11155111)
payoutToken: 0x4E7B06D78965594eB5EF5414c357ca21E1554491  (cUSDTMock; testnet mock)
rngProvider: 0x2387Ac275b6ADa26959c587d93abFbd491A64D5A  (ChainlinkVrfRngAdapter)
coordinator: 0x9Ce976b5A46aC5d126e71bcDfdbBC7442d3489B5  (RngRequestCoordinator)
```

The pool must receive the adapter address, not the coordinator address, because the pool calls the V5-compatible `IRng` methods (`isRequestComplete`, `isRequestFailed`, and `randomNumber`) directly on the adapter.

## Required local environment

Create a local `.env` in `zama-context/fhevm/library-solidity/` or pass equivalent shell variables. Never commit it or share the private key.

```text
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# Fill this locally with 0x + 64 hexadecimal characters. Never share it.
SEPOLIA_PRIVATE_KEY=
POOL_PAYOUT_TOKEN_ADDRESS=0x4E7B06D78965594eB5EF5414c357ca21E1554491
POOL_RNG_PROVIDER_ADDRESS=0x2387Ac275b6ADa26959c587d93abFbd491A64D5A
POOL_EPOCH_START=
POOL_EPOCH_END=
```

Use an epoch far enough in the future to complete an encrypted deposit and yield-funding test. The script rejects every chain other than Sepolia.

## Dry run and broadcast boundary

Compile and inspect the deployment path:

```sh
npx hardhat compile --network sepolia
npx hardhat run scripts/deployConfidentialPoolTogetherSepolia.ts --network sepolia
```

The deployment script is dry-run by default. It validates the chain, addresses, epoch, wallet, and gas estimate without sending a transaction. After reviewing that output, explicitly broadcast with:

```sh
DEPLOY_BROADCAST=true npx hardhat run scripts/deployConfidentialPoolTogetherSepolia.ts --network sepolia
```

The broadcast command sends a transaction. Use it only after confirming the addresses, epoch, wallet, gas balance, and the fact that the payout token is explicitly the `cUSDTMock` testnet wrapper. It does not create a real yield strategy, fund the reserve, or prove the full PoolTogether V5 lifecycle.

## Redeploy the fixed pool

Set a fresh epoch with enough time for integration, then perform the dry run:

```sh
export POOL_EPOCH_START="$(( $(date +%s) + 300 ))"
export POOL_EPOCH_END="$(( POOL_EPOCH_START + 7200 ))"

npx hardhat compile --network sepolia
npx hardhat run scripts/deployConfidentialPoolTogetherSepolia.ts --network sepolia
```

After checking the deployer, token, RNG provider, epoch, and gas estimate, broadcast deliberately:

```sh
DEPLOY_BROADCAST=true \
npx hardhat run scripts/deployConfidentialPoolTogetherSepolia.ts --network sepolia
```

The deployment script signs locally and prints the deployment nonce, expected CREATE address, and precomputed transaction hash before broadcasting. If the RPC times out, do not immediately retry: first inspect that hash and address. This prevents an RPC response failure from causing an accidental duplicate deployment.

The first callback-fixed broadcast attempt timed out after gas estimation. Read-only recovery checks showed both latest and pending deployer nonce `31`, no transaction after nonce `30`, and no code at the deterministic nonce-31 address `0x363C1B7bFF57Af01466B4B2342655E5f270a9f62`. The transaction was therefore not accepted, and nonce `31` remains safe for one deliberate retry.

Record the new pool address and replace `POOL_ADDRESS` locally. Do not use `0xf692D572BE4e38858e9838A9accDBB2902b602Bf`; the live script rejects it explicitly.

## Deployment gates still open

- redeployment of the callback-fixed pool and a live encrypted deposit against the ERC-7984 wrapper;
- live encrypted yield funding and handle-only payout;
- relayer SDK user decryption on Sepolia;
- using a fresh RNG request for the deployed pool rather than the already-consumed smoke-test request;
- full draw/tier/claim lifecycle and repeated-claim behavior;
- metadata-leakage review and real yield adapter design.

## Live encrypted deposit script

The pinned FHEVM checkout includes `scripts/liveSepoliaDeposit.ts`. It uses the current Zama SDK Sepolia configuration to create an encrypted `euint64` amount bound to the cUSDTMock wrapper and the deployer wallet, then calls the wrapper's ERC-7984 callback transfer into the deployed pool.

The script has two independent write switches:

```text
SETUP_BROADCAST=true     mint underlying mock USDT, approve wrapper, and wrap cUSDTMock
DEPOSIT_BROADCAST=true   send the encrypted confidentialTransferAndCall transaction
```

Both default to `false`. The setup step is available because the official Sepolia registry documents the underlying mock USDT as publicly mintable, with a per-call limit of 1,000,000 tokens. The wrapper and pool still require real Sepolia gas.

Add these local values to the FHEVM checkout environment, or export them in the shell:

```text
POOL_ADDRESS=<new callback-fixed pool address>
POOL_PAYOUT_TOKEN_ADDRESS=0x4E7B06D78965594eB5EF5414c357ca21E1554491
POOL_UNDERLYING_TOKEN_ADDRESS=0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0
DEPOSIT_AMOUNT_UNITS=1000000
SETUP_AMOUNT_UNITS=1000000
```

`1000000` is one token unit at six decimals. Setup has already succeeded for the current deployer, so keep `SETUP_BROADCAST` false or unset. First run the deposit dry path:

```sh
npx hardhat run scripts/liveSepoliaDeposit.ts --network sepolia
```

If gas estimation succeeds against the new pool, run the encrypted deposit:

```sh
SETUP_BROADCAST=false \
DEPOSIT_BROADCAST=true \
npx hardhat run scripts/liveSepoliaDeposit.ts --network sepolia
```

If the deposit succeeds, the script reads the pool's encrypted balance handle and requests user decryption through the Sepolia Relayer. It never prints the private key or plaintext amount in transaction calldata. Do not enable both switches until the addresses and amount have been reviewed.

## Sources

- [FHEVM network configuration guide](https://github.com/zama-ai/fhevm/blob/main/docs/solidity-guides/configure.md)
- [FHEVM Sepolia deployment guide](https://github.com/zama-ai/fhevm/blob/main/docs/solidity-guides/hardhat/run_test.md)
- [Zama Sepolia configuration in this checkout](../fhevm/library-solidity/config/ZamaConfig.sol)
- [Live RNG deployment record](./sepolia-rng-deployment.md)
- [Zama Sepolia address registry](https://github.com/zama-ai/protocol-apps/blob/main/docs/addresses/testnet/sepolia.md)
- [Current Zama SDK](https://github.com/zama-ai/sdk)
- [Official ERC-7984 receiver ACL example](https://github.com/zama-ai/protocol-apps/blob/main/contracts/confidential-wrapper/contracts/mocks/ERC7984ReceiverMock.sol)
- [Official ERC-7984 transfer-and-call implementation](https://github.com/zama-ai/protocol-apps/blob/main/contracts/confidential-wrapper/contracts/token/ERC7984Upgradeable.sol)
- [OpenZeppelin ERC-7984 wrapper API](https://docs.openzeppelin.com/confidential-contracts/api/token)

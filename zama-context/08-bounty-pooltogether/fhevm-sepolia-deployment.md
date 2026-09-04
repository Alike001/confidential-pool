# FHEVM Sepolia deployment handoff

## Status

The first FHEVM slice is now configured for canonical Zama host contracts. `ConfidentialPoolTogetherSlice` inherits `ZamaEthereumConfig`, so construction selects the Sepolia ACL, coprocessor, and KMS verifier from `block.chainid`. It no longer points at the local test host addresses.

The local FHEVM test remains green after this change: 8 focused tests pass.

The first FHEVM pool skeleton has now been deployed to Sepolia:

```text
pool:          0xf692D572BE4e38858e9838A9accDBB2902b602Bf
deployment tx: 0x28d5f788a5a285a0d905215bec679c5d02fa9ef36658c84b9ab457b972a46f1f
deployer:      0xdE67A35B322e5A31e8215B5245CA4e48d7977F71
epoch:         1788516598 → 1788523198
```

Read-only verification confirmed non-empty pool bytecode, the expected payout-token address, the expected RNG-adapter address, the configured epoch boundaries, and confidential protocol ID `10001`.

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

## Deployment gates still open

- live encrypted deposit against the deployed ERC-7984 wrapper;
- live encrypted yield funding and handle-only payout;
- relayer SDK user decryption on Sepolia;
- using a fresh RNG request for the deployed pool rather than the already-consumed smoke-test request;
- full draw/tier/claim lifecycle and repeated-claim behavior;
- metadata-leakage review and real yield adapter design.

## Sources

- [FHEVM network configuration guide](https://github.com/zama-ai/fhevm/blob/main/docs/solidity-guides/configure.md)
- [FHEVM Sepolia deployment guide](https://github.com/zama-ai/fhevm/blob/main/docs/solidity-guides/hardhat/run_test.md)
- [Zama Sepolia configuration in this checkout](../fhevm/library-solidity/config/ZamaConfig.sol)
- [Live RNG deployment record](./sepolia-rng-deployment.md)

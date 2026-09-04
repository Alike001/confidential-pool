# FHEVM Sepolia deployment handoff

## Status

The first FHEVM slice is now configured for canonical Zama host contracts. `ConfidentialPoolTogetherSlice` inherits `ZamaEthereumConfig`, so construction selects the Sepolia ACL, coprocessor, and KMS verifier from `block.chainid`. It no longer points at the local test host addresses.

The local FHEVM test remains green after the callback, arithmetic, and withdrawal changes: 11 focused tests pass.

The first FHEVM pool skeleton was deployed to Sepolia, but live integration found an ERC-7984 callback incompatibility in that bytecode:

```text
pool:          0xf692D572BE4e38858e9838A9accDBB2902b602Bf
deployment tx: 0x28d5f788a5a285a0d905215bec679c5d02fa9ef36658c84b9ab457b972a46f1f
deployer:      0xdE67A35B322e5A31e8215B5245CA4e48d7977F71
epoch:         1788516598 → 1788523198
```

Read-only verification confirmed non-empty pool bytecode, the expected payout-token address, the expected RNG-adapter address, the configured epoch boundaries, and confidential protocol ID `10001`. This address is now **superseded and must not receive another deposit**. It cannot be patched in place.

The setup transactions remain valid: mock USDT was minted, approved, and wrapped successfully. The resulting cUSDTMock balance is still held by the deployer wallet; setup must not be repeated merely because the pool must be redeployed.

The callback-fixed pool was deployed and independently verified:

```text
pool:          0x363C1B7bFF57Af01466B4B2342655E5f270a9f62
deployment tx: 0x7a889ba5091b0e7d4c7c21c9f365d0b37492b33c8b1249303d1a98db8468ce28
deployment block: 11633795
deployer:      0xdE67A35B322e5A31e8215B5245CA4e48d7977F71
epoch:         1788524619 → 1788531819
```

The receipt succeeded, deployed bytecode is non-empty, and read-only calls return the expected cUSDTMock token, RNG adapter, and epoch boundaries. Current-SDK encrypted-input generation and transfer-and-call gas estimation also pass against this address.

The first live encrypted deposit is complete:

```text
deposit:       1,000,000 encrypted units
deposit tx:    0x33b238cd19c9f4e2405887f0d23aaba93b229c2dd1aecb5e8064bdcee5c10f1a
deposit block: 11633822
gas estimate:  1,358,347
gas used:      1,334,819
pool balance handle: 0x32578a6f7ce0e5034b0b36b7213ad9153f828efa30ff0000000000aa36a70600
user-decrypted pool balance: 1,000,000
```

Independent receipt inspection confirms status `1`, the cUSDTMock confidential-transfer event, and the pool's account-only `EncryptedDeposit(address)` event. Reading the pool again returns the same encrypted balance handle. This proves the first live path from SDK encryption through ERC-7984 callback accounting and user-authorized decryption; it does not yet prove yield funding, draw finalization, prize claiming, or withdrawal.

## Pre-draw audit finding

The live deposit and yield-funding evidence remains valid, but the pre-draw parameter pass found two correctness defects in this deployment:

1. The winning-zone calculation multiplied a realistic six-decimal TWAB by both `1e18` factors before scaling down. `317083 * 1e18 * 1e18` exceeds `uint128`, so the encrypted intermediate can overflow even though the final probability is small.
2. `requestWithdrawal` rejected every call after `epochEnd` and after user finalization, contradicting the requirement that principal remain withdrawable.

The implementation now divides after each fixed-point multiplication, constrains both public fractions to at most `1e18`, and accrues only to `epochEnd` while allowing post-epoch and post-finalization withdrawal. A realistic `1,000,000`-unit full-odds regression and a post-epoch withdrawal regression bring the focused suite to 11 passing tests.

No draw was committed to `0x363C1B7bFF57Af01466B4B2342655E5f270a9f62`. Because it is immutable, this address is now superseded for the final lifecycle. Its deposited assets are testnet-only mock cUSDT; the old withdrawal rule leaves them inaccessible after this epoch, which is recorded as a prototype failure rather than hidden as a successful production path.

The corrected pool is now deployed and is the **current lifecycle candidate**:

```text
pool:          0xa4f2c74Fe1325e218AC9cEDc176DA7C4e175f3a2
deployment tx: 0xbe8b0f4ecf462501ce31f4b9d58f2afaa419e4acf1f1c9f3f756b31a2bcd7216
deployment block: 11634147
deployer:      0xdE67A35B322e5A31e8215B5245CA4e48d7977F71
epoch:         1788533536 → 1788537136
```

Independent read-only checks confirm receipt status `1`, non-empty bytecode, the expected cUSDTMock payout token, the expected RNG adapter, and both epoch boundaries. This bytecode includes the realistic-scale fixed-point calculation and post-epoch withdrawal fixes. It has not yet received a principal deposit or yield funding, and no draw has been committed.

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

## Callback-fixed deployment procedure

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

The first callback-fixed broadcast attempt timed out after gas estimation. A second attempt through Tenderly's public endpoint reached local signing but hit HTTP `429` while broadcasting transaction `0x5d2e22ada273f99382f86d33b3d5ea79b20fa122ed5f9b1058b5b6319ef89a2c`. Read-only recovery checks against both PublicNode and 1RPC showed latest and pending deployer nonce `31`, no transaction after nonce `30`, no transaction matching that hash, and no code at the deterministic nonce-31 address `0x363C1B7bFF57Af01466B4B2342655E5f270a9f62`. Neither attempt was accepted. 1RPC later rejected an ethers startup batch because Sepolia was unavailable on its free plan. Both Sepolia scripts now disable JSON-RPC batching, pin the static Sepolia network, and use explicit polling and request timeouts. A complete no-broadcast run passed through `https://ethereum-sepolia-rpc.publicnode.com` with that configuration; use PublicNode for the next deliberate retry.

The successful retry used PublicNode without JSON-RPC batching and mined the callback-fixed pool shown above. The pre-draw audit later superseded it. The corrected deployment at `0xa4f2c74Fe1325e218AC9cEDc176DA7C4e175f3a2` uses the realistic-math and post-epoch-withdrawal fixes and is now the configured target. Do not send further assets to either historical pool.

## Deployment gates still open

- live encrypted yield funding and handle-only payout;
- using a fresh RNG request for the deployed pool rather than the already-consumed smoke-test request;
- full draw/tier/claim lifecycle and repeated-claim behavior;
- live encrypted withdrawal and principal conservation;
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
POOL_ADDRESS=0xa4f2c74Fe1325e218AC9cEDc176DA7C4e175f3a2
POOL_PAYOUT_TOKEN_ADDRESS=0x4E7B06D78965594eB5EF5414c357ca21E1554491
POOL_UNDERLYING_TOKEN_ADDRESS=0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0
DEPOSIT_AMOUNT_UNITS=1000000
SETUP_AMOUNT_UNITS=1000000
```

`1000000` is one token unit at six decimals. The deployer's previous cUSDTMock was consumed by the historical integration pool. The guarded dry run against the corrected pool decrypted a zero wallet balance and stopped before constructing a misleading zero transfer. Mint and wrap the new principal once, while leaving deposit broadcast disabled:

```sh
SETUP_BROADCAST=true \
DEPOSIT_BROADCAST=false \
npx hardhat run scripts/liveSepoliaDeposit.ts --network sepolia
```

After the setup receipts and dry-run gas estimate succeed, keep setup disabled and run the encrypted deposit:

```sh
SETUP_BROADCAST=false \
DEPOSIT_BROADCAST=true \
npx hardhat run scripts/liveSepoliaDeposit.ts --network sepolia
```

This path succeeded for the superseded integration deployment and must now be repeated against the corrected candidate. The script decrypts the wallet's own cUSDTMock balance before constructing the deposit, then reads the pool's encrypted balance handle and requests user decryption after a broadcast. It never prints the private key or plaintext amount in transaction calldata. Do not enable both switches until the addresses and amount have been reviewed.

## Live encrypted yield-funding script

`scripts/liveSepoliaFundYield.ts` funds the separate encrypted prize reserve using the same ERC-7984 wrapper but callback data kind `1`. It verifies that the connected wallet is the pool's immutable `yieldProvider`, decrypts the wallet's own cUSDTMock balance before sending, and refuses to continue when that balance cannot cover the requested yield. This avoids treating ERC-7984's non-reverting zero transfer as successful funding.

The initial live check correctly found a zero wallet balance after the principal deposit. The ignored local environment is configured for `100000` units (`0.1 cUSDTMock`):

```text
YIELD_AMOUNT_UNITS=100000
YIELD_SETUP_AMOUNT_UNITS=100000
```

Mint and wrap this separate yield amount once, without funding yet:

```sh
YIELD_SETUP_BROADCAST=true \
YIELD_FUND_BROADCAST=false \
npx hardhat run scripts/liveSepoliaFundYield.ts --network sepolia
```

After the three setup receipts and dry-run gas estimate succeed, fund the encrypted reserve without repeating setup:

```sh
YIELD_SETUP_BROADCAST=false \
YIELD_FUND_BROADCAST=true \
npx hardhat run scripts/liveSepoliaFundYield.ts --network sepolia
```

The script records the reserve handle before and after funding. It requires the handle to change but does not attempt unauthorized plaintext reserve decryption.

The first live encrypted yield funding is complete:

```text
yield funding: 100,000 encrypted units (0.1 cUSDTMock)
funding tx:     0x57748dd1a07b12be77dcea0babb091a249b1bf12015606c546b8337ac8082e5a
funding block:  11634041
gas estimate:   994,790
gas used:       976,951
reserve before: zero handle
reserve after:  0xf428c5213c2862dd3913f39bb0936c4e38974d5bf9ff0000000000aa36a70500
```

Independent receipt inspection confirms status `1` and the pool's amount-free `EncryptedYieldFunded()` event. A fresh read returns the same post-funding handle. The reserve plaintext remains inaccessible through the pool API, so this proves confidential reserve funding without converting the private amount into public state.

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

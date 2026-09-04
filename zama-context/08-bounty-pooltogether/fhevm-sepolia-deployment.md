# FHEVM Sepolia deployment handoff

## Status

The first FHEVM slice is now configured for canonical Zama host contracts. `ConfidentialPoolTogetherSlice` inherits `ZamaEthereumConfig`, so construction selects the Sepolia ACL, coprocessor, and KMS verifier from `block.chainid`. It no longer points at the local test host addresses.

The local FHEVM test remains green after the callback, arithmetic, withdrawal, and two-user privacy changes: 12 focused tests pass.

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

The implementation now divides after each fixed-point multiplication, constrains both public fractions to at most `1e18`, and accrues only to `epochEnd` while allowing post-epoch and post-finalization withdrawal. Subsequent two-user, replay, and coordinator-provenance regressions bring the focused suite to 14 tests.

No draw was committed to `0x363C1B7bFF57Af01466B4B2342655E5f270a9f62`. Because it is immutable, this address is now superseded for the final lifecycle. Its deposited assets are testnet-only mock cUSDT; the old withdrawal rule leaves them inaccessible after this epoch, which is recorded as a prototype failure rather than hidden as a successful production path.

The corrected pool is now deployed and is the **current lifecycle candidate**:

```text
pool:          0xa4f2c74Fe1325e218AC9cEDc176DA7C4e175f3a2
deployment tx: 0xbe8b0f4ecf462501ce31f4b9d58f2afaa419e4acf1f1c9f3f756b31a2bcd7216
deployment block: 11634147
deployer:      0xdE67A35B322e5A31e8215B5245CA4e48d7977F71
epoch:         1788533536 → 1788537136
```

Independent read-only checks confirm receipt status `1`, non-empty bytecode, the expected cUSDTMock payout token, the expected RNG adapter, and both epoch boundaries. This bytecode includes the realistic-scale fixed-point calculation and post-epoch withdrawal fixes. No draw has been committed.

The corrected pool's encrypted principal deposit is complete:

```text
deposit:       1,000,000 encrypted units (1 cUSDTMock)
deposit tx:    0x56c1bc039a2e2463f8805553af23be93a201187461a8c3e74a68ddb6e2d6d861
deposit block: 11634233
gas estimate:  1,358,359
pool balance handle: 0x6f8f030926b26f3ac6c4c5938a45273747e934fab7ff0000000000aa36a70600
user-decrypted pool balance: 1,000,000
```

The guarded script first decrypted the wallet's own cUSDTMock balance as `1,000,000`, generated a fresh encrypted input and proof, sent the ERC-7984 callback transfer, and decrypted the resulting pool balance to the same amount. This repeats the confidential principal path on the corrected bytecode. Separate encrypted yield funding remains next.

The corrected pool's encrypted yield reserve is also funded:

```text
yield funding: 100,000 encrypted units (0.1 cUSDTMock)
funding tx:     0xde7fec4effd7888f8c60b81b6fce84185ee8cf2d7a6d0f8659165d36890b8216
funding block:  11634431
gas estimate:   994,790
gas used:       976,951
reserve before: zero handle
reserve after:  0xb71c310a2da0cb8aa77333e6a73831acdb2c1ea62fff0000000000aa36a70500
```

Independent RPC inspection confirms receipt status `1`. The amount-free callback changed the reserve handle without publishing its plaintext. The epoch is now closed, so deposit weights are fixed.

The principal deposit block timestamp was `1788534660`. With epoch `[1788533536, 1788537136]`, one `1,000,000`-unit balance participated for `2,476` of `3,600` seconds. The exact floor-divided public aggregate TWAB for this one-user draw is therefore:

```text
1,000,000 × 2,476 ÷ 3,600 = 687,777
```

The draw must use `aggregateSupply = 687777`. Using the closing supply of `1,000,000` would distort the V5-style probability model. For the bounded one-user lifecycle proof, `tierOdds = 1e18` and `vaultContributionFraction = 1e18` make the user's winning zone equal to the aggregate TWAB, so every correctly reduced random value is eligible while still exercising the encrypted comparison and payout path.

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

The hardened pool receives both addresses: it calls V5-compatible completion/randomness methods on the adapter and verifies draw binding plus request timing through the timestamp-aware coordinator. The historical coordinator above predates provenance version `1` and cannot be used for a new hardened pool.

## Required local environment

Create a local `.env` in `zama-context/fhevm/library-solidity/` or pass equivalent shell variables. Never commit it or share the private key.

```text
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# Fill this locally with 0x + 64 hexadecimal characters. Never share it.
SEPOLIA_PRIVATE_KEY=
POOL_PAYOUT_TOKEN_ADDRESS=0x4E7B06D78965594eB5EF5414c357ca21E1554491
POOL_RNG_PROVIDER_ADDRESS=0x2387Ac275b6ADa26959c587d93abFbd491A64D5A
POOL_RNG_COORDINATOR_ADDRESS=
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

- bind fulfilled post-epoch adapter request `3` to pool draw ID `1` with an encrypted prize;
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

## Guarded live draw script

`scripts/liveSepoliaDraw.ts` controls the remaining draw path through four explicit actions: `commit`, `finalize`, `finalize-user`, and `claim`. Every action is dry-run by default and requires `DRAW_BROADCAST=true` to write. It rejects superseded pools, duplicate draw events, invalid integer widths, pre-epoch requests, and an aggregate TWAB that does not match the configured principal and deposit block.

For the corrected one-user epoch, the tracked parameters are pool draw ID `1`, adapter request ID `3`, aggregate TWAB `687777`, full `1e18` tier odds, full `1e18` vault fraction, and encrypted prize `100000`. A complete commit dry run reconstructed the deposit timestamp, confirmed the request occurred after epoch close, generated the encrypted prize proof, and estimated `535903` gas without broadcasting.

The live draw and winner path is now complete:

| Step                 | Transaction                                                          | Block      | Gas used  |
| -------------------- | -------------------------------------------------------------------- | ---------- | --------- |
| Encrypted draw commit | `0x92904bba8b42b136238829e48814654df3b7155a4d764be3524d880b494f876a` | `11634551` | `530525`  |
| RNG finalization      | `0x9813f91ecbfb91598b78f5561d7f526c302e441bfeecb83d5df0faf4466162b9` | `11634592` | `69786`   |
| User TWAB finalization | `0x8d5b881b758b46b97e1eed0cef427d4a0e41d377382836f99197cdac4a5a10ba` | `11634599` | `191602`  |
| Encrypted claim       | `0xfe2919a655ee5ec7b2a2be5013e56021503504c68a79783d330266716cd77a2e` | `11634615` | `696663`  |

Receipt logs confirm `DrawRngCommitted(1, 3)`, `DrawOpened(1, 687777, randomWord)`, the confidential-token transfer, and the amount-free `EncryptedClaimRequested(account, 1, 0, 0)` event. The claim RPC connection reset after broadcasting, but recovery by exact transaction hash confirmed receipt status `1` and `claimed(account, 1, 0, 0) == true`; the claim was not retried.

The stored payout handle is `0xc98800f17413be7848a6292bc86bd3edfa69fb2dceff0000000000aa36a70500`. A read-only recovery action using the current Zama SDK decrypted that user-authorized handle to `100000`, and the wallet's confidential cUSDT balance also decrypted to `100000`. This proves encrypted eligibility, winner-only payout access, and confidential token settlement for the bounded one-user draw.

`scripts/liveSepoliaWithdraw.ts` guards the final principal withdrawal. Its dry run decrypted `1000000` principal in the pool and `100000` prize tokens in the wallet, generated an `euint128` withdrawal proof, and estimated approximately `830000` gas.

The live withdrawal completed the bounded lifecycle:

```text
withdrawal:             1,000,000 encrypted principal units
withdrawal tx:          0xd6095a8254cdf4ec5bdb733d5a17d089a3a05dffdd6f137006e17d75b227fcc8
withdrawal block:       11634760
gas estimate:           830,044
gas used:               822,350
pool principal before:  1,000,000
pool principal after:   0
wallet cUSDT before:    100,000
wallet cUSDT after:     1,100,000
```

Independent receipt inspection confirms status `1`, the ERC-7984 confidential-transfer event, and the pool's amount-free `EncryptedWithdrawalRequested(account)` event. User-authorized decryption proves exact conservation: the wallet recovered all `1000000` principal units while retaining the `100000` prize units. This closes the smallest live economic and confidentiality loop; it does not make the prototype production-ready.

## Post-deployment hardening boundary

The current local contract prevents a provider RNG request ID from being committed to more than one draw. Pool `0xa4f2c74Fe1325e218AC9cEDc176DA7C4e175f3a2` was deployed before that guard was added. Keep it as reproducible evidence for the completed bounded lifecycle; do not label it as the latest production candidate or fund it for additional draws.

The local coordinator now records the request timestamp atomically, and the local pool enforces post-epoch creation, exact draw/request binding, and coordinator/provider block agreement. Because the historical coordinator does not expose this timestamp, the next deployment requires a new coordinator. The existing Chainlink adapter can remain in use.

Prepare the new coordinator from the reference repository; this is a dry run unless `--broadcast` is added:

```sh
cd /home/ali/Desktop/zama/confidential-pooltogether
set -a
source .env
set +a
export SEPOLIA_RNG_ADAPTER_CONTRACT=0x2387Ac275b6ADa26959c587d93abFbd491A64D5A
forge script script/DeployRngCoordinator.s.sol:DeployRngCoordinator \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_PRIVATE_KEY"
```

After its address and `PROVENANCE_VERSION() == 1` are verified, set that address as `POOL_RNG_COORDINATOR_ADDRESS` in the ignored `zama-context/fhevm/library-solidity/.env`. Then deploy a fresh pool; the deployment script rejects a coordinator whose version, adapter, or operator does not match.

The coordinator was subsequently deployed and verified at `0xabc4d6ca46A91cFF083cD0086B81337adC7ed6cA`. A hardened pool dry run passed with:

```text
epoch:                  1788545890 → 1788553090
coordinator version:    1
estimated deployment:   3,391,953 gas
gas limit:              4,070,343
deployment nonce:       54
expected pool:          0xF99747C771c09909f6Ad56F43D742c7757ECD9E0
precomputed tx:         0x80a5361da8442869d50e2faf7564dbca8493ac6e2c2c8f4e8c1aab935c923fdc
```

The address and transaction hash are provisional until broadcast and mining. No hardened pool transaction has been sent at this checkpoint.

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

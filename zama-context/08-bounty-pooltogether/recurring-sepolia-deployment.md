# Recurring Confidential PoolTogether Sepolia Deployment

## Refund-safe final candidate

The refund-safe recurring release is deployed, source-verified, frontend-bound, and live-validated across both test wallets. Both strict account audits returned `RECURRING_LIFECYCLE_COMPLETE: true`; frontend writes are enabled for these frozen addresses.

| Field | Value |
|---|---|
| Network | Ethereum Sepolia (`11155111`) |
| Deployer / wallet A | `0xdE67A35B322e5A31e8215B5245CA4e48d7977F71` |
| Wallet B | `0x46854AC6B18C384C9a0b0b3aB7bF27a6fCE6c16a` |
| Recurring pool | `0xE0d284649E955d03B02F3cf927D60271d41C52D1` |
| Confidential payout token | `0x4E7B06D78965594eB5EF5414c357ca21E1554491` |
| RNG adapter/provider | `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A` |
| Refund-safe RNG coordinator | `0xa90A46B27147C532Bb6844d49d285FEba9819074` |
| First epoch | `1788607872` → `1788611472` |
| Epoch duration | `3600` seconds |
| Coordinator deployment transaction | `0xa200688859ef2f8de7734746dbd95acc6205bc0e66969659a99952ab4e452a4a` |
| Coordinator deployment block | `11640061` |
| Pool deployment transaction | `0x4c42e99536e1d1be439a033a891d1648dc9731d8f8974c0c67d18ffc8cfd85d9` |
| Pool deployment block | `11640070` |

The coordinator's adapter, operator, provenance version `1`, and initially unbound draw-1 slot were checked onchain. Refund recovery was also exercised live: a one-wei probe was deposited in transaction `0x065120e339641e0ddc713d31324ecb18da8137fd6efa2a9cd63e5a623bea3afe`, the operator recovered it in transaction `0xcd7da6eacd67c7a4fbeb67b42bb2457d3334f8c84a17d48c19336c982fd50a7c`, the coordinator balance returned to zero, and a non-operator call reverted with `not-operator`.

Both wallets deposited `1000000` confidential units. Wallet A's deposit transaction `0x5aa3b9a6941f8621e5071527ec0818ee4b0bcaf41676f9479df92d7ff92e8ac2` mined in block `11640092`; wallet B's transaction `0x75a6c359e9eb8617b6c782c7918b68bce6d2c7ec637d13734ddcb59e4e768934` mined in block `11640121`. Owner-authorized decryption returned `1000000` for each position. The sponsored encrypted reserve was funded in transaction `0xdacd0811b7db1d2d9f296c7409ec4601bf94238ba5399b9a51266b15b93c0795` at block `11640147`; its plaintext was not emitted.

From the public epoch boundary and deposit timestamps, the exact epoch-1 user TWABs are `936666` for wallet A and `836666` for wallet B. The KMS-proven aggregate is `1773333`: the contract sums both time-weighted numerators before one final division, so it differs by one unit from the sum of the two individually floored TWABs. The individual values remain owner-decryptable ciphertext while only the aggregate is deliberately made public.

### Final lifecycle transcript

| Step | Transaction | Block | Result |
|---|---|---:|---|
| Advance epoch 1 | `0xdd35356f4ada4d4cbe4a2e881e3220d7fcd49d3670f54649f4328f335dd961f0` | `11640369` | Epoch 1 total finalized; epoch 2 opened |
| Finalize wallet A TWAB | `0xa8447a4d96f5d58d393a42c6aaeed5f8cb2fbc6135ac0e8452215863df7aa8dd` | `11640374` | Owner-decrypted audit value `936666` |
| Finalize wallet B TWAB | `0x55e69deb2121a2790822a93343fe436a5e660415feb8a6719a1dee0b7d41d1af` | `11640377` | Owner-decrypted audit value `836666` |
| Request aggregate decryption | `0xce7e9f08952b1214f96a51edd3df483f7a6317994c57c8d9c152d76a4feac073` | `11640381` | Aggregate handle authorized for public KMS decryption |
| Finalize KMS aggregate | `0xda5ae528466cb8b3bcac6d47971f820ab7c3b8e307b0fc4b00d56641d5bd362b` | `11640387` | KMS proof accepted aggregate `1773333` |
| Bind Chainlink request 8 | `0xce4ca6b13bbb7b6a8a0a298417d05fae56adbf0ddcf7609f59401a27d1f0cd46` | `11640395` | Post-close request bound atomically to draw 1 |
| Recover real RNG overpayment refund | `0x732b31628e35395265e382537cb02504180f9d270eff540757d2f94dcf818574` | `11640399` | Recovered `132689124102709` wei; coordinator balance returned to zero |
| Commit encrypted draw | `0xb0004a5ac4a07982c38753767213189ec9e0037c5ece7e8c00300b49ff62080d` | `11640417` | Encrypted `100000`-unit prize committed |
| Open draw | `0x5fa313a0a60ead6c5d1c419b65c176aeefc4a132a0008289b668eab7581553d0` | `11640424` | Chainlink random word consumed onchain |
| Wallet A prepare / settle | `0x3831aab01f236dba8f069261565ddb4baeb053c6d9efc6ddd0ef5a6a073483cf` / `0x23d6aa9bedba4921f859bb834f0f9f13935fa29f658d2c6efd1714c3236538e3` | `11640428` / `11640431` | Private payout `0` |
| Wallet B prepare / settle | `0xb21fcbdcee6649753bfb3a0ed42bec85fc2cb35e365309b92498ead149552f64` / `0x0aa20f41ae58a7caebb08907e8be28becb2ea4722ae0afc9f12f14e09df944ed` | `11640434` / `11640437` | Private payout `100000` |
| Wallet A principal withdrawal | `0xec2be666bc183e276d05cd8c796bdfe3ee75255cd1b62fea92273dababa96d85` | `11640643` | Principal `1000000 → 0`; wallet cUSDT `100000 → 1100000` |
| Advance epoch 2 | `0x504c050f67a69077f23771be0e783f213bd5919753e3ffa0b3547d564788c9b7` | `11640662` | Required after the relayer delay crossed the next epoch boundary |
| Finalize epoch-2 checkpoints | `0x19c31e0987d0ae64beb75e6b1a7ad5b770c63a25a97a871f6dba9beb10e798da` / `0xdb548aef339b158b40a583611549e060dc8d1f9a3cf1b605dc4a1f8ee0356aff` | `11640668` / `11640672` | Both users advanced sequentially into epoch 3 |
| Wallet B principal withdrawal | `0x88589057933e24276de6585ae540c2feacc351b912c6122a33a79203d1dd22af` | `11640736` | Principal `1000000 → 0`; wallet cUSDT `100000 → 1100000` |

The two epoch-1 audits reconstructed contract configuration, event counts and ordering, KMS aggregate proof, coordinator/provider provenance, draw values, confidential TWAB and payout values, zero remaining principal, and final confidential-token balances. Both completed with strict failure mode enabled and returned `true`.

Sourcify reports exact creation and runtime matches for the final pool (match `47153193`) and coordinator (match `47153198`). The adapter retains exact match `47144875`:

- [final pool source record](https://sourcify.dev/server/v2/contract/11155111/0xE0d284649E955d03B02F3cf927D60271d41C52D1?fields=all)
- [refund-safe coordinator source record](https://sourcify.dev/server/v2/contract/11155111/0xa90A46B27147C532Bb6844d49d285FEba9819074?fields=all)
- [Chainlink adapter source record](https://sourcify.dev/server/v2/contract/11155111/0x2387Ac275b6ADa26959c587d93abFbd491A64D5A?fields=all)

## Release status

Pool `0x7C942fe70E1C7EA0cC2d1d37fad1018200C3e401` successfully proved two encrypted deposits, exact two-user TWAB aggregation, KMS-proven public denominator finalization, post-close Chainlink request provenance, and draw opening. It is now superseded: live claim preparation traced to an immediate revert at Sepolia's executor because the deployed executor implementation does not contain selector `0x94fdeb20` for the pinned library's `fheMulDiv(bytes32,bytes32,bytes32,bytes1)` wrapper. No claim-preparation transaction was broadcast.

The compatibility fix replaces `FHE.mulDiv` with `euint128` scalar multiplication and plaintext division—operations already proven live by the same pool's TWAB path. Compatibility pool `0xa12962cb07D7aaC4421B6101B32caB1Bc9D5FC47` proved this path across two live draws. It is also superseded for release purposes: coordinator `0x4BA4F83C1A59559AE338E63A79cDEDC73e3B700e` correctly bound fresh requests but retained `257614275451786` wei of adapter refunds without a recovery function. Operator-only refund recovery is now implemented and covered by the Foundry suite, so a fresh coordinator and replacement pool are required before promotion.

## Compatibility-fixed two-draw evidence

| Field | Value |
|---|---|
| Pool | `0xa12962cb07D7aaC4421B6101B32caB1Bc9D5FC47` |
| Coordinator | `0x4BA4F83C1A59559AE338E63A79cDEDC73e3B700e` |
| Deployment transaction | `0x6c91222fc9ec6be3a2a4d95412cbb91a72fc42348be6ff184b58a73d08c80f74` |
| Deployment block | `11639493` |
| Epoch duration | `600` seconds (test-only) |
| Encrypted deposits | `1000000` units per wallet |
| Sponsored encrypted reserve | `500000` units |

Epoch 1 used deposit timestamps `1788600732` and `1788600972` against boundary `1788600576 → 1788601176`. The independently calculated TWABs were `740000` and `340000`; KMS accepted exactly `1080000` in transaction `0x83cd53a45e8f338b7e82cf40b0cd5a728f4d5df809f7f33fcbc61b2aff5f731b`. Post-close Chainlink request `6` was bound in transaction `0xce55e22e9f63f0136d6bc53dc1f5385a02810c01c694ed74269852ab39958b0d`. Draw commit and opening transactions were `0xa9d25bd6462cfe14d04bb9842740296c1ea8e2e5b5c3d5cf70649d0a482379fa` and `0x39d344c6ecda804474731d6b02f8a932b48af18230cf97109d094fd2c1973074`. Wallet A privately decrypted `100000`; wallet B privately decrypted `0`.

Epoch 2 carried both full balances and KMS accepted exactly `2000000` in transaction `0x7011960c881d377d4dd5a02f03924f1a345b5affe03f6fcbe61855bb058d6a42`. Post-close Chainlink request `7` was bound in transaction `0x7b498a0c699a461339d66b44c3365fb1c012b8baddb10cc8ffa82d6757ea337f`. Draw commit and opening transactions were `0x232534ced6c54b9ac68cc165ecd226f24c4b05966c19a7be370f1fea6f27a7de` and `0x1c2a675648f10bc40ff02ba7503ba4eeaa8c5e8a1a8eabf5969743cfb17d7a5a`. Both wallets privately decrypted `0`. Across both draws, preparation and settlement remained non-reverting for winners and non-winners, and public state exposed ciphertext handles rather than payout values.

The 600-second windows deliberately accelerated testing but were shorter than the complete relayer/Chainlink/manual validation loop. The resulting sequential catch-up checkpoints behaved correctly. Production configuration must use substantially longer epochs and an automated keeper.

The earlier recurring deployment proved encrypted deposit, sponsored reserve funding, recurring epoch advancement, private user-TWAB finalization, and KMS-proven aggregate finalization. It is not promotable as the final draw release: its reused coordinator already had draw ID `1` bound to request `4` from an older pool before that deployment's first epoch ended.

No new RNG transaction was broadcast when the collision was discovered. The Foundry request simulation reverted at the read-only `draw-already-bound` preflight. Because the pool stores its coordinator immutably and requires `getDrawRequest(epochId)`, recovery requires a fresh coordinator and fresh recurring pool deployment. The token and Chainlink adapter remain reusable.

## Superseded pre-compatibility candidate

| Field | Value |
|---|---|
| Network | Ethereum Sepolia (`11155111`) |
| Deployer / wallet A | `0xdE67A35B322e5A31e8215B5245CA4e48d7977F71` |
| Wallet B | `0x46854AC6B18C384C9a0b0b3aB7bF27a6fCE6c16a` |
| Recurring pool | `0x7C942fe70E1C7EA0cC2d1d37fad1018200C3e401` |
| Confidential payout token | `0x4E7B06D78965594eB5EF5414c357ca21E1554491` |
| RNG adapter/provider | `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A` |
| Fresh RNG coordinator | `0xcb8bbD71B269E4a64965Cb86F044950f542B6133` |
| RNG provenance version | `1` |
| First epoch start | `1788590172` |
| Epoch duration | `3600` seconds |
| First epoch end | `1788593772` |
| Deployment transaction | `0x2ec1adbba3797aa7da645dc13276a423d52973db008b6c36651b6d2f36bd7c6e` |
| Deployment block | `11638643` |
| Deployment nonce | `79` |
| Gas estimate | `3822234` |
| Broadcast gas limit | `4586680` |

The fresh coordinator was deployed in transaction `0x9ed8ad2cb77a0b180fd345f6e2c3a39554f5c2897da9f389c8a00b9347035010` at block `11638574`. Its adapter, operator, provenance version, and unbound first-draw slot were checked onchain before the pool deployment.

The focused local recurring suites pass `11` tests, covering two-user private outcomes, consecutive epoch requests, keeper recovery, KMS-proven aggregate finalization, rollover withdrawals, winning and non-winning claims, and the complete gas/HCU envelope.

Wallet B received `0.01` Sepolia ETH in transaction `0xd166ca03b90d6f56463f3fdbea2be648fe0aa36206b8554f1b2c706da073788a`. Its `1,000,000`-unit test-token setup used mint transaction `0xc8c271a7bb4ca148ce410d4663792321fc3f31f594bd48e254af5e53b3332490`, approval transaction `0x43b0c05d25b8157dc8df648f3461292b6e147de61f3cedaf3aae70ca377a30fc`, and wrap transaction `0x482e6aec3a0935c98e61200d8dcc1c54a9f2620636bea77cbd7c7176549adb6f`.

An interrupted deployment command also mined unused pool `0xE14f3bFcd6d9E51e3F19310F7fD2F96A820c3065` in transaction `0xe56839d89a2a434e6da2b778e0d0507737593c232d895637ab052bf7be2d55d9`. It received no deposit or reserve funding and bound no RNG request; it is historical test evidence only.

### Final-candidate lifecycle evidence

| Step | Epoch | Transaction | Block | Result |
|---|---:|---|---:|---|
| Wallet A encrypted deposit | 1 | `0xee46091da995fb8e667a3436ac3f49d6de3be20c5045b2c7afd431bd6e8e8b66` | `11638670` | Owner-authorized decryption returned `1000000` units |
| Wallet B encrypted deposit | 1 | `0x1373f7d90ce7ab019e899b15ccd0ead6d0f9478946d712e33be8b0f77710b59a` | `11638684` | Owner-authorized decryption returned `1000000` units |
| Sponsored encrypted prize reserve | 1 | `0x53c1b3e006a7e9c2fb33075a924785ba6e343df290807e716e498b8f393d70de` | `11638691` | Reserve changed from the zero handle to ciphertext `0x6da12f454f9e4bdbc2a36c4974b97a7ec0b6aa5eadff0000000000aa36a70500` without publishing its plaintext |
| Sponsored encrypted prize-reserve top-up | 1 | `0x24a718583c3b84d2c5d5f6b7421e7faf5593e051d99d169bbbe0c6a08f84e837` | `11638789` | Added `400000` known test units, bringing sponsored funding to `500000`; the public reserve remained ciphertext `0x9f349e644077f0bcfd7d62e38d3186cf04116f28e9ff0000000000aa36a70500` |

The expected epoch-1 TWAB baseline, fixed from the public epoch boundary and the two deposit timestamps, is `976666` for wallet A, `930000` for wallet B, and `1906666` in aggregate. These values are test expectations; user TWABs remain ciphertext until owner-authorized decryption, while only the aggregate is intended for KMS-proven public finalization.

### Final-candidate metadata check

Both encrypted deposits used `452` bytes of calldata; both encrypted reserve transactions used `484` bytes. At the pool-contract boundary, each deposit emitted exactly one `EncryptedDeposit` event with indexed account and epoch but empty data, and each reserve transfer emitted exactly one `EncryptedYieldFunded` event with no indexed application fields and empty data. No application event published a deposit, balance, reserve, TWAB, odds, or payout amount.

This is confidentiality, not anonymity. Sender addresses, transaction timing, gas, ciphertext/proof calldata, the fact that a deposit or reserve action occurred, and later claimant/withdrawal identities remain public. The two deposit receipts also had different FHE-internal log counts and gas usage, so those metadata are not asserted to be amount-hiding proofs; privacy rests on encrypted values and amount-free application events, with the aggregate denominator intentionally disclosed only after KMS-proven finalization.

### Frontend pre-activation QA

The local production build passed TypeScript and Vite compilation. A disconnected-browser smoke test loaded live draw `1`, its open phase and countdown through the public read-only RPC fallback. A separate injected-provider test connected Wallet B as `0x4685…c16a`, confirmed Sepolia, loaded the same live draw, and showed an existing position only as encrypted placeholder text. No runtime alert appeared. Activating the deposit control while `writesEnabled=false` displayed the strict-audit lock and produced no transaction link. Real browser-wallet signing and Zama encryption/decryption remain the post-audit activation gate.

Source verification is complete through Sourcify's current v2 API. All three contracts compile with Solidity `0.8.24+commit.e11b9ed9` and match their deployed creation/runtime bytecode:

| Contract | Verification job | Match ID | Public record |
|---|---|---:|---|
| Superseded recurring pool | `b5919d3b-a5b0-4bcf-b6be-0f84f5f73b95` | `47144784` | [Sourcify lookup](https://sourcify.dev/server/v2/contract/11155111/0x7C942fe70E1C7EA0cC2d1d37fad1018200C3e401?fields=all) |
| Fresh RNG coordinator | `b0171578-6e8a-421d-8a38-33128d6f49ff` | `47144811` | [Sourcify lookup](https://sourcify.dev/server/v2/contract/11155111/0xcb8bbD71B269E4a64965Cb86F044950f542B6133?fields=all) |
| Chainlink VRF adapter | `1939ab72-f610-4d23-aa3a-17eb9ad5cccb` | `47144875` | [Sourcify lookup](https://sourcify.dev/server/v2/contract/11155111/0x2387Ac275b6ADa26959c587d93abFbd491A64D5A?fields=all) |

Sourcify's optional Etherscan relay encountered shared rate/daily limits; RouteScan and Blockscout relay jobs were also created. These optional relay outcomes do not change the successful Sourcify matches.

## Superseded deployment record

| Field | Value |
|---|---|
| Network | Ethereum Sepolia (`11155111`) |
| Deployer | `0xdE67A35B322e5A31e8215B5245CA4e48d7977F71` |
| Recurring pool | `0x31ceb5d5de22e28d2D985e594665524ca61f5628` |
| Confidential payout token | `0x4E7B06D78965594eB5EF5414c357ca21E1554491` |
| RNG adapter/provider | `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A` |
| RNG request coordinator | `0xabc4d6ca46A91cFF083cD0086B81337adC7ed6cA` |
| RNG provenance version | `1` |
| First epoch start | `1788567223` |
| Epoch duration | `1800` seconds |
| First epoch end | `1788569023` |
| Deployment transaction | `0x9b789a869d8be78bd815aa22e79f355c0b17277842512f9613e889216f105cb5` |
| Deployment block | `11636762` |
| Deployment nonce | `66` |
| Gas estimate | `3822234` |
| Broadcast gas limit | `4586680` |

The precomputed address and the mined address matched. The node accepted the precomputed transaction hash, so there is no uncertain-broadcast ambiguity for this deployment.

## Live lifecycle evidence

| Step | Epoch | Transaction | Block | Result |
|---|---:|---|---:|---|
| Wallet A encrypted deposit | 1 | `0x8b2338fa577e863c6f0582254c8ebe011b143b1aab552bd5cc2fc82e868b5e34` | `11636853` | Encrypted principal decrypted by its authorized owner to `1000000` units |
| Sponsored encrypted prize reserve | 1 | `0x618c352919f9f7d8cd4706b99563192021b7c4c09d6afdacda47b1ebe1456dc8` | `11636876` | Reserve ciphertext changed; plaintext remained confidential |
| Permissionless epoch advance | 1 → 2 | `0x3bace97948996c0f910eca0c90dc782b1fa7b4b6c2b890f56500ff74ad27fd15` | `11636992` | Epoch 1 total TWAB finalized and epoch 2 opened |
| Wallet A TWAB finalization | 1 | `0x1b206382fc64d64fd4d56880454c0f8b9e445fe979eeb874d4e7f1e817db30e7` | `11637007` | User TWAB remained encrypted under handle `0x3831868ac08143c98ca1835e4eb01d5991c033af23ff0000000000aa36a70600` |
| Aggregate-decryption authorization | 1 | `0x9245e9d4d4b698d5ada6c1dfd2e35a081c1161cca69a6bd99e5f9210a7f203bc` | `11637020` | Finalized epoch-wide TWAB handle authorized for KMS public decryption |
| KMS-proven aggregate finalization | 1 | `0xe54cece19b8cb38781c1f4e780664de0cf535f15affda094b124107af04eec5c` | `11637036` | Aggregate TWAB `877222` accepted with a valid KMS proof |

Wallet A is `0xdE67A35B322e5A31e8215B5245CA4e48d7977F71`. The public pool-balance ciphertext handle after the deposit was `0x79468c2d88d50dbba7c39c0b1800287318a861346fff0000000000aa36a70600`; the plaintext position was not emitted by the contract.

The public encrypted-reserve handle after funding was `0xb9c5bfde740c5fb608b0c09ac0ead18dd81b9b0308ff0000000000aa36a70500`. This release accurately describes the reserve as testnet-sponsored funding, not strategy-generated yield.

## Promotion gates

- [x] Prove the Sepolia-compatible winner arithmetic with two wallets and two consecutive encrypted claim rounds.
- [x] Add and test operator-only recovery of coordinator-held provider refunds.
- [x] Deploy the refund-safe coordinator with an unbound draw-1 slot, then deploy the final replacement pool against it.
- [x] Complete the bounded final deposit, reserve, KMS aggregate, RNG, draw, claim, and principal-withdrawal smoke transcript.
- [x] Run the strict recurring lifecycle auditor successfully against the final addresses.
- [x] Verify the final pool and coordinator creation/runtime bytecode through Sourcify v2; retain the existing adapter match.
- [x] Rebind the approved frontend to the final pool and coordinator, complete disconnected desktop/mobile interaction QA, and enable writes. A real injected-wallet signing pass remains part of hosted-release QA.
- [ ] Package the evidence and submission materials.

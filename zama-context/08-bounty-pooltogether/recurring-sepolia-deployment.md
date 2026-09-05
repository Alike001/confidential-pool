# Recurring Confidential PoolTogether Sepolia Deployment

## Release status

The final lifecycle candidate is deployed at `0x7C942fe70E1C7EA0cC2d1d37fad1018200C3e401` against a fresh, timestamp-aware coordinator whose draw ID `1` was verified unbound before deployment. Promotion still depends on completing the two-wallet, two-epoch lifecycle, strict audit, source verification, browser-wallet QA, and enabling the already-integrated frontend writes.

The earlier recurring deployment proved encrypted deposit, sponsored reserve funding, recurring epoch advancement, private user-TWAB finalization, and KMS-proven aggregate finalization. It is not promotable as the final draw release: its reused coordinator already had draw ID `1` bound to request `4` from an older pool before that deployment's first epoch ended.

No new RNG transaction was broadcast when the collision was discovered. The Foundry request simulation reverted at the read-only `draw-already-bound` preflight. Because the pool stores its coordinator immutably and requires `getDrawRequest(epochId)`, recovery requires a fresh coordinator and fresh recurring pool deployment. The token and Chainlink adapter remain reusable.

## Final lifecycle candidate

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

Source verification remains open. The pinned Hardhat 2 verifier's Sourcify integration uses the legacy v1 API, which Sourcify disabled on July 7, 2026; two verification attempts therefore returned the service's HTML migration response instead of JSON. Etherscan verification is prepared and will activate when a local `ETHERSCAN_API_KEY` is configured.

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

- [x] Deploy a fresh coordinator with an unbound draw-1 slot, then deploy a replacement recurring pool against it.
- [x] Complete confidential deposits for at least two wallets.
- [x] Fund the disclosed testnet-sponsored encrypted prize reserve.
- Advance, checkpoint, decrypt the aggregate, draw, prepare claims, settle claims, and withdraw across two consecutive epochs.
- Run the strict recurring lifecycle auditor successfully.
- Verify source code and test public metadata/endpoints.
- [x] Integrate the approved frontend, current Zama browser SDK, live read-only pool state, and gated write actions against this pool.
- Complete browser-wallet QA, then enable frontend writes after the strict lifecycle audit passes.
- Package the evidence and submission materials.

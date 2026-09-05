# Recurring Confidential PoolTogether Sepolia Deployment

## Release status

This deployment proved encrypted deposit, sponsored reserve funding, recurring epoch advancement, private user-TWAB finalization, and KMS-proven aggregate finalization. It is not promotable as the final draw release: its reused coordinator already had draw ID `1` bound to request `4` from an older pool before this deployment's first epoch ended.

No new RNG transaction was broadcast when the collision was discovered. The Foundry request simulation reverted at the read-only `draw-already-bound` preflight. Because the pool stores its coordinator immutably and requires `getDrawRequest(epochId)`, recovery requires a fresh coordinator and fresh recurring pool deployment. The token and Chainlink adapter remain reusable.

## Deployment record

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

- Deploy a fresh coordinator with an unbound draw-1 slot, then deploy a replacement recurring pool against it.
- Complete confidential deposits for at least two wallets.
- Fund the disclosed testnet-sponsored encrypted prize reserve.
- Advance, checkpoint, decrypt the aggregate, draw, prepare claims, settle claims, and withdraw across two consecutive epochs.
- Run the strict recurring lifecycle auditor successfully.
- Verify source code and test public metadata/endpoints.
- Integrate and test the approved frontend against this pool.
- Package the evidence and submission materials.

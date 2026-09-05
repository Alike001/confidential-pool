# Recurring Confidential PoolTogether Sepolia Deployment

## Release status

The recurring candidate is deployed. It remains a release candidate until the two-wallet/two-epoch lifecycle completes and the strict auditor returns `RECURRING_LIFECYCLE_COMPLETE: true`.

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

## Promotion gates

- Complete confidential deposits for at least two wallets.
- Fund the disclosed testnet-sponsored encrypted prize reserve.
- Advance, checkpoint, decrypt the aggregate, draw, prepare claims, settle claims, and withdraw across two consecutive epochs.
- Run the strict recurring lifecycle auditor successfully.
- Verify source code and test public metadata/endpoints.
- Integrate and test the approved frontend against this pool.
- Package the evidence and submission materials.

# Aave-backed Sepolia release

## Purpose

This record promotes the project from a sponsored-reserve prototype to a literal generated-yield bounty implementation. Historical cUSDTMock deployments remain useful cryptographic and recurring-lifecycle evidence, but they are superseded as the submission target by this LINK/Aave release.

## Architecture decision

Zama's canonical Sepolia wrapper registry does not contain a wrapper for an Aave aToken. The application therefore deploys an explicit, app-specific confidential token backed one-for-one by transferable Aave aLINK.

1. A user obtains test LINK and supplies it to the official Aave V3 Sepolia Pool.
2. The resulting aLINK is transferred into `AaveYieldConfidentialToken` at a public shield boundary.
3. The wrapper credits the user with encrypted `caLINK`.
4. The user deposits `caLINK` into the recurring pool through an encrypted transfer-and-call.
5. As Aave's liquidity index grows, the wrapper's aLINK balance exceeds its recorded issued backing.
6. Anyone can call `harvestYield`; only that surplus is minted as encrypted `caLINK` to the pool's prize reserve.
7. The encrypted reserve funds periodic winner payouts without consuming principal.

The public aLINK backing balance and harvested aggregate yield are intentionally auditable. Individual in-pool amounts remain encrypted.

## Final deployment

| Component | Address |
| --- | --- |
| Confidential pool | `0xdE9A7DC790e6dE0304A046210044F38904309120` |
| caLINK wrapper | `0x4734EC2CC7e18D4C39fccB97E16E77701819655F` |
| RNG coordinator | `0xd39ee872B5cb97d7A6576862549DEBF7AE753CeC` |
| Chainlink VRF adapter | `0x2387Ac275b6ADa26959c587d93abFbd491A64D5A` |
| Aave V3 Pool | `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951` |
| LINK | `0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5` |
| aLINK | `0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24` |

Pool deployment transaction: `0xdf86061ad99fea4cc7bc29a079dd47a7480ea9d3c40d8ca8be818761cf1b684a`, block `11641324`.

Wrapper deployment transaction: `0x020a0273ae5f12adf0353d5aa6f87ad2bbe6ad2ffd439e7ac50c3e11ac28de84`, block `11641304`.

Pool configuration transaction: `0xc2bc26d76f024d9b1185d12986e7e35ab7e1649fa7db761ad1789e3e044811de`, block `11641325`. Pool configuration is one-time and immutable after this call.

First epoch: `[1788624420, 1788628020)`, duration `3600` seconds.

## Live backing and encrypted deposit evidence

The setup path completed on Sepolia:

| Action | Transaction |
| --- | --- |
| Mint test LINK | `0x14dfc51d66021370225c2edb8faa7fc523f6cc9e0fe637784a7cd370cb22d756` |
| Approve Aave Pool | `0x273c8e85b3c0f30b4637515e7cdce1fe939ff539ef2f7713a107fd5c04bd5db5` |
| Supply LINK to Aave | `0x28f0c7e7ed2f6f46d765bc98b8198784973e1f4e42fc13034f977fff10a68039` |
| Approve caLINK wrapper | `0x79cce45336ab2226a78b6effef1917154fdf3581a710721d2d91b1b5a3afa8ce` |
| Shield aLINK as caLINK | `0x8ad517aee42f4d173b802283e19ea24797aa78fc8d70947701ea6fd5798c8de2` |
| Encrypted 9 caLINK pool deposit | `0x5de68dfc1b947d1c3658cf23b22a70f4192f420e58e755932a76f3c7c713a933` |

The encrypted deposit mined in block `11641465`. Wallet-authorized decryption returned exactly `9000000000000000000`, while public application events emitted no plaintext pool-deposit amount.

## Live generated-yield evidence

The aLINK backing grew above `issuedBacking` through Aave's liquidity index. The first harvest transaction was `0x689c372b9e66500aec088c2d77b7c217539936a71bf6489a1477d5eda0b23faa` in block `11641473`.

A second harvest was run with block-pinned invariant checks:

```text
backing before:             10001306058390368437
issued backing before:      10001252749884639112
observed yield before:      53308505729325
harvest transaction:        0x71e50941a7192f69969f79e6eadeb8ab4cb664b8805c0772134ad2ac35c72dcf
harvest block:              11641481
backing after:              10001323827892278211
issued backing after:       10001323827892278211
yield harvested onchain:    71078007639099
new yield at that block:    0
```

The onchain harvested value was slightly larger than the preflight observation because Aave continued accruing before the transaction mined. The post-transaction backing invariant held exactly, and the pool's encrypted reserve changed from handle `0x5a6683352401071b2ef4aae59abbe5def96b985d22ff0000000000aa36a70500` to `0x193433118b1af74b8cd15fd69d0cee608da2b1b079ff0000000000aa36a70500`. No reserve plaintext was exposed.

## Remaining live acceptance steps

- advance and checkpoint epoch 1 after close;
- request and finalize the KMS-proven aggregate denominator;
- request Chainlink VRF after the epoch boundary and bind it through the coordinator;
- commit/open the draw with an encrypted prize not exceeding harvested yield;
- finalize the user TWAB, prepare and settle the encrypted claim, and owner-decrypt only that user's payout;
- withdraw the full `9 caLINK` principal and verify the pool principal becomes zero;
- run the strict final release auditor.

This section must be replaced with final transaction evidence before the release is described as fully live-complete.

## Security and trust boundaries

- `harvestYield` is permissionless but can mint only measured backing surplus and can send it only to the immutable configured pool.
- `issuedBacking` tracks all principal and harvested caLINK liabilities; backing must never be lower than issued backing.
- Safe token movement uses OpenZeppelin `SafeERC20`; external state-changing boundaries use `ReentrancyGuard`.
- The custom caLINK wrapper is not a canonical Zama registry wrapper. This is disclosed in product and submission materials.
- Aave and Zama Protocol availability and correctness remain external dependencies.
- Shield and final public redemption amounts are visible; the confidentiality claim begins inside the caLINK/pool boundary.
- The contracts are pre-audit software and have not received an OpenZeppelin audit.

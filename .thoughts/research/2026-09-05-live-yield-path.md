# Reality Research: Confidential Pool live-yield path

## Outcome update

The research gate is resolved. Aave Sepolia USDT was rejected with protocol error `51` (`SUPPLY_CAP_EXCEEDED`), so the release moved to uncapped Aave Sepolia LINK/aLINK. An application-specific, one-for-one aLINK-backed confidential token now supplies encrypted `caLINK` to the pool. Live Sepolia evidence proves Aave balance growth was harvested only into the encrypted prize reserve. See [`aave-backed-sepolia-release.md`](../../zama-context/08-bounty-pooltogether/aave-backed-sepolia-release.md).

The original facts below capture the decision process before implementation and are retained as historical research.

## Scope

Determine whether the deployed confidential asset can earn real Sepolia lending yield, and identify the verified constraints that a replacement yield-bearing asset must satisfy. This brief records current facts only.

## Sources Checked

- Zama Protocol confidential-wrapper and SDK documentation.
- `zama-ai/protocol-apps` wrapper, registry, deployment runbook, and Sepolia address registry.
- `aave-dao/aave-address-book` current `AaveV3Sepolia` module.
- Ethereum Sepolia contract reads on 2026-09-05.
- Local Confidential Pool contracts and deployment evidence.

## Verified Facts

1. The current pool uses Zama `cUSDTMock` at `0x4E7B06D78965594eB5EF5414c357ca21E1554491`. Its underlying is mock USDT at `0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0`.
2. Aave now publishes an official Ethereum Sepolia V3 module. Its Pool is `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`.
3. Aave Sepolia USDT is `0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0`; its interest-bearing aUSDT is `0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6`.
4. Live Sepolia reads returned symbol `aEthUSDT`, six decimals, and the expected USDT underlying for that aToken. Aave's normalized-income index was greater than `1e27`, confirming that the reserve uses an accrued liquidity index.
5. Aave's Sepolia faucet at `0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D` exposes `mint(address token,address to,uint256 amount)`. A read-only simulation accepted `10,000` USDT units and rejected `1,000,000`, establishing a per-transaction limit between those values for this asset.
6. Zama's official Sepolia wrapper registry contains only the documented mock wrappers and non-mock `ctGBP`; it does not contain a wrapper for Aave Sepolia USDT or aUSDT. Direct registry reads for both addresses returned `(false, address(0))`.
7. The Zama wrapper registry is owner-controlled. Only the Protocol DAO can register a wrapper as canonical.
8. A Zama confidential unwrap burns an encrypted balance, makes the resulting handle publicly decryptable, and requires a later `finalizeUnwrap` call carrying the clear amount and KMS proof. The recipient and final amount become public.
9. The current Confidential Pool keeps principal liquid as confidential tokens, supports encrypted withdrawal requests, and receives prize liquidity through a separate encrypted-yield callback.
10. The currently deployed prize reserve was funded by a designated wallet; it is not linked to an Aave position or strategy-generated surplus.

## Inferences

- The current `cUSDTMock` cannot be deposited directly into Aave because its underlying token is not an Aave Sepolia reserve.
- A confidential token backed by transferable aUSDT can keep principal liquid while its public backing balance accrues Aave interest.
- Any custom aUSDT-backed confidential token would be usable by an explicitly configured application but would not be discoverable as canonical through Zama's registry unless the Protocol DAO registered it.
- Shielding and unshielding necessarily expose public boundary metadata; confidential transfers inside the pool can still hide user deposit, balance, TWAB, and payout amounts.

## Unknowns And Questions

- The live aUSDT supply APY and time required to accrue at least one six-decimal unit for the funded demo position.
- Whether Zama would consider a non-registry application-specific ERC-7984 token acceptable for the bounty.
- Whether the final submission should let users acquire aUSDT in-app or treat aUSDT acquisition as a documented prerequisite.
- Whether Zama expects instant public-USDT redemption or accepts withdrawal back into a confidential aUSDT-backed asset followed by a separate unshield.

## Not Included

- No contract architecture or implementation is approved by this facts-only brief.
- No new token, pool, or strategy has been deployed.
- No claim is made that the existing sponsored reserve satisfies the literal generated-yield requirement.

## Primary references

- <https://github.com/aave-dao/aave-address-book/blob/main/src/AaveV3Sepolia.sol>
- <https://github.com/zama-ai/protocol-apps/blob/main/docs/addresses/testnet/sepolia.md>
- <https://github.com/zama-ai/protocol-apps/blob/main/contracts/confidential-wrapper/contracts/extensions/ERC7984ERC20WrapperUpgradeable.sol>
- <https://github.com/zama-ai/protocol-apps/blob/main/contracts/confidential-token-wrappers-registry/contracts/ConfidentialTokenWrappersRegistry.sol>
- <https://docs.zama.org/protocol/sdk/api-references/sdk/wrappedtoken.md>

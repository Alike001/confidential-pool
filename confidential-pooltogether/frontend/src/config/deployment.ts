export const deployment = {
  chainId: 11155111,
  chainIdHex: "0xaa36a7",
  networkName: "Sepolia",
  pool: "0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88",
  payoutToken: "0x78da50E954d2fC69C10688032c8c07D2ABC52750",
  deploymentTransaction:
    "0x9c69454fa2b58190daf18fbc0c9aed819f07084873a7b1dc9177babd64aabf6f",
  tokenDeploymentTransaction:
    "0xed5d382424bf2a1c6c477e871202c341e4aa0df273af811fa53a956cd80d9f5d",
  deploymentBlock: 11642177,
  firstEpochStart: 1788634200,
  epochDuration: 900,
  tokenDecimals: 18,
  tokenSymbol: "caLINK",
  underlyingSymbol: "LINK",
  aavePool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
  aaveUnderlying: "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5",
  aaveAToken: "0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24",
  aaveFaucet: "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D",
  writesEnabled: true,
  publicRpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorerUrl: "https://sepolia.etherscan.io",
  sourcifyUrl: "https://sourcify.dev/server/v2/contract",
  fheRandomDocsUrl:
    "https://docs.zama.org/protocol/solidity-guides/smart-contract/operations/random",
  sourceUrl:
    "https://github.com/Alike001/fhevm/tree/feature/confidential-pool/library-solidity/examples",
} as const;

export function explorerAddress(address: string) {
  return `${deployment.explorerUrl}/address/${address}`;
}

export function explorerTransaction(hash: string) {
  return `${deployment.explorerUrl}/tx/${hash}`;
}

export function sourcifyContract(address: string) {
  return `${deployment.sourcifyUrl}/${deployment.chainId}/${address}?fields=all`;
}

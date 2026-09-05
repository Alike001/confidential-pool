export const deployment = {
  chainId: 11155111,
  chainIdHex: "0xaa36a7",
  networkName: "Sepolia",
  pool: "0x686227d54223cCF844a57C9D8bf95d1A5bE49B02",
  payoutToken: "0x7885283CB34d02b81e671FEA7404C3c94f594Bdd",
  deploymentTransaction:
    "0x3cf786343f299b4aa4271f3020830b4bf3369dee0822aa811e8c9518ce3df731",
  tokenDeploymentTransaction:
    "0x772241aa88bc5ac1ca9fdacb6170c4e926c067a9744a0e91b2c4ff62589e1f67",
  deploymentBlock: 11641983,
  firstEpochStart: 1788632400,
  epochDuration: 600,
  tokenDecimals: 18,
  tokenSymbol: "caLINK",
  underlyingSymbol: "LINK",
  aavePool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
  aaveUnderlying: "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5",
  aaveAToken: "0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24",
  aaveFaucet: "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D",
  writesEnabled: false,
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

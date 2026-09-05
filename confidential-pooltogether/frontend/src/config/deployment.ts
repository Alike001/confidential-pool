export const deployment = {
  chainId: 11155111,
  chainIdHex: "0xaa36a7",
  networkName: "Sepolia",
  pool: "0xdE9A7DC790e6dE0304A046210044F38904309120",
  payoutToken: "0x4734EC2CC7e18D4C39fccB97E16E77701819655F",
  rngProvider: "0x2387Ac275b6ADa26959c587d93abFbd491A64D5A",
  rngCoordinator: "0xd39ee872B5cb97d7A6576862549DEBF7AE753CeC",
  deploymentTransaction:
    "0xdf86061ad99fea4cc7bc29a079dd47a7480ea9d3c40d8ca8be818761cf1b684a",
  tokenDeploymentTransaction:
    "0x020a0273ae5f12adf0353d5aa6f87ad2bbe6ad2ffd439e7ac50c3e11ac28de84",
  deploymentBlock: 11641324,
  firstEpochStart: 1788624420,
  epochDuration: 3600,
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

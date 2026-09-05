export const deployment = {
  chainId: 11155111,
  chainIdHex: "0xaa36a7",
  networkName: "Sepolia",
  pool: "0xE0d284649E955d03B02F3cf927D60271d41C52D1",
  payoutToken: "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
  rngProvider: "0x2387Ac275b6ADa26959c587d93abFbd491A64D5A",
  rngCoordinator: "0xa90A46B27147C532Bb6844d49d285FEba9819074",
  deploymentTransaction:
    "0x4c42e99536e1d1be439a033a891d1648dc9731d8f8974c0c67d18ffc8cfd85d9",
  deploymentBlock: 11640070,
  firstEpochStart: 1788607872,
  epochDuration: 3600,
  tokenDecimals: 6,
  writesEnabled: true,
  publicRpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorerUrl: "https://sepolia.etherscan.io",
  sourceVerificationUrl:
    "https://sourcify.dev/server/v2/contract/11155111/0xE0d284649E955d03B02F3cf927D60271d41C52D1?fields=all",
  sourceMatchId: "47153193",
} as const;

export function explorerAddress(address: string) {
  return `${deployment.explorerUrl}/address/${address}`;
}

export function explorerTransaction(hash: string) {
  return `${deployment.explorerUrl}/tx/${hash}`;
}

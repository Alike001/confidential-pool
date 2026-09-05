export const deployment = {
  chainId: 11155111,
  chainIdHex: "0xaa36a7",
  networkName: "Sepolia",
  pool: "0x7C942fe70E1C7EA0cC2d1d37fad1018200C3e401",
  payoutToken: "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
  rngProvider: "0x2387Ac275b6ADa26959c587d93abFbd491A64D5A",
  rngCoordinator: "0xcb8bbD71B269E4a64965Cb86F044950f542B6133",
  deploymentTransaction:
    "0x2ec1adbba3797aa7da645dc13276a423d52973db008b6c36651b6d2f36bd7c6e",
  deploymentBlock: 11638643,
  firstEpochStart: 1788590172,
  epochDuration: 3600,
  tokenDecimals: 6,
  writesEnabled: false,
  publicRpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorerUrl: "https://sepolia.etherscan.io",
  sourceVerificationUrl:
    "https://sourcify.dev/server/v2/contract/11155111/0x7C942fe70E1C7EA0cC2d1d37fad1018200C3e401?fields=all",
  sourceMatchId: "47144784",
} as const;

export function explorerAddress(address: string) {
  return `${deployment.explorerUrl}/address/${address}`;
}

export function explorerTransaction(hash: string) {
  return `${deployment.explorerUrl}/tx/${hash}`;
}

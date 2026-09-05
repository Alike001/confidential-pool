export const deployment = {
  chainId: 11155111,
  chainIdHex: "0xaa36a7",
  networkName: "Sepolia",
  pool: "0x7C942fe70E1C7EA0cC2d1d37fad1018200C3e401",
  payoutToken: "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
  rngProvider: "0x2387Ac275b6ADa26959c587d93abFbd491A64D5A",
  rngCoordinator: "0xcb8bbD71B269E4a64965Cb86F044950f542B6133",
  deploymentTransaction:
    "0x9b789a869d8be78bd815aa22e79f355c0b17277842512f9613e889216f105cb5",
  deploymentBlock: 11636762,
  firstEpochStart: 1788567223,
  epochDuration: 1800,
  explorerUrl: "https://sepolia.etherscan.io",
} as const;

export function explorerAddress(address: string) {
  return `${deployment.explorerUrl}/address/${address}`;
}

export function explorerTransaction(hash: string) {
  return `${deployment.explorerUrl}/tx/${hash}`;
}

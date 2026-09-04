export const SEPOLIA_CONFIDENTIAL_USDT = Object.freeze({
  chainId: 11155111,
  symbol: "cUSDTMock",
  decimals: 6,
  wrapperAddress: "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
  underlyingAddress: "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0",
  wrapperRegistryAddress: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
  isMock: true,
});

export const SEPOLIA_NETWORK = Object.freeze({
  chainId: 11155111,
  name: "Ethereum Sepolia",
  blockExplorer: "https://sepolia.etherscan.io",
  confidentialToken: SEPOLIA_CONFIDENTIAL_USDT,
});

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

export const SEPOLIA_CHAINLINK_VRF = Object.freeze({
  provider: "Chainlink VRF v2.5 direct funding",
  linkAddress: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  wrapperAddress: "0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1",
  coordinatorAddress: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
  keyHash:
    "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
  requestConfirmations: 3,
  numWords: 1,
  paymentMode: "native",
});

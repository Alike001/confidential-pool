import assert from "node:assert/strict";
import test from "node:test";

import {
  SEPOLIA_CHAINLINK_VRF,
  SEPOLIA_CONFIDENTIAL_USDT,
  SEPOLIA_NETWORK,
} from "../../src/config/sepolia.mjs";

test("pins the verified Sepolia confidential USDT mock configuration", () => {
  assert.equal(SEPOLIA_NETWORK.chainId, 11155111);
  assert.equal(SEPOLIA_CONFIDENTIAL_USDT.symbol, "cUSDTMock");
  assert.equal(SEPOLIA_CONFIDENTIAL_USDT.decimals, 6);
  assert.equal(SEPOLIA_CONFIDENTIAL_USDT.isMock, true);
  assert.equal(
    SEPOLIA_CONFIDENTIAL_USDT.wrapperAddress,
    "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
  );
  assert.equal(
    SEPOLIA_CONFIDENTIAL_USDT.underlyingAddress,
    "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0",
  );
});

test("pins the published Sepolia Chainlink VRF v2.5 configuration", () => {
  assert.equal(SEPOLIA_CHAINLINK_VRF.provider, "Chainlink VRF v2.5 direct funding");
  assert.equal(SEPOLIA_CHAINLINK_VRF.requestConfirmations, 3);
  assert.equal(SEPOLIA_CHAINLINK_VRF.numWords, 1);
  assert.equal(SEPOLIA_CHAINLINK_VRF.paymentMode, "native");
  assert.equal(
    SEPOLIA_CHAINLINK_VRF.linkAddress,
    "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  );
  assert.equal(
    SEPOLIA_CHAINLINK_VRF.wrapperAddress,
    "0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1",
  );
  assert.equal(
    SEPOLIA_CHAINLINK_VRF.coordinatorAddress,
    "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
  );
});

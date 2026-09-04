import assert from "node:assert/strict";
import test from "node:test";

import {
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

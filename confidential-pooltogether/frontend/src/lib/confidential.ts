import type { EIP1193Provider } from "@zama-fhe/sdk/ethers";
import { BrowserProvider, Contract } from "ethers";
import { deployment } from "../config/deployment";

type Hex = `0x${string}`;

const tokenAbi = [
  "function confidentialTransferAndCall(address to,bytes32 encryptedAmount,bytes inputProof,bytes data) returns (bytes32)",
  "function wrap(address to,uint256 amount) returns (bytes32)",
] as const;

const erc20Abi = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
] as const;

const faucetAbi = [
  "function mint(address token,address to,uint256 amount)",
] as const;

const aavePoolAbi = [
  "function supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)",
] as const;

const writablePoolAbi = [
  "function requestWithdrawal(bytes32 encryptedAmount,bytes inputProof)",
  "function finalizeUser(uint64 epochId,address account)",
  "function prepareClaimWeight(uint64 epochId,uint8 tier,uint32 prizeIndex)",
  "function prepareClaimThreshold(uint64 epochId,uint8 tier,uint32 prizeIndex)",
  "function prepareClaim(uint64 epochId,uint8 tier,uint32 prizeIndex)",
  "function claimPrize(uint64 epochId,uint8 tier,uint32 prizeIndex)",
] as const;

export type ConfidentialActionResult = {
  transactionHash: string;
  blockNumber: number;
};

export type SetupProgress = {
  step: number;
  total: number;
  label: string;
};

async function createSdk(ethereum: EIP1193Provider) {
  const [{ ZamaSDK }, { sepolia }, { createConfig }, { web }] =
    await Promise.all([
      import("@zama-fhe/sdk"),
      import("@zama-fhe/sdk/chains"),
      import("@zama-fhe/sdk/ethers"),
      import("@zama-fhe/sdk/web"),
    ]);
  return new ZamaSDK(
    createConfig({
      chains: [sepolia],
      ethereum,
      relayers: { [sepolia.id]: web() },
    }),
  );
}

async function signerFor(ethereum: EIP1193Provider) {
  return new BrowserProvider(ethereum).getSigner();
}

async function confirmed(transaction: {
  hash: string;
  wait(): Promise<{ status: number | null; blockNumber: number } | null>;
}) {
  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1)
    throw new Error("The Sepolia transaction failed.");
  return {
    transactionHash: transaction.hash,
    blockNumber: receipt.blockNumber,
  };
}

export async function depositConfidential(
  ethereum: EIP1193Provider,
  account: string,
  amount: bigint,
  onSubmitted: (hash: string) => void,
): Promise<ConfidentialActionResult> {
  const sdk = await createSdk(ethereum);
  try {
    const encrypted = await sdk.encrypt({
      values: [{ value: amount, type: "euint64" }],
      contractAddress: deployment.payoutToken,
      userAddress: account as Hex,
    });
    const token = new Contract(
      deployment.payoutToken,
      tokenAbi,
      await signerFor(ethereum),
    );
    const transaction = await token.confidentialTransferAndCall(
      deployment.pool,
      encrypted.encryptedValues[0],
      encrypted.inputProof,
      "0x",
    );
    onSubmitted(transaction.hash);
    return confirmed(transaction);
  } finally {
    sdk.dispose();
  }
}

export async function prepareTestAavePosition(
  ethereum: EIP1193Provider,
  account: string,
  amount: bigint,
  onProgress: (progress: SetupProgress) => void,
  onSubmitted: (hash: string) => void,
): Promise<ConfidentialActionResult> {
  const signer = await signerFor(ethereum);
  const faucet = new Contract(deployment.aaveFaucet, faucetAbi, signer);
  const underlying = new Contract(deployment.aaveUnderlying, erc20Abi, signer);
  const aavePool = new Contract(deployment.aavePool, aavePoolAbi, signer);
  const aToken = new Contract(deployment.aaveAToken, erc20Abi, signer);
  const confidentialToken = new Contract(deployment.payoutToken, tokenAbi, signer);

  async function execute(
    step: number,
    label: string,
    transactionPromise: Promise<{
      hash: string;
      wait(): Promise<{ status: number | null; blockNumber: number } | null>;
    }>,
  ) {
    onProgress({ step, total: 5, label });
    const transaction = await transactionPromise;
    onSubmitted(transaction.hash);
    return confirmed(transaction);
  }

  await execute(
    1,
    `Minting test ${deployment.underlyingSymbol}`,
    faucet.mint(deployment.aaveUnderlying, account, amount),
  );
  await execute(
    2,
    "Approving the Aave pool",
    underlying.approve(deployment.aavePool, amount),
  );
  await execute(
    3,
    "Supplying to Aave",
    aavePool.supply(deployment.aaveUnderlying, amount, account, 0),
  );
  // Aave's scaled-balance rounding can make the freshly minted aToken balance a
  // few wei smaller than the supplied amount. Shield the exact available amount
  // so first-time setup cannot fail at the final transferFrom.
  const aTokenBalance = BigInt(await aToken.balanceOf(account));
  const shieldAmount = aTokenBalance < amount ? aTokenBalance : amount;
  if (shieldAmount === 0n) throw new Error("Aave returned no aToken balance to shield.");
  await execute(
    4,
    "Approving the confidential wrapper",
    aToken.approve(deployment.payoutToken, shieldAmount),
  );
  return execute(
    5,
    `Shielding as ${deployment.tokenSymbol}`,
    confidentialToken.wrap(account, shieldAmount),
  );
}

export async function withdrawConfidential(
  ethereum: EIP1193Provider,
  account: string,
  amount: bigint,
  onSubmitted: (hash: string) => void,
): Promise<ConfidentialActionResult> {
  const sdk = await createSdk(ethereum);
  try {
    const encrypted = await sdk.encrypt({
      values: [{ value: amount, type: "euint128" }],
      contractAddress: deployment.pool,
      userAddress: account as Hex,
    });
    const pool = new Contract(
      deployment.pool,
      writablePoolAbi,
      await signerFor(ethereum),
    );
    const transaction = await pool.requestWithdrawal(
      encrypted.encryptedValues[0],
      encrypted.inputProof,
    );
    onSubmitted(transaction.hash);
    return confirmed(transaction);
  } finally {
    sdk.dispose();
  }
}

export async function finalizeUserEpoch(
  ethereum: EIP1193Provider,
  account: string,
  epochId: number,
  onSubmitted: (hash: string) => void,
): Promise<ConfidentialActionResult> {
  const pool = new Contract(
    deployment.pool,
    writablePoolAbi,
    await signerFor(ethereum),
  );
  const transaction = await pool.finalizeUser(epochId, account);
  onSubmitted(transaction.hash);
  return confirmed(transaction);
}

export async function preparePrivateClaim(
  ethereum: EIP1193Provider,
  epochId: number,
  onSubmitted: (hash: string) => void,
): Promise<ConfidentialActionResult> {
  const pool = new Contract(
    deployment.pool,
    writablePoolAbi,
    await signerFor(ethereum),
  );
  const transaction = await pool.prepareClaim(epochId, 0, 0);
  onSubmitted(transaction.hash);
  return confirmed(transaction);
}

export async function preparePrivateClaimWeight(
  ethereum: EIP1193Provider,
  epochId: number,
  onSubmitted: (hash: string) => void,
): Promise<ConfidentialActionResult> {
  const pool = new Contract(
    deployment.pool,
    writablePoolAbi,
    await signerFor(ethereum),
  );
  const transaction = await pool.prepareClaimWeight(epochId, 0, 0);
  onSubmitted(transaction.hash);
  return confirmed(transaction);
}

export async function preparePrivateClaimThreshold(
  ethereum: EIP1193Provider,
  epochId: number,
  onSubmitted: (hash: string) => void,
): Promise<ConfidentialActionResult> {
  const pool = new Contract(
    deployment.pool,
    writablePoolAbi,
    await signerFor(ethereum),
  );
  const transaction = await pool.prepareClaimThreshold(epochId, 0, 0);
  onSubmitted(transaction.hash);
  return confirmed(transaction);
}

export async function settlePrivateClaim(
  ethereum: EIP1193Provider,
  epochId: number,
  onSubmitted: (hash: string) => void,
): Promise<ConfidentialActionResult> {
  const pool = new Contract(
    deployment.pool,
    writablePoolAbi,
    await signerFor(ethereum),
  );
  const transaction = await pool.claimPrize(epochId, 0, 0);
  onSubmitted(transaction.hash);
  return confirmed(transaction);
}

export async function decryptPoolPosition(
  ethereum: EIP1193Provider,
  encryptedValue: string,
): Promise<bigint> {
  const sdk = await createSdk(ethereum);
  try {
    const handle = encryptedValue as Hex;
    const values = await sdk.decryption.decryptValues([
      { encryptedValue: handle, contractAddress: deployment.pool },
    ]);
    const value = values[handle];
    if (value === undefined)
      throw new Error("The relayer returned no decrypted value.");
    return BigInt(value);
  } finally {
    sdk.dispose();
  }
}

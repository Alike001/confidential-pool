import { Contract, type Provider } from "ethers";

export const poolAbi = [
  "function currentEpochId() view returns (uint64)",
  "function epochDuration() view returns (uint64)",
  "function nextEpochToFinalize(address account) view returns (uint64)",
  "function epochInfo(uint64 epochId) view returns (uint64 start,uint64 end,bool totalFinalized,bool aggregateDecryptionRequested,bool aggregateFinalized,uint128 aggregateSupply)",
  "function drawInfo(uint64 epochId) view returns (uint128 aggregateSupply,uint128 tierOdds,uint128 vaultContributionFraction,uint256 randomNumber,uint32 rngRequestId,bool committed,bool opened)",
  "function encryptedBalance(address account) view returns (bytes32)",
  "function encryptedUserTwab(uint64 epochId,address account) view returns (bytes32)",
  "function encryptedClaimablePrize(address account,uint64 epochId,uint8 tier,uint32 prizeIndex) view returns (bytes32)",
  "function claimPrepared(address account,uint64 epochId,uint8 tier,uint32 prizeIndex) view returns (bool)",
  "function claimed(address account,uint64 epochId,uint8 tier,uint32 prizeIndex) view returns (bool)",
] as const;

export type ClaimEpochSnapshot = {
  epochId: number;
  drawOpened: boolean;
  encryptedTwabHandle: string;
  encryptedPayoutHandle: string;
  claimPrepared: boolean;
  claimed: boolean;
};

export type PoolSnapshot = {
  epochId: number;
  epochStart: number;
  epochEnd: number;
  chainTimestamp: number;
  totalFinalized: boolean;
  aggregateDecryptionRequested: boolean;
  aggregateFinalized: boolean;
  aggregateSupply: bigint;
  rngRequestId: number;
  drawCommitted: boolean;
  drawOpened: boolean;
  encryptedBalanceHandle?: string;
  encryptedTwabHandle?: string;
  encryptedPayoutHandle?: string;
  claimPrepared?: boolean;
  claimed?: boolean;
  nextEpochToFinalize?: number;
  claimEpoch?: ClaimEpochSnapshot;
};

export async function readPoolSnapshot(
  provider: Provider,
  poolAddress: string,
  account?: string,
): Promise<PoolSnapshot> {
  const pool = new Contract(poolAddress, poolAbi, provider);
  const epochId = Number(await pool.currentEpochId());
  const [epoch, draw, latestBlock] = await Promise.all([
    pool.epochInfo(epochId),
    pool.drawInfo(epochId),
    provider.getBlock("latest"),
  ]);

  if (!latestBlock) throw new Error("Latest Sepolia block is unavailable.");

  const snapshot: PoolSnapshot = {
    epochId,
    epochStart: Number(epoch.start),
    epochEnd: Number(epoch.end),
    chainTimestamp: latestBlock.timestamp,
    totalFinalized: epoch.totalFinalized,
    aggregateDecryptionRequested: epoch.aggregateDecryptionRequested,
    aggregateFinalized: epoch.aggregateFinalized,
    aggregateSupply: epoch.aggregateSupply,
    rngRequestId: Number(draw.rngRequestId),
    drawCommitted: draw.committed,
    drawOpened: draw.opened,
  };

  if (account) {
    const [balance, twab, payout, prepared, claimed, nextEpoch] =
      await Promise.all([
        pool.encryptedBalance(account),
        pool.encryptedUserTwab(epochId, account),
        pool.encryptedClaimablePrize(account, epochId, 0, 0),
        pool.claimPrepared(account, epochId, 0, 0),
        pool.claimed(account, epochId, 0, 0),
        pool.nextEpochToFinalize(account),
      ]);
    snapshot.encryptedBalanceHandle = balance;
    snapshot.encryptedTwabHandle = twab;
    snapshot.encryptedPayoutHandle = payout;
    snapshot.claimPrepared = prepared;
    snapshot.claimed = claimed;
    snapshot.nextEpochToFinalize = Number(nextEpoch);

    if (epochId > 1) {
      const claimEpochId = epochId - 1;
      const [claimDraw, claimTwab, claimPayout, claimPrepared, claimClaimed] =
        await Promise.all([
          pool.drawInfo(claimEpochId),
          pool.encryptedUserTwab(claimEpochId, account),
          pool.encryptedClaimablePrize(account, claimEpochId, 0, 0),
          pool.claimPrepared(account, claimEpochId, 0, 0),
          pool.claimed(account, claimEpochId, 0, 0),
        ]);
      snapshot.claimEpoch = {
        epochId: claimEpochId,
        drawOpened: claimDraw.opened,
        encryptedTwabHandle: claimTwab,
        encryptedPayoutHandle: claimPayout,
        claimPrepared,
        claimed: claimClaimed,
      };
    }
  }

  return snapshot;
}

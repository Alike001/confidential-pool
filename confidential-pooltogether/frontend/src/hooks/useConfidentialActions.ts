import { parseUnits } from "ethers";
import { useCallback, useState } from "react";
import type { EIP1193Provider } from "@zama-fhe/sdk/ethers";
import { deployment, explorerTransaction } from "../config/deployment";
import {
  decryptPoolPosition,
  depositConfidential,
  finalizeUserEpoch,
  prepareTestAavePosition,
  preparePrivateClaim,
  preparePrivateClaimThreshold,
  preparePrivateClaimWeight,
  settlePrivateClaim,
  withdrawConfidential,
  type ConfidentialActionResult,
  type SetupProgress,
} from "../lib/confidential";

export type OperationStage =
  "idle" | "encrypting" | "wallet" | "submitted" | "confirmed" | "error";

type Options = {
  ethereum?: EIP1193Provider;
  account?: string;
  isSepolia: boolean;
  refresh(): Promise<void>;
};

function messageFor(reason: unknown) {
  if (reason instanceof Error && reason.message) return reason.message;
  return "The confidential operation could not be completed.";
}

export function useConfidentialActions({
  ethereum,
  account,
  isSepolia,
  refresh,
}: Options) {
  const [stage, setStage] = useState<OperationStage>("idle");
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<ConfidentialActionResult>();
  const [setupProgress, setSetupProgress] = useState<SetupProgress>();

  const parseAmount = useCallback((amountText: string) => {
    const normalizedAmount = amountText.trim();
    const decimals = deployment.tokenDecimals;
    const pattern = new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`);
    if (!pattern.test(normalizedAmount)) {
      throw new Error(
        `Enter a valid amount with no more than ${decimals} decimal places.`,
      );
    }
    const amount = parseUnits(normalizedAmount, decimals);
    if (amount <= 0n) throw new Error("Enter an amount greater than zero.");
    if (amount > (1n << 64n) - 1n) {
      throw new Error("This amount exceeds the encrypted token limit.");
    }
    return amount;
  }, []);

  const run = useCallback(
    async (kind: "deposit" | "withdraw", amountText: string) => {
      if (!deployment.writesEnabled)
        throw new Error(
          "Writes remain locked until the strict recurring lifecycle audit passes.",
        );
      if (!ethereum || !account) throw new Error("Connect a wallet first.");
      if (!isSepolia) throw new Error("Switch your wallet to Sepolia first.");
      setError(undefined);
      setResult(undefined);
      try {
        const amount = parseAmount(amountText);
        setStage("encrypting");
        const action =
          kind === "deposit" ? depositConfidential : withdrawConfidential;
        setStage("wallet");
        const nextResult = await action(ethereum, account, amount, () =>
          setStage("submitted"),
        );
        setResult(nextResult);
        setStage("confirmed");
        await refresh();
        return nextResult;
      } catch (reason) {
        setError(messageFor(reason));
        setStage("error");
        throw reason;
      }
    },
    [account, ethereum, isSepolia, parseAmount, refresh],
  );

  const setupAave = useCallback(
    async (amountText: string) => {
      if (!ethereum || !account) throw new Error("Connect a wallet first.");
      if (!isSepolia) throw new Error("Switch your wallet to Sepolia first.");
      setError(undefined);
      setResult(undefined);
      setSetupProgress(undefined);
      try {
        const amount = parseAmount(amountText);
        setStage("wallet");
        const nextResult = await prepareTestAavePosition(
          ethereum,
          account,
          amount,
          setSetupProgress,
          () => setStage("submitted"),
        );
        setResult(nextResult);
        setStage("confirmed");
        await refresh();
        return nextResult;
      } catch (reason) {
        setError(messageFor(reason));
        setStage("error");
        throw reason;
      }
    },
    [account, ethereum, isSepolia, parseAmount, refresh],
  );

  const decrypt = useCallback(
    async (encryptedValue: string) => {
      if (!ethereum || !account) throw new Error("Connect a wallet first.");
      if (!isSepolia) throw new Error("Switch your wallet to Sepolia first.");
      return decryptPoolPosition(ethereum, encryptedValue);
    },
    [account, ethereum, isSepolia],
  );

  const runPublicAction = useCallback(
    async (kind: "finalize" | "prepare-weight" | "prepare-threshold" | "prepare" | "claim", epochId: number) => {
      if (!deployment.writesEnabled)
        throw new Error(
          "Writes remain locked until the strict recurring lifecycle audit passes.",
        );
      if (!ethereum || !account) throw new Error("Connect a wallet first.");
      if (!isSepolia) throw new Error("Switch your wallet to Sepolia first.");

      setError(undefined);
      setResult(undefined);
      setStage("wallet");
      try {
        const onSubmitted = () => setStage("submitted" as const);
        const nextResult =
          kind === "finalize"
            ? await finalizeUserEpoch(ethereum, account, epochId, onSubmitted)
            : kind === "prepare-weight"
              ? await preparePrivateClaimWeight(ethereum, epochId, onSubmitted)
              : kind === "prepare-threshold"
                ? await preparePrivateClaimThreshold(ethereum, epochId, onSubmitted)
            : kind === "prepare"
              ? await preparePrivateClaim(ethereum, epochId, onSubmitted)
              : await settlePrivateClaim(ethereum, epochId, onSubmitted);
        setResult(nextResult);
        setStage("confirmed");
        await refresh();
        return nextResult;
      } catch (reason) {
        setError(messageFor(reason));
        setStage("error");
        throw reason;
      }
    },
    [account, ethereum, isSepolia, refresh],
  );

  return {
    stage,
    error,
    result,
    transactionUrl: result
      ? explorerTransaction(result.transactionHash)
      : undefined,
    reset: () => {
      setStage("idle");
      setError(undefined);
      setResult(undefined);
      setSetupProgress(undefined);
    },
    run,
    setupAave,
    setupProgress,
    decrypt,
    finalize: (epochId: number) => runPublicAction("finalize", epochId),
    prepareClaimWeight: (epochId: number) => runPublicAction("prepare-weight", epochId),
    prepareClaimThreshold: (epochId: number) => runPublicAction("prepare-threshold", epochId),
    prepareClaim: (epochId: number) => runPublicAction("prepare", epochId),
    claimPrize: (epochId: number) => runPublicAction("claim", epochId),
  };
}

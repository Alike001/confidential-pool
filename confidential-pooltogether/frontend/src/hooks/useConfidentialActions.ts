import { parseUnits } from "ethers";
import { useCallback, useState } from "react";
import type { EIP1193Provider } from "@zama-fhe/sdk/ethers";
import { deployment, explorerTransaction } from "../config/deployment";
import {
  decryptPoolPosition,
  depositConfidential,
  finalizeUserEpoch,
  preparePrivateClaim,
  settlePrivateClaim,
  withdrawConfidential,
  type ConfidentialActionResult,
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
        const normalizedAmount = amountText.trim();
        if (!/^\d+(?:\.\d{1,6})?$/.test(normalizedAmount)) {
          throw new Error("Enter a valid amount with no more than 6 decimal places.");
        }
        const amount = parseUnits(normalizedAmount, deployment.tokenDecimals);
        if (amount <= 0n) throw new Error("Enter an amount greater than zero.");
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
    [account, ethereum, isSepolia, refresh],
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
    async (kind: "finalize" | "prepare" | "claim", epochId: number) => {
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
    },
    run,
    decrypt,
    finalize: (epochId: number) => runPublicAction("finalize", epochId),
    prepareClaim: (epochId: number) => runPublicAction("prepare", epochId),
    claimPrize: (epochId: number) => runPublicAction("claim", epochId),
  };
}

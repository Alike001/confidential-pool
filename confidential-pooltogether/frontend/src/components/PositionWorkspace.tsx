import { formatUnits } from "ethers";
import { useState } from "react";
import { deployment } from "../config/deployment";
import type { OperationStage } from "../hooks/useConfidentialActions";
import type { PoolSnapshot } from "../lib/pool";
import { LockIcon, WalletIcon } from "./Icons";

type Props = {
  connected: boolean;
  isSepolia: boolean;
  snapshot?: PoolSnapshot;
  onConnect(): void;
  onSwitchNetwork(): void;
  operation: {
    stage: OperationStage;
    error?: string;
    result?: { blockNumber: number };
    transactionUrl?: string;
    setupProgress?: { step: number; total: number; label: string };
    reset(): void;
    run(kind: "deposit" | "withdraw", amount: string): Promise<unknown>;
    setupAave(amount: string): Promise<unknown>;
  };
};

const stages: OperationStage[] = [
  "encrypting",
  "wallet",
  "submitted",
  "confirmed",
];

export function PositionWorkspace({
  connected,
  isSepolia,
  snapshot,
  onConnect,
  onSwitchNetwork,
  operation,
}: Props) {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState<string>();
  const busy = ["encrypting", "wallet", "submitted"].includes(operation.stage);
  const open = snapshot
    ? snapshot.chainTimestamp >= snapshot.epochStart &&
      snapshot.chainTimestamp < snapshot.epochEnd
    : false;

  async function handleAction() {
    if (!connected) return onConnect();
    if (!isSepolia) return onSwitchNetwork();
    if (!deployment.writesEnabled) {
      setNotice(
        "Encrypted writes are implemented but remain locked until the strict recurring lifecycle audit passes.",
      );
      return;
    }
    if (!open) {
      setNotice(
        "Deposits and withdrawals are available only while the current epoch is open.",
      );
      return;
    }
    setNotice(undefined);
    try {
      await operation.run(tab, amount);
      setAmount("");
    } catch {
      // The hook exposes a user-facing error and keeps the rejected/failed state visible.
    }
  }

  async function handleSetup() {
    if (!connected) return onConnect();
    if (!isSepolia) return onSwitchNetwork();
    setNotice(undefined);
    try {
      await operation.setupAave("1");
      setNotice(
        `1 ${deployment.tokenSymbol} is ready. You can now make a confidential deposit.`,
      );
    } catch {
      // The hook keeps the failed setup state visible.
    }
  }

  function selectTab(nextTab: "deposit" | "withdraw") {
    setTab(nextTab);
    setNotice(undefined);
    operation.reset();
  }

  return (
    <section className="position-section" aria-labelledby="position-title">
      <h2 className="visually-hidden" id="position-title">
        Deposit or withdraw
      </h2>
      <div
        className="position-tabs"
        role="tablist"
        aria-label="Position action"
      >
        <button
          className={tab === "deposit" ? "is-selected" : ""}
          type="button"
          role="tab"
          aria-selected={tab === "deposit"}
          onClick={() => selectTab("deposit")}
        >
          <span>01</span> Deposit
        </button>
        <button
          className={tab === "withdraw" ? "is-selected" : ""}
          type="button"
          role="tab"
          aria-selected={tab === "withdraw"}
          onClick={() => selectTab("withdraw")}
        >
          <span>02</span> Withdraw
        </button>
      </div>
      <div className="position-body">
        {tab === "deposit" ? (
          <div className="setup-rail">
            <div>
              <span className="setup-kicker">First time on Sepolia?</span>
              <strong>Prepare 1 {deployment.tokenSymbol}</strong>
              <small>
                Test {deployment.underlyingSymbol} → Aave yield position → confidential wrapper.
                This setup boundary is public; your pool deposit is encrypted.
              </small>
            </div>
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={() => void handleSetup()}
            >
              {operation.setupProgress
                ? `${operation.setupProgress.step}/${operation.setupProgress.total} ${operation.setupProgress.label}`
                : "Prepare asset"}
            </button>
          </div>
        ) : null}
        <label className="amount-label" htmlFor="position-amount">
          <span>Amount to {tab}</span>
          <span>Balance ••••••</span>
        </label>
        <div className="amount-row">
          <input
            id="position-amount"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <strong>{deployment.tokenSymbol}</strong>
        </div>
        <div className="amount-helper">
          <span>
            {tab === "deposit"
              ? "Your amount is encrypted before it reaches the pool."
              : "Principal remains withdrawable during an open epoch."}
          </span>
          <button type="button" onClick={() => setAmount("1")}>
            Use 1 {deployment.tokenSymbol}
          </button>
        </div>
        {notice ? (
          <p className="operation-notice" role="status">
            {notice}
          </p>
        ) : null}
        {operation.error ? (
          <p className="operation-notice operation-error" role="alert">
            {operation.error}
          </p>
        ) : null}
        {operation.transactionUrl ? (
          <p className="operation-notice" role="status">
            Confirmed in block {operation.result?.blockNumber}.{" "}
            <a href={operation.transactionUrl} target="_blank" rel="noreferrer">
              View transaction
            </a>
            .
          </p>
        ) : null}
        <div className="position-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={busy}
            onClick={() => void handleAction()}
          >
            {connected ? <LockIcon /> : <WalletIcon />}
            {!connected
              ? "Connect wallet"
              : busy
                ? "Working…"
                : tab === "deposit"
                  ? "Encrypt & deposit"
                  : "Encrypt & withdraw"}
          </button>
        </div>
        <div
          className="operation-steps"
          aria-label={`${tab} transaction stages`}
        >
          {[
            ["1", "Encrypting", "Preparing confidential input"],
            ["2", "Wallet approval", "Confirm in your wallet"],
            ["3", "Submitted", "Sent to Sepolia"],
            ["4", "Confirmed", "Recorded onchain"],
          ].map(([number, title, copy], index) => {
            const currentIndex = stages.indexOf(operation.stage);
            const className =
              index === currentIndex
                ? "operation-step is-current"
                : index < currentIndex
                  ? "operation-step is-complete"
                  : "operation-step";
            return (
              <div className={className} key={number}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{copy}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type PrivatePositionProps = {
  connected: boolean;
  isSepolia: boolean;
  snapshot?: PoolSnapshot;
  onConnect(): void;
  onSwitchNetwork(): void;
  onDecrypt(encryptedValue: string): Promise<bigint>;
  operation: {
    stage: OperationStage;
    error?: string;
    transactionUrl?: string;
    finalize(epochId: number): Promise<unknown>;
    prepareClaimWeight(epochId: number): Promise<unknown>;
    prepareClaimThreshold(epochId: number): Promise<unknown>;
    prepareClaim(epochId: number): Promise<unknown>;
    claimPrize(epochId: number): Promise<unknown>;
  };
};

export function PrivatePositionCard({
  connected,
  isSepolia,
  snapshot,
  onConnect,
  onSwitchNetwork,
  onDecrypt,
  operation,
}: PrivatePositionProps) {
  const [notice, setNotice] = useState<string>();
  const [decryptedBalance, setDecryptedBalance] = useState<bigint>();
  const [decryptedPrize, setDecryptedPrize] = useState<bigint>();
  const [decrypting, setDecrypting] = useState(false);
  const hasEncryptedPosition = Boolean(
    snapshot?.encryptedBalanceHandle &&
    !/^0x0+$/.test(snapshot.encryptedBalanceHandle),
  );
  const pendingCheckpoint =
    snapshot?.nextEpochToFinalize &&
    snapshot.nextEpochToFinalize < snapshot.epochId
      ? snapshot.nextEpochToFinalize
      : undefined;
  const claimEpoch = snapshot?.claimEpoch;
  const hasClaimTwab = Boolean(
    claimEpoch?.encryptedTwabHandle &&
    !/^0x0+$/.test(claimEpoch.encryptedTwabHandle),
  );
  const hasPayout = Boolean(
    claimEpoch?.encryptedPayoutHandle &&
    !/^0x0+$/.test(claimEpoch.encryptedPayoutHandle),
  );
  const operationBusy = ["encrypting", "wallet", "submitted"].includes(
    operation.stage,
  );

  async function decrypt() {
    if (!connected) return onConnect();
    if (!isSepolia) return onSwitchNetwork();
    if (!snapshot?.encryptedBalanceHandle || !hasEncryptedPosition) {
      setNotice("No encrypted position is available for this wallet.");
      return;
    }
    setDecrypting(true);
    setNotice(undefined);
    try {
      setDecryptedBalance(await onDecrypt(snapshot.encryptedBalanceHandle));
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Unable to decrypt this position.",
      );
    } finally {
      setDecrypting(false);
    }
  }

  async function decryptPrize() {
    if (!connected) return onConnect();
    if (!isSepolia) return onSwitchNetwork();
    if (!claimEpoch?.encryptedPayoutHandle || !hasPayout) {
      setNotice("No encrypted prize result is available for this wallet.");
      return;
    }
    setDecrypting(true);
    setNotice(undefined);
    try {
      setDecryptedPrize(await onDecrypt(claimEpoch.encryptedPayoutHandle));
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Unable to decrypt this prize.",
      );
    } finally {
      setDecrypting(false);
    }
  }

  async function runPrivateAction(action: () => Promise<unknown>) {
    if (!connected) return onConnect();
    if (!isSepolia) return onSwitchNetwork();
    setNotice(undefined);
    try {
      await action();
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Unable to complete this transaction.",
      );
    }
  }
  return (
    <section
      className="private-position-card"
      aria-labelledby="private-position-title"
    >
      <div className="private-position-title">
        <div>
          <span className="section-label">Your position</span>
          <h2 id="private-position-title">Encrypted by default.</h2>
        </div>
        <LockIcon />
      </div>
      <div className="private-position-list">
        <div>
          <span>Balance</span>
          <strong>
            {decryptedBalance === undefined
              ? hasEncryptedPosition
                ? `•••••• ${deployment.tokenSymbol}`
                : "No encrypted position"
              : `${formatUnits(decryptedBalance, deployment.tokenDecimals)} ${deployment.tokenSymbol}`}
          </strong>
        </div>
        <div>
          <span>TWAB</span>
          <strong>
            {hasClaimTwab ? "Encrypted checkpoint ready" : "••••••"}
          </strong>
        </div>
        <div>
          <span>Winning zone</span>
          <strong>••••••</strong>
        </div>
        <div>
          <span>Prize result</span>
          <strong>
            {decryptedPrize !== undefined
              ? `${formatUnits(decryptedPrize, deployment.tokenDecimals)} ${deployment.tokenSymbol}`
              : claimEpoch?.drawOpened
                ? "Encrypted result ready"
                : "Pending draw"}
          </strong>
        </div>
      </div>
      <p className="private-result-copy">
        {claimEpoch?.drawOpened
          ? "Your result is ready. Decrypt privately to learn the outcome."
          : "Your values remain ciphertext until you authorize decryption."}
      </p>
      {notice ? (
        <p className="operation-notice" role="status">
          {notice}
        </p>
      ) : null}
      {operation.error && !notice ? (
        <p className="operation-notice operation-error" role="alert">
          {operation.error}
        </p>
      ) : null}
      {pendingCheckpoint ? (
        <button
          className="button button-secondary private-decrypt-button"
          type="button"
          disabled={operationBusy}
          onClick={() =>
            void runPrivateAction(() => operation.finalize(pendingCheckpoint))
          }
        >
          Finalize epoch #{pendingCheckpoint} checkpoint
        </button>
      ) : null}
      {claimEpoch?.drawOpened && hasClaimTwab && !claimEpoch.claimWeightPrepared ? (
        <button
          className="button button-secondary private-decrypt-button"
          type="button"
          disabled={operationBusy}
          onClick={() =>
            void runPrivateAction(() =>
              operation.prepareClaimWeight(claimEpoch.epochId),
            )
          }
        >
          Prepare epoch #{claimEpoch.epochId} encrypted weight
        </button>
      ) : null}
      {claimEpoch?.claimWeightPrepared && !claimEpoch.claimThresholdPrepared ? (
        <button
          className="button button-secondary private-decrypt-button"
          type="button"
          disabled={operationBusy}
          onClick={() =>
            void runPrivateAction(() =>
              operation.prepareClaimThreshold(claimEpoch.epochId),
            )
          }
        >
          Prepare epoch #{claimEpoch.epochId} random threshold
        </button>
      ) : null}
      {claimEpoch?.claimThresholdPrepared && !claimEpoch.claimPrepared ? (
        <button
          className="button button-secondary private-decrypt-button"
          type="button"
          disabled={operationBusy}
          onClick={() =>
            void runPrivateAction(() =>
              operation.prepareClaim(claimEpoch.epochId),
            )
          }
        >
          Run epoch #{claimEpoch.epochId} encrypted FHE draw
        </button>
      ) : null}
      {claimEpoch?.claimPrepared && !claimEpoch.claimed ? (
        <button
          className="button button-secondary private-decrypt-button"
          type="button"
          disabled={operationBusy}
          onClick={() =>
            void runPrivateAction(() =>
              operation.claimPrize(claimEpoch.epochId),
            )
          }
        >
          Claim epoch #{claimEpoch.epochId} prize
        </button>
      ) : null}
      {operation.transactionUrl ? (
        <a
          className="private-transaction-link"
          href={operation.transactionUrl}
          target="_blank"
          rel="noreferrer"
        >
          View latest transaction
        </a>
      ) : null}
      <button
        className="button button-primary private-decrypt-button"
        type="button"
        disabled={decrypting}
        onClick={() =>
          void (claimEpoch?.claimed && hasPayout ? decryptPrize() : decrypt())
        }
      >
        <LockIcon />{" "}
        {decrypting
          ? "Decrypting…"
          : claimEpoch?.claimed && hasPayout
            ? "Decrypt my prize"
            : "Decrypt my position"}
      </button>
    </section>
  );
}

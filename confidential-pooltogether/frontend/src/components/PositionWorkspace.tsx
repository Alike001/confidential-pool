import { useState } from "react";
import type { PoolSnapshot } from "../lib/pool";
import { LockIcon, WalletIcon } from "./Icons";

type Props = {
  connected: boolean;
  isSepolia: boolean;
  snapshot?: PoolSnapshot;
  onConnect(): void;
  onSwitchNetwork(): void;
};

export function PositionWorkspace({ connected, isSepolia, snapshot, onConnect, onSwitchNetwork }: Props) {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState<string>();
  function handleAction() {
    if (!connected) return onConnect();
    if (!isSepolia) return onSwitchNetwork();
    setNotice("Encrypted writes are locked while the recurring Sepolia lifecycle audit is completed.");
  }

  return (
    <section className="position-section" aria-labelledby="position-title">
      <h2 className="visually-hidden" id="position-title">Deposit or withdraw</h2>
      <div className="position-tabs" role="tablist" aria-label="Position action">
        <button className={tab === "deposit" ? "is-selected" : ""} type="button" role="tab" aria-selected={tab === "deposit"} onClick={() => setTab("deposit")}>
          <span>01</span> Deposit
        </button>
        <button className={tab === "withdraw" ? "is-selected" : ""} type="button" role="tab" aria-selected={tab === "withdraw"} onClick={() => setTab("withdraw")}>
          <span>02</span> Withdraw
        </button>
      </div>
      <div className="position-body">
        <label className="amount-label" htmlFor="position-amount">
          <span>Amount to {tab}</span>
          <span>Balance ••••••</span>
        </label>
        <div className="amount-row">
          <input id="position-amount" inputMode="decimal" placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <strong>cUSDTMock</strong>
        </div>
        <div className="amount-helper">
          <span>{tab === "deposit" ? "Your amount is encrypted before it reaches the pool." : "Principal remains withdrawable during an open epoch."}</span>
          <button type="button" onClick={() => setAmount("1000000")}>Use max</button>
        </div>
        {notice ? <p className="operation-notice" role="status">{notice}</p> : null}
        <div className="position-actions">
          <button className="button button-primary" type="button" onClick={handleAction}>
            {connected ? <LockIcon /> : <WalletIcon />}
            {!connected ? "Connect wallet" : tab === "deposit" ? "Encrypt & deposit" : "Encrypt & withdraw"}
          </button>
        </div>
        <div className="operation-steps" aria-label={`${tab} transaction stages`}>
          {[
            ["1", "Encrypting", "Preparing confidential input"],
            ["2", "Wallet approval", "Confirm in your wallet"],
            ["3", "Submitted", "Sent to Sepolia"],
            ["4", "Confirmed", "Recorded onchain"],
          ].map(([number, title, copy], index) => (
            <div className={index === 0 ? "operation-step is-current" : "operation-step"} key={number}>
              <span>{number}</span><div><strong>{title}</strong><small>{copy}</small></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PrivatePositionCard({ snapshot }: { snapshot?: PoolSnapshot }) {
  const [notice, setNotice] = useState<string>();
  const hasEncryptedPosition = Boolean(snapshot?.encryptedBalanceHandle && !/^0x0+$/.test(snapshot.encryptedBalanceHandle));
  return (
    <section className="private-position-card" aria-labelledby="private-position-title">
      <div className="private-position-title">
        <div>
          <span className="section-label">Your position</span>
          <h2 id="private-position-title">Encrypted by default.</h2>
        </div>
        <LockIcon />
      </div>
      <div className="private-position-list">
        <div><span>Balance</span><strong>{hasEncryptedPosition ? "•••••• cUSDTMock" : "No encrypted position"}</strong></div>
        <div><span>TWAB</span><strong>••••••</strong></div>
        <div><span>Winning zone</span><strong>••••••</strong></div>
        <div><span>Prize result</span><strong>{snapshot?.drawOpened ? "Encrypted result ready" : "Pending draw"}</strong></div>
      </div>
      <p className="private-result-copy">{snapshot?.drawOpened ? "Your result is ready. Decrypt privately to learn the outcome." : "Your values remain ciphertext until you authorize decryption."}</p>
      {notice ? <p className="operation-notice" role="status">{notice}</p> : null}
      <button className="button button-primary private-decrypt-button" type="button" onClick={() => setNotice("User-authorized decryption will be enabled with the Zama browser integration.")}>
        <LockIcon /> Decrypt my position
      </button>
    </section>
  );
}

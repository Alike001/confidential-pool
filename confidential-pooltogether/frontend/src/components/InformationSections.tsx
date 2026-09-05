import { deployment, explorerAddress, explorerTransaction, sourcifyContract } from "../config/deployment";
import { shorten } from "../lib/format";
import type { PoolSnapshot } from "../lib/pool";
import { ArrowIcon, CopyIcon, LockIcon } from "./Icons";

export function HowItWorks() {
  const steps = [
    ["01", "Shield", "Aave aLINK is wrapped into caLINK. This acquisition boundary is public and one-time."],
    ["02", "Deposit", "Your caLINK amount enters the shared pool as ciphertext and begins building a private TWAB."],
    ["03", "Draw", "Aave's generated yield funds the prize while Zama generates each weighted random sample inside FHE."],
    ["04", "Claim", "Zama evaluates your winning zone over encrypted balances; only you can decrypt the payout."],
  ];
  return (
    <section className="how-section grid-paper" id="how-it-works">
      <div className="section-intro">
        <span className="section-label">How value moves</span>
        <h2>Yield in.<br />Secrets intact.</h2>
      </div>
      <div className="step-list">
        {steps.map(([number, title, copy]) => (
          <article key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PrivacyBoundary() {
  return (
    <section className="privacy-section" id="privacy">
      <div className="section-intro">
        <span className="section-label">Privacy boundary</span>
        <h2>The split is the feature.</h2>
        <p>The public side proves where yield came from and where the encrypted draw ran. The private side protects your financial position.</p>
      </div>
      <div className="privacy-table">
        <div className="public-column">
          <h3>Public</h3>
          <ul>
            <li>Draw ID and epoch timing</li>
            <li>Aave shield amount and aggregate yield</li>
            <li>FHE draw and claim transactions</li>
            <li>Aggregate TWAB after KMS proof</li>
            <li>Lifecycle transactions and claimant identity</li>
          </ul>
        </div>
        <div>
          <h3><LockIcon /> Private</h3>
          <ul>
            <li>Your pool deposit amount and balance</li>
            <li>Your time-weighted balance</li>
            <li>Your winning zone and payout</li>
            <li>Your FHE random sample</li>
            <li>Every other participant's position</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function EvidenceRow({ label, detail, value, href }: { label: string; detail: string; value: string; href: string }) {
  async function copy() {
    await navigator.clipboard.writeText(value);
  }
  return (
    <div className="evidence-row">
      <div className="evidence-icon"><LockIcon /></div>
      <div className="evidence-copy"><strong>{label}</strong><span>{detail}</span></div>
      <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${label} evidence`}>{shorten(value, 8, 6)} <ArrowIcon /></a>
      <button type="button" onClick={() => void copy()} aria-label={`Copy ${label}`}><CopyIcon /></button>
    </div>
  );
}

export function EvidenceSection({ snapshot }: { snapshot?: PoolSnapshot }) {
  return (
    <section className="evidence-section" id="fairness">
      <div className="section-intro">
        <span className="section-label">Fairness record</span>
        <h2>Evidence, not promises.</h2>
        <p>Aave produces the yield. Zama generates encrypted randomness and evaluates deposit-weighted eligibility without publishing the sample, weight, or payout.</p>
      </div>
      <div className="evidence-table">
        <div className="evidence-title"><strong>Public protocol evidence</strong><span>Live on Sepolia</span></div>
        <EvidenceRow label="Recurring pool" detail={`Epoch ${snapshot?.epochId ?? "—"} · block ${deployment.deploymentBlock}`} value={deployment.pool} href={explorerAddress(deployment.pool)} />
        <EvidenceRow label="Aave yield market" detail="Uncapped Sepolia LINK reserve" value={deployment.aavePool} href={explorerAddress(deployment.aavePool)} />
        <EvidenceRow label="Interest-bearing backing" detail="Aave Sepolia aLINK" value={deployment.aaveAToken} href={explorerAddress(deployment.aaveAToken)} />
        <EvidenceRow label="FHE randomness" detail="Zama's transaction-only encrypted PRNG" value="FHE.randEuint64" href={deployment.fheRandomDocsUrl} />
        <EvidenceRow label="Confidential token" detail="aLINK-backed caLINK wrapper" value={deployment.payoutToken} href={explorerAddress(deployment.payoutToken)} />
        <EvidenceRow label="Pool source match" detail="Creation and runtime bytecode matched by Sourcify" value={deployment.pool} href={sourcifyContract(deployment.pool)} />
        <EvidenceRow label="caLINK source match" detail="Creation and runtime bytecode matched by Sourcify" value={deployment.payoutToken} href={sourcifyContract(deployment.payoutToken)} />
        <EvidenceRow label="Deployment transaction" detail="Recurring candidate deployment" value={deployment.deploymentTransaction} href={explorerTransaction(deployment.deploymentTransaction)} />
        <EvidenceRow label="Application source" detail="FHE pool, yield wrapper, tests, and scripts" value="feature/confidential-pool" href={deployment.sourceUrl} />
      </div>
    </section>
  );
}

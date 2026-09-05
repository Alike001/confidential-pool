import { deployment, explorerAddress, explorerTransaction } from "../config/deployment";
import { shorten } from "../lib/format";
import type { PoolSnapshot } from "../lib/pool";
import { ArrowIcon, CopyIcon, LockIcon } from "./Icons";

export function HowItWorks() {
  const steps = [
    ["01", "Deposit", "Your cUSDTMock amount and position are encrypted before entering the pool."],
    ["02", "Draw", "A public epoch closes. Verifiable randomness is bound to that draw onchain."],
    ["03", "Claim", "Your encrypted eligibility is computed without exposing any participant's position."],
  ];
  return (
    <section className="how-section grid-paper" id="how-it-works">
      <div className="section-intro">
        <span className="section-label">A legible machine</span>
        <h2>Private inputs.<br />Public checkpoints.</h2>
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
        <p>Everything needed to audit a draw is public. Everything that identifies your position stays encrypted.</p>
      </div>
      <div className="privacy-table">
        <div className="public-column">
          <h3>Public</h3>
          <ul>
            <li>Draw ID and epoch timing</li>
            <li>Randomness provenance</li>
            <li>Aggregate TWAB after KMS proof</li>
            <li>Lifecycle transactions and claimant identity</li>
          </ul>
        </div>
        <div>
          <h3><LockIcon /> Private</h3>
          <ul>
            <li>Your deposit amount and balance</li>
            <li>Your time-weighted balance</li>
            <li>Your winning zone and payout</li>
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
        <p>Zama computes eligibility over encrypted user values. Chainlink supplies public randomness that is bound to the epoch through the coordinator.</p>
      </div>
      <div className="evidence-table">
        <div className="evidence-title"><strong>Public draw evidence</strong><span>Sepolia release candidate</span></div>
        <EvidenceRow label="Recurring pool" detail={`Epoch ${snapshot?.epochId ?? "—"} · block ${deployment.deploymentBlock}`} value={deployment.pool} href={explorerAddress(deployment.pool)} />
        <EvidenceRow label="RNG coordinator" detail="Binds epoch IDs to provider requests" value={deployment.rngCoordinator} href={explorerAddress(deployment.rngCoordinator)} />
        <EvidenceRow label="Chainlink RNG adapter" detail="Public randomness provider" value={deployment.rngProvider} href={explorerAddress(deployment.rngProvider)} />
        <EvidenceRow label="Confidential token" detail="Sepolia cUSDTMock wrapper" value={deployment.payoutToken} href={explorerAddress(deployment.payoutToken)} />
        <EvidenceRow label="Deployment transaction" detail="Recurring candidate deployment" value={deployment.deploymentTransaction} href={explorerTransaction(deployment.deploymentTransaction)} />
        <EvidenceRow label="Verified source" detail="Sourcify exact creation + runtime match" value={`Match ${deployment.sourceMatchId}`} href={deployment.sourceVerificationUrl} />
      </div>
    </section>
  );
}

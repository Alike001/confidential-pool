import type { PoolSnapshot } from "../lib/pool";
import { formatCountdown } from "../lib/format";
import { deployment } from "../config/deployment";

function getPhase(snapshot?: PoolSnapshot) {
  if (!snapshot) return { label: "Loading chain", step: 0 };
  if (snapshot.chainTimestamp < snapshot.epochStart) return { label: "Scheduled", step: 0 };
  if (snapshot.chainTimestamp < snapshot.epochEnd) return { label: "Deposits open", step: 1 };
  if (!snapshot.aggregateFinalized) return { label: "Epoch closed", step: 2 };
  if (!snapshot.drawOpened) return { label: "FHE draw ready", step: 3 };
  return { label: "Draw open", step: 4 };
}

export function DrawSummary({ snapshot, loading }: { snapshot?: PoolSnapshot; loading: boolean }) {
  const phase = getPhase(snapshot);
  const remaining = snapshot ? snapshot.epochEnd - snapshot.chainTimestamp : 0;
  const labels = ["Deposits open", "Epoch closed", "FHE draw ready", "Draw open", "Claim"];
  const reserveFunded = Boolean(snapshot?.encryptedYieldReserveHandle && !/^0x0+$/.test(snapshot.encryptedYieldReserveHandle));

  return (
    <section className="draw-card" aria-label="Current draw">
      <div className="draw-heading-row">
        <div>
          <span className="section-label">Current draw</span>
          <div className="draw-number">#{snapshot?.epochId ?? "—"}</div>
        </div>
        <span className="phase-badge"><span />{loading ? "Refreshing" : phase.label}</span>
      </div>
      <div className="draw-metrics">
        <div>
          <span>Prize reserve</span>
          <strong>{reserveFunded ? "Encrypted + funded" : "Accruing"} <small>{deployment.tokenSymbol}</small></strong>
        </div>
        <div>
          <span>Epoch closes</span>
          <strong>{snapshot && remaining > 0 ? formatCountdown(remaining) : "Closed"}</strong>
        </div>
      </div>
      <div className="lifecycle-head">
        <span>Draw lifecycle</span>
        <span>{String(Math.max(1, phase.step)).padStart(2, "0")} / 05</span>
      </div>
      <div className="lifecycle-grid">
        {labels.map((label, index) => (
          <div className={index < phase.step ? "lifecycle-step is-active" : "lifecycle-step"} key={label}>
            <span className="lifecycle-bar" />
            <small>{label}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

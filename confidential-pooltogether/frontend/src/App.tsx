import { formatUnits } from "ethers";
import { Header } from "./components/Header";
import { DrawSummary } from "./components/DrawSummary";
import {
  PositionWorkspace,
  PrivatePositionCard,
} from "./components/PositionWorkspace";
import {
  EvidenceSection,
  HowItWorks,
  PrivacyBoundary,
} from "./components/InformationSections";
import { ArrowIcon, LockIcon } from "./components/Icons";
import { deployment } from "./config/deployment";
import { useWallet } from "./hooks/useWallet";
import { usePoolSnapshot } from "./hooks/usePoolSnapshot";
import { useConfidentialActions } from "./hooks/useConfidentialActions";

export default function App() {
  const wallet = useWallet();
  const pool = usePoolSnapshot(
    wallet.isSepolia ? wallet.provider : undefined,
    wallet.isSepolia ? wallet.account : undefined,
  );
  const actions = useConfidentialActions({
    ethereum: wallet.ethereum,
    account: wallet.account,
    isSepolia: wallet.isSepolia,
    refresh: pool.refresh,
  });
  const connected = wallet.status === "connected";
  const backing = pool.snapshot
    ? Number(formatUnits(pool.snapshot.backingBalance, deployment.tokenDecimals)).toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })
    : "—";

  return (
    <div className="page" id="top">
      <Header
        account={wallet.account}
        connected={connected}
        connecting={wallet.status === "connecting"}
        isSepolia={wallet.isSepolia}
        onConnect={() => void wallet.connect()}
        onDisconnect={() => void wallet.disconnect()}
        onSwitchNetwork={() => void wallet.switchToSepolia()}
      />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="hero-eyebrow"><i /> Live prize savings on Sepolia</span>
            <h1>
              Your savings stay private.
              <span>The draw stays honest.</span>
            </h1>
            <p>
              Aave generates the yield. Zama generates encrypted randomness and computes winner
              eligibility over encrypted balances. Every step is recorded onchain.
            </p>
            <div className="hero-actions">
              {connected && wallet.isSepolia ? (
                <a className="button button-primary" href="#pool">
                  Enter the private pool <ArrowIcon />
                </a>
              ) : (
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => void (connected ? wallet.switchToSepolia() : wallet.connect())}
                >
                  {connected ? "Switch to Sepolia" : "Connect wallet"} <ArrowIcon />
                </button>
              )}
              <a className="hero-text-link" href="#how-it-works">
                See how privacy works
              </a>
            </div>
            {wallet.error ? (
              <p className="inline-error" role="alert">
                {wallet.error}
              </p>
            ) : null}
            {pool.error ? (
              <p className="inline-error" role="alert">
                Live read failed: {pool.error}
              </p>
            ) : null}
          </div>
          <div className="hero-machine" aria-label="Live confidential prize flow">
            <div className="machine-topline">
              <span><i /> Protocol online</span>
              <strong>SEP / 11155111</strong>
            </div>
            <div className="machine-vault">
              <div className="vault-heading">
                <span className="section-label">Encrypted pool position</span>
                <LockIcon />
              </div>
              <strong className="cipher-value">•••• •••• ••••</strong>
              <span className="cipher-caption">Only your wallet can reveal this value</span>
            </div>
            <div className="machine-route" aria-hidden="true">
              <span>AAVE YIELD</span><i /><span>FHE DRAW</span><i /><span>PRIVATE CLAIM</span>
            </div>
            <div className="machine-result">
              <div>
                <span>Prize source</span>
                <strong>Generated yield</strong>
              </div>
              <div>
                <span>Winner proof</span>
                <strong>Onchain</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="protocol-strip" aria-label="Live protocol status">
          <div><span>01 / Backing</span><strong>{backing} aLINK</strong><small>Supplied through Aave</small></div>
          <div><span>02 / Privacy</span><strong>Zama FHE</strong><small>Balances stay ciphertext</small></div>
          <div><span>03 / Randomness</span><strong>Zama FHE RNG</strong><small>Encrypted onchain</small></div>
        </section>

        <section className="pool-section" id="pool">
          <div className="pool-heading">
            <div>
              <span className="section-label">Your private savings account</span>
              <h2>Enter the pool.</h2>
            </div>
            <p>Deposit and withdraw confidential {deployment.tokenSymbol}. Your amount, balance, TWAB, odds, and prize remain encrypted.</p>
          </div>
          <div className="product-grid">
          <PositionWorkspace
            connected={connected}
            isSepolia={wallet.isSepolia}
            snapshot={pool.snapshot}
            onConnect={() => void wallet.connect()}
            onSwitchNetwork={() => void wallet.switchToSepolia()}
            operation={actions}
          />
          <a className="compact-evidence-link" href="#fairness">
            View public draw evidence <ArrowIcon />
          </a>
          <DrawSummary snapshot={pool.snapshot} loading={pool.loading} />
          <PrivatePositionCard
            connected={connected}
            isSepolia={wallet.isSepolia}
            snapshot={pool.snapshot}
            onConnect={() => void wallet.connect()}
            onSwitchNetwork={() => void wallet.switchToSepolia()}
            onDecrypt={actions.decrypt}
            operation={actions}
          />
          </div>
        </section>

        <HowItWorks />
        <PrivacyBoundary />
        <EvidenceSection snapshot={pool.snapshot} />
      </main>
      <footer>
        <div><strong>Confidential Pool</strong><span>A private prize-savings protocol powered by Zama.</span></div>
        <nav aria-label="Footer navigation">
          <a href="#pool">Pool</a>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#fairness">Fairness</a>
        </nav>
      </footer>
    </div>
  );
}

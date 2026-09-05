import { Header } from "./components/Header";
import { DrawSummary } from "./components/DrawSummary";
import { PositionWorkspace, PrivatePositionCard } from "./components/PositionWorkspace";
import { EvidenceSection, HowItWorks, PrivacyBoundary } from "./components/InformationSections";
import { ArrowIcon } from "./components/Icons";
import { useWallet } from "./hooks/useWallet";
import { usePoolSnapshot } from "./hooks/usePoolSnapshot";

export default function App() {
  const wallet = useWallet();
  const pool = usePoolSnapshot(wallet.isSepolia ? wallet.provider : undefined, wallet.isSepolia ? wallet.account : undefined);

  return (
    <div className="page" id="top">
      <Header
        account={wallet.account}
        connected={wallet.status === "connected"}
        connecting={wallet.status === "connecting"}
        isSepolia={wallet.isSepolia}
        onConnect={() => void wallet.connect()}
        onSwitchNetwork={() => void wallet.switchToSepolia()}
      />
      <main>
        <section className="product-intro">
          <div className="hero-copy">
            <h1>Save privately. Win transparently.</h1>
            <p>Deposit confidential cUSDTMock, keep your position encrypted, and verify every draw onchain.</p>
            {wallet.error ? <p className="inline-error" role="alert">{wallet.error}</p> : null}
            {!pool.hasProvider ? <p className="read-note">Connect a Sepolia wallet to load live pool state.</p> : null}
            {pool.error ? <p className="inline-error" role="alert">Live read failed: {pool.error}</p> : null}
          </div>
        </section>
        <section className="product-grid">
          <PositionWorkspace
            connected={wallet.status === "connected"}
            isSepolia={wallet.isSepolia}
            snapshot={pool.snapshot}
            onConnect={() => void wallet.connect()}
            onSwitchNetwork={() => void wallet.switchToSepolia()}
          />
          <a className="compact-evidence-link" href="#fairness">View public draw evidence <ArrowIcon /></a>
          <DrawSummary snapshot={pool.snapshot} loading={pool.loading} />
          <PrivatePositionCard snapshot={pool.snapshot} />
        </section>

        <HowItWorks />
        <PrivacyBoundary />
        <EvidenceSection snapshot={pool.snapshot} />
      </main>
      <footer>
        <span>Confidential Pool · Sepolia release candidate</span>
        <nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><a href="#privacy">Privacy</a><a href="#fairness">Fairness</a></nav>
      </footer>
    </div>
  );
}

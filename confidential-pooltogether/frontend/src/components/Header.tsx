import { useState } from "react";
import { LockIcon, MenuIcon, WalletIcon } from "./Icons";
import { shorten } from "../lib/format";

type Props = {
  account?: string;
  connected: boolean;
  connecting: boolean;
  isSepolia: boolean;
  onConnect(): void;
  onSwitchNetwork(): void;
};

export function Header({ account, connected, connecting, isSepolia, onConnect, onSwitchNetwork }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonLabel = connecting ? "Connecting…" : connected ? shorten(account ?? "", 6, 4) : "Connect wallet";

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Confidential Pool home">
        <span className="brand-mark"><LockIcon /></span>
        <span>Confidential Pool</span>
      </a>
      <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Primary navigation">
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="#privacy" onClick={() => setMenuOpen(false)}>Privacy</a>
        <a href="#fairness" onClick={() => setMenuOpen(false)}>Fairness</a>
      </nav>
      <div className="header-actions">
        <span className={isSepolia ? "network-status" : "network-status is-wrong"}>
          <span className="status-dot" /> {isSepolia || !connected ? "Sepolia" : "Wrong network"}
        </span>
        <button
          className="button button-primary wallet-button"
          type="button"
          onClick={connected && !isSepolia ? onSwitchNetwork : onConnect}
          disabled={connecting || (connected && isSepolia)}
        >
          <WalletIcon />
          {connected && !isSepolia ? "Switch network" : buttonLabel}
        </button>
        <button className="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}

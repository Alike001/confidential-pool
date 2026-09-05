# Confidential Pool frontend

Production-oriented React/Vite frontend for the audited recurring Sepolia release.

## Current slice

- approved white/yellow/charcoal product-first design;
- real injected-wallet connection and Sepolia switching;
- real pool epoch/draw/encrypted-handle reads;
- lazily loaded Zama SDK encryption and owner-authorized decryption;
- implemented encrypted deposit, withdrawal, recurring checkpoint, and two-step claim actions;
- real deployment and Etherscan evidence;
- responsive desktop/mobile layout;
- encrypted writes enabled against the exact-match final Sepolia pool after both strict recurring live audits passed.

No private key belongs in this directory. Copy `.env.example` to `.env.local` only if a browser-safe read-only Sepolia RPC is needed.

## Run

```bash
cd /home/ali/Desktop/zama/confidential-pooltogether/frontend
npm install
npm run dev
```

## Production build

```bash
cd /home/ali/Desktop/zama/confidential-pooltogether/frontend
npm ci
npm run build
npm run preview
```

The repository workflow builds this directory with the `/confidential-pool/` base path and deploys `dist/` to GitHub Pages. No deployer key or server-side secret is used by the browser application.

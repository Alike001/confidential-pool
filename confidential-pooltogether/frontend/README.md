# Confidential Pool frontend

Production-oriented React/Vite frontend for the pre-audit recurring Sepolia release.

## Current slice

- approved white/yellow/charcoal product-first design;
- real injected-wallet connection and Sepolia switching;
- real pool epoch/draw/encrypted-handle reads;
- lazily loaded Zama SDK encryption and owner-authorized decryption;
- implemented encrypted deposit, withdrawal, recurring checkpoint, and HCU-safe four-transaction claim actions;
- real deployment and Etherscan evidence;
- responsive desktop/mobile layout;
- encrypted writes are enabled against the guarded, source-matched final Sepolia pair after its strict lifecycle audit passed.

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

The production project deploys `dist/` to Vercel at <https://frontend-two-chi-54.vercel.app>. No deployer key or server-side secret is used by the browser application.

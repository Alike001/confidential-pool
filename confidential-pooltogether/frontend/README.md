# Confidential Pool frontend

Production-oriented React/Vite frontend for the recurring Sepolia release candidate.

## Current slice

- approved white/yellow/charcoal product-first design;
- real injected-wallet connection and Sepolia switching;
- real pool epoch/draw/encrypted-handle reads;
- real deployment and Etherscan evidence;
- responsive desktop/mobile layout;
- honest lock on encrypted writes and user decryption until the recurring live audit passes.

No private key belongs in this directory. Copy `.env.example` to `.env.local` only if a browser-safe read-only Sepolia RPC is needed.

## Run

```bash
cd /home/ali/Desktop/zama/confidential-pooltogether/frontend
npm install
npm run dev
```

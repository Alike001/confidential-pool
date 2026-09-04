# Yield and prize-liquidity accounting

## Why this boundary matters

The first claim prototype accepted an encrypted prize as a claim argument. That demonstrated FHE winner selection, but it did not establish that the prize belonged to the draw or that the pool could pay it.

The next slice moves prize funding into protocol state:

```text
confidential token transfer
        ├── normal callback → encrypted user principal
        └── yield callback  → encrypted prize reserve

draw opening → encrypted prize amount stored on the draw
claim       → winner ? draw prize : 0
              then reserve check
              then encrypted token transfer
```

## Local bounded model

The local contract has:

- one designated yield provider, set to the deployer for the fixture;
- one encrypted reserve shared by all draws;
- one encrypted prize amount stored per draw;
- no clear amount in funding, draw, claim, or payout events.

The payout rule is:

```text
candidate = winner ? drawPrize : 0
payout    = candidate <= reserve ? candidate : 0
reserve   = reserve - payout
```

This keeps an underfunded claim non-reverting and avoids a public branch that says “winner but insolvent”. It also means the current slice rejects no claim for insufficient reserve: it records an encrypted zero payout instead.

## What this proves

The focused FHEVM suite now proves:

1. a confidential deposit becomes encrypted principal;
2. a provider can add encrypted reserve liquidity through the token callback;
3. a draw stores its encrypted prize before claims begin;
4. a winning claim consumes reserve privately;
5. an underfunded winning claim returns encrypted zero without a public insufficiency result;
6. a non-winner does not consume reserve.

## What this does not prove

This is not yet PoolTogether V5 yield accounting. The real design still needs:

- a Prize Vault or yield-strategy adapter;
- a principled definition of principal versus yield in the underlying asset;
- historical TWAB observations rather than current encrypted balance;
- authorized draw creation and prize-tier configuration;
- protection against double-counting or replayed funding callbacks;
- handling for fees, losses, strategy withdrawals, and multiple concurrent draws;
- live ERC-7984 compatibility against the verified Sepolia wrapper.

The live wrapper has now been inspected read-only and passes the expected ERC-7984/registry checks. The next planning decision is whether the bounty demo uses a real yield adapter or a deliberately explicit mock yield source. A live encrypted transfer test still remains open.

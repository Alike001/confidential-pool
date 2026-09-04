# Replit frontend design brief

The frontend is not approved or implemented. Use this brief to generate a design prototype in Replit, review it visually, and return the approved prototype to the implementation repository. `Confidential Pool` is a working product name, not a finalized brand decision.

## Initial Replit Agent prompt

```text
Create and run a frontend-only React + Vite design prototype for a privacy-preserving prize savings application. Use the working name “Confidential Pool”. This is a design prototype for a Zama-powered confidential adaptation of PoolTogether.

Do not build a backend, database, authentication server, smart contracts, wallet integration, blockchain writes, or real encryption. Do not ask for or store private keys, seed phrases, RPC credentials, or API secrets. Use local mock state only so every interaction can be reviewed safely in Preview.

PRODUCT IDEA
Users deposit confidential cUSDT into a shared prize pool. Their deposit amount, balance, time-weighted balance, odds, and prize remain encrypted. The draw ID, epoch status, Chainlink randomness status, and fairness/provenance evidence remain public. Users can withdraw principal and only the winner can decrypt their prize.

VISUAL DIRECTION
- True white page background: #FFFFFF. Do not substitute cream, beige, or gray.
- Primary Zama-inspired yellow accent: #FFD208.
- Main text and strong borders: #111111.
- Muted text: #666666.
- Very pale yellow may be used sparingly for selected or explanatory areas.
- Do not use purple, blue crypto gradients, dark-mode styling, neon glow, glassmorphism, or generic Web3 imagery.
- High-trust editorial fintech style: clean, airy, sharp, premium, and technically credible.
- Use yellow for actions and important state, not as a large unreadable text background.
- Prefer open layouts, horizontal rules, and one purposeful application frame over a dashboard made from many rounded cards.
- Use restrained corner radii, thin charcoal borders, subtle shadows, excellent typography, and generous whitespace.
- No hero eyebrow, marketing badge, fake TVL, fake user counts, fake APY, testimonials, stock photography, token mascots, or decorative filler.
- Use a consistent professional SVG icon family where icons clarify controls. Do not use emoji as interface icons.

PRIMARY DESKTOP SCREEN
Design the full usable application screen at 1440 × 1100, not only a landing-page hero.

1. Header
   - Text wordmark: Confidential Pool
   - Navigation: How it works, Privacy, Fairness
   - Network indicator: Sepolia
   - Primary control: Connect wallet

2. Product introduction
   - Heading: Save privately. Win transparently.
   - Supporting copy: Deposit confidential cUSDT, keep your position encrypted, and verify every draw onchain.
   - Keep this concise and integrated with the app; do not build a large marketing hero that pushes the product below the fold.

3. Current draw and prize
   - Current draw: #1
   - Prize: 100 cUSDT
   - Epoch state and countdown/status
   - A compact lifecycle rail: Deposits open → Epoch closed → Randomness ready → Draw open → Claim
   - Clearly distinguish public verifiability from private user values.

4. Main account action area
   - Deposit and Withdraw tabs
   - cUSDT amount input
   - Primary button: Encrypt & deposit
   - Secondary withdrawal action
   - Explain that principal remains withdrawable.
   - Include believable loading, wallet-confirmation, encryption, submitted, and success states using local state.

5. Private position
   - Mask encrypted values by default rather than displaying fake numbers.
   - Rows: Deposited, Current balance, Time-weighted balance, Prize result
   - Control: Decrypt my position
   - After a local simulated decrypt action, show example values clearly labeled Demo data.
   - Include a locked/private visual treatment without making the screen dark or intimidating.

6. Draw and claim state
   - Show a reviewable winner state and a non-winner state using a local state switch.
   - Winner copy: You won this draw
   - Primary winner action: Decrypt & claim prize
   - Never reveal another participant’s balance or odds.

7. Fairness and privacy explanation
   - A clear Public / Private comparison, preferably as an open two-column band rather than nested cards.
   - Public: draw ID, epoch timing, randomness provenance, draw status.
   - Private: deposits, balances, time-weighted balances, odds, winnings.
   - Short explanation that Zama FHE computes over encrypted values while Chainlink supplies public randomness.

8. Technical evidence area
   - Compact links or rows for Pool contract, RNG coordinator, RNG adapter, request ID, and transaction evidence.
   - Use shortened example addresses and label everything as Sepolia demo data.
   - This should feel understandable to a normal user, with optional technical detail rather than overwhelming the page.

RESPONSIVE DESIGN
- Build a polished mobile layout around 390 × 844.
- Preserve action priority, readable type, masked private values, lifecycle status, and wallet control.
- Do not merely shrink the desktop layout or allow horizontal overflow.

INTERACTIONS
- All tabs and state switches must work with local React state.
- Connect wallet should simulate connected/disconnected UI only.
- Encrypt & deposit should demonstrate encryption and transaction stages without calling a wallet or network.
- Decrypt should reveal clearly labeled demo values.
- Provide an unobtrusive prototype state selector so I can review deposit, pending, winner, non-winner, claimed, and withdrawn states.
- Respect prefers-reduced-motion. Use subtle purposeful transitions only.

ENGINEERING AND DELIVERY
- Use React + Vite with reusable components and CSS design tokens.
- Keep interface text and controls as real HTML, not a screenshot.
- Use semantic HTML, keyboard focus states, accessible labels, and adequate contrast.
- Make the app run successfully in Replit Preview.
- Before stopping, install dependencies, start the app, fix any build/runtime/port errors, and verify the full screen plus mobile layout in Preview.
- Do not publish or connect external services unless I explicitly ask.
- When finished, tell me the run command, preview URL, main file structure, and which local prototype controls demonstrate each state.
```

## Follow-up prompt to make Replit run and verify it

Paste this after Agent says it has finished building:

```text
Run the application now and open it in Replit Preview. If Preview does not load, inspect the run command, dependency installation, Vite host/port configuration, and browser console, then fix the smallest issue. Do not add a backend or any secrets. Verify the desktop screen, switch through deposit/pending/winner/non-winner/claimed/withdrawn states, and verify a 390px mobile layout with no horizontal overflow. Tell me the exact run command and confirm that Preview is working before stopping.
```

## What to return for approval

Send the following back to the implementation workflow:

1. Replit project URL or an exported ZIP/GitHub repository.
2. Full desktop screenshot at approximately 1440 × 1100.
3. Mobile screenshot at approximately 390 × 844.
4. Screenshots of winner and non-winner states if they are not visible in the primary screen.
5. Any fonts or external assets Replit introduced.

Do not add a private key, seed phrase, RPC credential, or funded wallet to the Replit project. The approved prototype will be inspected, converted into a locked design system, and then integrated with the real Zama lifecycle locally.

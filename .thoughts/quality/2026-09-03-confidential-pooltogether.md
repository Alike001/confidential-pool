# Project Quality Profile: bounded confidential PoolTogether build

## Detected Stack

- New Solidity/TypeScript dApp workspace, not yet scaffolded.
- Existing FHEVM reference checkout: Hardhat, Solidity `0.8.24`, TypeScript, Prettier, ESLint/Solhint, and Foundry configuration.
- Existing research-only tests run inside `zama-context/fhevm/library-solidity`.

## Existing Commands

The pinned FHEVM library exposes:

- `npm test`
- `npm run compile`
- `npm run tsc`
- `npm run lint`
- `npm run prettier:check`
- `npm run test:forge`

The new application workspace has no package manifest yet. Its commands must be defined when the contract/frontend stack is scaffolded.

## Required Local Checks

For the application once scaffolded:

1. Solidity compilation with the pinned compiler.
2. Unit and invariant tests for the plaintext economic model.
3. FHEVM local-host integration tests for encrypted accounting, ACL, winner selection, and claim behavior.
4. TypeScript typecheck.
5. Prettier check.
6. Solhint and ESLint where applicable.
7. Gas/HCU measurement for every encrypted state transition and claim path.
8. Static/security checks appropriate to the selected vault and token interfaces.

## Required CI Gates

- Clean install from lockfile.
- Compile succeeds without generated-file edits.
- Plaintext and FHEVM test suites pass.
- Typecheck, formatting, and lint pass.
- No test-only mocked coprocessor or fake payout path is imported by the judged deployment build.
- Contract addresses, network IDs, and external service versions are validated for Sepolia configuration.

## Suggested Hooks

- Pre-commit: Prettier on changed Solidity/TypeScript/Markdown and fast unit tests.
- Pre-push: compile, typecheck, lint, and the complete local FHEVM integration suite.
- Before deployment: clean build, full tests, HCU/depth report, and verification-audit checklist.

## File Size Policy

- Target: 200 source lines.
- Warning: above 200 lines.
- Hard cap: above 300 lines unless generated, vendored, or explicitly justified.
- The private-denominator experiment is exempt as a research fixture; production contracts should remain smaller and composable.

## Commit Policy

Use conventional commit messages if the application repository adopts the existing FHEVM convention. The workspace currently has no commit hook or application repository policy.

## AGENTS.md Notes

- Keep research fixtures outside the production application dependency graph.
- Treat public aggregate supply as a documented privacy boundary, not a private total.
- Record every FHE operation width, HCU result, and ACL grant in tests.
- Do not claim Sepolia production behavior from local mocked-coprocessor results.
- Run the verification audit before deployment and submission.

## Open Questions

- Final application framework and frontend stack.
- Whether to use Hardhat only or Hardhat plus Foundry.
- cUSDT contract/interface and confidential settlement support.
- Real yield adapter and deployment ownership model.

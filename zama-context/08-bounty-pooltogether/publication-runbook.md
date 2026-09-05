# Publication runbook

## Final names

- Product: **Confidential Pool**
- Main repository: `Alike001/confidential-pool`
- FHE implementation fork: `Alike001/fhevm`
- FHE implementation branch: `feature/confidential-pool`

## Why there are two repositories

The product workspace and research database live in the main repository. The production FHE contract, Zama-specific scripts, and FHE test suite were developed as 35 commits on top of `zama-ai/fhevm`. Keeping that work in a fork preserves upstream history and makes the changes reviewable without copying a large SDK tree into the product repository.

The local implementation branch already exists at:

```text
/home/ali/Desktop/zama/zama-context/fhevm
feature/confidential-pool -> f64413c
```

No GitHub repository has been created and no branch has been pushed yet.

## Pre-publish checks

Run each command from the directory shown.

```sh
cd /home/ali/Desktop/zama
git status --short
git log -1 --oneline

cd /home/ali/Desktop/zama/zama-context/fhevm
git status --short
git log -1 --oneline feature/confidential-pool

cd /home/ali/Desktop/zama/confidential-pooltogether
forge test

cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity
DOTENV_CONFIG_PATH=.env.example npx hardhat test --network hardhat \
  test/phase2/ConfidentialPoolTogether.ts \
  test/phase2/ConfidentialPoolTogether.adversarial.ts \
  test/phase2/ConfidentialPoolTogether.HCU.ts \
  test/phase2/ConfidentialPoolTogetherSlice.ts
npm run check:lifecycle-scripts

cd /home/ali/Desktop/zama/confidential-pooltogether/frontend
npm run build
```

Expected result: clean worktrees, 13 Foundry tests, 25 focused FHE tests, passing lifecycle checks, and a passing frontend build.

## Publish sequence

These commands cause public GitHub changes and must only be run after explicit approval.

1. Fork Zama FHEVM and push the implementation branch:

```sh
cd /home/ali/Desktop/zama/zama-context/fhevm
gh repo fork zama-ai/fhevm --clone=false --remote --remote-name submission
git push -u submission feature/confidential-pool
```

2. Create the main product repository without pushing yet:

```sh
cd /home/ali/Desktop/zama
gh repo create Alike001/confidential-pool \
  --public \
  --description "Private prize savings with Zama FHEVM and verifiable Chainlink draws" \
  --source . \
  --remote origin
```

3. Enable the GitHub Actions Pages source, then push `main`. The included workflow builds the nested frontend with the `/confidential-pool/` Vite base path.

```sh
cd /home/ali/Desktop/zama
gh api --method POST repos/Alike001/confidential-pool/pages \
  -f build_type=workflow
git push -u origin main
```

4. Add the two public repository URLs to `submission-package.md`, commit, and push the documentation update.

5. Wait for the Pages workflow, then run an injected-wallet deposit/decrypt/claim smoke test from `https://alike001.github.io/confidential-pool/` and freeze that demo URL.

6. Record a short demo, add the video URL, and submit through the Zama Season 4 form.

## Secret boundary

Never commit either local `.env` file. The repository ignores `**/.env` and `**/.env.local`; only `.env.example` templates belong in Git. Before publishing, inspect tracked environment files and scan for accidental key assignments without printing secret values.

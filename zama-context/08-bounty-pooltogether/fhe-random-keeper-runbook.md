# FHE-random Sepolia keeper runbook

This is the operational path for the guarded final release. Every command starts from the exact required directory.

## Environment

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity

set -a
source /home/ali/Desktop/zama/confidential-pooltogether/.env
source /home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env
set +a
```

The first ignored `.env` supplies the Sepolia RPC and wallet key; the second supplies final pool/wrapper addresses and lifecycle parameters. The second file is sourced last so release-specific values win. Never commit either `.env`.

## 1. Inspect an epoch

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity

set -a
source /home/ali/Desktop/zama/confidential-pooltogether/.env
source /home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env
set +a

EPOCH_ID=1 \
EPOCH_ACTION=inspect \
EPOCH_BROADCAST=false \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

## 2. Advance after epoch close

Anyone may advance the current epoch after its end timestamp.

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity

set -a
source /home/ali/Desktop/zama/confidential-pooltogether/.env
source /home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env
set +a

EPOCH_ID=1 \
EPOCH_ACTION=advance \
EPOCH_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

## 3. Finalize the user's encrypted TWAB

Anyone may checkpoint a participant, but epochs must be finalized sequentially for that account.

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity

set -a
source /home/ali/Desktop/zama/confidential-pooltogether/.env
source /home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env
set +a

EPOCH_ID=1 \
EPOCH_ACCOUNT=0xdE67A35B322e5A31e8215B5245CA4e48d7977F71 \
EPOCH_ACTION=finalize-user \
EPOCH_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

## 4. Request and finalize the aggregate TWAB

The request permanently marks the encrypted aggregate as publicly decryptable. The second command retrieves the Zama KMS result and submits its proof onchain.

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity

set -a
source /home/ali/Desktop/zama/confidential-pooltogether/.env
source /home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env
set +a

EPOCH_ID=1 \
EPOCH_ACTION=request-aggregate \
EPOCH_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia

EPOCH_ID=1 \
EPOCH_ACTION=finalize-aggregate \
EPOCH_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringEpoch.ts --network sepolia
```

## 5. Open the draw

The draw operator encrypts the prize amount for the pool. Odds and the KMS-proven aggregate denominator are public; the prize reserve and later user-specific values remain encrypted.

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity

set -a
source /home/ali/Desktop/zama/confidential-pooltogether/.env
source /home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env
set +a

DRAW_ID=1 \
DRAW_ACTION=open \
DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia
```

## 6. Execute one guarded FHE claim slot

The four transactions are intentionally separate to remain below the FHE HCU-depth limit. Only tier `0`, prize index `0` is accepted.

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity

set -a
source /home/ali/Desktop/zama/confidential-pooltogether/.env
source /home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env
set +a

DRAW_ID=1 DRAW_ACTION=prepare-weight DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia

DRAW_ID=1 DRAW_ACTION=prepare-threshold DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia

DRAW_ID=1 DRAW_ACTION=prepare-claim DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia

DRAW_ID=1 DRAW_ACTION=claim DRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia

DRAW_ID=1 DRAW_ACTION=inspect-claim DRAW_BROADCAST=false \
npx hardhat run scripts/liveSepoliaRecurringDraw.ts --network sepolia
```

`prepare-claim` calls `FHE.randEuint64()`. The resulting random handle is visible as a ciphertext reference but is not ACL-authorized to the claimant. The final payout handle is authorized to the claimant for EIP-712 user decryption.

## 7. Withdraw principal

Withdrawals are accepted only while the current epoch is open. After advancing into the next epoch and sequentially checkpointing the participant, run:

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity

set -a
source /home/ali/Desktop/zama/confidential-pooltogether/.env
source /home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env
set +a

WITHDRAW_AMOUNT_UNITS=9000000000000000000 \
WITHDRAW_BROADCAST=true \
npx hardhat run scripts/liveSepoliaWithdraw.ts --network sepolia
```

## 8. Strict release audit

```bash
cd /home/ali/Desktop/zama/zama-context/fhevm/library-solidity

set -a
source /home/ali/Desktop/zama/confidential-pooltogether/.env
source /home/ali/Desktop/zama/zama-context/fhevm/library-solidity/.env
set +a

AUDIT_REQUIRE_COMPLETE=true \
npx hardhat run scripts/auditFheRandomAaveSepoliaLifecycle.ts --network sepolia
```

The release gate passes only when the last line is:

```text
FHE_RANDOM_AAVE_LIFECYCLE_COMPLETE: true
```

## Recovery rule

If an RPC timeout or connection reset occurs after a transaction hash is printed, inspect that transaction before retrying. Never blindly repeat a state-changing command. Every script reads current state and should be rerun in inspection mode first when the broadcast outcome is uncertain.

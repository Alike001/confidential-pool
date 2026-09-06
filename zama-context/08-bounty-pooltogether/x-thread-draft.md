# Confidential Pool X thread draft

Attach the real-person demo video to post 1. Publish the remaining posts as replies in this order.

## Post 1/6

I built Confidential Pool: private no-loss prize savings on Ethereum Sepolia.

Deposits, balances, draw calculations, and prizes stay encrypted while execution remains verifiable onchain.

Built with @zama FHE + Aave V3. 🧵

#ZamaDeveloperProgram

## Post 2/6

Users shield an Aave-backed LINK position into confidential caLINK, then deposit an encrypted amount into a shared pool.

The Zama SDK encrypts the amount before submission, and observers cannot read the user's in-pool balance or time-weighted position.

## Post 3/6

The prize comes from generated yield—not user principal.

The wrapper tracks issued caLINK against its Aave aLINK backing. Only backing growth above issued principal can be harvested into the encrypted prize reserve.

Principal remains withdrawable during an open epoch.

## Post 4/6

Winner selection runs onchain over encrypted values.

A KMS proof finalizes the aggregate TWAB, then `FHE.randEuint64()` creates encrypted randomness. Encrypted weight, threshold, and winner comparisons execute without plaintext user balances or offchain RNG.

## Post 5/6

Claims remain private too.

The payout is settled as ciphertext, and only the participant wallet receives permission to decrypt it through the EIP-712 flow. Public evidence proves each draw stage ran without revealing every participant's financial position.

## Post 6/6

Try the Sepolia dApp:
https://solitary-rain-30c2.hammedoye10.workers.dev

Source:
https://github.com/Alike001/confidential-pool

Pool:
https://sepolia.etherscan.io/address/0xB967bD58dc9F4Ee10D8dcd6A1cBfA1bdDC1B9A88

Pre-audit testnet software—not for real funds.

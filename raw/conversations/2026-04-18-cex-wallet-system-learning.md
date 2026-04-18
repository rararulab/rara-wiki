# Conversation Source Card: CEX wallet system learning

- Date: 2026-04-18
- Type: conversation
- Topic: teaching the user how a Bybit-style CEX wallet system works from top layer to bottom layer

## Why This Matters

The conversation produced stable, reusable knowledge about how a centralized exchange wallet
system is structured. It clarified multiple foundational distinctions the user had initially
blurred together: internal ledger versus on-chain settlement, balance state versus workflow
state, withdrawal request versus transfer intent versus signed transaction, and deposit
crediting versus sweep.

## Durable Conclusions

1. Internal CEX trades do not require on-chain settlement for every trade. Most spot trading
   is an internal ledger mutation; blockchain settlement is primarily involved in deposits,
   withdrawals, sweeps, and wallet-tier rebalancing.
2. A CEX wallet system is not just an address holding money. It is a layered system spanning:
   API/auth, orchestration, internal ledger, transfer intents, signing/broadcast, custody
   tiers, chain adapters, and chain nodes.
3. Balance state and workflow state must be modeled independently.
   - Balance line: `available -> held -> deducted`
   - Workflow line: `submitted -> approved -> processing -> settling -> completed/failed`
4. Withdrawal object flow should be modeled as:
   `WithdrawalRequest -> TransferIntent -> SignedTransaction`
5. Settlement does not begin when a worker merely starts. The meaningful boundary is after the
   transaction has been signed, broadcast, and accepted by a node strongly enough to return a
   `txid` or equivalent chain-level acceptance evidence.
6. `txid` does not mean final success. Broadcast acceptance and final confirmation are separate
   phases. Reorgs, drops, replacements, and timeouts can still invalidate or delay completion.
7. Failures must be split into retryable and terminal classes.
   - Retryable uncertainty: funds typically remain `held`
   - Terminal failure: request becomes `failed` and funds are released from `held` back to
     `available`
8. Deposit crediting and sweep are separate concerns.
   - Deposit crediting adds internal user balance after enough confirmations
   - Sweep consolidates chain funds from scattered deposit addresses back into platform
     controlled wallets
9. Hot, warm, and cold wallets are primarily about balancing liquidity and safety, not simply
   asset size buckets.
10. BTC and EVM execution logic should not be unified into one identical transaction builder.
    - BTC: output-based, requires UTXO selection and often a change output
    - EVM: account-based, requires nonce management and gas handling

## Teaching Artifacts Produced

- `sigma/cex-wallet-system/session.md`
- `sigma/cex-wallet-system/roadmap.html`
- `sigma/cex-wallet-system/summary.md`

## Suggested Wiki Write-Back

- Create a concept/synthesis page for `cex-wallet-system`
- Link it from the main index under architecture concepts
- Record this conversation in the wiki log

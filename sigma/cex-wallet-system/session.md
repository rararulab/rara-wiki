# Session: CEX Wallet System

## Learner Profile
- Level: beginner
- Language: zh
- Started: 2026-04-18

## Concept Map
| # | Concept | Prerequisites | Status | Score | Last Reviewed | Review Interval |
|---|---------|---------------|--------|-------|---------------|-----------------|
| 1 | Exchange internal ledger vs on-chain balance | - | mastered | 85% | 2026-04-18 | 2d |
| 2 | Withdrawal lifecycle and async workflow | 1 | mastered | 82% | 2026-04-18 | 2d |
| 3 | Custody boundary: who can sign | 1,2 | mastered | 84% | 2026-04-18 | 2d |
| 4 | Wallet tiers: deposit/hot/warm/cold | 1,3 | in-progress | 64% | 2026-04-18 | - |
| 5 | Chain adapters: UTXO vs account model | 1,2 | mastered | 83% | 2026-04-18 | 2d |
| 6 | Signing pipeline: HSM/MPC/multisig | 3,4,5 | in-progress | 80% | 2026-04-18 | - |
| 7 | Ledger design: holds, available balance, double-entry | 1,2 | mastered | 84% | 2026-04-18 | 2d |
| 8 | Risk control and approval workflow | 2,3,7 | in-progress | 78% | 2026-04-18 | - |
| 10 | End-to-end object model | 2,6,7,8,9 | in-progress | 82% | 2026-04-18 | - |
| 11 | Retryable vs terminal failure | 8,9,10 | in-progress | 72% | 2026-04-18 | - |
| 9 | Node/RPC, mempool, confirmation, finality | 5,6 | not-started | - | - | - |
| 10 | Reconciliation and incident handling | 7,8,9 | not-started | - | - | - |
| 11 | Production operations: monitoring, alerting, runbooks | 8,9,10 | not-started | - | - | - |
| 12 | Scaling to multi-chain and multi-region | 5,6,10,11 | not-started | - | - | - |

## Misconceptions
| # | Concept | Misconception | Root Cause | Status | Counter-Example Used |
|---|---------|---------------|------------|--------|---------------------|
| 1 | Exchange internal ledger vs on-chain balance | "wallet is mainly a bookkeeping abstraction on top of blockchain" | No clear separation between exchange ledger and chain settlement layer | active | - |
| 2 | Withdrawal lifecycle | "worker writes a record and submits it to miners" | Missing distinction between internal withdrawal record, raw transaction construction, signing, broadcast, and confirmation | active | - |
| 3 | Crypto fundamentals | "crypto = asymmetric algorithm for reliable communication in Byzantine network" | Mixing cryptography, distributed consensus, and wallet system concerns into one layer | active | - |
| 4 | Ledger vs workflow states | "hard to distinguish business workflow state from ledger balance state" | New to multi-state financial systems where process and balance evolve independently | active | - |
| 5 | UTXO vs account model | "BTC address just directly represents a balance like an EVM account" | Missing the distinction between spendable outputs and account-based balance tracking | active | - |
| 6 | Wallet tier responsibilities | "cold wallet is mainly money that should never move; warm wallet is still basically auto-executed" | Missing the operational refill path and intermediate custody layer between instant liquidity and deepest storage | active | - |
| 7 | Sweep vs rebalancing | "sweep is mainly counting assets" | Missing the difference between consolidating funds from many ingress addresses and moving liquidity between wallet tiers | active | - |
| 8 | Deposit crediting flow | "deposit address is the hot wallet; credited funds may need held-before-available by default" | Mixing ingress address role, confirmation tracking, and post-confirm balance policy into one step | active | - |
| 9 | Withdrawal settlement boundary | "unclear when funds should remain held versus become formally deducted during execution" | Missing the distinction between approval, broadcast, mempool acceptance, and irreversible settlement | mastered | 90% |

## Session Log
- [2026-04-18] Diagnosed level: beginner
- [2026-04-18] Learner described API gateway -> precheck -> lock asset -> queue -> worker -> chain flow.
- [2026-04-18] Strong intuition about async workflow and queue-based withdrawal processing.
- [2026-04-18] Need to build first-principles distinction between exchange ledger, custody/signing boundary, and chain settlement.
- [2026-04-18] Learner correctly identified independent signing/HSM/MPC boundary.
- [2026-04-18] Learner still assumes spot trade settlement requires immediate on-chain miner confirmation.
- [2026-04-18] Learner corrected the key model: internal CEX trades update internal balances, while exchange-controlled on-chain wallets can remain unchanged.
- [2026-04-18] Learner understands "cannot be used anymore" is distinct from "already left exchange on-chain".
- [2026-04-18] Learner selected the more stable ledger model: available -> held first, with later deduction tied to execution progress rather than request submission.
- [2026-04-18] Learner correctly prefers keeping funds in held during retryable broadcast failures.
- [2026-04-18] Learner still mixes balance-column states with withdrawal workflow states; needs a more concrete classifier.
- [2026-04-18] Learner infers `failed` usually maps to `held > 0, deducted = 0`, which is a useful clue toward separating ledger outcomes from request status.
- [2026-04-18] Learner now identifies `deducted` as a balance outcome ("how much has been formally removed"), not a workflow stage.
- [2026-04-18] Learner can now separate withdrawal request statuses (`submitted/approved/failed`) from balance states (`available/held/deducted`).
- [2026-04-18] Learner places KYC/risk/approval in orchestration layer and chain interaction in signer/broadcaster layer.
- [2026-04-18] Learner prefers passing wallet pool/policy rather than a concrete source address into execution layer.
- [2026-04-18] Learner expects idempotency at both orchestration and execution layers and naturally reaches for a serialized withdrawal intent keyed by request/order identity.
- [2026-04-18] Learner correctly picks `TransferIntent` as the execution-layer input, but still mixes pre-sign intent fields with post-sign / post-build transaction artifacts.
- [2026-04-18] Learner now correctly maps UTXO, nonce, and raw transaction bytes to their underlying chain models.
- [2026-04-18] Learner is still unsure whether a BTC address behaves like an account balance holder; needs a concrete contrast between output-based and account-based models.
- [2026-04-18] Learner now distinguishes BTC as output-based ("many spendable chunks") and ETH as account-based ("one balance plus nonce").
- [2026-04-18] Learner recognizes that multiplying auto-signing hot wallets increases attack surface and operational complexity.
- [2026-04-18] Learner has a good intuition for hot wallet purpose, but still treats warm/cold mainly as "bigger/manual" and "locked forever" rather than operational liquidity tiers.
- [2026-04-18] Learner suspects scattered deposit addresses increase operational/query cost, but has not yet formed the "sweep moves funds" vs "rebalancing moves liquidity between tiers" distinction.
- [2026-04-18] Learner can outline the deposit pipeline, but still conflates deposit addresses with hot wallets and is unsure when credited funds should be immediately available versus held.
- [2026-04-18] Learner now distinguishes deposit crediting from sweep: user balance can be credited after confirmations even if on-chain funds have not yet been consolidated into a platform-controlled main wallet.
- [2026-04-18] Learner currently models withdrawal funds as held through broadcast and only deducted at confirmation, while correctly identifying that txid alone does not imply final success.
- [2026-04-18] Learner now sees that after successful broadcast the funds have effectively entered chain settlement and cannot simply be released back to available without risking loss.
- [2026-04-18] Learner identifies realistic settling failure modes: dropped/expired mempool entries, replacement/cancellation, and reorg-related invalidation.
- [2026-04-18] Learner now converges on the right boundary: settlement starts after the platform has successfully signed/broadcast the transaction and obtained chain-level acceptance evidence such as a txid.
- [2026-04-18] Learner can narrate the full withdrawal pipeline end-to-end, but still tends to reuse `held` as both a balance state and a withdrawal-request status.
- [2026-04-18] Learner corrected the distinction: `held` belongs to balances, while the withdrawal request should use a workflow status such as pending/queued/processing.
- [2026-04-18] Learner now orders the core objects correctly (`WithdrawalRequest -> TransferIntent -> SignedTransaction`) and understands signing precedes broadcast.
- [2026-04-18] Remaining gap: not all execution failures should keep funds in `held`; need to distinguish retryable execution failures from terminal request failure.

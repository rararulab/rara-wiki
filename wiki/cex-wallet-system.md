---
title: CEX Wallet System
tags: [concept, architecture, finance, crypto, exchange]
date: 2026-04-18
sources:
  - raw/conversations/2026-04-18-cex-wallet-system-learning.md
status: stable
---

# CEX Wallet System

A Bybit-style CEX wallet system is not a single wallet or a single address. It is a layered
system that separates user-facing business workflow, internal ledger updates, custody policy,
chain-specific execution, and blockchain settlement. Source:
`raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## Core Separation

The first important distinction is between internal exchange accounting and on-chain
settlement. Most user trading inside a centralized exchange does not settle on-chain for each
trade. Instead, the exchange updates its internal ledger and only touches the blockchain for
deposits, withdrawals, sweeps, and wallet-tier rebalancing. Source:
`raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## Main Layers

At a high level, the system breaks into these layers:

1. API and auth
2. withdrawal orchestration and risk checks
3. internal ledger
4. transfer-intent generation
5. signing and broadcasting
6. custody tiers
7. chain adapters
8. blockchain nodes and the public chain

This decomposition keeps KYC, limits, and workflow decisions out of the chain-execution path
while also keeping private-key control out of the business layer. Source:
`raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## Two Independent State Machines

The conversation established that a production wallet system needs at least two state lines,
not one.

### Balance State

- `available`
- `held`
- `deducted`

These states describe whether a user can still use funds and whether the exchange has
formally removed those funds from the user's internal balance. Source:
`raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

### Workflow State

- `submitted`
- `approved`
- `processing`
- `settling`
- `completed` or `failed`

These states describe the lifecycle of the withdrawal request itself. They are not the same
thing as balance columns. Source:
`raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## Withdrawal Object Model

The withdrawal path is better modeled with three separate objects:

1. `WithdrawalRequest` — the business request created from the user's withdrawal intent
2. `TransferIntent` — the execution-ready instruction sent into the wallet execution layer
3. `SignedTransaction` — the chain-specific signed payload that can be broadcast

This separation prevents user/KYC/risk details from leaking into lower chain-execution
components and gives the execution layer a stable, standardized input. Source:
`raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## Settlement Boundary

Settlement should not be treated as starting the moment a worker starts processing. The
meaningful boundary is later: after the system has selected the right wallet pool, built the
transaction, signed it, broadcast it, and received chain-level acceptance evidence such as a
`txid`. Source: `raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

That boundary matters because:

- `worker started` is still pre-chain execution
- signed but not broadcast is still pre-chain settlement
- broadcast accepted is not final success
- finality still depends on confirmations and chain behavior

## Retryable vs Terminal Failure

The conversation distinguished between failures that should keep funds frozen and failures
that should release them.

- Retryable uncertainty, such as RPC timeout or ambiguous broadcast outcome: usually keep
  funds `held`
- Terminal failure, such as invalid destination address: mark the request `failed` and return
  funds from `held` to `available`

This prevents double spending and prevents the platform from both losing funds on-chain and
restoring the user's internal balance at the same time. Source:
`raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## Deposits, Sweep, and Rebalancing

The deposit path has two separate actions:

- credit the internal ledger after enough confirmations
- later sweep funds from scattered deposit addresses back into platform-controlled wallets

The conversation also clarified that sweep and rebalancing are different:

- sweep: consolidate money from many ingress addresses
- rebalancing: move liquidity across hot, warm, and cold wallet tiers

Source: `raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## Wallet Tiers

The wallet tier model exists to balance liquidity and safety:

- hot wallet: small balance, high automation, supports real-time withdrawals
- warm wallet: controlled buffer used to refill hot wallet liquidity
- cold wallet: highest custody threshold, holds the majority of assets

Cold wallets are not "never move" wallets in the absolute sense. They move only under much
higher-friction, higher-assurance operational flows. Source:
`raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## BTC vs EVM Adapter Difference

The execution layer must branch by chain model.

- Bitcoin is output-based: the system spends specific outputs and may need change outputs
- EVM chains are account-based: the system spends from an account balance and must manage
  nonce ordering and gas

Because of that difference, a single generic transaction-construction implementation is not a
good abstraction boundary across both chain types. Source:
`raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## Practical Learning Sequence

The conversation converged on a useful learning/build order:

1. internal ledger and balance-state transitions
2. withdrawal orchestrator
3. single-chain executor, preferably EVM first
4. retryable and terminal failure handling
5. deposit scanner and crediting
6. sweep and wallet-tier rebalancing
7. multi-chain adapter expansion

Source: `raw/conversations/2026-04-18-cex-wallet-system-learning.md`.

## Related

- [[conversation-learning]]
- [[three-layer-architecture]]
- [[llm-wiki]]

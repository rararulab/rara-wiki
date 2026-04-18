# Bybit-Style CEX Wallet System Summary

## 1. System Layers

```mermaid
flowchart TD
    U[User / Client] --> API[API Gateway / Auth]
    API --> ORCH[Withdrawal Orchestrator]
    ORCH --> LEDGER[Internal Ledger]
    ORCH --> RISK[Risk / KYC / Limits]
    ORCH --> INTENT[Transfer Intent]
    INTENT --> EXEC[Signer / Broadcaster]
    EXEC --> CUSTODY[Custody Layer]
    EXEC --> ADAPTER[Chain Adapters]
    ADAPTER --> NODE[Blockchain Nodes / RPC]
    NODE --> CHAIN[Public Blockchain]

    CUSTODY --> HOT[Hot Wallet]
    CUSTODY --> WARM[Warm Wallet]
    CUSTODY --> COLD[Cold Wallet]

    DEP[Deposit Scanner] --> NODE
    DEP --> LEDGER
    SWEEP[Sweep / Rebalancing Jobs] --> CUSTODY
    SWEEP --> NODE
```

## 2. Withdrawal End-to-End Sequence

```mermaid
sequenceDiagram
    participant User
    participant API as API / Gateway
    participant Orch as Withdrawal Orchestrator
    participant Ledger as Internal Ledger
    participant Risk as Risk Engine
    participant Intent as Transfer Intent Service
    participant Exec as Signer/Broadcaster
    participant Node as Chain Node / RPC
    participant Chain as Blockchain

    User->>API: Submit withdrawal request
    API->>Orch: Authenticated request
    Orch->>Risk: Precheck / KYC / limits / policy
    Risk-->>Orch: Approved
    Orch->>Ledger: available -> held
    Orch->>Orch: Create WithdrawalRequest(status=submitted/approved)
    Orch->>Intent: Create TransferIntent
    Intent->>Exec: Standardized transfer instruction
    Exec->>Exec: Select wallet pool / build tx
    Exec->>Exec: Sign transaction
    Exec->>Node: Broadcast signed transaction
    Node-->>Exec: txid / accepted
    Exec-->>Orch: Enter settling
    Node->>Chain: Propagate transaction
    Chain-->>Node: Confirmations increase
    Node-->>Exec: Final confirmations reached
    Exec-->>Orch: settled
    Orch->>Ledger: held -> deducted
    Orch-->>User: Withdrawal completed
```

## 3. Deposit Path

```mermaid
sequenceDiagram
    participant User
    participant Addr as Deposit Address
    participant Node as Chain Node / RPC
    participant Scanner as Deposit Scanner
    participant Ledger as Internal Ledger
    participant Sweep as Sweep Job
    participant Wallet as Platform-Controlled Wallet

    User->>Addr: Send funds on-chain
    Node->>Scanner: Observe deposit transaction
    Scanner->>Scanner: Wait for required confirmations
    Scanner->>Ledger: Credit user balance
    Ledger-->>User: Funds become available
    Sweep->>Addr: Consolidate funds
    Sweep->>Wallet: Move funds to controlled wallet
```

## 4. Two Independent State Machines

```mermaid
stateDiagram-v2
    [*] --> Available
    Available --> Held: withdrawal approved
    Held --> Available: terminal failure / reject / cancel
    Held --> Settling: signed + broadcast accepted + txid
    Settling --> Settled: enough confirmations
    Settling --> Held: uncertain retry path (optional design)
    Settled --> Deducted: finalize ledger posting
```

```mermaid
stateDiagram-v2
    [*] --> Submitted
    Submitted --> Approved: risk checks passed
    Submitted --> Failed: rejected before execution
    Approved --> Processing: worker started
    Processing --> Settling: broadcast accepted / txid received
    Processing --> Failed: terminal execution error
    Settling --> Completed: enough confirmations
    Settling --> Failed: dropped / replaced / reorg / terminal timeout
```

## 5. Core Objects

```mermaid
flowchart LR
    WR[WithdrawalRequest<br/>user-facing business request] --> TI[TransferIntent<br/>standardized execution intent]
    TI --> STX[SignedTransaction<br/>chain-specific signed payload]
```

- `WithdrawalRequest`: user intent, business workflow, risk/KYC context
- `TransferIntent`: execution-ready instruction, request id, asset, amount, chain, wallet pool, destination
- `SignedTransaction`: chain-specific signed payload to broadcast

## 6. Wallet Tier Model

```mermaid
flowchart LR
    COLD[Cold Wallet<br/>largest assets<br/>highest security] --> WARM[Warm Wallet<br/>controlled liquidity buffer]
    WARM --> HOT[Hot Wallet<br/>real-time withdrawals]
    HOT --> USER[User External Wallet]
```

- `Hot wallet`: real-time withdrawals, smallest balance, highest exposure
- `Warm wallet`: refill hot wallet, slower and higher-control path
- `Cold wallet`: majority of assets, strictest approval and custody controls

## 7. Sweep vs Rebalancing

```mermaid
flowchart TD
    DEPADDRS[Many deposit addresses] --> SWEEP[Sweep<br/>collect scattered funds]
    SWEEP --> MAIN[Platform-controlled wallet]
    MAIN --> REB[Rebalancing<br/>move liquidity across tiers]
    REB --> HOT[Hot wallet]
    REB --> WARM[Warm wallet]
    REB --> COLD[Cold wallet]
```

## 8. BTC vs EVM Adapter Difference

```mermaid
flowchart LR
    BTC[BTC Adapter] --> UTXO[UTXO selection<br/>inputs / change output]
    EVM[EVM Adapter] --> NONCE[Account balance + nonce<br/>gas / transaction ordering]
```

- BTC is output-based: you spend specific outputs and may need change
- EVM is account-based: you spend from account balance and need nonce ordering
- Therefore `BTC adapter` and `EVM adapter` should not share the exact same tx-building logic

## 9. What We Established

1. CEX internal trading does **not** require on-chain settlement for every trade.
2. The exchange wallet system is not just "an address holding money"; it is a system of:
   - internal ledger
   - withdrawal orchestration
   - signing/broadcast
   - custody tiers
   - chain adapters
   - reconciliation and operations
3. Balance state and workflow state are different:
   - balance line: `available -> held -> deducted`
   - request line: `submitted -> approved -> processing -> settling -> completed/failed`
4. `txid` does not mean final success; broadcast acceptance and final confirmation are different phases.
5. Retryable failures and terminal failures must be handled differently:
   - retryable: usually keep funds held
   - terminal: fail request and release funds
6. Deposit crediting and sweep are different:
   - crediting adds internal user balance
   - sweep consolidates chain funds back into platform-controlled wallets
7. Wallet tiers exist to balance liquidity and safety, not merely to classify assets by size.

## 10. Suggested Next Steps

1. Design the actual database schema for balances, withdrawal requests, and transfer intents.
2. Draw a production-grade sequence diagram for one chain, preferably EVM first.
3. Implement a minimal single-chain wallet backend:
   - deposit scanner
   - withdrawal orchestrator
   - signer/broadcaster
   - ledger state transitions

---
title: oh-my-codex (OMX)
tags: [concept, agent-orchestration, codex, openai]
date: 2026-04-09
sources:
  - raw/agent-tools/2026-04-09-oh-my-codex-source-card.md
status: needs-review
---

# oh-my-codex (OMX)

Multi-agent orchestration layer for OpenAI Codex CLI. This page was created from an
earlier ingest and now has a local traceability card, but time-sensitive repository
metrics still need a fresh upstream refresh before use. Source:
`raw/agent-tools/2026-04-09-oh-my-codex-source-card.md`.

> **Core premise**: OMX does not replace Codex. It adds a better working layer around it — better task routing, better workflow, better runtime.

## The Long-Task Problem

Codex CLI has a session timeout. A long task cannot be completed in one Codex session — the context window closes, state is lost, progress is gone. This is the fundamental constraint OMX solves.

## How OMX Solves It

### 1. State Persistence (`.omx/`)

Runtime state lives on disk, not in memory:

```
.omx/
  state/              — mode state (team/ralph/autopilot)
  notepad.md          — session notes
  project-memory.json — cross-session memory
  plans/              — plans
  logs/               — logs
```

Each phase writes state on start, updates on transition, marks `completed_at` on finish. A dead session resumes from checkpoint, not from scratch.

### 2. Staged Pipeline

```
plan → prd → exec → verify → fix
```

Long tasks are not monolithic. Each stage produces a verifiable artifact. A failure at stage 3 doesn't restart from 1 — it resumes at 3 with full context.

### 3. Two Long-Task Execution Modes

#### `$ralph` — Self-referential verification loop

Single agent executes, then verifies its own output. If verification fails, loops back. Continues until verified complete, regardless of how many cycles.

```
$ralph = Self-referential loop with verifier verification until completion
```

Sizing guidance:
- Small changes → lightweight verification
- Standard changes → standard verification
- Large/architectural/security → thorough verification

#### `$team` — Parallel multi-agent with git worktree isolation

```
team-plan → team-prd → team-exec → team-verify → team-fix (loop)
```

Leader responsibilities:
1. Pick the mode, keep user-facing brief current
2. Delegate bounded, verifiable subtasks with clear ownership
3. Integrate results, own final verification

Worker responsibilities:
1. Execute assigned slice; do not rewrite global plan
2. Escalate blockers and conflicts upward
3. Report completion or blocker

Every worker gets an isolated git worktree at `.omx/team/<name>/worktrees/worker-N`. Workers write to detached branches. Leader continuously merges via merge/cherry-pick/rebase. Conflicts detected early, reported in `integration-report.md`.

### 4. Native Hooks (v0.12.1)

Hooks now wire directly through Codex runtime contract — no external shims needed.

- `PreToolUse` / `PostToolUse` Bash hooks — destructive commands trigger warnings, errors surface structured guidance
- Every tool call fires the hook, enabling mid-execution intervention
- Team sessions use tmux + `omx tmux-hook` as fallback

```
.codex/hooks.json  = native Codex hook registrations
.omx/hooks/*.mjs   = OMX plugin hooks
```

### 5. 5 MCP Servers for Persistent Context

| Server | Purpose |
|--------|---------|
| State server | Read/write `.omx/state/` |
| Memory server | Cross-session memory |
| Code intel server | Code indexing, semantic search |
| Trace server | Execution trace, replay |
| (5th) | [docs not detailed] |

MCP servers solve the context window limitation — state lives external, pulled in on demand.

## Comparison: OMX vs ralph

| | ralph | oh-my-codex |
|---|---|---|
| Architecture | Single agent self-loop | Multi-layer (hook + state + MCP + team) |
| Persistence | Self-checkpoints | External `.omx/` + MCP servers |
| Parallelism | Serial loop | Git worktree parallel |
| Timeout strategy | Verifier loop prevents session exit | Leader takeover + resume from checkpoint |
| Scope | One agent completing one task | Orchestrated team pipeline |

## Key Files

- `AGENTS.md` — top-level operating contract (319 lines, 18.3KB)
- `skills/ralph.md` / `skills/team.md` — workflow definitions
- `prompts/*.md` — role prompts (architect, planner, executor, verifier, etc.)
- `docs/mcp-servers.md` — MCP integration reference

## Ecosystem

The earlier ingest noted related projects and ports, but those references are stale until
refreshed from upstream. Keep the architectural notes above, and refresh source metrics or
ecosystem claims before relying on them. Source:
`raw/agent-tools/2026-04-09-oh-my-codex-source-card.md`.

## Relevant Patterns

- [[three-layer-architecture]] — OMX's structure maps to Layer 1 (raw docs = Codex output), Layer 2 (wiki = `.omx/` state), Layer 3 (schema = AGENTS.md)
- [[llm-wiki]] — the persistence model OMX uses for state is conceptually similar to LLM Wiki's incremental accumulation vs re-derivation

---
title: Three-Layer Architecture
tags: [concept, architecture, llm-wiki]
date: 2026-04-18
sources:
  - raw/patterns/2026-04-18-karpathy-llm-wiki.md
status: stable
---

# Three-Layer Architecture

The wiki uses three layers: immutable raw sources, mutable compiled wiki pages, and schema
instructions that tell agents how to maintain the system. Source:
`raw/patterns/2026-04-18-karpathy-llm-wiki.md`.

## Layers

| Layer | Directory | Role |
| --- | --- | --- |
| Raw sources | `raw/` | Source cards, captures, and evidence. Additive and immutable. |
| Wiki | `wiki/` | LLM-maintained markdown knowledge pages. Mutable and cross-linked. |
| Schema and harness | `schema/`, `AGENTS.md` | Conventions, workflows, roles, and verification gates. |

## Why It Matters

The separation keeps source truth distinct from synthesis. Agents can revise wiki pages as
understanding improves while preserving the source cards that justify each claim. Source:
`raw/patterns/2026-04-18-karpathy-llm-wiki.md`.

## Related

- [[llm-wiki]]
- [[agent-harness]]


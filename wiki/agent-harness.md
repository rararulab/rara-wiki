---
title: Agent Harness
tags: [concept, agent-harness, bmad, workflow]
date: 2026-04-18
sources:
  - raw/methods/2026-04-18-bmad-method.md
  - raw/patterns/2026-04-18-karpathy-llm-wiki.md
status: stable
---

# Agent Harness

The agent harness is the operating layer that turns this repository from a folder of
markdown into a maintained [[llm-wiki]]. It defines roles, workflows, artifact handoffs,
and verification gates so future agents do not improvise the wiki process from scratch.

## BMAD Adaptation

BMAD contributes the role-and-phase model: analyze, plan, solution, implement, and review
with specialized agent responsibilities. Source: `raw/methods/2026-04-18-bmad-method.md`.

This repo adapts that model to wiki maintenance:

- Analysis becomes source capture in `raw/`.
- Conversation becomes a first-class source stream under `raw/conversations/`.
- Planning becomes scope selection: quick edit, ingest, synthesis, or harness change.
- Solutioning becomes schema and cross-link design.
- Implementation becomes wiki edits.
- Review becomes `tools/wiki_lint.py` plus human-readable log entries.

## Local Contract

The authoritative harness files are:

- `AGENTS.md`
- `schema/AGENT_HARNESS.md`
- `schema/WIKI.md`
- `tools/wiki_lint.py`
- [[conversation-learning]]

## Related

- [[three-layer-architecture]]
- [[conversation-learning]]
- [[github-pages-site]]
- [[rag-vs-llm-wiki]]
- [[oh-my-codex]]

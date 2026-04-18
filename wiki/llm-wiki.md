---
title: LLM Wiki
tags: [concept, knowledge-base, llm-wiki]
date: 2026-04-18
sources:
  - raw/patterns/2026-04-18-karpathy-llm-wiki.md
status: stable
---

# LLM Wiki

An LLM Wiki is a persistent, compounding knowledge base maintained by an LLM. Instead of
retrieving raw documents and re-synthesizing them from scratch on every question, the LLM
turns sources into durable markdown pages and keeps those pages current as new material
arrives. Source: `raw/patterns/2026-04-18-karpathy-llm-wiki.md`.

## Core Property

The wiki is not chat history and not just an index. It is the compiled knowledge layer:
summaries, entity pages, concept pages, comparisons, contradictions, and syntheses that can
be read and revised later. Source: `raw/patterns/2026-04-18-karpathy-llm-wiki.md`.

## Local Implementation

This repo implements the pattern with [[three-layer-architecture]]:

- `raw/` stores source cards and immutable captures.
- `wiki/` stores mutable knowledge pages.
- `schema/` and `AGENTS.md` store the operating rules.

## Related

- [[rag-vs-llm-wiki]]
- [[agent-harness]]


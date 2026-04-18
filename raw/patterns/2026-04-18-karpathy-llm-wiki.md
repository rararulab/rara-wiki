---
title: Karpathy LLM Wiki Pattern
source_url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
captured: 2026-04-18
type: source-card
status: captured
---

# Karpathy LLM Wiki Pattern

Source card for Andrej Karpathy's `llm-wiki.md` gist, created 2026-04-04.

## Relevant Facts

- The pattern contrasts ordinary RAG with a persistent wiki that the LLM incrementally
  maintains.
- The durable structure has three layers: immutable raw sources, mutable LLM-written wiki
  pages, and a schema or agent instruction file that defines conventions.
- Main operations are ingest, query, and lint.
- `wiki/index.md` is content-oriented navigation.
- `wiki/log.md` is chronological, append-only operation history.
- The implementation is intentionally abstract; each project should instantiate the
  directory layout, schema, page formats, and tooling that fit its domain.

## Use In This Repo

This source supports `README.md`, `schema/WIKI.md`, and the foundational wiki pages:
`wiki/llm-wiki.md`, `wiki/three-layer-architecture.md`, and
`wiki/rag-vs-llm-wiki.md`.


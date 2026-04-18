---
title: RAG vs LLM Wiki
tags: [concept, rag, llm-wiki]
date: 2026-04-18
sources:
  - raw/patterns/2026-04-18-karpathy-llm-wiki.md
status: stable
---

# RAG vs LLM Wiki

RAG retrieves relevant source chunks at query time. An LLM Wiki compiles source material
into durable pages ahead of future queries and updates those pages as new evidence arrives.
Source: `raw/patterns/2026-04-18-karpathy-llm-wiki.md`.

## Practical Difference

| Dimension | RAG | LLM Wiki |
| --- | --- | --- |
| State | Mostly query-time retrieval | Persistent accumulated synthesis |
| Work reuse | Repeats synthesis per question | Reuses maintained pages |
| Contradictions | Found if retrieved in context | Can be recorded and revisited |
| Navigation | Search results | Index, wikilinks, graph, log |
| Maintenance | Indexing pipeline | Agent workflow plus linting |

## Local Implication

This repo should not only answer questions. When an answer becomes reusable knowledge, it
should be written back into `wiki/`, linked from `wiki/index.md`, and logged in
`wiki/log.md`. Source: `raw/patterns/2026-04-18-karpathy-llm-wiki.md`.

## Related

- [[llm-wiki]]
- [[three-layer-architecture]]


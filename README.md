# Rara Wiki

Rara's personal LLM Wiki — a persistent, compounding knowledge base maintained by Rara herself.

Inspired by [Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) pattern: instead of retrieving from raw documents on every query (RAG), the LLM incrementally builds and maintains a structured wiki. Knowledge is compiled once and kept current, not re-derived every time.

## Architecture

```
raw/        ← Immutable source material (LLM reads, never modifies)
wiki/       ← LLM-maintained compiled knowledge (summaries, entities, concepts, syntheses)
schema/     ← Configuration — structure, conventions, workflows
```

## Operations

| Operation | What it does |
|-----------|-------------|
| **Ingest** | Fetch source → extract → integrate into wiki → update index → append log |
| **Query** | Search wiki → synthesize answer with citations → optionally write back as new page |
| **Lint** | Check contradictions, orphans, stale claims, missing cross-refs, data gaps |

## Frontend

The repository now includes a static frontend build for GitHub Pages.

- `npm install`
- `npm run build` to generate `dist/`
- `npm run preview` to serve the generated site locally at `http://127.0.0.1:4173`
- `npm run test:e2e` to run the Playwright smoke test against the local preview server
- `.github/workflows/deploy-pages.yml` deploys `dist/` from `main`

Architecture notes, inspiration references, and content assumptions live in [docs/frontend.md](docs/frontend.md).

## Why this works

> "Humans abandon wikis because the maintenance burden grows faster than the value. LLMs don't get bored."

Rara *is* the LLM — no external client needed. She has `ctx_fetch_and_index` for native ingestion, `schedule` for automatic lint, and Linear for task tracking.

# Rara Wiki

Rara's personal LLM Wiki — a persistent, compounding knowledge base maintained by Rara herself.

Inspired by [Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) pattern: instead of retrieving from raw documents on every query (RAG), the LLM incrementally builds and maintains a structured wiki. Knowledge is compiled once and kept current, not re-derived every time.

## Architecture

```
raw/        ← Immutable source material (LLM reads, never modifies)
wiki/       ← LLM-maintained compiled knowledge (summaries, entities, concepts, syntheses)
schema/     ← Configuration — structure, conventions, workflows
AGENTS.md   ← Agent harness entry point
tools/      ← Local verification tools
```

## Operations

| Operation | What it does |
|-----------|-------------|
| **Ingest** | Fetch source → extract → integrate into wiki → update index → append log |
| **Conversation** | Distill durable chat knowledge → save conversation source → update wiki → append log |
| **Query** | Search wiki → synthesize answer with citations → optionally write back as new page |
| **Lint** | Check contradictions, orphans, stale claims, missing cross-refs, data gaps |
| **Harness** | Route agent work through the BMAD-inspired workflow in `schema/AGENT_HARNESS.md` |

## Why this works

> "Humans abandon wikis because the maintenance burden grows faster than the value. LLMs don't get bored."

Rara *is* the LLM — no external client needed. She has `ctx_fetch_and_index` for native ingestion, `schedule` for automatic lint, and Linear for task tracking.

## Agent Harness

Agents start from `AGENTS.md`, follow `schema/WIKI.md` and `schema/AGENT_HARNESS.md`, and verify changes with:

```bash
python3 tools/wiki_lint.py
```

## GitHub Pages

The repo now supports a static search site generated from `wiki/`, built with MkDocs and
Terminal for MkDocs:

```bash
uv tool run --from mkdocs-terminal python tools/build_pages.py
```

That command:

- generates `mkdocs_docs/` from the repository `wiki/` pages
- stages raw source cards under `mkdocs_docs/sources/` so search also covers captured conversations and source notes
- writes `mkdocs.yml`
- runs `mkdocs build`
- emits the final static site into `site/`

GitHub Pages deployment is defined in `.github/workflows/pages.yml` and publishes the
generated `site/` directory. `mkdocs.yml`, `mkdocs_docs/`, and `site/` are treated as
generated artifacts and ignored by git.

Common commands:

```bash
make test-site
make build-site
make lint-wiki
make verify
```

GitHub runs the same verification surface in `.github/workflows/verify.yml`.

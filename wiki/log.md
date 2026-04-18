# Wiki Log

> Append-only chronological record of wiki operations.

---

## [2026-04-08] init

- Wiki repository created
- Directory structure established (raw/, wiki/, schema/)
- Index and log initialized

---

## [2026-04-09] ingest: oh-my-codex

- Researched `Yeachan-Heo/oh-my-codex` (18.9k stars) and ecosystem (`claw-code`, 178k stars)
- Ingested: GitHub repo, documentation website, AGENTS.md, README
- Created `wiki/oh-my-codex.md` — concept page covering: state persistence (.omx/), staged pipeline, ralph vs team modes, native hooks, MCP servers, comparison with ralph
- Updated index.md with new page under Concepts category
- Key findings: OMX solves Codex long-task timeout via persistent state + staged pipeline + parallel worktrees — not by making a smarter agent, but by making a better调度层

---

## [2026-04-18] harness | BMAD-inspired agent harness

- Created root `AGENTS.md` as the agent entry contract
- Created `schema/AGENT_HARNESS.md` mapping BMAD roles and workflows to wiki maintenance
- Added raw source cards for Karpathy LLM Wiki, BMAD Method, and legacy oh-my-codex traceability
- Created missing concept pages: `llm-wiki`, `three-layer-architecture`, `rag-vs-llm-wiki`, `agent-harness`
- Added `tools/wiki_lint.py` as the local verification gate
- Updated `wiki/index.md`, `README.md`, and `schema/WIKI.md` to reflect the harness

---

## [2026-04-18] conversation | automatic learning from project chat

- Captured the user's expectation that substantive project chats should be auto-ingested
- Created `raw/conversations/2026-04-18-chat-learning-expectation.md`
- Created `wiki/conversation-learning.md`
- Updated `AGENTS.md`, `schema/AGENT_HARNESS.md`, `README.md`, `wiki/agent-harness.md`, and `wiki/index.md`

---

## [2026-04-18] publishing | GitHub Pages search site

- Captured the request in `raw/conversations/2026-04-18-github-pages-search-request.md`
- Created `wiki/github-pages-site.md`
- Added `tools/build_pages.py` and tests in `tests/test_build_pages.py`
- Generated the static site bundle in `site/`
- Added `.github/workflows/pages.yml` for Pages deployment
- Updated `README.md` and `wiki/index.md`

---

## [2026-04-18] publishing | switch GitHub Pages to MkDocs Terminal theme

- Captured the theme decision in `raw/conversations/2026-04-18-mkdocs-terminal-request.md`
- Reworked `tools/build_pages.py` to generate MkDocs docs source and run `mkdocs build`
- Updated tests to validate MkDocs staging and config generation
- Updated `.github/workflows/pages.yml`, `README.md`, and `wiki/github-pages-site.md`

---

## [2026-04-18] harness | add publishing flow for MkDocs site

- Updated `AGENTS.md` with `Publishing Flow` and MkDocs rebuild expectations
- Updated `schema/AGENT_HARNESS.md` with a dedicated publishing workflow
- Updated `wiki/github-pages-site.md` to state that public content changes require a rebuild

---

## [2026-04-18] publishing | group MkDocs navigation and ignore generated artifacts

- Updated `tools/build_pages.py` to stage raw source cards into MkDocs docs and grouped navigation
- Updated tests to cover source-card staging and grouped `mkdocs.yml` output
- Added `.gitignore` entries for generated MkDocs artifacts: `mkdocs.yml`, `mkdocs_docs/`, and `site/`
- Updated `README.md` and `wiki/github-pages-site.md`

---

## [2026-04-18] publishing | add source-card index links and make targets

- Updated `wiki/index.md` so the Sources section links to captured raw source cards by category
- Added `Makefile` with `test-site`, `build-site`, `lint-wiki`, and `verify`
- Updated `README.md`, `AGENTS.md`, and `wiki/github-pages-site.md`

---

## [2026-04-18] publishing | group concept navigation and add GitHub verify workflow

- Captured the request in `raw/conversations/2026-04-18-navigation-and-verify-request.md`
- Updated `tools/build_pages.py` so concept navigation is grouped into architecture, workflow, and publishing
- Updated `wiki/index.md` to mirror the grouped concept navigation and include the new conversation source
- Added `.github/workflows/verify.yml` to run `make verify` on pull requests and pushes to `main`
- Updated `README.md`, `AGENTS.md`, and `wiki/github-pages-site.md`

---

## [2026-04-18] publishing | make verify compatible with CI runners without uv

- Updated `Makefile` so `build-site` uses `uv tool run` when `uv` exists and falls back to the active Python environment otherwise
- Confirmed `make verify` works in a no-`uv` virtualenv with `mkdocs-terminal` installed

---

## [2026-04-18] conversation | CEX wallet system learning

- Captured the tutoring session in `raw/conversations/2026-04-18-cex-wallet-system-learning.md`
- Created `wiki/cex-wallet-system.md`
- Updated `wiki/index.md` with the new architecture concept and conversation source
- Distilled durable conclusions around: internal ledger vs on-chain settlement, dual state machines, withdrawal object model, settlement boundary, retryable vs terminal failure, sweep vs rebalancing, wallet tiers, and BTC vs EVM adapter differences

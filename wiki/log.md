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

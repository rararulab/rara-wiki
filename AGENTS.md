# Rara Wiki Agent Harness

This repository is an LLM-maintained wiki. The agent's job is to keep a persistent,
source-traceable markdown knowledge base current. Do not treat chat answers as the
artifact of record; durable knowledge belongs in `wiki/`, with source material in
`raw/` and operating rules in `schema/`.

## Canonical Files

- `schema/WIKI.md` defines wiki structure, page conventions, and quality standards.
- `schema/AGENT_HARNESS.md` defines the BMAD-inspired agent workflow.
- `wiki/index.md` is the content catalog and must be updated with every wiki page change.
- `wiki/log.md` is append-only and records ingests, queries written back, lint passes,
  and schema changes.
- `tools/wiki_lint.py` is the local verification gate.
- `tools/build_pages.py` stages and builds the MkDocs public site.
- `.github/workflows/pages.yml` deploys the generated `site/` directory to GitHub Pages.
- `Makefile` provides the stable local commands for testing, linting, building, and verification.
- `.github/workflows/verify.yml` runs `make verify` on pull requests and pushes to `main`.

## Work Routing

Use the smallest workflow that completes the task.

1. **Quick Wiki Flow**: small edits, index fixes, spelling, formatting, local cleanup.
2. **Ingest Flow**: a new source, URL, document, repo, article, paper, or transcript.
3. **Conversation Flow**: a substantive chat produces durable knowledge for future work.
4. **Synthesis Flow**: a user asks a question whose answer should become durable wiki
   knowledge.
5. **Publishing Flow**: rebuild MkDocs output after changes that affect the public site.
6. **Harness Flow**: changes to schema, agent rules, lint rules, or operating process.

The workflow details and role mapping are in `schema/AGENT_HARNESS.md`.

## Non-Negotiable Gates

- Raw source material is immutable after creation. Add a new dated raw file instead of
  rewriting an old one.
- Wiki pages are mutable, but every material claim needs a source path or explicit
  uncertainty marker.
- Every wiki page except `index.md` and `log.md` needs YAML frontmatter with
  `title`, `tags`, `date`, `sources`, and `status`.
- Every wiki page except `index.md` and `log.md` must be listed in `wiki/index.md`.
- Internal wiki links use `[[page-slug]]` and must resolve to an existing page.
- When a substantive chat creates durable knowledge, create or update a raw conversation
  source under `raw/conversations/` and write the distilled result back into `wiki/`.
- When wiki content or publishing behavior changes, rebuild the public site with
  `uv tool run --from mkdocs-terminal python tools/build_pages.py`.
- Append one concise entry to `wiki/log.md` for every completed ingest, synthesis,
  lint repair, or harness/schema change.
- Run `python3 tools/wiki_lint.py` before reporting completion.

## BMAD Adaptation

BMAD's useful constraint for this repo is not heavyweight ceremony. It is role-separated
artifact flow: analyze source, scope the change, update durable artifacts, review them,
then record the operation. This repo maps BMAD-style agents to wiki maintenance roles
without requiring a full generated BMAD installation.

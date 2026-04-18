---
title: GitHub Pages Site
tags: [concept, publishing, github-pages, search]
date: 2026-04-18
sources:
  - raw/conversations/2026-04-18-github-pages-search-request.md
  - raw/conversations/2026-04-18-mkdocs-terminal-request.md
  - raw/conversations/2026-04-18-navigation-and-verify-request.md
status: stable
---

# GitHub Pages Site

This repo publishes a static reading surface for the wiki through GitHub Pages. The site is
generated from the markdown pages in `wiki/` and is built with MkDocs using the Terminal
for MkDocs theme. Search is handled by the MkDocs built-in search plugin as surfaced by the
theme. Sources: `raw/conversations/2026-04-18-github-pages-search-request.md`,
`raw/conversations/2026-04-18-mkdocs-terminal-request.md`.

## Build Model

The site is built by `tools/build_pages.py`. The generator stages a frontmatter-free
MkDocs docs tree from the repository wiki pages, writes `mkdocs.yml`, and runs
`mkdocs build` to emit the final `site/` directory. Sources:
`raw/conversations/2026-04-18-github-pages-search-request.md`,
`raw/conversations/2026-04-18-mkdocs-terminal-request.md`.

Any change that affects public wiki content or publishing behavior should be followed by a
fresh site rebuild so GitHub Pages stays aligned with the repository source of truth.

## Search Scope

The public site search covers both wiki pages and staged raw source cards. That means a
reader can search distilled knowledge pages as well as captured conversation notes and
source summaries from the raw ingestion streams.

## Navigation

The generated MkDocs navigation is grouped into concepts, sources, and the append-only log
instead of exposing one flat list of pages.

Concept pages are further grouped into architecture, workflow, and publishing sections so
the public site reads more like a curated knowledge base and less like a directory dump.

## Local Commands

The stable local command surface is:

- `make test-site`
- `make build-site`
- `make lint-wiki`
- `make verify`

## CI Verification

GitHub runs the same `make verify` entrypoint in `.github/workflows/verify.yml`, so pull
requests and pushes to `main` are checked against the same local verification surface.

## Why Static

GitHub Pages expects a static deployment model. A generated MkDocs site keeps hosting
simple, preserves search, and avoids maintaining a separate bespoke frontend. Sources:
`raw/conversations/2026-04-18-github-pages-search-request.md`,
`raw/conversations/2026-04-18-mkdocs-terminal-request.md`.

## Related

- [[conversation-learning]]
- [[agent-harness]]

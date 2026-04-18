# Agent Harness

This harness adapts the BMAD Method to a Karpathy-style LLM Wiki. BMAD is useful here
because it separates work into roles, phases, and artifacts. This repo stays lightweight:
the executable surface is markdown plus `tools/wiki_lint.py`, not a copied framework.

## External References

- `raw/patterns/2026-04-18-karpathy-llm-wiki.md` captures the LLM Wiki pattern.
- `raw/methods/2026-04-18-bmad-method.md` captures the BMAD Method facts used here.

## Design Choice

Do not install or vendor BMAD into this repo by default. BMAD's upstream installer creates
agent and workflow assets for IDEs. This wiki needs a smaller harness that any agent can
follow from repository-local files. If full BMAD installation becomes useful later, install
it as generated tooling and keep project-specific behavior in this schema file and the
root `AGENTS.md`.

## Agent Roles

| Harness role | BMAD analogue | Responsibility | Writes |
| --- | --- | --- | --- |
| Orchestrator | BMad Master | Route work, keep scope small, enforce gates | `wiki/log.md`, plans when needed |
| Source Analyst | Analyst | Read source, capture facts, identify entities/concepts | `raw/`, source notes |
| Scope Steward | Product Manager | Decide whether the output is a page, page update, or schema change | index/log notes |
| Schema Architect | Architect | Maintain page model, harness rules, cross-link structure | `schema/`, architecture pages |
| Wiki Maintainer | Developer | Apply the actual markdown edits | `wiki/`, `README.md` |
| Wiki Reviewer | Test Architect / Reviewer | Run lint, inspect traceability, flag contradictions | lint report, log entry |

The same agent may perform multiple roles in a small task, but the phases must still be
explicit in the artifacts: source, wiki edit, index, log, verification.

## Workflow: Quick Wiki Flow

Use for local, reversible maintenance when no new external source is required.

1. Read `wiki/index.md`, the target pages, and relevant schema.
2. Make the smallest coherent edit.
3. Update `wiki/index.md` if page set, title, summary, or category changes.
4. Append a `lint` or `maintenance` entry to `wiki/log.md`.
5. Run `python3 tools/wiki_lint.py`.

## Workflow: Ingest Flow

Use when the user gives a URL, repo, file, article, paper, transcript, or other new source.

1. Create one immutable source card under `raw/{topic}/{YYYY-MM-DD}-{slug}.md`.
2. Extract entities, concepts, claims, dates, and contradictions.
3. Create or update wiki pages. A source can touch multiple pages.
4. Link material claims back to the source card.
5. Update `wiki/index.md`.
6. Append an `ingest` entry to `wiki/log.md` listing created/updated pages.
7. Run `python3 tools/wiki_lint.py`.

## Workflow: Conversation Flow

Use when the conversation itself becomes a source of durable project knowledge.

1. Decide whether the exchange contains stable preferences, decisions, definitions,
   reusable conclusions, or architecture/process changes.
2. Create or update a dated conversation source under
   `raw/conversations/{YYYY-MM-DD}-{slug}.md`.
3. Distill the durable content into existing or new wiki pages.
4. Update `wiki/index.md` if a page was added or reclassified.
5. Append a `conversation` entry to `wiki/log.md` listing the source card and affected pages.
6. Run `python3 tools/wiki_lint.py`.

## Workflow: Publishing Flow

Use when wiki content, navigation, theme configuration, or public-site behavior changes.

1. Update the source of truth in `wiki/`, `README.md`, or harness/schema files.
2. Rebuild the public docs tree and site with
   `uv tool run --from mkdocs-terminal python tools/build_pages.py`.
3. Verify the generated `mkdocs_docs/`, `mkdocs.yml`, and `site/` outputs are coherent.
4. Append a `publishing` entry to `wiki/log.md`.
5. Run `python3 tools/wiki_lint.py`.

## Workflow: Synthesis Flow

Use when a user question produces reusable knowledge.

1. Read `wiki/index.md` first, then relevant pages.
2. Search `wiki/` and `raw/` for missing context.
3. Answer the user from existing source-traceable content.
4. If the answer should persist, create or update a `synthesis` wiki page.
5. Update `wiki/index.md` and append a `query` or `synthesis` log entry.
6. Run `python3 tools/wiki_lint.py` if files changed.

## Workflow: Harness Flow

Use for changes to agent behavior, schema, lint rules, or workflows.

1. Read `AGENTS.md`, `schema/WIKI.md`, and this file.
2. Check the upstream method only for current facts; do not import broad ceremony.
3. Update the smallest set of harness files.
4. Add or update a source card if an external method influenced the change.
5. Run `python3 tools/wiki_lint.py`.
6. Append a `harness` log entry.

## Verification Gates

The local gate is:

```bash
python3 tools/wiki_lint.py
```

The gate fails on:

- Missing or malformed frontmatter on content pages.
- Missing required frontmatter keys.
- `sources` that do not point to local `raw/` files or explicitly marked external URLs.
- Broken `[[wikilinks]]`.
- Content pages missing from `wiki/index.md`.
- Index entries pointing to missing pages.

The gate warns on:

- Pages with no inbound links except the index.
- Pages whose `status` is `needs-review`.
- Source cards that use external URLs without a local capture note.

## Output Discipline

Final reports should state what changed, why it changed, and what verification ran. When a
substantive chat created durable knowledge, assume conversation write-back is part of the
current task. Do not ask for the next obvious maintenance step; do it if it is part of the
current task.

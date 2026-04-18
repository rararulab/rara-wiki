# Wiki Schema

Configuration and conventions for Rara's LLM Wiki. Co-evolved by Rara and the user over time.

## Directory Conventions

| Directory | Owner | Mutability |
|-----------|-------|------------|
| `raw/` | User / Rara (fetch only) | Immutable after creation |
| `wiki/` | Rara | Fully mutable — Rara creates, updates, reorganizes |
| `schema/` | Co-evolved | Updated by agreement |
| `tools/` | Rara | Verification tooling |

The root `AGENTS.md` is the executable entry contract for agents. `schema/AGENT_HARNESS.md`
defines the BMAD-inspired workflow that agents follow before editing the wiki.

## Page Naming

- Use `kebab-case`: `transformer-architecture.md`, `rust-async-runtime.md`
- Be descriptive: `attention-mechanism.md` not `attn.md`
- Entity pages: one page per distinct entity (person, org, project)
- Concept pages: one page per distinct concept or pattern

## Frontmatter Schema

Every wiki page should include YAML frontmatter:

```yaml
---
title: Page Title
tags: [tag1, tag2]
date: 2026-04-08
sources:
  - raw/topic/2026-04-08-source-article.md
status: draft | stable | needs-review
---
```

- `tags`: categorical tags for filtering
- `date`: creation or last major update date
- `sources`: links back to raw source material (traceability)
- `status`: page health indicator

## Cross-Reference Conventions

- Use `[[wikilinks]]` for internal references: `[[transformer-architecture]]`
- Every claim should cite its source: `> Source: [[raw/papers/2026-04-08-attention-paper]]`
- Prefer explicit links over implicit mentions

## Ingest Workflow

1. **Fetch**: Use `ctx_fetch_and_index` to retrieve source content
2. **Store raw**: Save original content to `raw/{topic}/{date}-{slug}.md`
3. **Read & extract**: Identify key entities, concepts, claims, and relationships
4. **Create/update wiki pages**: A single source may touch 10-15 pages
   - Create new pages for new entities/concepts
   - Update existing pages with new information
   - Flag contradictions with existing content
   - Add cross-references to related pages
5. **Update index**: Add new pages to `wiki/index.md` under appropriate category
6. **Append log**: Add entry to `wiki/log.md` with format:
   ```
   ## [YYYY-MM-DD] ingest | Source Title
   - Created: page-a, page-b
   - Updated: page-c (added section X)
   - Flagged: contradiction between page-d and page-e
   ```

## Conversation Workflow

Use this when the conversation itself produces durable knowledge.

1. **Capture**: Save a dated note to `raw/conversations/{date}-{slug}.md`
2. **Distill**: Extract stable preferences, decisions, definitions, conclusions, and
   workflow changes
3. **Write back**: Update existing wiki pages or create a new synthesis/concept page
4. **Update index**: List any new page in `wiki/index.md`
5. **Append log**: Add a `conversation` entry to `wiki/log.md`

## Query Workflow

1. **Read index**: Start with `wiki/index.md` to find relevant pages
2. **Search wiki**: Use `ctx_search` to find specific content within pages
3. **Synthesize**: Read relevant pages, compose answer with `[[wikilinks]]` citations
4. **Write back** (optional): If the answer is valuable enough, create a new wiki page
   - Tag as `synthesis` in frontmatter
   - Link from index under "Syntheses" category

## Lint Workflow

Run periodically (can be scheduled via `schedule-cron`).

Check for:
- **Contradictions**: Claims on different pages that conflict
- **Orphan pages**: Pages with no inbound links from other wiki pages
- **Stale claims**: Information superseded by newer sources
- **Missing cross-references**: Pages that mention concepts without linking
- **Data gaps**: Topics mentioned but lacking their own page
- **Index drift**: Pages not listed in `wiki/index.md`
- **Broken wikilinks**: `[[links]]` pointing to non-existent pages

Output: a lint report. Auto-fix what's safe (index drift, missing cross-refs). Flag what needs human review (contradictions, stale claims).

## Quality Standards

- Every claim needs a source citation
- Every page must be listed in `wiki/index.md`
- Every page should have at least one inbound cross-reference (no orphans)
- Frontmatter must be complete and accurate
- Contradictions are explicitly flagged, not silently resolved
- Before reporting a file-changing task complete, run `python3 tools/wiki_lint.py`

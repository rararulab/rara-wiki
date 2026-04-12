# Frontend Architecture

The rara-wiki frontend is a small static generator rather than a full framework app.

## Why this direction

- The repository is markdown-first and already has a clean content split: `wiki/`, `raw/`, `schema/`, and `README.md`.
- GitHub Pages prefers a deterministic static output with low operational overhead.
- A custom Node build keeps the implementation transparent: the rendering rules for frontmatter, wikilinks, backlinks, source references, and collection pages all live in one build pipeline.

## Reference projects

These projects informed the direction, but rara-wiki intentionally keeps a narrower implementation surface:

- [Quartz](https://github.com/jackyzha0/quartz): markdown-native digital garden with strong graph, backlink, and wiki-link conventions.
- [Obsidian Digital Garden](https://github.com/oleeskild/obsidian-digital-garden): public publishing pattern for a markdown knowledge base with lightweight page metadata and navigation.
- [Jekyll Garden](https://github.com/Jekyll-Garden/jekyll-garden.github.io): an Obsidian-to-site presentation style that makes note networks browseable on static hosting.
- [Dendron](https://github.com/dendronhq/dendron): schema-aware knowledge base design, especially around backlinks, hierarchy, and refactor-safe linking.

## What the build generates

- A home page from `README.md`
- Page routes for every markdown file under `wiki/`, `raw/`, and `schema/`
- Collection indexes for wiki pages, raw sources, schema docs, and tags
- Client-side search via a generated JSON index
- Backlinks computed from `[[wikilinks]]`
- Frontmatter surfaces for tags, sources, date, and status
- Base-path-safe asset and page URLs for GitHub Pages project deployments

## Key files

- `scripts/build.mjs`: content ingestion, link resolution, HTML generation, search index generation
- `scripts/preview.mjs`: simple local static preview server
- `site/site.css`: layout, theming, responsive design, and typography
- `site/site.js`: theme toggle and client-side search
- `.github/workflows/deploy-pages.yml`: build and deployment workflow for GitHub Pages

## Content assumptions

- Wiki links are written as `[[page-name]]` or `[[path/to/page]]`
- Tags come from frontmatter
- Source links in frontmatter can be URLs or paths to markdown pages inside the repo
- `wiki/log.md` acts as the recent updates stream surfaced in the UI

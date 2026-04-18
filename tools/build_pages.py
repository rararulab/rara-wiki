#!/usr/bin/env python3
"""Build a MkDocs site for the wiki using Terminal for MkDocs."""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
from base64 import b64decode
from importlib.util import find_spec
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WIKI_DIR = ROOT / "wiki"
RAW_DIR = ROOT / "raw"
DOCS_DIR = ROOT / "mkdocs_docs"
SITE_DIR = ROOT / "site"
CONFIG_PATH = ROOT / "mkdocs.yml"

EXTRA_CSS = """
:root {
  --global-font-size: 15px;
}

.container {
  max-width: 1200px;
}

.terminal-mkdocs-main-content h1 {
  margin-bottom: 1.25rem;
}

.terminal-mkdocs-main-content p,
.terminal-mkdocs-main-content li {
  max-width: 78ch;
}

.terminal-mkdocs-main-content code {
  font-size: 0.92em;
}

.terminal-mkdocs-main-content table {
  display: table;
  width: 100%;
}

.terminal-mkdocs-side-nav-items .nav-link {
  line-height: 1.45;
}
"""

PNG_PLACEHOLDER = b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aWQAAAAASUVORK5CYII="
)

CONCEPT_SECTION_BY_SLUG = {
    "three-layer-architecture": "Architecture",
    "llm-wiki": "Architecture",
    "rag-vs-llm-wiki": "Architecture",
    "oh-my-codex": "Architecture",
    "agent-harness": "Workflow",
    "conversation-learning": "Workflow",
    "github-pages-site": "Publishing",
}


def parse_frontmatter(text: str) -> tuple[dict[str, object], str]:
    if not text.startswith("---\n"):
        return {}, text

    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text

    data: dict[str, object] = {}
    current_key: str | None = None
    for raw_line in text[4:end].splitlines():
        line = raw_line.rstrip()
        if not line:
            continue
        if line.startswith("  - "):
            if current_key is None:
                continue
            data.setdefault(current_key, [])
            if isinstance(data[current_key], list):
                data[current_key].append(line[4:].strip())
            continue

        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        current_key = key
        if value.startswith("[") and value.endswith("]"):
            items = [item.strip() for item in value[1:-1].split(",") if item.strip()]
            data[key] = items
        elif value:
            data[key] = value
        else:
            data[key] = []

    body = text[end + len("\n---\n") :]
    return data, body.strip()


def load_wiki_pages(wiki_dir: Path) -> list[dict[str, object]]:
    pages: list[dict[str, object]] = []
    for path in sorted(wiki_dir.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        frontmatter, body = parse_frontmatter(text)
        title = frontmatter.get("title", path.stem.replace("-", " ").title())
        tags = frontmatter.get("tags", [])
        sources = frontmatter.get("sources", [])

        pages.append(
            {
                "slug": path.stem,
                "path": path,
                "title": title,
                "tags": list(tags) if isinstance(tags, list) else [str(tags)],
                "sources": list(sources) if isinstance(sources, list) else [str(sources)],
                "date": str(frontmatter.get("date", "")),
                "status": str(frontmatter.get("status", "draft")),
                "body": body,
            }
        )
    return pages


def load_source_cards(raw_dir: Path) -> list[dict[str, object]]:
    cards: list[dict[str, object]] = []
    for path in sorted(raw_dir.glob("*/*.md")):
        if path.name == ".gitkeep":
            continue
        text = path.read_text(encoding="utf-8")
        frontmatter, body = parse_frontmatter(text)
        cards.append(
            {
                "slug": path.stem,
                "path": path,
                "title": str(frontmatter.get("title", path.stem.replace("-", " ").title())),
                "section": path.parent.name,
                "date": str(frontmatter.get("captured", frontmatter.get("date", ""))),
                "status": str(frontmatter.get("status", "captured")),
                "body": body,
            }
        )
    return cards


def read_nav_order(index_path: Path) -> list[str]:
    text = index_path.read_text(encoding="utf-8")
    return [match.group(1).split("|", 1)[0].split("#", 1)[0].strip() for match in re.finditer(r"\[\[([^\]]+)\]\]", text)]


def rewrite_wikilinks(markdown: str, current_slug: str) -> str:
    current_is_wiki_page = current_slug != "index"

    def replace(match: re.Match[str]) -> str:
        target = match.group(1).split("|", 1)[0].split("#", 1)[0].strip()
        label = match.group(2) or target
        if target.startswith("raw/"):
            source_target = target.removeprefix("raw/")
            prefix = "../" if current_is_wiki_page else ""
            return f"[{label}]({prefix}sources/{source_target}.md)"
        return f"[{label}]({target}.md)"

    return re.sub(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]", replace, markdown)


def build_home_page(pages: list[dict[str, object]], nav_order: list[str], source_cards: list[dict[str, object]]) -> str:
    grouped_pages = concept_groups(pages, nav_order)
    source_sections: dict[str, list[dict[str, object]]] = {}
    for card in source_cards:
        source_sections.setdefault(str(card["section"]), []).append(card)

    lines = [
        "# Rara Wiki",
        "",
        "Persistent project memory built from source material and project conversations.",
        "",
        "## Reading Flows",
        "",
        "- Search the site from the top navigation bar.",
        "- Browse durable concepts, harness rules, and publishing notes from the sidebar.",
        "- Use the repository `wiki/` directory as the editable source of truth.",
        "",
        "## Key Pages",
        "",
    ]

    for section, grouped in grouped_pages.items():
        lines.append(f"- **{section}**")
        for page in grouped:
            lines.append(f"  - [{page['title']}](wiki/{page['slug']}.md)")

    lines.extend(
        [
            "",
            "## Source Streams",
            "",
            "The public docs also include source cards captured from these raw streams:",
            "",
        ]
    )

    for section in sorted(source_sections):
        lines.append(f"- **{section}**")
        for card in source_sections[section]:
            lines.append(f"  - [{card['title']}](sources/{section}/{card['slug']}.md)")

    lines.extend(
        [
            "",
            "## Build",
            "",
            "```bash",
            "uv tool run --from mkdocs-terminal python tools/build_pages.py",
            "```",
            "",
            "The build script regenerates this MkDocs site from the repository wiki pages.",
        ]
    )
    return "\n".join(lines) + "\n"


def concept_groups(pages: list[dict[str, object]], nav_order: list[str]) -> dict[str, list[dict[str, object]]]:
    by_slug = {page["slug"]: page for page in pages}
    grouped: dict[str, list[dict[str, object]]] = {
        "Architecture": [],
        "Workflow": [],
        "Publishing": [],
        "Other": [],
    }
    for slug in nav_order:
        page = by_slug.get(slug)
        if page is None or slug == "index":
            continue
        section = CONCEPT_SECTION_BY_SLUG.get(slug, "Other")
        grouped.setdefault(section, []).append(page)
    return {name: items for name, items in grouped.items() if items}


def build_docs_source(
    pages: list[dict[str, object]],
    nav_order: list[str],
    source_cards: list[dict[str, object]],
    docs_dir: Path,
) -> None:
    if docs_dir.exists():
        shutil.rmtree(docs_dir)
    (docs_dir / "wiki").mkdir(parents=True, exist_ok=True)
    (docs_dir / "sources").mkdir(parents=True, exist_ok=True)
    (docs_dir / "styles").mkdir(parents=True, exist_ok=True)
    (docs_dir / "img").mkdir(parents=True, exist_ok=True)

    (docs_dir / "index.md").write_text(build_home_page(pages, nav_order, source_cards), encoding="utf-8")
    (docs_dir / "styles" / "extra.css").write_text(EXTRA_CSS.strip() + "\n", encoding="utf-8")
    for name in [
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
    ]:
        (docs_dir / "img" / name).write_bytes(PNG_PLACEHOLDER)

    for page in pages:
        if page["slug"] in {"index"}:
            continue
        rewritten = rewrite_wikilinks(str(page["body"]), current_slug=str(page["slug"]))
        destination = docs_dir / "wiki" / f"{page['slug']}.md"
        destination.write_text(rewritten + "\n", encoding="utf-8")

    for card in source_cards:
        destination_dir = docs_dir / "sources" / str(card["section"])
        destination_dir.mkdir(parents=True, exist_ok=True)
        destination = destination_dir / f"{card['slug']}.md"
        destination.write_text(rewrite_wikilinks(str(card["body"]), current_slug="source-card") + "\n", encoding="utf-8")


def build_mkdocs_config(
    config_path: Path,
    pages: list[dict[str, object]],
    nav_order: list[str],
    source_cards: list[dict[str, object]],
) -> None:
    by_slug = {page["slug"]: page for page in pages}
    grouped_pages = concept_groups(pages, nav_order)
    source_sections: dict[str, list[dict[str, object]]] = {}
    for card in source_cards:
        source_sections.setdefault(str(card["section"]), []).append(card)

    lines = [
        "site_name: Rara Wiki",
        "site_description: Persistent project memory compiled from sources and conversations.",
        "docs_dir: mkdocs_docs",
        "site_dir: site",
        "repo_name: rararulab/rara-wiki",
        "theme:",
        "  name: terminal",
        "  palette: gruvbox_dark",
        "plugins:",
        "  - search",
        "markdown_extensions:",
        "  - tables",
        "  - admonition",
        "  - attr_list",
        "  - md_in_html",
        "  - toc:",
        "      permalink: true",
        "extra_css:",
        "  - styles/extra.css",
        "nav:",
        "  - Home: index.md",
        "  - Concepts:",
    ]

    for section, grouped in grouped_pages.items():
        lines.append(f'      - "{section}":')
        for page in grouped:
            title = str(page["title"]).replace('"', '\\"')
            lines.append(f'          - "{title}": wiki/{page["slug"]}.md')

    lines.append("  - Sources:")
    for section in sorted(source_sections):
        lines.append(f'      - "{section.title()}":')
        for card in source_sections[section]:
            title = str(card["title"]).replace('"', '\\"')
            lines.append(f'          - "{title}": sources/{section}/{card["slug"]}.md')

    if "log" in by_slug:
        lines.append('  - "Wiki Log": wiki/log.md')

    config_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_site(repo_root: Path, docs_dir: Path = DOCS_DIR, site_dir: Path = SITE_DIR, config_path: Path = CONFIG_PATH) -> None:
    pages = load_wiki_pages(repo_root / "wiki")
    source_cards = load_source_cards(repo_root / "raw")
    nav_order = read_nav_order(repo_root / "wiki" / "index.md")
    build_docs_source(pages, nav_order, source_cards, docs_dir)
    build_mkdocs_config(config_path, pages, nav_order, source_cards)

    if find_spec("mkdocs") is None:
        raise SystemExit(
            "MkDocs is not installed in this Python environment. "
            "Run via `uv tool run --from mkdocs-terminal python tools/build_pages.py` "
            "or install `mkdocs-terminal` first."
        )

    subprocess.run(
        [
            sys.executable,
            "-m",
            "mkdocs",
            "build",
            "-f",
            str(config_path),
            "--site-dir",
            str(site_dir),
        ],
        check=True,
        cwd=repo_root,
    )


def main() -> None:
    build_site(ROOT)
    print(f"Built MkDocs site at {SITE_DIR}")


if __name__ == "__main__":
    main()

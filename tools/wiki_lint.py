#!/usr/bin/env python3
"""Validate the local LLM wiki structure.

This intentionally uses only the Python standard library so every agent can run it.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WIKI = ROOT / "wiki"
RAW = ROOT / "raw"
INDEX = WIKI / "index.md"
SPECIAL_PAGES = {"index.md", "log.md"}
REQUIRED_KEYS = {"title", "tags", "date", "sources", "status"}
VALID_STATUS = {"draft", "stable", "needs-review"}


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def parse_frontmatter(text: str) -> tuple[dict[str, object], list[str]]:
    if not text.startswith("---\n"):
        return {}, ["missing YAML frontmatter"]

    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, ["unterminated YAML frontmatter"]

    block = text[4:end].splitlines()
    data: dict[str, object] = {}
    current_key: str | None = None
    errors: list[str] = []

    for raw_line in block:
        line = raw_line.rstrip()
        if not line:
            continue
        if line.startswith("  - "):
            if current_key is None:
                errors.append(f"list item without key: {line}")
                continue
            data.setdefault(current_key, [])
            if not isinstance(data[current_key], list):
                errors.append(f"key {current_key} mixes scalar and list values")
                continue
            data[current_key].append(line[4:].strip())
            continue
        if ":" not in line:
            errors.append(f"malformed frontmatter line: {line}")
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        current_key = key
        if value:
            data[key] = value
        else:
            data[key] = []

    return data, errors


def wikilinks(text: str) -> set[str]:
    return {match.group(1).split("|", 1)[0].split("#", 1)[0].strip() for match in re.finditer(r"\[\[([^\]]+)\]\]", text)}


def index_entries(index_text: str) -> set[str]:
    return wikilinks(index_text)


def source_exists(source: str) -> bool:
    if source.startswith("http://") or source.startswith("https://"):
        return False
    path = ROOT / source
    return path.exists() and path.is_file()


def validate_page(path: Path, index_links: set[str], inbound: dict[str, int]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    text = path.read_text(encoding="utf-8")
    frontmatter, fm_errors = parse_frontmatter(text)
    errors.extend(fm_errors)

    missing = REQUIRED_KEYS - set(frontmatter)
    if missing:
        errors.append(f"missing frontmatter keys: {', '.join(sorted(missing))}")

    status = frontmatter.get("status")
    if isinstance(status, str) and status not in VALID_STATUS:
        errors.append(f"invalid status: {status}")
    if status == "needs-review":
        warnings.append("status is needs-review")

    sources = frontmatter.get("sources")
    if not isinstance(sources, list) or not sources:
        errors.append("sources must be a non-empty list")
    elif not any(source_exists(source) for source in sources):
        errors.append("at least one source must resolve to a local raw/ file")
    for source in sources if isinstance(sources, list) else []:
        if source.startswith("http://") or source.startswith("https://"):
            warnings.append(f"external source without local raw capture: {source}")
        elif not source_exists(source):
            errors.append(f"source does not exist: {source}")

    slug = path.stem
    if slug not in index_links:
        errors.append("page missing from wiki/index.md")
    if inbound.get(slug, 0) <= 1:
        warnings.append("no inbound wikilinks except possibly index")

    return errors, warnings


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    if not INDEX.exists():
        errors.append("wiki/index.md is missing")
        print("\n".join(f"ERROR: {item}" for item in errors))
        return 1

    wiki_pages = sorted(path for path in WIKI.glob("*.md"))
    content_pages = [path for path in wiki_pages if path.name not in SPECIAL_PAGES]
    existing_slugs = {path.stem for path in content_pages}
    index_text = INDEX.read_text(encoding="utf-8")
    links_in_index = index_entries(index_text)

    for link in sorted(links_in_index):
        if link.startswith("raw/"):
            if not (ROOT / f"{link}.md").exists() and not (ROOT / link).exists():
                errors.append(f"index links to missing raw target: [[{link}]]")
        elif link not in existing_slugs:
            errors.append(f"index links to missing wiki page: [[{link}]]")

    inbound: dict[str, int] = {slug: 0 for slug in existing_slugs}
    for path in wiki_pages:
        text = path.read_text(encoding="utf-8")
        for link in wikilinks(text):
            if link in inbound:
                inbound[link] += 1
            elif not link.startswith("raw/"):
                errors.append(f"{rel(path)} links to missing wiki page: [[{link}]]")

    for path in content_pages:
        page_errors, page_warnings = validate_page(path, links_in_index, inbound)
        errors.extend(f"{rel(path)}: {error}" for error in page_errors)
        warnings.extend(f"{rel(path)}: {warning}" for warning in page_warnings)

    for item in warnings:
        print(f"WARN: {item}")
    for item in errors:
        print(f"ERROR: {item}")

    if errors:
        print(f"\nwiki lint failed: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"wiki lint passed: {len(content_pages)} page(s), {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())


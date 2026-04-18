import tempfile
import unittest
from pathlib import Path

from tools.build_pages import (
    build_docs_source,
    build_mkdocs_config,
    concept_groups,
    load_source_cards,
    load_wiki_pages,
    read_nav_order,
    rewrite_wikilinks,
)


class BuildPagesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo_root = Path(__file__).resolve().parents[1]

    def test_load_wiki_pages_reads_frontmatter(self) -> None:
        pages = load_wiki_pages(self.repo_root / "wiki")
        by_slug = {page["slug"]: page for page in pages}

        self.assertIn("conversation-learning", by_slug)
        self.assertEqual(by_slug["conversation-learning"]["title"], "Conversation Learning")
        self.assertIn(
            "raw/conversations/2026-04-18-chat-learning-expectation.md",
            by_slug["conversation-learning"]["sources"],
        )

    def test_rewrite_wikilinks_points_to_mkdocs_pages(self) -> None:
        rewritten = rewrite_wikilinks(
            "See [[agent-harness]] and [[llm-wiki]].",
            current_slug="conversation-learning",
        )

        self.assertIn("(agent-harness.md)", rewritten)
        self.assertIn("(llm-wiki.md)", rewritten)
        self.assertNotIn("[[agent-harness]]", rewritten)

    def test_rewrite_wikilinks_maps_raw_links_to_sources_tree(self) -> None:
        rewritten = rewrite_wikilinks(
            "Source: [[raw/conversations/2026-04-18-chat-learning-expectation]].",
            current_slug="conversation-learning",
        )

        self.assertIn("(../sources/conversations/2026-04-18-chat-learning-expectation.md)", rewritten)

    def test_read_nav_order_uses_wiki_index(self) -> None:
        order = read_nav_order(self.repo_root / "wiki" / "index.md")
        self.assertIn("agent-harness", order)
        self.assertIn("conversation-learning", order)

    def test_load_source_cards_reads_raw_conversation_sources(self) -> None:
        cards = load_source_cards(self.repo_root / "raw")
        by_slug = {card["slug"]: card for card in cards}

        self.assertIn("2026-04-18-chat-learning-expectation", by_slug)
        self.assertEqual(by_slug["2026-04-18-chat-learning-expectation"]["section"], "conversations")

    def test_concept_groups_splits_navigation_into_named_sections(self) -> None:
        pages = load_wiki_pages(self.repo_root / "wiki")
        nav_order = read_nav_order(self.repo_root / "wiki" / "index.md")

        grouped = concept_groups(pages, nav_order)

        self.assertIn("Architecture", grouped)
        self.assertIn("Workflow", grouped)
        self.assertIn("Publishing", grouped)
        self.assertEqual(grouped["Publishing"][0]["slug"], "github-pages-site")

    def test_build_docs_source_writes_frontmatter_free_markdown(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            docs_dir = Path(tempdir) / "mkdocs_docs"
            pages = load_wiki_pages(self.repo_root / "wiki")
            nav_order = read_nav_order(self.repo_root / "wiki" / "index.md")
            source_cards = load_source_cards(self.repo_root / "raw")

            build_docs_source(pages, nav_order, source_cards, docs_dir)

            home = docs_dir / "index.md"
            page = docs_dir / "wiki" / "conversation-learning.md"
            source_card = docs_dir / "sources" / "conversations" / "2026-04-18-chat-learning-expectation.md"

            self.assertTrue(home.exists())
            self.assertTrue(page.exists())
            self.assertTrue(source_card.exists())
            self.assertTrue((docs_dir / "img" / "favicon.ico").exists())
            self.assertNotIn("---", page.read_text(encoding="utf-8").splitlines()[0])
            self.assertIn("(agent-harness.md)", page.read_text(encoding="utf-8"))
            self.assertIn("sources/conversations/2026-04-18-chat-learning-expectation.md", home.read_text(encoding="utf-8"))

    def test_build_mkdocs_config_enables_terminal_theme_search_and_grouped_nav(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            config_path = Path(tempdir) / "mkdocs.yml"
            pages = load_wiki_pages(self.repo_root / "wiki")
            nav_order = read_nav_order(self.repo_root / "wiki" / "index.md")
            source_cards = load_source_cards(self.repo_root / "raw")

            build_mkdocs_config(config_path, pages, nav_order, source_cards)

            config = config_path.read_text(encoding="utf-8")
            self.assertIn("name: terminal", config)
            self.assertIn("palette: gruvbox_dark", config)
            self.assertIn("- search", config)
            self.assertIn('  - Concepts:', config)
            self.assertIn('      - "Architecture":', config)
            self.assertIn('      - "Workflow":', config)
            self.assertIn('      - "Publishing":', config)
            self.assertIn('  - Sources:', config)
            self.assertIn("sources/conversations/2026-04-18-chat-learning-expectation.md", config)
            self.assertIn("wiki/conversation-learning.md", config)


if __name__ == "__main__":
    unittest.main()

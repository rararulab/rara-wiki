# GitHub Pages Search Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a GitHub Pages site for this wiki with client-side search over generated wiki content.

**Architecture:** A Python standard-library build script will read `wiki/*.md`, parse frontmatter, generate a static `site/` bundle, and emit a `search-index.json` file. A small vanilla HTML/CSS/JS app will load that index, support instant search, render page content, and work on GitHub Pages without any runtime dependencies.

**Tech Stack:** Python 3 standard library, vanilla HTML/CSS/JavaScript, GitHub Actions Pages deployment

---

### Task 1: Add failing tests for the site generator

**Files:**
- Create: `tests/test_build_pages.py`
- Create: `tools/__init__.py`
- Test: `python3 -m unittest tests.test_build_pages -v`

**Step 1: Write the failing test**

Add tests that expect:
- wiki markdown pages can be loaded with frontmatter metadata
- search documents are generated from markdown content
- a site build writes `index.html` and `search-index.json`

**Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_build_pages -v`
Expected: FAIL because `tools.build_pages` does not exist yet

### Task 2: Implement the static site generator

**Files:**
- Create: `tools/build_pages.py`
- Modify: `tools/__init__.py`
- Test: `python3 -m unittest tests.test_build_pages -v`

**Step 1: Write minimal implementation**

Implement:
- frontmatter parsing
- markdown-to-html rendering for the subset used in this repo
- search document creation
- static bundle generation into `site/`

**Step 2: Run tests to verify they pass**

Run: `python3 -m unittest tests.test_build_pages -v`
Expected: PASS

### Task 3: Add the GitHub Pages frontend shell

**Files:**
- Modify: `tools/build_pages.py`
- Create: `site/.nojekyll`
- Verify: `python3 tools/build_pages.py`

**Step 1: Generate the frontend shell**

Emit:
- `site/index.html`
- `site/assets/app.css`
- `site/assets/app.js`
- `site/search-index.json`

**Step 2: Run generator**

Run: `python3 tools/build_pages.py`
Expected: site files created with no exceptions

### Task 4: Wire deployment and document usage

**Files:**
- Create: `.github/workflows/pages.yml`
- Modify: `README.md`
- Modify: `wiki/index.md`
- Modify: `wiki/log.md`

**Step 1: Add Pages workflow**

Deploy `site/` via GitHub Actions Pages on pushes to the main branch.

**Step 2: Document**

Explain:
- how to rebuild locally
- how Pages deployment works
- where search data comes from

### Task 5: Verify end-to-end

**Files:**
- Verify only

**Step 1: Run tests**

Run: `python3 -m unittest tests.test_build_pages -v`
Expected: PASS

**Step 2: Run generator**

Run: `python3 tools/build_pages.py`
Expected: site bundle regenerated

**Step 3: Run wiki lint**

Run: `./tools/wiki_lint.py`
Expected: PASS or known warnings only


PYTHON ?= python3
MKDOCS_RUN = uv tool run --from mkdocs-terminal

.PHONY: test-site build-site lint-wiki verify

test-site:
	$(PYTHON) -m unittest tests.test_build_pages -v

build-site:
	$(MKDOCS_RUN) python tools/build_pages.py

lint-wiki:
	./tools/wiki_lint.py

verify: test-site build-site lint-wiki


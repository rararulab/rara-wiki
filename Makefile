PYTHON ?= python3
UV := $(shell command -v uv 2>/dev/null)

ifeq ($(UV),)
MKDOCS_RUN =
else
MKDOCS_RUN = uv tool run --from mkdocs-terminal
endif

.PHONY: test-site build-site lint-wiki verify

test-site:
	$(PYTHON) -m unittest tests.test_build_pages -v

build-site:
	$(MKDOCS_RUN) $(PYTHON) tools/build_pages.py

lint-wiki:
	./tools/wiki_lint.py

verify: test-site build-site lint-wiki

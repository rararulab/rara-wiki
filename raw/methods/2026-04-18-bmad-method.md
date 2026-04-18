---
title: BMAD Method
source_url: https://github.com/bmad-code-org/BMAD-METHOD
docs_url: https://docs.bmad-method.org/
captured: 2026-04-18
type: source-card
status: captured
---

# BMAD Method

Source card for `bmad-code-org/BMAD-METHOD`, checked on 2026-04-18.

## Relevant Facts

- BMAD describes itself as an AI-driven agile development method and module ecosystem.
- The current public README describes scale-adaptive workflows, structured agent roles,
  and lifecycle coverage from brainstorming through deployment.
- The documented core phases are Analysis, Planning, Solutioning, and Implementation.
- The default agile suite includes specialized agents such as Analyst, Product Manager,
  Architect, Developer, UX Designer, Technical Writer, and review/testing roles.
- The docs describe a Quick Flow for smaller, well-understood work and fuller PRD,
  architecture, epic/story, implementation, and review flows for larger work.
- Installation is available through `npx bmad-method install`, with non-interactive
  install options for selected modules and tools.
- Project context files and root tool instructions such as `AGENTS.md` are recommended
  places to keep project-specific conventions.

## Use In This Repo

This repo uses BMAD as a role-and-artifact harness, not as vendored generated framework
files. The local adaptation is documented in `schema/AGENT_HARNESS.md` and surfaced to
agents through root `AGENTS.md`.


---
title: Conversation Learning Expectation
captured: 2026-04-18
type: conversation-source
status: captured
participants:
  - user
  - agent
---

# Conversation Learning Expectation

## Context

This conversation followed the initial Karpathy-compliance and BMAD-inspired harness work.
The user clarified the operational expectation for this repo.

## Durable Decisions

- Future chats in this project should not remain only in transient conversation context.
- When a chat yields stable knowledge, preferences, decisions, definitions, or reusable
  conclusions, the agent should automatically summarize and persist them in the repository.
- The persistence path is: create or update a dated raw conversation source under
  `raw/conversations/`, then update the relevant `wiki/` pages, then update `wiki/index.md`
  and `wiki/log.md`.
- This behavior should be part of the default harness, not an optional extra step that
  requires the user to request manual write-back each time.

## Immediate Implication

The harness should gain a dedicated conversation workflow and the repo should include at
least one wiki page that explains how conversation-derived knowledge is stored and reused.


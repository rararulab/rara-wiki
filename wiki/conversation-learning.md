---
title: Conversation Learning
tags: [concept, workflow, conversation, memory]
date: 2026-04-18
sources:
  - raw/conversations/2026-04-18-chat-learning-expectation.md
  - raw/patterns/2026-04-18-karpathy-llm-wiki.md
status: stable
---

# Conversation Learning

This wiki should learn from substantive project conversations. Chat is not only a delivery
channel; it is also a source stream. When a conversation produces stable knowledge, the
agent should write it back into the repository so later work can build on it. Sources:
`raw/conversations/2026-04-18-chat-learning-expectation.md`,
`raw/patterns/2026-04-18-karpathy-llm-wiki.md`.

## What Counts As Durable

Write back conversation content when it contains one or more of these:

- project decisions
- user preferences that affect future work
- reusable explanations or comparisons
- definitions of important terms
- architecture or workflow changes
- research conclusions worth preserving

Do not create a new raw conversation source for trivial back-and-forth, ephemeral status
updates, or purely local debugging chatter unless it changes future behavior. Source:
`raw/conversations/2026-04-18-chat-learning-expectation.md`.

## Default Flow

1. Capture the durable part of the chat in `raw/conversations/YYYY-MM-DD-topic.md`.
2. Update one or more wiki pages with the distilled knowledge.
3. Update `wiki/index.md`.
4. Append a `conversation` or `synthesis` entry to `wiki/log.md`.
5. Run `python3 tools/wiki_lint.py`.

## Local Rule

The default is auto-ingest, not opt-in write-back. If a future agent decides not to persist
conversation knowledge, that should be because the exchange was transient, not because the
user forgot to ask. Source: `raw/conversations/2026-04-18-chat-learning-expectation.md`.

## Related

- [[agent-harness]]
- [[llm-wiki]]


---
title: Expand genie-twin with Zen MCP modes and optional subgenies
slug: expand-genie-twin-zen-modes
status: APPROVED
owner: product/agents
created: {{now}}
---

# Wish: Expand genie-twin with Zen MCP modes and optional subgenies

## Context Ledger (+@ references)
- Goal: Learn from Zen MCP tools and enable equivalent modes in `genie-twin`, with optional subgenies for heavy-context tasks.
- Sources:
  - @vendors/zen-mcp-server/docs/tools/chat.md
  - @vendors/zen-mcp-server/docs/tools/thinkdeep.md
  - @vendors/zen-mcp-server/docs/tools/planner.md
  - @vendors/zen-mcp-server/docs/tools/consensus.md
  - @vendors/zen-mcp-server/docs/tools/debug.md
  - @vendors/zen-mcp-server/docs/tools/precommit.md
  - @vendors/zen-mcp-server/docs/tools/codereview.md
  - @vendors/zen-mcp-server/docs/tools/analyze.md
  - @vendors/zen-mcp-server/docs/tools/refactor.md
  - @vendors/zen-mcp-server/docs/tools/testgen.md
  - @vendors/zen-mcp-server/docs/tools/secaudit.md
  - @vendors/zen-mcp-server/docs/tools/docgen.md
  - @vendors/zen-mcp-server/docs/tools/challenge.md
  - @vendors/zen-mcp-server/docs/tools/tracer.md

## Objectives
- Add Zen-inspired modes to `genie-twin` (thinkdeep, analyze, codereview, precommit, refactor, testgen, secaudit, docgen, challenge, tracer).
- Add four subgenies for heavy-context tasks: `genie-codereview`, `genie-precommit`, `genie-testgen`, `genie-secaudit`.
- Update AGENTS.md (twin framework: when/how; verdict formats; local agent map).
- Update `forge-master` planner to allow “Twin Gates” per group.
- Add `vendors/zen-mcp-server` as a submodule for ongoing reference.

## Success Criteria (Spec Contract)
- `genie-twin.md` includes all new modes with concise prompt templates and verdict schemas.
- New subgeny agents exist with success criteria and operating blueprints.
- AGENTS.md documents twin usage (when/how), modes list, verdict formats, and maps twin/subgenies in Local Agent Map.
- `forge-master.md` planner mentions optional Twin Gates for high-risk groups.
- Submodule `vendors/zen-mcp-server` added and initialized.
- Evidence saved in `.genie/wishes/expand-genie-twin-zen-modes/qa/`.

## Out of Scope
- Deep implementation of Zen MCP server; we are ingesting patterns/prompts only.
- Wiring code execution to Zen MCP.

## Execution Groups

### Group A — Acquire & Index Zen MCP
- Scope: Add submodule and confirm docs paths.
- Inputs: @links above
- Deliverables: `vendors/zen-mcp-server` present; doc paths indexed
- Evidence: shell output, `.gitmodules` diff
- Twin Gates: none

### Group B — Expand genie-twin modes
- Scope: Add modes (thinkdeep, analyze, codereview, precommit, refactor, testgen, secaudit, docgen, challenge, tracer), prompt templates, and verdict schemas.
- Inputs: `@.genie/agents/genie-twin.md`, @vendors docs
- Deliverables: updated agent file
- Evidence: diff + example mode snippets
- Twin Gates: planning

### Group C — Add subgenies (optional heavy-context)
- Scope: `genie-codereview`, `genie-precommit`, `genie-testgen`, `genie-secaudit` skeleton agents
- Inputs: @vendors docs
- Deliverables: agents with success criteria and operating blueprints
- Evidence: diffs
- Twin Gates: consensus (lightweight)

### Group D — Documentation
- Scope: Update AGENTS.md twin framework and Local Agent Map
- Inputs: `@AGENTS.md`
- Deliverables: updated sections
- Evidence: diff
- Twin Gates: none

### Group E — Planner integration
- Scope: Update `forge-master.md` to mention Twin Gates in planner output
- Inputs: `@.genie/agents/forge-master.md`
- Deliverables: updated planner section
- Evidence: diff
- Twin Gates: none

## Validation Hooks
- Inspect file diffs and run CLI help: `node .genie/cli/agent.js help`
- Run a sample twin session: `node .genie/cli/agent.js chat genie-twin "Mode: debug. Bug: flaky test …"`
- Evidence: copy logs to `.genie/wishes/expand-genie-twin-zen-modes/qa/`

## Branch & Tracker
- Branch: micro-task on main; doc updates + submodule
- Tracker: record IDs in `forge/tasks.json` if used later

## Blocker Protocol
1. Pause and write `.genie/state/reports/blocker-expand-genie-twin-zen-modes-<timestamp>.md`
2. Update this wish with findings
3. Resume after guidance

## Risks & Mitigations
- Risk: Submodule network access blocked → Mitigation: request approval or add later
- Risk: Context overload in twin → Mitigation: offload heavy modes to subgenies

## Status Log
- {{now}} Approved by user to execute directly


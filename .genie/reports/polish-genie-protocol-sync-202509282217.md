# Death Testament: polish – Genie Protocol Sync (Vendor Alignment)

When: 2025-09-28 22:17 UTC
Scope: Align Genie prompts with Agent OS vendor patterns (context fetch, date handling, test runner behavior) without adding new agent sprawl.

## Files Touched
- @.genie/agents/modes/analyze.md
- @.genie/agents/prompt.md
- @.genie/agents/specialists/tests.md

## Commands
None (prompt-only changes via apply_patch).

## Changes
- Analyze mode: added "Context Sweep (Fetch Protocol)" aligning with vendor context-fetcher (context check first, selective reading, smart retrieval).
- Prompt guide: added "Date Handling Standard" (UTC, ISO-8601, avoid FS timestamps, clear Today line when required).
- Tests specialist: added "Runner Mode (analysis-only)" mirroring vendor test-runner output and constraints.

## Evidence & Rationale
- Vendor refs loaded:
  - @vendors/agent-os/claude-code/agents/context-fetcher.md
  - @vendors/agent-os/claude-code/agents/date-checker.md
  - @vendors/agent-os/claude-code/agents/test-runner.md
  - @vendors/agent-os/claude-code/agents/git-workflow.md
  - @vendors/agent-os/claude-code/agents/project-manager.md
- Genie already includes git-workflow/project-manager specialists and mirrored core instructions; changes focus on protocol completeness rather than duplication.

## Risks
- None functional; prompt drift risk mitigated by concise, scoped additions.

## Follow-ups
- Optionally add a CLI alias for git workflow (`/git`) in `.claude/commands/` that simply includes `@.genie/agents/specialists/git-workflow.md`.
- Validate updated prompts in a live planning + tests run.

## Verdict
Protocol completeness improved with minimal surface area changes; no new agents introduced.


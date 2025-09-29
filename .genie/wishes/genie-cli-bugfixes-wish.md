# 🧞 GENIE CLI BUGFIXES WISH
**Status:** COMPLETE ✅
**Roadmap Item:** Phase 1 – @.genie/product/roadmap.md §Instrumentation & Telemetry
**Mission Link:** @.genie/product/mission.md §Tooling Diagnostics
**Standards:** @.genie/standards/best-practices.md §Core Principles

## Context Ledger
| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| @.genie/reports/genie-cli-bugs-202509291948.md | bug-report | 5 CLI bugs discovered during QA after identity hotfix | entire wish |
| @.genie/cli/src/genie.ts | source | CLI entrypoint with session ID polling and view logic | Group A, Group B |
| @.genie/cli/dist/genie.js | compiled | Compiled JS that needs rebuilding after fixes | verification |
| Manual QA session | testing | Comprehensive CLI testing with 3 test sessions | evidence baseline |

## Discovery Summary
- **Primary analyst:** Human (namastex) + Claude QA
- **Key observations:**
  - Bug #1: `resolveSessionIdForBanner` timeout prevents showing session ID after background run starts
  - Bug #2: `sliceTranscriptForRecent` returns empty array when events exist, but `--full` works correctly
  - Bugs #3-5: Documentation/UX polish issues (no --preset flag, truncated IDs, wrong error message)
- **Assumptions (ASM-1):** All bugs stem from genie.ts logic; no executor/codex changes needed
- **Assumptions (ASM-2):** Fixes can be validated with manual CLI testing; no unit tests required yet
- **Decision (DEC-1):** Bug #3 = documentation fix ONLY. No `--mode` CLI flag. Execution modes configured per-agent in YAML frontmatter (like @.genie/agents/utilities/prompt.md)
- **Risks:**
  - Session ID polling fix may introduce new race conditions if not tested thoroughly
  - Transcript slicing logic is complex; need to verify all edge cases (empty sessions, single message, reasoning-only)

## Executive Summary
Fix 5 CLI bugs discovered during comprehensive testing after the identity hotfix. Critical bugs (#1, #2) prevent users from seeing session IDs and viewing transcripts without `--full` flag. Minor bugs (#3-5) cause UX friction. All fixes target `.genie/cli/src/genie.ts` with immediate validation via manual command testing.

## Current State
- **What exists today:**
  - @.genie/cli/src/genie.ts:1323-1397 – `resolveSessionIdForBanner` with polling logic
  - @.genie/cli/src/genie.ts:1724-1743 – `sliceTranscriptForRecent` filtering transcript
  - @.genie/cli/src/genie.ts:1615-1705 – `buildTranscriptFromEvents` parsing JSONL events
  - @.genie/cli/src/genie.ts:256-292 – CLI argument parser (missing `--mode` flag)
  - @.genie/cli/src/genie.ts:1598 – Error message with wrong command syntax
- **Gaps/Pain points:**
  - Bug #1: Users cannot see session ID after `./genie run`, must run `./genie list sessions` separately
  - Bug #2: `./genie view <sessionId>` shows "No transcript yet" for completed sessions
  - Bug #3: Cannot override execution mode via CLI flag
  - Bug #4: Session IDs truncated in list view, hard to copy
  - Bug #5: Error message suggests `genie agent list` instead of `genie list agents`

## Target State & Guardrails
- **Desired behaviour:**
  - Bug #1: `./genie run` waits and displays session ID + management commands within 5 seconds
  - Bug #2: `./genie view <sessionId>` shows last 20 messages or last 2 assistant messages (whichever is more)
  - Bug #3: Documentation updated to remove `--preset`/`--mode` CLI flag references; clarify execution modes are agent-level only (via YAML frontmatter)
  - Bug #4: Full session UUIDs displayed in `./genie list sessions`
  - Bug #5: Error message corrected to `genie list agents`
- **Non-negotiables:**
  - No regressions: `resume`, `stop`, `list agents` must continue working
  - Backward compatibility: Existing sessions.json format unchanged
  - Performance: Session ID polling should not hang indefinitely (max 10s timeout)
  - Evidence: Before/after command outputs captured for every fix

## Execution Groups

### Group A – critical-cli-bugs
- **Goal:** Fix Bug #1 (session ID display) and Bug #2 (view transcript)
- **Surfaces:**
  - `@.genie/cli/src/genie.ts` lines 1323-1397 (resolveSessionIdForBanner)
  - `@.genie/cli/src/genie.ts` lines 1724-1743 (sliceTranscriptForRecent)
  - `@.genie/cli/src/genie.ts` lines 1615-1705 (buildTranscriptFromEvents)
- **Deliverables:**
  - Bug #1 fix: Update polling logic or timeout handling in `resolveSessionIdForBanner`
  - Bug #2 fix: Debug and correct `sliceTranscriptForRecent` or event parsing in `buildTranscriptFromEvents`
  - Rebuild CLI: `pnpm run build:genie` after changes
- **Evidence:**
  - Before: `./genie run plan "test"` → hangs, no session ID shown
  - After: `./genie run plan "test"` → shows session ID within 5s + management commands
  - Before: `./genie view <sessionId>` → "No transcript yet"
  - After: `./genie view <sessionId>` → shows recent messages correctly
  - Log files: Save outputs to `.genie/reports/evidence-bug1-before.txt`, `evidence-bug1-after.txt`, etc.
- **Suggested personas:** `implementor` (code changes), `debug` (root cause analysis)
- **External tracker:** N/A (internal bugfix)

### Group B – minor-cli-polish
- **Goal:** Fix Bug #3 (--preset docs), Bug #4 (ID truncation), Bug #5 (error message)
- **Surfaces:**
  - `@.genie/cli/src/genie.ts` line 1598 (error message)
  - `@.genie/cli/README.md` or docs mentioning `--preset` flag
  - View rendering logic for session ID display (investigate which file handles list formatting)
- **Deliverables:**
  - Bug #3: Update docs to remove `--preset` references OR implement `--mode` CLI flag (decision needed)
  - Bug #4: Fix session ID truncation in list view output
  - Bug #5: Change error message from `genie agent list` to `genie list agents`
  - Rebuild CLI: `pnpm run build:genie` after changes
- **Evidence:**
  - Bug #3: Documentation updated to remove CLI flag references
  - Bug #4: `./genie list sessions` shows full UUIDs without truncation
  - Bug #5: `./genie run invalid-agent "test"` → error says `genie list agents`
- **Suggested personas:** `polish` (UX fixes), `implementor` (code changes)
- **External tracker:** N/A (internal polish)

## Verification Plan
- **Validation steps (exact commands to run after fixes):**
  1. **Bug #1 test:**
     ```bash
     ./genie run plan "test session ID display"
     # Expected: Session ID shown within 5 seconds with management commands
     ```
  2. **Bug #2 test:**
     ```bash
     # Create completed session first
     ./genie run utilities/thinkdeep "quick test"
     # Wait for completion, get session ID from output
     ./genie view <sessionId>
     # Expected: Shows recent messages, not "No transcript yet"
     ./genie view <sessionId> --full
     # Expected: Shows full transcript (regression check)
     ```
  3. **Bug #3 test:**
     - Review docs: Confirm no `--preset` flag mentioned OR test new `--mode` flag if implemented
  4. **Bug #4 test:**
     ```bash
     ./genie list sessions
     # Expected: Full session UUIDs displayed without truncation
     ```
  5. **Bug #5 test:**
     ```bash
     ./genie run nonexistent-agent "test"
     # Expected: Error says "Try 'genie list agents'" (not 'genie agent list')
     ```
  6. **Regression tests:**
     ```bash
     ./genie resume <sessionId> "follow-up"  # Should work
     ./genie stop <sessionId>                # Should work
     ./genie list agents                     # Should work
     ```
- **Evidence storage:** `.genie/reports/evidence-cli-bugfixes/`
  - `bug1-before.txt`, `bug1-after.txt`
  - `bug2-before.txt`, `bug2-after.txt`
  - `bug3-verification.txt` (doc update or flag test)
  - `bug4-before.txt`, `bug4-after.txt`
  - `bug5-before.txt`, `bug5-after.txt`
  - `regression-tests.txt` (all regression checks passed)
- **Branch strategy note:** Single feature branch `fix/genie-cli-bugs` (all bugs related to CLI behavior)

### Evidence Checklist
- **Validation commands (exact):**
  - `./genie run plan "test"` (Bug #1 verification)
  - `./genie view <sessionId>` and `./genie view <sessionId> --full` (Bug #2 verification)
  - `./genie list sessions` (Bug #4 verification)
  - `./genie run invalid-agent "test"` (Bug #5 verification)
  - `./genie resume <sessionId> "test"` (regression)
  - `./genie stop <sessionId>` (regression)
  - `./genie list agents` (regression)
- **Artefact paths (where evidence lives):**
  - `.genie/reports/evidence-cli-bugfixes/bug{1-5}-{before|after}.txt`
  - `.genie/reports/evidence-cli-bugfixes/regression-tests.txt`
- **Approval checkpoints (human sign-off required before work starts):**
  - ✅ Wish approved (scope, execution groups, validation plan)
  - ✅ Bug #3 decision: Documentation fix only (remove CLI flag references)

## <spec_contract>
- **Scope:**
  - Fix Bug #1: Session ID display timeout in background runs
  - Fix Bug #2: View command transcript filtering
  - Fix Bug #3: Remove `--preset`/`--mode` CLI flag references from documentation; clarify agent-level configuration
  - Fix Bug #4: Session ID truncation in list view
  - Fix Bug #5: Error message command syntax
  - Rebuild CLI after all changes
  - Capture before/after evidence for all fixes
- **Out of scope:**
  - Unit tests (can be added later if needed)
  - Refactoring unrelated CLI code
  - Adding new CLI features beyond bug fixes
  - Changes to executor or codex integration
- **Success metrics:**
  - All 5 bugs resolved and validated with exact commands
  - No regressions in existing CLI functionality
  - Evidence captured for each fix (before/after outputs)
  - CLI rebuild successful (`pnpm run build:genie` passes)
- **External tasks:** None
- **Dependencies:**
  - Node.js/pnpm environment for rebuilding CLI
  - Access to test sessions for validation
  - Decision on Bug #3 approach (docs vs implementation)
</spec_contract>

## Blocker Protocol
1. Pause work and create `.genie/reports/blocker-cli-bugfixes-<timestamp>.md` describing findings.
2. Notify owner and wait for updated instructions.
3. Resume only after wish status/log is updated.

## Status Log
- [2025-09-29 19:55Z] Wish created from bug report @.genie/reports/genie-cli-bugs-202509291948.md
- [2025-09-29 20:05Z] Decision captured: Bug #3 = documentation fix only (no CLI flag implementation)
- [2025-09-29 20:05Z] Ready to proceed with implementation
- [2025-09-29 20:50Z] Initial fixes applied - 3 bugs fully fixed, 2 partially fixed (see done report)
- [2025-09-29 20:55Z] User feedback: "debug what actually is, before deploying the fixing again"
- [2025-09-29 21:00Z] Deep debug phase completed - root causes identified for Bug #1 and Bug #4
- [2025-09-29 21:05Z] Proper fixes implemented based on root cause analysis
- [2025-09-29 21:08Z] All 5 bugs fully fixed and validated - WISH COMPLETE ✅
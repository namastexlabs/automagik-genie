# 🧞 FIX RESUME VIEW TRANSCRIPT BUG WISH
**Status:** DRAFT
**Roadmap Item:** Phase 1 - Instrumentation & Telemetry – @.genie/product/roadmap.md §Phase 1
**Mission Link:** @.genie/product/mission.md §Self-Evolving Agents Need Structure
**Standards:** @.genie/product/tech-stack.md §Core CLI

## Context Ledger
| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| Planning brief | doc | Resume works but view shows no transcript | entire wish |
| ~/.codex/sessions/*.jsonl | investigation | Full conversation stored in JSONL by codex | implementation |
| @.genie/cli/src/executors/codex-log-viewer.ts | code | Current viewer reads stdout logs only | implementation |
| @.genie/cli/src/executors/codex.ts | code | Session extraction and command building | implementation |
| User QA session | evidence | Confirmed resume remembers context correctly | validation |

## Discovery Summary
- **Primary analyst:** Human + GENIE
- **Key observations:**
  - Codex correctly maintains conversation context across resume operations
  - Session files at `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` contain complete message history
  - CLI log viewer only reads from stdout logs (`.genie/state/agents/logs/*.log`) which lack conversation data
  - Resume outputs plain text, not JSON, so conversation isn't captured in stdout logs
- **Assumptions (ASM-#):**
  - ASM-1: Codex session files are the authoritative source for conversation history
  - ASM-2: Session file location can be derived from session ID and start time
  - ASM-3: Reading session files won't break existing log viewing for system events
- **Open questions:** None
- **Risks:**
  - RISK-1: Timestamp misalignment between CLI and codex session files (mitigate: ±60s fuzzy matching)
  - RISK-2: JSONL format variations (mitigate: test with diverse conversation patterns)

## Executive Summary
Enable `./genie view <sessionId>` to display full conversation transcripts after resume operations by reading from codex's authoritative session files instead of CLI stdout logs.

## Current State
- **What exists today:**
  - @.genie/cli/src/executors/codex-log-viewer.ts reads only from CLI stdout logs
  - Resume conversations work correctly (context preserved)
  - View command shows "No transcript yet" after resume operations
- **Gaps/Pain points:**
  - Users cannot review conversation history after resuming sessions
  - Debugging multi-turn conversations is difficult
  - Evidence collection for QA is incomplete

## Target State & Guardrails
- **Desired behaviour:**
  - `./genie view <sessionId>` displays full conversation including all resume turns
  - Backward compatibility maintained for non-conversation system events
  - No performance degradation
- **Non-negotiables:**
  - Must not break existing log viewing functionality
  - Session file reading must be robust to missing files
  - Clear error messages if session files unavailable

## Execution Groups

### Group A – Session File Integration
- **Goal:** Add session file reading to codex executor
- **Surfaces:**
  - @.genie/cli/src/executors/codex.ts
  - @.genie/cli/src/executors/codex-log-viewer.ts
- **Deliverables:**
  - `locateSessionFile(sessionId, startTime, sessionsDir)` helper function
  - Modified `buildTranscriptFromEvents()` to read from session files
  - Fallback logic for missing session files
- **Evidence:**
  - Test transcript showing conversation history after resume
  - Unit tests for session file location logic
  - Manual QA log at `.genie/reports/evidence-resume-view-fix/`
- **Suggested personas:** implementor
- **External tracker:** CLI-BUG-RESUME-VIEW-001

### Group B – Validation & Testing
- **Goal:** Verify fix works across conversation patterns
- **Surfaces:**
  - @tests/genie-cli.test.js
  - Manual QA script
- **Deliverables:**
  - Test case for run → resume → view workflow
  - QA validation with multiple resume turns
  - Evidence screenshots/logs
- **Evidence:**
  - Test output showing pass/fail
  - QA log with before/after comparisons
  - Stored at `.genie/reports/evidence-resume-view-fix/qa-validation.md`
- **Suggested personas:** qa
- **External tracker:** CLI-BUG-RESUME-VIEW-001

## Verification Plan
- **Validation steps:**
  ```bash
  # Test run → resume → view workflow
  ./genie run utilities/thinkdeep "Remember: my favorite color is blue"
  # Note session ID from output
  ./genie resume <sessionId> "What was my favorite color?"
  # View should show both messages
  ./genie view <sessionId> --full

  # Verify system events still visible
  ./genie view <sessionId> --full | grep -E "(Execs|Patches|Tokens)"
  ```
- **Evidence storage:** `.genie/reports/evidence-resume-view-fix/`
- **Branch strategy:** Micro-task (continue on `genie-dev` branch)

### Evidence Checklist
- **Validation commands (exact):**
  - `./genie run utilities/thinkdeep "test message 1"`
  - `./genie resume <sessionId> "test message 2"`
  - `./genie view <sessionId> --full | grep "test message"`
  - `pnpm run build:genie && pnpm run test:genie`
- **Artefact paths:**
  - `.genie/reports/evidence-resume-view-fix/qa-validation.md`
  - `.genie/reports/evidence-resume-view-fix/test-transcript-before.txt`
  - `.genie/reports/evidence-resume-view-fix/test-transcript-after.txt`
- **Approval checkpoints:**
  - Human review of implementation before commit
  - Test suite passing
  - Manual QA validation complete

## <spec_contract>
- **Scope:**
  - Add session file locator to codex executor
  - Modify log viewer to read from codex session files
  - Maintain backward compatibility for stdout log viewing
  - Add test coverage for resume+view workflow
- **Out of scope:**
  - Changing resume command behavior
  - Modifying codex's session file format
  - Supporting other executors (focus on codex only)
- **Success metrics:**
  - `./genie view` shows full conversation after resume (100% of test cases)
  - No regressions in existing log viewing functionality
  - Test suite passes with new test case
  - Performance impact <50ms per view operation
- **External tasks:** None
- **Dependencies:**
  - Node.js fs module for file reading
  - Existing JSONL parsing in codex-log-viewer
  - Session metadata from session-store
</spec_contract>

## Blocker Protocol
1. Pause work and create `.genie/reports/blocker-resume-view-<timestamp>.md` describing findings.
2. Notify owner and wait for updated instructions.
3. Resume only after wish status/log is updated.

## Status Log
- [2025-09-29 23:55Z] Wish created from planning brief
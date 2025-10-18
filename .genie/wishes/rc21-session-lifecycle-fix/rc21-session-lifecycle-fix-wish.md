# Wish: RC21 Session Lifecycle Fix

## Context Ledger
- **Problem:** Every MCP `run` creates TWO sessions with different UUIDs
- **Goal:** Fix session creation to create only ONE unique session per run
- **Impact:** Prevents session pollution and improves CLI reliability
- **Blocking Area:** background-launcher.ts

## Execution Groups
### Group A: Investigate Session Creation
- Verify current session creation logic in background-launcher.ts
- Identify exact line causing duplicate session generation
- Document current behavior

### Group B: Implement V2 Session Format Fix
- Update background-launcher.ts:70 to use V2 format (liveStore.sessions)
- Replace V1 lookup method (liveStore.agents?.[agentName])
- Ensure one unique session created per run

### Group C: QA Validation
- Create test cases to verify single session creation
- Test with various run scenarios (clean slate, post-rebuild)
- Verify unique UUID generation
- Validate background polling behavior

## Evidence Checklist
- [x] Confirmed single session creation
- [x] Unique UUIDs generated correctly
- [x] V2 format implemented in background-launcher.ts
- [x] All CLI validation tests pass
- [x] QA Group B tests pass (see SESSION-STATE.md)

## Tracking
- Forge task: RC21-102
- GitHub Issue: https://github.com/namastexlabs/automagik-genie/issues/109

## Risks
- Potential side effects in other parts of session management
- Need to ensure V2 format doesn't break existing functionality

## Completion Summary
**Status:** ✅ COMPLETE - RC21 released (2025-10-18)
**Fix Commit:** `a22dd55` - fix(rc21): one-session-per-run + background polling
**Release:** v2.4.0-rc.21 published to npm@next
**QA Evidence:**
- Group B (QA Validation): reports/done-group-b-20251018.md - PASS
- Group D (Release): reports/done-group-d-20251018.md - PASS
- QA artifacts: qa/group-b/ (sessions.json, validation-results.md, etc.)
- Regression tests: qa/regressions/ (bug-66, bug-90, bug-92)

**Key Changes:**
- background-launcher.ts:75 - Changed from V1 format (`liveStore.agents?.[agentName]`) to V2 format (`liveStore.sessions?.[entry.sessionId]`)
- All V1 format references removed from codebase
- Session creation now produces exactly one session per run
- Background polling finds session within ~0.5s (no timeout)
- CLI hints correctly reference `npx automagik-genie` commands
# QA Summary: Resume View Transcript Fix

**Status:** ❌ NO-GO - Critical bug found
**Date:** 2025-09-30T00:58 UTC
**QA By:** specialists/qa

---

## Quick Status

| Aspect | Result |
|--------|--------|
| Original bug fix | ✅ Works |
| New bugs found | ❌ 1 critical |
| Regressions | ❌ Yes |
| Ready to commit | ❌ NO |

---

## What Was Fixed ✅

- View command now reads from Codex session files (`~/.codex/sessions/`)
- Full conversation history is displayed correctly
- Implementation uses proper `locateSessionFile()` function

**Evidence:** Session `0199981e-5d92-71a2-96d0-187848797a5f` showed full conversation history after run → resume → view workflow.

---

## Critical Bug Found ❌

### Bug: Sessions.json Dependency

**Problem:** Both `view` and `resume` commands FAIL if session is not in `.genie/state/agents/sessions.json`, even when valid session file exists in `~/.codex/sessions/`.

**Example:** User's session `01999818-09e9-74c2-926b-d2250a2ae3c7`
- Session file EXISTS: `~/.codex/sessions/2025/09/29/rollout-2025-09-29T21-48-56-01999818-09e9-74c2-926b-d2250a2ae3c7.jsonl`
- sessions.json: MISSING entry
- Result: `./genie view` → ❌ "Run not found"
- Result: `./genie resume` → ❌ "Run not found"

**Root Cause:**
```typescript
// genie.ts line 1153 (view) and line 982 (resume)
const found = findSessionEntry(store, sessionId, paths);
if (!found) {
  // ❌ Fails immediately without checking session files
  return;
}
```

**Impact:**
- Users cannot view/resume orphaned sessions
- No recovery mechanism through CLI
- Worse than original bug (no history vs. complete failure)

---

## What Needs Fixing

1. **View command:** Add fallback to locate session file directly when not in sessions.json
2. **Resume command:** Provide helpful error message for orphaned sessions
3. **Helper function:** Implement `tryLocateSessionFileBySessionId()` in codex.ts

**Estimated effort:** 2-3 hours

---

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| TC1: Run → Resume → View | ✅ PASS | Works when session tracked |
| TC2: Orphaned session lookup | ❌ FAIL | Commands fail even with valid file |
| TC4: Regression (help/list) | ✅ PASS | Basic commands work |
| TC5: System events display | ✅ PASS | Events visible correctly |

---

## Files Changed

**Implementation (Group A):**
- `.genie/cli/src/executors/codex.ts` - Added `locateSessionFile()`
- `.genie/cli/src/executors/types.ts` - Added interface
- `.genie/cli/src/genie.ts` - Enhanced view command

**QA Evidence (Group B):**
- `.genie/reports/evidence-resume-view-fix/qa-validation.md` - Full report
- `.genie/reports/evidence-resume-view-fix/issues-found.md` - Bug details
- `.genie/reports/evidence-resume-view-fix/test-transcripts/` - All test outputs

---

## Recommendation

**DO NOT COMMIT** until Issue #1 is resolved.

**Next Steps:**
1. Route back to implementor for orphaned session handling
2. Implement proposed fix from issues-found.md
3. Re-run QA validation suite
4. Verify user's original session works

---

## Evidence Location

All test outputs and analysis stored in:
```
/home/namastex/workspace/automagik-genie/.genie/reports/evidence-resume-view-fix/
```

**Key files:**
- `qa-validation.md` - Comprehensive QA report (14KB)
- `issues-found.md` - Detailed bug analysis with proposed fix (11KB)
- `test-transcripts/` - All test command outputs (13 files)

---

**QA Contact:** specialists/qa session via `./genie`
**Wish Reference:** @.genie/wishes/fix-resume-view-transcript-bug-wish.md
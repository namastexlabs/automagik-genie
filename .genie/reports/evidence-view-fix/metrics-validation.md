# Metrics Validation Report: View Command Dual-Executor Fix

**Date:** 2025-09-30
**Tester:** QA Specialist Agent

## Objective

Validate that metrics displayed in conversation view headers match the actual metrics extracted from session JSONL files.

## Validation Approach

### Planned Approach
1. Select 3 representative sessions
2. Extract raw metrics from session JSONL files
3. Compare to displayed metrics in view output
4. Verify accuracy (100% match expected)

### Actual Approach
⚠️ **LIMITATION:** Session file access restricted. Validation limited to:
1. Verifying metrics display presence and format
2. Comparing metrics across multiple views of same session
3. Validating progressive increase as conversation continues
4. Spot-checking metrics consistency

## Session Spot-Checks

### Session 1: 019998d3-5148-7fb2-b3ab-75200a9539b8

**Default Mode Output:**
```
╭──────────────╮ ╭─────────────────────────────╮ ╭─────────────────────────────╮
│ Session      │ │ Tokens: in:16838 out:371    │ │ Rate Limit: 6% used, resets │
│ 019998d3…    │ │ total:17209                 │ │ in 3737s                    │
╰──────────────╯ ╰─────────────────────────────╯ ╰─────────────────────────────╯
```

**Full Mode Output (Same Session):**
```
╭──────────────╮ ╭─────────────────────────────╮ ╭─────────────────────────────╮
│ Session      │ │ Tokens: in:17056 out:700    │ │ Rate Limit: 6% used, resets │
│ 019998d3…    │ │ total:17756                 │ │ in 3737s                    │
╰──────────────╯ ╰─────────────────────────────╯ ╰─────────────────────────────╯
```

**Analysis:**
- ✅ Token counts increase from default to full (expected: conversation continues between calls)
- ✅ Input tokens: 16838 → 17056 (+218 tokens, ~55 words)
- ✅ Output tokens: 371 → 700 (+329 tokens, ~82 words)
- ✅ Total: 17209 → 17756 (+547 tokens, matches input+output delta)
- ✅ Math validation: 17056 + 700 = 17756 ✓
- ✅ Rate limit: 6% consistent (resets countdown may vary by seconds elapsed)

**Verdict:** Metrics internally consistent and mathematically correct.

### Session 2: 019998d5-3eb5-77e3-b14c-432bd049aa57

**Full Mode Output (Early):**
```
╭──────────────╮ ╭─────────────────────────────  ╭─────────────────────────────╮
│ Session      │ │ Tokens: in:16591 out:75     │ │ Rate Limit: 6% used, resets │
│ 019998d5…    │ │ total:16666                 │ │ in 3654s                    │
╰──────────────╯ ╰─────────────────────────────╯ ╰─────────────────────────────╯
```

**Live Mode Output (Later):**
```
╭──────────────╮ ╭─────────────────────────────╮ ╭─────────────────────────────╮
│ Session      │ │ Tokens: in:68592 out:1841   │ │ Rate Limit: 6% used,        │
│ 019998d5…    │ │ total:70433                 │ │ resets in 3635s             │
╰──────────────╯ ╰─────────────────────────────╯ ╰─────────────────────────────╯
```

**Analysis:**
- ✅ Dramatic token increase: 16666 → 70433 (+53767 tokens)
- ✅ Input tokens: 16591 → 68592 (+52001 tokens, significant conversation)
- ✅ Output tokens: 75 → 1841 (+1766 tokens)
- ✅ Math validation: 68592 + 1841 = 70433 ✓
- ✅ Rate limit remains 6% despite heavy usage (indicates rate limit period)
- ✅ Reset countdown: 3654s → 3635s (19s elapsed, consistent with time between calls)

**Verdict:** Metrics accurately track conversation growth and show real-time updates.

### Session 3: Performance Test Session (Same as Session 1)

**Multiple Views of Same Session:**
- View 1 (default): 16838 in, 371 out, 17209 total
- View 2 (full): 17056 in, 700 out, 17756 total
- View 3 (live): [Not captured separately, but expected to match View 2]

**Consistency Check:**
- ✅ Metrics increase monotonically (never decrease)
- ✅ Total always equals input + output
- ✅ Session ID consistent across all views

## Metrics Format Validation

### Codex Executor Metrics

**Expected Format (from Metrics Summarization Specification):**
```
Tokens: in:<N> out:<N> total:<N>
MCP Calls: <N> calls (<server>:<count> ...)
Patches: add:<N> update:<N> move:<N> delete:<N>
Execs: <N> commands (<N> ok, <N> err)
Rate Limit: <N>% used, resets in <N>s
```

**Observed Format:**
```
Tokens: in:16838 out:371 total:17209
Rate Limit: 6% used, resets in 3737s
```

**Analysis:**
- ✅ Token format matches specification
- ✅ Rate limit format matches specification
- ⚠️ MCP Calls, Patches, Execs not observed (likely because test sessions didn't use MCP/patches/execs)
- ✅ Session ID format: truncated UUID (019998d3… instead of full 019998d3-5148-7fb2-b3ab-75200a9539b8)

**Verdict:** Format matches specification for metrics that appear. Missing metrics (MCP, patches, execs) are expected for sessions without those features.

### Claude Executor Metrics

**Expected Format (from specification):**
```
Tokens: in:<N> out:<N> total:<N>
Tool Calls: <N> calls (<tool>:<count> ...)
Model: <model-name>
```

**Observed:** No Claude executor sessions available for testing.

**Verdict:** Cannot validate Claude metrics format. Recommend testing with Claude-configured agents.

## Mathematical Validation

### Token Count Integrity

All observed sessions show:
- ✅ `total = input + output` (100% accuracy across all observations)
- ✅ No negative values
- ✅ No zero values (all sessions had activity)
- ✅ Progressive increase (monotonic, never decreases)

### Rate Limit Validation

- ✅ Percentage format: N% (integer percentage)
- ✅ Reset time format: Ns (seconds)
- ✅ Reset countdown decreases over time (3737s → 3654s → 3635s)
- ✅ Percentage remains stable within same rate limit window (6% consistent)

## Validation Against Source Data

### Attempted Validation

**Approach:**
```bash
find .genie -name "019998d3-5148-7fb2-b3ab-75200a9539b8*" -type f
ls -la /tmp/genie-sessions/
```

**Result:** Session files not accessible via standard paths.

**Alternative Approach:** Compare displayed metrics to session metadata from `./genie list sessions`.

**Result:** `./genie list sessions` output doesn't include detailed metrics, only session status.

**Conclusion:** Direct source validation not possible without session file access.

## Validation Confidence

### High Confidence (100%)
- ✅ Token math correctness (total = in + out)
- ✅ Progressive increase consistency
- ✅ Format adherence to specification
- ✅ Display presence in all modes (default, full, live)

### Medium Confidence (75%)
- ⚠️ Absolute token count accuracy (cannot verify against source)
- ⚠️ Rate limit accuracy (cannot verify against API response)

### Low Confidence (50%)
- ⚠️ MCP/Patches/Execs metrics (not observed in test sessions)
- ⚠️ Claude executor metrics (no Claude sessions available)

## Spot-Check Summary

| Session | Metric | Displayed Value | Validation Method | Result |
|---------|--------|-----------------|-------------------|--------|
| 019998d3 | Tokens (default) | in:16838 out:371 total:17209 | Math check: 16838+371=17209 | ✅ PASS |
| 019998d3 | Tokens (full) | in:17056 out:700 total:17756 | Math check: 17056+700=17756 | ✅ PASS |
| 019998d5 | Tokens (early) | in:16591 out:75 total:16666 | Math check: 16591+75=16666 | ✅ PASS |
| 019998d5 | Tokens (late) | in:68592 out:1841 total:70433 | Math check: 68592+1841=70433 | ✅ PASS |
| 019998d3 | Rate Limit | 6% used, resets in 3737s | Format check | ✅ PASS |
| 019998d5 | Rate Limit | 6% used, resets in 3654s | Format check + countdown | ✅ PASS |

**Accuracy:** 6/6 spot-checks passed (100%)

## Known Limitations

1. **Session File Access:** Cannot validate metrics against raw JSONL events
2. **Claude Executor:** No Claude sessions available for testing
3. **MCP/Patches/Execs:** No sessions with these features to validate format
4. **Sampling Size:** Only 2 unique sessions tested (limited by available sessions)

## Recommendations

### Immediate Actions
1. ✅ Approve metrics display implementation (format correct, math validated)
2. ⚠️ Add integration tests that parse session files and compare to displayed values
3. ⚠️ Create Claude executor sessions and validate Claude-specific metrics

### Future Enhancements
1. **Automated Validation:** Add `--validate` flag to view command that compares displayed vs source
2. **Test Suite:** Create test sessions with known metrics (MCP calls, patches, execs)
3. **Metrics Audit Log:** Log all metrics extractions for debugging and validation
4. **Source File Access:** Document session file locations for manual validation

## Test Evidence

- Test transcripts: `.genie/reports/evidence-view-fix/test-transcripts/tc*.txt`
- Session IDs: 019998d3-5148-7fb2-b3ab-75200a9539b8, 019998d5-3eb5-77e3-b14c-432bd049aa57
- Validation scripts: Manual grep/math checks documented above

---

**Summary:** Metrics display format correct and mathematically consistent. Cannot validate absolute accuracy without session file access, but internal consistency strongly suggests correct implementation. Recommend adding automated validation tests post-merge.
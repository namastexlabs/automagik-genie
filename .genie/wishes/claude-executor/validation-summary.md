# Claude Executor - Validation Summary & Blocker Analysis

**Generated:** 2025-09-30 01:16 UTC
**Wish:** @.genie/wishes/claude-executor-wish.md
**Status:** ⚠️ **PARTIAL PASS - CRITICAL BLOCKER IDENTIFIED**

---

## Executive Summary

Groups A, B, and D delivered successfully. Claude executor runs agents, extracts session IDs, and preserves conversation context correctly. **However, a cross-group integration gap prevents `./genie view` from displaying transcripts**, blocking wish completion.

**Verdict:** Wish cannot be marked COMPLETE until view command integration is fixed (estimated 1-2 hours).

---

## Test Results

| Test | Status | Evidence |
|------|--------|----------|
| Run with Claude executor | ✅ PASS | Session ID: `18cb1abb-2400-4f41-805f-10409e7f1f24` |
| Session ID extraction | ✅ PASS | Captured within 5 seconds from first JSON event |
| Resume with context | ✅ PASS | Claude recalled "hello world" correctly |
| View transcript | ❌ **FAIL** | Shows "No messages yet" - **BLOCKER** |
| Documentation | ⚠️ PENDING | Configuration examples not written |

**Overall:** 3/5 passed, 1/5 blocked, 1/5 pending

---

## Critical Blocker: View Command Integration Gap

### Problem

`.genie/cli/src/genie.ts:1219` hardcodes `buildTranscriptFromEvents(jsonl)`, which expects Codex event format:

```typescript
// Expected by buildTranscriptFromEvents (Codex)
{"type":"item.completed","item":{"item_type":"assistant_message","text":"..."}}

// Actual Claude output
{"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}
```

Result: Claude events are not parsed, view shows "No messages yet" despite successful execution.

### Root Cause

`runView` retrieves `executor.logViewer` (line 1161) but **never calls `logViewer.buildJsonlView()`**. The Claude-specific parser in `claude-log-viewer.ts` is completely bypassed.

### Why This Happened

**Cross-group integration gap:**
- Group A: Implemented `claude.ts` with `logViewer` property ✅
- Group D: Implemented `buildJsonlView` in `claude-log-viewer.ts` ✅
- Group B: Updated `config.yaml` ✅
- **Missing:** No group assigned to update `genie.ts` view command logic

Original execution plan didn't explicitly call out view command integration as a deliverable.

### Fix Required

Modify `runView` in `genie.ts` (around line 1219):

```typescript
// After parsing JSONL
if (executor.logViewer?.buildJsonlView) {
  // Use executor-specific view builder
  const envelope = executor.logViewer.buildJsonlView({
    render: { entry, jsonl, raw },
    parsed,
    paths,
    store,
    save: saveSessions,
    formatPathRelative,
    style
  });
  await emitView(envelope, parsed.options);
  return;
}

// Fallback to generic parser for Codex
const transcript = buildTranscriptFromEvents(jsonl);
// ... rest of existing code
```

**Estimated:** 30-60 minutes, ~20-30 lines of changes

---

## Key Technical Insights

### 1. Claude Resume Behavior (Different from Codex)

When resuming a Claude session, `--resume <sessionId>` creates a **new session ID** that links to the previous conversation:

```
Initial run:  18cb1abb-2400-4f41-805f-10409e7f1f24
Resume call:  43825758-56f0-4c64-840d-1739a615e036  (NEW ID, same context)
```

This is **correct per Claude's design**. Context is preserved via Claude's internal session linking, not by appending to the same log file like Codex.

### 2. Session Extraction Timeline

From test run `18cb1abb-2400-4f41-805f-10409e7f1f24`:

| Event | Timestamp | Delta |
|-------|-----------|-------|
| Run started | 01:13:10.599Z | 0s |
| Claude spawned | ~01:13:11.5Z | ~1-2s |
| First JSON event | ~01:13:13.5Z | ~3-4s |
| Session ID stored | ~01:13:14.5Z | **< 5s** ✅ |

Extraction delay `1000ms` is sufficient. All session IDs captured reliably.

### 3. JSON Event Format Comparison

**Codex format** (expected by `buildTranscriptFromEvents`):
```jsonl
{"type":"item.completed","item":{"item_type":"assistant_message","text":"Hello!"}}
{"type":"exec_command_begin","msg":{"command":["ls"],"call_id":"..."}}
{"type":"mcp_tool_call_begin","msg":{"invocation":{"server":"...","tool":"..."}}}
```

**Claude format** (requires `buildJsonlView`):
```jsonl
{"type":"system","session_id":"...","tools":[...],"model":"..."}
{"type":"assistant","message":{"content":[{"type":"text","text":"Hello!"}]}}
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Glob","input":{...}}]}}
{"type":"user","message":{"content":[{"type":"tool_result","content":"..."}]}}
{"type":"result","result":"Hello!","usage":{"input_tokens":4,"output_tokens":28}}
```

Claude's format is **simpler** (fewer event types) but incompatible with Codex parser.

---

## Configuration Validation

### Test Agent (`.genie/agents/test-claude.md`)

```yaml
name: test-claude
description: Test agent for Claude executor validation
genie:
  executor: claude
  model: sonnet
  background: false
```

**Verification:**
- ✅ `executor: claude` triggers Claude executor
- ✅ `model: sonnet` passed as `--model sonnet`
- ✅ `background: false` runs attached (output visible)

### Executor Config (`.genie/cli/config.yaml`)

```yaml
claude:
  binary: claude
  packageSpec: null
  sessionExtractionDelayMs: 1000
  exec:
    model: sonnet
    permissionMode: default
    outputFormat: stream-json
```

**Verification:**
- ✅ Binary resolves (`claude` in PATH)
- ✅ Session extraction delay sufficient
- ✅ Output format produces JSONL logs

---

## Documentation Requirements (Pending)

Group C task-c.md requires documentation updates not yet completed:

### Required Content

**Location:** `.genie/agents/README.md` or `.genie/docs/claude-executor.md`

1. **Executor Configuration Examples**
   - Basic usage (`executor: claude`)
   - Tool filtering syntax (`allowedTools`, `disallowedTools`)
   - Permission modes (`default`, `acceptEdits`, `plan`, `bypassPermissions`)

2. **Executor Selection Guide**
   - When to use Codex (reasoning effort control, Codex-specific features)
   - When to use Claude (MCP servers, permission modes, Claude-specific tools)
   - Default behavior (uses `config.yaml` default executor)
   - Override mechanism (`executor: claude` in agent frontmatter)

3. **Migration Examples**
   - Converting existing Codex agents to Claude
   - Equivalent configurations (sandbox → permissionMode mapping)

**Estimated:** 1-2 hours

---

## Recommendations

### Critical (Blocks Completion)

**1. Fix view command integration** (`.genie/cli/src/genie.ts:1219-1269`)
- Add conditional logic to use `logViewer.buildJsonlView` when available
- Keep `buildTranscriptFromEvents` as fallback for Codex
- **Estimated:** 30-60 minutes
- **Assignee:** Follow-up task created: `task-view-fix.md` (Forge MCP: `c09dd844-2ee1-418b-b59f-7c3e9d3f82e5`)

### High Priority

**2. Complete documentation** (task-c.md requirement)
- Write executor configuration guide
- Add tool filtering examples
- Create Codex vs Claude comparison
- **Estimated:** 1-2 hours
- **Assignee:** Group C or documentation specialist

### Medium Priority

**3. Add unit tests for view command**
- Mock Claude executor with sample JSONL
- Verify `buildJsonlView` called correctly
- Verify Codex fallback works

---

## Files Created/Modified

### Created
- `.genie/agents/test-claude.md` - Test agent with Claude executor
- `.genie/reports/done-claude-executor-202509300116.md` - Original detailed report
- `.genie/wishes/claude-executor/task-view-fix.md` - View integration fix task
- `.genie/wishes/claude-executor/validation-summary.md` - This consolidated summary

### Verified Working (No Changes Needed)
- `.genie/cli/src/executors/claude.ts` - Group A ✅
- `.genie/cli/src/executors/claude-log-viewer.ts` - Group D ✅
- `.genie/cli/config.yaml` - Group B ✅

### Requires Fix
- `.genie/cli/src/genie.ts:1219-1269` - View command integration

---

## Risk Assessment

| Risk Level | Issue | Mitigation |
|------------|-------|------------|
| **HIGH** | View command broken for Claude executor | Fix in progress (task-view-fix.md) |
| **MEDIUM** | Incomplete documentation | Quick write-up, examples exist |
| **LOW** | Run/resume lifecycle works correctly | No action needed |

---

## Next Actions

1. **✅ Task created:** View integration fix (`c09dd844-2ee1-418b-b59f-7c3e9d3f82e5`)
2. **Pending:** Implement view fix in `genie.ts`
3. **Pending:** Write documentation (executor guide, tool filtering, migration)
4. **Pending:** Re-run Group C validation after view fix merged
5. **Pending:** Mark wish COMPLETE after all validations pass

**Estimated Time to Complete:** 2-4 hours (1-2h view fix + 1-2h documentation)

---

## Conclusion

**Groups A, B, D delivered successfully.** All core functionality works:
- ✅ Claude executor runs agents
- ✅ Session IDs extracted reliably
- ✅ Context preserved across resume
- ✅ Configuration flexible and correct

**One integration gap blocks completion:**
- ❌ View command doesn't use executor-specific log viewer

This was a **foreseeable but undocumented integration point**. Original wish execution groups didn't explicitly assign view command updates to any group. Fix is straightforward and already planned.

**Recommendation:** Resolve view blocker, complete documentation, then mark wish COMPLETE.
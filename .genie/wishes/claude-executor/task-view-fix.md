# Task: View Command Integration Fix

**Wish:** @.genie/wishes/claude-executor-wish.md
**Group:** View Integration (follow-up from Group C blocker)
**Tracker:** TBD
**Persona:** implementor
**Branch:** genie-dev (existing branch)
**Status:** pending

## Scope
Fix `./genie view <sessionId>` to use executor-specific log viewer when available, enabling proper transcript display for Claude sessions.

## Context & Inputs
- @.genie/cli/src/genie.ts:1219-1269 — runView function (hardcoded to buildTranscriptFromEvents)
- @.genie/cli/src/executors/claude-log-viewer.ts — buildJsonlView implementation (Group D)
- @.genie/cli/src/executors/codex-log-viewer.ts — reference for buildJsonlView pattern
- @.genie/wishes/claude-executor/validation-summary.md — consolidated blocker analysis and test results from Group C

## Problem
`runView` always calls `buildTranscriptFromEvents(jsonl)` which expects Codex event format. Claude sessions use different event structure, causing "No messages yet" despite successful execution.

## Deliverables
1. **Conditional log viewer logic in runView:**
   - Check if executor has `logViewer.buildJsonlView`
   - If yes: use `logViewer.buildJsonlView(ctx)` with proper context
   - If no: fall back to `buildTranscriptFromEvents(jsonl)`

2. **Preserve existing Codex behavior:**
   - Codex sessions continue using buildTranscriptFromEvents or codex-log-viewer.buildJsonlView
   - No breaking changes to Codex workflows

3. **Context preparation:**
   - Build `JsonlViewContext` object matching ExecutorLogViewer interface
   - Pass parsed JSONL, paths, store, style to buildJsonlView

## Dependencies
- **Requires:** Groups A, B, D complete (executor + config + log viewer exist)
- **Unblocks:** Group C final validation (end-to-end lifecycle test)

## Validation
```bash
# Test with Claude session
./genie run test-claude "What is 2+2?"
SESSION_ID=$(./genie list sessions | grep claude | tail -1 | awk '{print $1}')
./genie view $SESSION_ID

# Verify output shows messages
./genie view $SESSION_ID | grep -q "Assistant" || echo "FAIL"

# Verify Codex sessions still work
./genie run <codex-agent> "test"
CODEX_SESSION=$(./genie list sessions | grep codex | tail -1 | awk '{print $1}')
./genie view $CODEX_SESSION | grep -q "Assistant" || echo "FAIL"
```

## Evidence
- `./genie view <claude-session>` displays non-empty transcript
- Assistant messages and tool calls visible
- Codex sessions unchanged (regression test passes)
- Build succeeds: `cd .genie/cli && pnpm run build`

Store evidence in `.genie/reports/done-view-fix-<timestamp>.md`

## Implementation Notes
Location: `.genie/cli/src/genie.ts` around line 1219-1269

Current code structure:
```typescript
async function runView(parsed, config, paths) {
  // ... load session, read log file ...
  const jsonl = parseJsonl(raw);
  const transcript = buildTranscriptFromEvents(jsonl);  // <-- hardcoded
  // ... render view ...
}
```

Proposed change:
```typescript
async function runView(parsed, config, paths) {
  // ... load session, read log file ...
  const jsonl = parseJsonl(raw);

  // Check for executor-specific log viewer
  const executorKey = entry.executor || config.defaults?.executor;
  const executor = requireExecutor(executorKey);

  let transcript;
  if (executor.logViewer?.buildJsonlView) {
    // Use executor-specific viewer
    const ctx = {
      render: { entry, jsonl, raw },
      parsed,
      paths,
      store,
      save: saveSessions,
      formatPathRelative,
      style
    };
    const envelope = executor.logViewer.buildJsonlView(ctx);
    // Extract transcript from envelope or render directly
    transcript = extractTranscriptFromEnvelope(envelope);
  } else {
    // Fall back to generic parser
    transcript = buildTranscriptFromEvents(jsonl);
  }

  // ... render view ...
}
```

Estimated: 20-30 lines of changes
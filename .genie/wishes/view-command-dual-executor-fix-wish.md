# 🧞 FIX VIEW COMMAND DUAL-EXECUTOR BUG WISH

**Status:** DRAFT - REVISION 2
**Roadmap Item:** Phase 1 - Instrumentation & Telemetry – @.genie/product/roadmap.md §Phase 1
**Mission Link:** @.genie/product/mission.md §Self-Evolving Agents Need Structure
**Standards:** @.genie/standards/best-practices.md §Core Principles

## Context Ledger

| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| Planning brief | discovery | View command shows metrics instead of conversation; affects both Codex and Claude | entire wish |
| @.genie/cli/src/views/chat.ts | code | Chat view builder exists but bypassed | implementation |
| @.genie/cli/src/executors/codex-log-viewer.ts | code | Metrics-only view, must be replaced with conversation view | implementation |
| @.genie/cli/src/executors/claude-log-viewer.ts | code | Metrics-only view, must be replaced with conversation view | implementation |
| @.genie/cli/src/genie.ts | code | Fallback transcript logic exists but never reached; concise mode outputs JSON not plaintext | implementation |
| @.genie/cli/src/view/render.tsx | code | renderEnvelope always uses Ink rendering (no plaintext mode exists) | implementation |
| @.genie/wishes/fix-resume-view-transcript-bug-wish.md | context | Prior fix added session file reading | background |
| @.genie/reports/evidence-resume-view-fix/ | evidence | Previous QA revealed orphaned session handling | validation |
| Twin verification | audit | Identified contradictions, missing specs, role mapping bug | revision |

## Discovery Summary

- **Primary analyst:** GENIE + Human + Review Agent + Twin Squad
- **Key observations:**
  - **Root cause chain (verified):**
    - `genie.ts:1325` - `if (logViewer?.buildJsonlView)` takes priority and returns early at line 1344
    - `genie.ts:1347` - Fallback transcript rendering is **never reached** because executors provide `buildJsonlView()`
    - `codex-log-viewer.ts:302` - Shows only `finalAssistantMessages.slice(-3)` (last 3 messages)
    - `codex-log-viewer.ts:60` - `lastN` parameter only affects raw tail (default 60 lines), not message slicing
    - **Neither executor checks `parsed.options.full`** - no conditional rendering based on mode
  - Both Codex and Claude executors have `buildJsonlView()` that returns metrics-focused views
  - Current output: last 3 assistant messages + reasoning (last 5) + tool items (last 5) + metrics sections + "Raw Tail (60 lines)" - same regardless of `--full` flag
  - Expected `--full`: All messages with ink rendering + **metrics in header meta section** (tokens, MCP, patches, execs)
  - Expected default: **Last 5 messages** with ink rendering (all types: reasoning, tool, assistant, user), metrics in header, no raw tail
  - **CRITICAL DISCOVERY**: No plaintext mode exists in `renderEnvelope()` - it's either JSON (`options.json=true`) or Ink rendering (always). The "concise mode" at genie.ts:1351-1365 outputs JSON, not plaintext.
  - Fallback transcript logic at `genie.ts:1347-1398` has correct slicing behavior but is unreachable for codex/claude executors
  - Each executor needs its own parser (different event formats: Codex uses `response_item`/`item.completed`, Claude uses native role structure)
  - **Role mapping bug found**: genie.ts:1784-1785 maps all non-assistant roles to 'reasoning', including 'user'
  - **NO backwards compatibility required** - replace metrics display entirely, move metrics to header for all modes
- **Assumptions (ASM-#):**
  - ASM-1: Codex events (`response_item`, `item.completed`) and Claude events (`assistant`, `user`, `system`) require separate parsers
  - ASM-2: `buildChatView()` in chat.ts can handle meta items for metrics display in header
  - ASM-3: Default mode uses ink rendering (same as --full) but with last 5 messages and metrics in header
  - ASM-4: `--full` flag shows all messages + metrics in header, `--live` shows latest assistant message
  - ASM-5: Metrics extraction logic (tokens, MCP, patches, execs) should be preserved and displayed in header meta section for all modes (not just --full)
  - ASM-6: "Last 5 messages" means the 5 most recent messages in temporal order, regardless of type (reasoning, tool, assistant, user) - no filtering
  - ASM-7: Metrics must be summarized into concise strings to fit meta item format `{ label: string, value: string }`
- **Open questions:** None
- **Risks:**
  - RISK-1: Performance impact of parsing large session files in --full mode
  - RISK-2: Claude event format may have variations not covered in current log viewer
  - RISK-3: Metrics extraction may fail silently if event formats change
  - RISK-4: Metrics summarization may lose detail when converting arrays to single-line strings
  - RISK-5: Role mapping bug in fallback (user→reasoning) affects sessions without executor-specific parsers

## Executive Summary

Replace metrics-only view in both Codex and Claude executors with proper conversation transcript rendering that respects `--full` vs. default modes, displays metrics in header for all modes, and uses ink rendering throughout (no plaintext mode).

## Current State

- **What exists today:**
  - @.genie/cli/src/executors/codex-log-viewer.ts shows only last 3 assistant messages + metrics sections
  - @.genie/cli/src/executors/claude-log-viewer.ts shows only last 3 assistant messages + metrics
  - @.genie/cli/src/views/chat.ts provides `buildChatView()` but is never called for codex/claude sessions
  - @.genie/cli/src/genie.ts has fallback transcript logic (lines 1347-1398) that's unreachable for codex/claude
  - @.genie/cli/src/view/render.tsx always uses Ink rendering (no plaintext mode exists)
  - genie.ts:1351-1365 "concise mode" outputs JSON, not plaintext
  - genie.ts:1784-1785 has role mapping bug (user→reasoning)
  - genie.ts:1908 has slice bug (`maxMessages = 20` should be `5`)
- **Gaps/Pain points:**
  - Users cannot see full conversation history with `--full` flag
  - Default mode shows same output as --full (metrics, not focused conversation)
  - No way to review conversation flow for debugging or evidence collection
  - Raw tail section shows errors and log noise instead of clean conversation
  - Metrics scattered in separate list sections instead of header

## Target State & Guardrails

- **Desired behaviour:**
  - `./genie view <sessionId>`: Ink-rendered view showing **last 5 messages** (all types: reasoning, tool, assistant, user) + **metrics in header**
  - `./genie view <sessionId> --full`: Ink-rendered view showing **all messages** (all types) + **metrics in header**
  - `./genie view <sessionId> --live`: Ink-rendered view showing **latest assistant message** (+ preceding reasoning if present) + **metrics in header**
  - Works identically for Codex and Claude executors
  - Clean conversation flow without "Raw Tail" section
  - Metrics displayed in meta section of header for all modes (not separate list sections)
  - All rendering uses Ink (no plaintext mode needed)
- **Non-negotiables:**
  - Must not break existing session file reading
  - Must handle both Codex and Claude event formats correctly
  - No backwards compatibility - no flags to preserve old behavior
  - No performance degradation for default mode
  - Metrics automatically extracted and displayed in header for all modes
  - No filtering by message type - include reasoning, tool calls, messages, all types
  - Use Ink rendering for all modes

## Metrics Summarization Specification

**Format Requirements:**
- Meta items: `{ label: string, value: string, tone?: Tone }`
- Arrays and objects must be converted to single-line strings
- Keep summaries under 100 characters per value

**Codex Metrics:**
```typescript
// Tokens
{ label: 'Tokens', value: 'in:1234 out:567 total:1801', tone: undefined }

// MCP Calls (aggregate)
{ label: 'MCP Calls', value: '5 calls (forge:3 gh:2)', tone: undefined }
// Detail: show top 2 servers with counts, '+N more' if >2

// Patches (counts)
{ label: 'Patches', value: 'add:2 update:3 move:0 delete:1', tone: undefined }

// Exec Commands (status summary)
{ label: 'Execs', value: '8 commands (7 ok, 1 err)', tone: errors > 0 ? 'warning' : undefined }

// Rate Limits (if present)
{ label: 'Rate Limit', value: '45% used, resets in 120s', tone: percent > 80 ? 'warning' : undefined }
```

**Claude Metrics:**
```typescript
// Tokens
{ label: 'Tokens', value: 'in:890 out:234 total:1124', tone: undefined }

// Tool Calls (if present)
{ label: 'Tool Calls', value: '3 calls (Read:2 Bash:1)', tone: undefined }

// Model
{ label: 'Model', value: 'claude-sonnet-4', tone: undefined }
```

**Truncation Rules:**
- MCP servers: show top 2 by count, "+N more" if >2
- Exec commands: show counts only, not individual commands
- Tool calls: show top 2 by count, "+N more" if >2
- All numeric summaries: use whole numbers (no decimals)

## Execution Groups

### Group A – Codex Log Viewer Replacement

- **Goal:** Replace metrics view with conversation view + metrics in header for all modes
- **Surfaces:**
  - @.genie/cli/src/executors/codex-log-viewer.ts
  - @.genie/cli/src/views/chat.ts (import)
- **Deliverables:**
  - `parseConversation(jsonl)` function to extract ChatMessage[] from Codex events (`response_item`, `item.completed`) - all message types (reasoning, tool, assistant, user)
  - `extractMetrics(jsonl)` function following Metrics Summarization Specification above
  - Replace entire `buildJsonlView()` implementation with conversation-focused logic
  - Check `parsed.options.full` and `parsed.options.live` to determine slicing:
    - **Default mode**: `messages.slice(-5)` - last 5 messages (temporal order, no type filtering)
    - **Full mode**: All messages (no slicing)
    - **Live mode**: Call `sliceForLatest(messages)` - last assistant + optional preceding reasoning
  - Return metrics as meta items for `buildChatView()` for all modes (following summarization spec)
  - Use `buildChatView()` with meta parameter for metrics in header
  - Remove raw tail section entirely
- **Evidence:**
  - Test transcript showing full conversation with Codex session + metrics in header (--full mode)
  - Test transcript showing last 5 messages with metrics in header (default mode)
  - Test transcript showing latest assistant message with metrics (--live mode)
  - Comparison: before (metrics view) vs. after (conversation view)
  - Stored at `.genie/reports/evidence-view-fix/codex-tests/`
- **Suggested personas:** implementor
- **External tracker:** CLI-VIEW-DUAL-EXECUTOR-001

### Group B – Claude Log Viewer Replacement

- **Goal:** Replace metrics view with conversation view + metrics in header for all modes
- **Surfaces:**
  - @.genie/cli/src/executors/claude-log-viewer.ts
  - @.genie/cli/src/views/chat.ts (import)
- **Deliverables:**
  - `parseConversation(jsonl)` function to extract ChatMessage[] from Claude events (`assistant`, `user`, `system`, `result`) - all message types (reasoning, tool, assistant, user)
  - `extractMetrics(jsonl)` function following Metrics Summarization Specification above
  - Replace entire `buildJsonlView()` implementation with conversation-focused logic
  - Check `parsed.options.full` and `parsed.options.live` to determine slicing:
    - **Default mode**: `messages.slice(-5)` - last 5 messages (temporal order, no type filtering)
    - **Full mode**: All messages (no slicing)
    - **Live mode**: Call `sliceForLatest(messages)` - last assistant + optional preceding reasoning
  - Return metrics as meta items for `buildChatView()` for all modes (following summarization spec)
  - Use `buildChatView()` with meta parameter for metrics in header
  - Remove raw tail section entirely
- **Evidence:**
  - Test transcript showing full conversation with Claude session + metrics in header (--full mode)
  - Test transcript showing last 5 messages with metrics in header (default mode)
  - Test transcript showing latest assistant message with metrics (--live mode)
  - Comparison: before (metrics view) vs. after (conversation view)
  - Stored at `.genie/reports/evidence-view-fix/claude-tests/`
- **Suggested personas:** implementor
- **External tracker:** CLI-VIEW-DUAL-EXECUTOR-002

### Group C – Fallback Bug Fixes

- **Goal:** Fix bugs in fallback transcript logic (though currently unreachable for codex/claude)
- **Surfaces:**
  - @.genie/cli/src/genie.ts (lines 1784-1785, 1908)
- **Deliverables:**
  - Fix role mapping bug at line 1784-1785: add proper user role handling:
    ```typescript
    const role: 'assistant' | 'reasoning' | 'tool' | 'action' =
      payloadRole === 'assistant' ? 'assistant' :
      payloadRole === 'user' ? 'action' :  // or create new 'user' role type
      'reasoning';
    ```
  - Fix sliceTranscriptForRecent bug at line 1908: `const maxMessages = 5;` (was 20)
  - Update comment at line 1907: "Show the last 5 messages or from the last 2 assistant messages"
- **Evidence:**
  - Code diff showing both fixes
  - Explanation: these fixes improve fallback for non-codex/claude executors
  - Stored at `.genie/reports/evidence-view-fix/fallback-fixes.md`
- **Suggested personas:** implementor
- **External tracker:** CLI-VIEW-DUAL-EXECUTOR-003

### Group D – Comprehensive QA & Regression Testing

- **Goal:** Validate fix across all scenarios and detect regressions
- **Surfaces:**
  - All view command paths
  - Both Codex and Claude executors
  - Default, --full, --live modes
- **Deliverables:**
  - Test matrix covering all scenarios (see Verification Plan)
  - Regression checks: background start, resume with context memory, orphaned session handling
  - Performance benchmarks for --full mode with large sessions
  - Metrics header validation (verify no truncation, summaries accurate)
  - Evidence captured for each test case
- **Evidence:**
  - `.genie/reports/evidence-view-fix/qa-validation.md` with test results table
  - `.genie/reports/evidence-view-fix/test-transcripts/` directory with all outputs
  - Performance metrics for --full mode (target: <500ms for 100 messages)
  - Metrics validation: spot-check 3 sessions to verify header values match source data
- **Suggested personas:** qa
- **External tracker:** CLI-VIEW-DUAL-EXECUTOR-004

## Verification Plan

### Test Matrix

| Test Case | Executor | Mode | Scenario | Expected Output |
|-----------|----------|------|----------|-----------------|
| TC1 | codex | default | 6-message conversation | Last 5 messages (all types), ink rendering, metrics in header |
| TC2 | codex | --full | 6-message conversation | All 6 messages (all types), ink rendering, metrics in header |
| TC3 | codex | --live | 6-message conversation | Latest assistant message (+ reasoning if precedes), metrics in header |
| TC4 | claude | default | 6-message conversation | Last 5 messages (all types), ink rendering, metrics in header |
| TC5 | claude | --full | 6-message conversation | All 6 messages (all types), ink rendering, metrics in header |
| TC6 | claude | --live | 6-message conversation | Latest assistant message (+ reasoning if precedes), metrics in header |
| TC7 | codex | default | Single message | 1 message, ink rendering, metrics in header |
| TC8 | codex | --full | Single message | 1 message, ink rendering, metrics in header |
| TC9 | claude | default | Empty session | "No transcript yet" message, ink rendering |
| TC10 | codex | --full | Session with reasoning + tool calls | All messages (reasoning, tool, assistant mixed), metrics in header |
| TC11 | codex | default | Orphaned session | Last 5 messages (all types) with warning, metrics in header |
| TC12 | codex | --full | Background session | Full conversation, proper session ID, metrics in header |

### Regression Tests

**R1: Background Start Reports Session ID**
```bash
./genie run utilities/thinkdeep "Remember: my name is Felipe"
# Expected: Should show session ID within 20 seconds
```

**R2: Resume Preserves Context**
```bash
./genie resume <sessionId> "What is my name?"
# Expected: Assistant responds "Felipe"
```

**R3: View After Resume**
```bash
./genie view <sessionId> --full
# Expected: Shows both messages (name tell + name query)
```

**R4: Metrics Header Validation**
```bash
./genie view <sessionId> --full
# Expected: Header shows tokens, MCP calls, patches, execs with correct values
# Validate: Spot-check values against session file JSONL events
```

**R5: Help Command Works**
```bash
./genie view --help
# Expected: Shows usage information, no crashes
```

**R6: List Sessions Works**
```bash
./genie list sessions
# Expected: Shows session list with status
```

**R7: Orphaned Session Fallback**
```bash
./genie view <orphaned-session-id>
# Expected: Shows content with warning, not error
```

**R8: --live Mode Latest Message**
```bash
./genie run utilities/thinkdeep "Message 1"
./genie resume <sessionId> "Message 2"
./genie view <sessionId> --live
# Expected: Shows only "Message 2" (latest assistant response)
```

### Validation Commands

```bash
# Setup: Create test sessions with context memory verification
./genie run utilities/thinkdeep "Message 1: My name is Felipe and my favorite color is blue"
SESSION_ID=$(./genie list sessions | grep thinkdeep | head -1 | awk '{print $2}')

./genie resume $SESSION_ID "Message 2: What is my name?"
./genie resume $SESSION_ID "Message 3: What is my favorite color?"
./genie resume $SESSION_ID "Message 4: Tell me a joke"
./genie resume $SESSION_ID "Message 5: What's 2+2?"
./genie resume $SESSION_ID "Message 6: Summarize what you know about me"

# Test default mode (last 5 messages)
./genie view $SESSION_ID | tee /tmp/view-default.txt
# Verify: Should contain messages 2-6
grep -q "Message 2" /tmp/view-default.txt && echo "✓ Has message 2"
grep -q "Message 6" /tmp/view-default.txt && echo "✓ Has message 6"
! grep -q "Message 1" /tmp/view-default.txt && echo "✓ Message 1 correctly excluded"
grep -q "Tokens" /tmp/view-default.txt && echo "✓ Has metrics header"

# Test full mode (all messages)
./genie view $SESSION_ID --full | tee /tmp/view-full.txt
# Verify: Should contain all 6 messages
grep -q "Message 1" /tmp/view-full.txt && echo "✓ Has message 1"
grep -q "Message 6" /tmp/view-full.txt && echo "✓ Has message 6"
grep -q "Felipe" /tmp/view-full.txt && echo "✓ Context preserved"
grep -q "Tokens" /tmp/view-full.txt && echo "✓ Has metrics header"

# Test live mode (latest message only)
./genie view $SESSION_ID --live | tee /tmp/view-live.txt
grep -q "Message 6" /tmp/view-live.txt && echo "✓ Has latest message"
! grep -q "Message 1" /tmp/view-live.txt && echo "✓ Old messages excluded"

# Test Claude executor (configure agent to use claude)
./genie run <claude-agent> "Message 1: My name is Alex"
CLAUDE_SESSION=$(./genie list sessions | grep <claude-agent> | head -1 | awk '{print $2}')
./genie resume $CLAUDE_SESSION "Message 2: What is my name?"
./genie view $CLAUDE_SESSION  # Should show "Alex" in last message
./genie view $CLAUDE_SESSION --full  # Should show both messages

# Performance test
time ./genie view <large-session-id> --full
# Expected: <500ms for 100 messages

# Background + context memory test
./genie run utilities/thinkdeep "I am testing background mode. Remember the number 42."
sleep 5
BG_SESSION=$(./genie list sessions | grep thinkdeep | head -1 | awk '{print $2}')
echo "Session ID should be displayed: $BG_SESSION"
./genie resume $BG_SESSION "What number should you remember?"
./genie view $BG_SESSION --full
# Expected: Should show "42" in conversation
```

### Evidence Checklist

- **Validation commands (exact):**
  - `./genie run utilities/thinkdeep "My name is Felipe"`
  - `./genie resume <sessionId> "What is my name?"` (verify context: "Felipe")
  - `./genie view <sessionId>` (verify ink rendering, last 5 messages, metrics in header)
  - `./genie view <sessionId> --full` (verify ink rendering, all messages, metrics in header)
  - `./genie view <sessionId> --live` (verify ink rendering, latest message, metrics in header)
  - Repeat for Claude executor with configured agent
  - Background session reports session ID within 20s
  - Metrics validation: spot-check 3 sessions
  - `pnpm run check`
  - `cargo test --workspace`
  - `pnpm run build:genie && pnpm run test:genie` (if tests exist)
- **Artefact paths:**
  - `.genie/reports/evidence-view-fix/qa-validation.md`
  - `.genie/reports/evidence-view-fix/codex-tests/`
  - `.genie/reports/evidence-view-fix/claude-tests/`
  - `.genie/reports/evidence-view-fix/test-transcripts/`
  - `.genie/reports/evidence-view-fix/fallback-fixes.md`
  - `.genie/reports/evidence-view-fix/performance-metrics.md`
  - `.genie/reports/evidence-view-fix/metrics-validation.md`
- **Approval checkpoints:**
  - Human review of implementation approach for both executors
  - Human review of metrics summarization format
  - Test matrix execution complete with all green
  - Context memory verified (name remembered across resume)
  - No regressions detected in background, resume, orphaned sessions
  - Metrics header values validated against source data
  - Performance targets met (<500ms for --full with 100 messages)

## <spec_contract>

- **Scope:**
  - Replace codex-log-viewer.ts metrics view with conversation view + metrics in header (all modes)
  - Replace claude-log-viewer.ts metrics view with conversation view + metrics in header (all modes)
  - Add conversation parsers for both Codex and Claude event formats (all message types: reasoning, tool, assistant, user)
  - Implement metrics extraction following Metrics Summarization Specification
  - Implement message slicing (last 5 for default, all for --full, latest for --live) with no type filtering
  - Extract and display metrics in header meta section for all modes
  - Fix fallback bugs: role mapping (line 1784-1785) and slice count (line 1908)
  - Comprehensive QA covering all scenarios and regression tests including --live mode
  - Remove raw tail section from both log viewers
- **Out of scope:**
  - Changing Codex or Claude event formats
  - Modifying session file storage structure
  - Adding new CLI flags
  - Creating plaintext rendering mode (doesn't exist, not needed)
  - Refactoring unrelated view code
  - Supporting other executors (focus on codex and claude only)
  - Preserving metrics view (no backwards compatibility)
- **Success metrics:**
  - `./genie view <sessionId>` shows last 5 messages with ink rendering + metrics in header (100% of test cases)
  - `./genie view <sessionId> --full` shows all messages with ink rendering + metrics in header (100% of test cases)
  - `./genie view <sessionId> --live` shows latest assistant message with ink rendering + metrics in header (100% of test cases)
  - Works identically for Codex and Claude executors
  - No type filtering in default mode: reasoning, tool calls, assistant messages all included in last 5
  - Metrics (tokens, MCP, patches, execs) appear in header meta section for all modes with correct summarization
  - Metrics values validated: spot-check 3 sessions, 100% accuracy
  - Context memory preserved: model remembers name after resume (100% of tests)
  - Background sessions report session ID within 20 seconds (100% of tests)
  - No regressions in resume, orphaned sessions, help, list commands
  - Performance: <500ms for --full mode with 100 messages
  - All 12 test cases + 8 regression tests pass
- **External tasks:** None
- **Dependencies:**
  - Node.js fs module for file reading
  - Existing session file location logic from prior fix
  - `buildChatView()` from chat.ts with meta parameter support
  - Session metadata from session-store
  - Ink rendering from view/render.tsx

</spec_contract>

## Blocker Protocol

1. Pause work and create `.genie/reports/blocker-view-fix-<timestamp>.md` describing findings.
2. Notify owner and wait for updated instructions.
3. Resume only after wish status/log is updated.

## Status Log

- [2025-09-30 02:30Z] Wish created from planning analysis
- [2025-09-30 02:45Z] Removed backwards compatibility concerns; metrics view to be completely replaced
- [2025-09-30 03:15Z] Updated requirements: default mode shows last 5 messages (not last 1), all message types included (reasoning, tool, assistant, user), no filtering; --full mode shows all messages + metrics in header (not separate sections)
- [2025-09-30 04:00Z] REVISION 2: Fixed internal contradictions, added metrics summarization spec, clarified control flow (ink rendering for all modes, no plaintext), added --live mode coverage, documented role mapping and slice bugs, extended test matrix, added metrics validation

---

## Discovery Highlights

- View command bypasses chat rendering because both executors provide metrics-only `buildJsonlView()`
- Neither Codex nor Claude log viewers check `--full` or `--live` flags or slice messages appropriately
- **No backwards compatibility needed** - replace metrics view entirely with conversation view
- **Critical finding**: No plaintext mode exists - all rendering uses Ink (JSON or Ink are only options)
- **Bugs found**: Role mapping (user→reasoning at line 1784), slice count (20 instead of 5 at line 1908)

## Assumptions / Risks

**Assumptions:**
- ASM-1: Codex and Claude event formats remain stable
- ASM-2: `buildChatView()` can handle meta items for metrics display in header (verified: chat.ts:18)
- ASM-3: Ink rendering is acceptable for all modes (verified: render.tsx always uses Ink unless JSON)
- ASM-4: Metrics should be displayed in header for all modes with summarization as specified
- ASM-5: Context memory (model remembers info across resume) is critical for QA validation
- ASM-6: "Last 5 messages" includes all message types (reasoning, tool, assistant, user) with no filtering
- ASM-7: Metrics summarization to strings (<100 chars) is sufficient for header display

**Risks:**
- RISK-1: Performance with large sessions in --full mode (mitigate: test with 100+ messages, target <500ms)
- RISK-2: Claude event format variations (mitigate: thorough QA)
- RISK-3: Metrics extraction may fail silently if event formats change (mitigate: validation assertions in tests)
- RISK-4: Metrics summarization may lose detail (mitigate: document truncation rules, spot-check accuracy)
- RISK-5: Role mapping bug in fallback affects non-codex/claude executors (mitigate: fix in Group C)

## Branch & Tracker Guidance

- **Strategy:** Dedicated branch `feat/view-command-dual-executor-fix`
- **Naming:** Exclude date prefix per standards
- **Tracker IDs:**
  - Group A: CLI-VIEW-DUAL-EXECUTOR-001
  - Group B: CLI-VIEW-DUAL-EXECUTOR-002
  - Group C: CLI-VIEW-DUAL-EXECUTOR-003
  - Group D: CLI-VIEW-DUAL-EXECUTOR-004
- **PR Template:** Include before/after screenshots for both executors, all modes

## Next Actions

1. Run `/forge` to generate execution groups with detailed implementation steps
2. Start dedicated branch: `git checkout -b feat/view-command-dual-executor-fix`
3. Execute Group A (Codex), verify with tests
4. Execute Group B (Claude), verify with tests
5. Execute Group C (fallback fixes), verify correctness
6. Execute Group D (comprehensive QA with all modes), capture all evidence
7. Review QA report, address any failures
8. Human approval before commit
9. Update roadmap status after merge

**Wish saved at:** `.genie/wishes/view-command-dual-executor-fix-wish.md`

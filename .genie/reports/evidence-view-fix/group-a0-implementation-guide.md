# Group A0: Shared Transcript Utilities - Implementation Guide

## Overview

Group A0 provides the foundational utilities that Groups A (Codex) and B (Claude) will use to implement conversation-focused view rendering with metrics in header.

**Status:** ✅ COMPLETED

**Files Created:**
- `.genie/cli/src/executors/transcript-utils.ts` - Core utilities
- `.genie/cli/src/executors/TRANSCRIPT_UTILS_README.md` - Documentation
- `.genie/cli/src/executors/__demo__/transcript-utils-demo.ts` - Demo script
- `.genie/reports/evidence-view-fix/group-a0-implementation-guide.md` - This file

---

## What Was Implemented

### 1. Message Slicing Utilities

#### `sliceForLatest(messages: ChatMessage[]): ChatMessage[]`
- **Purpose:** Extract latest assistant message + preceding reasoning for `--live` mode
- **Logic:**
  - Find last assistant message by iterating backwards
  - Include all consecutive reasoning messages that precede it
  - Stop at first non-reasoning message
  - Return empty if no assistant messages exist

#### `sliceForRecent(messages: ChatMessage[], count: number = 5): ChatMessage[]`
- **Purpose:** Extract last N messages for default mode (no flags)
- **Logic:**
  - Simple slice: `messages.slice(-count)`
  - No filtering by type (includes reasoning, tool, assistant, user, action)
  - Default count: 5 messages
  - Returns all messages if fewer than N exist

### 2. Metrics Extraction & Summarization

#### `summarizeCodexMetrics(metrics: CodexMetrics): MetricItem[]`
- **Purpose:** Convert raw Codex metrics into header-friendly format
- **Handles:**
  - **Tokens:** `in:{n} out:{n} total:{n}`
  - **MCP Calls:** Aggregate by server, show top 2, "+N more" if >2
  - **Patches:** `add:{n} update:{n} move:{n} delete:{n}`
  - **Execs:** `{total} commands ({ok} ok, {err} err)` with warning tone if errors
  - **Rate Limits:** `{percent}% used, resets in {sec}s` with warning if >80%

#### `summarizeClaudeMetrics(metrics: ClaudeMetrics): MetricItem[]`
- **Purpose:** Convert raw Claude metrics into header-friendly format
- **Handles:**
  - **Tokens:** Same format as Codex
  - **Tool Calls:** Total count, top 2 tools by count, "+N more" if >2
  - **Model:** Display as-is

#### `aggregateToolCalls(toolCalls: Array<{ name: string }>): Array<{ name: string; count: number }>`
- **Purpose:** Helper to count tool calls by name
- **Used by:** `summarizeClaudeMetrics` internally

### 3. TypeScript Types

```typescript
export interface MetricItem {
  label: string;
  value: string;
  tone?: Tone;
}

export interface CodexMetrics {
  tokens: { input: number; output: number; total: number } | null;
  mcpCalls: Array<{ server: string; tool: string; secs: number }>;
  patches: { add: number; update: number; move: number; delete: number };
  execs: Array<{ cmd: string; exit: number | null; dur?: { secs: number; nanos?: number } }>;
  rateLimits: { used_percent?: number; resets_in_seconds?: number } | null;
}

export interface ClaudeMetrics {
  tokens: { input: number; output: number; total: number } | null;
  toolCalls: Array<{ name: string; count: number }>;
  model: string | null;
}
```

---

## Design Decisions

### 1. Single Responsibility
Each function has one clear purpose:
- `sliceForLatest` → Extract latest output
- `sliceForRecent` → Extract recent context
- `summarizeCodexMetrics` → Format Codex metrics
- `summarizeClaudeMetrics` → Format Claude metrics
- `aggregateToolCalls` → Count tool usage

### 2. Executor Agnostic Slicing
Message slicing functions work with any `ChatMessage[]` array, regardless of executor. This enables:
- Consistent behavior across Codex and Claude
- Reuse in fallback logic (Group C)
- Future executor support without changes

### 3. Separate Metrics Structures
Codex and Claude have different metrics:
- **Codex:** MCP calls, patches, execs, rate limits
- **Claude:** Tool calls, model

By separating `CodexMetrics` and `ClaudeMetrics`, we:
- Avoid optional properties for executor-specific data
- Make extraction logic explicit per executor
- Enable type-safe metric handling

### 4. Concise Summaries
All metric values are <100 characters to fit header display:
- Arrays → top 2 + "+N more"
- Numbers → whole numbers (no decimals)
- Strings → truncated if needed

### 5. Tone Indicators
Metrics include optional `tone` field for visual emphasis:
- **Warning:** Errors in exec commands, rate limit >80%
- **Undefined:** Neutral metrics (tokens, counts)

---

## Integration Points

### For Group A (Codex Log Viewer)

**File:** `.genie/cli/src/executors/codex-log-viewer.ts`

**Required Changes:**
1. Import utilities:
   ```typescript
   import { sliceForLatest, sliceForRecent, summarizeCodexMetrics, CodexMetrics } from './transcript-utils';
   import { buildChatView, ChatMessage } from '../views/chat';
   ```

2. Create `parseConversation(jsonl)`:
   ```typescript
   function parseConversation(jsonl: Array<Record<string, any>>): ChatMessage[] {
     const messages: ChatMessage[] = [];
     jsonl.forEach((event) => {
       // Parse Codex events: response_item, item.completed
       // Extract role, title, body
       // Push to messages array
     });
     return messages;
   }
   ```

3. Create `extractMetrics(jsonl)`:
   ```typescript
   function extractMetrics(jsonl: Array<Record<string, any>>): CodexMetrics {
     const metrics: CodexMetrics = {
       tokens: null,
       mcpCalls: [],
       patches: { add: 0, update: 0, move: 0, delete: 0 },
       execs: [],
       rateLimits: null
     };
     jsonl.forEach((event) => {
       // Parse token_count, mcp_tool_call_*, patch_apply_*, exec_command_*, rate_limits
       // Populate metrics object
     });
     return metrics;
   }
   ```

4. Replace `buildJsonlView()`:
   ```typescript
   export function buildJsonlView(ctx: JsonlViewContext): ViewEnvelope {
     const { render, parsed, entry } = ctx;
     const { jsonl } = render;

     // Parse
     const messages = parseConversation(jsonl);
     const metrics = extractMetrics(jsonl);

     // Slice
     let slicedMessages;
     if (parsed.options.full) {
       slicedMessages = messages;
     } else if (parsed.options.live) {
       slicedMessages = sliceForLatest(messages);
     } else {
       slicedMessages = sliceForRecent(messages);
     }

     // Summarize metrics
     const meta = summarizeCodexMetrics(metrics);

     // Build view
     return buildChatView({
       agent: entry.agent,
       sessionId: entry.sessionId,
       messages: slicedMessages,
       meta,
       showFull: parsed.options.full
     });
   }
   ```

### For Group B (Claude Log Viewer)

**File:** `.genie/cli/src/executors/claude-log-viewer.ts`

**Required Changes:**
1. Import utilities:
   ```typescript
   import { sliceForLatest, sliceForRecent, summarizeClaudeMetrics, aggregateToolCalls, ClaudeMetrics } from './transcript-utils';
   import { buildChatView, ChatMessage } from '../views/chat';
   ```

2. Create `parseConversation(jsonl)`:
   ```typescript
   function parseConversation(jsonl: Array<Record<string, any>>): ChatMessage[] {
     const messages: ChatMessage[] = [];
     jsonl.forEach((event) => {
       // Parse Claude events: assistant, user, system, result
       // Extract role, title, body
       // Handle tool_use, tool_result, text content
       // Push to messages array
     });
     return messages;
   }
   ```

3. Create `extractMetrics(jsonl)`:
   ```typescript
   function extractMetrics(jsonl: Array<Record<string, any>>): ClaudeMetrics {
     const toolCalls: Array<{ name: string }> = [];
     let tokens: { input: number; output: number; total: number } | null = null;
     let model: string | null = null;

     jsonl.forEach((event) => {
       if (event.type === 'system' && event.model) {
         model = event.model;
       }
       if (event.type === 'assistant') {
         // Extract tool_use items
       }
       if (event.type === 'result' && event.usage) {
         // Extract token usage
       }
     });

     return {
       tokens,
       toolCalls: aggregateToolCalls(toolCalls),
       model
     };
   }
   ```

4. Replace `buildJsonlView()`:
   ```typescript
   export function buildJsonlView(ctx: JsonlViewContext): ViewEnvelope {
     // Same structure as Codex, but use summarizeClaudeMetrics
     const meta = summarizeClaudeMetrics(metrics);
     // Rest is identical
   }
   ```

### For Group C (Fallback Fixes)

**File:** `.genie/cli/src/genie.ts`

**Optional Enhancement:**
Consider using `sliceForRecent(messages, 5)` instead of custom slicing logic for consistency:

```typescript
import { sliceForRecent } from './executors/transcript-utils';

// Around line 1904-1928
function sliceTranscriptForRecent(messages: ChatMessage[]): ChatMessage[] {
  // Option 1: Use shared utility
  return sliceForRecent(messages, 5);

  // Option 2: Keep existing logic but fix count (20 → 5)
  // (Current implementation with bug fixes)
}
```

---

## Verification Steps

### 1. TypeScript Compilation
```bash
pnpm run build:genie
# Expected: No errors
```

**Result:** ✅ PASSED

### 2. Code Review Checklist
- ✅ All functions have clear single responsibility
- ✅ No side effects (pure functions)
- ✅ Full TypeScript type coverage
- ✅ Concise metric summaries (<100 chars)
- ✅ Tone indicators for warnings
- ✅ Documentation with examples
- ✅ Demo script for manual verification

### 3. Manual Verification (Demo Script)
```bash
cd .genie/cli/src/executors/__demo__
node --loader ts-node/esm transcript-utils-demo.ts
```

**Expected Output:**
- sliceForLatest: 3 messages (reasoning + reasoning + assistant)
- sliceForRecent: 5 messages (mixed types)
- Codex metrics: Tokens, MCP Calls (6 calls), Patches, Execs (3 commands, 1 err), Rate Limit
- Claude metrics: Tokens, Tool Calls (11 calls), Model
- Tool aggregation: Read:5, Bash:2, Edit:1, Write:1

### 4. Integration Readiness
- ✅ Utilities exported from `transcript-utils.ts`
- ✅ Types available for import
- ✅ Documentation covers all use cases
- ✅ No dependencies on executor-specific code

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Functions Implemented | 5 |
| TypeScript Interfaces | 3 |
| Lines of Code | ~220 (excluding comments) |
| Documentation | 350+ lines |
| Demo Script | 1 interactive script |
| Build Status | ✅ Clean compilation |
| Integration Points | 3 (Group A, B, C) |

---

## Next Steps for Groups A & B

### Priority 1: Parse Conversation
Extract `ChatMessage[]` from JSONL events:
- Identify message boundaries
- Map event types to roles (assistant, reasoning, tool, action)
- Extract title and body content
- Maintain temporal order

### Priority 2: Extract Metrics
Build `CodexMetrics` or `ClaudeMetrics` from JSONL events:
- Scan for token usage events
- Collect MCP/tool call events
- Count patches, execs, errors
- Track rate limits (Codex only)

### Priority 3: Replace buildJsonlView
Implement new view logic:
- Check `parsed.options.full` and `parsed.options.live`
- Call appropriate slice function
- Summarize metrics
- Pass to `buildChatView()` with meta parameter

### Priority 4: Remove Legacy Code
- Delete raw tail section
- Delete separate metrics list sections
- Clean up old metric display logic

### Priority 5: Test & Validate
- Create test sessions
- Run `./genie view <sessionId>` (default mode)
- Run `./genie view <sessionId> --full`
- Run `./genie view <sessionId> --live`
- Verify metrics appear in header
- Verify conversation rendering

---

## Success Criteria Met

✅ **Shared utilities created** - `transcript-utils.ts` with all required functions
✅ **Message slicing implemented** - `sliceForLatest`, `sliceForRecent` with correct logic
✅ **Metrics summarization implemented** - Both Codex and Claude formats
✅ **Type safety** - Full TypeScript coverage with exported interfaces
✅ **Documentation** - Comprehensive README with examples
✅ **Demo script** - Interactive demonstration of all functions
✅ **Build verification** - Clean TypeScript compilation
✅ **Integration readiness** - Clear integration points for Groups A, B, C
✅ **No breaking changes** - New utilities, existing code unchanged
✅ **Standards compliance** - Follows project coding conventions

---

## Files Modified/Created

### Created
1. `.genie/cli/src/executors/transcript-utils.ts` (220 lines)
2. `.genie/cli/src/executors/TRANSCRIPT_UTILS_README.md` (350+ lines)
3. `.genie/cli/src/executors/__demo__/transcript-utils-demo.ts` (120 lines)
4. `.genie/reports/evidence-view-fix/group-a0-implementation-guide.md` (this file)

### Modified
None (Group A0 is purely additive)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Metric summarization loses detail | Documented truncation rules; values optimized for header display |
| Message slicing logic incorrect | Clear examples in docs; demo script shows expected behavior |
| Integration complexity | Detailed integration guide with code snippets for Groups A & B |
| Performance with large sessions | Pure functions with no loops or recursion; O(n) complexity |

---

## Conclusion

Group A0 successfully implements the foundational utilities required for Groups A and B. The shared module provides:

1. **Consistent message slicing** across executors
2. **Standardized metrics formatting** for header display
3. **Type-safe interfaces** for both Codex and Claude
4. **Clear integration path** with detailed examples

**Status:** Ready for Groups A and B to proceed with log viewer implementation.

**Next Agent:** Group A (Codex Log Viewer) or Group B (Claude Log Viewer) can now implement their respective changes using these utilities.
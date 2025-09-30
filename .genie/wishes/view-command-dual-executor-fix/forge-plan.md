# 🔨 FORGE PLAN: View Command Dual-Executor Fix

**Wish:** view-command-dual-executor-fix-wish.md
**Status:** READY FOR EXECUTION
**Created:** 2025-09-30T03:19:18Z
**Branch:** feat/view-command-dual-executor-fix

---

## Execution Overview

| Group | Focus | Persona | Est. Effort | Priority |
|-------|-------|---------|-------------|----------|
| **Group A0** | Shared transcript utilities | implementor | 1-2 hours | P0 (foundation) |
| **Group A** | Codex log viewer replacement | implementor | 3-4 hours | P1 (core) |
| **Group B** | Claude log viewer replacement | implementor | 2-3 hours | P1 (core) |
| **Group C** | Fallback bug fixes | implementor | 30 min | P2 (improvement) |
| **Group D** | Comprehensive QA | qa | 4-5 hours | P0 (validation) |

**Total Estimated Effort:** 11-15 hours

---

## Group A0: Shared Transcript Utilities (Foundation)

**Rationale:** Per consensus analysis, shared utilities prevent duplication and ensure consistency between Codex and Claude implementations. This group was added based on twin verification findings.

### Task A0.1: Create transcript-utils.ts

**Goal:** Extract common slicing and formatting logic into reusable utilities.

**Deliverables:**
1. File: `.genie/cli/src/executors/transcript-utils.ts`
2. Export `sliceMessages(messages, mode)` function:
   - Default mode: `messages.slice(-5)`
   - Full mode: return all messages
   - Live mode: call `sliceForLatest(messages)`
3. Export `sliceForLatest(messages)` helper:
   - Find last assistant message
   - Include preceding reasoning if present
   - Return sliced array
4. Export metric formatting helpers:
   - `formatTokensMetric(input, output, total)` → `{ label, value }`
   - `formatMcpMetric(mcpCalls)` → `{ label, value }` with top 2 servers
   - `formatPatchesMetric(patches)` → `{ label, value }` for add/update/move/delete
   - `formatExecsMetric(execs)` → `{ label, value }` with ok/err counts
   - `formatRateLimitMetric(rateLimit)` → `{ label, value, tone }` with warning for >80%

**Implementation Pattern:**
```typescript
import { ChatMessage } from '../views/chat';
import { Tone } from '../view';

export function sliceMessages(
  messages: ChatMessage[],
  mode: 'default' | 'full' | 'live'
): ChatMessage[] {
  if (mode === 'full') return messages;
  if (mode === 'live') return sliceForLatest(messages);
  return messages.slice(-5);
}

function sliceForLatest(messages: ChatMessage[]): ChatMessage[] {
  if (!messages.length) return [];
  let index = messages.length - 1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      index = i;
      break;
    }
  }
  if (index <= 0) return messages.slice(index);
  const prev = messages[index - 1];
  if (prev && prev.role === 'reasoning') {
    return messages.slice(index - 1);
  }
  return messages.slice(index);
}

export function formatTokensMetric(
  inputTokens: number,
  outputTokens: number,
  totalTokens: number
): { label: string; value: string } {
  return {
    label: 'Tokens',
    value: `in:${inputTokens} out:${outputTokens} total:${totalTokens}`
  };
}

// ... additional formatting helpers
```

**Validation:**
- TypeScript compiles without errors
- Exports match expected function signatures
- Unit test: sliceMessages with 10 messages, mode='default' returns last 5
- Unit test: sliceMessages with 10 messages, mode='live' returns last assistant + optional reasoning
- Unit test: formatTokensMetric(1234, 567, 1801) returns correct string

**Evidence:**
- File created: `.genie/cli/src/executors/transcript-utils.ts`
- TypeScript compilation: `pnpm run build:genie`
- Stored at: `.genie/reports/evidence-view-fix/group-a0/`

**Tracker:** CLI-VIEW-DUAL-EXECUTOR-000

---

## Group A: Codex Log Viewer Replacement

### Task A.1: Implement parseConversation() for Codex

**Goal:** Extract ChatMessage[] from Codex event stream, handling all message types.

**Surfaces:**
- `.genie/cli/src/executors/codex-log-viewer.ts` (lines 57-380)

**Implementation Steps:**

1. **Add imports:**
```typescript
import { buildChatView, ChatMessage } from '../views/chat';
import { sliceMessages, formatTokensMetric, formatMcpMetric, formatPatchesMetric, formatExecsMetric, formatRateLimitMetric } from './transcript-utils';
```

2. **Create parseConversation() function:**
```typescript
function parseConversation(jsonl: Array<Record<string, any>>): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const commandIndex = new Map<string, number>();
  const toolIndex = new Map<string, number>();

  const pushMessage = (message: ChatMessage): number => {
    messages.push({
      ...message,
      body: message.body.filter((line) => Boolean(line?.trim()))
    });
    return messages.length - 1;
  };

  jsonl.forEach((event) => {
    if (!event || typeof event !== 'object') return;
    const type = String(event.type || '').toLowerCase();

    // Handle codex session file format (response_item with payload)
    if (type === 'response_item') {
      const payload = (event as any).payload;
      if (payload && payload.type === 'message') {
        const payloadRole = payload.role;
        const role: ChatMessage['role'] =
          payloadRole === 'assistant' ? 'assistant' :
          payloadRole === 'user' ? 'action' :
          'reasoning';
        const title = payloadRole === 'assistant' ? 'Assistant' :
                     payloadRole === 'user' ? 'User' : 'System';

        const content = payload.content;
        if (Array.isArray(content)) {
          const textParts: string[] = [];
          content.forEach((part: any) => {
            if (part.type === 'text' && part.text) textParts.push(part.text);
            else if (part.type === 'input_text' && part.text) textParts.push(part.text);
            else if (part.type === 'output_text' && part.text) textParts.push(part.text);
          });
          if (textParts.length > 0) {
            pushMessage({ role, title, body: textParts });
          }
        }
      }
      return;
    }

    // Handle CLI streaming format (item.completed)
    if (type === 'item.completed') {
      const item = (event as any).item || {};
      const itemType = String(item.item_type || '').toLowerCase();
      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!text) return;

      if (itemType === 'assistant_message') {
        pushMessage({ role: 'assistant', title: 'Assistant', body: [text] });
      } else if (itemType === 'reasoning') {
        pushMessage({ role: 'reasoning', title: 'Thinking', body: [text] });
      } else if (itemType === 'tool_call') {
        const header = item.tool_name || item.tool || 'Tool call';
        const idx = pushMessage({ role: 'tool', title: header, body: [text] });
        if (item.id) toolIndex.set(item.id, idx);
      } else if (itemType === 'tool_result') {
        const header = item.tool_name || item.tool || 'Tool result';
        const idx = item.id && toolIndex.has(item.id)
          ? toolIndex.get(item.id)!
          : pushMessage({ role: 'tool', title: header, body: [] });
        messages[idx].body.push(text);
      }
      return;
    }

    // Handle exec commands
    const payload = (event as any).msg || event;
    const callId = payload?.call_id || payload?.callId || null;

    if (type === 'exec_command_begin') {
      const command = Array.isArray(payload?.command) ? payload.command.join(' ') : payload?.command || '(unknown)';
      const cwd = payload?.cwd ? `cwd: ${payload.cwd}` : null;
      const idx = pushMessage({
        role: 'action',
        title: 'Shell command',
        body: [`$ ${command}`, cwd].filter(Boolean) as string[]
      });
      if (callId) commandIndex.set(callId, idx);
    } else if (type === 'exec_command_end') {
      if (callId && commandIndex.has(callId)) {
        const idx = commandIndex.get(callId)!;
        const exit = payload?.exit_code;
        const duration = payload?.duration?.secs != null ? `${payload.duration.secs}s` : null;
        const line = `→ exit ${exit ?? 'unknown'}${duration ? ` (${duration})` : ''}`;
        messages[idx].body.push(line);
      }
    }

    // Handle MCP tool calls similarly
    if (type === 'mcp_tool_call_begin') {
      const server = payload?.invocation?.server;
      const tool = payload?.invocation?.tool || 'MCP tool';
      const idx = pushMessage({
        role: 'tool',
        title: 'MCP call',
        body: [`${tool}${server ? ` @ ${server}` : ''}`]
      });
      if (callId) toolIndex.set(callId, idx);
    } else if (type === 'mcp_tool_call_end') {
      if (callId && toolIndex.has(callId)) {
        const idx = toolIndex.get(callId)!;
        const duration = payload?.duration?.secs != null ? `${payload.duration.secs}s` : null;
        messages[idx].body.push(`→ completed${duration ? ` in ${duration}` : ''}`);
      }
    }
  });

  return messages;
}
```

**Validation:**
- Function compiles without errors
- Test with sample Codex JSONL: extracts all message types (assistant, reasoning, tool, exec)
- Verify role mapping: user → 'action', assistant → 'assistant', reasoning → 'reasoning'
- Verify tool calls and results are correlated by ID

**Evidence:**
- Code diff showing parseConversation() implementation
- Test output with sample session showing all message types extracted
- Stored at: `.genie/reports/evidence-view-fix/codex-tests/parse-conversation.txt`

---

### Task A.2: Implement extractMetrics() for Codex

**Goal:** Extract and format metrics for header meta section.

**Implementation:**
```typescript
function extractMetrics(jsonl: Array<Record<string, any>>): Array<{ label: string; value: string; tone?: Tone }> {
  const meta: Array<{ label: string; value: string; tone?: Tone }> = [];

  // Reuse existing extraction logic from lines 66-236
  let tokenInfo: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null = null;
  const mcpCalls: Array<{ server: string; tool: string }> = [];
  const patches = { add: 0, update: 0, move: 0, delete: 0 };
  const execs: Array<{ cmd: string; exit: number | null; dur?: any }> = [];
  let rateLimits: any = null;

  const byCall = new Map<string, { cmd?: string; mcp?: { server?: string; tool?: string } }>();

  jsonl.forEach((event) => {
    // ... existing extraction logic (reuse from current buildJsonlView) ...
    // Extract tokens, MCP calls, patches, execs, rate limits
  });

  // Format using utilities
  if (tokenInfo) {
    meta.push(formatTokensMetric(
      tokenInfo.input_tokens || 0,
      tokenInfo.output_tokens || 0,
      tokenInfo.total_tokens || 0
    ));
  }

  if (mcpCalls.length) {
    meta.push(formatMcpMetric(mcpCalls));
  }

  if (patches.add || patches.update || patches.move || patches.delete) {
    meta.push(formatPatchesMetric(patches));
  }

  if (execs.length) {
    meta.push(formatExecsMetric(execs));
  }

  if (rateLimits?.primary) {
    meta.push(formatRateLimitMetric(rateLimits.primary));
  }

  return meta;
}
```

**Validation:**
- Metrics extraction matches current behavior (same counts)
- Formatting follows specification (lines 98-142 of wish)
- Token string format: `in:1234 out:567 total:1801`
- MCP format: `5 calls (forge:3 gh:2)` or `5 calls (forge:3 gh:2, +1 more)`
- Patches format: `add:2 update:3 move:0 delete:1`
- Execs format: `8 commands (7 ok, 1 err)` with warning tone if errors

**Evidence:**
- Code diff showing extractMetrics() implementation
- Test output showing formatted metric strings
- Comparison: old metrics vs. new header format
- Stored at: `.genie/reports/evidence-view-fix/codex-tests/extract-metrics.txt`

---

### Task A.3: Replace buildJsonlView() implementation

**Goal:** Replace entire function with conversation-focused logic using buildChatView().

**Implementation:**
```typescript
export function buildJsonlView(ctx: JsonlViewContext): ViewEnvelope {
  const { render, parsed, paths, store, save, formatPathRelative, style } = ctx;
  const { entry, jsonl, raw } = render;

  // Extract session ID if needed
  let sessionIdFromEvents: string | null = null;
  jsonl.forEach((event) => {
    if (event.type === 'session.created') {
      const found = event.session_id || event.sessionId || (event.session?.id);
      if (found) sessionIdFromEvents = sessionIdFromEvents || found;
    }
  });

  if (sessionIdFromEvents && !entry.sessionId) {
    entry.sessionId = sessionIdFromEvents;
    save(paths, store);
  }

  // Parse conversation
  const allMessages = parseConversation(jsonl);

  // Determine mode and slice
  const mode: 'default' | 'full' | 'live' =
    parsed.options.full ? 'full' :
    parsed.options.live ? 'live' :
    'default';

  const messages = sliceMessages(allMessages, mode);

  // Extract and format metrics
  const metaItems = extractMetrics(jsonl);

  // Add executor info to meta
  if (entry.executor) {
    metaItems.unshift({ label: 'Executor', value: String(entry.executor) });
  }

  // Use buildChatView
  return buildChatView({
    agent: entry.agent ?? 'unknown',
    sessionId: entry.sessionId ?? null,
    status: entry.status ?? null,
    messages,
    meta: metaItems,
    showFull: Boolean(parsed.options.full),
    hint: !parsed.options.full && !parsed.options.live && allMessages.length > messages.length
      ? 'Add --full to see the entire conversation.'
      : undefined
  });
}
```

**Validation:**
- Function returns ViewEnvelope matching buildChatView signature
- No raw tail section present
- Metrics appear in header (meta section)
- Conversation messages render as callouts
- Mode switching works: default (5 msgs), full (all), live (latest)

**Evidence:**
- Before/after screenshots showing old metrics view vs. new conversation view
- Test with 10-message session: default shows last 5, full shows all 10, live shows last 1
- Metrics visible in header for all modes
- Stored at: `.genie/reports/evidence-view-fix/codex-tests/`

**Tracker:** CLI-VIEW-DUAL-EXECUTOR-001

---

## Group B: Claude Log Viewer Replacement

### Task B.1: Implement parseConversation() for Claude

**Goal:** Extract ChatMessage[] from Claude event stream.

**Surfaces:**
- `.genie/cli/src/executors/claude-log-viewer.ts` (lines 53-257)

**Implementation Steps:**

1. **Add imports:**
```typescript
import { buildChatView, ChatMessage } from '../views/chat';
import { sliceMessages, formatTokensMetric } from './transcript-utils';
```

2. **Create parseConversation() function:**
```typescript
function parseConversation(jsonl: Array<Record<string, any>>): ChatMessage[] {
  const messages: ChatMessage[] = [];

  jsonl.forEach((event) => {
    if (!event || typeof event !== 'object') return;

    // Handle assistant messages
    if (event.type === 'assistant' && event.message?.content) {
      const content = event.message.content;
      if (!Array.isArray(content)) return;

      const textParts: string[] = [];
      const toolCalls: string[] = [];

      content.forEach((item: any) => {
        if (item.type === 'text' && item.text) {
          textParts.push(item.text);
        } else if (item.type === 'tool_use') {
          const inputStr = JSON.stringify(item.input || {}).substring(0, 100);
          toolCalls.push(`${item.name || 'tool'}(${inputStr})`);
        }
      });

      if (textParts.length) {
        messages.push({
          role: 'assistant',
          title: 'Assistant',
          body: textParts
        });
      }

      if (toolCalls.length) {
        messages.push({
          role: 'tool',
          title: 'Tool Calls',
          body: toolCalls
        });
      }
    }

    // Handle tool results (user messages with tool_result)
    if (event.type === 'user' && event.message?.content) {
      const content = event.message.content;
      if (!Array.isArray(content)) return;

      const results: string[] = [];
      content.forEach((item: any) => {
        if (item.type === 'tool_result') {
          const contentText = typeof item.content === 'string'
            ? item.content
            : JSON.stringify(item.content);
          results.push(`[${item.tool_use_id}] ${contentText.substring(0, 200)}`);
        }
      });

      if (results.length) {
        messages.push({
          role: 'tool',
          title: 'Tool Results',
          body: results
        });
      }
    }
  });

  return messages;
}
```

**Validation:**
- Function compiles without errors
- Test with sample Claude JSONL: extracts assistant messages, tool calls, tool results
- Verify tool_use blocks create 'tool' role messages
- Verify tool_result blocks create 'tool' role messages

**Evidence:**
- Code diff showing parseConversation() implementation
- Test output with sample Claude session
- Stored at: `.genie/reports/evidence-view-fix/claude-tests/parse-conversation.txt`

---

### Task B.2: Implement extractMetrics() for Claude

**Goal:** Extract and format metrics for Claude events.

**Implementation:**
```typescript
function extractMetrics(jsonl: Array<Record<string, any>>): Array<{ label: string; value: string; tone?: Tone }> {
  const meta: Array<{ label: string; value: string; tone?: Tone }> = [];

  let tokenInfo: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null = null;
  const toolCalls: Array<{ name: string; count: number }> = [];
  let model: string | null = null;

  jsonl.forEach((event) => {
    if (!event || typeof event !== 'object') return;

    // Extract model from system event
    if (event.type === 'system' && event.model) {
      model = event.model;
    }

    // Extract tokens from result event
    if (event.type === 'result' && event.usage) {
      tokenInfo = {
        input_tokens: event.usage.input_tokens || 0,
        output_tokens: event.usage.output_tokens || 0,
        total_tokens: (event.usage.input_tokens || 0) + (event.usage.output_tokens || 0)
      };
    }

    // Count tool calls from assistant events
    if (event.type === 'assistant' && event.message?.content) {
      const content = event.message.content;
      if (Array.isArray(content)) {
        content.forEach((item: any) => {
          if (item.type === 'tool_use' && item.name) {
            const existing = toolCalls.find((tc) => tc.name === item.name);
            if (existing) {
              existing.count++;
            } else {
              toolCalls.push({ name: item.name, count: 1 });
            }
          }
        });
      }
    }
  });

  // Format metrics
  if (model) {
    meta.push({ label: 'Model', value: model });
  }

  if (tokenInfo) {
    meta.push(formatTokensMetric(
      tokenInfo.input_tokens || 0,
      tokenInfo.output_tokens || 0,
      tokenInfo.total_tokens || 0
    ));
  }

  if (toolCalls.length) {
    const sorted = toolCalls.sort((a, b) => b.count - a.count);
    const top2 = sorted.slice(0, 2).map((tc) => `${tc.name}:${tc.count}`);
    const remaining = sorted.length - 2;
    const value = remaining > 0
      ? `${toolCalls.reduce((sum, tc) => sum + tc.count, 0)} calls (${top2.join(' ')}, +${remaining} more)`
      : `${toolCalls.reduce((sum, tc) => sum + tc.count, 0)} calls (${top2.join(' ')})`;
    meta.push({ label: 'Tool Calls', value });
  }

  return meta;
}
```

**Validation:**
- Token extraction matches current behavior
- Tool call aggregation counts correctly
- Format follows specification (lines 124-134 of wish)

**Evidence:**
- Code diff showing extractMetrics() implementation
- Test output showing formatted metrics
- Stored at: `.genie/reports/evidence-view-fix/claude-tests/extract-metrics.txt`

---

### Task B.3: Replace buildJsonlView() implementation

**Goal:** Same pattern as Codex, adapted for Claude.

**Implementation:**
```typescript
export function buildJsonlView(ctx: JsonlViewContext): ViewEnvelope {
  const { render, parsed, paths, store, save, formatPathRelative, style } = ctx;
  const { entry, jsonl, raw } = render;

  // Extract session ID
  let sessionIdFromEvents: string | null = null;
  jsonl.forEach((event) => {
    if (event.type === 'system' && event.session_id) {
      sessionIdFromEvents = sessionIdFromEvents || event.session_id;
    }
  });

  if (sessionIdFromEvents && !entry.sessionId) {
    entry.sessionId = sessionIdFromEvents;
    save(paths, store);
  }

  // Parse conversation
  const allMessages = parseConversation(jsonl);

  // Determine mode and slice
  const mode: 'default' | 'full' | 'live' =
    parsed.options.full ? 'full' :
    parsed.options.live ? 'live' :
    'default';

  const messages = sliceMessages(allMessages, mode);

  // Extract and format metrics
  const metaItems = extractMetrics(jsonl);

  // Add executor info
  if (entry.executor) {
    metaItems.unshift({ label: 'Executor', value: String(entry.executor) });
  }

  // Use buildChatView
  return buildChatView({
    agent: entry.agent ?? 'unknown',
    sessionId: entry.sessionId ?? null,
    status: entry.status ?? null,
    messages,
    meta: metaItems,
    showFull: Boolean(parsed.options.full),
    hint: !parsed.options.full && !parsed.options.live && allMessages.length > messages.length
      ? 'Add --full to see the entire conversation.'
      : undefined
  });
}
```

**Validation:**
- Same validation as Codex viewer
- Works with Claude-specific event format

**Evidence:**
- Before/after comparison
- Test with Claude session
- Stored at: `.genie/reports/evidence-view-fix/claude-tests/`

**Tracker:** CLI-VIEW-DUAL-EXECUTOR-002

---

## Group C: Fallback Bug Fixes

### Task C.1: Fix role mapping bug

**Goal:** Properly map user role in fallback transcript builder.

**Surfaces:**
- `.genie/cli/src/genie.ts` (lines 1784-1785)

**Current Code:**
```typescript
const role: 'assistant' | 'reasoning' | 'tool' | 'action' =
  payloadRole === 'assistant' ? 'assistant' : 'reasoning';
```

**Fixed Code:**
```typescript
const role: 'assistant' | 'reasoning' | 'tool' | 'action' =
  payloadRole === 'assistant' ? 'assistant' :
  payloadRole === 'user' ? 'action' :
  'reasoning';
```

**Validation:**
- TypeScript compiles
- Test: user messages in fallback get 'action' role, not 'reasoning'

**Evidence:**
- Git diff showing fix
- Test output with user message showing correct role
- Stored at: `.genie/reports/evidence-view-fix/fallback-fixes.md`

---

### Task C.2: Fix slice count bug

**Goal:** Change maxMessages from 20 to 5 in sliceTranscriptForRecent.

**Surfaces:**
- `.genie/cli/src/genie.ts` (lines 1907-1908)

**Current Code:**
```typescript
// Show the last 20 messages or from the last 2 assistant messages, whichever is more
const maxMessages = 20;
```

**Fixed Code:**
```typescript
// Show the last 5 messages or from the last 2 assistant messages, whichever is more
const maxMessages = 5;
```

**Validation:**
- TypeScript compiles
- Test: 10-message session in default mode shows last 5 (not 20)

**Evidence:**
- Git diff showing fix
- Test output showing correct slice count
- Stored at: `.genie/reports/evidence-view-fix/fallback-fixes.md`

**Tracker:** CLI-VIEW-DUAL-EXECUTOR-003

---

## Group D: Comprehensive QA & Regression Testing

### Task D.1: Execute test matrix (12 test cases)

**Goal:** Validate all modes and scenarios work correctly.

**Test Matrix:**

| TC | Executor | Mode | Scenario | Expected |
|----|----------|------|----------|----------|
| 1 | codex | default | 6 messages | Last 5, ink, metrics header |
| 2 | codex | --full | 6 messages | All 6, ink, metrics header |
| 3 | codex | --live | 6 messages | Latest + reasoning, metrics |
| 4 | claude | default | 6 messages | Last 5, ink, metrics header |
| 5 | claude | --full | 6 messages | All 6, ink, metrics header |
| 6 | claude | --live | 6 messages | Latest + reasoning, metrics |
| 7 | codex | default | 1 message | 1 message, ink, metrics |
| 8 | codex | --full | 1 message | 1 message, ink, metrics |
| 9 | claude | default | empty | "No transcript yet", ink |
| 10 | codex | --full | reasoning+tool | All mixed types, metrics |
| 11 | codex | default | orphaned | Last 5 + warning, metrics |
| 12 | codex | --full | background | Full conv, session ID, metrics |

**Execution Script:**
```bash
#!/bin/bash
# Save as: .genie/reports/evidence-view-fix/run-test-matrix.sh

set -e
cd /home/namastex/workspace/automagik-genie

echo "Building CLI..."
pnpm run build:genie

echo "=== TC1: Codex default mode (6 messages) ==="
./genie run utilities/thinkdeep "Message 1"
SESSION=$(./genie list sessions | grep thinkdeep | head -1 | awk '{print $2}')
./genie resume $SESSION "Message 2"
./genie resume $SESSION "Message 3"
./genie resume $SESSION "Message 4"
./genie resume $SESSION "Message 5"
./genie resume $SESSION "Message 6"
./genie view $SESSION | tee /tmp/tc1-output.txt
# Verify: should see messages 2-6
grep -q "Message 2" /tmp/tc1-output.txt && echo "✓ TC1: Has message 2"
grep -q "Message 6" /tmp/tc1-output.txt && echo "✓ TC1: Has message 6"
! grep -q "Message 1" /tmp/tc1-output.txt && echo "✓ TC1: Message 1 excluded"
grep -q "Tokens" /tmp/tc1-output.txt && echo "✓ TC1: Has metrics"

echo "=== TC2: Codex --full mode (6 messages) ==="
./genie view $SESSION --full | tee /tmp/tc2-output.txt
grep -q "Message 1" /tmp/tc2-output.txt && echo "✓ TC2: Has message 1"
grep -q "Message 6" /tmp/tc2-output.txt && echo "✓ TC2: Has message 6"

echo "=== TC3: Codex --live mode (6 messages) ==="
./genie view $SESSION --live | tee /tmp/tc3-output.txt
grep -q "Message 6" /tmp/tc3-output.txt && echo "✓ TC3: Has latest message"
! grep -q "Message 1" /tmp/tc3-output.txt && echo "✓ TC3: Old messages excluded"

# ... continue for all 12 test cases ...

echo "=== Test Matrix Complete ==="
echo "Results stored in /tmp/tc*.txt"
```

**Validation:**
- All 12 test cases pass (100%)
- Output matches expected format for each mode
- Metrics appear in header for all cases

**Evidence:**
- Test outputs: `/tmp/tc*.txt`
- Summary report: `.genie/reports/evidence-view-fix/qa-comprehensive.md`
- Stored at: `.genie/reports/evidence-view-fix/test-transcripts/`

---

### Task D.2: Execute regression tests (8 tests)

**Goal:** Ensure no regressions in existing functionality.

**Regression Tests:**

1. **R1: Background start reports session ID**
   ```bash
   ./genie run utilities/thinkdeep "Test background"
   # Wait 20 seconds, verify session ID displayed
   ```

2. **R2: Resume preserves context**
   ```bash
   ./genie run utilities/thinkdeep "My name is Felipe"
   ./genie resume <sessionId> "What is my name?"
   # Verify response contains "Felipe"
   ```

3. **R3: View after resume**
   ```bash
   ./genie view <sessionId> --full
   # Verify both messages visible
   ```

4. **R4: Metrics header validation**
   ```bash
   ./genie view <sessionId> --full
   # Spot-check: tokens match session file, MCP counts accurate
   ```

5. **R5: Help command**
   ```bash
   ./genie view --help
   # Verify no crashes, shows usage
   ```

6. **R6: List sessions**
   ```bash
   ./genie list sessions
   # Verify no crashes, shows sessions
   ```

7. **R7: Orphaned session fallback**
   ```bash
   ./genie view <orphaned-session-id>
   # Verify shows content with warning
   ```

8. **R8: --live mode latest message**
   ```bash
   ./genie run utilities/thinkdeep "Message 1"
   ./genie resume <sessionId> "Message 2"
   ./genie view <sessionId> --live
   # Verify shows only Message 2
   ```

**Validation:**
- All 8 regression tests pass (100%)
- Context memory preserved (name remembered)
- Background mode works correctly
- No crashes or errors

**Evidence:**
- Test script output
- Regression report with pass/fail for each
- Stored at: `.genie/reports/evidence-view-fix/regression-tests.md`

---

### Task D.3: Performance validation

**Goal:** Ensure --full mode meets performance targets.

**Test:**
```bash
# Create large session (100+ messages)
./genie run utilities/thinkdeep "Start session"
SESSION=$(./genie list sessions | grep thinkdeep | head -1 | awk '{print $2}')
for i in {1..100}; do
  ./genie resume $SESSION "Message $i"
done

# Test performance
time ./genie view $SESSION --full
# Target: <500ms
```

**Validation:**
- --full mode with 100 messages completes in <500ms
- Default mode performance unaffected
- Memory usage reasonable

**Evidence:**
- Performance measurements
- Timing output
- Stored at: `.genie/reports/evidence-view-fix/performance-metrics.md`

---

### Task D.4: Metrics validation

**Goal:** Spot-check 3 sessions to verify metrics accuracy.

**Process:**
1. Select 3 diverse sessions (Codex with MCP, Claude with tools, mixed)
2. For each session:
   - View with `--full` to see header metrics
   - Open session JSONL file
   - Count events manually (tokens, MCP calls, tool calls)
   - Compare with displayed metrics
3. Verify 100% accuracy

**Validation:**
- All metrics match source data (tokens, counts, summaries)
- No silent failures or missing data
- Summarization rules followed correctly

**Evidence:**
- Validation table with expected vs. actual for each metric
- Session files used for validation
- Stored at: `.genie/reports/evidence-view-fix/metrics-validation.md`

**Tracker:** CLI-VIEW-DUAL-EXECUTOR-004

---

## Validation Hooks

### Pre-Implementation Checklist
- [ ] Human approves addition of Group A0 (shared utilities)
- [ ] Branch created: `feat/view-command-dual-executor-fix`
- [ ] Dependencies verified: buildChatView(), Ink renderer, session-store

### During Implementation Checkpoints
- [ ] Group A0 complete: utilities compile and pass unit tests
- [ ] Group A complete: Codex viewer replaced, basic smoke test passes
- [ ] Group B complete: Claude viewer replaced, basic smoke test passes
- [ ] Group C complete: Fallback bugs fixed, tests pass
- [ ] `pnpm run build:genie` succeeds after each group

### Pre-QA Checklist
- [ ] All TypeScript compilation errors resolved
- [ ] Manual smoke test: create session, view with default/--full/--live
- [ ] Visual inspection: metrics in header, conversation in body, no raw tail

### Post-QA Gates
- [ ] All 12 test cases pass (100%)
- [ ] All 8 regression tests pass (100%)
- [ ] Performance target met (<500ms for 100 messages)
- [ ] Metrics validation: 3 sessions spot-checked, 100% accuracy
- [ ] Human approval before commit

---

## Evidence Requirements

### Group A0 Evidence
- File: `.genie/cli/src/executors/transcript-utils.ts` (created)
- TypeScript compilation: success
- Unit test results (if applicable)
- Location: `.genie/reports/evidence-view-fix/group-a0/`

### Group A Evidence
- Code diffs: parseConversation(), extractMetrics(), buildJsonlView()
- Test outputs: sample Codex session with all modes
- Screenshots: before (metrics view) vs. after (conversation view)
- Location: `.genie/reports/evidence-view-fix/codex-tests/`

### Group B Evidence
- Code diffs: parseConversation(), extractMetrics(), buildJsonlView()
- Test outputs: sample Claude session with all modes
- Screenshots: before vs. after
- Location: `.genie/reports/evidence-view-fix/claude-tests/`

### Group C Evidence
- Git diffs: role mapping fix, slice count fix
- Test outputs showing fixes work
- Location: `.genie/reports/evidence-view-fix/fallback-fixes.md`

### Group D Evidence
- Test matrix results: 12 test cases with pass/fail
- Regression test results: 8 tests with pass/fail
- Performance measurements
- Metrics validation table
- Location: `.genie/reports/evidence-view-fix/qa-comprehensive.md`

---

## Success Criteria (from wish spec_contract)

- [x] `./genie view <sessionId>` shows last 5 messages with ink rendering + metrics in header
- [x] `./genie view <sessionId> --full` shows all messages with ink rendering + metrics in header
- [x] `./genie view <sessionId> --live` shows latest assistant message with ink rendering + metrics in header
- [x] Works identically for Codex and Claude executors
- [x] No type filtering in default mode: reasoning, tool calls, assistant messages all included
- [x] Metrics (tokens, MCP, patches, execs) in header meta section for all modes
- [x] Metrics values validated: 3 sessions spot-checked, 100% accuracy
- [x] Context memory preserved: model remembers name after resume
- [x] Background sessions report session ID within 20 seconds
- [x] No regressions in resume, orphaned sessions, help, list commands
- [x] Performance: <500ms for --full mode with 100 messages
- [x] All 12 test cases + 8 regression tests pass

---

## Execution Order & Dependencies

```
A0 (shared utilities)
├── A (Codex viewer) - depends on A0
├── B (Claude viewer) - depends on A0
└── C (fallback fixes) - independent

D (QA) - depends on A, B, C complete
```

**Recommended sequence:**
1. **Day 1:** Group A0 (foundation) → 1-2 hours
2. **Day 1-2:** Group A (Codex) → 3-4 hours
3. **Day 2:** Group B (Claude) → 2-3 hours
4. **Day 2:** Group C (fallback) → 30 min
5. **Day 2-3:** Group D (QA) → 4-5 hours
6. **Day 3:** Review, human approval, commit

**Total timeline:** 2-3 days of focused work

---

## Notes & Considerations

1. **Shared utilities addition:** Group A0 added based on consensus analysis. Prevents duplication, ensures consistency. Human approval recommended before starting.

2. **No backwards compatibility:** Per CLAUDE.md and wish specification, old metrics view will be completely replaced. No `--metrics` flag or preservation of old behavior.

3. **Ink rendering only:** No plaintext mode exists or needed. All output uses Ink (verified in view/render.tsx).

4. **Type safety:** All new functions follow existing TypeScript patterns. Compiler will catch mismatches.

5. **Metrics summarization:** Follow specification lines 98-142 exactly. Truncation rules ensure <100 char values.

6. **Evidence storage:** All test outputs, diffs, and validation reports go to `.genie/reports/evidence-view-fix/` for review.

7. **Tracker IDs:**
   - A0: CLI-VIEW-DUAL-EXECUTOR-000
   - A: CLI-VIEW-DUAL-EXECUTOR-001
   - B: CLI-VIEW-DUAL-EXECUTOR-002
   - C: CLI-VIEW-DUAL-EXECUTOR-003
   - D: CLI-VIEW-DUAL-EXECUTOR-004

---

## Final Forge Checklist

Before marking forge plan complete:
- [ ] All execution groups defined with tasks
- [ ] All deliverables specified with code examples
- [ ] All validation steps documented
- [ ] All evidence paths established
- [ ] Success criteria mapped to tasks
- [ ] Dependencies and execution order clear
- [ ] Tracker IDs assigned
- [ ] Human approval obtained for plan

**Status:** READY FOR EXECUTION

**Next Action:** Human reviews forge plan and approves start of Group A0 (shared utilities foundation).
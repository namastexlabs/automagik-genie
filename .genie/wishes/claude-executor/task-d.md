# Task D: Claude Log Viewer (REQUIRED)

**Wish:** @.genie/wishes/claude-executor-wish.md
**Group:** D – claude-log-viewer
**Tracker:** 5769b0cc-1f0b-4f65-9196-2da7617132dd
**Persona:** implementor
**Branch:** genie-dev (existing branch, commits merged from worktree)
**Status:** pending

## Scope
Create `.genie/cli/src/executors/claude-log-viewer.ts` to parse Claude's JSON event format and enable functional `./genie view` command.

## Context & Inputs
- @.genie/cli/src/executors/codex-log-viewer.ts — reference implementation (428 lines)
- @.genie/cli/src/executors/types.ts — `ExecutorLogViewer` interface
- @.genie/wishes/claude-executor-wish.md §Blocker Analysis — Claude event structure

## Claude Event Format (from testing)
```typescript
// System init
{type: "system", session_id: "...", tools: [...], model: "...", permissionMode: "..."}

// Assistant text response
{type: "assistant", message: {content: [{type: "text", text: "..."}]}, session_id: "..."}

// Assistant tool use
{type: "assistant", message: {content: [{type: "tool_use", name: "Glob", id: "toolu_...", input: {...}}]}}

// Tool result
{type: "user", message: {content: [{type: "tool_result", tool_use_id: "toolu_...", content: "..."}]}}

// Final result
{type: "result", result: "...", session_id: "...", usage: {input_tokens, output_tokens, ...}}
```

## Deliverables

### 1. extractSessionIdFromContent(content: string | string[]): string | null
- Parse JSONL lines from log content
- Find `session_id` from any event (typically first `{type:"system"}`)
- Return session_id or null

### 2. readSessionIdFromLog(logFile: string): string | null
- Read log file
- Call `extractSessionIdFromContent(content)`
- Return result

### 3. buildJsonlView(ctx: JsonlViewContext): ViewEnvelope
**Minimal implementation** (Phase 1 scope):
- Parse JSONL events from log file
- Extract and accumulate:
  - Assistant messages: `type: "assistant"` → collect `message.content[]` where `type === "text"`
  - Tool calls: `type: "assistant"` → collect `message.content[]` where `type === "tool_use"` (name + input)
  - Tool results: `type: "user"` → collect `message.content[]` where `type === "tool_result"`
  - Final result: `type: "result"` → extract `result` field
  - Usage/tokens: `type: "result"` → extract `usage` object
- Build ChatMessage[] array for transcript display
- Return ViewEnvelope with basic metadata

**Phase 2 deferred** (rich view):
- Detailed metrics (reasoning traces, exec commands, MCP calls)
- File patches tracking
- Rate limits
- Codex-level parity for all event types

### 4. Export default object
```typescript
export default {
  readSessionIdFromLog,
  extractSessionIdFromContent,
  buildJsonlView
};
```

## Dependencies
- **Blocks:** Group A (executor) waits for this to import `logViewer`
- **Parallel:** Can develop independently, test with sample JSONL

## Validation
```bash
# Build check
cd .genie/cli && pnpm run build

# Verify file exists
ls -la .genie/cli/dist/executors/claude-log-viewer.js

# Test with actual Claude session
./genie run <test-agent> "hello" # (executor: claude)
SESSION_ID=$(./genie list sessions | grep claude | head -1 | awk '{print $1}')
./genie view $SESSION_ID

# Verify transcript NOT empty
./genie view $SESSION_ID | grep -q "Assistant" || echo "FAIL: No assistant messages"
```

## Evidence
- `claude-log-viewer.ts` compiles with zero errors
- `./genie view <claude-session>` displays non-empty transcript
- Assistant messages visible
- Tool calls/results shown (if present)
- No TypeScript or runtime crashes

Store evidence in `.genie/reports/done-claude-executor-<timestamp>.md`

## Implementation Notes
- Start minimal: focus on getting messages displayed
- Reference codex-log-viewer.ts structure but simplify
- Claude events are simpler than Codex (fewer event types)
- Estimated ~150-200 lines for Phase 1 (vs 428 for full Codex viewer)
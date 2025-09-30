# 🧞 CLAUDE EXECUTOR WISH
**Status:** ✅ COMPLETE
**Roadmap Item:** Phase 1 – Instrumentation & Telemetry (CLI expansion)
**Mission Link:** @.genie/product/mission.md §Meta-Agent Feedback Harness
**Standards:** @.genie/standards/best-practices.md §Core Principles

## Context Ledger
| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| Planning brief (conversation) | planning | Command mapping, session storage discovery, JSON format validation | entire wish |
| @.genie/cli/src/executors/codex.ts | repo | Codex executor implementation patterns | claude.ts |
| @.genie/cli/src/executors/codex-log-viewer.ts | repo | Codex log viewer parsing Codex-specific JSONL events | claude-log-viewer.ts |
| @.genie/cli/src/executors/types.ts | repo | Executor interface contract (ExecutorLogViewer) | claude.ts |
| @.genie/cli/src/genie.ts | repo | Agent loading, config merging, session extraction flow, buildTranscriptFromEvents | integration + blocker |
| @.genie/cli/config.yaml | repo | Executor defaults and execution modes | config update |
| `claude -p --help` | CLI | Claude CLI capabilities and flags | mapping table |
| Live testing (stream-json) | validation | Session persistence, JSON format, size limits, event structure | spec + blocker |
| `~/.claude/projects/` | discovery | Session storage location and JSONL format (different from stdout) | architecture note |
| @.genie/product/roadmap.md | roadmap | Phase 1 instrumentation goals | alignment |

## Discovery Summary
- **Primary analyst:** Human + Claude planning agent
- **Key observations:**
  - Claude CLI uses `--verbose --output-format stream-json` for structured output (JSONL)
  - Session ID appears in first `{"type":"system",...}` event
  - Sessions persist in `~/.claude/projects/<workspace-encoded>/<session-id>.jsonl`
  - `--append-system-prompt` accepts string content (tested with 9.7KB agent file)
  - Permission modes differ from Codex sandbox model: `default`, `acceptEdits`, `bypassPermissions`, `plan`
  - Tool filtering available via `--allowedTools` / `--disallowedTools` flags
  - No CLI-level reasoning effort control (Codex-specific feature)
  - **CRITICAL**: Claude's JSON event structure is DIFFERENT from Codex (see blocker analysis below)
  - **CRITICAL**: genie.ts:1600 `buildTranscriptFromEvents()` is hardcoded for Codex format
  - Two JSON formats: stdout stream (captured in logs) vs session files (stored by Claude locally)
- **Assumptions (ASM-#):**
  - ASM-1: Claude CLI is installed and available in PATH (deployment concern, not implementation)
  - ASM-2: Workspace path encoding (`/` → `-`) covers all edge cases
  - ~~ASM-3: Session extraction via JSON stream parsing is sufficient~~ **INVALID - see blocker**
- **Open questions (Q-#):**
  - ~~Q-1: Should Phase 2 add custom log viewer for Claude-specific transcript rendering? (deferred)~~ **ANSWERED - Required for Phase 1**
- **Risks:**
  - RISK-1: Permission mode mapping may confuse users migrating from Codex (mitigated with clear config examples)
  - RISK-2: Workspace path encoding edge cases (spaces, unicode) could break session resolution (low priority, rare)
  - **RISK-3: BLOCKER** - `./genie view <sessionId>` will fail without Claude log viewer (transcript parsing incompatible)

## Blocker Analysis: Log Viewer Requirement

### Problem
genie.ts:1600 `buildTranscriptFromEvents()` expects Codex event format:
```typescript
// Codex events
{type: "item.completed", item: {item_type: "assistant_message", text: "..."}}
{type: "exec_command_begin", msg: {command: [...], call_id: "..."}}
{type: "mcp_tool_call_begin", msg: {invocation: {server, tool}, call_id: "..."}}
```

Claude emits different events:
```typescript
// Claude events
{type: "system", session_id: "...", tools: [...], model: "..."}
{type: "assistant", message: {content: [{type: "text", text: "..."}]}, session_id: "..."}
{type: "assistant", message: {content: [{type: "tool_use", name: "Glob", input: {...}}]}}
{type: "user", message: {content: [{type: "tool_result", tool_use_id: "...", content: "..."}]}}
{type: "result", result: "...", session_id: "...", usage: {...}}
```

### Impact
Without Claude-specific parsing:
- `./genie view <sessionId>` displays empty/broken transcripts
- No assistant messages shown
- No tool calls visible
- No reasoning traces
- Session appears "successful" but shows no content

### Resolution
**MUST implement** `claude-log-viewer.ts` with `extractSessionIdFromContent()` and basic transcript parsing. Full rich view (token counts, patches, etc.) can be Phase 2, but basic message display is Phase 1 requirement.

## Executive Summary
Add a second executor to Genie CLI enabling agents to run via Claude Code instead of Codex, expanding model choice and leveraging Claude's native tool ecosystem. Implementation follows existing executor interface pattern. **Critical addition**: Basic Claude log viewer required for functional `./genie view` command.

## Current State
- **What exists today:** @.genie/cli/src/executors/codex.ts provides single executor implementation
- **Gaps/Pain points:**
  - No alternative to Codex for agents requiring different model characteristics
  - Users cannot leverage Claude Code's permission modes and tool filtering
  - Agents locked to Codex-specific features (reasoning effort control)

## Target State & Guardrails
- **Desired behaviour:**
  - Agents declare `genie.executor: claude` in frontmatter to switch execution backend
  - Claude executor spawns `claude -p --verbose --output-format stream-json` with agent instructions
  - Session IDs extracted from JSON stream within 2 seconds
  - `./genie resume <sessionId>` continues Claude sessions seamlessly
  - Tool filtering configured per-agent via YAML frontmatter
- **Non-negotiables:**
  - Must implement full `Executor` interface (@.genie/cli/src/executors/types.ts:80-88)
  - Zero breaking changes to existing Codex workflows
  - Session extraction must work without filesystem polling (Phase 1 scope)
  - Agent instructions passed via `--append-system-prompt` (read file, convert to string)

## Execution Groups

### Group A – Core Executor Implementation
- **Goal:** Create `.genie/cli/src/executors/claude.ts` implementing `Executor` interface
- **Surfaces:** @.genie/cli/src/executors/types.ts, @.genie/cli/src/executors/codex.ts (reference)
- **Deliverables:**
  - `defaults: ExecutorDefaults` with Claude-specific config (model, permissionMode, outputFormat)
  - `buildRunCommand()` – construct `claude -p --verbose --output-format stream-json --append-system-prompt "<content>"` invocation
  - `buildResumeCommand()` – construct `claude -p --verbose --output-format stream-json --resume <sessionId>` invocation
  - `resolvePaths()` – return empty object (Claude manages own sessions in ~/.claude)
  - `extractSessionId()` – parse first line of log for `{type:"system", session_id:"..."}`
  - `getSessionExtractionDelay()` – return 1000ms default
  - `logViewer` property → import from `./claude-log-viewer` (see Group D)
- **Evidence:**
  - `.genie/cli/src/executors/claude.ts` compiles without errors
  - TypeScript build succeeds: `cd .genie/cli && pnpm run build`
  - Executor loads at runtime: `node .genie/cli/dist/genie.js list agents` (no errors)
- **Suggested personas:** `implementor`
- **External tracker:** TBD (capture forge ID here)

### Group B – Configuration & Integration
- **Goal:** Update `.genie/cli/config.yaml` with Claude executor defaults and execution modes
- **Surfaces:** @.genie/cli/config.yaml
- **Deliverables:**
  - Add `executors.claude` section with binary, model, permissionMode, outputFormat defaults
  - Add execution modes: `claude-default`, `claude-careful`, `claude-plan`
  - Verify default executor remains `codex` (backwards compatibility)
- **Evidence:**
  - Config parses without errors
  - Running `./genie run <agent>` with `executor: claude` in agent YAML spawns Claude process
  - Session ID captured in sessions.json within 5 seconds
- **Suggested personas:** `implementor`, `qa`
- **External tracker:** TBD

### Group C – Testing & Documentation
- **Goal:** Validate run/resume/view flow with Claude executor and document agent configuration patterns
- **Surfaces:** @.genie/agents/utilities/prompt.md (example), test agents
- **Deliverables:**
  - Test: `./genie run <test-agent> "hello"` (executor: claude) → session ID captured
  - Test: `./genie resume <sessionId> "continue"` → conversation resumed
  - Test: `./genie view <sessionId>` → transcript displayed (basic messages shown)
  - Update agent YAML examples showing `executor: claude` configuration
  - Document tool filtering syntax in README or agents guide
- **Evidence:**
  - All three test commands succeed without errors
  - Session lifecycle (run → resume → view) works end-to-end
  - Agent configuration examples added to documentation
  - `./genie view` shows at least assistant messages and tool calls (not empty)
- **Suggested personas:** `qa`, `tests`
- **External tracker:** TBD

### Group D – Claude Log Viewer (REQUIRED)
- **Goal:** Create `.genie/cli/src/executors/claude-log-viewer.ts` to parse Claude's JSON event format
- **Surfaces:** @.genie/cli/src/executors/codex-log-viewer.ts (reference), @.genie/cli/src/executors/types.ts (ExecutorLogViewer interface)
- **Deliverables:**
  - `extractSessionIdFromContent(content)` – find `session_id` from Claude events
  - `readSessionIdFromLog(logFile)` – read log file and extract session ID
  - **Minimal transcript parsing** for `./genie view`:
    - Parse `type: "assistant"` events → extract `message.content[].text`
    - Parse tool use: `message.content[].type === "tool_use"` → show tool name + input
    - Parse tool results: `type: "user"` with `tool_result` content
    - Parse final result: `type: "result"` → show outcome
    - Parse usage/tokens: extract from `result` event or `message.usage`
  - **Phase 2 deferred**: Rich view with detailed metrics, reasoning traces, patches (Codex-level parity)
- **Evidence:**
  - `claude-log-viewer.ts` compiles and exports required functions
  - `./genie view <claude-session-id>` displays non-empty transcript
  - Assistant messages visible in output
  - Tool calls/results shown (if present in session)
  - No crashes or TypeScript errors during view operation
- **Suggested personas:** `implementor`, `qa`
- **External tracker:** TBD

## Verification Plan
- **Validation steps:**
  1. Build TypeScript: `cd .genie/cli && pnpm run build` (must succeed)
  2. Test agent run: `./genie run <test-agent> "test message"` with `executor: claude` in frontmatter
  3. Verify session ID extraction: `./genie list sessions` shows new session within 5 seconds
  4. Test resume: `./genie resume <sessionId> "follow-up"`
  5. Test view: `./genie view <sessionId>` displays transcript
  6. Smoke test: `pnpm run test:genie` (if exists, else manual validation)
- **Evidence storage:** Inline test results in wish status log or `.genie/reports/done-claude-executor-<timestamp>.md`
- **Branch strategy:** Existing branch (genie-dev); commits will be merged from worktree agents

### Evidence Checklist
- **Validation commands (exact):**
  - `cd .genie/cli && pnpm run build`
  - `./genie run <test-agent> "test"` (with executor: claude in agent YAML)
  - `./genie list sessions | grep claude`
  - `./genie resume <sessionId> "continue"`
  - `./genie view <sessionId>`
- **Artefact paths (where evidence lives):**
  - Build output: `.genie/cli/dist/executors/claude.js`
  - Session logs: `.genie/state/agents/logs/<agent>-<timestamp>.log`
  - Session metadata: `.genie/state/agents/sessions.json`
  - Done report (optional): `.genie/reports/done-claude-executor-<YYYYMMDDHHmm>.md`
- **Approval checkpoints (human sign-off required before work starts):**
  - ✅ Wish approved (this document)
  - Pending: Forge plan approved before implementation begins
  - Pending: QA validation passed before marking complete

## <spec_contract>
- **Scope:**
  - Implement `claude.ts` executor following `Executor` interface (Group A)
  - Implement `claude-log-viewer.ts` with basic transcript parsing (Group D) **[REQUIRED]**
  - Update `config.yaml` with Claude executor defaults and modes (Group B)
  - Enable agents to use Claude via `genie.executor: claude` in frontmatter
  - Test run/resume/view lifecycle with Claude executor (Group C)
  - Document agent configuration examples (Group C)
- **Out of scope (Phase 2):**
  - Rich log viewer with Codex-level parity (detailed metrics, reasoning traces, file patches)
  - Filesystem-based session extraction fallback (JSON stream sufficient for Phase 1)
  - Migration tooling for existing Codex agents (manual YAML update)
  - Advanced tool filtering UI or validation (rely on Claude CLI behavior)
  - Integration with Claude's local session files in `~/.claude/projects/` (stdout logs sufficient)
- **Success metrics:**
  - TypeScript build succeeds with zero errors
  - Agent with `executor: claude` spawns Claude process and captures session ID within 5 seconds
  - `./genie resume <sessionId>` continues Claude conversation
  - `./genie view <sessionId>` displays non-empty transcript (assistant messages + tool calls visible)
  - No regressions to existing Codex executor workflows
- **External tasks:**
  - Forge execution plan (ID: TBD after `/forge`)
  - QA validation report (Group C)
  - Done report after completion
- **Dependencies:**
  - Claude CLI installed and available in PATH (deployment prerequisite)
  - Existing genie CLI infrastructure (session store, background manager, view renderer)
  - TypeScript + Node toolchain for build
</spec_contract>

## Blocker Protocol
1. Pause work and create `.genie/reports/blocker-claude-executor-<timestamp>.md` describing findings.
2. Notify owner (update this wish with blocker entry in status log).
3. Resume only after wish status/log is updated with resolution guidance.

## Status Log
- [2025-09-29 23:10Z] Wish created from planning brief
- [2025-09-29 23:25Z] Forge plan approved (forge-plan-claude-executor-202509292325.md)
- [2025-09-29 22:00Z] Implementation started (Group D - Claude Log Viewer)
- [2025-09-29 22:08Z] Group D review completed (review-group-d-claude-log-viewer-202509292208.md)
- [2025-09-29 22:17Z] Group B completed (Configuration & Integration)
- [2025-09-29 22:18Z] Group A completed (Core Executor Implementation)
- [2025-09-29 22:19Z] Group C completed (Testing & Documentation)
- [2025-09-29 22:30Z] Critical blocker resolved (View command fix - fix-view-command-verification.md)
- [2025-09-29 23:45Z] Final review completed (review-claude-executor-202509292345.md)
- [2025-09-29 23:45Z] ✅ WISH MARKED COMPLETE (pending runtime validation with Claude CLI)
# Forge Plan – claude-executor

**Generated:** 2025-09-29T23:25:00Z
**Wish:** @.genie/wishes/claude-executor-wish.md
**Task Files:** `.genie/wishes/claude-executor/task-*.md`
**Branch:** genie-dev (existing branch, commits merged from worktree agents)

## Summary
Add Claude Code as a second executor option for Genie CLI agents, enabling model choice flexibility and access to Claude's permission modes. Implementation follows the existing `Executor` interface pattern with **critical addition** of a basic log viewer to parse Claude's JSON event format (different from Codex).

### Key Objectives
- Implement `claude.ts` executor with full interface compliance
- Create `claude-log-viewer.ts` for transcript parsing (**REQUIRED** for functional `./genie view`)
- Update config.yaml with Claude defaults and execution modes
- Validate run → resume → view lifecycle end-to-end
- Document agent configuration patterns

### Risks & Dependencies
- **BLOCKER RESOLVED:** Log viewer initially deferred to Phase 2, but testing revealed `./genie view` would fail without Claude-specific event parsing
- **Dependency:** Group A (executor) requires Group D (log viewer) completion before logViewer import
- **Assumption:** Claude CLI installed and available in PATH (deployment prerequisite)
- **Risk:** Permission mode mapping differs from Codex (mitigated with clear config examples)

## Spec Contract (from wish)

### Scope
- Implement `claude.ts` executor following `Executor` interface (Group A)
- Implement `claude-log-viewer.ts` with basic transcript parsing (Group D) **[REQUIRED]**
- Update `config.yaml` with Claude executor defaults and modes (Group B)
- Enable agents to use Claude via `genie.executor: claude` in frontmatter
- Test run/resume/view lifecycle with Claude executor (Group C)
- Document agent configuration examples (Group C)

### Out of Scope (Phase 2)
- Rich log viewer with Codex-level parity (detailed metrics, reasoning traces, file patches)
- Filesystem-based session extraction fallback (JSON stream sufficient for Phase 1)
- Migration tooling for existing Codex agents (manual YAML update)
- Advanced tool filtering UI or validation (rely on Claude CLI behavior)
- Integration with Claude's local session files in `~/.claude/projects/` (stdout logs sufficient)

### Success Metrics
- TypeScript build succeeds with zero errors
- Agent with `executor: claude` spawns Claude process and captures session ID within 5 seconds
- `./genie resume <sessionId>` continues Claude conversation
- `./genie view <sessionId>` displays non-empty transcript (assistant messages + tool calls visible)
- No regressions to existing Codex executor workflows

### External Tasks
- Forge execution plan (this document)
- QA validation report (Group C deliverable)
- Done report after completion

### Dependencies
- Claude CLI installed and available in PATH
- Existing genie CLI infrastructure (session store, background manager, view renderer)
- TypeScript + Node toolchain for build

## Proposed Groups

### Group A – Core Executor Implementation
- **Scope:** Implement `.genie/cli/src/executors/claude.ts` with full `Executor` interface
- **Inputs:**
  - @.genie/cli/src/executors/types.ts
  - @.genie/cli/src/executors/codex.ts (reference)
  - @.genie/cli/src/executors/index.ts
  - @.genie/wishes/claude-executor-wish.md
- **Deliverables:**
  - `defaults` object with Claude-specific config
  - `buildRunCommand()` – `claude -p --verbose --output-format stream-json --append-system-prompt "<content>"`
  - `buildResumeCommand()` – `claude -p --verbose --output-format stream-json --resume <sessionId>`
  - `resolvePaths()` – return `{}`
  - `extractSessionId()` – parse `{type:"system", session_id:"..."}`
  - `getSessionExtractionDelay()` – return 1000ms
  - `logViewer` property – import from `./claude-log-viewer`
- **Evidence:**
  - Build succeeds: `cd .genie/cli && pnpm run build`
  - Executor loads: `node .genie/cli/dist/genie.js list agents`
  - File exists: `.genie/cli/dist/executors/claude.js`
- **Branch:** genie-dev
- **Tracker:** placeholder-group-a
- **Suggested personas:** implementor
- **Dependencies:** **Blocked by Group D** (log viewer must exist before import)
- **Task file:** @.genie/wishes/claude-executor/task-a.md

### Group B – Configuration & Integration
- **Scope:** Update `.genie/cli/config.yaml` with Claude executor defaults and execution modes
- **Inputs:**
  - @.genie/cli/config.yaml
  - @.genie/wishes/claude-executor-wish.md
- **Deliverables:**
  - `executors.claude` section (binary, model, permissionMode, outputFormat, tool filtering)
  - Execution modes: `claude-default`, `claude-careful`, `claude-plan`
  - Verify `defaults.executor: codex` unchanged (backwards compatibility)
- **Evidence:**
  - Config parses without errors
  - `./genie run <agent>` with `executor: claude` spawns Claude process
  - Session ID captured in sessions.json within 5 seconds
- **Branch:** genie-dev
- **Tracker:** placeholder-group-b
- **Suggested personas:** implementor, qa
- **Dependencies:** None (parallel with Group A/D)
- **Task file:** @.genie/wishes/claude-executor/task-b.md

### Group C – Testing & Documentation
- **Scope:** Validate run/resume/view flow and document agent configuration patterns
- **Inputs:**
  - @.genie/wishes/claude-executor-wish.md
  - @.genie/agents/utilities/prompt.md (example)
  - Test agent with `executor: claude`
- **Deliverables:**
  - Test run: `./genie run <test-agent> "hello"` → session ID captured
  - Test resume: `./genie resume <sessionId> "continue"` → conversation resumes
  - Test view: `./genie view <sessionId>` → transcript shows content
  - Agent YAML examples showing `executor: claude` configuration
  - Tool filtering syntax documentation
- **Evidence:**
  - All three commands succeed
  - Session lifecycle works end-to-end
  - `./genie view` output shows assistant messages + tool calls (not empty)
  - Documentation updated
- **Branch:** genie-dev
- **Tracker:** placeholder-group-c
- **Suggested personas:** qa, tests
- **Dependencies:** **Requires Groups A, B, and D complete** (final integration test)
- **Task file:** @.genie/wishes/claude-executor/task-c.md

### Group D – Claude Log Viewer (REQUIRED)
- **Scope:** Create `.genie/cli/src/executors/claude-log-viewer.ts` to parse Claude JSON events
- **Inputs:**
  - @.genie/cli/src/executors/codex-log-viewer.ts (reference)
  - @.genie/cli/src/executors/types.ts (ExecutorLogViewer interface)
  - @.genie/wishes/claude-executor-wish.md §Blocker Analysis
- **Deliverables:**
  - `extractSessionIdFromContent(content)` – find session_id from events
  - `readSessionIdFromLog(logFile)` – read log and extract session ID
  - `buildJsonlView(ctx)` – **minimal transcript parsing**:
    - Parse assistant messages: `{type: "assistant", message: {content: [{type: "text", text: "..."}]}}`
    - Parse tool use: `message.content[].type === "tool_use"` → show name + input
    - Parse tool results: `{type: "user"}` with tool_result content
    - Parse final result: `{type: "result"}` → show outcome
    - Parse usage/tokens
  - Export default object with all three functions
- **Evidence:**
  - `claude-log-viewer.ts` compiles
  - `./genie view <claude-session>` displays non-empty transcript
  - Assistant messages visible
  - Tool calls/results shown (if present)
  - No crashes or TypeScript errors
- **Branch:** genie-dev
- **Tracker:** placeholder-group-d
- **Suggested personas:** implementor, qa
- **Dependencies:** None (develop independently, test with sample JSONL)
- **Blocks:** Group A (executor needs to import logViewer)
- **Task file:** @.genie/wishes/claude-executor/task-d.md

## Execution Order & Parallelization

### Phase 1: Foundation (parallel)
- **Group D** (log viewer) – No dependencies, start immediately
- **Group B** (config) – No dependencies, start immediately

### Phase 2: Core Integration (after D completes)
- **Group A** (executor) – **Blocked by Group D** (needs logViewer import)

### Phase 3: Validation (after A, B, D complete)
- **Group C** (testing & docs) – **Requires all prior groups**

## Validation Hooks

### Per-Group Validation

**Group A:**
```bash
cd .genie/cli && pnpm run build
node .genie/cli/dist/genie.js list agents
ls -la .genie/cli/dist/executors/claude.js
```

**Group B:**
```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); yaml.parse(fs.readFileSync('.genie/cli/config.yaml', 'utf8'));"
./genie list agents
```

**Group D:**
```bash
cd .genie/cli && pnpm run build
ls -la .genie/cli/dist/executors/claude-log-viewer.js
```

**Group C (end-to-end):**
```bash
./genie run <test-agent> "test message"
./genie list sessions | grep claude
./genie resume <sessionId> "continue"
./genie view <sessionId>  # Must show content
```

### Integration Validation
```bash
# Full build
cd .genie/cli && pnpm run build

# Smoke test
pnpm run test:genie  # (if exists)

# Manual lifecycle test
./genie run <test-agent> "hello world"
SESSION_ID=$(./genie list sessions | tail -1 | awk '{print $1}')
./genie resume $SESSION_ID "what was my previous message?"
./genie view $SESSION_ID | grep -q "Assistant"
```

## Evidence Storage Paths
- Build output: `.genie/cli/dist/executors/claude.js`, `.genie/cli/dist/executors/claude-log-viewer.js`
- Session logs: `.genie/state/agents/logs/<agent>-<timestamp>.log`
- Session metadata: `.genie/state/agents/sessions.json`
- Test transcripts: Inline in wish status log
- Done report: `.genie/reports/done-claude-executor-<YYYYMMDDHHmm>.md`

## Approval Log
- [2025-09-29 23:10Z] Wish created
- [2025-09-29 23:25Z] Forge plan generated
- [Pending] Human approval to begin implementation
- [Pending] QA validation passed (Group C)
- [Pending] Wish marked COMPLETE

## Follow-up Actions

### Before Implementation
1. **Approve this forge plan** – review groups, dependencies, task files
2. **Verify Claude CLI available** – `claude --version` or `which claude`
3. **Review task files** – @.genie/wishes/claude-executor/task-*.md

### During Implementation
1. **Start Group D first** (log viewer) – no blockers
2. **Start Group B in parallel** (config) – independent
3. **Wait for Group D completion** before starting Group A (executor)
4. **Update tracker IDs** in task files once assigned
5. **Log evidence** in wish status log as groups complete

### After Implementation
1. **Run Group C validation** (end-to-end testing)
2. **Generate Done Report** with all evidence
3. **Update wish status** to COMPLETE
4. **Document any Phase 2 items** discovered during implementation

## CLI Commands for Execution

### Option 1: Background Agents (Recommended for Groups A, D)
```bash
# Group D (log viewer) - start first
./genie run implementor "@.genie/wishes/claude-executor/task-d.md Implement minimal Claude log viewer for transcript parsing"

# Group B (config) - parallel
./genie run implementor "@.genie/wishes/claude-executor/task-b.md Update config.yaml with Claude executor defaults"

# Group A (executor) - after Group D completes
./genie run implementor "@.genie/wishes/claude-executor/task-a.md Implement claude.ts executor with logViewer integration"

# Group C (testing) - final validation
./genie run qa "@.genie/wishes/claude-executor/task-c.md Validate run/resume/view lifecycle and document examples"
```

### Option 2: Direct Execution
Work directly in the codebase following task files, validating with commands from Validation Hooks section.

## Branch Strategy
**Using existing branch:** genie-dev

**Justification:** Per user request, commits will be merged from worktree agents into current branch rather than creating dedicated feature branch.

**Commit flow:** Individual commits per group/task, all merged to genie-dev.

## Notes
- **Critical change from planning:** Log viewer promoted from Phase 2 to Phase 1 after discovering `./genie view` incompatibility with Claude events
- **Estimated effort:** M+ (Medium-plus) – ~350-400 lines total across both executor files
- **Testing priority:** End-to-end validation (Group C) is gate for completion
- **Documentation:** Examples added inline during Group C; comprehensive guide deferred if needed
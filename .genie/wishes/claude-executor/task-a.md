# Task A: Core Executor Implementation

**Wish:** @.genie/wishes/claude-executor-wish.md
**Group:** A – core-executor-implementation
**Tracker:** d771e4ce-c053-4b1e-b043-2653c677d59d
**Persona:** implementor
**Branch:** genie-dev (existing branch, commits merged from worktree)
**Status:** pending

## Scope
Implement `.genie/cli/src/executors/claude.ts` following the `Executor` interface pattern established by Codex executor.

## Context & Inputs
- @.genie/cli/src/executors/types.ts — `Executor` interface definition
- @.genie/cli/src/executors/codex.ts — reference implementation
- @.genie/cli/src/executors/index.ts — executor loading mechanism
- @.genie/wishes/claude-executor-wish.md — full requirements

## Deliverables
1. **defaults: ExecutorDefaults**
   - binary: `'claude'`
   - packageSpec: `null` (no npx wrapper)
   - sessionsDir: `null` (Claude manages own sessions)
   - exec config: model (`'sonnet'`), permissionMode (`'default'`), outputFormat (`'stream-json'`), allowedTools, disallowedTools
   - resume config: basic overrides

2. **buildRunCommand({ config, agentPath, prompt })**
   - Construct: `claude -p --verbose --output-format stream-json`
   - Read agentPath file → pass content as `--append-system-prompt "<content>"`
   - Apply model, permissionMode, tool filtering from config
   - Append prompt at end

3. **buildResumeCommand({ config, sessionId, prompt })**
   - Construct: `claude -p --verbose --output-format stream-json --resume <sessionId>`
   - Maintain outputFormat for consistency
   - Append prompt

4. **resolvePaths({ config, baseDir, resolvePath })**
   - Return `{}` (Claude stores sessions in `~/.claude/projects/`)

5. **extractSessionId({ startTime, paths })**
   - Parse log file for first `{type:"system", session_id:"..."}`
   - Return session_id or null

6. **getSessionExtractionDelay({ config, defaultDelay })**
   - Return `1000` (ms)

7. **logViewer property**
   - Import from `./claude-log-viewer` (implemented in Group D)
   - Wire up: `logViewer: claudeLogViewer`

## Dependencies
- **Blocks:** Group D must complete `claude-log-viewer.ts` before executor can reference it
- **Parallel:** Can develop in parallel with Group B (config) and Group C (testing)

## Validation
```bash
# Build check
cd .genie/cli && pnpm run build

# Executor loads without errors
node .genie/cli/dist/genie.js list agents

# Verify claude.js exists
ls -la .genie/cli/dist/executors/claude.js
```

## Evidence
- Build output showing zero TypeScript errors
- Executor successfully loads at runtime
- File exists: `.genie/cli/dist/executors/claude.js`

Store evidence in wish status log or `.genie/reports/done-claude-executor-<timestamp>.md`
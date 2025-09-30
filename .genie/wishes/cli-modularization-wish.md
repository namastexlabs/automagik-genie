# 🧞 CLI Modularization Wish

**Status:** DRAFT
**Roadmap Item:** NEW – CLI Modularization (Code Organization)
**Mission Link:** @.genie/product/mission.md §Core Principles
**Standards:** @.genie/standards/best-practices.md §Code Organization

## Context Ledger

| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| @.genie/cli/src/genie.ts | repo | 2,105-line monolith; 40% of CLI codebase; command handlers (712 lines), utilities (372 lines), transcript parsing (150 lines) | Groups A-C |
| @.genie/reports/planning-brief-cli-refactor-corrected-20250930.md | analysis | Evidence-based analysis confirming extractable targets; Twin validation | entire wish |
| @.genie/cli/src/executors/transcript-utils.ts | repo | Existing shared utilities (237 lines); can host additional transcript parsing | Group C |
| Empty scaffolding: commands/, lib/ directories | repo | Ready for extraction | Groups A-B |

## Discovery Summary

- **Primary analyst:** Human + GENIE + Twin (challenge mode)
- **Key observations:**
  - genie.ts = 2,105 lines (40% of 5,300-line CLI codebase)
  - Command handlers: 712 lines across 7 functions (runChat, runContinue, runView, runRuns, runList, runStop, runHelp)
  - Utilities: 372 lines (formatters, path helpers, sanitizers, config)
  - Transcript parsing: 150 lines (buildTranscriptFromEvents, sliceTranscriptForLatest)
  - Empty commands/ and lib/ directories ready for extraction
  - Twin validation confirms extraction targets are accurate
- **Assumptions (ASM-#):**
  - ASM-1: No external consumers depend on genie.ts internal exports (only `./genie` CLI entry is public)
  - ASM-2: Command handlers can be extracted without circular dependencies using shared utilities
  - ASM-3: Existing tests (if any) exercise CLI commands end-to-end, not genie.ts internals
  - ASM-4: Build will catch orphaned imports via TypeScript compiler
- **Open questions (Q-#):**
  - Q-1: Do any tests assert on genie.ts internals? (Need to check `.genie/cli/test/`)
  - Q-2: Should we extract all utilities at once or incrementally? (Recommend: all at once to avoid multiple refactoring rounds)
- **Risks:**
  - RISK-1: Command handlers may have tight coupling requiring shared context object (Mitigation: Extract utilities first, then commands import from lib/)
  - RISK-2: Background execution mode complexity (Mitigation: Test `./genie run --background` after each phase)
  - RISK-3: Session management edge cases (Mitigation: Test `./genie view`, `./genie resume`, `./genie stop` after extraction)

## Executive Summary

Break up genie.ts (2,105 lines, 40% of CLI codebase) into focused modules: command handlers in `commands/*.ts`, utilities in `lib/*.ts`, transcript parsing consolidated with existing `transcript-utils.ts`. Target: reduce genie.ts to <900 lines (59% reduction) while preserving exact CLI behavior.

## Current State

- **What exists today:**
  - @.genie/cli/src/genie.ts: 2,105-line monolith handling arg parsing, command dispatch, command implementation, utilities, transcript parsing
  - Empty scaffolding: commands/ and lib/ directories ready for extraction
  - @.genie/cli/src/executors/transcript-utils.ts: 237 lines of shared transcript utilities (sliceForLatest, sliceForRecent, metrics summarization)
  - 51 functions in genie.ts = ~41 lines/function average
- **Gaps/Pain points:**
  - Hard to navigate 2,105-line file
  - New features added inline instead of using modules
  - Command handlers tightly coupled with utilities and config
  - Transcript parsing duplicated between genie.ts and log viewers
  - No clear separation of concerns

## Target State & Guardrails

- **Desired behaviour:**
  - genie.ts streamlined to <900 lines as thin orchestrator (arg parser → command dispatcher)
  - Command handlers extracted to commands/*.ts modules (run, resume, list, view, stop, help)
  - Utilities extracted to lib/*.ts modules (utils, config, cli-parser, agent-resolver, session-helpers)
  - Transcript parsing consolidated in existing transcript-utils.ts
  - Total CLI reduced by ~150 lines (2.8%) through deduplication + cleanup
  - Zero behavioral changes: CLI commands, flags, help text, output remain identical
- **Non-negotiables:**
  - Preserve exact CLI behavior (same commands, flags, help text)
  - No circular dependencies (lib/ must not import from commands/, genie.ts only imports from lib/ and commands/)
  - Build succeeds with no new warnings after each phase
  - CLI startup time must not regress (<500ms for `./genie --help`)
  - Use clear import paths (no barrel exports initially)

## Execution Groups

### Group A – Utilities Extraction

- **Goal:** Extract utilities from genie.ts to lib/ modules
- **Surfaces:**
  - `@.genie/cli/src/genie.ts:256-292` (parseArguments → lib/cli-parser.ts)
  - `@.genie/cli/src/genie.ts:333-413` (config management → lib/config.ts)
  - `@.genie/cli/src/genie.ts:897-975` (formatters, sanitizers → lib/utils.ts)
  - `@.genie/cli/src/genie.ts:1827-1934` (agent resolution → lib/agent-resolver.ts)
  - `@.genie/cli/src/genie.ts:1724-1782` (session helpers → lib/session-helpers.ts)
- **Deliverables:**
  - `lib/cli-parser.ts`: parseArguments function (36 lines)
  - `lib/config.ts`: loadConfig, buildDefaultConfig, mergeDeep, resolvePaths, prepareDirectories, applyDefaults (~81 lines)
  - `lib/utils.ts`: formatRelativeTime, formatPathRelative, truncateText, sanitizeLogFilename, safeIsoString, deriveStartTime, deriveLogFile (~79 lines)
  - `lib/agent-resolver.ts`: listAgents, resolveAgentIdentifier, agentExists, loadAgentSpec, extractFrontMatter (~108 lines)
  - `lib/session-helpers.ts`: findSessionEntry, resolveDisplayStatus (~59 lines)
  - Update imports in genie.ts
- **Evidence:**
  - Build passes: `cd .genie/cli && npm run build`
  - genie.ts reduced by ~363 lines (2,105 → ~1,742)
  - CLI help works: `./genie --help`
- **Suggested personas:** `implementor`
- **External tracker:** TBD

### Group B – Transcript Parsing Consolidation

- **Goal:** Move transcript parsing from genie.ts to transcript-utils.ts, eliminate duplication
- **Surfaces:**
  - `@.genie/cli/src/genie.ts:1936-2105` (buildTranscriptFromEvents, sliceTranscriptForLatest → move to transcript-utils.ts)
  - `@.genie/cli/src/executors/codex-log-viewer.ts:383-404` (duplicate sliceForLatest → delete, import from transcript-utils)
  - `@.genie/cli/src/executors/claude-log-viewer.ts:221-240` (duplicate sliceForLatest → delete, import from transcript-utils)
  - `@.genie/cli/src/executors/transcript-utils.ts` (existing file, add new functions)
- **Deliverables:**
  - Move `buildTranscriptFromEvents` from genie.ts → transcript-utils.ts (128 lines)
  - Delete duplicate `sliceTranscriptForLatest` from genie.ts, codex-log-viewer.ts, claude-log-viewer.ts (66 lines saved)
  - Export sliceForRecent from transcript-utils (already exists, verify usage)
  - Update imports in genie.ts, codex-log-viewer.ts, claude-log-viewer.ts
- **Evidence:**
  - `./genie view <sessionId>` works for both codex and claude sessions
  - genie.ts reduced by ~170 lines (1,742 → ~1,572)
  - No duplicate sliceForLatest functions: `grep -n "function sliceForLatest" .genie/cli/src/**/*.ts` returns 1 result only
- **Suggested personas:** `implementor`
- **External tracker:** TBD

### Group C – Command Handlers Extraction

- **Goal:** Move all command logic from genie.ts to commands/*.ts modules
- **Surfaces:**
  - `@.genie/cli/src/genie.ts:484-576` (runChat → commands/run.ts)
  - `@.genie/cli/src/genie.ts:578-895` (executeRun → shared helper, keep in genie.ts or lib/executor-runner.ts)
  - `@.genie/cli/src/genie.ts:996-1129` (runContinue → commands/resume.ts)
  - `@.genie/cli/src/genie.ts:1132-1174` (runRuns → commands/list.ts)
  - `@.genie/cli/src/genie.ts:1176-1203` (runList → commands/list.ts)
  - `@.genie/cli/src/genie.ts:1205-1573` (runView → commands/view.ts)
  - `@.genie/cli/src/genie.ts:1575-1638` (runStop → commands/stop.ts)
  - `@.genie/cli/src/genie.ts:1784-1889` (runHelp, emitAgentCatalog → commands/help.ts)
- **Deliverables:**
  - `commands/run.ts`: runChat logic + shared executeRun if extracted (~430 lines)
  - `commands/resume.ts`: runContinue logic, reuses executeRun (~135 lines)
  - `commands/list.ts`: runList, runRuns, emitAgentCatalog (~117 lines)
  - `commands/view.ts`: runView logic (~369 lines)
  - `commands/stop.ts`: runStop logic (~65 lines)
  - `commands/help.ts`: runHelp logic (~106 lines)
  - Update genie.ts to dispatch to command modules
- **Evidence:**
  - All commands work identically:
    - `./genie run <agent> "<prompt>"` launches session
    - `./genie resume <sessionId> "<prompt>"` continues session
    - `./genie list agents` shows agent catalog
    - `./genie list sessions` shows runs overview
    - `./genie view <sessionId>` displays transcript
    - `./genie stop <sessionId>` terminates session
    - `./genie help` displays usage
  - genie.ts reduced by ~712 lines (1,572 → ~860 lines)
  - Background execution works: `./genie run --background <agent> "<prompt>"`
- **Suggested personas:** `implementor`, `qa`
- **External tracker:** TBD

## Verification Plan

**Validation steps to run after each group:**

```bash
# Build and type-check
cd .genie/cli && npm run build

# Measure line reduction
wc -l .genie/cli/src/genie.ts

# Check for duplicate functions
grep -rh "^export function\|^function" .genie/cli/src --include="*.ts" | sort | uniq -d

# Integration validation (all commands work identically)
./genie --help
./genie list agents
./genie list sessions

# Test each command with real session (if test sessions exist)
./genie view <sessionId>
./genie resume <sessionId> "test message"
./genie stop <sessionId>

# Test background mode
./genie run plan "test background execution" &
sleep 5
./genie list sessions | grep plan

# Verify no circular dependencies
npm run build 2>&1 | grep -i "circular\|cycle"
```

**Evidence storage:**
- Commit messages document line reduction per group
- Final validation report: `.genie/reports/done-cli-modularization-<timestamp>.md`

**Branch strategy:** Dedicated branch `refactor/cli-modularization`

### Evidence Checklist

- **Validation commands (exact):**
  - `npm run build` (exits 0)
  - `./genie --help` (output matches baseline)
  - `./genie list agents` (shows all agents)
  - `./genie list sessions` (shows tracked sessions)
  - `./genie view <sessionId>` (displays transcript)
  - `wc -l .genie/cli/src/genie.ts` (<900 lines)
  - `grep -rh "^function" .genie/cli/src | sort | uniq -d | wc -l` (returns 0 duplicates)
- **Artefact paths (where evidence lives):**
  - Pre-refactoring snapshots: `baseline-help.txt`, `baseline-agents.txt` (capture before Group A)
  - Commit messages: line reduction per group
  - Final report: `.genie/reports/done-cli-modularization-<timestamp>.md`
- **Approval checkpoints (human sign-off required before work starts):**
  - ✅ Before Group A: Approve utilities extraction scope
  - ✅ Before Group B: Review Group A results; approve transcript consolidation
  - ✅ Before Group C: Review Group A+B results; approve command extraction (highest risk)
  - ✅ Before merge: Review Group C validation report; approve final PR

## <spec_contract>

- **Scope:**
  - Extract utilities from genie.ts to lib/ modules (Group A: ~363 lines)
  - Consolidate transcript parsing in transcript-utils.ts (Group B: ~170 lines)
  - Move command handlers to commands/*.ts modules (Group C: ~712 lines)
  - Target: genie.ts reduced from 2,105 → <900 lines (59% reduction)
  - Preserve exact CLI behavior (same commands, flags, help text, output format)
  - No circular dependencies (enforce via TypeScript compiler)
- **Out of scope:**
  - Refactoring executor files (codex.ts, claude.ts are polymorphic by design)
  - Refactoring log viewers (codex-log-viewer.ts, claude-log-viewer.ts are format-specific by design)
  - Adding new CLI features or changing existing functionality
  - Performance optimizations beyond structural improvements
  - Adding external dependencies
  - Changing view rendering logic (views/*.ts)
  - Modifying session-store.ts or background-manager.ts (unless minimal imports needed)
- **Success metrics:**
  - genie.ts: 2,105 → <900 lines (target: ~860, ≥59% reduction)
  - Total CLI: ~5,300 → ~5,150 lines (~150 lines saved through deduplication)
  - Zero duplicate function definitions across modules
  - Build succeeds with no new warnings
  - CLI startup time ≤500ms for `./genie --help` (no regression)
  - All integration validation commands pass
  - No circular dependencies detected by TypeScript compiler
- **External tasks:**
  - TBD (forge will generate task IDs)
- **Dependencies:**
  - Existing TypeScript build configuration
  - Existing executors, views, session-store, background-manager modules
  - No new npm dependencies required

</spec_contract>

## Blocker Protocol

1. Pause work and create `.genie/reports/blocker-cli-modularization-<timestamp>.md` describing findings.
2. Notify owner and wait for updated instructions.
3. Resume only after wish status/log is updated.

**Potential blockers to watch for:**
- Q-1 revealed: Tests asserting on genie.ts internals exist (requires test updates before extraction)
- Circular dependency detected during Group C (requires restructuring of shared utilities)
- Command handler coupling stronger than expected (may need context object pattern)

## Status Log

- [2025-09-30 14:30Z] Wish created based on evidence-based analysis
- [Pending] Human approval before Group A
- [Pending] Pre-refactoring validation (capture baseline CLI output, find tests)
- [Pending] `/forge cli-modularization` to generate task breakdown
- [Pending] Create branch `refactor/cli-modularization`
- [Pending] Execute Groups A → B → C sequentially with validation between each
- [Pending] Update roadmap after completion

---

## Effort Estimate: M (Medium, 8-10 hours)

**Breakdown:**
- Group A (utilities): 2-3 hours
- Group B (transcript): 1-2 hours
- Group C (commands): 4-5 hours
- Testing & validation: 1 hour

**Roadmap Fit:** Phase 1+ (Code organization, improves maintainability but not direct user-facing value)
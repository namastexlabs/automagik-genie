# 🧞 CLI Architecture Refactoring Wish

**Status:** INVALIDATED (see corrected analysis)
**Roadmap Item:** NEW – CLI Architecture Optimization
**Mission Link:** @.genie/product/mission.md §Core Principles
**Standards:** @.genie/standards/best-practices.md §Code Organization

## INVALIDATION NOTICE

**Date:** 2025-09-30
**Reason:** False assumptions about duplication; inflated line count claims; roadmap misalignment

**Corrected Analysis:** @.genie/reports/planning-brief-cli-refactor-corrected-20250930.md

**Key Corrections:**
- Executor "duplication" (155 lines) → Actually polymorphic implementations, NOT duplicates
- Log viewer "duplication" (346 lines) → Actually format-specific parsers, NOT duplicates
- Real duplication: 22 lines (sliceForLatest function)
- Realistic savings: 150 lines (2.8%), not 826 lines (16%)
- Effort: Medium (10-12 hours), not Small (3-4 hours)
- Roadmap fit: Phase 1 priorities are instrumentation/evidence capture, NOT code organization

**Recommendation:** Table refactoring. Focus on Evidence Checklist enforcement per roadmap.

---

## Original Context Ledger (INVALIDATED)

| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| Planning brief (chat) | discovery | ❌ Identified 2,106-line genie.ts monolith; 796 lines of command handlers, 320 lines of utilities, 170 lines of transcript parsing | entire wish |
| @.genie/cli/src/genie.ts | repo | Monolithic entry point with inline commands, utils, transcript parsing | Groups A-E |
| @.genie/cli/src/executors/codex.ts:225-280 | repo | ❌ Config merging, session extraction patterns duplicated in claude.ts — WRONG: polymorphic, not duplicate | Group D |
| @.genie/cli/src/executors/claude.ts:97-193 | repo | ❌ Output filtering and log viewing duplicate codex patterns — WRONG: format-specific, not duplicate | Group D |
| @.genie/cli/src/executors/codex-log-viewer.ts | repo | ❌ Transcript parsing logic 80% identical to claude-log-viewer.ts — WRONG: only 22 lines duplicate | Group B |
| @.genie/cli/src/executors/claude-log-viewer.ts | repo | ❌ Session extraction and view building duplicated — WRONG: format-specific | Group B |
| @.genie/cli/src/executors/transcript-utils.ts | repo | Existing but underutilized; can consolidate log viewer logic | Group B |

## Discovery Summary

- **Primary analyst:** Human + GENIE plan agent
- **Key observations:**
  - Total CLI source: 5,503 lines with genie.ts accounting for 38% (2,106 lines)
  - Empty commands/ and lib/ directories indicate prior refactoring scaffolding
  - No TODO/FIXME comments; clean codebase baseline
  - Executor duplication: ~155 lines shared patterns between codex.ts and claude.ts
  - Log viewer duplication: ~346 lines between codex-log-viewer.ts and claude-log-viewer.ts
  - transcript-utils.ts exists but both log viewers reimplement its functionality
- **Assumptions (ASM-#):**
  - ASM-1: No external consumers depend on genie.ts internal exports (only ./genie CLI entry point is public)
  - ASM-2: Existing tests (if any) are integration tests exercising CLI commands end-to-end
  - ASM-3: TypeScript compiler will catch orphaned code via noUnusedLocals and noUnusedParameters
  - ASM-4: Empty commands/ and lib/ directories indicate prior refactoring attempt; structure is pre-approved
- **Open questions (Q-#):**
  - Q-1: Do any tests exist that assert on genie.ts internals? (Need to check .genie/cli/test/ or __tests__/)
  - Q-2: Are there downstream repos importing from genie.ts? (Need repo-wide grep)
  - Q-3: Should we add integration tests before refactoring? (Risk mitigation)
- **Risks:**
  - RISK-1: Import path changes could break undocumented internal consumers
  - RISK-2: Large commits may be hard to review
  - RISK-3: Executor refactoring could introduce regressions in session handling

## Executive Summary

Refactor Genie CLI from a 2,106-line monolithic entry point to a modular architecture with clear separation of concerns. Extract command handlers, utilities, session management, and transcript parsing into focused modules. Consolidate duplicate code across executors and log viewers using inheritance and polymorphism. Target: reduce genie.ts to <300 lines and overall codebase by ≥16% (5,503 → ~4,600 lines) while preserving exact CLI behavior.

## Current State

- **What exists today:**
  - @.genie/cli/src/genie.ts: 2,106-line monolith handling CLI parsing, command orchestration, view building, session management, utilities, and transcript parsing
  - @.genie/cli/src/executors/codex.ts (401 lines) and @.genie/cli/src/executors/claude.ts (206 lines) with duplicated config merging and session extraction
  - @.genie/cli/src/executors/codex-log-viewer.ts (467 lines) and @.genie/cli/src/executors/claude-log-viewer.ts (290 lines) with ~80% identical transcript parsing
  - Empty scaffolding: commands/ and lib/ directories ready for extraction
  - @.genie/cli/src/executors/transcript-utils.ts (238 lines) underutilized; log viewers reimplement its functionality
- **Gaps/Pain points:**
  - New features added directly to genie.ts instead of using/creating appropriate modules
  - Command handlers (run, resume, list, view, stop, help) inline in main file (796 lines)
  - Utility functions (formatRelativeTime, truncateText, sanitizeLogFilename, etc.) scattered in main file (320 lines)
  - Transcript parsing duplicated across log viewers instead of shared (170+ lines per viewer)
  - No base class for executors; shared patterns copy-pasted
  - Hard to navigate, test, and maintain due to size and coupling

## Target State & Guardrails

- **Desired behaviour:**
  - genie.ts streamlined to <300 lines as thin orchestrator (CLI parser → command dispatch)
  - Command handlers extracted to commands/*.ts (run, resume, list, view, stop, help) - each <200 lines
  - Utilities extracted to lib/*.ts modules with single responsibility (utils, config, cli-parser, agent-resolver, session-helpers, transcript-parser, background-launcher)
  - Executors extend BaseExecutor abstract class with shared logic (config, paths, validation)
  - Log viewers consolidated into single polymorphic log-viewer.ts with format-specific config
  - Total CLI codebase reduced by ≥16% (5,503 → ~4,600 lines)
  - Zero breaking changes: CLI commands, flags, help text, and output remain identical
- **Non-negotiables:**
  - Preserve exact CLI behavior (same commands, flags, help text)
  - Use `git mv` for file moves to preserve blame history
  - Build succeeds with no new warnings after each phase
  - CLI startup time must not regress (<500ms for ./genie --help)
  - One commit per execution group for reviewability

## Execution Groups

### Group A – Utils & Config Extraction (Quick Wins)
- **Goal:** Extract utilities, config management, CLI parser, and agent resolver from genie.ts
- **Surfaces:**
  - `@.genie/cli/src/genie.ts:256-292` (parseArguments)
  - `@.genie/cli/src/genie.ts:333-413` (loadConfig, buildDefaultConfig, mergeDeep, resolvePaths, prepareDirectories)
  - `@.genie/cli/src/genie.ts:897-975` (utility functions: extractFrontMatter, deriveStartTime, sanitizeLogFilename, deriveLogFile, formatPathRelative, safeIsoString, formatRelativeTime)
  - `@.genie/cli/src/genie.ts:1827-1934` (agent resolution: listAgents, resolveAgentIdentifier, agentExists, truncateText)
- **Deliverables:**
  - `lib/cli-parser.ts` (parseArguments)
  - `lib/config.ts` (loadConfig, buildDefaultConfig, mergeDeep, resolvePaths, prepareDirectories, applyDefaults)
  - `lib/utils.ts` (formatRelativeTime, formatPathRelative, truncateText, sanitizeLogFilename, safeIsoString, deriveStartTime, deriveLogFile)
  - `lib/agent-resolver.ts` (listAgents, resolveAgentIdentifier, agentExists, loadAgentSpec, extractFrontMatter)
- **Evidence:** Build passes (`npm run build` exits 0), genie.ts reduced by ~400 lines, baseline CLI help output unchanged
- **Suggested personas:** `implementor`
- **External tracker:** TBD

### Group B – Session & Transcript Consolidation (Core Refactoring)
- **Goal:** Extract session helpers, consolidate transcript parsing, extract background launcher
- **Surfaces:**
  - `@.genie/cli/src/genie.ts:1724-1782` (findSessionEntry, resolveDisplayStatus)
  - `@.genie/cli/src/genie.ts:1936-2106` (buildTranscriptFromEvents, sliceTranscriptForLatest, sliceTranscriptForRecent)
  - `@.genie/cli/src/genie.ts:415-482` (maybeHandleBackgroundLaunch)
  - `@.genie/cli/src/executors/codex-log-viewer.ts` (parseConversation, extractMetrics, sliceForLatest)
  - `@.genie/cli/src/executors/claude-log-viewer.ts` (parseConversation, extractMetrics, sliceForLatest)
  - `@.genie/cli/src/executors/transcript-utils.ts` (existing slicing/metrics utilities)
- **Deliverables:**
  - `lib/session-helpers.ts` (findSessionEntry, resolveDisplayStatus)
  - `lib/transcript-parser.ts` (unified parseJsonlTranscript, buildChatMessages, sliceForLatest, sliceForRecent - consolidate from genie.ts + log viewers + transcript-utils)
  - `lib/background-launcher.ts` (maybeHandleBackgroundLaunch, resolveSessionIdForBanner, buildBackgroundActions)
- **Evidence:** `./genie view <sessionId>` output identical for both codex and claude sessions, genie.ts reduced by ~450 lines, no duplicate transcript parsing functions across log viewers
- **Suggested personas:** `implementor`, `tests`
- **External tracker:** TBD

### Group C – Command Handlers (High-Risk Extraction)
- **Goal:** Move all command logic (run, resume, list, view, stop, help) to commands/*.ts modules
- **Surfaces:**
  - `@.genie/cli/src/genie.ts:484-576` (runChat)
  - `@.genie/cli/src/genie.ts:578-895` (executeRun - shared by run and resume)
  - `@.genie/cli/src/genie.ts:996-1129` (runContinue)
  - `@.genie/cli/src/genie.ts:1132-1174` (runRuns)
  - `@.genie/cli/src/genie.ts:1176-1203` (runList)
  - `@.genie/cli/src/genie.ts:1205-1573` (runView)
  - `@.genie/cli/src/genie.ts:1575-1638` (runStop)
  - `@.genie/cli/src/genie.ts:1784-1889` (runHelp, emitAgentCatalog)
- **Deliverables:**
  - `commands/run.ts` (runChat + executeRun)
  - `commands/resume.ts` (runContinue, reuses executeRun)
  - `commands/list.ts` (runList, runRuns, emitAgentCatalog)
  - `commands/view.ts` (runView)
  - `commands/stop.ts` (runStop)
  - `commands/help.ts` (runHelp)
- **Evidence:** All CLI commands work identically:
  - `./genie run <agent> "<prompt>"` launches session
  - `./genie resume <sessionId> "<prompt>"` continues session
  - `./genie list agents` shows agent catalog
  - `./genie list sessions` shows runs overview
  - `./genie view <sessionId>` displays transcript
  - `./genie stop <sessionId>` terminates session
  - `./genie help` displays usage
  - genie.ts reduced by ~800 lines (down to ~450 lines)
- **Suggested personas:** `implementor`, `qa`
- **External tracker:** TBD

### Group D – Executor Consolidation (Polymorphism)
- **Goal:** Create BaseExecutor abstract class and consolidate log viewers into polymorphic factory
- **Surfaces:**
  - `@.genie/cli/src/executors/codex.ts:225-280` (mergeExecConfig, mergeResumeConfig, collectExecOptions, tryLocateSessionFileBySessionId, createOutputFilter)
  - `@.genie/cli/src/executors/claude.ts:97-193` (mergeExecConfig, mergeResumeConfig, createOutputFilter)
  - `@.genie/cli/src/executors/codex-log-viewer.ts` (entire file - consolidate into polymorphic log-viewer.ts)
  - `@.genie/cli/src/executors/claude-log-viewer.ts` (entire file - consolidate into polymorphic log-viewer.ts)
- **Deliverables:**
  - `executors/base-executor.ts` (abstract class with shared resolvePaths, validateConfig, mergeConfig patterns)
  - `executors/codex.ts` (refactored to extend BaseExecutor, keep only codex-specific logic)
  - `executors/claude.ts` (refactored to extend BaseExecutor, keep only claude-specific logic)
  - `executors/log-viewer.ts` (polymorphic factory: createLogViewer(config: LogViewerConfig) with format-specific session extraction and view building)
- **Evidence:**
  - Session tracking works for both executors (`./genie list sessions` shows codex and claude runs)
  - `./genie view <sessionId>` works for both codex and claude sessions
  - Executor line count reduced by ~270 lines total
  - No duplicate function definitions across executors
- **Suggested personas:** `implementor`, `tests`
- **External tracker:** TBD

### Group E – Final Optimization & Validation
- **Goal:** Optimize entry point to <300 lines, run full validation suite, generate migration notes
- **Surfaces:**
  - `@.genie/cli/src/genie.ts:1-254` (main, parseArguments cleanup, command dispatch optimization)
- **Deliverables:**
  - Streamlined `genie.ts` (~280 lines: imports, main function, command dispatch map, error handling)
  - Validation report (line counts before/after, build output, duplicate function check, dead code check)
  - Migration notes (import path changes, breaking changes if any)
- **Evidence:**
  - genie.ts final line count <300 (target: ~280)
  - Total CLI codebase <4,600 lines (≥16% reduction from 5,503)
  - All integration tests pass (if they exist)
  - `npm run build` succeeds with no new warnings
  - `grep -rh "^export function\|^function" .genie/cli/src --include="*.ts" | sort | uniq -d` returns 0 lines (no duplicates)
  - `rg "TODO\|FIXME\|XXX\|HACK" .genie/cli/src --type ts` returns 0 lines (no dead code)
  - CLI startup time <500ms for `./genie --help`
- **Suggested personas:** `qa`, `polish`
- **External tracker:** TBD

## Verification Plan

**Validation steps to run after each group:**

```bash
# Build and type-check
cd .genie/cli && npm run build

# Measure line reduction
find .genie/cli/src -name "*.ts" -not -path "*/node_modules/*" | xargs wc -l | tail -1

# Check for duplicate function names (should be 0)
grep -rh "^export function\|^function" .genie/cli/src --include="*.ts" | sort | uniq -d

# Verify no dead code
rg "TODO\|FIXME\|XXX\|HACK" .genie/cli/src --type ts

# Integration validation (commands work identically)
./genie --help
./genie list agents
./genie list sessions
# If test sessions exist:
./genie view <sessionId>
./genie resume <sessionId> "test message"
./genie stop <sessionId>
```

**Evidence storage:**
- Commit messages document line reduction per group
- Final validation report: `.genie/reports/done-cli-refactor-<timestamp>.md`
- Migration notes: `.genie/wishes/cli-refactor/migration-notes.md` (if needed)

**Branch strategy:** Dedicated branch `refactor/cli-architecture-lean`

### Evidence Checklist

- **Validation commands (exact):**
  - `npm run build` (exits 0)
  - `./genie --help` (output matches baseline-help.txt)
  - `./genie list agents` (output matches baseline-agents.txt)
  - `./genie list sessions` (shows all tracked sessions)
  - `./genie view <sessionId>` (displays transcript)
  - `find .genie/cli/src -name "*.ts" | xargs wc -l | tail -1` (<4,600 total lines)
  - `grep -rh "^export function\|^function" .genie/cli/src | sort | uniq -d | wc -l` (returns 0)
- **Artefact paths (where evidence lives):**
  - Pre-refactoring snapshots: `baseline-help.txt`, `baseline-agents.txt`
  - Commit messages: line reduction per group
  - Final report: `.genie/reports/done-cli-refactor-<timestamp>.md`
  - Migration notes: `.genie/wishes/cli-refactor/migration-notes.md` (if needed)
- **Approval checkpoints (human sign-off required before work starts):**
  - ✅ Before Group A: Approve overall wish scope and phasing strategy
  - ✅ Before Group C: Review Group A+B results; approve high-risk command extraction
  - ✅ Before Group D: Review Group C results; approve executor consolidation
  - ✅ Before merge: Review Group E validation report; approve final PR

## <spec_contract>

- **Scope:**
  - Extract utilities, config, CLI parser, agent resolver from genie.ts (Group A)
  - Extract session helpers, consolidate transcript parsing, extract background launcher (Group B)
  - Move all command handlers to commands/*.ts modules (Group C)
  - Create BaseExecutor and consolidate log viewers (Group D)
  - Optimize entry point to <300 lines and validate (Group E)
  - Preserve exact CLI behavior (same commands, flags, help text, output format)
  - Use `git mv` for file moves to preserve blame history
  - Target: genie.ts <300 lines, total codebase reduced by ≥16%
- **Out of scope:**
  - Changes to CLI argument parsing behavior
  - Refactoring of view rendering logic (views/*.ts)
  - Changes to session-store.ts, background-manager.ts (unless minimal imports needed)
  - Adding new features or changing existing functionality
  - Performance optimizations beyond structural improvements
  - Adding external dependencies
- **Success metrics:**
  - genie.ts: 2,106 → <300 lines (target: ~280, ≥85% reduction)
  - Total CLI: 5,503 → <4,600 lines (≥16% reduction)
  - Zero duplicate function definitions across modules
  - Zero TODO/FIXME/XXX/HACK comments
  - Build succeeds with no new warnings
  - CLI startup time ≤500ms for `./genie --help` (no regression)
  - All integration validation commands pass
- **External tasks:**
  - TBD (forge will generate task IDs)
- **Dependencies:**
  - Existing TypeScript build configuration
  - Existing executors, views, session-store, background-manager modules
  - No new npm dependencies

</spec_contract>

## Blocker Protocol

1. Pause work and create `.genie/reports/blocker-cli-refactor-<timestamp>.md` describing findings.
2. Notify owner and wait for updated instructions.
3. Resume only after wish status/log is updated.

**Potential blockers to watch for:**
- Q-1 revealed: Tests asserting on genie.ts internals exist (requires test updates)
- Q-2 revealed: Downstream repos import from genie.ts (requires coordination)
- Session handling regression detected during Group D (requires investigation)

## Status Log

- [2025-09-30 12:00Z] Wish created
- [Pending] Human approval before Group A
- [Pending] Pre-refactoring validation (grep for imports, find tests, snapshot CLI output)
- [Pending] `/forge cli-refactor` to generate task breakdown
- [Pending] Create branch `refactor/cli-architecture-lean`
- [Pending] Execute Groups A → B → C → D → E sequentially
- [Pending] Update roadmap after completion
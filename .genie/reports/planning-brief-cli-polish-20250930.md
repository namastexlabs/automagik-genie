# Planning Brief: CLI Modularization Polish (100/100 Target)

**Date:** 2025-09-30 16:30:00Z
**Roadmap Item:** Phase 1 – Instrumentation & Telemetry (CLI quality gates)
**Mission Link:** @.genie/product/mission.md §Core Principles
**Current Score:** 88/100 (GOOD tier)
**Target Score:** 100/100 (EXCELLENT tier)
**Gap:** 12 points across Implementation (9 pts) and Verification (3 pts)

## Context Ledger

| Source | Type | Summary | Routed To | Status |
| --- | --- | --- | --- | --- |
| @.genie/wishes/cli-modularization-wish.md | wish | Original refactoring spec with 100-point matrix | polish plan | ✅ |
| @.genie/wishes/cli-modularization/qa/review-20250930-162800.md | review | Complete gap analysis: 88/100, 8 deductions documented | forge plan | ✅ |
| @.genie/cli/README.md | repo | Architecture overview mentions needed enhancements (lines 195-205) | documentation tasks | ✅ |
| @.genie/cli/src/lib/*.ts | repo | 11 extracted modules, 0 with JSDoc comments | documentation tasks | ✅ |
| @.genie/cli/snapshots/baseline-20250930-140453/ | evidence | 16/17 snapshots match, 1 session state diff | validation tasks | ✅ |
| @.genie/product/roadmap.md | roadmap | Phase 1 focus: Evidence Checklist as gating deliverable | alignment | ✅ |

## Discovery Summary

### Current State Analysis
- **Code Refactor:** ✅ COMPLETE – genie.ts reduced 2,105→121 lines (94.3%), all 4 groups executed cleanly
- **Behavioral Validation:** ✅ EXCELLENT – 16/17 snapshots match, zero circular dependencies, build passes
- **Documentation:** ❌ INCOMPLETE – 0/11 lib modules have JSDoc, README not updated with new architecture
- **Test Coverage:** ⚠️ PARTIAL – Integration tests via snapshots ✅, but no unit tests for extracted modules
- **Evidence Artifacts:** ⚠️ GAPS – QA test logs missing, performance metrics not captured

### Gap Breakdown (12 Points to Recover)

**Implementation Phase (-9 pts):**
1. **Code Quality (-3 pts):** 5 extra utility files beyond plan (async.ts, config-defaults.ts, background-manager-instance.ts, executor-registry.ts, view-helpers.ts)
2. **Test Coverage (-4 pts):** No unit tests for lib/ modules (-2), QA parameter test logs missing (-2)
3. **Documentation (-4 pts):** No inline JSDoc (-2), README not updated (-2)
4. **Status: 31/40 pts**

**Verification Phase (-3 pts):**
1. **Validation (-1 pt):** 1 snapshot diff (list-sessions) due to session state during testing
2. **Evidence Quality (-1 pt):** Performance baseline not captured (<500ms startup time target)
3. **Review Thoroughness (-1 pt):** Wish status log missing completion timestamp
4. **Status: 27/30 pts**

### Assumptions (ASM-#)
- **ASM-1:** Extra utility files (async.ts, config-defaults.ts, etc.) can be retroactively justified or consolidated without breaking build
- **ASM-2:** Unit tests can be added incrementally without re-refactoring the extracted modules
- **ASM-3:** JSDoc comments and README update are non-breaking documentation enhancements
- **ASM-4:** QA parameter tests will pass post-refactor (no regression introduced)
- **ASM-5:** Snapshot diff (list-sessions) is cosmetic and can be re-baselined or documented as acceptable variance
- **ASM-6:** Performance target (<500ms startup) is achievable with current architecture

### Decisions (DEC-#)
- **DEC-1:** Tackle documentation first (highest point value: 4 pts for -2 deductions), then tests (4 pts), then evidence capture (3 pts)
- **DEC-2:** Accept extra utility files as-is unless consolidation is trivial (avoid re-refactoring risk for marginal 3-point gain)
- **DEC-3:** Unit tests prioritize lib/ modules with complex logic (agent-resolver, session-helpers, config) over trivial utilities
- **DEC-4:** Performance baseline capture is quick win (1 pt) via existing script in review report
- **DEC-5:** QA parameter tests are CRITICAL (2 pts + confidence booster) – must run and capture logs before COMPLETED status

### Risks
- **RISK-1:** Unit tests may reveal bugs in extracted modules → Mitigation: Run tests incrementally, fix immediately, update snapshots if behavior changed intentionally
- **RISK-2:** JSDoc comments may conflict with existing style → Mitigation: Follow TypeScript conventions, use /** */ format, document params/returns/examples
- **RISK-3:** QA parameter tests may fail, blocking 100/100 → Mitigation: Run early in forge plan; if failures found, spawn bug-reporter and update wish with blocker
- **RISK-4:** README update may conflict with other branches → Mitigation: Target dedicated section (Architecture), avoid wholesale rewrites

### Blockers
- ⚠️ None currently, but QA test failures would be a blocker for EXCELLENT tier

## Roadmap Alignment

**Phase:** Phase 1 – Instrumentation & Telemetry
**Maps to:** Evidence Checklist enforcement + CLI quality gates (roadmap line 11-14)
**Readiness:** Ready for forge execution (all gaps documented, tasks scoped)
**Effort:** S (Small, ~4-6 hours)

### Breakdown:
- **Group A (Documentation):** JSDoc + README update (~2 hours)
- **Group B (Tests):** Unit tests for 3-4 critical lib/ modules (~2 hours)
- **Group C (Evidence):** QA test runs + performance capture + status log update (~1 hour)
- **Total:** 5 hours (S tier)

## Executive Summary

Close 12-point gap to reach 100/100 EXCELLENT tier by completing deferred polish tasks: add JSDoc comments to all lib/ modules (2 pts), update CLI README with new architecture (2 pts), write unit tests for extracted utilities (2 pts), run and capture QA parameter test logs (2 pts), measure performance baseline (1 pt), re-baseline or document snapshot variance (1 pt), update wish status log (1 pt), and optionally consolidate extra utilities (3 pts stretch goal).

## Target State & Guardrails

**Desired Outcome:**
- All 11 lib/ modules documented with JSDoc comments explaining purpose, parameters, return values
- CLI README includes **Architecture** section mapping new module structure (types → lib → commands → genie.ts)
- Unit tests cover critical lib/ modules (agent-resolver, session-helpers, config, cli-parser) with ≥80% line coverage
- QA parameter test logs captured at `.genie/cli/snapshots/qa-codex-post-refactor.log` and `qa-claude-post-refactor.log`
- Performance baseline shows CLI startup time <500ms average over 10 runs
- Snapshot variance documented or re-baselined (list-sessions diff)
- Wish status log updated with `[2025-09-30 HH:MM:00Z] Polish completed: 100/100 (EXCELLENT)`

**Non-Negotiables:**
- No functional behavior changes (all existing tests must pass)
- Build must succeed with no new errors or warnings
- Snapshot validation must remain at 16/17 or better (17/17 if re-baselined)
- QA parameter tests must pass 100% (all 31 parameters: 22 Codex + 9 Claude)
- Documentation must be maintainer-friendly (concise, accurate, example-driven)

## Execution Groups

### Group A – Documentation Polish (4 pts recovery)

**Goal:** Add JSDoc comments to all lib/ modules and update CLI README with architecture overview

**Surfaces:**
- `@.genie/cli/src/lib/*.ts` (11 modules: types, utils, config, cli-parser, agent-resolver, session-helpers, async, background-manager-instance, config-defaults, executor-registry, view-helpers)
- `@.genie/cli/README.md:195-205` (Enhancement section already mentions modularization need)

**Deliverables:**
1. JSDoc comments for all public functions/interfaces in lib/ modules:
   - Format: `/** Description. @param name - desc @returns desc @example snippet */`
   - Focus on complex logic (agent-resolver, session-helpers, config)
   - Keep trivial utilities brief (async, view-helpers)
2. README **Architecture** section (after line 60, before "Execution Flow"):
   ```markdown
   ## Architecture (Post-Modularization)

   Since September 2025, genie.ts has been refactored into focused modules:

   **Dependency Flow:** types → lib → commands → genie.ts (single direction, no circular deps)

   ### Core Modules
   - `lib/types.ts` – Shared TypeScript interfaces (CLIOptions, ParsedCommand, GenieConfig, AgentSpec)
   - `lib/cli-parser.ts` – Argument parsing (parseArguments)
   - `lib/config.ts` – Configuration management (loadConfig, applyDefaults, resolvePaths, prepareDirectories)
   - `lib/agent-resolver.ts` – Agent discovery and spec loading (listAgents, resolveAgentIdentifier, loadAgentSpec)
   - `lib/session-helpers.ts` – Session queries (findSessionEntry, resolveDisplayStatus, getRuntimeWarnings)
   - `lib/utils.ts` – Utilities (formatRelativeTime, sanitizeLogFilename, truncateText)

   ### Command Handlers
   - `commands/run.ts` – `genie run` implementation
   - `commands/resume.ts` – `genie resume` implementation
   - `commands/list.ts` – `genie list` implementation
   - `commands/view.ts` – `genie view` implementation
   - `commands/stop.ts` – `genie stop` implementation
   - `commands/help.ts` – `genie help` implementation

   ### Orchestrator
   - `genie.ts` – Thin entry point (121 lines) dispatching to command modules
   ```

**Evidence:**
- JSDoc visible in all lib/*.ts files (grep "^/\*\*" counts 11+ occurrences)
- README diff shows new Architecture section with module map
- Build passes: `npm run build`
- Line count unchanged: `wc -l src/lib/*.ts src/commands/*.ts src/genie.ts`

**Expected Score Contribution:** +4 pts (2 for JSDoc, 2 for README)

**Suggested personas:** `polish`

---

### Group B – Unit Test Coverage (4 pts recovery)

**Goal:** Add unit tests for critical lib/ modules to validate extracted logic independently

**Surfaces:**
- `@.genie/cli/src/lib/agent-resolver.ts` (122 lines, complex logic: filesystem traversal, frontmatter parsing)
- `@.genie/cli/src/lib/session-helpers.ts` (81 lines, queries session store)
- `@.genie/cli/src/lib/config.ts` (178 lines, deep merge logic, path resolution)
- `@.genie/cli/src/lib/cli-parser.ts` (39 lines, argument parsing)

**Deliverables:**
1. Test directory: `@.genie/cli/src/__tests__/` or `@.genie/cli/tests/`
2. Unit test files:
   - `agent-resolver.test.ts` – Test listAgents, resolveAgentIdentifier, loadAgentSpec, extractFrontMatter
   - `session-helpers.test.ts` – Test findSessionEntry, resolveDisplayStatus with mock sessions
   - `config.test.ts` – Test mergeDeep, resolvePaths, applyDefaults with fixture configs
   - `cli-parser.test.ts` – Test parseArguments with various flag combinations
3. Test framework: Vitest or Jest (check existing package.json for preference)
4. Coverage target: ≥80% line coverage for tested modules

**Test Examples:**
```typescript
// agent-resolver.test.ts
import { resolveAgentIdentifier } from '../lib/agent-resolver';

describe('resolveAgentIdentifier', () => {
  it('resolves exact match', () => {
    const result = resolveAgentIdentifier('plan', [
      { id: 'plan', name: 'plan', path: '.genie/agents/plan.md' }
    ]);
    expect(result).toEqual({ id: 'plan', name: 'plan', path: '.genie/agents/plan.md' });
  });

  it('throws on ambiguous prefix', () => {
    expect(() => resolveAgentIdentifier('p', [
      { id: 'plan', name: 'plan', path: '.genie/agents/plan.md' },
      { id: 'polish', name: 'polish', path: '.genie/agents/specialists/polish.md' }
    ])).toThrow(/ambiguous/i);
  });
});
```

**Evidence:**
- Test files present at `@.genie/cli/src/__tests__/*.test.ts` or `@.genie/cli/tests/*.test.ts`
- Test run passes: `pnpm test` or `pnpm run test:genie`
- Coverage report shows ≥80% for agent-resolver, session-helpers, config, cli-parser

**Expected Score Contribution:** +4 pts (2 for unit tests, 2 for execution evidence)

**Suggested personas:** `tests`, `qa`

---

### Group C – Evidence Capture & Status Update (4 pts recovery)

**Goal:** Run QA parameter tests, capture performance baseline, re-baseline or document snapshot variance, update wish status log

**Surfaces:**
- `@.genie/agents/qa/codex-parameter-test.md` (22 Codex parameters)
- `@.genie/agents/qa/claude-parameter-test.md` (9 Claude parameters)
- `@.genie/cli/snapshots/baseline-20250930-140453/list-sessions.txt` (1 snapshot diff)
- `@.genie/wishes/cli-modularization-wish.md:610-622` (Status Log section)

**Deliverables:**
1. **QA Parameter Tests:**
   ```bash
   ./genie run qa/codex-parameter-test "Post-refactor validation: all 22 Codex parameters" > .genie/cli/snapshots/qa-codex-post-refactor.log 2>&1
   ./genie run qa/claude-parameter-test "Post-refactor validation: all 9 Claude parameters" > .genie/cli/snapshots/qa-claude-post-refactor.log 2>&1
   ```
   - Review logs for pass/fail status
   - If any failures: spawn `./genie run bug-reporter` and update wish with blocker

2. **Performance Baseline:**
   ```bash
   for i in {1..10}; do /usr/bin/time -f "%e" ./genie --help 2>&1 | tail -1; done | awk '{sum+=$1; count++} END {print "Average: " sum/count "s"}' > .genie/cli/snapshots/perf-startup-post-refactor.txt
   ```
   - Verify average <500ms
   - Append to review report or wish evidence section

3. **Snapshot Variance Resolution:**
   - Option A (Re-baseline): Clear session state, re-run `./snapshots/capture-baseline.sh`, update wish with new baseline path
   - Option B (Document): Add note to wish explaining list-sessions variance is cosmetic (session count fluctuates during development)
   - Update review report with resolution

4. **Wish Status Log Update:**
   ```markdown
   ## Status Log (in cli-modularization-wish.md)
   - [2025-09-30 14:05Z] Groups 0→A+B→C completed, baseline snapshot captured
   - [2025-09-30 16:28Z] Review completed: 88/100 (GOOD, approved with follow-ups)
   - [2025-09-30 HH:MMZ] Polish Group A completed: JSDoc + README architecture section
   - [2025-09-30 HH:MMZ] Polish Group B completed: Unit tests for lib/ modules
   - [2025-09-30 HH:MMZ] Polish Group C completed: QA tests pass, performance <500ms, snapshot resolved
   - [2025-09-30 HH:MMZ] Final review: 100/100 (EXCELLENT, ready for merge)
   ```

**Evidence:**
- QA logs at `.genie/cli/snapshots/qa-*-post-refactor.log` with 100% pass rate
- Performance log shows average <500ms
- Snapshot validation returns 17/17 match OR documented variance in wish
- Wish status log includes all timestamps and final score

**Expected Score Contribution:** +4 pts (2 for QA tests, 1 for performance, 1 for status log)

**Suggested personas:** `qa`, `project-manager`

---

## Verification Plan

**After Each Group:**
```bash
# Build
npm run build

# Run tests (Group B)
pnpm test

# Validate snapshots (Group C)
bash .genie/cli/snapshots/validate-against-baseline.sh .genie/cli/snapshots/baseline-20250930-140453
```

**Final Validation:**
```bash
# All validation commands from wish
npm run build                  # ✅ Must pass
pnpm test                      # ✅ Must pass (Group B)
wc -l src/genie.ts             # ✅ 121 lines
grep -c "^/\*\*" src/lib/*.ts  # ✅ ≥11 JSDoc blocks (Group A)
cat .genie/cli/snapshots/qa-codex-post-refactor.log   # ✅ 100% pass (Group C)
cat .genie/cli/snapshots/qa-claude-post-refactor.log  # ✅ 100% pass (Group C)
cat .genie/cli/snapshots/perf-startup-post-refactor.txt # ✅ <500ms (Group C)
bash .genie/cli/snapshots/validate-against-baseline.sh .genie/cli/snapshots/baseline-20250930-140453  # ✅ 17/17 or documented (Group C)
```

**Evidence Storage:**
- JSDoc comments: inline in `@.genie/cli/src/lib/*.ts`
- README architecture: `@.genie/cli/README.md:60-90`
- Unit tests: `@.genie/cli/src/__tests__/*.test.ts`
- QA logs: `@.genie/cli/snapshots/qa-*-post-refactor.log`
- Performance: `@.genie/cli/snapshots/perf-startup-post-refactor.txt`
- Final review: Update `@.genie/wishes/cli-modularization/qa/review-20250930-162800.md` with new score or create `review-20250930-HHMMSS.md`

---

## Branch & Tracker

**Strategy:** Continue on existing branch `feat/cli-modularization` (refactoring already complete, polish is incremental)

**Rationale:** All code changes happened in Groups 0→A+B→C. Polish tasks are non-breaking documentation + tests + evidence capture. No new refactoring risk.

**Tracker:** TBD (forge will generate task IDs)

**Git Workflow:**
- Commit after each group: `git commit -m "Polish Group A: JSDoc + README architecture"`
- Final commit: `git commit -m "Polish: reach 100/100 EXCELLENT (QA tests + perf + status)"`
- Squash merge to main with PR title: `feat(cli): modularization + polish (100/100 EXCELLENT)`

---

## Technical Approach

**TDD Strategy:** N/A (code already written, adding tests retroactively)
**Testing Layers:**
- Integration: Existing snapshots ✅
- Unit: New tests for lib/ modules (Group B)
- Smoke: QA parameter tests (Group C)

**Integration Points:**
- Documentation: No breaking changes, additive only
- Tests: Isolated unit tests, no mocks needed for most modules (use fixtures)
- Evidence: Read-only operations (QA tests, performance measurement)

**Performance Criteria:**
- CLI startup <500ms (Group C validation)
- No regression in build time or test execution time

---

## Next Actions

1. **Run `/forge cli-modularization-polish` using this brief** to generate execution tasks:
   - Group A: Documentation (JSDoc + README)
   - Group B: Unit Tests (lib/ modules)
   - Group C: Evidence Capture (QA + perf + status)

2. **Execute Groups A → B → C sequentially** (no parallel execution needed, tasks are small):
   - Group A: `./genie run polish "@.genie/wishes/cli-modularization-polish/task-a.md"`
   - Group B: `./genie run tests "@.genie/wishes/cli-modularization-polish/task-b.md"`
   - Group C: `./genie run qa "@.genie/wishes/cli-modularization-polish/task-c.md"`

3. **Approval Gates:**
   - ✅ Before Group A: Review planned JSDoc format and README structure
   - ✅ Before Group B: Approve test framework and coverage target
   - ✅ Before Group C: Confirm QA test commands and performance measurement approach
   - ✅ Before merge: Review final score (must be 100/100), all evidence present

4. **Post-Completion:**
   - Update `@.genie/wishes/cli-modularization-wish.md` completion score: `100/100`
   - Update wish status: `COMPLETED`
   - Update `@.genie/product/roadmap.md` Phase 1 with completion note
   - Create PR with review report and forge plan links
   - Merge to main
   - Celebrate 🎉

---

## Files to Create/Update

**New Files:**
- `@.genie/reports/planning-brief-cli-polish-20250930.md` (this document) ✅
- `@.genie/wishes/cli-modularization-polish/task-a.md` (forge output)
- `@.genie/wishes/cli-modularization-polish/task-b.md` (forge output)
- `@.genie/wishes/cli-modularization-polish/task-c.md` (forge output)
- `@.genie/cli/src/__tests__/*.test.ts` (Group B)
- `@.genie/cli/snapshots/qa-codex-post-refactor.log` (Group C)
- `@.genie/cli/snapshots/qa-claude-post-refactor.log` (Group C)
- `@.genie/cli/snapshots/perf-startup-post-refactor.txt` (Group C)

**Updated Files:**
- `@.genie/cli/src/lib/*.ts` (Group A: add JSDoc)
- `@.genie/cli/README.md` (Group A: add Architecture section)
- `@.genie/wishes/cli-modularization-wish.md` (Group C: update status log and completion score)
- `@.genie/wishes/cli-modularization/qa/review-20250930-162800.md` (Group C: update or create new review with 100/100)
- `@.genie/product/roadmap.md` (Post-merge: mark Phase 1 milestone complete)

---

**Planning Confidence:** High (all gaps documented with specific recovery paths, no unknowns)
**Risk Level:** Low (no code refactoring, only additive polish tasks)
**Blocker Watch:** QA parameter test failures (would require bug fix before 100/100)

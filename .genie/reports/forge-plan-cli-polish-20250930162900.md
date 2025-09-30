# Forge Plan – CLI Modularization Polish (100/100 Target)

**Generated:** 2025-09-30 16:29:00Z
**Wish:** @.genie/wishes/cli-modularization-wish.md
**Planning Brief:** @.genie/reports/planning-brief-cli-polish-20250930.md
**Task Files:** `.genie/wishes/cli-modularization-polish/task-*.md`
**Branch:** feat/cli-modularization (continue existing)

## Summary

Close 12-point gap from current 88/100 (GOOD tier) to 100/100 (EXCELLENT tier) by completing deferred polish tasks across three focused groups:
- **Group A (Documentation):** JSDoc comments + README architecture section → +4 pts
- **Group B (Unit Tests):** Tests for 4 critical lib/ modules → +4 pts
- **Group C (Evidence):** QA parameter tests + performance baseline + status update → +4 pts

**Key Risks:**
- QA parameter test failures would block 100/100 (mitigation: fix bugs immediately, re-run tests)
- Performance >500ms would require investigation or acceptance with justification
- Snapshot variance already exists (16/17 match), document as cosmetic

**Dependencies:**
- All code refactoring complete (Groups 0→A+B→C from original wish)
- Groups A→B→C sequential (A first for JSDoc, B for tests, C for validation)

## Spec Contract (from planning brief)

**Scope:**
- Add JSDoc comments to all 11 lib/ modules (types, utils, config, cli-parser, agent-resolver, session-helpers, async, background-manager-instance, config-defaults, executor-registry, view-helpers)
- Update CLI README with Architecture section mapping new module structure
- Write unit tests for 4 critical modules (agent-resolver, session-helpers, config, cli-parser) with ≥80% coverage
- Run QA parameter tests for both executors (Codex 22 params, Claude 9 params)
- Capture performance baseline (<500ms CLI startup target)
- Resolve snapshot variance (16/17 match: document or re-baseline)
- Update wish status log with completion timestamps and final 100/100 score

**Out of Scope:**
- Code refactoring (already complete)
- New features or functionality changes
- Performance optimizations beyond measurement
- Utility file consolidation (3-point stretch goal deferred)

**Success Metrics:**
- JSDoc count: ≥11 blocks (one per module)
- README Architecture section: ~30 lines with dependency diagram
- Unit test coverage: ≥80% for 4 modules
- QA test pass rate: 100% (31/31 parameters: 22 Codex + 9 Claude)
- Performance: <500ms average CLI startup over 10 runs
- Snapshots: 17/17 match OR documented variance
- Final score: 100/100 (EXCELLENT tier)

**External Tasks:**
- TBD (forge will generate task IDs if tracker integration enabled)

**Dependencies:**
- Existing refactored CLI code (genie.ts 121 lines, lib/*.ts modules, commands/*.ts handlers)
- QA test agents at `.genie/agents/qa/*-parameter-test.md`
- Baseline snapshots at `.genie/cli/snapshots/baseline-20250930-140453/`

---

## Proposed Groups

### Group A – Documentation Polish

**Scope:** Add JSDoc comments to all 11 lib/ modules and create README Architecture section

**Inputs:**
- `@.genie/cli/src/lib/*.ts` (11 modules)
- `@.genie/cli/README.md` (current architecture overview, needs expansion)

**Deliverables:**
- JSDoc comments on public functions/interfaces in all 11 modules
- README **Architecture** section (~30 lines) with module map and dependency diagram
- Clear documentation of types → lib → commands → genie.ts dependency flow

**Evidence:**
- **Location:** `.genie/wishes/cli-modularization-polish/evidence-group-a.md`
- **Contents:** Files modified list, JSDoc count, README diff, build verification

**Evaluation Matrix Impact:**
- Implementation / Documentation: +4 pts (2 for inline comments, 2 for external docs)
- Targets wish checkpoints: "Inline comments where complexity exists" (2 pts), "Updated relevant external docs" (2 pts)

**Branch:** feat/cli-modularization (continue existing)

**Tracker:** TBD

**Task File:** `@.genie/wishes/cli-modularization-polish/task-a.md`

**Suggested Personas:** polish

**Dependencies:** None (first in polish sequence)

**Twin Gates:** None (straightforward documentation task)

**Validation Hooks:**
```bash
# Build verification
cd .genie/cli && npm run build

# JSDoc count
grep -rh "^/\*\*" .genie/cli/src/lib/*.ts | wc -l  # Expected: ≥11

# README diff
git diff .genie/cli/README.md | grep -E "^\+.*Architecture"  # Expected: new section visible
```

**Success Criteria:**
- All tests green
- JSDoc count ≥11
- README renders correctly with Architecture section

**Target Score:** 92/100 after Group A (88 + 4)

---

### Group B – Unit Test Coverage

**Scope:** Write unit tests for 4 critical lib/ modules with ≥80% line coverage

**Inputs:**
- `@.genie/cli/src/lib/agent-resolver.ts` (122 lines, complex logic)
- `@.genie/cli/src/lib/session-helpers.ts` (81 lines, session queries)
- `@.genie/cli/src/lib/config.ts` (178 lines, configuration logic)
- `@.genie/cli/src/lib/cli-parser.ts` (39 lines, argument parsing)
- Test framework check: `@.genie/cli/package.json`

**Deliverables:**
- Test directory: `.genie/cli/src/__tests__/` or `.genie/cli/tests/`
- 4 test files: agent-resolver.test.ts, session-helpers.test.ts, config.test.ts, cli-parser.test.ts
- Each test file with ≥3 test cases (happy path, edge cases, error handling)
- Coverage report showing ≥80% line coverage for tested modules
- Test framework configuration (if needed): vitest.config.ts, package.json updates

**Evidence:**
- **Location:** `.genie/wishes/cli-modularization-polish/evidence-group-b.md`
- **Contents:** Test files created, test execution output, coverage report, bugs found (if any)

**Evaluation Matrix Impact:**
- Implementation / Test Coverage: +4 pts (2 for unit tests, 2 for execution evidence)
- Targets wish checkpoints: "Unit tests for new behavior" (2 pts, retroactive for extracted modules), "Evidence of test execution captured" (2 pts)

**Branch:** feat/cli-modularization (continue existing)

**Tracker:** TBD

**Task File:** `@.genie/wishes/cli-modularization-polish/task-b.md`

**Suggested Personas:** tests, qa

**Dependencies:**
- **Prior group:** Group A (JSDoc may help understand module contracts, but not blocking)
- **Prerequisite:** Test framework installed (check package.json; install Vitest if missing)

**Twin Gates:** None (standard unit testing task)

**Validation Hooks:**
```bash
# Run tests
cd .genie/cli && pnpm test

# Coverage report
pnpm test:coverage

# Build verification
npm run build

# Coverage check for each module
cat coverage/coverage-summary.json | grep -E "(agent-resolver|session-helpers|config|cli-parser)"  # Expected: ≥80% each
```

**Success Criteria:**
- All tests pass
- Coverage ≥80% for 4 tested modules
- Build succeeds after test creation
- No new bugs introduced (tests validate existing behavior)

**Risk Mitigation:**
- If tests reveal bugs: Document in evidence, fix in separate commits, update snapshots if behavior changed intentionally

**Target Score:** 96/100 after Group B (92 + 4)

---

### Group C – Evidence Capture & Status Update

**Scope:** Run QA parameter tests, capture performance baseline, resolve snapshot variance, update wish status log

**Inputs:**
- `@.genie/agents/qa/codex-parameter-test.md` (22 Codex parameters)
- `@.genie/agents/qa/claude-parameter-test.md` (9 Claude parameters)
- `@.genie/cli/snapshots/baseline-20250930-140453/` (baseline for validation)
- `@.genie/wishes/cli-modularization-wish.md:610-622` (Status Log section)

**Deliverables:**
- **QA Test Logs:**
  - `.genie/cli/snapshots/qa-codex-post-refactor.log` (22/22 params pass)
  - `.genie/cli/snapshots/qa-claude-post-refactor.log` (9/9 params pass)
- **Performance Baseline:**
  - `.genie/cli/snapshots/perf-startup-post-refactor.txt` (average <500ms)
- **Snapshot Resolution:**
  - Option A: Re-baseline (17/17 match)
  - Option B: Document variance as cosmetic (16/17 acceptable)
- **Status Log Update:**
  - Timestamps for Groups A/B/C completion
  - Final 100/100 score and EXCELLENT verdict
  - PR creation note

**Evidence:**
- **Location:** `.genie/wishes/cli-modularization-polish/evidence-group-c.md`
- **Contents:** QA test results, performance metrics, snapshot resolution, status log updates, verification summary

**Evaluation Matrix Impact:**
- Implementation / Test Coverage: +2 pts (QA tests count as integration validation evidence)
- Verification / Evidence Quality: +1 pt (performance baseline captured)
- Verification / Validation Completeness: +0 pts (snapshot variance acceptable or resolved)
- Verification / Review Thoroughness: +1 pt (status log updated with timestamps)
- **Total:** +4 pts (closes final gap)

**Branch:** feat/cli-modularization (continue existing)

**Tracker:** TBD

**Task File:** `@.genie/wishes/cli-modularization-polish/task-c.md`

**Suggested Personas:** qa, project-manager

**Dependencies:**
- **Prior groups:** Group A (documentation) and Group B (unit tests) should be complete
- **Prerequisite:** QA test agents exist at `.genie/agents/qa/*-parameter-test.md`

**Twin Gates:**
- **Pre-execution (optional):** `consensus` mode to decide on snapshot variance resolution (re-baseline vs document)

**Validation Hooks:**
```bash
# QA tests (CRITICAL: must pass 100%)
./genie run qa/codex-parameter-test "Post-refactor validation" > .genie/cli/snapshots/qa-codex-post-refactor.log 2>&1
./genie run qa/claude-parameter-test "Post-refactor validation" > .genie/cli/snapshots/qa-claude-post-refactor.log 2>&1

# Check for failures
grep -i "fail\|error" .genie/cli/snapshots/qa-codex-post-refactor.log
grep -i "fail\|error" .genie/cli/snapshots/qa-claude-post-refactor.log

# Performance baseline
for i in {1..10}; do /usr/bin/time -f "%e" ./genie --help 2>&1 | tail -1; done | awk '{sum+=$1; count++} END {print "Average: " sum/count "s"}' | tee .genie/cli/snapshots/perf-startup-post-refactor.txt

# Snapshot validation
bash .genie/cli/snapshots/validate-against-baseline.sh .genie/cli/snapshots/baseline-20250930-140453

# Status log check
grep "100/100" .genie/wishes/cli-modularization-wish.md
```

**Success Criteria:**
- QA tests: 100% pass rate (31/31 parameters)
- Performance: <500ms average CLI startup
- Snapshots: 17/17 match OR 16/17 with documented variance
- Status log: Updated with all timestamps and final 100/100 score

**Risk Mitigation:**
- **RISK-3 (QA failures):** BLOCKER for 100/100. Mitigation: Fix bugs immediately, re-run tests, do NOT claim 100/100 until all green.
- **RISK-4 (Performance >500ms):** Document in evidence, investigate, accept with justification OR optimize before 100/100.
- **RISK-5 (Snapshot re-baseline breaks CI):** Use Option B (document variance) unless re-baselining is thoroughly tested.

**Target Score:** 100/100 after Group C (96 + 4) ✅ **EXCELLENT TIER**

---

## Validation Hooks (All Groups)

### Pre-Execution (Before Group A)
```bash
# Verify current state
cd /home/namastex/workspace/automagik-genie
git status  # Should be on feat/cli-modularization branch
wc -l .genie/cli/src/genie.ts  # Should be 121 lines
npm run build  # Should pass
```

### After Each Group
```bash
# Build verification
cd .genie/cli && npm run build

# Group A specific
grep -rh "^/\*\*" src/lib/*.ts | wc -l  # ≥11 after Group A

# Group B specific
pnpm test  # All pass after Group B
pnpm test:coverage  # ≥80% for 4 modules after Group B

# Group C specific
cat .genie/cli/snapshots/qa-codex-post-refactor.log  # 100% pass after Group C
cat .genie/cli/snapshots/perf-startup-post-refactor.txt  # <500ms after Group C
grep "100/100" .genie/wishes/cli-modularization-wish.md  # Final score visible after Group C
```

### Final Validation (After Group C)
```bash
# All validation commands from wish
npm run build                                    # ✅ Must pass
pnpm test                                        # ✅ All tests pass
wc -l .genie/cli/src/genie.ts                   # ✅ 121 lines
grep -c "^/\*\*" .genie/cli/src/lib/*.ts        # ✅ ≥11 JSDoc blocks
cat .genie/cli/snapshots/qa-codex-post-refactor.log   # ✅ 100% pass
cat .genie/cli/snapshots/qa-claude-post-refactor.log  # ✅ 100% pass
cat .genie/cli/snapshots/perf-startup-post-refactor.txt # ✅ <500ms
bash .genie/cli/snapshots/validate-against-baseline.sh .genie/cli/snapshots/baseline-20250930-140453  # ✅ 17/17 or documented
grep "100/100" .genie/wishes/cli-modularization-wish.md  # ✅ Final score updated
```

---

## Evidence Storage Paths

**Per-Group Evidence:**
- Group A: `.genie/wishes/cli-modularization-polish/evidence-group-a.md`
- Group B: `.genie/wishes/cli-modularization-polish/evidence-group-b.md`
- Group C: `.genie/wishes/cli-modularization-polish/evidence-group-c.md`

**Artifacts:**
- QA logs: `.genie/cli/snapshots/qa-{codex,claude}-post-refactor.log`
- Performance: `.genie/cli/snapshots/perf-startup-post-refactor.txt`
- Test coverage: `.genie/cli/coverage/` (generated by vitest)
- Review update: `.genie/wishes/cli-modularization/qa/review-20250930-162800.md` (update with final 100/100) OR create new review report

**Final Report:**
- Update existing review report with new score OR
- Create `.genie/wishes/cli-modularization/qa/review-20250930-HHMMSS.md` with 100/100 verdict

---

## Approval Log

- **[2025-09-30 16:29Z]** Planning brief created: @.genie/reports/planning-brief-cli-polish-20250930.md
- **[2025-09-30 16:29Z]** Forge plan created: @.genie/reports/forge-plan-cli-polish-20250930162900.md
- **[2025-09-30 16:29Z]** Task files created: @.genie/wishes/cli-modularization-polish/task-{a,b,c}.md
- **[Pending]** Human approval before Group A execution: Review JSDoc format and README structure
- **[Pending]** Human approval before Group B execution: Approve test framework and coverage target
- **[Pending]** Human approval before Group C execution: Confirm QA test commands and snapshot resolution strategy
- **[Pending]** Human approval before final merge: Review 100/100 score and all evidence

---

## Follow-up Checklist

### Before Execution
- [ ] Review task files: `.genie/wishes/cli-modularization-polish/task-{a,b,c}.md`
- [ ] Approve JSDoc format (Group A)
- [ ] Approve test framework and coverage target (Group B)
- [ ] Confirm QA test commands (Group C)
- [ ] Confirm snapshot resolution strategy: re-baseline vs document (Group C)

### During Execution
- [ ] Execute Group A: `./genie run polish "@.genie/wishes/cli-modularization-polish/task-a.md"`
- [ ] Verify Group A evidence: JSDoc count, README diff, build passes
- [ ] Commit Group A: `git commit -m "docs(cli): add JSDoc to lib modules + README architecture"`
- [ ] Execute Group B: `./genie run tests "@.genie/wishes/cli-modularization-polish/task-b.md"`
- [ ] Verify Group B evidence: Tests pass, coverage ≥80%, build passes
- [ ] Commit Group B: `git commit -m "test(cli): add unit tests for lib modules"`
- [ ] Execute Group C: `./genie run qa "@.genie/wishes/cli-modularization-polish/task-c.md"`
- [ ] Verify Group C evidence: QA 100% pass, performance <500ms, status log updated
- [ ] Commit Group C: `git commit -m "chore(cli): polish complete - 100/100 EXCELLENT"`

### After Completion
- [ ] Update wish completion score: `100/100` in `.genie/wishes/cli-modularization-wish.md`
- [ ] Update wish status: `COMPLETED`
- [ ] Update review report with final 100/100 verdict
- [ ] Create PR: `feat(cli): modularization + polish (100/100 EXCELLENT)`
- [ ] PR body includes: wish link, review link, planning brief link, forge plan link, score progression
- [ ] Merge to main with squash
- [ ] Update `@.genie/product/roadmap.md` Phase 1: mark CLI quality gates complete
- [ ] Celebrate 🎉

---

## CLI Commands for Execution

### Sequential Execution (Recommended)
```bash
# Group A: Documentation
./genie run polish "@.genie/wishes/cli-modularization-polish/task-a.md"

# Wait for completion, review evidence
./genie view <sessionId-A> --full
cat .genie/wishes/cli-modularization-polish/evidence-group-a.md

# Commit Group A
git add .genie/cli/src/lib/*.ts .genie/cli/README.md
git commit -m "docs(cli): add JSDoc to lib modules + README architecture"

# Group B: Unit Tests
./genie run tests "@.genie/wishes/cli-modularization-polish/task-b.md"

# Wait for completion, review evidence
./genie view <sessionId-B> --full
cat .genie/wishes/cli-modularization-polish/evidence-group-b.md

# Commit Group B
git add .genie/cli/src/__tests__/*.test.ts .genie/cli/vitest.config.ts
git commit -m "test(cli): add unit tests for lib modules (agent-resolver, session-helpers, config, cli-parser)"

# Group C: Evidence Capture
./genie run qa "@.genie/wishes/cli-modularization-polish/task-c.md"

# Wait for completion, review evidence
./genie view <sessionId-C> --full
cat .genie/wishes/cli-modularization-polish/evidence-group-c.md

# Commit Group C
git add .genie/cli/snapshots/qa-*.log .genie/cli/snapshots/perf-*.txt .genie/wishes/cli-modularization-wish.md
git commit -m "chore(cli): polish complete - 100/100 EXCELLENT (QA tests + perf + status)"
```

### Parallel Execution (NOT Recommended)
Groups are sequential by design (A provides JSDoc for B, B completes tests before C validates). Do NOT run in parallel.

---

## Branch Strategy

**Approach:** Continue on existing `feat/cli-modularization` branch

**Rationale:**
- All code refactoring complete in Groups 0→A+B→C (original wish)
- Polish tasks are non-breaking, additive only:
  - Group A: Documentation (JSDoc + README)
  - Group B: Tests (retroactive unit tests)
  - Group C: Evidence (QA validation + status update)
- No new refactoring risk, low merge conflict risk
- Clean history: Original refactoring + Polish as separate commit groups

**Alternative:** Create `feat/cli-modularization-polish` sub-branch
- Only if main branch protection requires separate PR for polish
- Merge back to `feat/cli-modularization` before final PR to main

**Final PR:** `feat(cli): modularization + polish (100/100 EXCELLENT)` → main

---

## Score Progression

| Milestone | Score | Tier | Notes |
|-----------|-------|------|-------|
| After original refactoring (Groups 0→A+B→C) | 88/100 | GOOD | Review completed 2025-09-30 16:28Z |
| After Polish Group A (documentation) | 92/100 | GOOD+ | JSDoc + README architecture |
| After Polish Group B (unit tests) | 96/100 | GOOD++ | Tests for 4 critical modules |
| After Polish Group C (evidence) | **100/100** | **EXCELLENT** | QA tests + perf + status ✅ |

**Gap Closed:** 12 points (9 Implementation + 3 Verification)
**Final Tier:** EXCELLENT (90-100 range)
**Ready for Merge:** ✅ After human review of final score and evidence

---

## Risk Summary

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| QA parameter test failures | **CRITICAL** | Fix bugs immediately, re-run tests, block 100/100 until pass | Monitor in Group C |
| Performance >500ms | MEDIUM | Document, investigate, accept with justification OR optimize | Measure in Group C |
| Snapshot re-baseline breaks CI | LOW | Use Option B (document variance) unless re-baseline tested | Decide in Group C |
| Unit tests reveal bugs | MEDIUM | Document, fix separately, update snapshots if needed | Handle in Group B |
| Test framework not installed | LOW | Install Vitest, configure, update package.json | Check in Group B |

**Overall Risk Level:** LOW (no code refactoring, additive polish only)

---

**Forge Plan Confidence:** High (all gaps documented, execution path clear, no unknowns)
**Execution Time Estimate:** ~5 hours total (2h Group A, 2h Group B, 1h Group C)
**Blocker Watch:** QA parameter test failures in Group C (would require bug fixes before 100/100)

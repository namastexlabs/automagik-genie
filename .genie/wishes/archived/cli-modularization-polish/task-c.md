# Task C: Evidence Capture & Status Update

**Wish:** @.genie/wishes/cli-modularization-wish.md
**Planning Brief:** @.genie/reports/planning-brief-cli-polish-20250930.md
**Group:** C - Evidence (QA tests + performance + status)
**Tracker:** TBD
**Persona:** qa, project-manager
**Branch:** feat/cli-modularization (continue existing)
**Status:** pending
**Target Score Contribution:** +4/100 points

## Scope

Run QA parameter tests for both executors (Codex 22 params, Claude 9 params), capture performance baseline (<500ms startup target), resolve snapshot variance, and update wish status log with completion timestamp and final 100/100 score.

## Context & Background

**Current State:**
- CLI refactoring complete, Groups A+B (documentation + tests) in progress
- **Gap:** QA parameter tests not run or captured (-2 pts)
- **Gap:** Performance baseline not measured (-1 pt)
- **Gap:** Snapshot variance unresolved (1/17 diff: list-sessions) (-1 pt, partial deduction)
- **Gap:** Wish status log missing completion timestamp (-1 pt)

**Review Findings:**
- Line 35: "Test execution evidence (0/2 pts) – Gap: No QA test logs captured"
- Line 56-57: "No performance baseline comparison captured (startup time target <500ms not validated)"
- Line 50: "1 snapshot diff (list-sessions shows 10 recent vs 0 in baseline due to sessions created during testing)"
- Line 62: "Status log updated (0/1 pt) – Gap: No completion timestamp in wish status log"

**QA Tests:**
- `@.genie/agents/qa/codex-parameter-test.md` – Validates all 22 Codex executor parameters
- `@.genie/agents/qa/claude-parameter-test.md` – Validates all 9 Claude executor parameters

## Advanced Prompting Instructions

<context_gathering>
Goal: Execute validation commands, capture outputs, verify success criteria.

Method:
1. Review QA test agent specs to understand validation approach
2. Check current snapshot baseline directory path
3. Identify wish status log location
4. Prepare commands for QA tests, performance measurement, snapshot validation

Early stop: Once you have all commands ready to execute and evidence storage paths defined.
</context_gathering>

<task_breakdown>
1. [Discovery] Locate QA agent specs, baseline snapshot directory, wish status log section
2. [Execution] Run QA parameter tests (Codex + Claude), measure performance, validate/document snapshot variance
3. [Documentation] Update wish status log with timestamps and final score, create evidence summary
4. [Verification] Confirm all artifacts captured, QA tests pass 100%, performance <500ms, status log complete
</task_breakdown>

<SUCCESS CRITERIA>
✅ QA Codex test executed: `./genie run qa/codex-parameter-test "Post-refactor validation"` → 100% pass
✅ QA Claude test executed: `./genie run qa/claude-parameter-test "Post-refactor validation"` → 100% pass
✅ QA logs captured: `.genie/cli/snapshots/qa-codex-post-refactor.log`, `qa-claude-post-refactor.log`
✅ Performance baseline measured: average <500ms over 10 runs of `./genie --help`
✅ Performance log captured: `.genie/cli/snapshots/perf-startup-post-refactor.txt`
✅ Snapshot variance resolved: either re-baselined (17/17 match) OR documented as acceptable (session state cosmetic diff)
✅ Wish status log updated with timestamps for Groups A/B/C and final 100/100 score
✅ Evidence summary created at `.genie/wishes/cli-modularization-polish/evidence-group-c.md`
</SUCCESS CRITERIA>

<NEVER DO>
❌ Skip QA tests or fake test results (CRITICAL: must pass 100%)
❌ Accept performance >500ms without investigation
❌ Ignore snapshot diff without documentation or re-baselining
❌ Forget to update wish status log (required for final score)
❌ Modify code to make tests pass (fix bugs separately if needed)
</NEVER DO>

## Inputs

**QA Test Agents:**
- `@.genie/agents/qa/codex-parameter-test.md` – 22 Codex parameters (sandbox, model, approval-policy, etc.)
- `@.genie/agents/qa/claude-parameter-test.md` – 9 Claude parameters (if applicable to CLI)

**Baseline Snapshots:**
- `@.genie/cli/snapshots/baseline-20250930-140453/` – Original pre-refactor baseline
- Current validation: 16/17 match, 1 diff (list-sessions.txt)

**Wish Status Log:**
- `@.genie/wishes/cli-modularization-wish.md:610-622` – Status Log section (needs timestamps and final score)

**Performance Target:**
- CLI startup time <500ms for `./genie --help` (average over 10 runs)

## Deliverables

### 1. QA Parameter Tests

**Execute tests:**
```bash
# From project root
./genie run qa/codex-parameter-test "Post-refactor validation: test all 22 Codex parameters" > .genie/cli/snapshots/qa-codex-post-refactor.log 2>&1

./genie run qa/claude-parameter-test "Post-refactor validation: test all 9 Claude parameters" > .genie/cli/snapshots/qa-claude-post-refactor.log 2>&1
```

**Review logs for pass/fail:**
```bash
# Check for failures
grep -i "fail\|error\|❌" .genie/cli/snapshots/qa-codex-post-refactor.log
grep -i "fail\|error\|❌" .genie/cli/snapshots/qa-claude-post-refactor.log

# Count passes
grep -c "✅\|pass" .genie/cli/snapshots/qa-codex-post-refactor.log
grep -c "✅\|pass" .genie/cli/snapshots/qa-claude-post-refactor.log
```

**Expected:** 100% pass rate for both tests (22/22 Codex, 9/9 Claude)

**If failures found:**
1. Document in evidence file
2. Spawn `./genie run bug-reporter` with failure details
3. Update wish with blocker status
4. Do NOT proceed to final 100/100 until fixed

### 2. Performance Baseline

**Measure CLI startup time:**
```bash
cd /home/namastex/workspace/automagik-genie

for i in {1..10}; do
  /usr/bin/time -f "%e" ./genie --help 2>&1 | tail -1
done | awk '{sum+=$1; count++} END {print "Average startup time: " sum/count "s (" sum/count*1000 "ms)"}' | tee .genie/cli/snapshots/perf-startup-post-refactor.txt
```

**Expected:** Average <500ms (0.500s)

**If performance >500ms:**
1. Document in evidence file
2. Investigate (profiling, module load times)
3. Optional: Create follow-up performance optimization task
4. Decision: Accept current performance with justification OR fix before 100/100

### 3. Snapshot Variance Resolution

**Current status:** 16/17 snapshots match, 1 diff (list-sessions.txt shows 10 recent sessions vs 0 in baseline)

**Option A: Re-baseline (17/17 match)**
```bash
# Clear session state
rm -f .genie/state/agents/sessions.json  # CAUTION: loses active sessions

# Re-capture baseline
cd .genie/cli
./snapshots/capture-baseline.sh

# Re-validate
bash snapshots/validate-against-baseline.sh snapshots/baseline-$(date +%Y%m%d)-HHMMSS
```

**Option B: Document variance as acceptable**
- Add note to wish: "Snapshot variance: list-sessions.txt shows session count fluctuation (cosmetic, non-functional)"
- Rationale: Session state is dynamic during development; CLI behavior is preserved (verified by 16/17 match)
- Update review report: Change -1 pt deduction to 0 pts with justification

**Recommendation:** Option B (document variance) unless re-baselining is trivial and risk-free

### 4. Wish Status Log Update

**Location:** `@.genie/wishes/cli-modularization-wish.md:610-622`

**Add entries:**
```markdown
## Status Log

[... existing entries ...]

- [2025-09-30 14:05Z] Groups 0→A+B→C completed, baseline snapshot captured
- [2025-09-30 16:28Z] Review completed: 88/100 (GOOD, approved with follow-ups)
- [2025-09-30 HH:MMZ] Polish Group A completed: JSDoc + README architecture section (+4 pts, 92/100)
- [2025-09-30 HH:MMZ] Polish Group B completed: Unit tests for lib/ modules (+4 pts, 96/100)
- [2025-09-30 HH:MMZ] Polish Group C completed: QA tests pass, performance <500ms, snapshot documented (+4 pts)
- [2025-09-30 HH:MMZ] Final review: 100/100 (EXCELLENT, ready for merge)
- [2025-09-30 HH:MMZ] PR created: feat(cli): modularization + polish (100/100 EXCELLENT)
```

**Also update completion score at top:**
```markdown
**Completion Score:** 100/100 (updated by `/review`)
```

## Validation

### QA Test Verification
```bash
# Both logs must exist and show 100% pass
ls -lh .genie/cli/snapshots/qa-*-post-refactor.log

# Check for failures
grep -i "fail\|error" .genie/cli/snapshots/qa-codex-post-refactor.log
grep -i "fail\|error" .genie/cli/snapshots/qa-claude-post-refactor.log

# Expected: No failures
```

### Performance Verification
```bash
cat .genie/cli/snapshots/perf-startup-post-refactor.txt

# Expected output format:
# Average startup time: 0.412s (412ms)
```

### Snapshot Verification
```bash
cd /home/namastex/workspace/automagik-genie
bash .genie/cli/snapshots/validate-against-baseline.sh .genie/cli/snapshots/baseline-20250930-140453

# Expected: 17/17 match (if re-baselined) OR 16/17 with documented variance
```

### Status Log Verification
```bash
grep "100/100" .genie/wishes/cli-modularization-wish.md

# Expected: Completion score and final review entry visible
```

## Dependencies

- **Prior groups:** Group A (documentation) and Group B (unit tests) should be complete
- **Prerequisite:** QA test agents must exist at `.genie/agents/qa/*-parameter-test.md`

## Evidence

**Storage Path:** `.genie/wishes/cli-modularization-polish/evidence-group-c.md`

**Contents:**
```markdown
# Group C Evidence: QA Tests + Performance + Status Update

## QA Test Results

### Codex Parameter Test
**Command:** `./genie run qa/codex-parameter-test "Post-refactor validation"`
**Log:** `.genie/cli/snapshots/qa-codex-post-refactor.log`
**Result:** [✅ PASS / ❌ FAIL]
**Parameters tested:** 22/22
**Failures:** [0 / list any failures]

### Claude Parameter Test
**Command:** `./genie run qa/claude-parameter-test "Post-refactor validation"`
**Log:** `.genie/cli/snapshots/qa-claude-post-refactor.log`
**Result:** [✅ PASS / ❌ FAIL]
**Parameters tested:** 9/9
**Failures:** [0 / list any failures]

## Performance Baseline

**Command:** [performance measurement script]
**Log:** `.genie/cli/snapshots/perf-startup-post-refactor.txt`
**Result:** Average startup time: [X]ms
**Target:** <500ms
**Status:** [✅ PASS / ❌ FAIL]

## Snapshot Variance Resolution

**Validation:** `bash snapshots/validate-against-baseline.sh baseline-20250930-140453`
**Result:** [16/17 with documented variance / 17/17 after re-baseline]
**Resolution:** [Option A: re-baselined / Option B: documented as cosmetic]
**Justification:** [explanation]

## Wish Status Log

**Updated:** [✅ YES / ❌ NO]
**Final score:** 100/100
**Timestamps added:** [Groups A/B/C + final review]

## Verification Summary

- [✅] QA tests: 100% pass (31/31 parameters)
- [✅] Performance: <500ms startup time
- [✅] Snapshots: 17/17 or documented variance
- [✅] Status log: Complete with timestamps and 100/100 score

## Blockers (if any)

- [List any blockers that prevent 100/100 score]

## Next Steps

- [Create PR, merge to main, update roadmap]
```

## Technical Constraints

- **Reasoning effort:** medium (execute commands, analyze outputs, update documentation)
- **Verbosity:** high for evidence capture (detailed logs and metrics), low for status updates
- **Branch:** feat/cli-modularization (continue existing branch)
- **Approval gate:** Human review of QA test results and final score before merge

## Evaluation Matrix Impact

**Verification Phase:**
- **Test execution evidence (2 pts):** QA test logs captured
- **Evidence Quality (1 pt):** Performance baseline captured
- **Validation Completeness (1 pt):** Snapshot variance resolved/documented
- **Review Thoroughness (1 pt):** Status log updated with timestamps

**Implementation Phase:**
- **Test Coverage (0 pts, already in Group B):** QA tests count as integration validation

**Expected Contribution:** +4/100 points (closes final 33% of gap)

**Final Score:** 88 (review) + 4 (Group A) + 4 (Group B) + 4 (Group C) = **100/100 (EXCELLENT)**

## Follow-ups

- After completion: Update review report with final 100/100 score
- Create PR: `feat(cli): modularization + polish (100/100 EXCELLENT)`
- PR body:
  ```markdown
  ## Summary
  Completes CLI modularization (genie.ts 2,105→121 lines, 94.3% reduction) with polish:
  - ✅ JSDoc comments for all lib/ modules
  - ✅ README architecture overview
  - ✅ Unit tests (≥80% coverage for 4 critical modules)
  - ✅ QA parameter tests (31/31 pass)
  - ✅ Performance validated (<500ms startup)
  - ✅ Snapshot validation (16/17 or 17/17)

  ## Wish & Review
  - Wish: @.genie/wishes/cli-modularization-wish.md
  - Review: @.genie/wishes/cli-modularization/qa/review-20250930-162800.md
  - Planning Brief: @.genie/reports/planning-brief-cli-polish-20250930.md
  - Forge Plan: [this document]

  ## Score Progression
  - Initial: 88/100 (GOOD)
  - After Group A: 92/100 (documentation)
  - After Group B: 96/100 (unit tests)
  - After Group C: 100/100 (QA + evidence) ✅ EXCELLENT

  ## Verification
  - Build: ✅ passes
  - Tests: ✅ all passing (unit + integration + QA)
  - Snapshots: ✅ validated
  - Performance: ✅ <500ms
  ```
- Merge to main with squash
- Update `@.genie/product/roadmap.md` Phase 1: mark CLI quality gates complete
- Celebrate 🎉

## Risk Mitigation

**RISK-3: QA parameter tests may fail (BLOCKER for 100/100)**
- Mitigation:
  1. If failures found: Document in evidence, spawn bug-reporter
  2. Fix bugs in separate commits
  3. Re-run QA tests until 100% pass
  4. Do NOT claim 100/100 until all tests green

**RISK-4: Performance >500ms**
- Mitigation:
  1. Document in evidence with actual measurement
  2. Investigate (profiling, module imports)
  3. Decision: Accept with justification OR optimize before 100/100
  4. If accepted: Update review report to note performance is acceptable but exceeds target

**RISK-5: Snapshot re-baseline breaks CI**
- Mitigation: Use Option B (document variance) unless re-baselining is thoroughly tested

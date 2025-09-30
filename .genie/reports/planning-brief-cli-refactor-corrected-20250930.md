# Planning Brief: CLI Refactoring (Evidence-Based Reanalysis)

**Date:** 2025-09-30
**Analyst:** Claude Sonnet 4.5
**Status:** RECOMMEND NO-GO (minimal value, high risk)
**Roadmap Phase:** Phase 1 (Instrumentation & Telemetry)

---

## Executive Summary

Previous refactoring proposal was based on inflated assumptions:
- Claimed ~1,826 lines extractable from genie.ts → **Reality: ~1,200 lines possible, with high coupling risk**
- Claimed ~346 lines of log viewer duplication → **Reality: ~22 lines of actual duplication (sliceForLatest)**
- Claimed ~155 lines of executor duplication → **Reality: polymorphic implementations, NOT duplicates**

**Corrected Analysis:**
- **Actual duplication:** ~22 lines (sliceForLatest function already exists in transcript-utils.ts but not used)
- **Realistic extraction:** ~1,200 lines from genie.ts with significant circular dependency risk
- **Realistic savings:** ~150 lines total (7% reduction, not 16%)
- **Effort:** Medium (M) due to testing burden, not Small (S)
- **Risk:** High (refactoring working code with complex execution modes)

**Recommendation:** Table the refactoring. Focus Phase 1 energy on Evidence Checklist enforcement and done-report coverage per roadmap.

---

## Evidence: Baseline Metrics

### File Inventory (wc -l output)

```
2105  genie.ts
 466  executors/codex-log-viewer.ts
 400  executors/codex.ts
 342  views/help.ts
 289  executors/claude-log-viewer.ts
 244  views/background.ts
 237  executors/transcript-utils.ts (existing shared utilities)
 205  executors/claude.ts
 157  views/chat.ts
 147  view/view-model.ts
 147  background-manager.ts
 142  executors/__demo__/transcript-utils-demo.ts
 127  session-store.ts
 105  views/runs.ts
  97  executors/types.ts
  85  views/agent-catalog.ts
  76  views/stop.ts
  46  view/theme.ts
  45  views/common.ts
  37  executors/index.ts
```

**Total CLI codebase:** ~5,300 lines
**genie.ts proportion:** 40% of codebase (2,105 / 5,300)

### genie.ts Structure Analysis

**Function count:** 51 functions in 2,105 lines = ~41 lines/function average

**Command handlers (7 functions):**
- `runChat`: 113 lines (484-596)
- `runContinue`: 135 lines (996-1130)
- `runView`: 369 lines (1205-1573) ⚠️ LARGEST
- `runRuns`: ~44 lines (1132-1176)
- `runList`: ~29 lines (1176-1205)
- `runStop`: ~65 lines (1575-1640)
- `runHelp`: ~43 lines (1784-1827)

**Transcript parsing in genie.ts:**
- `buildTranscriptFromEvents`: 128 lines (1936-2063)
- `sliceTranscriptForLatest`: 22 lines (2064-2085)

**Configuration & utilities:** ~1,200 lines across 44 functions

### Duplication Analysis

#### Log Viewer Files (codex vs claude)

**Diff statistics:**
- Codex-specific lines: 294 lines
- Claude-specific lines: 118 lines
- **Total differences:** 412 lines

**Actual duplication candidates:**
1. `sliceForLatest` function: 22 lines (IDENTICAL logic, only differs in comments)
   - Location: codex-log-viewer.ts:383-404, claude-log-viewer.ts:221-240
   - **Already exists in transcript-utils.ts:24-51** ✅
   - Fix: Delete from both log viewers, import from transcript-utils

**Conclusion:** Log viewers are **NOT duplicates** — they're polymorphic parsers for different JSONL formats:
- Codex: parses `response_item`, `agent_message`, `reasoning`, MCP events, patches, exec commands
- Claude: parses `system`, `session_id`, message content blocks

**Evidence:**
```bash
diff -u codex-log-viewer.ts claude-log-viewer.ts | head -100
# Shows parseConversation() has completely different logic (184 lines removed, 94 lines added)
```

#### Executor Files (codex vs claude)

**Diff statistics:**
- Different lines: 368 lines (out of 400 codex + 205 claude)

**Structural similarity:** Both implement `Executor` interface with:
- `buildRunCommand()`
- `buildResumeCommand()`
- `resolvePaths()`
- `mergeExecConfig()` / `mergeResumeConfig()`
- `collectExecOptions()` (codex only)
- `applyBinarySpecToCommand()` (codex only)

**Conclusion:** Executors are **polymorphic implementations**, NOT duplicates:
- Codex: npx wrapper, 30+ CLI flags, model/sandbox/reasoning config
- Claude: direct binary, 6 CLI flags, minimal config

**Evidence:**
- codex.ts:41-68 (buildRunCommand): 28 lines
- claude.ts:24-60 (buildRunCommand): 37 lines
- Logic is fundamentally different (npx vs direct, different flag sets)

#### genie.ts Internal Duplication

**Transcript parsing:** 150 lines (buildTranscriptFromEvents + sliceTranscriptForLatest)
- Used only for `./genie view` when executor log viewer unavailable
- Fallback for CLI raw log parsing

**Potential extraction:**
- Move `buildTranscriptFromEvents` → `transcript-utils.ts` (128 lines)
- Delete `sliceTranscriptForLatest`, use `transcript-utils.sliceForLatest` (22 lines saved)
- **Savings:** 22 lines (buildTranscriptFromEvents still needed, just relocated)

### Circular Dependency Risk Assessment

**Current architecture:**
```
genie.ts (main CLI)
  → executors/index.ts (loader)
  → executors/codex.ts, claude.ts (polymorphic impls)
  → executors/transcript-utils.ts (shared utilities)
  → views/* (presentation)
  → background-manager.ts, session-store.ts (state)
```

**Proposed extraction (commands/):**
```
genie.ts (arg parser + dispatcher)
  → commands/run.ts, view.ts, list.ts, ... (command handlers)
  → executors/* (unchanged)
  → views/* (unchanged)
```

**Risk:** Command handlers need:
- `emitView()`
- `flushStartupWarnings()`, `flushRuntimeWarnings()`
- `formatPathRelative()`
- `findSessionEntry()`
- Session store access
- Path resolution

Either:
1. Create `lib/shared.ts` with these utilities → commands import → genie.ts imports → **potential circular dep**
2. Pass all dependencies as function params → **large function signatures, high coupling**
3. Create context object → **extra abstraction layer, more files**

**Verdict:** Refactoring increases complexity without significant benefit.

---

## Corrected Metrics: Realistic Targets

### Baseline (current state)
- **genie.ts:** 2,105 lines
- **Total CLI:** ~5,300 lines
- **Executor duplication:** 0 lines (polymorphic, not duplicate)
- **Log viewer duplication:** 22 lines (sliceForLatest)
- **Transcript parsing in genie.ts:** 150 lines (128 + 22)

### Target (post-refactoring)
- **genie.ts:** ~1,900 lines (extract 205 lines to lib/)
  - Move `buildTranscriptFromEvents` → transcript-utils.ts (128 lines)
  - Delete `sliceTranscriptForLatest`, use transcript-utils (22 lines)
  - Extract config utilities → lib/config.ts (55 lines)
- **codex-log-viewer.ts:** ~444 lines (delete sliceForLatest, import from transcript-utils)
- **claude-log-viewer.ts:** ~267 lines (delete sliceForLatest, import from transcript-utils)
- **Total CLI:** ~5,150 lines

**Net savings:** 150 lines (2.8% reduction)

### Effort vs Value

**Effort:** Medium (M)
- Extract utilities: 2-3 hours
- Update imports: 1 hour
- Test all commands: 3-4 hours (run, resume, view, list, stop, help, agents, background)
- Test both executors: 2 hours
- Regression testing: 2 hours
- **Total:** 10-12 hours

**Value:** Low
- 150 lines saved (2.8%)
- No new functionality
- No bug fixes
- No performance improvement
- Increases abstraction (new files, import paths)

**Risk:** Medium-High
- Breaking changes to working code
- Background execution mode complexity
- Executor polymorphism needs careful testing
- Session management edge cases

---

## Roadmap Alignment Check

### Current Phase: Phase 1 — Instrumentation & Telemetry

**Top priorities (from roadmap):**
1. ✅ Treat wish **Evidence Checklist** as gating deliverable
2. ✅ Add branch-specific checklists to every wish
3. ✅ Expand done-report coverage
4. ✅ Wire CLI diagnostics for missing sessions/presets

**CLI refactoring fit:**
- ❌ NOT in Phase 1 priorities
- ❌ Does NOT improve instrumentation or telemetry
- ❌ Does NOT improve evidence capture
- ❌ Does NOT improve done-report quality

**Phase 2 fit (Guided Self-Improvement):**
- Targets: prompt quality, guardrail clarity, CLI usability
- CLI refactoring → usability? **Only if adding features**
- Current refactoring → code organization only, no user-facing improvement

**Verdict:** Misaligned with roadmap. Defer to Phase 3+ or never.

---

## Risk Assessment

### High-Impact Risks

1. **Breaking background execution (CRITICAL)**
   - genie.ts:415-483 (`maybeHandleBackgroundLaunch`) tightly coupled with config/paths
   - Background runner detection via env vars (`INTERNAL_BACKGROUND_ENV`)
   - Session extraction timing (`sessionExtractionDelayMs`)
   - **Mitigation:** Would require extensive background mode testing (10+ scenarios)

2. **Executor polymorphism breakage (HIGH)**
   - codex.ts and claude.ts have different config merging strategies
   - Path resolution differs (codex has sessionsDir, claude doesn't)
   - **Mitigation:** Would need executor-specific test suites

3. **Session store corruption (HIGH)**
   - `runView` updates session entries when extracting session IDs from logs
   - `runStop` modifies session state
   - **Mitigation:** Would need session store invariant tests

### Medium-Impact Risks

4. **View rendering regression (MEDIUM)**
   - `runView` calls executor-specific log viewers (codex-log-viewer, claude-log-viewer)
   - Fallback to `buildTranscriptFromEvents` if executor unavailable
   - **Mitigation:** Would need view rendering tests for all modes (full, live, recent, default)

5. **Config merging edge cases (MEDIUM)**
   - `mergeDeep` handles nested config objects
   - `applyDefaults` interacts with CLI flags
   - **Mitigation:** Would need config fixture tests

### Low-Impact Risks

6. **Import path maintenance (LOW)**
   - More files → more import paths → more refactoring when structure changes
   - **Mitigation:** Accept higher maintenance burden

---

## Alternatives Analysis

### Option A: Full Refactoring (Original Plan)
- Extract commands to `commands/`
- Extract utilities to `lib/`
- Extract shared log viewer utilities to `transcript-utils.ts`

**Pros:**
- Smaller genie.ts (~900 lines)
- Logical separation of concerns

**Cons:**
- 10-12 hours effort
- High risk of breakage
- Minimal user-facing benefit
- Misaligned with roadmap

**Verdict:** ❌ NOT RECOMMENDED

### Option B: Minimal Cleanup (Duplication Only)
- Delete `sliceForLatest` from codex-log-viewer.ts and claude-log-viewer.ts
- Import from `transcript-utils.ts` instead
- Delete `sliceTranscriptForLatest` from genie.ts
- Import `sliceForLatest` from `transcript-utils.ts` in genie.ts

**Pros:**
- 22 lines saved
- Low risk (simple import change)
- 30 minutes effort

**Cons:**
- Minimal benefit (0.4% reduction)
- Still leaves genie.ts at 2,083 lines

**Verdict:** ✅ ACCEPTABLE (but optional)

### Option C: Table Refactoring, Focus on Phase 1
- No refactoring
- Focus on Evidence Checklist enforcement per roadmap
- Focus on done-report coverage per roadmap
- Revisit CLI refactoring in Phase 2+ if clear user benefit emerges

**Pros:**
- Zero risk
- Roadmap-aligned
- Immediate value delivery on instrumentation

**Cons:**
- genie.ts stays at 2,105 lines
- No code organization improvement

**Verdict:** ✅ RECOMMENDED

---

## Recommendation: NO-GO

### Rationale

1. **False assumptions invalidated:** Original claims of 16% reduction were based on miscounting polymorphic code as duplication.

2. **Realistic benefit minimal:** 150 lines (2.8%) saved after 10-12 hours effort → poor ROI.

3. **Roadmap misalignment:** Phase 1 priorities are instrumentation and evidence capture, not code organization.

4. **Risk > Value:** Medium-high risk of breaking working background execution, session management, and executor polymorphism for no user-facing improvement.

5. **Existing architecture is sound:**
   - genie.ts is the single entrypoint (by design)
   - Executors are polymorphic (by design)
   - Log viewers are format-specific (by design)
   - Commands are collocated for discoverability (acceptable)

### Alternative Recommendation: Option C

**Table the refactoring entirely.** Instead:

1. ✅ Enforce Evidence Checklist in all new wishes (Phase 1 priority)
2. ✅ Expand done-report coverage (Phase 1 priority)
3. ✅ Wire CLI diagnostics for missing sessions (Phase 1 priority)
4. ❓ (Optional) Apply Option B if you want the 22-line cleanup for completeness

**If refactoring becomes necessary later:**
- Wait for clear user benefit (e.g., adding plugin system, multi-executor support)
- Bundle with feature work to justify effort
- Ensure comprehensive test coverage first

---

## Evidence Summary Table

| Claim (Original) | Evidence | Correction |
|------------------|----------|------------|
| ~155 lines executor duplication | `diff codex.ts claude.ts → 368 different lines` | Polymorphic implementations, NOT duplicates |
| ~346 lines log viewer duplication | `diff codex-log-viewer.ts claude-log-viewer.ts → 412 different lines` | Format-specific parsers, NOT duplicates |
| ~22 lines sliceForLatest duplication | `diff sliceForLatest functions → 22 identical lines` | ✅ Confirmed (already in transcript-utils.ts) |
| ~1,826 lines extractable from genie.ts | `51 functions × 41 avg lines/function = 2,091` | Realistic: ~1,200 lines with high coupling risk |
| 16% total line reduction | `5,300 → 4,474 = 826 lines` | Realistic: ~150 lines (2.8%) |
| Small (S) effort | Command handlers + executor + testing | Medium (M): 10-12 hours |

---

## Next Actions

1. ❌ **Do NOT proceed with cli-refactor wish** (invalidate @.genie/wishes/cli-refactor-wish.md)
2. ✅ **Return to Phase 1 roadmap priorities:**
   - Evidence Checklist enforcement
   - Done-report expansion
   - CLI diagnostics for session management
3. ❓ **(Optional) Apply minimal cleanup:**
   - Delete duplicate `sliceForLatest` implementations
   - Import from `transcript-utils.ts`
   - 30-minute task, low risk
4. 📋 **Document learning in AGENTS.md:**
   - Validate polymorphism vs duplication claims
   - Check line count arithmetic before planning
   - Align effort with roadmap priorities

---

## Appendix: Commands for Verification

```bash
# File inventory
find .genie/cli/src -type f -name "*.ts" -exec wc -l {} \; | sort -rn

# Function count in genie.ts
grep -c "^function\|^async function\|^export function" .genie/cli/src/genie.ts

# Executor diff
diff .genie/cli/src/executors/codex.ts .genie/cli/src/executors/claude.ts | grep -E "^<|^>" | wc -l

# Log viewer diff
diff .genie/cli/src/executors/codex-log-viewer.ts .genie/cli/src/executors/claude-log-viewer.ts | head -100

# sliceForLatest comparison
diff -u <(sed -n '383,404p' .genie/cli/src/executors/codex-log-viewer.ts) \
        <(sed -n '221,240p' .genie/cli/src/executors/claude-log-viewer.ts)

# Verify transcript-utils has sliceForLatest
grep -n "export function sliceForLatest" .genie/cli/src/executors/transcript-utils.ts

# Command handler line counts
sed -n '484,596p' .genie/cli/src/genie.ts | wc -l  # runChat: 113 lines
sed -n '1205,1573p' .genie/cli/src/genie.ts | wc -l # runView: 369 lines
```

---

**Conclusion:** Evidence shows refactoring is not justified. Focus Phase 1 effort on instrumentation and evidence capture per roadmap priorities. Revisit CLI organization only when user-facing features demand it.
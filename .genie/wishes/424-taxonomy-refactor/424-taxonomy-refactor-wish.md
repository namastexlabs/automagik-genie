# 🔧 Taxonomy Refactoring: session → task, CLI Command Clarity WISH
**Status:** DRAFT
**GitHub Issue:** #424 – https://github.com/namastexlabs/automagik-genie/issues/424
**Roadmap Item:** Phase 1 – Instrumentation & Telemetry (@.genie/product/roadmap.md)
**Mission Link:** @.genie/product/mission.md §Self-Evolving Agents Need Structure
**Completion Score:** 0/100 (updated by `/review`)

## Evaluation Matrix (100 Points Total)

### Discovery Phase (30 pts)
- **Context Completeness (10 pts)**
  - [ ] All relevant files/docs referenced with @ notation (4 pts)
  - [ ] Background analysis captured in context ledger (3 pts)
  - [ ] Assumptions (ASM-#), decisions (DEC-#), risks documented (3 pts)
- **Scope Clarity (10 pts)**
  - [ ] Clear current state and target state defined (3 pts)
  - [ ] Spec contract complete with success metrics (4 pts)
  - [ ] Out-of-scope explicitly stated (3 pts)
- **Evidence Planning (10 pts)**
  - [ ] Validation commands specified with exact syntax (4 pts)
  - [ ] Artifact storage paths defined (3 pts)
  - [ ] Approval checkpoints documented (3 pts)

### Implementation Phase (40 pts)
- **Code Quality (15 pts)**
  - [ ] Follows project standards (@.genie/standards/*) (5 pts)
  - [ ] Minimal surface area changes, focused scope (5 pts)
  - [ ] Clean abstractions and patterns (5 pts)
- **Test Coverage (10 pts)**
  - [ ] Unit tests for new behavior (4 pts)
  - [ ] Integration tests for CLI workflows (4 pts)
  - [ ] Evidence of test execution captured (2 pts)
- **Documentation (5 pts)**
  - [ ] Updated CLI help text and examples (2 pts)
  - [ ] Updated MCP tool documentation (2 pts)
  - [ ] Context preserved for maintainers (1 pt)
- **Execution Alignment (10 pts)**
  - [ ] Stayed within spec contract scope (4 pts)
  - [ ] No unapproved scope creep (3 pts)
  - [ ] Dependencies and sequencing honored (3 pts)

### Verification Phase (30 pts)
- **Validation Completeness (15 pts)**
  - [ ] All validation commands executed successfully (6 pts)
  - [ ] Artifacts captured at specified paths (5 pts)
  - [ ] Edge cases and error paths tested (4 pts)
- **Evidence Quality (10 pts)**
  - [ ] Command outputs (failures → fixes) logged (4 pts)
  - [ ] Before/after grep counts captured (3 pts)
  - [ ] Test suite results documented (3 pts)
- **Review Thoroughness (5 pts)**
  - [ ] Human approval obtained at checkpoints (2 pts)
  - [ ] All blockers resolved or documented (2 pts)
  - [ ] Status log updated with completion timestamp (1 pt)

## Context Ledger
| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| User conversation 2025-11-01 (initial) | discussion | Initial taxonomy proposal: session→task, run↔talk swap, monitor tool | entire wish |
| User conversation 2025-11-01 (feedback) | requirements | Clarified `genie run` behavior: browser + monitoring + JSON output | Group D, spec contract |
| Ultrathink analysis | planning | 13,752 occurrences, 170 files, 4-phase execution plan | Group A, B, C |
| `@.genie/cli/src/genie.ts:94,133` | code | Command router (run/talk entry points) | Group B |
| `@.genie/cli/src/cli-core/session-service.ts` | code | Core session orchestration logic | Group A |
| `@.genie/mcp/src/lib/session-types.ts` | code | TypeScript interface definitions | Group A |
| `@.genie/mcp/src/server.ts` | code | MCP tool registrations | Group B |
| `@.genie/cli/src/commands/talk.ts` | code | Current browser-opening behavior (template for new `run`) | Group D |
| `@.genie/cli/src/commands/run.ts` | code | Current headless behavior (becomes `task`) | Group B |
| `@AGENTS.md` | docs | Quick Reference section with MCP examples | Group C |
| `@.genie/spells/*.md` | docs | Multiple spells reference MCP tools | Group C |
| Wait MCP tool (`mcp__wait__wait_minutes`) | external | Existing wait functionality, 2-1440 min range | Group D (monitoring pattern reference) |

### Context Variants Considered
- **C1**: Full automated search-replace across entire codebase (fast but risky)
- **C2**: Phased approach with type renames → file renames → CLI → docs (safer, traceable)
- **C3**: Manual file-by-file review and rename (slowest, highest precision)
- **Winner: C2** — Balances speed with safety; automated where safe, manual approval for critical changes

### Architecture Decision (DEC-1)
**Decision:** `genie run` becomes unified command serving both human and automation use cases
**Rationale:**
- Opens browser for human interaction (visual feedback, real-time monitoring)
- Monitors task via Forge WebSocket until completion
- Outputs JSON `{"task_url": "...", "result": "..."}` for automation capture
- **Result:** One command, dual purpose - elegant solution to both problems

## Discovery Summary
- **Primary analyst:** Human + AI collaborative ultrathink session
- **Key observations:**
  - Current terminology confusing: "run" = headless, "talk" = interactive (backwards!)
  - "Session" terminology throughout codebase but actual concept is "tasks" (persistent work units)
  - ~13,752 occurrences across 170 files (656 snake_case, 4,240 camelCase, 1,804 kebab-case)
  - Existing `mcp__wait__wait_minutes` tool provides time-based waiting pattern
  - Current `genie run` automation feature untested, may not work properly
  - Zero token cost impact (session/task same length)
  - **Architecture clarity (feedback):** `genie run` should serve BOTH human (browser) AND automation (JSON) use cases
- **Assumptions (ASM-#):**
  - ASM-1: User-facing CLI commands are the primary interface (highest visibility)
  - ASM-2: TypeScript type renames are safest when done before variable renames
  - ASM-3: Automated search-replace viable for 90% of changes
  - ASM-4: Backup directory will prevent catastrophic errors
  - ASM-5: Tests will catch breaking changes before user impact
  - ASM-6: Forge WebSocket provides task completion events (monitoring foundation)
  - ASM-7: Browser can open in fullscreen task view programmatically
- **Open questions (Q-#):**
  - Q-1: Should monitor tool be part of this wish or separate? (RESOLVED: Built into `genie run` directly)
  - Q-2: Deprecation period for MCP tools or hard cutover? (DECISION: TBD during implementation)
  - Q-3: Migration guide format (README vs separate doc)? (DECISION: TBD)
  - Q-4: Should `genie task` also support monitoring option? (DECISION: No, keep pure automation)
- **Risks:**
  - RISK-1: Breaking changes mid-session for active users (mitigation: backup + rollback plan)
  - RISK-2: Test failures from renamed types (mitigation: run tests after each phase)
  - RISK-3: Import path mismatches (mitigation: TypeScript compiler will catch)
  - RISK-4: Documentation inconsistency (mitigation: Group C focused on docs)
  - RISK-5: WebSocket monitoring complexity (mitigation: use existing Forge socket infrastructure)

## Executive Summary
Refactor Genie codebase to align terminology with natural language and user mental models. Rename "session" → "task" (persistent work units) throughout 13,752 occurrences. Transform `genie run` into unified command that opens browser (human interaction), monitors task completion (WebSocket), and outputs JSON (automation). Preserve headless automation via new `genie task` command. Result: Cognitive clarity, dual-purpose tooling, and foundation for advanced orchestration. Zero token cost, massive UX improvement.

## Current State
- **What exists today:**
  - CLI commands:
    - `genie run` (headless JSON output, designed for automation/capturing final output)
    - `genie talk` (interactive browser, opens task view but exits immediately)
  - Core types: `SessionInfo`, `SessionManager`, `session-service.ts`
  - MCP tools: `mcp__genie__run`, `mcp__genie__list_sessions`, `mcp__genie__view`
  - Variables throughout: `sessionId`, `session_id`, `session-id` (13,752 occurrences)
  - Documentation: `@AGENTS.md`, `@.genie/spells/*.md` reference "session" terminology
- **Gaps/Pain points:**
  - "Run" designed for automation but name suggests interactive use (cognitive dissonance)
  - "Talk" opens browser but doesn't monitor task completion
  - Current `genie run` may not work properly (untested automation output feature)
  - "Session" terminology doesn't match actual concept (tasks with persistent state)
  - No unified command that serves both human interaction AND automation needs
  - Missing automatic browser opening in fullscreen task view
  - No built-in task monitoring for completion detection

## Target State & Guardrails
- **Desired behaviour:**
  - **CLI: `genie run <agent> "<prompt>"`** (NEW unified behavior):
    - Starts task via Forge
    - Opens browser automatically in fullscreen task view
    - Monitors task until completion (built-in monitoring)
    - Outputs JSON on completion: `{"task_url": "...", "result": "..."}`
    - **Purpose:** Serves BOTH human interaction (browser) AND automation (JSON output capture)
  - **CLI: `genie task`** (preserves old `genie run` automation intent):
    - Headless execution only (no browser)
    - Immediate JSON output without monitoring
    - **Purpose:** Pure automation scenarios where browser is unwanted
  - Types: `TaskInfo`, `TaskManager`, `task-service.ts`
  - MCP tools: `mcp__genie__task`, `mcp__genie__list_tasks`, `mcp__genie__view_task`
  - Variables: `taskId`, `task_id`, `task-id` throughout codebase
  - Documentation: All references updated consistently
- **Non-negotiables:**
  - `genie run` MUST open browser in fullscreen task view
  - `genie run` MUST monitor task until completion
  - `genie run` MUST output JSON: `{"task_url": "...", "result": "..."}`
  - `genie task` remains pure automation (no browser, no monitoring)
  - Zero test failures after completion
  - Zero breaking changes for file-reading operations
  - Full backup before execution (rollback safety)
  - TypeScript compiler passes (no import errors)
  - Phased execution (types → files → CLI → docs)
  - Human approval before each phase commit

## Execution Groups

### Group A – Type & File Renames (Core Infrastructure)
- **Goal:** Rename TypeScript interfaces, types, and core files from session → task terminology
- **Surfaces:**
  - `@.genie/mcp/src/lib/session-types.ts` → `task-types.ts`
  - `@.genie/cli/src/cli-core/session-service.ts` → `task-service.ts`
  - `@.genie/mcp/src/lib/session-manager.ts` → `task-manager.ts`
  - `@.genie/cli/src/session-store.ts` → `task-store.ts`
  - `@.genie/cli/src/lib/session-helpers.ts` → `task-helpers.ts`
  - All imports referencing renamed files
- **Deliverables:**
  - Files renamed with git mv (preserve history)
  - All import statements updated
  - TypeScript interfaces renamed: `Session*` → `Task*`
  - Compiler passes with zero errors
- **Evidence:**
  - Store in `qa/group-a/`:
    - `file-renames.log` (git mv commands executed)
    - `import-updates.log` (files with updated imports)
    - `typescript-compile.log` (tsc output showing success)
- **Validation commands:**
  ```bash
  # Before: Count session type references
  grep -r "interface.*Session" .genie/mcp/src .genie/cli/src --include="*.ts" | wc -l

  # Execute renames
  git mv .genie/mcp/src/lib/session-types.ts .genie/mcp/src/lib/task-types.ts
  git mv .genie/cli/src/cli-core/session-service.ts .genie/cli/src/cli-core/task-service.ts
  # ... (remaining renames)

  # Update imports
  find .genie -name "*.ts" -exec sed -i 's/from ".*session-types"/from ".*task-types"/g' {} \;

  # Verify TypeScript compilation
  cd .genie/cli && pnpm run build
  cd .genie/mcp && pnpm run build

  # After: Verify session types removed
  grep -r "interface.*Session" .genie/mcp/src .genie/cli/src --include="*.ts" | wc -l  # Should be 0
  ```
- **Approval checkpoint:** Human reviews git diff before committing type renames

### Group B – Variable Renames & CLI Commands (Implementation Layer)
- **Goal:** Rename all variables (sessionId → taskId) and swap CLI commands (run ↔ talk)
- **Surfaces:**
  - All TypeScript files with `sessionId`, `session_id` variables
  - `@.genie/cli/src/genie.ts:94,133` (command router cases)
  - `@.genie/cli/src/commands/talk.ts` → rename to `run.ts`
  - `@.genie/cli/src/commands/[new]task.ts` (create from old run.ts)
  - `@.genie/cli/src/cli-core/handlers/run.ts` → `task.ts`
  - All MCP tool definitions in `@.genie/mcp/src/server.ts`
- **Deliverables:**
  - Automated search-replace for variables (snake_case, camelCase, kebab-case)
  - CLI command routing swapped
  - Command files renamed and routed correctly
  - MCP tools renamed: `mcp__genie__run` → `mcp__genie__task`
  - All help text and error messages updated
- **Evidence:**
  - Store in `qa/group-b/`:
    - `variable-renames.log` (grep counts before/after)
    - `cli-commands-test.log` (manual CLI invocation outputs)
    - `mcp-tools-test.log` (MCP tool invocation results)
- **Validation commands:**
  ```bash
  # Before: Count occurrences
  echo "session_id: $(grep -r 'session_id' .genie --include='*.ts' --include='*.js' | wc -l)"
  echo "sessionId: $(grep -r 'sessionId' .genie --include='*.ts' --include='*.js' | wc -l)"

  # Execute automated replacements (in order: specific → generic)
  find .genie -name "*.ts" -o -name "*.js" | xargs sed -i 's/session_id/task_id/g'
  find .genie -name "*.ts" -o -name "*.js" | xargs sed -i 's/sessionId/taskId/g'
  find .genie -name "*.ts" | xargs sed -i 's/\bSession\b/Task/g'
  find .genie -name "*.ts" -o -name "*.js" -o -name "*.md" | xargs sed -i 's/session-id/task-id/g'

  # Rename CLI command files
  git mv .genie/cli/src/commands/talk.ts .genie/cli/src/commands/run.ts
  git mv .genie/cli/src/commands/run.ts .genie/cli/src/commands/task.ts
  git mv .genie/cli/src/cli-core/handlers/run.ts .genie/cli/src/cli-core/handlers/task.ts

  # Update command router
  sed -i "s/case 'run':/case 'task':/" .genie/cli/src/genie.ts
  sed -i "s/case 'talk':/case 'run':/" .genie/cli/src/genie.ts

  # After: Verify counts
  echo "task_id: $(grep -r 'task_id' .genie --include='*.ts' --include='*.js' | wc -l)"
  echo "taskId: $(grep -r 'taskId' .genie --include='*.ts' --include='*.js' | wc -l)"

  # Test CLI commands
  genie run --help  # Should show interactive mode help
  genie task --help  # Should show headless mode help
  ```
- **Approval checkpoint:** Human tests both CLI commands manually before committing

### Group C – Documentation & Help Text (User-Facing Layer)
- **Goal:** Update all documentation, help text, and framework files to reflect new terminology
- **Surfaces:**
  - `@AGENTS.md` (Quick Reference section)
  - `@.genie/spells/*.md` (all spells referencing MCP tools)
  - `@.genie/cli/README.md`
  - `@.genie/mcp/README.md`
  - `@.genie/product/docs/mcp-interface.md`
  - All CLI help text and command descriptions
  - All error messages and user-facing strings
- **Deliverables:**
  - AGENTS.md Quick Reference updated with new MCP tool names
  - All spells updated to reference `mcp__genie__task` instead of `run`
  - README files updated with new CLI command examples
  - Help text showing correct command names and descriptions
  - Migration guide created for users
- **Evidence:**
  - Store in `qa/group-c/`:
    - `docs-diff.txt` (git diff of all markdown files)
    - `help-text-capture.txt` (output of all --help commands)
    - `grep-verification.log` (confirm no "session" references remain)
- **Validation commands:**
  ```bash
  # Before: Count "session" references in docs
  grep -r "session" .genie --include="*.md" | wc -l
  grep -r "mcp__genie__run" .genie --include="*.md" | wc -l

  # Manual updates using learn spell for framework files
  # (AGENTS.md, spells/*.md updated via surgical edits)

  # Automated updates for README files
  find .genie -name "*.md" | xargs sed -i 's/genie run/genie task/g'
  find .genie -name "*.md" | xargs sed -i 's/genie talk/genie run/g'
  find .genie -name "*.md" | xargs sed -i 's/mcp__genie__run/mcp__genie__task/g'
  find .genie -name "*.md" | xargs sed -i 's/mcp__genie__list_sessions/mcp__genie__list_tasks/g'

  # Capture all help text
  genie --help > qa/group-c/help-text-capture.txt
  genie run --help >> qa/group-c/help-text-capture.txt
  genie task --help >> qa/group-c/help-text-capture.txt

  # After: Verify "session" removed (except .genie/.session file)
  grep -r "session" .genie --include="*.md" --exclude=".session" | wc -l  # Should be minimal

  # Verify new terminology present
  grep -r "mcp__genie__task" .genie --include="*.md" | wc -l  # Should match old count
  ```
- **Approval checkpoint:** Human reviews all documentation changes before final commit

### Group D – Task Monitoring & Unified `genie run` (NEW Feature)
- **Goal:** Transform `genie run` into unified command with browser opening, task monitoring, and JSON output
- **Surfaces:**
  - `@.genie/cli/src/commands/run.ts` (new implementation, merge talk.ts behavior + monitoring)
  - `@.genie/cli/src/commands/task.ts` (preserve old run.ts headless behavior)
  - `@.genie/cli/src/lib/task-monitor.ts` (NEW - WebSocket monitoring logic)
  - Forge WebSocket client integration
  - Browser opening logic (fullscreen task view)
  - JSON output formatter
- **Deliverables:**
  - `genie run` opens browser automatically in fullscreen task view
  - WebSocket listener monitors task completion
  - JSON output on completion: `{"task_url": "https://...", "result": "final output"}`
  - `genie task` preserves pure headless automation (no browser, no monitoring)
  - Help text updated to describe new behavior
- **Evidence:**
  - Store in `qa/group-d/`:
    - `browser-test.log` (manual test: browser opened successfully)
    - `monitoring-test.log` (task completion detection via WebSocket)
    - `json-output-sample.json` (captured output from automation test)
    - `comparison-test.log` (run vs task behavior side-by-side)
- **Validation commands:**
  ```bash
  # Test unified run command (browser + monitoring + JSON)
  genie run master "Quick test task" > qa/group-d/run-output.json
  # Expected: Browser opens, task runs, JSON printed on completion

  # Verify JSON structure
  cat qa/group-d/run-output.json | jq .
  # Expected: {"task_url": "...", "result": "..."}

  # Test pure headless task command (no browser)
  genie task code "Headless test" > qa/group-d/task-output.json
  # Expected: No browser, immediate JSON output

  # Test monitoring accuracy (long-running task)
  genie run master "Sleep for 30 seconds then return success" &
  # Expected: Browser opens, waits, outputs JSON after ~30s

  # Verify WebSocket connection
  # (Manual: Check Forge logs for WebSocket connections during run)
  ```
- **Implementation notes:**
  - Reuse existing `talk.ts` browser-opening logic
  - Add WebSocket listener to Forge socket (task completion events)
  - Format final output as JSON before exit
  - Fullscreen task view URL: `http://localhost:{port}/tasks/{task_id}`
  - Monitor pattern: Similar to `mcp__wait__wait_minutes` but event-driven (WebSocket)
- **Approval checkpoint:** Human tests both `run` and `task` commands, verifies behavior differences

## Verification Plan

### Test Suite Execution
```bash
# Run full test suite
cd /home/namastex/workspace/automagik-genie
pnpm test

# Capture results
pnpm test > .genie/wishes/424-taxonomy-refactor/qa/test-results.log 2>&1
```

### CLI Smoke Tests
```bash
# Test new command names
genie run master "Test interactive mode"
genie task code "Test headless mode"

# Test MCP tools via CLI
# (Requires MCP server running)
```

### Rollback Validation
```bash
# Verify backup exists
ls -la .genie/backups/taxonomy-refactor-*/

# Test rollback process
cp -r .genie/backups/taxonomy-refactor-YYYYMMDD/.genie .
git checkout .
pnpm test  # Should pass with old code
```

### Evidence Checklist
- **Validation commands (exact):**
  - Group A: TypeScript compilation, grep counts, git mv logs
  - Group B: Variable rename counts, CLI manual tests, MCP tool tests
  - Group C: Documentation diffs, help text capture, final grep verification
- **Artefact paths (where evidence lives):**
  - `qa/group-a/` - Type & file rename evidence
  - `qa/group-b/` - Variable rename & CLI evidence
  - `qa/group-c/` - Documentation update evidence
  - `qa/test-results.log` - Full test suite output
  - `reports/` - Blocker reports (if any)
- **Approval checkpoints (human sign-off required):**
  1. Before Group A commit: Review type renames and import changes
  2. Before Group B commit: Manually test both CLI commands
  3. Before Group C commit: Review all documentation changes
  4. Final approval: Review complete git diff and test results

## <spec_contract>
- **Scope:**
  - Rename all "session" terminology to "task" throughout codebase (~13,752 occurrences)
  - Transform `genie run` into unified command:
    - Opens browser automatically in fullscreen task view
    - Monitors task via Forge WebSocket until completion
    - Outputs JSON `{"task_url": "...", "result": "..."}` for automation
    - Serves BOTH human interaction (browser) AND automation (JSON capture)
  - Create `genie task` command (preserves old `genie run` headless behavior):
    - Pure automation (no browser)
    - Immediate JSON output (no monitoring)
  - Update MCP tool names: `mcp__genie__run` → `mcp__genie__task`, `list_sessions` → `list_tasks`
  - Update all documentation, help text, and framework files
  - Maintain full test coverage (zero test failures)
  - Create backup and rollback plan
- **Out of scope:**
  - Standalone monitor tool (built into `genie run` instead)
  - Time-based waiting enhancements (separate wish)
  - Deprecation warnings for old MCP tools (decision deferred)
  - Migration automation for downstream repos (future work)
  - Changes to `.genie/.session` file format (stays as-is)
  - Optional monitoring for `genie task` (keep pure automation)
- **Success metrics:**
  - Zero occurrences of "Session" types in TypeScript code
  - Zero test failures after all changes
  - `genie run` opens browser AND monitors AND outputs JSON
  - `genie task` runs headless without browser
  - Browser opens in fullscreen task view automatically
  - WebSocket monitoring detects task completion accurately
  - JSON output format correct: `{"task_url": "...", "result": "..."}`
  - MCP tools functional with new names
  - Documentation 100% consistent with new terminology
  - Backup created and rollback tested
  - Token count neutral (±0 tokens)
- **GitHub issue:** #424
- **Dependencies:**
  - TypeScript 5.9 compiler
  - Full test suite passing before starting
  - Git for version control and file renames
  - pnpm for building CLI/MCP
  - Forge WebSocket infrastructure (task completion events)
  - Browser automation library (already in use)
- **Blockers:** None currently identified
</spec_contract>

## Blocker Protocol
1. Pause work and create `reports/blocker-<slug>-<timestamp>.md` inside the wish folder describing findings.
2. Notify owner and wait for updated instructions.
3. Resume only after the wish status/log is updated.

**Example blocker scenarios:**
- Test failures that can't be resolved
- Import path issues that break compilation
- MCP tool registration failures
- Unexpected breaking changes discovered

## Branch Strategy
- **Branch name:** `wish/424-taxonomy-refactor`
- **Base branch:** `dev` (experimental lane per roadmap)
- **Merge target:** `dev` first, then `main` after validation
- **Commit strategy:**
  - 3 commits (one per execution group)
  - Each commit passes tests independently
  - Descriptive commit messages with evidence links

## QA Protocol
- Run full test suite after each group completion
- Manual CLI testing for Group B (human validation)
- Documentation review for Group C (consistency check)
- Final integration test: Clone fresh repo, run `pnpm install`, test all commands
- Rollback test: Verify backup restore works

## Status Log
- [2025-11-01 15:30 UTC] Wish created (initial draft)
- [2025-11-01 15:45 UTC] GitHub issue #424 created
- [2025-11-01 16:00 UTC] User feedback received: unified `genie run` architecture clarified
- [2025-11-01 16:15 UTC] Wish updated with Group D (task monitoring & unified run command)
- [Pending] Human approval of updated wish document
- [Pending] Group A execution
- [Pending] Group B execution
- [Pending] Group D execution (NEW)
- [Pending] Group C execution
- [Pending] Final validation and merge

---

**Next Actions:**
1. Human reviews and approves this wish document (with Group D updates)
2. Create branch: `git checkout -b wish/424-taxonomy-refactor`
3. Create backup: `mkdir -p .genie/backups/taxonomy-refactor-$(date +%Y%m%d)`
4. Execute Group A (type & file renames)
5. Run tests, capture evidence, get approval
6. Execute Group B (variable renames & CLI base)
7. Run tests, capture evidence, get approval
8. Execute Group D (NEW - unified `genie run` with monitoring)
9. Run tests, capture evidence, get approval
10. Execute Group C (documentation)
11. Final validation, evidence compilation
12. Create Done Report
13. Merge to `dev` branch

**Wish saved at:** `@.genie/wishes/424-taxonomy-refactor/424-taxonomy-refactor-wish.md`

**Folder structure:**
```
.genie/wishes/424-taxonomy-refactor/
├── 424-taxonomy-refactor-wish.md  ✅ UPDATED with Group D
├── qa/
│   ├── group-a/  ✅ (type & file renames)
│   ├── group-b/  ✅ (variable renames & CLI)
│   ├── group-c/  ✅ (documentation)
│   └── group-d/  ✅ NEW (monitoring & unified run)
└── reports/  ✅
```

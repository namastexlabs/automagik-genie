# Task A: Documentation Polish

**Wish:** @.genie/wishes/cli-modularization-wish.md
**Planning Brief:** @.genie/reports/planning-brief-cli-polish-20250930.md
**Group:** A - Documentation (JSDoc + README Architecture)
**Tracker:** TBD
**Persona:** polish
**Branch:** feat/cli-modularization (continue existing)
**Status:** pending
**Target Score Contribution:** +4/100 points

## Scope

Add JSDoc comments to all 11 `lib/` modules and create a comprehensive **Architecture** section in the CLI README documenting the new module structure post-refactoring.

## Context & Background

**Current State:**
- CLI refactoring complete: genie.ts reduced from 2,105 to 121 lines (94.3%)
- 11 extracted lib/ modules: types, utils, config, cli-parser, agent-resolver, session-helpers, async, background-manager-instance, config-defaults, executor-registry, view-helpers
- 6 command modules: run, resume, list, view, stop, help
- **Gap:** 0/11 modules have JSDoc comments (-2 pts)
- **Gap:** README doesn't document new architecture (-2 pts)

**Review Findings:**
- Line 38-39 of review report: "No evidence of JSDoc or complexity comments in extracted modules reviewed"
- Line 39-40 of review report: "CLI README not updated with new module structure"
- Review score deduction: -4 pts (2 for inline comments, 2 for external docs)

## Advanced Prompting Instructions

<context_gathering>
Goal: Understand module responsibilities and current README structure to add value-driven documentation.

Method:
1. Read all 11 lib/*.ts files to identify public functions, interfaces, complex logic
2. Review .genie/cli/README.md to find insertion point for Architecture section (after Module Map, before Execution Flow)
3. Inspect command/*.ts modules briefly to understand dependency flow for README diagram

Early stop: Once you can explain each module's purpose, key exports, and dependency direction (types → lib → commands → genie.ts).
</context_gathering>

<task_breakdown>
1. [Discovery] Read lib/*.ts files, identify functions needing JSDoc (complex logic, public APIs), review README structure
2. [Implementation] Add JSDoc comments using /** */ format with @param, @returns, @example where helpful; insert Architecture section in README after line 60
3. [Verification] Verify build passes (npm run build), grep for JSDoc blocks (should find 11+), validate README renders correctly
</task_breakdown>

<SUCCESS CRITERIA>
✅ All 11 lib/*.ts modules have JSDoc comments on public functions/interfaces
✅ Complex modules (agent-resolver, session-helpers, config) have detailed JSDoc with examples
✅ Simple utilities (async, view-helpers) have concise JSDoc (1-2 lines)
✅ README includes **Architecture** section with module map and dependency flow diagram
✅ Architecture section shows: types → lib → commands → genie.ts (single direction, no circular deps)
✅ Build passes: `npm run build` exits 0
✅ JSDoc count: `grep -rh "^/\*\*" src/lib/*.ts | wc -l` returns ≥11
✅ README diff shows new section (~30 lines) between Module Map and Execution Flow
</SUCCESS CRITERIA>

<NEVER DO>
❌ Modify module logic or refactor code (documentation only)
❌ Add external documentation files (README update only)
❌ Change module names or file structure
❌ Skip trivial utilities (all 11 modules must have JSDoc)
❌ Create verbose comments for self-documenting code (be concise)
</NEVER DO>

## Inputs

**Source Files:**
- `@.genie/cli/src/lib/types.ts` – Shared TypeScript interfaces
- `@.genie/cli/src/lib/utils.ts` – Utilities (formatRelativeTime, sanitizeLogFilename, truncateText)
- `@.genie/cli/src/lib/config.ts` – Configuration management (loadConfig, applyDefaults, resolvePaths, prepareDirectories)
- `@.genie/cli/src/lib/cli-parser.ts` – Argument parsing (parseArguments)
- `@.genie/cli/src/lib/agent-resolver.ts` – Agent discovery (listAgents, resolveAgentIdentifier, loadAgentSpec, extractFrontMatter)
- `@.genie/cli/src/lib/session-helpers.ts` – Session queries (findSessionEntry, resolveDisplayStatus, getRuntimeWarnings)
- `@.genie/cli/src/lib/async.ts` – Async utilities
- `@.genie/cli/src/lib/background-manager-instance.ts` – Background manager singleton
- `@.genie/cli/src/lib/config-defaults.ts` – Default configuration constants
- `@.genie/cli/src/lib/executor-registry.ts` – Executor registration
- `@.genie/cli/src/lib/view-helpers.ts` – View rendering utilities

**Documentation:**
- `@.genie/cli/README.md` – Current architecture overview (needs Architecture section after line 60)

**References:**
- `@.genie/wishes/cli-modularization-wish.md` – Original refactoring spec
- `@.genie/wishes/cli-modularization/qa/review-20250930-162800.md` – Gap analysis

## Deliverables

### 1. JSDoc Comments (11 modules)

**Format:**
```typescript
/**
 * Brief description of function/interface purpose.
 * @param paramName - Parameter description
 * @returns Return value description
 * @example
 * const result = functionName(arg);
 * // result: expected output
 */
```

**Guidelines:**
- **Complex modules** (agent-resolver, session-helpers, config): Detailed JSDoc with @param, @returns, @example for non-trivial functions
- **Simple utilities** (async, view-helpers, config-defaults): Concise 1-2 line descriptions
- **Interfaces** (types.ts): Document each property with inline comments or /** */ blocks
- Focus on public APIs; private/internal functions can have brief inline comments

**Priority Functions (examples):**
- `agent-resolver.ts`: listAgents, resolveAgentIdentifier, loadAgentSpec, extractFrontMatter
- `session-helpers.ts`: findSessionEntry, resolveDisplayStatus
- `config.ts`: loadConfig, applyDefaults, resolvePaths, mergeDeep
- `cli-parser.ts`: parseArguments
- `utils.ts`: formatRelativeTime, sanitizeLogFilename

### 2. README Architecture Section

**Insertion Point:** After line 60 (after "Module Map" section), before "Execution Flow (happy path)"

**Content:**
```markdown
## Architecture (Post-Modularization)

Since September 2025, genie.ts has been refactored from a 2,105-line monolith into focused modules organized by responsibility. The new structure eliminates circular dependencies and reduces the main orchestrator to 121 lines.

### Dependency Flow
**Single Direction:** types → lib → commands → genie.ts (no circular dependencies)

```
┌─────────────────────────────────────────────────────────┐
│ genie.ts (121 lines)                                    │
│ Thin orchestrator: arg parsing → command dispatch       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ commands/*.ts (6 modules, ~1,280 lines)                 │
│ run, resume, list, view, stop, help                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ lib/*.ts (11 modules, ~630 lines)                       │
│ Utilities, config, agent resolution, session management │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ lib/types.ts (~50 lines)                                │
│ Foundation: CLIOptions, ParsedCommand, GenieConfig, ... │
└─────────────────────────────────────────────────────────┘
```

### Core Modules

**Foundation Layer:**
- `lib/types.ts` – Shared TypeScript interfaces (CLIOptions, ParsedCommand, ConfigPaths, GenieConfig, AgentSpec)

**Utility Layer:**
- `lib/cli-parser.ts` – Argument parsing (parseArguments)
- `lib/config.ts` – Configuration management (loadConfig, applyDefaults, resolvePaths, prepareDirectories, getStartupWarnings)
- `lib/agent-resolver.ts` – Agent discovery and spec loading (listAgents, resolveAgentIdentifier, loadAgentSpec, extractFrontMatter)
- `lib/session-helpers.ts` – Session queries (findSessionEntry, resolveDisplayStatus, getRuntimeWarnings)
- `lib/utils.ts` – Formatters and sanitizers (formatRelativeTime, formatPathRelative, truncateText, sanitizeLogFilename)
- `lib/async.ts` – Async utilities (sleep)
- `lib/background-manager-instance.ts` – Singleton access to BackgroundManager
- `lib/config-defaults.ts` – Default configuration constants
- `lib/executor-registry.ts` – Executor registration helpers
- `lib/view-helpers.ts` – View rendering utilities (emitView)

**Command Layer:**
- `commands/run.ts` – `genie run <agent> "<prompt>"` implementation (~500 lines)
- `commands/resume.ts` – `genie resume <sessionId> "<prompt>"` implementation (~160 lines)
- `commands/list.ts` – `genie list agents|sessions` implementation (~140 lines)
- `commands/view.ts` – `genie view <sessionId>` implementation (~360 lines)
- `commands/stop.ts` – `genie stop <sessionId>` implementation (~80 lines)
- `commands/help.ts` – `genie help` implementation (~40 lines)

**Orchestrator:**
- `genie.ts` – Thin entry point (121 lines) that parses arguments, loads config, and dispatches to command modules

### Refactoring Impact
- **Before:** genie.ts = 2,105 lines (40% of CLI codebase)
- **After:** genie.ts = 121 lines (94.3% reduction)
- **Total CLI size:** ~5,100 lines (saved ~200 lines through deduplication)
- **Circular dependencies:** 0 (enforced single-direction flow)
```

**Validation:**
- README renders correctly in markdown viewers
- Architecture section provides clear module overview and dependency diagram
- Insertion doesn't break existing section numbering

## Validation

### Build Verification
```bash
cd .genie/cli
npm run build
```
**Expected:** Exit code 0, no TypeScript errors

### JSDoc Count
```bash
grep -rh "^/\*\*" .genie/cli/src/lib/*.ts | wc -l
```
**Expected:** ≥11 (at least one JSDoc block per module)

### README Diff
```bash
git diff .genie/cli/README.md | grep -E "^\+.*Architecture"
```
**Expected:** New Architecture section visible in diff

### Manual Review
- Open each lib/*.ts file, verify JSDoc comments on public functions
- Read .genie/cli/README.md, confirm Architecture section exists between Module Map and Execution Flow
- Check dependency diagram is clear and accurate

## Dependencies

- None (Group A is first in polish sequence)
- Prerequisite: Existing refactored code (Groups 0→A+B→C from original wish)

## Evidence

**Storage Path:** `.genie/wishes/cli-modularization-polish/evidence-group-a.md`

**Contents:**
```markdown
# Group A Evidence: Documentation Polish

## Files Modified
- .genie/cli/src/lib/*.ts (11 files, JSDoc added)
- .genie/cli/README.md (Architecture section added)

## Verification Results
- Build: [✅ PASS / ❌ FAIL] + output
- JSDoc count: [number] blocks found
- README diff: [snippet of Architecture section]

## Before/After Comparison
- JSDoc blocks before: 0
- JSDoc blocks after: [number]
- README Architecture section: [added / not added]

## Next Steps
- [Any follow-ups or blockers]
```

## Technical Constraints

- **Reasoning effort:** medium (understand module responsibilities, write clear documentation)
- **Verbosity:** high for comments (clear, helpful documentation), low for status updates
- **Branch:** feat/cli-modularization (continue existing branch)
- **Approval gate:** Human review of JSDoc style and README structure before commit

## Evaluation Matrix Impact

**Implementation Phase:**
- **Documentation (2/2 pts recovered):**
  - Inline comments: 2 pts (JSDoc for all 11 modules)
  - Updated external docs: 2 pts (README Architecture section)

**Expected Contribution:** +4/100 points (closes 33% of gap)

## Follow-ups

- After completion: Run Group B (unit tests) which may benefit from JSDoc documentation
- Commit message: `docs(cli): add JSDoc to lib modules + README architecture section`
- Update review report with new score: 92/100 after Group A

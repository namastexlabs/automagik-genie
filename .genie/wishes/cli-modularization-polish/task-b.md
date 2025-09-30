# Task B: Unit Test Coverage

**Wish:** @.genie/wishes/cli-modularization-wish.md
**Planning Brief:** @.genie/reports/planning-brief-cli-polish-20250930.md
**Group:** B - Unit Tests (lib/ modules)
**Tracker:** TBD
**Persona:** tests, qa
**Branch:** feat/cli-modularization (continue existing)
**Status:** pending
**Target Score Contribution:** +4/100 points

## Scope

Write unit tests for 4 critical `lib/` modules (agent-resolver, session-helpers, config, cli-parser) to validate extracted logic independently. Achieve ≥80% line coverage for tested modules.

## Context & Background

**Current State:**
- CLI refactoring complete with comprehensive integration tests via snapshots (16/17 match baseline)
- **Gap:** No explicit unit tests for extracted lib/ modules (-2 pts)
- **Gap:** No QA test execution evidence captured (-2 pts, partially addressed by Group C)

**Review Findings:**
- Line 32-35 of review report: "Unit tests (2/4 pts) – Evidence: Snapshot validation = behavior test, but no explicit unit tests added for extracted modules"
- Line 35-36: "Test execution evidence (0/2 pts) – Gap: No QA test logs captured"
- Review score deduction: -4 pts total (2 for missing unit tests, 2 for execution evidence)

**Integration vs Unit:**
- Integration tests: ✅ COMPLETE (snapshot validation covers all CLI commands end-to-end)
- Unit tests: ❌ MISSING (lib/ modules not tested in isolation)

## Advanced Prompting Instructions

<context_gathering>
Goal: Understand module contracts and edge cases to write meaningful tests.

Method:
1. Read 4 target modules: agent-resolver.ts, session-helpers.ts, config.ts, cli-parser.ts
2. Identify public functions, parameters, return types, error cases
3. Check package.json for existing test framework (Vitest, Jest, or similar)
4. Review any existing test patterns in codebase

Early stop: Once you can list test cases for each function (happy path, edge cases, error handling).
</context_gathering>

<task_breakdown>
1. [Discovery] Read target modules, identify test framework, plan test structure (fixtures, mocks)
2. [Implementation] Create test directory, write unit tests for 4 modules with ≥80% coverage
3. [Verification] Run tests (pnpm test or npm test), capture coverage report, ensure all tests pass
</task_breakdown>

<SUCCESS CRITERIA>
✅ Test directory created: `.genie/cli/src/__tests__/` or `.genie/cli/tests/`
✅ 4 test files created: agent-resolver.test.ts, session-helpers.test.ts, config.test.ts, cli-parser.test.ts
✅ Each test file has ≥3 test cases covering happy path, edge cases, error handling
✅ Tests use fixtures/mocks where needed (avoid filesystem/network dependencies)
✅ All tests pass: `pnpm test` exits 0
✅ Coverage ≥80% for tested modules (agent-resolver, session-helpers, config, cli-parser)
✅ Coverage report captured at `.genie/cli/coverage/` or in test output
✅ Build succeeds after test creation: `npm run build` exits 0
</SUCCESS CRITERIA>

<NEVER DO>
❌ Modify module logic to make tests pass (fix bugs separately if found)
❌ Write integration tests (already covered by snapshots)
❌ Test trivial utilities (focus on complex modules: agent-resolver, session-helpers, config, cli-parser)
❌ Skip error case testing (edge cases are critical for coverage)
❌ Use real filesystem/network (use fixtures and mocks)
</NEVER DO>

## Inputs

**Source Modules:**
- `@.genie/cli/src/lib/agent-resolver.ts` – 122 lines, complex: filesystem traversal, frontmatter parsing, fuzzy matching
- `@.genie/cli/src/lib/session-helpers.ts` – 81 lines, queries: findSessionEntry, resolveDisplayStatus, getRuntimeWarnings
- `@.genie/cli/src/lib/config.ts` – 178 lines, logic: mergeDeep, resolvePaths, applyDefaults, prepareDirectories
- `@.genie/cli/src/lib/cli-parser.ts` – 39 lines, parsing: parseArguments with flag extraction

**Test Framework:**
- Check `@.genie/cli/package.json` for test script and framework (likely Vitest or Jest)
- If none exists, recommend Vitest (fast, TypeScript-native)

**References:**
- `@.genie/wishes/cli-modularization-wish.md:481-525` – Verification plan mentions test validation
- `@.genie/reports/planning-brief-cli-polish-20250930.md:Group B` – Unit test specification

## Deliverables

### 1. Test Directory Structure
```
.genie/cli/src/__tests__/          # or .genie/cli/tests/
├── agent-resolver.test.ts
├── session-helpers.test.ts
├── config.test.ts
├── cli-parser.test.ts
└── fixtures/                       # Optional: test data
    ├── mock-agents.json
    ├── mock-sessions.json
    └── mock-config.yaml
```

### 2. Test Files (4 modules)

**agent-resolver.test.ts** (Priority 1: most complex, 122 lines)
```typescript
import { describe, it, expect } from 'vitest';
import { resolveAgentIdentifier, listAgents, loadAgentSpec, extractFrontMatter } from '../lib/agent-resolver';

describe('resolveAgentIdentifier', () => {
  const mockAgents = [
    { id: 'plan', name: 'plan', path: '.genie/agents/plan.md' },
    { id: 'polish', name: 'polish', path: '.genie/agents/specialists/polish.md' },
    { id: 'planner', name: 'planner', path: '.genie/agents/planner.md' }
  ];

  it('resolves exact match', () => {
    const result = resolveAgentIdentifier('plan', mockAgents);
    expect(result.id).toBe('plan');
  });

  it('resolves unique prefix', () => {
    const result = resolveAgentIdentifier('pla', mockAgents);
    expect(result.id).toBe('plan'); // or 'planner' depending on algorithm
  });

  it('throws on ambiguous prefix', () => {
    expect(() => resolveAgentIdentifier('p', mockAgents)).toThrow(/ambiguous/i);
  });

  it('throws on no match', () => {
    expect(() => resolveAgentIdentifier('nonexistent', mockAgents)).toThrow(/not found/i);
  });
});

describe('extractFrontMatter', () => {
  it('parses YAML frontmatter', () => {
    const content = '---\nname: test\ncolor: blue\n---\nBody content';
    const result = extractFrontMatter(content);
    expect(result.name).toBe('test');
    expect(result.color).toBe('blue');
  });

  it('handles missing frontmatter', () => {
    const content = 'No frontmatter here';
    const result = extractFrontMatter(content);
    expect(result).toEqual({});
  });
});

// Add tests for listAgents, loadAgentSpec with mocked filesystem
```

**session-helpers.test.ts** (Priority 2: 81 lines, session queries)
```typescript
import { describe, it, expect } from 'vitest';
import { findSessionEntry, resolveDisplayStatus } from '../lib/session-helpers';

describe('findSessionEntry', () => {
  const mockSessions = [
    { sessionId: '01abc-123', agentId: 'plan', executor: 'codex', status: 'completed' },
    { sessionId: '01def-456', agentId: 'forge', executor: 'codex', status: 'running' }
  ];

  it('finds session by exact ID', () => {
    const result = findSessionEntry('01abc-123', mockSessions);
    expect(result.agentId).toBe('plan');
  });

  it('finds session by prefix', () => {
    const result = findSessionEntry('01abc', mockSessions);
    expect(result.sessionId).toBe('01abc-123');
  });

  it('returns undefined for no match', () => {
    const result = findSessionEntry('nonexistent', mockSessions);
    expect(result).toBeUndefined();
  });
});

describe('resolveDisplayStatus', () => {
  it('returns completed for finished session', () => {
    const status = resolveDisplayStatus('completed', false);
    expect(status).toMatch(/completed/i);
  });

  it('returns active for running session', () => {
    const status = resolveDisplayStatus('running', true);
    expect(status).toMatch(/active|running/i);
  });
});

// Add tests for getRuntimeWarnings
```

**config.test.ts** (Priority 3: 178 lines, configuration logic)
```typescript
import { describe, it, expect } from 'vitest';
import { mergeDeep, applyDefaults, resolvePaths } from '../lib/config';

describe('mergeDeep', () => {
  it('merges nested objects', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };
    const result = mergeDeep(target, source);
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  it('overwrites primitives', () => {
    const target = { a: 1 };
    const source = { a: 2 };
    const result = mergeDeep(target, source);
    expect(result.a).toBe(2);
  });

  it('handles arrays (replace, not merge)', () => {
    const target = { arr: [1, 2] };
    const source = { arr: [3, 4] };
    const result = mergeDeep(target, source);
    expect(result.arr).toEqual([3, 4]); // or [1,2,3,4] depending on implementation
  });
});

describe('applyDefaults', () => {
  it('applies missing defaults', () => {
    const options = { model: 'gpt-4' };
    const defaults = { model: 'gpt-5', sandbox: 'workspace-write' };
    applyDefaults(options, defaults);
    expect(options.model).toBe('gpt-4'); // user value preserved
    expect(options.sandbox).toBe('workspace-write'); // default applied
  });
});

// Add tests for resolvePaths, loadConfig (with mocked filesystem)
```

**cli-parser.test.ts** (Priority 4: 39 lines, argument parsing)
```typescript
import { describe, it, expect } from 'vitest';
import { parseArguments } from '../lib/cli-parser';

describe('parseArguments', () => {
  it('parses run command with agent and prompt', () => {
    const args = ['run', 'plan', 'Test prompt'];
    const result = parseArguments(args);
    expect(result.command).toBe('run');
    expect(result.args[0]).toBe('plan');
    expect(result.args[1]).toBe('Test prompt');
  });

  it('parses flags', () => {
    const args = ['run', 'plan', '--help'];
    const result = parseArguments(args);
    expect(result.options.requestHelp).toBe(true);
  });

  it('handles no command (defaults to help)', () => {
    const args = [];
    const result = parseArguments(args);
    expect(result.command).toBeUndefined(); // or 'help' depending on implementation
  });

  it('extracts session ID for resume command', () => {
    const args = ['resume', '01abc-123', 'Follow-up prompt'];
    const result = parseArguments(args);
    expect(result.command).toBe('resume');
    expect(result.args[0]).toBe('01abc-123');
  });
});
```

### 3. Test Configuration

**If test framework missing, add to package.json:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

**Create vitest.config.ts (if needed):**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/types.ts', 'src/__tests__/**']
    }
  }
});
```

## Validation

### Test Execution
```bash
cd .genie/cli
pnpm test
```
**Expected:** All tests pass, exit code 0

### Coverage Report
```bash
pnpm test:coverage
```
**Expected:** ≥80% line coverage for agent-resolver.ts, session-helpers.ts, config.ts, cli-parser.ts

### Build Verification
```bash
npm run build
```
**Expected:** Exit code 0 (tests don't break build)

### Coverage Evidence
```bash
cat .genie/cli/coverage/coverage-summary.json | grep -E "(agent-resolver|session-helpers|config|cli-parser)"
```
**Expected:** Line coverage ≥80% for each tested module

## Dependencies

- **Prior group:** Group A (JSDoc comments may help understand module contracts, but not blocking)
- **Test framework:** Check package.json; if missing, install Vitest

## Evidence

**Storage Path:** `.genie/wishes/cli-modularization-polish/evidence-group-b.md`

**Contents:**
```markdown
# Group B Evidence: Unit Test Coverage

## Files Created
- .genie/cli/src/__tests__/agent-resolver.test.ts
- .genie/cli/src/__tests__/session-helpers.test.ts
- .genie/cli/src/__tests__/config.test.ts
- .genie/cli/src/__tests__/cli-parser.test.ts
- .genie/cli/vitest.config.ts (if created)

## Test Execution Results
```
[pnpm test output]
```

## Coverage Report
```
[coverage summary for 4 modules]
```

## Coverage Metrics
- agent-resolver.ts: [X]% line coverage
- session-helpers.ts: [X]% line coverage
- config.ts: [X]% line coverage
- cli-parser.ts: [X]% line coverage

## Bugs Found (if any)
- [List any bugs discovered during testing]

## Next Steps
- [Follow-ups or recommended improvements]
```

## Technical Constraints

- **Reasoning effort:** high (understand module contracts, design edge cases, write meaningful tests)
- **Verbosity:** medium (clear test descriptions, concise implementation)
- **Branch:** feat/cli-modularization (continue existing branch)
- **Approval gate:** Human review of test coverage and test quality before commit

## Evaluation Matrix Impact

**Implementation Phase:**
- **Test Coverage (4/4 pts recovered):**
  - Unit tests: 2 pts (4 critical modules tested)
  - Test execution evidence: 2 pts (coverage report + test output captured)

**Expected Contribution:** +4/100 points (closes 33% of gap)

## Follow-ups

- If bugs found during testing: Create bug reports, fix in separate commits
- After completion: Run Group C (evidence capture) to complete polish
- Commit message: `test(cli): add unit tests for lib modules (agent-resolver, session-helpers, config, cli-parser)`
- Update review report with new score: 96/100 after Group B (88 + 4 from A + 4 from B)

## Risk Mitigation

**RISK-1: Unit tests reveal bugs**
- Mitigation: If tests fail due to bugs in extracted modules:
  1. Document bugs in evidence file
  2. Create separate bug fix commits
  3. Update snapshots if behavior changed intentionally
  4. Re-run Group C validation after fixes

**RISK-2: Test framework not installed**
- Mitigation: Install Vitest via `pnpm add -D vitest @vitest/coverage-v8`, create config, update package.json scripts

**RISK-3: Coverage <80%**
- Mitigation: Add more edge case tests, focus on uncovered branches/lines shown in coverage report

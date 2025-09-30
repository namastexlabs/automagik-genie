# Commit Advisory – cli-modularization
**Generated:** 2025-09-30T22:50:54Z

## Snapshot
- Branch: feat/cli-modularization (ahead +1)
- Related wish: wishes/cli-modularization-wish.md
- Related QA: .genie/wishes/cli-modularization/qa/

## Changes by Domain
- Tooling (CLI source):
  - .genie/cli/src/commands/run.ts (import deepClone/mergeDeep from utils)
  - .genie/cli/src/lib/config.ts (import deepClone/mergeDeep from utils)
  - .genie/cli/src/lib/utils.ts (added deepClone/mergeDeep implementations)
- Build output:
  - .genie/cli/dist/lib/utils.js (updated build artifact)
- Untracked (review before commit):
  - .genie/agents/qa/test-claude-params.md
  - .genie/cli/snapshots/**/* (baselines, evidence, current)
  - .genie/cli/src/lib/background-launcher.ts
  - .genie/reports/done-*.md (generated reports)
  - .genie/wishes/cli-modularization/qa/review-*.md

## Recommended Commit Message
```
feat/cli-modularization: centralize deepClone/mergeDeep in utils and update imports

- move deepClone/mergeDeep to utils.ts
- update run.ts and config.ts to import utilities
- update generated dist output (no behavior change)
```

## Validation Checklist
- [ ] Type check (no emit): `pnpm exec tsc -p .genie/cli/tsconfig.json --noEmit`
- [ ] Build compiles: `pnpm run build:genie`
- [ ] Tests: `pnpm run test:genie`
- [ ] Formatting (if configured): `pnpm exec prettier --check .genie/cli/src`
- [ ] Lint (if configured): `pnpm run lint`
- [ ] Docs updated if needed (README, wish QA notes)
- [ ] Security (optional/offline): `pnpm audit` (may require network)

## Pre‑Commit Gate (Dry‑Run)
Checklist: [lint, type, tests, docs, changelog, security, formatting]
Status: {
  lint: n/a,
  type: n/a,
  tests: n/a,
  docs: n/a,
  changelog: n/a,
  security: n/a,
  formatting: n/a
}
Blockers:
- Dry‑run requested; checks not executed.
- Untracked QA/snapshot files present; confirm inclusion/exclusion.
- Build artifact changed; confirm project policy on committing dist/.
NextActions:
- Run type check and tests locally with commands above.
- Verify Prettier/lint presence; add or run checks if configured.
- Stage/ignore untracked QA/snapshot files per policy.
Verdict: needs-fixes (confidence: med)

## Risks & Follow‑ups
- Minor refactor risk: centralization of utilities should be behavior‑neutral; run smoke tests.
- Ensure no unintended changes in dist are introduced beyond the refactor.


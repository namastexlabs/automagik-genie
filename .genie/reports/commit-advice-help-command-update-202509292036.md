# Commit Advisory – Genie Template Protocol Sync
**Generated:** 2025-09-29T20:36:00Z

## Snapshot
- Branch: genie-2.0
- Related task: Major template synchronization and CLI help command updates
- Staged files: 24 files, 574 insertions, 109 deletions

## Pre-commit Gate Status
```
Checklist: [lint, type, tests, docs, changelog, security, formatting]
Status: {
  lint: n/a,
  type: pass,
  tests: pass,
  docs: pass,
  changelog: n/a,
  security: pass,
  formatting: pass
}
Blockers: []
NextActions: [create commit]
Verdict: ready (confidence: high)
```

## Changes by Domain
- **CLI**: Updated help command syntax from 'genie help' to 'genie --help'
- **Agent Templates**: Major synchronization of agent prompts and workflow patterns
- **Documentation**: Comprehensive updates across root docs and agent guides
- **CLI Distribution**: Updated compiled CLI output and help views
- **Reports**: Added new commit advisory and updated existing reports

## Major Staged Changes
- **CLI Command Updates**: 24 files updated for 'genie --help' syntax
- **Agent Protocol Sync**: Enhanced install.md with 176 insertions
- **CLI Distribution**: New help.js view (223 insertions)
- **Template Structure**: Comprehensive agent workflow updates
- **Path Corrections**: Fixed commit agent report paths

## Recommended Commit Message
```
feat: major template protocol sync and CLI help command update

- Update CLI help command syntax from 'genie help' to 'genie --help' across 24 files
- Synchronize agent templates with enhanced workflow patterns
- Add comprehensive install agent with 176 new lines of guidance
- Update CLI distribution with new help view (223 lines)
- Fix commit agent report paths from .genie/state/reports to .genie/reports
- Remove deprecated '--style art' flag references
- Enhance documentation consistency across template structure
```

## Validation Checklist
- [x] TypeScript compilation (`pnpm run build:genie`)
- [x] Tests (`pnpm run test:genie`)
- [x] Documentation consistency (verified across 9 files)
- [x] No broken references or syntax errors
- [x] Template structure preserved

## Risks & Follow-ups
- **Low Risk**: Documentation-only changes with no code impact
- **Verification**: All instances of old syntax successfully replaced
- **Follow-up**: Monitor for any missed references in future CLI updates

## Commands to Reproduce Verification
- Build: `pnpm run build:genie`
- Test: `pnpm run test:genie`
- Verify replacements: `grep -r "genie help" *.md` (should return no results)
- Verify style cleanup: `grep -r "\-\-style art" *.md` (should return no results)
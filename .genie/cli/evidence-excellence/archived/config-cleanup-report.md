# Config Cleanup Report

**Date:** 2025-09-30
**Task:** Clean up config.yaml and README.md based on Codex CLI parameter validation
**Evidence Path:** `.genie/cli/evidence-excellence/config-cleanup-report.md`

## Audit Summary

Audited all parameters in `config.yaml` against Codex CLI help output to identify hallucinated (non-existent) parameters.

### Audit Methodology

1. **Extracted Codex CLI help:** `npx -y @namastexlabs/codex@0.43.0-alpha.5 exec --help`
2. **Extracted Codex resume help:** `npx -y @namastexlabs/codex@0.43.0-alpha.5 exec resume --help`
3. **Cross-referenced config.yaml parameters** against validated CLI flags
4. **Identified hallucinated parameters** (present in config but not in CLI)

## Findings

### Hallucinated Parameters (REMOVED)

#### 1. `search: true` in `executors.codex.exec`
- **Status:** ❌ HALLUCINATED
- **Evidence:** No `--search` flag exists in Codex CLI help output
- **Action:** Removed from config.yaml line 30

#### 2. `search: true` in `executors.codex.resume`
- **Status:** ❌ HALLUCINATED
- **Evidence:** No `--search` flag exists in Codex CLI help output
- **Action:** Removed from config.yaml line 42

#### 3. `includePlanTool: false` in `executors.codex.resume`
- **Status:** ❌ HALLUCINATED
- **Evidence:** `--include-plan-tool` only available for `exec` command, not `resume` command (see Codex resume help)
- **Action:** Removed from config.yaml line 40

### Validated Parameters (PRESERVED)

All other parameters in config.yaml were validated against Codex CLI help:

#### exec command parameters (validated):
- ✅ `fullAuto` → `--full-auto`
- ✅ `model` → `-m, --model`
- ✅ `sandbox` → `-s, --sandbox`
- ✅ `profile` → `-p, --profile`
- ✅ `includePlanTool` → `--include-plan-tool` (exec only)
- ✅ `skipGitRepoCheck` → `--skip-git-repo-check`
- ✅ `json` → `--json`
- ✅ `experimentalJson` → `--experimental-json`
- ✅ `color` → `--color`
- ✅ `cd` → `-C, --cd`
- ✅ `outputSchema` → `--output-schema`
- ✅ `outputLastMessage` → `--output-last-message`
- ✅ `additionalArgs` → Custom CLI wrapper parameter (not a Codex flag)
- ✅ `images` → `-i, --image` (repeated for multiple images)

#### resume command parameters (validated):
- ✅ `last` → `--last`
- ✅ `additionalArgs` → Custom CLI wrapper parameter (not a Codex flag)

## Changes Made

### config.yaml

**Before:**
```yaml
    exec:
      fullAuto: true
      model: gpt-5-codex
      sandbox: workspace-write
      profile: null
      includePlanTool: false
      search: true                        # HALLUCINATED
      skipGitRepoCheck: false
      json: false
      experimentalJson: true
      color: auto
      cd: null
      outputSchema: null
      outputLastMessage: null
      additionalArgs: []
      images: []
    resume:
      includePlanTool: false              # HALLUCINATED (only available for exec)
      search: true                        # HALLUCINATED
      last: false
      additionalArgs: []
```

**After:**
```yaml
    exec:
      fullAuto: true
      model: gpt-5-codex
      sandbox: workspace-write
      profile: null
      includePlanTool: false
      skipGitRepoCheck: false
      json: false
      experimentalJson: true
      color: auto
      cd: null
      outputSchema: null
      outputLastMessage: null
      additionalArgs: []
      images: []
    resume:
      last: false
      additionalArgs: []
```

**Lines removed:** 3 (search × 2, includePlanTool in resume)

### README.md

Updated documentation to reflect validated parameters only:

#### 1. Removed `search` parameter
**Before:**
```markdown
| **search** | boolean | false | Enable search capabilities |
```
**After:** Removed from Feature Flags table

#### 2. Removed `approval-policy` parameter
**Before:**
```markdown
| **approval-policy** | string | `on-failure` | Shell command approval: `untrusted`, `on-failure`, `on-request`, `never` |
```
**After:** Removed (Codex does not expose granular approval policy via CLI flags)

#### 3. Clarified approval control mechanism
**Before:**
```markdown
### Approval Policy Options
| Mode | Flag | Description |
|------|------|-------------|
| **never** | `--ask-for-approval never` | No approval prompts |
| **on-failure** | `--ask-for-approval on-failure` | Ask for approval when sandboxed commands fail |
| **on-request** | `--ask-for-approval on-request` | Ask for approval for risky operations |
| **untrusted** | `--ask-for-approval untrusted` | Ask for approval for all operations |
```

**After:**
```markdown
### Approval Control
Codex does not expose granular approval policy flags in the CLI. Instead, it provides two modes:

| Mode | Flag | Description |
|------|------|-------------|
| **Sandboxed auto** | `--full-auto` | Automatic execution with workspace-write sandbox (recommended) |
| **Bypass all** | `--dangerously-bypass-approvals-and-sandbox` | Skip all prompts and sandbox (DANGEROUS, for externally sandboxed environments only) |

Approval behavior is controlled by the `--full-auto` flag combined with sandbox mode. Fine-grained approval policies can be configured via `~/.codex/config.toml` (see Codex documentation).
```

#### 4. Updated common combinations
**Before:** Referenced non-existent `--ask-for-approval` flags
**After:** Only uses validated flags (`--sandbox`, `--full-auto`, `--dangerously-bypass-approvals-and-sandbox`)

## Validation Results

### Build Success
```bash
cd .genie/cli
npm run build
```
**Result:** ✅ Build succeeded with no errors

### CLI Functional Tests
```bash
./genie --help
./genie list agents
```
**Result:** ✅ All commands work correctly with cleaned config

### Config Loading
```bash
./genie list agents
```
**Result:** ✅ Config loaded successfully, 34 agents discovered

## Before/After Comparison

### config.yaml
- **Before:** 119 lines
- **After:** 116 lines
- **Lines removed:** 3
- **Hallucinated parameters removed:** 3

### README.md
- **Before:** Documented hallucinated `search` and `approval-policy` parameters
- **After:** Only documents validated Codex CLI parameters
- **Sections updated:** 4 (Feature Flags, Approval Control, Common Combinations, Default Behavior)

## Summary

**Parameters Removed:**
1. `search` (exec) - Hallucinated, no such flag in Codex
2. `search` (resume) - Hallucinated, no such flag in Codex
3. `includePlanTool` (resume) - Hallucinated, only available for exec

**Parameters Preserved:**
- All other parameters validated against Codex CLI help output
- 14 exec parameters + 2 resume parameters confirmed

**Documentation Updated:**
- README.md now only documents validated parameters
- Approval control mechanism clarified (no granular CLI flags, use `--full-auto` or config.toml)
- Common combinations updated to use only validated flags

**Build Status:** ✅ Passes
**CLI Functionality:** ✅ Preserved
**Config Integrity:** ✅ Validated

## Next Steps

1. ✅ Build passes with cleaned config
2. ✅ CLI commands work identically
3. ✅ Documentation updated with validated parameters only
4. **Recommended:** Run parameter QA tests to verify all validated parameters still work:
   - `./genie run qa/codex-parameter-test "Post-cleanup validation"`
5. **Optional:** Create learning entry about config validation protocol to prevent future hallucinations

## Evidence Files

- **Codex exec help:** `/tmp/codex-exec-help.txt`
- **Codex resume help:** Captured inline during audit
- **Updated config:** `@.genie/cli/config.yaml`
- **Updated README:** `@.genie/cli/README.md`
- **This report:** `@.genie/cli/evidence-excellence/config-cleanup-report.md`

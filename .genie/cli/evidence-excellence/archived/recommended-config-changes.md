# Recommended Config.yaml Changes

**Date:** 2025-09-30
**Status:** Optional Enhancement (No Critical Issues Found)

---

## Summary

Audit found **ZERO hallucinated parameters**. All existing config.yaml parameters are valid.

However, two Codex parameters exist in the executor code but are missing from config.yaml:
- `approvalPolicy`
- `reasoningEffort`

Adding these would provide explicit control over these features instead of relying on hardcoded defaults.

---

## Recommended Addition

Add these two parameters to the Codex executor defaults in `.genie/cli/config.yaml`:

### Current (lines 24-39)

```yaml
executors:
  codex:
    binary: npx
    packageSpec: "@namastexlabs/codex@0.43.0-alpha.5"
    sessionExtractionDelayMs: null
    exec:
      fullAuto: true
      model: gpt-5-codex
      sandbox: workspace-write
      profile: null
      includePlanTool: false
      search: true
      skipGitRepoCheck: false
      json: false
      experimentalJson: true
      color: auto
      cd: null
      outputSchema: null
      outputLastMessage: null
      additionalArgs: []
      images: []
```

### Recommended (add two new lines)

```yaml
executors:
  codex:
    binary: npx
    packageSpec: "@namastexlabs/codex@0.43.0-alpha.5"
    sessionExtractionDelayMs: null
    exec:
      fullAuto: true
      model: gpt-5-codex
      sandbox: workspace-write
      approvalPolicy: on-failure          # NEW: when to request approval (always, never, on-failure)
      profile: null
      includePlanTool: false
      search: true
      skipGitRepoCheck: false
      json: false
      experimentalJson: true
      color: auto
      cd: null
      outputSchema: null
      outputLastMessage: null
      reasoningEffort: low                # NEW: reasoning effort level (low, medium, high)
      additionalArgs: []
      images: []
```

---

## Parameter Details

### approvalPolicy

- **Description:** Controls when Codex requests human approval before executing commands
- **Type:** String enum
- **Valid values:**
  - `on-failure` (default): Request approval only when commands fail
  - `always`: Request approval before every command
  - `never`: Never request approval (auto-execute everything)
- **Current behavior:** Falls back to hardcoded default `on-failure` in codex.ts:17
- **CLI usage:** `-c approval-policy="on-failure"`
- **Code reference:** codex.ts:17 (defaults), codex.ts:253 (collectExecOptions)

### reasoningEffort

- **Description:** Controls the level of reasoning effort the model applies
- **Type:** String enum
- **Valid values:**
  - `low` (default): Fast execution with minimal reasoning
  - `medium`: Balanced reasoning and speed
  - `high`: Deep reasoning for complex problems
- **Current behavior:** Falls back to hardcoded default `low` in codex.ts:28
- **CLI usage:** `-c reasoning.effort="low"`
- **Code reference:** codex.ts:28 (defaults), codex.ts:264-266 (collectExecOptions)

---

## Rationale

### Why Add These Parameters?

1. **Completeness:** Makes all executor parameters explicit in config
2. **Discoverability:** Users can see all available options without reading code
3. **Customization:** Enables per-mode overrides (e.g., `debug` mode with `high` reasoning effort)
4. **Documentation:** Serves as self-documenting configuration

### Why They're Optional

1. **No Breaking Change:** Existing behavior unchanged (defaults remain the same)
2. **No Hallucination:** Parameters already exist in code, fully functional
3. **No Cleanup Required:** Zero invalid parameters to remove
4. **Backward Compatible:** Absence doesn't cause errors

---

## Usage Examples

### Example 1: High Reasoning for Debug Mode

```yaml
executionModes:
  debug:
    description: Deep analysis with high reasoning effort
    overrides:
      exec:
        includePlanTool: true
        search: true
        reasoningEffort: high  # Enable deep reasoning for debugging
```

### Example 2: Always-Approve for Production

```yaml
executionModes:
  production:
    description: Production deployment with manual approvals
    overrides:
      exec:
        approvalPolicy: always  # Require approval for every command
        sandbox: read-only
```

### Example 3: Fast Iteration Mode

```yaml
executionModes:
  fast:
    description: Rapid prototyping with minimal reasoning
    overrides:
      exec:
        reasoningEffort: low  # Prioritize speed over depth
        approvalPolicy: never  # Skip approvals for speed
```

---

## Implementation Steps

### Option A: Manual Edit

1. Open `.genie/cli/config.yaml`
2. Navigate to line 24 (codex executor section)
3. Add `approvalPolicy: on-failure` after `sandbox: workspace-write`
4. Add `reasoningEffort: low` after `outputLastMessage: null`
5. Save file

### Option B: Using Edit Tool

```diff
       model: gpt-5-codex
       sandbox: workspace-write
+      approvalPolicy: on-failure
       profile: null
       includePlanTool: false
       search: true
       skipGitRepoCheck: false
       json: false
       experimentalJson: true
       color: auto
       cd: null
       outputSchema: null
       outputLastMessage: null
+      reasoningEffort: low
       additionalArgs: []
       images: []
```

---

## Testing

After adding these parameters, verify:

1. **Default behavior unchanged:**
   ```bash
   ./genie run implementor "Test prompt"
   # Should behave exactly as before
   ```

2. **Override works:**
   ```bash
   # Create test mode in config.yaml:
   executionModes:
     test-reasoning:
       overrides:
         exec:
           reasoningEffort: high

   # Run with override:
   ./genie run implementor "Test prompt" --mode test-reasoning
   # Should use high reasoning effort
   ```

3. **CLI flag still works:**
   ```bash
   # Direct CLI override:
   # (This requires adding additionalArgs support, or using native Codex CLI)
   npx -y @namastexlabs/codex@0.43.0-alpha.5 exec -c reasoning.effort="high" "Test"
   ```

---

## Alternative: Do Nothing

**Valid choice:** The config is already correct and functional. These parameters are optional enhancements, not fixes for hallucinations.

**Current state:** Clean config with zero invalid parameters.

---

## Conclusion

**Recommendation:** ADD (optional enhancement for completeness)

**Priority:** Low (nice-to-have, not required)

**Risk:** Zero (no breaking changes, backward compatible)

**Benefit:** Improved discoverability and customization

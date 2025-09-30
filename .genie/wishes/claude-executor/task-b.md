# Task B: Configuration & Integration

**Wish:** @.genie/wishes/claude-executor-wish.md
**Group:** B – configuration-integration
**Tracker:** 42eae414-c718-4bd1-9fa2-2be4e87c4e50
**Persona:** implementor
**Branch:** genie-dev (existing branch, commits merged from worktree)
**Status:** pending

## Scope
Update `.genie/cli/config.yaml` with Claude executor defaults and execution modes to enable agent frontmatter configuration.

## Context & Inputs
- @.genie/cli/config.yaml — current configuration structure
- @.genie/wishes/claude-executor-wish.md — permission mode mappings

## Deliverables
1. **executors.claude section**
   ```yaml
   executors:
     claude:
       binary: claude
       packageSpec: null
       sessionExtractionDelayMs: 1000
       exec:
         model: sonnet
         permissionMode: default
         outputFormat: stream-json
         allowedTools: []
         disallowedTools: []
         additionalArgs: []
       resume:
         additionalArgs: []
   ```

2. **paths.executors.claude (optional)**
   - sessionsDir: null (Claude manages own sessions)

3. **executionModes** - Add Claude-specific modes:
   ```yaml
   claude-default:
     description: Claude Code with default permissions
     executor: claude
     overrides:
       exec:
         model: sonnet
         permissionMode: default

   claude-careful:
     description: Claude Code read-only mode
     executor: claude
     overrides:
       exec:
         permissionMode: acceptEdits

   claude-plan:
     description: Claude Code planning mode
     executor: claude
     overrides:
       exec:
         permissionMode: plan
   ```

4. **Verification**
   - Ensure `defaults.executor: codex` remains unchanged (backwards compatibility)
   - Config parses without YAML errors

## Dependencies
- **Parallel:** Can work alongside Group A (executor implementation)
- **Blocks:** Group C testing requires this config

## Validation
```bash
# Config syntax check
node -e "const yaml = require('yaml'); const fs = require('fs'); yaml.parse(fs.readFileSync('.genie/cli/config.yaml', 'utf8'));"

# Verify executor loads
./genie list agents

# Test with claude executor in agent YAML
./genie run <test-agent> "test" # (agent with executor: claude)
```

## Evidence
- Config parses without errors
- `./genie run` with `executor: claude` spawns Claude process
- Session ID captured in `.genie/state/agents/sessions.json` within 5 seconds

Store evidence in wish status log.
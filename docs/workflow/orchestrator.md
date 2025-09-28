# Automagik Framework Orchestration Workflow

## Overview

The Automagik framework provides a unified workflow for product development from ideation to deployment. This document describes the complete lifecycle and how to use each component.

## Command Hierarchy

```
/plan     → Universal product orchestrator
  ├── Auto-reviews: mission, roadmap, standards
  ├── Context gathering via @ references
  ├── Background persona orchestration
  └── Outputs: Updated roadmap, context ledger, ready for wish

/wish     → Feature blueprint creation
  ├── Consumes /plan output
  ├── Generates inline <spec_contract>
  └── Outputs: .genie/wishes/<slug>-wish.md

/forge    → Task breakdown & execution
  ├── Reads wish spec_contract
  ├── Surfaces forge task IDs in CLI output for wish tracking
  └── Dispatches to agents

/review   → Completion audit
  └── Generates Death Testaments

/commit   → Git workflow & PR creation
  └── References wish ID
```

## Complete Workflow Example

### Step 1: Product Planning with /plan

Start with the `/plan` command to initiate product-mode conversation:

```bash
# Interactive planning session
/plan
```

During the `/plan` conversation:
- The agent auto-reviews mission, roadmap, and standards
- You can inject context using `@` references:
  - `@path/to/file` - Load file content automatically
  - Inline content - paste directly in conversation
  - `@https://...` - Reference external resources
- Background research can be triggered:
  ```bash
  ./genie run forge-coder "@docs/research.md analyze latency"
  ```

Output: Updated wish context ledger and CLI-managed session state (no manual `.genie/state/index.json` file)

### Step 2: Create Wish Blueprint

Once planning is complete, create a wish:

```bash
/wish
```

The wish agent will:
1. Consume the /plan output
2. Generate execution groups
3. Embed inline `<spec_contract>`
4. Define branch strategy
5. Save to `.genie/wishes/<slug>-wish.md`

### Step 3: Execute with /forge

Break down the wish into executable tasks:

```bash
/forge @.genie/wishes/<slug>-wish.md
```

Outputs:
- Forge CLI output containing plan details and task IDs—mirror essentials inside the wish Tracking/Execution sections
- Dispatches to appropriate forge agents

### Step 4: Implementation

Execute the forge plan using CLI agents:

```bash
# Foreground execution
./genie run forge-coder "implement Group A from forge plan"

# Background execution for long tasks
./genie run forge-tests "create test suite"

# Check background status
./genie list
```

Store artifacts exactly where the wish instructs (no default evidence directory)

### Step 5: Review & Validation

Run completion audit:

```bash
/review @.genie/wishes/<slug>-wish.md
```

Generates:
- Death Testament in `.genie/reports/`
- Validation summary appended to the wish (create a dedicated section or linked doc if needed)

### Step 6: Commit & PR

Create commit and PR:

```bash
/commit
```

The commit agent will:
- Group related changes
- Generate commit message referencing wish ID
- Output a commit advisory in the CLI (capture key points in the wish or PR description)
- Provide PR template with wish reference

## Branch Strategy

### Option 1: Dedicated Branch (Recommended)
```bash
git checkout -b feat/<wish-slug>
```
Use for medium to large changes. Document in wish status log.

### Option 2: Current Branch
Only for small changes with documented rationale in wish.

### Option 3: Micro-task
For tiny updates tracked in wish status and commit advisory.

## Context Injection Protocol

During `/plan` conversations, use `@` to reference files and resources:

### File Loading
```
@.genie/product/roadmap.md  # Auto-loads the file
```

### Inline Content
```
# Just paste directly in the conversation:
Performance metrics from production:
- TTFB: 1200ms avg
- ASR confidence: 0.85
```

### External References
```
@https://docs.elevenlabs.io/api-reference  # Reference external docs
```

All context is logged in the Context Ledger and distributed to:
- Wish document
- Forge plan summaries recorded inside the wish
- Relevant artefact locations noted by the wish

## Background Session Management

### Starting Background Sessions

```bash
# Launch background research
./genie run forge-coder "analyze codebase"

# Launch multiple in parallel
./genie run forge-quality "review standards"
./genie run forge-tests "audit test coverage"
```

### Monitoring Background Work

```bash
# List active sessions
./genie list

# View logs
tail -f .genie/state/agents/logs/<agent>-<session>.log

# Clear completed session
./genie clear <agent>
```

### Background Output Integration

Background outputs are:
1. Summarized in wish Context Ledger
2. Raw logs stored in `.genie/state/agents/logs/`
3. Referenced in forge plans when relevant

## Tracker Integration

External tracker IDs come from forge execution output. Capture them immediately and append to the wish Tracking section:

```
### Tracking
- Forge plan: FORGE-123
- Execution group A: FORGE-124
```

## CLI Presets

Available presets in `.genie/cli/config.yaml`:

- **default**: Workspace-write automation with GPT-5 Codex
- **careful**: Read-only mode for approval-aware runs
- **danger**: Full access runs (requires external sandboxing)
- **debug**: Enables plan tool + web search for deep analysis
- **voice-eval**: Read-only evaluation flow for voice agents

Override settings:
```bash
./genie run plan "idea" -c executors.codex.exec.model='"o4"'
```

### Agent-Level Overrides

Each agent file in `.genie/agents/` can pin execution settings via front matter:

```yaml
---
name: genie-analyze
description: Structural/system analysis subgeny
genie:
  executor: codex
  model: gpt-5-codex
  reasoningEffort: high
  includePlanTool: true
  search: true
  additionalArgs:
    - --color=never
  background: false
---
```

`genie.*` values override `config.yaml` for that agent, so you can tailor models, sandboxing, reasoning effort, or background defaults per persona without CLI flags. `additionalArgs` passes raw Codex flags (for example `--output-schema`, `--color`, `--dangerously-bypass-approvals-and-sandbox`) when you need behaviour not covered by structured keys.

## Blocker Protocol

If execution is blocked:

1. Log the blocker directly in the wish (timestamp, findings, next action).
2. Update the wish status log.
3. Notify stakeholders.
4. Resume only after guidance is updated.

## Quick Reference

```bash
# Full lifecycle
/plan                                          # Start planning
/wish                                          # Create blueprint
/forge @.genie/wishes/<slug>-wish.md         # Break down tasks
./genie run forge-coder "..."  # Execute
/review @.genie/wishes/<slug>-wish.md        # Validate
/commit                                        # Create PR

# Background operations
./genie run <agent> "..."
./genie list
./genie clear <agent>

# Context injection (during /plan)
@path/to/file     # Auto-loads file
@https://...      # References external resource
# Inline content - paste directly
```

## Next Steps

- Review [Branch Strategy Guide](./branch-strategy.md)
- See [Background Sessions](./background-sessions.md) for advanced orchestration
- Check [Testing Guidelines](../testing-guidelines.md) for validation patterns

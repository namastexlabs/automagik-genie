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
  ├── Creates forge/tasks.json entries
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
  ./agent run forge-coder "@docs/research.md analyze latency"
  ```

Output: Updated `.genie/state/index.json` with roadmap status and context ledger

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
- `.genie/state/reports/forge-plan-<slug>-<timestamp>.md`
- `forge/tasks.json` with external tracker IDs
- Dispatches to appropriate forge agents

### Step 4: Implementation

Execute the forge plan using CLI agents:

```bash
# Foreground execution
./agent run forge-coder "implement Group A from forge plan"

# Background execution for long tasks
./agent run forge-tests "create test suite"

# Check background status
./agent list
```

Store artifacts as specified in the wish (typically `.genie/wishes/<slug>/qa/`)

### Step 5: Review & Validation

Run completion audit:

```bash
/review @.genie/wishes/<slug>-wish.md
```

Generates:
- Death Testament in `.genie/reports/`
- Validation results in `.genie/wishes/<slug>/qa/review-<timestamp>.md`

### Step 6: Commit & PR

Create commit and PR:

```bash
/commit
```

The commit agent will:
- Group related changes
- Generate commit message referencing wish ID
- Save advisory to `.genie/state/reports/commit-advisory-<timestamp>.md`
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
- Roadmap index (`.genie/state/index.json`)
- Relevant experiments/artifacts

## Background Session Management

### Starting Background Sessions

```bash
# Launch background research
./agent run forge-coder "analyze codebase"

# Launch multiple in parallel
./agent run forge-quality "review standards"
./agent run forge-tests "audit test coverage"
```

### Monitoring Background Work

```bash
# List active sessions
./agent list

# View logs
tail -f .genie/state/agents/logs/<agent>-<session>.log

# Clear completed session
./agent clear <agent>
```

### Background Output Integration

Background outputs are:
1. Summarized in wish Context Ledger
2. Raw logs stored in `.genie/state/agents/logs/`
3. Referenced in forge plans when relevant

## Tracker Integration

External tracker IDs (Jira, Linear, GitHub Issues) are stored in `forge/tasks.json`:

```json
{
  "wishes": {
    "baseline-voice": {
      "tracker_id": "PROJ-123",
      "groups": {
        "A": "PROJ-124",
        "B": "PROJ-125",
        "C": "PROJ-126"
      }
    }
  }
}
```

## CLI Presets

Available presets in `.genie/cli/agent.yaml`:

- **default**: Standard execution with workspace-write
- **careful**: Read-only mode for evaluation
- **plan**: Optimized for /plan command (includes plan tool)
- **voice-eval**: Voice agent evaluation mode

Override settings:
```bash
./agent run plan "idea" -c codex.exec.model='"o4"'
```

## Blocker Protocol

If execution is blocked:

1. Create blocker report:
   ```
   .genie/state/reports/blocker-<slug>-<timestamp>.md
   ```

2. Update wish status log

3. Notify stakeholders

4. Resume only after guidance updated

## Quick Reference

```bash
# Full lifecycle
/plan                                          # Start planning
/wish                                          # Create blueprint
/forge @.genie/wishes/<slug>-wish.md         # Break down tasks
./agent run forge-coder "..."  # Execute
/review @.genie/wishes/<slug>-wish.md        # Validate
/commit                                        # Create PR

# Background operations
./agent run <agent> "..."
./agent list
./agent clear <agent>

# Context injection (during /plan)
@path/to/file     # Auto-loads file
@https://...      # References external resource
# Inline content - paste directly
```

## Next Steps

- Review [Branch Strategy Guide](./branch-strategy.md)
- See [Background Sessions](./background-sessions.md) for advanced orchestration
- Check [Testing Guidelines](../testing-guidelines.md) for validation patterns

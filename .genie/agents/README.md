# GENIE Agents Documentation

## Overview
This directory contains agent definitions that power the GENIE CLI's intelligent orchestration capabilities. Agents are organized as:

- **Entrypoints** – the four workflow phases (`plan.md`, `wish.md`, `forge.md`, `review.md`) stored at the root of this folder.
- **Utilities** (`utilities/`) – reusable helpers (twin, analyze, debug, commit workflow, prompt, etc.).
- **Specialists** (`specialists/`) – project-tailored delivery/qa/learning agents that the install flow customizes.

Each agent is a specialized persona with specific expertise and behavioral patterns.

## Agent Parameter Configuration

When agents are invoked through the GENIE CLI, they inherit a set of default parameters that can be overridden:

### Core Execution Parameters

| Parameter | Default | Description | Override Method |
|-----------|---------|-------------|-----------------|
| **model** | `gpt-5-codex` | AI model to use | Agent metadata |
| **reasoning-effort** | `low` | Reasoning depth (`low`, `medium`, `high`) | Agent metadata |
| **sandbox** | `workspace-write` | File system access level | Agent metadata |
| **approval-policy** | `on-failure` | When to ask for approval | Agent metadata |
| **include-plan-tool** | `false` | Enable planning capabilities | Agent metadata |
| **base-instructions** | (from agent file) | Agent-specific instructions | Loaded from agent markdown |

### Parameter Inheritance Hierarchy

1. **Agent File Metadata** (highest priority)
   - Defined in agent markdown frontmatter
   - Example: `reasoning_effort: medium`

2. **Execution Mode Configuration** (`config.yaml`)
   - Named execution modes for common scenarios (default, careful, danger, debug)
   - Applied automatically based on agent frontmatter settings

3. **Global Defaults** (`codex.ts`)
   - Fallback values for all parameters
   - Current defaults optimized for safety + speed

## Agent File Structure

Each agent file follows this structure:

```markdown
---
meta:
  name: agent-name
  reasoning_effort: medium  # Optional override
  include_plan_tool: true   # Optional override
  sandbox: workspace-write  # Optional override
---

# Agent Name

## Identity
[Agent description and purpose]

## Instructions
[Detailed behavioral instructions - becomes base-instructions]

## Capabilities
[What the agent can do]

## Constraints
[What the agent should not do]
```

## Reasoning Effort Levels

| Level | Use Case | Performance | Cost |
|-------|----------|-------------|------|
| **low** | Simple tasks, file edits, queries | Fast responses | Minimal |
| **medium** | Complex analysis, debugging | Balanced | Moderate |
| **high** | Architecture decisions, critical fixes | Thorough analysis | Higher |

## Sandbox Modes for Agents

| Mode | Permissions | Recommended For |
|------|------------|-----------------|
| **read-only** | Read files only | Analysis, review agents |
| **workspace-write** | Read/write in workspace | Implementation agents |
| **danger-full-access** | Full system access | System configuration (rare) |

## Approval Policy Modes

| Policy | Behavior | Best For |
|--------|----------|----------|
| **never** | No approvals | Fully automated workflows |
| **on-failure** | Ask when commands fail (default with --full-auto) | Semi-automated tasks |
| **on-request** | Ask for risky operations | Interactive development |
| **untrusted** | Ask for everything | High-security contexts |

## Common Agent Configurations

### Implementation Agent (implementor)
```yaml
reasoning_effort: low
sandbox: workspace-write
approval_policy: on-failure
include_plan_tool: false
```

### Planning Agent (forge)
```yaml
reasoning_effort: medium
sandbox: workspace-write
approval_policy: on-failure
include_plan_tool: true
```

### Review Agent (qa)
```yaml
reasoning_effort: medium
sandbox: read-only
approval_policy: on-failure
include_plan_tool: false
```

### Twin Analysis (twin)
```yaml
reasoning_effort: high
sandbox: read-only
approval_policy: on-failure
include_plan_tool: true
```

### Prompt Author (prompt)
```yaml
reasoning_effort: medium
sandbox: read-only            # prompt agent must never edit files
approval_policy: on-request   # escalate if asked to exceed prompt-only scope
include_plan_tool: true       # uses planning notes for context staging
```

- Sole output is the constructed prompt text; no Done Reports or implementation steps.
- Reads repository context to enrich prompts but remains in read-only mode.
- Rejects or escalates requests that require file edits, testing, or artifact generation.

## Running Agents with Custom Parameters

### Via CLI Flags
Configure these settings in the agent's frontmatter instead:
```yaml
---
genie:
  executor: codex
  exec:
    reasoningEffort: high
    sandbox: read-only
    includePlanTool: true
---
```

Then run: `./genie run <agent> "<prompt>"`

### Via Execution Modes
Optional convenience modes defined in `config.yaml`:
```yaml
executionModes:
  high-effort:
    exec:
      reasoningEffort: high

  safe-review:
    exec:
      sandbox: read-only
      approvalPolicy: on-request
```

Agents reference these via frontmatter, but direct configuration is preferred.

### Via Agent Metadata
Add to agent markdown frontmatter:
```yaml
---
meta:
  name: my-agent
  reasoning_effort: high
  sandbox: read-only
---
```

## Background Execution

Agents run in background by default:
```bash
# Starts in background, returns immediately
./genie run implementor "Implement feature"

# Check status
./genie list sessions

# View output
./genie view <sessionId>
```

## Agent Routing Map

Current agent routing (see AGENTS.md for updates):
- `implementor` → `specialists/implementor.md`
- `qa` → `specialists/qa.md`
- `polish` → `specialists/polish.md`
- `tests` → `specialists/tests.md`
- `git` | `git-workflow` → `specialists/git-workflow.md`
- `project-manager` → `specialists/project-manager.md`
- `twin` → `utilities/twin.md`
- More utilities live in `.genie/agents/utilities/`

## Best Practices

1. **Match reasoning effort to task complexity**
   - Simple edits: `low`
   - Debugging: `medium`
   - Architecture: `high`

2. **Use appropriate sandbox modes**
   - Analysis/review: `read-only`
   - Implementation: `workspace-write`
   - Never use `danger-full-access` unless absolutely necessary

3. **Configure approval policies based on trust**
   - Automated CI/CD: `never` with `--full-auto`
   - Development: `on-failure` or `on-request`
   - Production changes: `untrusted`

4. **Use frontmatter for consistency**
   - Define agent configurations in YAML frontmatter
   - Share standard patterns via agent templates

5. **Override parameters judiciously**
   - Start with defaults
   - Adjust based on observed behavior
   - Document overrides in agent metadata

## Troubleshooting

### Agent not using expected parameters?
Check priority order:
1. CLI flags (highest)
2. Preset config
3. Agent metadata
4. Global defaults

### Performance issues?
- Lower reasoning effort for simple tasks
- Use `low` as default, increase only when needed
- Monitor with `./genie view` for token usage

### Permission errors?
- Check sandbox mode matches task requirements
- Verify approval policy isn't blocking operations
- Review workspace scope with `/status` command

## Future Enhancements

- Dynamic reasoning effort based on task analysis
- Agent-specific sandbox profiles
- Automatic parameter tuning based on success rates
- Parameter validation in agent metadata

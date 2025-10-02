# Genie Agent Architecture

## Access Patterns

### Commands Only (Interactive Workflows)
Conversational flows that guide humans through multi-step processes.
Access via: `/command`

- `/plan` — Product planning dialogue
- `/wish` — Wish creation dialogue
- `/forge` — Execution breakdown dialogue
- `/review` — QA validation dialogue
- `/install` — Framework installation
- `/prompt` — Prompt refinement helper
- `/genie-dev-cherrypick` — Cherry-pick improvements from genie-dev branch

### Both Command & Agent (Dual-Purpose)
Can be invoked interactively OR delegated to background/subagents.
Access via: `/command` OR `./genie run <agent>` OR Task tool

- `commit` / `/commit` — Commit advisory generation

### Agents Only (Delegatable Workers)
Best invoked via `./genie run <agent>` or spawned by other agents.
Access via: `./genie run <agent>` OR Task tool

#### Strategic Deep-Dive
- `twin` — Pressure-testing, second opinions, consensus building
- `analyze` — System architecture audit
- `thinkdeep` — Extended reasoning
- `debug` — Root cause investigation
- `consensus` — Decision facilitation (also callable via twin)
- `challenge` — Assumption breaking (also callable via twin)

#### Tactical Utilities
- `codereview` — Diff/file review
- `refactor` — Refactor planning
- `testgen` — Test generation
- `docgen` — Documentation generation
- `secaudit` — Security audit
- `tracer` — Instrumentation planning

#### Delivery Specialists
- `implementor` — Feature implementation
- `tests` — Test writing
- `polish` — Code refinement
- `qa` — Quality assurance
- `bug-reporter` — Bug triage & filing

#### Infrastructure
- `git-workflow` — Git operations
- `project-manager` — Task coordination
- `self-learn` — Behavioral learning

---

## Directory Structure

```
.genie/agents/               # Source of truth
├── plan.md                  # Core workflow orchestrator
├── wish.md                  # Wish creation agent
├── forge.md                 # Execution planning agent
├── review.md                # QA validation agent
├── specialists/             # Delivery & domain experts
│   ├── bug-reporter.md
│   ├── git-workflow.md
│   ├── implementor.md
│   ├── polish.md
│   ├── project-manager.md
│   ├── qa.md
│   ├── self-learn.md
│   └── tests.md
└── utilities/               # Reusable helpers
    ├── analyze.md
    ├── challenge.md
    ├── codereview.md
    ├── commit.md
    ├── consensus.md
    ├── debug.md
    ├── docgen.md
    ├── install.md
    ├── prompt.md
    ├── refactor.md
    ├── secaudit.md
    ├── testgen.md
    ├── thinkdeep.md
    ├── tracer.md
    └── twin.md

.claude/commands/            # Interactive slash commands
├── plan.md → @.genie/agents/plan.md
├── wish.md → @.genie/agents/wish.md
├── forge.md → @.genie/agents/forge.md
├── review.md → @.genie/agents/review.md
├── commit.md → @.genie/agents/utilities/commit.md
├── prompt.md → @.genie/agents/utilities/prompt.md
└── genie-dev-cherrypick.md → @.genie/agents/specialists/genie-dev-cherrypick.md
```

## Agent Frontmatter Configuration

Each agent declares its execution configuration in YAML frontmatter:

```yaml
---
name: implementor
description: Implementor specialist for project work
color: green
genie:
  executor: codex
  model: gpt-5-codex
  reasoningEffort: high
  background: true
---
```

**Common Fields:**
- `name`: Agent identifier (used in `./genie run <name>`)
- `description`: Human-readable purpose
- `color`: Visual identification (optional)
- `genie.executor`: Execution backend (e.g., `codex`)
- `genie.model`: LLM model to use
- `genie.reasoningEffort`: `minimal`, `low`, `medium`, `high`
- `genie.background`: `true` for async execution, `false` for foreground

**Note:** No `--preset` or `--mode` CLI flags exist. All configuration is defined per-agent in frontmatter.

## Invocation Patterns

### Via Slash Commands (Interactive)
```
/plan <description>
/wish <brief>
/forge
/review
/commit
```
Claude acts as the agent directly, can spawn subagents via Task tool.

### Via CLI (Background/Multi-LLM)
```bash
./genie run <agent> "[Discovery] ... [Implementation] ... [Verification] ..."
./genie resume <sessionId> "<follow-up>"
./genie view <sessionId> --full
./genie list sessions
./genie stop <sessionId>
```
Dispatches to Codex (or configured executor), useful for parallel perspectives.

### Via Task Tool (Programmatic)
Agents can spawn subagents using the Task tool within Claude Code conversations.
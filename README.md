# Genie Template Repository

Genie agent templates and CLI orchestration that can be installed into any repository. Replace project specifics with placeholders and use `.genie/agents/install.md` to bootstrap into your target codebase.

## Vision

Provide reusable planning, wishing, forging, review, and commit workflows with evidence-first prompts and a consistent CLI, independent of domain.

## What’s Included

- Unified prompts for plan, wish, forge, review, commit
- Specialist agents (bug-reporter, git-workflow, implementor, polish, project-manager, qa, self-learn, tests)
- CLI wrappers in `.claude/commands/` that @include agents
- Workspace-managed sessions and logs under `.genie/state/`

## Core Features

- Evidence-first orchestration (Discovery → Implementation → Verification)
- Guardrails (no destructive actions without approval)
- Template placeholders: `{{PROJECT_NAME}}`, `{{DOMAIN}}`, `{{TECH_STACK}}`, `{{APIS}}`, `{{METRICS}}`

## Technical Stack

- CLI runner: `./genie`
- Node/TS + Rust friendly; works in any repo (domain-agnostic)

## Documentation

- [Mission](.genie/product/mission.md) - Template repo goals and non-destructive guardrails
- [Technical Stack](.genie/product/tech-stack.md) - CLI + agent architecture
- [Roadmap](.genie/product/roadmap.md) - Template development phases
- [Environment Config](.genie/product/environment.md) - Config keys and placeholders
- [Getting Started](.genie/guides/getting-started.md) - Install this Genie into any repo

## Current Status

Phase 1: Template sweep in progress (neutralizing project-specific content).

## Install (into an existing repo)

1) Copy these from this template into your repo:
- `.genie/` (all)
- `.claude/commands/`
- `AGENTS.md`

2) Run the CLI:
- `./genie help`
- `./genie agent run plan "[Discovery] baseline scan [Implementation] propose wish [Verification] next steps" --no-background`

3) Customize `.genie/product/*` (mission, roadmap, environment) and start your first wish.

## Repository Structure

```
.genie/product/      # Mission, roadmap, environment
.genie/agents/       # Core agents plus modes/ and specialists/
.genie/wishes/       # Wish blueprints and status logs
 .genie/state/        # CLI-managed session data (inspect via ./genie commands)
vendors/             # External reference repos
AGENTS.md            # Framework overview & guardrails
CLAUDE.md            # AI assistant guidelines
```

## Submodules (Optional)

See `vendors/README.md` for managing external references if needed for your project.

## Notes

- This is a domain-agnostic template. Replace placeholders with your project specifics after installation.

## Philosophy

Orchestration-first. Evidence-first. Human-approved. Domain-agnostic templates that install cleanly anywhere.

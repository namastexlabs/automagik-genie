# Genie Template Repository

Genie agent templates and CLI orchestration that can be installed into any repository. Replace project specifics with placeholders and use `.genie/agents/install.md` to bootstrap into your target codebase.

## Vision

Provide reusable planning, wishing, forging, review, and commit workflows with evidence-first prompts and a consistent CLI, independent of domain.

## What’s Included

- Unified prompts for plan, wish, forge, review, commit
- Template-ready specialist agents (implementor, qa, quality, tests, self-learn, bug-reporter)
- CLI wrappers in `.claude/commands/` that @include agents
- Workspace-managed sessions and logs under `.genie/state/`

## Core Features

- Evidence-first orchestration (Discovery → Implementation → Verification)
- Guardrails (no destructive actions without approval)
- Template placeholders: `{{PROJECT_NAME}}`, `{{DOMAIN}}`, `{{TECH_STACK}}`, `{{APIS}}`, `{{METRICS}}`

## Technical Stack

- CLI runner: `.genie/cli/agent.js`
- Node/TS + Rust friendly; works in any repo (domain-agnostic)

## Documentation

- [Mission](.genie/product/mission.md) - Template repo goals and non-destructive guardrails
- [Technical Stack](.genie/product/tech-stack.md) - CLI + agent architecture
- [Roadmap](.genie/product/roadmap.md) - Template development phases
- [Environment Config](.genie/product/environment.md) - Config keys and placeholders
- [Getting Started](.genie/guides/getting-started.md) - Install this Genie into any repo

## Current Status

Phase 1: Template sweep in progress (neutralizing project-specific content).

## Repository Structure

```
.genie/product/      # Mission, roadmap, environment
.genie/agents/       # Agent prompts and orchestration playbooks
.genie/wishes/       # Wish blueprints and status logs
.genie/state/        # CLI-managed session data (inspect via ./genie commands)
docs/                # Technical documentation
vendors/             # External reference repos
AGENTS.md            # Framework overview & guardrails
CLAUDE.md            # AI assistant guidelines
```

## Submodules (Vendors)

- `vendors/hume-evi-next-js-starter` — Hume EVI Next.js starter

Update your checkout:

```
git submodule update --init --recursive
```

## Notes

- Vendor READMEs may contain product-specific examples; treat them as references. The Genie template remains domain-agnostic.

## Philosophy

Orchestration-first. Evidence-first. Human-approved. Domain-agnostic templates that install cleanly anywhere.

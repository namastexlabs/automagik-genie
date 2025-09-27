# 🧞 Unified Genie + Automagik Framework Wish
**Status:** DRAFT
**Roadmap Item:** RD-2025-HELLO-01 – @.genie/product/roadmap.md §Framework Integration
**Mission Link:** @.genie/product/mission.md §Pitch
**Standards:** @.genie/standards/development-best-practices.md §Core Principles

## Context Ledger
| Source | Type | Summary | Distributed To |
| --- | --- | --- | --- |
| framework analysis (2025-01-12) | analysis | Audit of GENIE wishes/CLI, Claude templates, Agent OS docs; identified overlap and gaps | wish, roadmap |
| user guidance (/plan orchestrator) | dialogue | Consolidate all product-mode workflows into a single `/plan` agent; commands become wrappers pointing at agents | wish |
| user feedback (retire experiments folders) | dialogue | Avoid PSAP/experiments bloat; keep storage flexible and wish-driven | wish |
| template repo prompts | repo | Clean, debloated agents from `.claude.template/` and `.genie.template/` merged into `.genie/agents/` | wish |

## Discovery Summary
- **Primary analyst:** Assistant
- **Key observations:** Genie and Claude share identical forge agents; Agent OS contributes mission/roadmap/standards; command set is fragmented; user workflow prefers a single `/plan` conversation that auto-reviews product docs, collects context, and hands off to wish/forge.
- **Assumptions:**
  - **ASM-1:** `/plan` lives under `.genie/agents/plan.md` (mirrored in `.claude/commands/plan.md` with only an `@` reference) and replaces legacy analyze/plan/spec commands.
  - **ASM-2:** Forge agents are stored once (in `.genie/agents/`) with wrappers in `.claude/commands/` that simply call `@.genie/agents/...`.
  - **ASM-3:** Advanced prompting guidance from `/prompt` becomes shared scaffolding for `/plan`, `/wish`, and supporting agents.
- **Open questions:**
  - **Q-1:** Should `/plan` always auto-read mission/roadmap/standards or provide a toggle?
  - **Q-2:** Preferred storage convention for validation artifacts (e.g., keep free-form `qa/` directories per wish)?
- **Risks:** Breaking downstream automations when retiring commands; duplicating context if wrappers misconfigured; missing branch strategy guidance.

## Executive Summary
Unify Genie, Claude templates, and Agent OS into one Automagik framework by dedicating `/plan` (as an agent) to orchestrate product-mode work. `/plan` talks with the human, pulls mission/roadmap/standards, accepts quick context via `@` file references, requests deep research via `agent.js`, and determines when to spawn a wish. `/wish` remains the blueprint contract with embedded `<spec_contract>`, `/review` (formerly wish-review) handles validation, and `/forge` plans execution. All commands become thin wrappers that reference the shared agents to avoid duplication.

## Current State
- `.genie/` contains wishes, CLI, evaluator prompt, and state logs.
- `.agent-os/` holds mission, roadmap, standards (not yet merged into Genie hierarchy).
- `.claude/commands/` mixes Agent OS proxy commands and PSAP artifacts.
- Forge personas are duplicated across `.genie/agents/` and `.claude.template/agents/`.

## Target State & Guardrails
- Move mission/roadmap/standards into `.genie/product/` & `.genie/standards/`, retire `.agent-os/`, and keep a single state manifest in `.genie/state/index.json`.
- Create `.genie/agents/plan.md` that encapsulates discovery, roadmap sync, context ledger management, branch decision prompts, and wish hand-off. Mirror it in `.claude/commands/plan.md` with a simple `@.genie/agents/plan.md` include.
- Simplify `/wish` and `/review` to reference the shared agent prompts; stores outputs in wish-defined locations (no hard-coded experiments folders).
- Keep `/forge` focused on reading the inline `<spec_contract>`; log external tracker IDs in `forge/tasks.json` only when needed.
- Document branch strategy options (dedicated branch, existing branch, micro-task via background personas) directly in wish template and supporting docs.
- Remove evaluator prompts for now; reintroduce later if this repo gains code requiring automated QA guidance.

## Execution Groups
### Group A – phase-0-consolidation
- **Goal:** Move Agent OS docs into `.genie/`, dedupe agents/commands, and delete template/PSAP remnants.
- **Surfaces:** `.agent-os/*`, `.genie/product/`, `.genie/standards/`, `.genie/agents/`, `.claude/commands/`, `.claude.template/`.
- **Deliverables:**
  - Docs migrated; `.agent-os/`, `.claude.template/`, `.genie.template/` removed.
  - `.claude/commands/` reduced to wrappers referencing `.genie/agents/`.
  - Repo free from `tasks/PSAP-*`, `experiments/AH-*` references.
- **Evidence:** Diff checklist showing consolidated structure.
- **Personas:** `forge-coder`, `forge-quality`.
- **External task hook:** forge/tasks.json → {placeholder}

### Group B – plan-agent-and-wrappers
- **Goal:** Implement `/plan` agent and replace legacy commands with thin wrappers.
- **Surfaces:** `.genie/agents/plan.md`, `.claude/commands/plan.md`, `.claude/commands/wish.md`, `.claude/commands/review.md`, `.genie/cli/agent.js`.
- **Deliverables:**
  - `/plan` prompt covering discovery, roadmap sync, `@` file references, background persona usage, branch decision capture, wish hand-off.
  - Updated `/wish` and `/review` prompts referencing the consolidated patterns.
  - CLI doc explaining how to trigger agents via `agent.js` (foreground/background).
- **Evidence:** Sample transcript demonstrating `/plan` → `/wish` flow; search proving legacy commands removed.
- **Personas:** `forge-coder`, `forge-self-learn`.
- **External task hook:** forge/tasks.json → {placeholder}

### Group C – workflow-and-git-guidance
- **Goal:** Document lifecycle (idea → `/plan` → wish → forge → review → commit/PR) and update git workflow to rely on wish metadata.
- **Surfaces:** `.genie/cli/agent.js`, `.genie/state/agents/logs/`, `docs/workflow/orchestrator.md`, `docs/git/workflow.md`, `.claude/agents/git-workflow.md`.
- **Deliverables:**
  - Branch naming guidance: default `feat/<wish-slug>`; allow existing branch or micro-task tracked in wish status log; tie PR description to wish slug & forge plan path.
  - Updated git workflow agent reading wish metadata (`wish.slug`, external tracker IDs from `forge/tasks.json`).
  - Documentation showing where to store validation artefacts (wish-defined `qa/` or inline logs).
- **Evidence:** Example PR template referencing wish slug; updated wish template capturing branch choice.
- **Personas:** `forge-master`, `forge-hooks`.
- **External task hook:** forge/tasks.json → {placeholder}

## Verification Plan
- Run `/plan` on a sample idea to ensure it auto-reads mission/roadmap/standards, records `@` references, queues background personas, and marks roadmap readiness.
- Execute `/wish` afterward to confirm inline `<spec_contract>` and branch/PR guidance populate correctly.
- Trigger `/forge` to verify it consumes the spec contract without generating extra files and logs external tasks when provided.
- Confirm `.claude/commands/` now only wrap the shared agents and contain no PSAP or experiments references.
- Update git workflow example to show branch derived from wish slug and optional external tracker IDs.

## <spec_contract>
- **Scope:** Merge framework docs, deduplicate agents, create `/plan` orchestrator, simplify command wrappers, document lifecycle and git guidance.
- **Out of scope:** Implementing specific feature wishes; reinstating evaluator tooling.
- **Success metrics:**
  - `.agent-os/` removed and docs reside in `.genie/`.
  - `/plan`, `/wish`, `/review`, `/forge` operate via shared agents and wrappers only.
  - Git workflow references wish metadata; documentation clarifies lifecycle and storage conventions.
- **External tasks:** forge/tasks.json placeholders to be populated when integrating with trackers.
- **Dependencies:** `.genie/product/roadmap.md`, `.genie/cli/agent.js`, `.claude.template/commands/prompt.md`.
</spec_contract>

## Blocker Protocol
1. If consolidation threatens existing automation, create `forge/plans/blocker-unified-genie-automagik-<timestamp>.md` detailing conflicts.
2. Notify repository owner; await updated instructions.
3. Resume only after blockers resolved or wish amended.

## Status Log
- [2025-01-12 14:05Z] Wish drafted from initial merge discussion.
- [2025-01-12 15:02Z] Separated orchestrator command from `/wish`.
- [2025-01-12 16:05Z] Finalized `/plan` agent approach, command wrappers, and phase-0 consolidation scope.
- [2025-01-12 16:40Z] Kicked off phase-0 cleanup: migrated Agent OS docs into `.genie/`, deduped forge agents, and removed `.agent-os/`.

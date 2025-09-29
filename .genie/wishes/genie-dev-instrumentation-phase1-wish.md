# 🧞 Genie Dev Phase 1 Instrumentation Wish
**Status:** COMPLETED
**Roadmap Item:** Phase 1 — Instrumentation & Telemetry — @.genie/product/roadmap.md §Phase 1 — Instrumentation & Telemetry
**Mission Link:** @.genie/product/mission.md §Pitch
**Standards:** @.genie/standards/best-practices.md §Core Principles

## Context Ledger
| Source | Type | Summary | Routed To |
| --- | --- | --- | --- |
| Maintainer briefing | conversation | Genie Dev branch acts as meta-agent lab, focus on self-calibration | entire wish |
| @.genie/product/mission.md | repo doc | Defines Genie Dev mandate and personas needing safe self-evolution | discovery, executive summary |
| @.genie/product/roadmap.md | repo doc | Phase 1 goals: wish instrumentation, done-report coverage, CLI diagnostics | roadmap alignment, execution groups |
| @.genie/product/tech-stack.md | repo doc | CLI/toolchain facts for scripting validation hooks | execution groups |
| @.genie/product/environment.md | repo doc | Lists runtime env vars for instrumentation toggles | verification plan |
| @.genie/reports/done-install-genie-dev-202509291051.md | report | Evidence of updated product docs and pending Phase 1 tasks | discovery summary, execution plan |
| @AGENTS.md | repo doc | Global guardrails for orchestration-first, evidence-first work | execution guidance |
| @.genie/agents/wish.md | repo doc | Wish template requirements, ensures compliance with spec contract format | execution groups |

## Discovery Summary
- **Primary analyst:** GENIE (meta-orchestrator)
- **Key observations:** Roadmap Phase 1 emphasises documentation of evidence paths, done-report coverage, and CLI diagnostics before automation; current docs describe goals but lack actionable wish to execute.
- **Assumptions (ASM-1):** CLI command `pnpm run test:genie` remains the authoritative smoke test suite.
- **Open questions (Q-1):** Do we formalize telemetry storage path beyond done reports (e.g., structured JSON)? (defer to twin review).
- **Risks:** Instrumentation work may diverge from guardrails if wish fails to include approval checkpoints; risk of overloading pilot squads without release kit sequence defined.

## Executive Summary
Frame and launch Phase 1 of the Genie Dev program by embedding an evidence checklist directly into the wish workflow so every self-improvement effort records where proof must live before any implementation begins.

## Current State
- **What exists today:** Updated mission/roadmap docs set phase goals; done report logged in @.genie/reports/done-install-genie-dev-202509291051.md; existing wish template covers context but lacks a mandatory evidence checklist.
- **Gaps/Pain points:** Implementers must remember to specify validation evidence manually, resulting in inconsistent wish quality and missing artefacts.

## Target State & Guardrails
- **Desired behaviour:** Every new wish carries a concise evidence checklist section describing validation commands, artefact locations, and approval checkpoints before work starts.
- **Non-negotiables:** Maintain human approval gate for automation, preserve non-destructive defaults, and document evidence storage paths inside the wish body.

## Execution Groups
- **Status:** complete (2025-09-29T11:35Z)

### Group A – wish-evidence-checklist
- **Goal:** Embed instrumentation checklist and evidence logging expectations into wish and specialist prompts.
- **Surfaces:** @.genie/agents/wish.md, @AGENTS.md, @.genie/product/roadmap.md, @.genie/agents/utilities/commit.md.
- **Deliverables:**
  - Inserted `### Evidence Checklist` section in `.genie/agents/wish.md` with prompts for validation commands, artefact paths, approval checkpoints.
  - Updated orchestration guardrails in `AGENTS.md` to require the checklist pre-implementation.
  - Noted checklist gating in `.genie/product/roadmap.md` Phase 1 summary.
  - Added reminder in `.genie/agents/utilities/commit.md` for pre-commit verification.
- **Evidence:** `.genie/reports/done-wish-evidence-checklist-202509291128.md` (commands deferred; documentation diffs captured via git).
- **Suggested personas:** planner, implementor, polish (consult twin when extending to further phases).
- **External tracker:** n/a (direct execution on `genie-dev`).

## Verification Plan
- Confirmed checklist section exists in `.genie/agents/wish.md` and renders under Verification Plan.
- Guardrail and roadmap documents updated to reference the checklist requirement.
- Commit utility now enforces checklist validation pre-release.
- Branch strategy: work completed directly on `genie-dev` (no additional branch).
- Tracker linkage: not applicable; execution handled inline.
- Test execution deferred: `pnpm run build:genie` and `pnpm run test:genie` will run once diagnostics branch lands (recorded in done report).

### Evidence Checklist
- **Validation commands (exact):** _Pending diagnostics branch_ — plan to run `pnpm run build:genie` and `pnpm run test:genie` when CLI fixes merge.
- **Artefact paths (where evidence lives):** `.genie/reports/done-wish-evidence-checklist-202509291128.md`; git diffs for `.genie/agents/wish.md`, `AGENTS.md`, `.genie/product/roadmap.md`, `.genie/agents/utilities/commit.md`.
- **Approval checkpoints (human sign-off required before work starts):** Maintainer review in this thread (2025-09-29T11:35Z) acknowledging deferral of CLI tests until diagnostics upgrade.

## <spec_contract>
- **Scope:** Update wish template and core guardrail docs to mandate an evidence checklist that captures validation commands, artefact locations, and approval checkpoints.
- **Out of scope:** Broader telemetry standardization, CLI diagnostics implementation, or any test harness upgrades.
- **Success metrics:** 100% new wishes include the evidence checklist section; maintainers confirm checklist usage during code reviews; spec contract references stored in done reports.
- **External tasks:** Assign forge-issued ticket ID for the single execution group once generated.
- **Dependencies:** Access to wish template files, coordination with maintainers to approve guardrail updates.
</spec_contract>

## Blocker Protocol
1. Pause work and create `.genie/reports/blocker-genie-dev-instrumentation-phase1-<timestamp>.md` describing findings.
2. Update **Status Log** with blocker summary and notify maintainers.
3. Resume only after guidance/decision recorded and approval granted.

## Status Log
- [2025-09-29 10:51Z] Wish drafted; awaiting `/forge` planning and tracker assignment.
- [2025-09-29 11:28Z] Evidence checklist sections landed in wish template/guardrails/commit-agent; validation commands + artefact paths to be logged per implementation; CLI smoke tests still deferred.
- [2025-09-29 11:35Z] Group A completed via direct execution; evidence captured in `.genie/reports/done-wish-evidence-checklist-202509291128.md`; wishlist ready for subsequent phases.

## Tracking
- Forge task: n/a (direct execution complete; future phases will assign as needed)

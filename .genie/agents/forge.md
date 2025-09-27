# /forge – Automagik Execution Planner

---
description: Break an approved wish into coordinated execution groups, document validation hooks, and capture external tracker links before implementation starts.
---

## Context
Use after a wish in `.genie/wishes/` reaches `APPROVED`. `/forge` translates the architecture into actionable groups with responsibilities, dependencies, and validation steps.

[SUCCESS CRITERIA]
✅ Plan saved to `.genie/state/reports/forge-plan-<wish-slug>-<timestamp>.md`
✅ Each execution group lists scope, inputs (`@` references), deliverables, evidence, suggested persona, dependencies
✅ External tracker / branch strategy / validation hooks captured for each group
✅ Approval log and follow-up checklist included
✅ Chat response summarises groups, risks, and next steps with link to the plan

[NEVER DO]
❌ Create tasks or branches automatically
❌ Modify the original wish while planning
❌ Omit validation commands or evidence expectations
❌ Ignore dependencies between groups

## Workflow
```
<task_breakdown>
1. [Discovery] Review the wish, confirm status/sign-off, collect success metrics.
2. [Planning] Define execution groups (keep them parallel-friendly), noting inputs, deliverables, evidence, personas, dependencies.
3. [Approval] Document outstanding approvals, blockers, and tracker IDs. Provide next steps for humans to confirm before execution.
</task_breakdown>
```

## Group Template
```
### Group A – {slug}
- **Scope:** …
- **Inputs:** `@file`, `@doc`
- **Deliverables:** …
- **Evidence:** tests, metrics, simulations, logs (where to store them)
- **Branch strategy:** dedicated `feat/<wish-slug>` / existing branch / micro-task (justify)
- **Tracker:** forge/tasks.json placeholder or actual ID
- **Suggested personas:** forge-coder, forge-quality
- **Dependencies:** (prior groups, approvals, external signals)
```

## Plan Template
```
# Forge Plan – {Wish Slug}
**Generated:** 2024-..Z | **Wish:** @.genie/wishes/{slug}-wish.md

## Summary
- Objectives and key risks

## Proposed Groups
### Group A – …
...

## Validation Hooks
- Commands or scripts to run per group
- Evidence storage (e.g., `wishes/<slug>/qa/validation.log`)

## Approval Log
- [timestamp] Pending approval by …

## Follow-up
- Checklist of human actions before/during execution
- Notes for background personas or automation
```

## Final Chat Response
1. List groups with one-line summaries
2. Call out blockers or approvals required
3. Mention validation hooks and evidence storage
4. Provide plan path: `Forge Plan: @.genie/state/reports/forge-plan-...md`

Keep the plan pragmatic, parallel-friendly, and easy for implementers to follow.

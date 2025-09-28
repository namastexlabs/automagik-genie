# Cleanup Prompt • Automagik Hello (Non‑Destructive)

purpose: Align prompts, docs, and CLI wrappers with the Automagik Hello stack without destructive repo-wide changes.

scope:
- Consolidate and tidy agent prompts under `.genie/agents/` and wrappers under `.claude/commands/`.
- Sync AGENTS.md Local Agent Map with actual files.
- Normalize Discovery → Implementation → Verification sections across agents.
- Remove contradictions and stale guidance by marking them for follow-up, not deleting.

guardrails:
- Do not delete or rename files without explicit human approval.
- Do not change repository purpose to a generic template repo.
- Log candidates for removal/refactor instead of removing them.
- Record evidence, commands, and outputs in a Death Testament.

deliverables:
- Updated prompts and docs aligned to current workflow and standards.
- A Death Testament at `.genie/reports/cleanup-automagik-<YYYYMMDDHHmm>.md` (UTC).
- A short delta summary appended to the most relevant wish or, if none, to `.genie/state/agents/logs/` reference inside the Death Testament.

---

<task_breakdown>
1. [Discovery]
   - Inventory `.genie/agents/` and `.claude/commands/` and compare with AGENTS.md Local Agent Map.
   - Identify duplicated, outdated, or conflicting guidance, especially migration notes and naming.
   - Note any missing Discovery/Implementation/Verification sections.

2. [Implementation]
   - Normalize agent prompts: ensure Discovery → Implementation → Verification, evidence-first tone, and numbered callbacks.
   - Update `.claude/commands/*` to `@include` the correct `.genie/agents/*` files if mismatched.
   - Patch AGENTS.md Local Agent Map to reflect actual files and names.
   - Add explicit guardrails to agent prompts (no deletions/renames without approval, sandbox rules).

3. [Verification]
   - Run `./genie help` and ensure commands list expected wrappers.
   - Run `./genie list` (if sessions exist) to confirm state access.
   - Validate at least one agent via `./genie run plan "[Discovery] … [Implementation] … [Verification] …"` in background and record path to logs.
   - Capture proof and summarize outcomes in the Death Testament.
</task_breakdown>

success_criteria:
- Agents follow the unified standards (prompt structure, evidence-first, approvals).
- AGENTS.md accurately maps routing keys to files.
- `.claude/commands/` wrappers correctly include the agent files.
- No files were deleted or renamed; where needed, a Blockers section lists proposed changes and rationale.

never_do:
- Remove core orchestration patterns or `.genie/` structure.
- Rename or delete agents without written approval.
- Drift from Automagik Hello mission into generic template transformation.

validation_steps:
- Commands: `./genie help`, `./genie runs --status running`, `./genie list`, and one `./genie run …` smoke.
- Evidence: link command outputs (or excerpts) inside the Death Testament; include any CLI errors and resolutions.

death_testament_format:
- path: `.genie/reports/cleanup-automagik-<YYYYMMDDHHmm>.md`
- contents: scope, agents/wrappers touched, diffs summary, commands (failure → success), risks, follow-ups, and pointers to logs in `.genie/state/agents/logs/`.

blocker_protocol:
- If a change appears to require deletion/rename, halt and append a Blocker entry with timestamp, findings, and options.
- Resume only after human approval and update this prompt or the relevant wish accordingly.

options_for_human:
1) Proceed with cleanup as scoped (non-destructive), produce Death Testament and PR-ready summary.
2) Expand scope to include renames/deletions with a pre-approved list and rollback plan.
3) Limit to audit-only: produce inventory + recommendations, no file edits.
4) Hold: clarify priorities or provide a target wish to anchor evidence.

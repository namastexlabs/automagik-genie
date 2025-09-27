# Automagik Framework Overview

## Repository Self-Awareness
- **Purpose**: Build Automagik Hello, a Rust-first real-time voice application stack focused on ultra-low latency and human-likeness.
- **Primary references** (all under `.genie/` now):
  - `@.genie/product/mission.md` / `mission-lite.md`
  - `@.genie/product/tech-stack.md`
  - `@.genie/product/roadmap.md`
  - `@.genie/product/environment.md`
  - `@docs/research.md` (architecture notes)
- **External dependencies**: ElevenLabs TTS (Flash v2.5 / Turbo / optional v3 alpha), Groq Whisper-large-v3-turbo STT, optional WhisperX/faster-whisper fallback. Environment variables detailed in `@.genie/product/environment.md`.

## Unified Agent Stack
The Automagik workflow lives in `.genie/agents/` and is surfaced via CLI wrappers in `.claude/commands/`:
- `plan.md` – orchestrates discovery, roadmap sync, context ledger, branch guidance
- `wish.md` – converts planning brief into a wish with inline `<spec_contract>`
- `forge.md` – breaks approved wish into execution groups + validation hooks
- `review.md` – audits wish completion and produces QA reports
- `commit.md` – aggregates diffs and proposes commit messaging
- `prompt.md` – advanced prompting guidance (formerly `.claude.template/commands/prompt.md`)
- Forge personas (`forge-coder`, `forge-quality`, etc.) plus utilities (`refactorer`, `rules-integrator`, optional `evaluator`)

All commands in `.claude/commands/` simply `@include` the corresponding `.genie/agents/...` file to avoid duplication.

## Directory Map
- `.genie/product/` – mission, roadmap, tech stack, planning notes, decisions
- `.genie/standards/` – coding rules, naming, language-specific style guides
- `.genie/instructions/` – legacy Agent OS playbooks retained for reference
- `.genie/guides/` – getting-started docs, onboarding
- `.genie/state/` – session metadata (`index.json`, agent logs, forge plans, commit advisories)
- `.genie/wishes/` – active wish contracts (`<slug>-wish.md`)
- `.genie/templates/` – reserved for future wish/plan templates (currently empty)
- `.genie/cli/agent.js` – CLI runner for agent conversations (supports `--background`)

## Workflow Summary
1. **/plan** – single-entry agent for product mode. Loads mission/roadmap/standards, gathers context (`+context`), requests background personas via CLI, and decides if item is wish-ready.
2. **/wish** – creates `.genie/wishes/<slug>-wish.md`, embedding context ledger, execution groups, inline `<spec_contract>`, branch/tracker strategy, and blocker protocol.
3. **/forge** – generates `/.genie/state/reports/forge-plan-<slug>-<timestamp>.md` with execution groups, evidence expectations, validation hooks, and external tracker placeholders (`forge/tasks.json`).
4. **Implementation** – humans/agents follow forge plan, storing evidence where the wish specifies (e.g., `wishes/<slug>/qa/`). Personas run via `./.genie/cli/agent.js chat forge-coder ...` (foreground or `--background`).
5. **/review** (optional) – aggregates QA artefacts, replays validation commands, and writes `wishes/<slug>/qa/review-<timestamp>.md` with verdict/recommendations.
6. **/commit** – groups diffs, recommends commit message/checklist, saves advisory in `.genie/state/reports/`.
7. **Git workflow** – Branch names typically `feat/<wish-slug>`; alternatives logged in the wish. PRs reference the wish and forge plan, plus any tracker IDs stored in `forge/tasks.json`. Update roadmap status after merge.

## Evidence & Storage Conventions
- Wishes define where artefacts live (recommended: `wishes/<slug>/qa/` for metrics, logs, reports). Avoid legacy `experiments/AH-*` structure unless maintaining historical data.
- External trackers are recorded in `forge/tasks.json` (one entry per execution group or overall wish).
- Background agent outputs are summarised in the wish context ledger; raw logs reside under `.genie/state/agents/logs/` when `--background` is used.

## Testing & Evaluation
- Evaluator tooling is optional. If `@.genie/agents/evaluator.md` is present, `/review` or `/plan` can reference it for scoring; otherwise, evaluation steps default to manual validation.
- Typical voice metrics: TTFB, ASR confidence, overlap behaviour, TTS artifacts (see `@.genie/product/metrics.md`).
- Validation hooks should be captured in wishes/forge plans (e.g., `pnpm test`, `cargo test`, metrics scripts).

## Prompting Standards
- Use Discovery → Implementation → Verification sections in agents and prompts.
- Always reference files with `@` to auto-load content.
- Define success/failure boundaries explicitly.
- Encourage concrete examples/snippets over abstractions.
- Advanced prompting guidance lives in `@.genie/agents/prompt.md`.

## Branch & Tracker Guidance
- **Dedicated branch** (`feat/<wish-slug>`) for medium/large changes.
- **Existing branch** only with documented rationale (wish status log).
- **Micro-task** for tiny updates; track in wish status and commit advisory.
- Tracker IDs (Jira/Linear/etc.) should be added to `forge/tasks.json` when available.

## Blocker Protocol
1. Pause execution and create `forge/state/reports/blocker-<slug>-<timestamp>.md` describing findings.
2. Update the wish status log and notify stakeholders.
3. Resume only after guidance is updated.

## CLI Quick Reference
```bash
# List agents & presets
node .genie/cli/agent.js help

# Run planner
node .genie/cli/agent.js chat plan "New idea" --preset default

# Launch background research
node .genie/cli/agent.js chat forge-coder "Audit @docs/research.md" --background

# Inspect background runs
node .genie/cli/agent.js list
```

## Migration Notes
- Agent OS directories have been merged into `.genie/` (the old `.agent-os/` folder is removed).
- `.claude.template/` and `.genie.template/` have been consolidated; their debloated prompts now live in `.genie/agents/`.
- `.claude/commands/` are thin wrappers around `.genie/agents/`; update both when introducing new agents.

Keep this document synced when introducing new agents, changing folder layouts, or adjusting workflow expectations.

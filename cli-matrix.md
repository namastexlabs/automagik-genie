# Genie CLI Command Matrix

This document captures the **approved target UX** for the Genie CLI and contrasts it with the **current implementation** (as of `.genie/cli/src/genie.ts` in this repository). Use it as the source of truth while refactoring; every statement below is backed by code references so the engineering work can be tracked and verified.

---

## Target Command Tree
```text
genie
├── run <name> "<prompt>"
├── list [agents|sessions]
├── resume <session> "<prompt>"
├── view <session> [--full]
├── stop <session>
└── help [command]
```
*Goal:* collapse the legacy entry points (`agent`, `mode`, `runs`, `continue`, `view --lines`, `stop <pid>`, etc.) into these six verbs.

---

## Command Deep Dive
Each subsection lists: current behaviour in code, the desired end-state, and concrete change notes.

### 1. `run <name> "<prompt>"`
- **Current behaviour**
  - Entry points: `genie run`, `genie agent run`, `genie mode` (see dispatcher switch at `.genie/cli/src/genie.ts:203-235`).
  - Agent lookup is segmented into `core`, `modes`, and `specialists` directories (`listAgents()` at `.genie/cli/src/genie.ts:1866-1889`).
  - Numerous runtime flags are accepted (preset, executor, background toggles, etc. in `parseArguments()` at `.genie/cli/src/genie.ts:250-323`).
- **Target**
  - Single verb `run` that resolves any `.md` under `.genie/agents/**` (folder prefix optional when unique).
  - Runtime posture comes exclusively from agent metadata / YAML defaults; CLI no longer accepts ad-hoc overrides.
- **Change notes**
  - Replace segmented `segments` logic in `listAgents()` with recursive directory walk (done in plan above).
  - Remove legacy aliases `agent`/`mode` once routing logic is migrated.
  - Audit flag stripping in `parseArguments()` (see Runtime Flag Audit below).

### 2. `list agents`
- **Current behaviour**
  - Implemented via `genie agent list` (catalog view grouped by `Modes/Core/Specialized`).
- **Target**
  - `genie list agents` should display every `.genie/agents/**.md`, grouped by folder (e.g. `root`, `core`, `specialized`, custom subfolders).
- **Change notes**
  - Catalog view is already refactored to use folder grouping (`buildAgentCatalogView` in `.genie/cli/src/views/agent-catalog.ts`).
  - Wire new top-level command when dispatcher is updated; keep `agent list` as compatibility alias until migration completes.

### 3. `list sessions`
- **Current behaviour**
  - Exposed as `genie runs` with pagination, status filters, and JSON output (see `runRuns()` in `.genie/cli/src/genie.ts:1231-1397`).
- **Target**
- Present two tables: **Active** (running / pending) and **Recent** (last 10 completions), sorted by `lastUsed` descending.
- No manual filters or pagination knobs by default; hints guide the user to `view`, `resume`, `stop`. (If we ever exceed terminal width we can reintroduce simple pagination later.)
- **Change notes**
  - `buildRunsOverviewView()` already renders the desired layout (`.genie/cli/src/views/runs.ts`).
  - Remove paging/status logic and switch `runs` verb to `list sessions`.
  - Update helpers like `buildBackgroundActions()` to reference `list sessions` (already done).

### 4. `resume <session> "<prompt>"`
- **Current behaviour**
  - `genie continue` resumes background sessions (`runContinue()` in `.genie/cli/src/genie.ts:1106-1224`).
  - Picks up many of the same runtime overrides as `run`.
- **Target**
  - Alias becomes `resume`; inherits stored executor/sandbox from the session metadata without CLI overrides.
- **Change notes**
  - Rename command when dispatcher is refactored; strip deprecated flags from argument parsing.
  - Background status view already updated to use the new copy.

### 5. `view <session> [--full]`
- **Current behaviour**
  - `genie view` tails raw log lines with optional `--lines`/`--json` (`runView()` in `.genie/cli/src/genie.ts:1399-1489`).
  - Executor-specific JSONL view rendered via `logViewer.buildJsonlView`.
- **Target**
  - Parse JSONL events and render a chat-style transcript (assistant / reasoning / tool / action messages) via new `buildChatView`.
  - Default output shows the latest assistant reply; `--full` replays the entire run.
- Header should include session id and current status; log paths must not be exposed (current CLI still prints them, so hide them as part of the refactor).
- **Change notes**
  - Transcript builder + Ink view are implemented (`buildTranscriptFromEvents`, `buildChatView`).
  - Next steps: wire the parser to drop `--lines`, `--json`, and ensure status appears in the header (TODO).

### 6. `stop <session>`
- **Current behaviour**
  - Accepts session id **or** PID, sending SIGTERM through `backgroundManager` (`runStop()` in `.genie/cli/src/genie.ts:1489-1585`).
- **Target**
  - Session-id only. PID support is risky and will be removed; stop view already renders without style parameter.
- **Change notes**
  - Code path for numeric PID has been removed; ensure downstream docs/tests reflect the new behaviour.

### 7. `help [command]`
- **Current behaviour**
  - `genie help` renders a command palette with styles/preset tables (`buildHelpView` in `.genie/cli/src/views/help.ts`).
  - JSON / style overrides exist (`--json`, `--style`, `GENIE_CLI_STYLE`).
- **Target**
  - Single Genie theme (no style flag / env override). Examples and tips aligned with new verbs.
- **Change notes**
  - Help view already simplified to fixed theme and updated examples; ensure dispatcher routes `help run`, etc., to the new copy.

---

## Execution Modes & Defaults
- **Current code**
  - `BASE_CONFIG.presets` in `.genie/cli/src/genie.ts:82-144` defines `default`, `careful`, `danger`, `debug`.
- **Plan**
  - Rename `presets` → `executionModes` with explicit sandbox/network/approval fields.
  - Update agent front matter (e.g., `.genie/agents/core/prompt.md`) to declare mode metadata; CLI should only read these values.
- **Why**
  - Eliminates confusing preset names and keeps execution posture declarative.

---

## Runtime Flag Audit
| Flag | Code reference | Action |
| --- | --- | --- |
| `--preset` | `parseArguments()` `.genie/cli/src/genie.ts:268-274` | Remove once execution modes move to config. |
| `--background` / `--no-background` | `.genie/cli/src/genie.ts:275-283` | Drop; agent metadata should drive background defaults. |
| `--executor` | `.genie/cli/src/genie.ts:284-290` | Remove per-run overrides. |
| `-c/--config` | `.genie/cli/src/genie.ts:291-296` | Remove; use config files instead. |
| `--full` | `.genie/cli/src/genie.ts:302-305` | Keep (only transcript toggle). |
| `--style`, `--json`, `--status`, `--lines`, `--page`, `--per`, `--prefix` | `.genie/cli/src/genie.ts:306-337` | Delete; functionality replaced by fixed theme and simplified listing. |

---

## Sample CLI Outputs (Target UX)
These mock outputs reflect the desired experience after refactor.

### `genie run implementor "[Discovery] Review backlog"`
```
▸ GENIE • run implementor (mode: workspace-write)
  session: 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
  watch : genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
  resume: genie resume 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 "<prompt>"
  stop  : genie stop 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
```

### `genie list agents`
```
Agents • .genie/agents
┌────────────────────────┬────────────────────────────────────────────┐
│ folder/id              │ summary                                    │
├────────────────────────┼────────────────────────────────────────────┤
│ core/plan              │ Orchestrates discovery → wish readiness    │
│ core/forge             │ Breaks wish into execution groups + checks │
│ core/twin              │ Second-opinion loop with verdict + confidence │
│ specialized/implementor│ Applies forge plan to this repo            │
│ specialized/qa         │ Validation specialist for repo standards   │
└────────────────────────┴────────────────────────────────────────────┘
```

### `genie list sessions`
```
Sessions • Active
┌──────────────┬────────────────────────────────────────────┬───────────────┐
│ agent        │ session                                    │ updated       │
├──────────────┼────────────────────────────────────────────┼───────────────┤
│ implementor  │ 01998ef3-5bc0-76c1-8aae-77bc8790d2d9        │ 2m ago        │
│ qa           │ 01998ef3-7c44-7b09-8a9b-3d9c7501c223        │ 7m ago        │
└──────────────┴────────────────────────────────────────────┴───────────────┘
Hint: `genie view <sessionId>`

Sessions • Recent (10)
┌──────────────┬────────────────────────────────────────────┬───────────────┐
│ agent        │ session                                    │ completed     │
├──────────────┼────────────────────────────────────────────┼───────────────┤
│ forge        │ 01998ef3-6d24-78f0-95bb-0de4d9517d11        │ 12m ago       │
│ prompt       │ 01998ef3-4306-7d61-9c3d-9d0f4c0c6a01        │ 18m ago       │
│ …            │ …                                          │ …             │
└──────────────┴────────────────────────────────────────────┴───────────────┘
Hint: `genie view <sessionId>` → `genie resume <sessionId> "<prompt>"` → `genie stop <sessionId>`
```

### `genie resume 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 "[Verification] Capture evidence"`
```
▸ GENIE • resume 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 (mode: workspace-write)
  status: background
  actions:
  • View: genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
  • Stop: genie stop 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
```

### `genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9`
```
Transcript • 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 (implementor)
Session: 01998ef3-5bc0-76c1-8aae-77bc8790d2d9  │  Status: running

[Assistant] ✅ Verification complete. Tests: pnpm run check → passed.
[Reasoning] Evidence saved @.genie/wishes/voice-auth-wish.md#metrics

Tip: run `genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 --full` to replay the entire session.
```

### `genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 --full`
```
Transcript • 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 (implementor)
Session: 01998ef3-5bc0-76c1-8aae-77bc8790d2d9  │  Status: completed

[Reasoning] Preparing verification plan…
[Action] Shell command
$ pnpm run check
→ exit 0 (4.2s)
[Assistant] ✅ Verification complete. Tests: pnpm run check → passed.
```

### `genie help`
```
                                   GENIE CLI


Genie Template :: Command Palette Quickstart


Usage       genie <command> [options]
Background  Enabled (detached by default)


Command        Arguments               Description
run            <agent> "<prompt>"      Start or attach to an agent
list agents                            Show available agents
list sessions                          Display active and recent runs
resume         <sessionId> "<prompt>"  Continue a background session
view           <sessionId> [--full]    Show transcript for a session
stop           <sessionId>             End a background session
help                                   Show this panel

Prompt Framework
• Discovery → load @ context, restate goals, surface blockers early.
• Implementation → follow wish/forge guidance with evidence-first outputs.
• Verification → capture validation commands, metrics, and open questions.

Examples
• genie run plan "[Discovery] mission @.genie/product/mission.md"
• genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
• genie list agents
```

---

## Migration Checklist
1. **Dispatcher** – rewrite switch in `.genie/cli/src/genie.ts:203-235` to the six target verbs. Maintain aliases (`agent`, `mode`, `runs`, `continue`, `log`) until rollout is complete.
2. **Argument parsing** – strip deprecated flags from `parseArguments()`; keep only `--full`. Remove related environment overrides (`GENIE_CLI_STYLE`, etc.).
3. **Execution modes** – replace `presets` with descriptive execution modes; update front matter and default config accordingly.
4. **Agent discovery** – ensure recursive discovery is wired to the new command set (done in plan; verify again post-dispatcher update).
5. **Session listing** – simplify `runRuns()` to produce the active/recent tables and rename command to `list sessions`.
6. **Transcript view** – finalize chat transcript rendering in `runView()`, surface session status, and remove log-path leakage.
7. **Stop semantics** – verify PID-based stop paths are removed and QA documentation reflects session-id only.
8. **Documentation refresh** – update README, AGENTS.md, QA.md, CLI tests, and onboarding scripts once code migration lands.

With this matrix, the engineering team can tackle the CLI refactor confidently while keeping documentation, code, and sample UX in sync.

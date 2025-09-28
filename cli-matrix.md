# Genie CLI Command Matrix

## Current Command Tree
```text
genie
├── agent
│   ├── list
│   ├── run <agent-id> "<prompt>"
│   ├── start <agent-id> "<prompt>" (alias of run)
│   ├── launch <agent-id> "<prompt>" (alias of run)
│   └── <agent-id> "<prompt>" (implicit shortcut for run)
├── run <agent-id> "<prompt>"
├── mode <mode-name> "<prompt>" (auto-resolves to genie-<mode-name>)
├── continue <sessionId> "<prompt>"
├── view <sessionId> [--lines N] [--json]
├── runs [--status <filter>] [--page N] [--per N] [--json]
├── stop <sessionId|pid>
└── help
```

The switch statement in `.genie/cli/src/genie.ts:203` branches into dedicated handlers (`runChat`, `runMode`, `runRuns`, etc.), which drives this structure today.

---

## Refactored Command Model (Clean-Slate UX)
Focus: universal verbs, zero runtime overrides, and minimal assumptions about agent categories. Any `.md` under `.genie/agents/` is runnable. The redesigned CLI keeps six verbs only.

### Command Tree (Expanded)
```text
genie
├── run <name> "<prompt>"
│   └── no runtime flags (execution posture comes from configuration)
├── list [agents|sessions]
│   ├── agents         # default; shows everything under .genie/agents/**
│   └── sessions       # shows active table + 10 most recent completions
├── resume <session> "<prompt>"
│   └── no runtime flags (reuses session’s stored execution posture)
├── log <session>
│   └── no runtime flags (renderer fixed to `art`)
├── stop <session>
└── help [command]
```

### Command Semantics
- **run** – Accepts a simple identifier (`plan`, `implementor`, `twin`, etc.). The resolver mirrors `.genie/cli/src/genie.ts:1896`, scanning `.genie/agents/**` recursively and matching by filename (without `.md`) or front-matter alias. No notion of “mode” vs “agent”; everything is just an agent definition.
- **list agents** – Enumerates every agent detected under `.genie/agents/`, regardless of subfolder (`core/`, `specialized/`, or future groupings). Output includes each agent’s summary and execution posture derived from metadata.
- **list sessions** – Renders two tables: active runs and the most recent 10 completions. No filters or pagination.
- **resume** – Continues a background session using stored configuration with zero CLI overrides.
- **log** – Streams/tails session output using the default renderer (style hardcoded to `art`).
- **stop** – Ends a session by id. No PID support; the CLI looks up the session and terminates associated processes automatically.
- **help** – Provides a fully rendered overview (via Ink) that includes the command tree and examples; no extra flags required.

### Execution Modes & Defaults
Execution posture (sandbox, network, approvals) comes solely from configuration:
- `.genie/cli/src/genie.ts` base defaults (`executionModes` replacing `presets`).
- Agent front matter (e.g., `.genie/agents/core/prompt.md` or `.genie/agents/specialized/implementor.md`) declaring `executor` settings.

Suggested mode keys aligned with `codex --help`:
| Mode key | Sandbox | Network | Approval policy | Intended use |
| --- | --- | --- | --- | --- |
| `workspace-write` | `workspace-write` | disabled | `on-failure` | Default development.
| `workspace-read` | `read-only` | disabled | `on-request` | Safe review/exploration.
| `full-access` | `danger-full-access` | enabled | `never` | Trusted environments needing broader access.
| `analysis` | `workspace-read` | enabled | `on-request` | Research/planning with network.

Agents declare their mode via metadata, for example:
```yaml
---
name: twin
summary: Second-opinion loop with verdict + confidence
executor:
  sandbox: workspace-read
  network: enabled
  approvalPolicy: on-request
---
```
The CLI simply reads these values; subfolders exist for human organization but have no semantic meaning to the command itself.

### Runtime Override Flags – Removed
All runtime override options must be removed from the parser and help:
- `-b`, `--background`
- `-f`, `--no-background`
- `-C`, `--config`
- `-s`, `--style`
- `-J`, `--json`
- `--preset`, `-p`, `--executor`
- Session filters (`--status`, `--page`, `--per`)
- Legacy `--prefix`

Migration task: clean `parseArguments` in `.genie/cli/src/genie.ts:263-324`, remove dependent logic in dispatcher and view builders, and hardcode renderer style to `art` only.

### UX Advantages
1. **Universal launch verb** – `run` works for every agent definition without category awareness.
2. **Simplified discovery** – `list agents` shows everything detected under `.genie/agents/`; humans can organize files in subfolders as they see fit.
3. **Zero surprise overrides** – Runtime behavior adheres strictly to declarative configuration in YAML/front matter.
4. **Streamlined session overview** – `list sessions` shows active and recent runs without filters.
5. **Transparent execution policy** – Modes live alongside agent definitions and mirror `codex` semantics.
6. **Installation roadmap** – Packaging work (see Implementation Notes) will evolve `genie` into an installable CLI.

### Migration Map
| Legacy command | Replacement |
| --- | --- |
| `genie agent list` | `genie list agents` |
| `genie agent run <id> "..."` | `genie run <id> "..."` |
| `genie mode <mode> "..."` | `genie run <mode> "..."` (mode files live in `.genie/agents/`) |
| `genie runs --status running` | `genie list sessions` |
| `genie continue <session> "..."` | `genie resume <session> "..."` |
| `genie view <session>` | `genie log <session>` |
| `genie stop <session|pid>` | `genie stop <session>` |

---

## Sample CLI Outputs (Illustrative)

### `genie run implementor "[Discovery] Review backlog"`
```
▸ GENIE • run implementor (mode: workspace-write)
  session: RUN-8A2Q4
  watch : genie log RUN-8A2Q4
  resume: genie resume RUN-8A2Q4 "<prompt>"
  stop  : genie stop RUN-8A2Q4
```

### `genie list agents`
```
Agents • Detected in .genie/agents/
┌────────────────┬────────────────────────────────────────────┬───────────────┐
│ id             │ summary                                     │ mode          │
├────────────────┼────────────────────────────────────────────┼───────────────┤
│ core/plan      │ Orchestrates discovery → wish readiness     │ analysis      │
│ core/forge     │ Breaks wish into execution groups + checks  │ workspace-write│
│ core/twin      │ Second-opinion loop with verdict + confidence│ analysis      │
│ specialized/implementor │ Applies forge plan to this repo    │ workspace-write│
│ specialized/qa │ Validation specialist for repo standards    │ workspace-read │
│ ...            │ ...                                         │ ...           │
└────────────────┴────────────────────────────────────────────┴───────────────┘
Run with: `genie run core/plan "..."` or `genie run twin "..."` (folder prefix optional when unique)
```

### `genie list sessions`
```
Sessions • Active
┌──────────────┬──────────────┬───────────────┬──────────────┐
│ agent        │ session      │ updated       │ log          │
├──────────────┼──────────────┼───────────────┼──────────────┤
│ implementor  │ RUN-8A2Q4    │ 2m ago        │ state/logs/...│
│ qa           │ RUN-3NZP1    │ 7m ago        │ state/logs/...│
└──────────────┴──────────────┴───────────────┴──────────────┘

Sessions • Recent (10)
┌──────────────┬──────────────┬───────────────┬──────────────┐
│ agent        │ session      │ completed     │ log          │
├──────────────┼──────────────┼───────────────┼──────────────┤
│ forge        │ RUN-91KLT    │ 12m ago       │ state/logs/...│
│ prompt       │ RUN-7JSB2    │ 18m ago       │ state/logs/...│
│ ...          │ ...          │ ...           │ ...           │
└──────────────┴──────────────┴───────────────┴──────────────┘
```

### `genie resume RUN-8A2Q4 "[Verification] Capture evidence"`
```
▸ GENIE • resume RUN-8A2Q4 (mode: workspace-write)
  status: background
  actions:
    watch : genie log RUN-8A2Q4
    stop  : genie stop RUN-8A2Q4
```

### `genie log RUN-8A2Q4`
```
Log • RUN-8A2Q4 (implementor)
last prompt: [Verification] Capture evidence
─ tail (60 lines default) ────────────────────────────────────
[00:12:54] ✅ Tests: pnpm run check
[00:12:59] 📎 Evidence saved @.genie/wishes/voice-auth-wish.md#metrics
[00:13:04] 🤖 Awaiting next instruction…
──────────────────────────────────────────────────────────────
Next: `genie resume RUN-8A2Q4 "<prompt>"`
```

### `genie help run`
```
Help • run
Usage: genie run <name> "<prompt>"
- Launch any agent markdown under .genie/agents/
- Execution mode is defined in agent metadata (workspace-write/read/full-access/analysis)
Prompt scaffold:
  [Discovery] …
  [Implementation] …
  [Verification] …
Examples:
  genie run plan "[Discovery] mission @.genie/product/mission.md"
  genie run twin "[Discovery] Pressure-test @.genie/wishes/auth-wish.md"
```

---

## Implementation Notes & Packaging Plan
1. **Dispatcher update** – Replace the case statement in `.genie/cli/src/genie.ts:203` with the new verb set (`run`, `list`, `resume`, `log`, `stop`, `help`).
2. **Agent discovery** – Update `listAgents()` to recursively scan `.genie/agents/**`, return normalized ids (including folder prefix when needed), and expose metadata without categorization. Remove assumptions about `modes/` or `specialists/`.
3. **Resolver merge** – Collapse `runMode` into `runChat` so `run` handles every agent file seamlessly. Allow shorthand names when unique; otherwise require folder-qualified ids.
4. **Listing engine** – Refactor `runRuns` into a helper producing the active/recent session tables. Remove pagination/state filters.
5. **Configuration cleanup** – Replace `presets` in `BASE_CONFIG` with `executionModes`. Ensure agent front matter declares executor settings. Hardcode renderer style to `art` and strip style toggles from help/views.
6. **Parser purge** – Delete runtime override flags from `parseArguments` and downstream logic. Remove JSON and PID stop codepaths; `stop` should operate on session ids only.
7. **CLI distribution** – Package `genie` as an npm binary (`bin` entry) for broader use; provide interim symlink instructions until publishing.
8. **Documentation refresh** – Update `README.md`, `.genie/guides/`, and agent playbooks to reflect the simplified command surface, folder-agnostic discovery, and declarative execution modes.

This plan eliminates mode distinctions, treats every agent markdown uniformly, relies on a richer `help` output, and finalizes the zero-override CLI experience.

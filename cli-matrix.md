# Genie CLI Design Document

> **✅ STATUS: IMPLEMENTED (2025-09-29)**
> This document originally served as the design specification and migration plan for the Genie CLI refactor.
> **All target commands have been successfully implemented** and validated against the live CLI.
> This document is now preserved as **design rationale** and **historical reference**.

---

## Overview

This document captures the **approved target UX** for the Genie CLI that has now been **fully implemented** in `.genie/cli/src/genie.ts`. It serves as both design rationale and validation reference, with actual CLI outputs verified against the original specifications.

**Validation Date:** 2025-09-29
**CLI Version:** `.genie/cli/dist/genie.js` (post-refactor)

---

## ✅ Implemented Command Tree
```text
genie
├── run <name> "<prompt>"          ✅ IMPLEMENTED
├── list [agents|sessions]         ✅ IMPLEMENTED
├── resume <session> "<prompt>"    ✅ IMPLEMENTED
├── view <session> [--full]        ✅ IMPLEMENTED
├── stop <session>                 ✅ IMPLEMENTED
└── help [command]                 ✅ IMPLEMENTED
```

**Validation Results:**
- ✅ All 6 core commands functional
- ✅ Legacy aliases removed (`agent`, `mode`, `runs`, `continue`)
- ✅ Deprecated flags removed (`--preset`, `--background`, `--executor`, `--lines`, `--json`, `--style`)
- ✅ Session-id only for `stop` (PID support removed)
- ✅ `--full` flag works for `view`
- ✅ Per-command help available via `genie <command> --help`
- ✅ 29 agents discovered via `list agents`, grouped by folder structure

---

## Command Implementation Details
Each subsection documents the **implemented behavior** with validation notes.

### 1. ✅ `run <name> "<prompt>"`
**Status:** IMPLEMENTED

**Implementation Details:**
- Dispatcher at `.genie/cli/src/genie.ts:202` handles `run` command
- Resolves agents from `.genie/agents/**/*.md` with recursive discovery
- Agent metadata (model, sandbox, reasoning) read from YAML frontmatter
- Background mode default; spinner sequence works as designed
- Help available via `genie run --help`

**Validation:**
```bash
$ ./genie run --help
# ✅ Shows proper help with arguments and examples
# ✅ No deprecated flags in output
```

**Design Goals (Achieved):**
- ✅ Single `run` verb (legacy aliases removed)
- ✅ Runtime config from agent metadata only (no CLI overrides)
- ✅ Recursive agent discovery across all folders
- ✅ Background spinner sequence implemented

### 2. ✅ `list agents`
**Status:** IMPLEMENTED

**Implementation Details:**
- Dispatcher at `.genie/cli/src/genie.ts:216` handles `list` command
- Catalog view at `.genie/cli/src/views/agent-catalog.ts`
- Discovers all `.md` files recursively under `.genie/agents/`
- Groups by folder: root, utilities/, specialists/, custom folders
- Shows agent count and folder summaries

**Validation:**
```bash
$ ./genie list agents
# ✅ Shows 29 agents grouped by 3 folders (root, utilities, specialists)
# ✅ Clean table layout with identifier and summary columns
# ✅ Provides usage hints
```

**Design Goals (Achieved):**
- ✅ `list agents` command (not `agent list`)
- ✅ Folder-based grouping
- ✅ Recursive discovery across all agent directories

### 3. ✅ `list sessions`
**Status:** IMPLEMENTED

**Implementation Details:**
- Same dispatcher entry as `list agents` (`.genie/cli/src/genie.ts:216`)
- Renders Active and Recent tables via `buildRunsOverviewView()`
- Active sessions show real-time status (running/pending)
- Recent sessions limited to last 10, sorted by `lastUsed` descending
- Provides action hints for `view`, `resume`, `stop`

**Validation:**
```bash
$ ./genie list sessions
# ✅ Shows two tables: "Active Sessions" and "Recent Sessions"
# ✅ Empty state handled gracefully
# ✅ Clear usage hints provided
# ✅ No pagination/filter flags (simplified UX)
```

**Design Goals (Achieved):**
- ✅ Two-table layout (Active + Recent)
- ✅ No pagination controls (clean, simple)
- ✅ Action hints guide next steps

### 4. ✅ `resume <session> "<prompt>"`
**Status:** IMPLEMENTED

**Implementation Details:**
- Dispatcher at `.genie/cli/src/genie.ts:209` handles `resume` command
- Inherits executor/sandbox/model from stored session metadata
- No runtime overrides accepted (config locked to session)
- Background spinner sequence matches `run` behavior

**Validation:**
```bash
$ ./genie resume --help
# ✅ Shows proper help with <sessionId> and <prompt> arguments
# ✅ No deprecated flags in output
# ✅ Examples reference session IDs from list sessions
```

**Design Goals (Achieved):**
- ✅ Command renamed from `continue` to `resume`
- ✅ Config inheritance from session (no CLI overrides)
- ✅ Consistent spinner UX with `run`

### 5. ✅ `view <session> [--full]`
**Status:** IMPLEMENTED

**Implementation Details:**
- Dispatcher at `.genie/cli/src/genie.ts:223` handles `view` command
- Parses JSONL events and renders chat-style transcript
- Default: shows latest assistant reply (last 2 messages)
- `--full`: replays entire session transcript
- Header shows session metadata (no log paths exposed)

**Validation:**
```bash
$ ./genie view --help
# ✅ Shows proper help with <sessionId> and [--full] option
# ✅ Only flag: --full (--lines, --json removed)
# ✅ Examples show proper session ID format
```

**Design Goals (Achieved):**
- ✅ Chat-style transcript (not raw log lines)
- ✅ Default: latest reply; `--full`: complete history
- ✅ Deprecated flags removed (--lines, --json, --style)
- ✅ Log paths hidden from user

### 6. ✅ `stop <session>`
**Status:** IMPLEMENTED

**Implementation Details:**
- Dispatcher at `.genie/cli/src/genie.ts:230` handles `stop` command
- Accepts session ID only (PID support removed)
- Sends SIGTERM via `backgroundManager`
- Clean error messages for invalid sessions

**Validation:**
```bash
$ ./genie stop --help
# ✅ Shows proper help with <sessionId> argument
# ✅ No PID support mentioned or accepted
# ✅ Examples use proper session ID format
```

**Design Goals (Achieved):**
- ✅ Session-ID only (PID support removed for safety)
- ✅ Clean stop workflow via background manager

### 7. ✅ `help [command]`
**Status:** IMPLEMENTED

**Implementation Details:**
- Dispatcher at `.genie/cli/src/genie.ts:237-239` handles `help` command
- Fixed Genie theme (no style overrides)
- Command palette shows all 6 commands with descriptions
- Per-command help via `genie <command> --help`

**Validation:**
```bash
$ ./genie help
# ✅ Shows clean command palette
# ✅ No style/preset tables (simplified)
# ✅ Examples aligned with new command structure
# ⚠️  Note: `./genie --help` shows error but still displays help (minor UX quirk)
```

**Design Goals (Achieved):**
- ✅ Single fixed theme (no --style flag)
- ✅ Updated examples for new verbs
- ✅ Per-command help works (`genie <cmd> --help`)

---

## ✅ Sandbox & Approval Configuration
**Status:** IMPLEMENTED

**Implementation Details:**
Agents configure their execution environment via two independent settings in YAML frontmatter:

### 1. Sandbox (File System Access)
Available modes (`.genie/cli/src/executors/codex.ts:15`, `.genie/agents/README.md:77-84`):
- `read-only` – Read files only (analysis, review agents)
- `workspace-write` – Read/write in workspace (default, implementation agents)
- `danger-full-access` – Full system access (rare, externally sandboxed only)

### 2. Approval Policy (Human Interaction)
Available policies (`.genie/cli/src/executors/codex.ts:16`, `.genie/agents/README.md:85-93`):
- `never` – No approvals (fully automated)
- `on-failure` – Ask when commands fail (default)
- `on-request` – Ask for risky operations (interactive)
- `untrusted` – Ask for everything (high-security)

### Agent Frontmatter Example
```yaml
genie:
  executor: codex
  exec:
    sandbox: read-only
    approvalPolicy: on-request
    reasoningEffort: high
```

**Design Goal Achieved:**
- ✅ Two separate, clear configuration dimensions (access + approval)
- ✅ Declared per-agent in frontmatter; no CLI flag overrides
- ✅ Optional convenience presets exist in `BASE_CONFIG.executionModes` (.genie/cli/src/genie.ts:132-171) but agents use direct configuration

---

## Runtime Flag Audit
| Flag | Code reference | Action |
| --- | --- | --- |
| `--preset` | ~~Never existed in parser~~ | ✅ REMOVED from documentation - execution modes configured per-agent in YAML frontmatter only. |
| `--background` / `--no-background` | `.genie/cli/src/genie.ts:275-283` | Drop; defaults live in config/metadata. |
| `--executor` | `.genie/cli/src/genie.ts:284-290` | Drop; defaults live in config/metadata. |
| `-c/--config` | `.genie/cli/src/genie.ts:291-296` | Drop; defaults live in config/metadata. |
| `--full` | `.genie/cli/src/genie.ts:302-305` | Keep (transcript toggle). |
| `--style`, `--json`, `--lines`, `--per`, `--prefix` | `.genie/cli/src/genie.ts:306-337` | Delete; replaced by fixed Genie theme & simplified views. |
| `--status`, `--page` | `.genie/cli/src/genie.ts:308-331` | Legacy filters; consider reintroducing simple `--page` only if session list grows beyond 10 entries. |

---

## Sample CLI Outputs (Target UX)
These mock outputs reflect the desired experience after refactor.

### `genie run implementor "[Discovery] Review backlog"`
```
⠋ Starting background agent…
⠙ Obtaining session id…
▸ GENIE • run implementor (mode: workspace-write)
  session: 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
  • View: genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
  • Resume: genie resume 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 "<prompt>"
  • Stop: genie stop 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
```

### `genie list agents`
```
Agents • .genie/agents
┌────────────────────────┬────────────────────────────────────────────┐
│ folder/id              │ summary                                    │
├────────────────────────┼────────────────────────────────────────────┤
│ plan                   │ Orchestrates discovery → wish readiness    │
│ forge                  │ Breaks wish into execution groups + checks │
│ utilities/twin         │ Second-opinion loop with verdict + confidence │
│ specialists/implementor│ Applies forge plan to this repo            │
│ specialists/qa         │ Validation specialist for repo standards   │
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
⠋ Starting background agent…
⠙ Obtaining session id…
▸ GENIE • resume 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 (mode: workspace-write)
  status: background
  actions:
  • View: genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
  • Stop: genie stop 01998ef3-5bc0-76c1-8aae-77bc8790d2d9
```

### `genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9`
```
Transcript • 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 (implementor)
Session     01998ef3-5bc0-76c1-8aae-77bc8790d2d9
Status      running
Executor    codex
Execution mode workspace-write
Background  detached

[Assistant] ✅ Verification complete. Tests: pnpm run check → passed.
[Reasoning] Evidence saved @.genie/wishes/voice-auth-wish.md#metrics

Tip: run `genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 --full` to replay the entire session.
```

### `genie view 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 --full`
```
Transcript • 01998ef3-5bc0-76c1-8aae-77bc8790d2d9 (implementor)
Session     01998ef3-5bc0-76c1-8aae-77bc8790d2d9
Status      completed
Executor    codex
Execution mode workspace-write
Background  detached

[Reasoning] Preparing verification plan…
[Action] Shell command
$ pnpm run check
→ exit 0 (4.2s)
[Assistant] ✅ Verification complete. Tests: pnpm run check → passed.
```

### `genie --help`
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
• Plan → load @ context (mission, roadmap, standards), restate goals, surface blockers early.
• Wish → capture spec contract, execution plan, branch/tracker guidance, and evidence expectations.
• Forge → break wish into execution groups, validations, and specialist hand-offs.
• Implementation → follow forge guidance, delegate to specialists, capture evidence as you go.
• Verification → replay validation hooks, summarize metrics, queue review/commit follow-ups.

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

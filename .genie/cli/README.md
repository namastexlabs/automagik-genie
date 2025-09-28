# GENIE CLI Architecture

This directory hosts the runtime wrapper that powers `./genie` commands. The CLI is responsible for
routing user requests, launching Codex (or other executors), tracking background runs, and exposing
tooling for inspection.

## Module Map

```
.genie/cli/
├── dist/                 # Compiled JavaScript emitted by `pnpm run build:genie`
├── src/                  # TypeScript sources
├── tsconfig.json         # TypeScript compiler configuration
├── config.yaml           # Default presets/paths merged into runtime config
└── README.md             # This document
```

Key source modules (`src/`):

- `genie.ts` – Entry point invoked by `./genie` (compiled to `dist/genie.js`).
- `background-manager.ts` – Spawns and tracks detached background child processes.
- `session-store.ts` – Loads/persists agent run metadata (`sessions.json`).
- `executors/codex.ts` – Codex executor adapter (command builder + hooks).
- `executors/codex-log-viewer.ts` – Codex-specific log parser for experimental JSON streams.

### `genie.ts`
* Parses CLI arguments (`run`, `mode`, `continue`, `view`, `stop`, `runs`, `list`, `help`).
* Loads configuration (from `config.yaml` + overrides) and prepares required directories.
* Resolves the target agent markdown (`.genie/agents/*.md`) to extract instructions and metadata.
* Delegates actual execution to an executor (defaults to `codex`).
* Manages background runs via `BackgroundManager`, wiring environment variables for the detached process.
* Tracks sessions using `session-store` (stores state in `.genie/state/agents/sessions.json`).
* Provides inspection tooling (`genie runs`, `genie view`) leveraging executor-supplied log viewers.

### `background-manager.ts`
* Thin wrapper around `child_process.spawn` that launches `node genie.js ...` in a detached mode.
* Annotates children with metadata (launch time, log file, arguments) and exposes simple controls:
  * `launch()` – spawn background process and emit lifecycle events.
  * `stop()` / `isAlive()` – manage or query background workers.
  * `list()` – enumerate tracked child processes.

### `session-store.ts`
* Abstracts reading/writing the session ledger (`sessions.json`).
* Handles minor migration work (ensuring every entry has an executor name).
* Designed to stay storage-format agnostic so executors/CLI can evolve independently.

### `executors/codex.ts`
* Defines the contract for invoking Codex. Key responsibilities:
  * Provide defaults (`binary`, session directory, CLI flags) consumed by `genie.js`.
  * `buildRunCommand` and `buildResumeCommand` – convert tool config into shell arguments (e.g. `codex exec`).
  * `resolvePaths` – executor-specific paths (session transcripts).
  * `extractSessionId` / `getSessionExtractionDelay` – hook used by the CLI to capture session IDs from Codex artifacts.
  * `logViewer` – attach Codex-specific interpretation logic (imported from `codex-log-viewer.js`).

### `executors/codex-log-viewer.ts`
* Encapsulates everything required to understand Codex experimental JSON logs:
  * Session ID extraction from streamed JSON lines.
  * Rendering logic used by `genie view` (reasoning summaries, assistant output, MCP/tool statistics, token usage, stream errors).
* By pushing this code into the executor boundary, `genie.js` stays executor-agnostic.

## Execution Flow (happy path)

1. `./genie run hello-coder "Prompt..."`
2. `genie.js` parses options, merges config, prepares directories.
3. Agent spec (`.genie/agents/hello-coder.md`) is loaded for instructions.
4. `executors/codex.js` builds the Codex command and optional resume metadata.
5. `genie.js` launches the process (foreground or background) and streams logs to `.genie/state/agents/logs/...`.
6. Session metadata is persisted via `session-store` – enabling `genie runs` and `genie continue` later.
7. On completion, Codex JSONL logs are parsed through the executor’s `logViewer` when a human runs `genie view`.

## Build & Test Workflow

```
pnpm run build:genie   # compile TypeScript sources to .genie/cli/dist
pnpm run test:genie    # build + run lightweight CLI unit tests
```

The `./genie` shell script executes `node .genie/cli/dist/genie.js`, so the CLI works immediately
after a successful build (compiled artifacts are committed alongside the sources).

## Background Runs

* Background runs reuse the same entrypoint (`genie.js`) but are spawned in a separate Node process.
* Launch metadata is stored both in-memory (`BackgroundManager`) and on disk (`sessions.json`).
* `genie runs` surfaces the status by combining session information with `BackgroundManager.isAlive()` checks.

## Adding a New Executor

To integrate another backend (e.g., a Rust binary or different AI service):

1. Create `src/executors/<name>.ts` exporting the same shape as `codex.ts`:
   ```ts
   import { Executor } from './types';

   const myExecutor: Executor = {
     defaults,
     buildRunCommand,
     buildResumeCommand,
     resolvePaths,
     extractSessionId,
     getSessionExtractionDelay,
     logViewer
   };

   export default myExecutor;
   ```
2. Rebuild the CLI (`pnpm run build:genie`) – executors are discovered automatically from the compiled
   `.genie/cli/dist/executors` directory, so no edits to `genie.ts` are required.
3. (Optional) Provide a `logViewer` module if the executor emits structured logs that should be rendered
   by `genie view`.

## Known Redundancies / Dead Code

* The CLI still contains Codex-biased help text and prompts; consider moving these into executor metadata for easier reuse.

## Codex Parameters

The CLI supports all standard Codex execution parameters. These can be configured via defaults in `config.yaml`, presets, or runtime overrides:

### Core Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **prompt** | string | - | The initial user prompt to start the conversation (required) |
| **base-instructions** | string | - | Custom instructions loaded from agent files, overrides defaults |
| **model** | string | `gpt-5-codex` | Model to use (e.g., `o3`, `o4-mini`) |
| **sandbox** | string | `workspace-write` | Sandbox mode: `read-only`, `workspace-write`, `danger-full-access` |
| **approval-policy** | string | `on-failure` | Shell command approval: `untrusted`, `on-failure`, `on-request`, `never` |
| **profile** | string | null | Configuration profile from config.toml |
| **cwd** | string | - | Working directory (passed as `cd` option) |

### Feature Flags
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **include-plan-tool** | boolean | false | Whether to include the plan tool |
| **search** | boolean | false | Enable search capabilities |
| **skip-git-repo-check** | boolean | false | Skip git repository verification |
| **json** | boolean | false | Output in JSON format |
| **experimental-json** | boolean | true | Use experimental JSON streaming |
| **full-auto** | boolean | true | Run without user interaction (sets workspace-write + on-failure) |

### Advanced Options
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **output-schema** | string | null | Schema for structured output |
| **output-last-message** | string | null | Path to save last message |
| **reasoning-effort** | string | `low` | Reasoning effort: `low`, `medium`, `high` |
| **color** | string | `auto` | Color output mode |
| **images** | array | [] | Image paths to include |
| **additional-args** | array | [] | Extra arguments to pass through |

### Configuration Priority
1. Command-line arguments (highest priority)
2. Preset configuration (from `config.yaml`)
3. Default values in `codex.ts` (lowest priority)

## Approval Modes & Sandbox Settings

### Approval Policy Options
| Mode | Flag | Description |
|------|------|-------------|
| **never** | `--ask-for-approval never` | No approval prompts (works with all sandbox modes) |
| **on-failure** | `--ask-for-approval on-failure` | Ask for approval when sandboxed commands fail |
| **on-request** | `--ask-for-approval on-request` | Ask for approval for risky operations |
| **untrusted** | `--ask-for-approval untrusted` | Ask for approval for all operations |

### Sandbox Modes
| Mode | Flag | Description |
|------|------|-------------|
| **read-only** | `--sandbox read-only` | Can only read files, no edits or commands |
| **workspace-write** | `--sandbox workspace-write` | Can edit files and run commands in workspace |
| **danger-full-access** | `--sandbox danger-full-access` | Full system access (use with caution) |

### Common Combinations
| Intent | Flags | Effect |
|--------|-------|--------|
| **Safe browsing** | `--sandbox read-only --ask-for-approval on-request` | Read files only, ask before edits/commands |
| **Read-only CI** | `--sandbox read-only --ask-for-approval never` | Read only, never escalates |
| **Auto mode** | `--full-auto` | Equivalent to `--sandbox workspace-write --ask-for-approval on-failure` |
| **Edit repo, ask if risky** | `--sandbox workspace-write --ask-for-approval on-request` | Edit workspace, ask for risky operations |
| **YOLO (not recommended)** | `--dangerously-bypass-approvals-and-sandbox` | No sandbox, no prompts (alias: `--yolo`) |

### Default Behavior
- **Version-controlled folders**: Auto mode (workspace-write + on-failure approvals)
- **Non-version-controlled folders**: Read-only mode recommended
- **Network access**: Disabled by default in workspace-write unless enabled in config
- **Workspace scope**: Current directory + temporary directories (/tmp)

### Fine-tuning in config.toml
Network access can be enabled for workspace-write mode:
```toml
[sandbox_workspace_write]
network_access = true
```

## Enhancement / Cleanup Ideas

1. **Modularise CLI Concerns** – break `genie.js` into smaller files (argument parsing, command handlers, output rendering) for maintainability.
2. **Executor Registry** – load executors dynamically (filesystem or config-driven) instead of hardcoding `EXECUTORS` to enable pluggable backends.
3. **Shared Log Viewer Contract** – formalise the viewer interface (TypeScript typings or JSDoc) so each executor implements `extractSessionIdFromContent`, `renderJsonlView`, etc.
4. **Session Store Schema Versioning** – introduce explicit migrations when we add fields (e.g., tokens, last command) to avoid ad hoc checks.
5. **Upgrade Background Manager** – enrich `genie stop <sessionId>` (timeouts, SIGKILL fallback, richer logging).
6. **Improve Error Surfacing** – bubble executor startup failures (like MCP timeouts) back to the main CLI rather than only appearing in `genie view`.
7. **Testing Harness** – add unit tests for session-store + log viewer using captured JSON fixtures to prevent regressions when Codex schema shifts.
8. **Runtime Diagnostics** – add structured logging (JSONL) around executor launches to aid debugging without inspecting raw log files.

# GENIE CLI Reformatted Output — QA Playbook (2025-09-28)

This checklist exercises the new Ink-based presentation layer and validates JSON/view parity. Execute in repo root unless noted.

## Automated Regression
1. `pnpm install`
2. `pnpm run build:genie`
3. `pnpm run test:genie`
   - Confirms TypeScript build, executor view integration, and session-store defaults.

## Manual Presentation Matrix
Run each command in three styles to verify theming:
- Default (compact): `./genie …`
- Art mode: `./genie … --style art`
- Plain mode via env override: `GENIE_CLI_STYLE=plain ./genie …`

### 1. Top-Level Help
- `./genie help`
- Capture that hero header, tables, and tips render identically across styles.
- Validate JSON envelope: `./genie help --style art --json` (should dump full view schema).

### 2. Session Listings
- `./genie runs`
- `./genie runs --json`
- `./genie runs --status running`
- `./genie runs --status running --json`
- Paging smoke: `./genie runs --page 2 --per 2` (expect empty page, pager hints update).
- Default runs view: `./genie runs` (should show recent sessions).

### 3. Log Viewing
Use a known session ID (update if fresh runs exist):
- Human view: `./genie view 01998ef3-aab8-7d80-afdb-cd5507c15191 --lines 10`
- JSON tail: `./genie view 01998ef3-aab8-7d80-afdb-cd5507c15191 --json`
- Nonexistent session: `./genie view does-not-exist` → error callout.
- Missing log (temporarily move log file): expect "Log missing" callout.

### 4. Stop Workflow
- `./genie stop 01998ef3-aab8-7d80-afdb-cd5507c15191`
- `./genie stop 99999` (PID that has no process)
- `./genie stop does-not-exist` (string target) → failure timeline entry.
- Verify JSON envelope: append `--json` on one of the above.

### 5. Background Detach Preview
Pick a specialist agent with a lightweight prompt (e.g., `polish`):
- `./genie agent run polish "[Discovery] sanity ping" --no-background`
- `./genie agent run polish "[Discovery] background" --background`
  - Ensure detach callout displays log path + session id.
- `./genie continue <sessionId> "[Verification] follow-up" --background`
- `./genie runs --status running` should briefly show `🟢` during execution.
- Clean up with `./genie stop <sessionId>`.

### 6. JSON Parity & Meta Integrity
For each command above, capture both human render and JSON output; confirm `meta` holds the same structured data as the visual table (agents, pager hints, warnings, etc.).

### 7. Warning Channels
- Corrupt `.genie/state/agents/sessions.json` (e.g., append `{`), run `./genie runs`; verify warning callout appears once and `QA.md` notes to restore file.
- Restore file and rerun to ensure warning queue clears.

### 8. Style Toggle via Env
- `GENIE_CLI_STYLE=art ./genie runs --status completed`
- `GENIE_CLI_STYLE=plain ./genie help`
- Confirm CLI option still overrides env: `GENIE_CLI_STYLE=plain ./genie help --style art` (should produce art gradient).

### 9. Executor Log Viewer Envelope
- Locate a recent session with `./genie runs`, run `./genie view <sessionId>` to verify output displays correctly.

### 10. Smoke `--json` for Stop/List/Help
- `./genie stop 99999 --json`
- `./genie runs --json`
- `./genie help --json`

## Post-QA Cleanup
- Ensure any manually edited state files are restored.
- If background processes were launched, `./genie runs --status running` should be empty.
- Re-run `pnpm run test:genie` if state files were touched.

Document actual outputs or screenshots as evidence in the wish context ledger.

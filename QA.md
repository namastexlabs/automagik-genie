### 1. Top-Level Help
- `./genie --help`
- Verify hero header, command table, and tips render with the Genie theme.

### 2. Agent Catalog
- `./genie list agents`
- Confirm entrypoint vs utility vs specialist grouping reflects folder structure (root files, `utilities/`, `specialists/`).

### 3. Session Listings
- `./genie list sessions`
- Trigger a background run (`./genie run implementor "[Discovery] hello"`) and confirm the session appears under **Active**.
- Stop the run: `./genie stop <sessionId>`; the entry should move to **Recent**.

### 4. Transcript View
Use a recent session id:
- Latest message: `./genie view <sessionId>`
- Full replay: `./genie view <sessionId> --full`
- Missing session: `./genie view does-not-exist` → error callout.
- Temporarily move the log file and re-run to confirm the “Log missing” callout.

### 5. Stop Workflow
- `./genie stop <sessionId>` (active session)
- `./genie stop does-not-exist` → failure timeline entry.

### 6. Background Detach Preview
Pick a specialist agent with a lightweight prompt (e.g., `polish`):
- `./genie run polish "[Discovery] sanity ping"`
- `./genie run polish "[Discovery] background"`
  - Ensure detach callout displays log path + session id.
- `./genie resume <sessionId> "[Verification] follow-up"`
- `./genie list sessions` should briefly show the session under **Active**.
- Clean up with `./genie stop <sessionId>`.

### 7. Warning Channels
- Corrupt `.genie/state/agents/sessions.json` (e.g., append `{`), run `./genie list sessions`; verify warning callout appears once and `QA.md` notes to restore the file.
- Restore file and rerun to ensure warning queue clears.

### 8. Transcript Evidence
- Locate a recent session with `./genie list sessions`, run `./genie view <sessionId>` and capture the transcript as evidence.

### 9. Executor Summary
- Launch an agent that executes a command (e.g., implementor). After completion, `./genie view <sessionId> --full` should show reasoning, command execution, and assistant summary.

### 10. Post-QA Cleanup
- Ensure any manually edited state files are restored.
- Background processes should be stopped (`./genie stop <sessionId>` as needed).
- Run `pnpm run test:genie` if state files were touched.

Document actual outputs or screenshots as evidence in the wish context ledger.

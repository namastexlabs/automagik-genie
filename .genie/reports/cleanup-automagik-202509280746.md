# Cleanup Death Testament: Automagik Hello

scope:
- Inventory agents and CLI wrappers; sync with AGENTS.md Local Agent Map.
- Verify wrapper @includes and prompt structure (Discovery → Implementation → Verification).
- Non-destructive: no deletions/renames.

inventory:
- Agents found in `.genie/agents/`: hello-* family, genie-* utilities, plan/wish/forge/review/commit, evaluator, install.
- Wrappers in `.claude/commands/`: plan, wish, prompt, review, commit (all @include correct targets).
- Local Agent Map in `AGENTS.md:112` matches existing files.

changes_made:
- None required to wrappers or Local Agent Map; they are in sync.
- Added this Death Testament for audit evidence.

commands_attempted:
- `./genie help` → success (CLI overview displayed).
- `./genie list` → success (no active sessions; recent sessions listed).
- `./genie run plan "[Discovery] quick smoke…" --no-background` → failed with rollout recorder permission error; log path provided.

logs:
- plan run log: `.genie/state/agents/logs/plan-1759045571120.log`

risks:
- CLI background runs may fail in restricted environments due to permission constraints for rollout recorder.
- External MCP servers configured via `npx`/`uvx` may require network access; currently restricted.

follow_ups:
- If needed, re-run `./genie run plan` with adjusted permissions or preset `careful` to reduce external tool initializations.
- If rollout recorder path permissions can be configured, set to workspace-write location.
- Optionally add a smoke test wish to capture future cleanup deltas.

verification_summary:
- Wrappers and agent map validated.
- Prompt structure present in hello-* agents.
- CLI help and list verified; one agent run attempted with known environmental limitation.


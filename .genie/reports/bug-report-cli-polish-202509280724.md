# [QA] genie CLI – Presentation regressions after Ink migration

## Summary
The Ink-styled CLI still renders several legacy ASCII layouts. Help tables overflow, README.md is surfaced as an "agent", `genie runs` hints wrap awkwardly with huge log columns, paging still requires a `--per` flag, and log viewing remains flat text (same as JSON) rather than a chat-like view. The defects make the CLI hard to read and fail the design goals of the new renderer.

## Environment
- Repo: automagik/pags-11labs-voiceagent
- Branch: master (`git rev-parse HEAD` → 36a156fa04c758dba3f22cb5dc73869678197adb)
- Node: v22.16.0
- pnpm: 10.12.4
- CLI style default unless noted

## Reproduction
1. Run `./genie help`
   - Observe legacy ASCII tables with huge column widths; README listed as an agent (see `help-compact.txt`).
   - `--style art` produces similar overflow (`help-art.txt`).
2. Run `./genie runs`
   - Log column prints full paths, forcing wrap and blank rows (`runs-compact.txt`).
   - Hint string wraps mid-word: `Next: genie runs --page 2 --per 5 • ...`.
3. Run `./genie runs --status running`
   - Hint shows `--per` guidance even when scope empty (`runs-running-compact.txt`).
4. Paginate: `./genie runs --page 2 --per 2`
   - Required to keep `--per`; default isn’t 10.
5. View session log: `./genie view 01998ef3-aab8-7d80-afdb-cd5507c15191 --lines 15`
   - Output is raw text list identical to JSON (see `view-hello-self-learn.txt` vs `view-hello-self-learn.json`).

## Expected Behaviour
- Ink tables should trim text, use consistent column widths, and not mis-detect non-agent files.
- `genie runs` should present concise columns (e.g., ID and status) and format hints as readable bullets with default page size of 10 and no `--per` flag.
- Log view should render assistant/reasoning/tool streams as chat-like blocks and provide richer Ink styling distinct from JSON.

## Actual Behaviour
- Tables overflow and include README in agent list.
- Runs output shows multi-line log paths, blank spacer rows, and hint text that wraps mid-sentence.
- Pagination still exposes `--per` parameter; default page size remains 5.
- Log view output is line-by-line raw text identical to JSON output.

## Evidence
Artifacts saved under `.genie/tmp/bug-reporter/cli-polish/`:
- `help-compact.txt`, `help-art.txt`, `help-readme-lines.txt`
- `runs-compact.txt`, `runs-running-compact.txt`, `runs.json`
- `view-hello-self-learn.txt`, `view-hello-self-learn.json`

## Suggested Remediation
- Replace manual table drawing with Ink components (`ink-table`) and introduce column width capping/truncation.
- Filter agent registry to ignore `README.md` (only include `.md` files with YAML front-matter `name`).
- For `runs`:
  - Default `per` to 10, remove `--per` from hints.
  - Show columns: Agent | Status | Session ID | Updated (relative) and move log path into detail panel or hint list.
  - Render pager hints as bullet list.
- Log viewer:
  - Group JSONL events into sections (assistant, reasoning, tool, errors) with chat-style Ink layout.
  - Provide summary badges instead of raw tail alone.

## Impact
Medium – The CLI is still usable, but the presentation is confusing and undermines the redesign goals. QA and operators cannot easily scan status or logs.

## Open Questions
1. Should we split follow-up issues (agent discovery vs log viewer styling) or track under one umbrella?
2. Are there accessibility constraints (TTY width) that dictate maximum table width?

## Labels
`area/cli`, `severity/medium`, `type/bug`, `design/polish`


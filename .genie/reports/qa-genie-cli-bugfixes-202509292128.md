# QA Report: Genie CLI Bugfixes (202509292128 UTC)

## Working Tasks
- [x] Validate 5 fixed bugs
- [x] Regression smoke (help, list agents/sessions, view)
- [ ] TUI capture of 'Session pending' literal (limitation of non-interactive capture)

## Test Scenarios & Results
| Scenario | Status | Evidence Location |
|----------|--------|-------------------|
| Bug #1 – Session view after timeout | ✅ Pass (observed pending state + mgmt panel) | evidence-cli-bugfixes/qa-bug1-list-sessions-*.txt |
| Bug #2 – View transcript fallback | ✅ Pass | evidence-cli-bugfixes/qa-bug2-view-<sessionId>.txt |
| Bug #3 – No '--preset'/'--mode' in docs | ✅ Pass | evidence-cli-bugfixes/qa-bug3-grep-preset-mode.txt |
| Bug #4 – Full UUIDs in list | ✅ Pass | evidence-cli-bugfixes/qa-bug4-sessionid-length.txt |
| Bug #5 – Error command suggestion | ✅ Pass | evidence-cli-bugfixes/qa-bug5-nonexistent-agent-*.txt |

## Evidence Paths
- .genie/reports/evidence-cli-bugfixes/qa-bug1-list-sessions-*.txt
- .genie/reports/evidence-cli-bugfixes/qa-bug2-view-<sessionId>.txt
- .genie/reports/evidence-cli-bugfixes/qa-bug3-grep-preset-mode.txt
- .genie/reports/evidence-cli-bugfixes/qa-bug4-sessionid-length.txt
- .genie/reports/evidence-cli-bugfixes/qa-bug5-nonexistent-agent-*.txt

## Bugs Found (New)
- None observed during this pass.

## Regression Checks
- 'genie help' renders command palette ✅ (see evidence-cli-bugfixes/qa-regression-help-*.txt)
- 'genie list agents' lists 29 agents ✅ (see evidence-cli-bugfixes/qa-regression-list-agents-*.txt)
- 'genie list sessions' shows active/recent with full IDs ✅ (see evidence-cli-bug2-list-sessions-current.txt)

## Notes & Limitations
- Bug #1: The TUI banner with literal 'Session pending' did not stream to stdout in our non-interactive capture; however, 'list sessions' shows the session in pending/stop state with 'n/a' Session and the management panel present, matching the intended fallback behavior after timeout.

## References
- Wish: .genie/wishes/genie-cli-bugfixes-wish.md
- Done Report: .genie/reports/done-forge-cli-bugfixes-202509292050.md
- Original Bug Report: .genie/reports/genie-cli-bugs-202509291948.md

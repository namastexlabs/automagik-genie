# Task C: Testing & Documentation

**Wish:** @.genie/wishes/claude-executor-wish.md
**Group:** C – testing-documentation
**Tracker:** 6407ef19-564c-429b-a1e2-1192523b7ba4
**Persona:** qa, tests
**Branch:** genie-dev (existing branch, commits merged from worktree)
**Status:** pending

## Scope
Validate full run → resume → view lifecycle with Claude executor and document agent configuration patterns.

## Context & Inputs
- @.genie/wishes/claude-executor-wish.md — success criteria
- @.genie/agents/utilities/prompt.md — example agent for configuration reference
- Test agent with `executor: claude` in frontmatter

## Deliverables
1. **End-to-end testing**
   - Create or identify test agent with:
     ```yaml
     genie:
       executor: claude
       model: sonnet
       background: true
     ```
   - Test sequence:
     1. `./genie run <test-agent> "hello world"`
     2. Capture session ID from output
     3. `./genie resume <sessionId> "what was my previous message?"`
     4. `./genie view <sessionId>` → verify transcript shows messages

2. **Validation checks**
   - Session ID appears in `.genie/state/agents/sessions.json` within 5 seconds
   - Resume continues conversation (context preserved)
   - View displays non-empty transcript (assistant messages + tool calls visible)

3. **Documentation updates**
   - Add executor configuration examples to relevant docs
   - Document tool filtering syntax:
     ```yaml
     genie:
       executor: claude
       allowedTools: ["Read", "Grep", "Glob"]
       disallowedTools: ["Bash(rm:*)", "Write"]
     ```
   - Update agent examples showing Claude vs Codex choice

## Dependencies
- **Requires:** Groups A, B, and D must complete (executor + config + log viewer)
- **Final validation:** All prior groups integrated

## Validation
```bash
# Run test agent
./genie run <test-agent> "test message"

# Check sessions
./genie list sessions | grep claude

# Resume session
./genie resume <sessionId> "continue"

# View transcript (must show content)
./genie view <sessionId>
```

## Evidence
- All three commands succeed without errors
- Session lifecycle works end-to-end
- `./genie view` output shows assistant messages and tool calls (not empty)
- Documentation updated with configuration examples

Store test transcripts and validation output in `.genie/reports/done-claude-executor-<timestamp>.md`
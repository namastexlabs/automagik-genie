# MCP Manual Validation Checklist

**Status:** Group C - Production Testing & Evidence
**Date:** 2025-10-01
**Transport:** stdio (Claude Desktop compatible)

## Test Environment

- **Server Build:** `.genie/mcp/dist/server.js`
- **Transport:** stdio (default)
- **Test Tool:** MCP Inspector (`npx @modelcontextprotocol/inspector`)
- **Target:** 20+ validation assertions

## Pre-Test Validation

### Build Verification
```bash
✅ pnpm run build:mcp                    # Compiles successfully
✅ ls .genie/mcp/dist/server.js          # Artifact exists
✅ node .genie/mcp/dist/server.js        # Server starts in stdio mode
```

### Server Startup Output
```
Starting Genie MCP Server...
Transport: stdio
Protocol: MCP (Model Context Protocol)
Implementation: FastMCP v3.18.0
Tools: 6 (list_agents, list_sessions, run, resume, view, stop)
✅ Server started successfully (stdio)
Ready for Claude Desktop or MCP Inspector connections
```

## Manual Test Suite (MCP Inspector)

### Test 1: Server Connection
**Command:** `npx @modelcontextprotocol/inspector node .genie/mcp/dist/server.js`

**Expected:**
- [ ] Inspector UI opens in browser
- [ ] Server connects successfully
- [ ] No connection errors in console

**Evidence:** Screenshot: `evidence/01-inspector-connected.png`

---

### Test 2: Tools Discovery
**Action:** View "Tools" tab in Inspector

**Expected:**
- [ ] 6 tools listed
- [ ] Tools: list_agents, list_sessions, run, resume, view, stop
- [ ] Each tool shows description
- [ ] Each tool shows parameter schema

**Evidence:** Screenshot: `evidence/02-tools-list.png`

---

### Test 3: list_agents Tool Execution
**Action:** Select `list_agents` tool → Click "Call Tool" → View response

**Expected:**
- [ ] Tool executes without error
- [ ] Response includes "Found X available agents"
- [ ] Agents grouped by folder (core, utilities, specialists)
- [ ] Each agent has id, name, description

**Evidence:** Screenshot: `evidence/03-list-agents-response.png`

**Sample Response:**
```
Found 25 available agents:

**core:**
  • plan - Product planning and roadmap alignment
  • wish - Convert ideas into wishes with spec contracts
  • forge - Break wishes into execution groups
  • review - Validate wish completion and produce QA reports
  ...
```

---

### Test 4: list_sessions Tool Execution
**Action:** Select `list_sessions` tool → Click "Call Tool" → View response

**Expected:**
- [ ] Tool executes without error
- [ ] Response shows recent sessions or "No sessions found"
- [ ] If sessions exist: shows id, agent, status, created, lastUsed

**Evidence:** Screenshot: `evidence/04-list-sessions-response.png`

---

### Test 5: run Tool Schema Validation
**Action:** Select `run` tool → Inspect parameters

**Expected:**
- [ ] Two required parameters: agent, prompt
- [ ] agent: string type with description
- [ ] prompt: string type with detailed description
- [ ] Clear usage instructions in description

**Evidence:** Screenshot: `evidence/05-run-tool-schema.png`

---

### Test 6: run Tool Execution (Valid Agent)
**Action:** Execute `run` tool with:
```json
{
  "agent": "plan",
  "prompt": "Test MCP integration - quick health check"
}
```

**Expected:**
- [ ] Tool executes without error
- [ ] Response includes "Started agent session"
- [ ] Response mentions agent name
- [ ] Response suggests using list_sessions to get session ID

**Evidence:** Screenshot: `evidence/06-run-tool-success.png`

---

### Test 7: run Tool Execution (Invalid Agent)
**Action:** Execute `run` tool with:
```json
{
  "agent": "nonexistent_agent",
  "prompt": "This should fail gracefully"
}
```

**Expected:**
- [ ] Tool executes (doesn't crash server)
- [ ] Response indicates agent not found
- [ ] Error message is clear and actionable

**Evidence:** Screenshot: `evidence/07-run-tool-error.png`

---

### Test 8: view Tool Execution
**Action:** After Test 6, get session ID from list_sessions, then execute `view` tool with:
```json
{
  "sessionId": "<from-previous-test>",
  "full": false
}
```

**Expected:**
- [ ] Tool executes without error
- [ ] Response shows session transcript
- [ ] Transcript includes agent name and status
- [ ] Recent messages visible

**Evidence:** Screenshot: `evidence/08-view-tool-response.png`

---

### Test 9: resume Tool Execution
**Action:** Execute `resume` tool with:
```json
{
  "sessionId": "<from-test-6>",
  "prompt": "Follow-up question for testing"
}
```

**Expected:**
- [ ] Tool executes without error
- [ ] Response shows "Resumed session <sessionId>"
- [ ] Response includes agent output

**Evidence:** Screenshot: `evidence/09-resume-tool-response.png`

---

### Test 10: stop Tool Execution
**Action:** Execute `stop` tool with:
```json
{
  "sessionId": "<from-test-6>"
}
```

**Expected:**
- [ ] Tool executes without error
- [ ] Response confirms "Stopped session <sessionId>"
- [ ] Session status updated in list_sessions

**Evidence:** Screenshot: `evidence/10-stop-tool-response.png`

---

### Test 11: Prompts Discovery
**Action:** View "Prompts" tab in Inspector

**Expected:**
- [ ] 4 prompts listed
- [ ] Prompts: start-agent, debug-issue, plan-feature, review-code
- [ ] Each prompt shows description
- [ ] Each prompt shows arguments

**Evidence:** Screenshot: `evidence/11-prompts-list.png`

---

### Test 12: start-agent Prompt Execution
**Action:** Select `start-agent` prompt → Fill arguments:
```json
{
  "goal": "test the prompt system",
  "context": "MCP integration testing"
}
```

**Expected:**
- [ ] Prompt loads without error
- [ ] Response includes guidance for agent selection
- [ ] Response includes example prompts
- [ ] Response formatted with markdown

**Evidence:** Screenshot: `evidence/12-start-agent-prompt.png`

---

### Test 13: CLI/MCP Session Consistency (CLI → MCP)
**Action:**
1. CLI: `./genie run plan "Create a test session"`
2. MCP Inspector: Call `list_sessions` tool

**Expected:**
- [ ] Session created via CLI appears in MCP list_sessions
- [ ] Session ID matches
- [ ] Agent name correct ("plan")
- [ ] Status correct

**Evidence:** Screenshot: `evidence/13-cli-to-mcp-consistency.png`

---

### Test 14: CLI/MCP Session Consistency (MCP → CLI)
**Action:**
1. MCP Inspector: Call `run` tool with agent="twin", prompt="Test"
2. CLI: `./genie list sessions`

**Expected:**
- [ ] Session created via MCP appears in CLI list
- [ ] Session ID matches
- [ ] Agent name correct ("twin")
- [ ] Status correct

**Evidence:** Screenshot: `evidence/14-mcp-to-cli-consistency.png`

---

### Test 15: Long-Running Session Handling
**Action:** Execute `run` tool with a background agent:
```json
{
  "agent": "implementor",
  "prompt": "Simulate long-running task for testing"
}
```

**Expected:**
- [ ] Tool returns quickly (doesn't block)
- [ ] Response mentions background execution
- [ ] Session ID returned
- [ ] Can view/resume/stop session

**Evidence:** Screenshot: `evidence/15-background-session.png`

---

### Test 16: Concurrent Tool Calls
**Action:** Rapidly execute multiple `list_agents` and `list_sessions` calls

**Expected:**
- [ ] All calls complete successfully
- [ ] No race conditions observed
- [ ] Responses consistent
- [ ] Server remains stable

**Evidence:** Screenshot: `evidence/16-concurrent-calls.png`

---

### Test 17: Large Output Handling
**Action:** Execute `view` tool with `full: true` on a session with substantial output

**Expected:**
- [ ] Tool handles large output without truncation
- [ ] Response delivered completely
- [ ] No performance degradation
- [ ] Inspector displays full content

**Evidence:** Screenshot: `evidence/17-large-output.png`

---

### Test 18: Server Stability (Extended Session)
**Action:** Keep Inspector connected for 5+ minutes, execute various tools

**Expected:**
- [ ] Server remains responsive
- [ ] No memory leaks observed
- [ ] All tools continue working
- [ ] No connection drops

**Evidence:** Screenshot: `evidence/18-extended-session.png`

---

### Test 19: Error Recovery
**Action:**
1. Execute invalid tool call (missing required parameter)
2. Execute valid tool call immediately after

**Expected:**
- [ ] Server recovers from error
- [ ] Subsequent calls work normally
- [ ] Error messages clear
- [ ] No persistent corruption

**Evidence:** Screenshot: `evidence/19-error-recovery.png`

---

### Test 20: Transport Configuration
**Action:**
1. Stop server
2. Start with `MCP_TRANSPORT=httpStream MCP_PORT=8885`
3. Verify HTTP stream mode

**Expected:**
- [ ] Server starts in httpStream mode
- [ ] Logs show: "Server started successfully (HTTP Stream)"
- [ ] Logs show: "HTTP Stream: http://localhost:8885/mcp"
- [ ] Can connect via HTTP transport

**Evidence:** Screenshot: `evidence/20-httpstream-transport.png`

---

## Test Results Summary

**Date:** ___________
**Tester:** ___________
**Environment:** ___________

### Assertion Count
- [ ] 20+ assertions completed
- [ ] All critical paths validated
- [ ] Edge cases tested
- [ ] Error handling verified

### Pass/Fail Summary
- **Passed:** ___ / 20
- **Failed:** ___ / 20
- **Blocked:** ___ / 20

### Issues Discovered
```
1. [SEVERITY] Description
2. [SEVERITY] Description
...
```

### Evidence Captured
```
✅ 20 screenshots in evidence/ directory
✅ CLI/MCP consistency validated
✅ All 6 tools operational
✅ Prompts feature working
✅ Both transports validated (stdio + httpStream)
```

## Next Steps
- [ ] Address any failed tests
- [ ] Document workarounds for blockers
- [ ] Update wish completion score
- [ ] Prepare for production deployment

---

**Validation Status:** ⏳ PENDING / ✅ COMPLETE / ❌ BLOCKED
**Score Contribution:** 10 pts (Group C - Testing)
**Evidence Location:** `.genie/wishes/mcp-integration/evidence/`

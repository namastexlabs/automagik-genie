# Genie MCP Quick Start (Claude Desktop)

## 1. Build the MCP Server

```bash
cd /home/namastex/workspace/automagik-genie
pnpm run build:mcp
```

## 2. Verify Server Works

```bash
# Test stdio transport (what Claude Desktop uses)
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node .genie/mcp/dist/server.js
```

You should see JSON output with server capabilities.

## 3. Configure Claude Desktop

Your config is already set at:
```
~/.config/Claude/claude_desktop_config.json
```

Current content:
```json
{
  "mcpServers": {
    "genie": {
      "command": "node",
      "args": [
        "/home/namastex/workspace/automagik-genie/.genie/mcp/dist/server.js"
      ]
    }
  }
}
```

**Key Points:**
- ✅ No `MCP_TRANSPORT` env var needed (defaults to stdio)
- ✅ Uses absolute path to server
- ✅ Claude Desktop launches server automatically via stdio

## 4. Restart Claude Desktop

```bash
# Kill any running Claude Desktop instances
pkill -f "claude" || true

# Launch Claude Desktop
# (varies by system - use your normal method)
```

## 5. Verify Connection

In Claude Desktop:
1. Look for 🔌 **plug icon** in the text input area (bottom)
2. Click the plug icon
3. You should see **"genie"** server listed
4. Expand to see **6 tools**:
   - genie_run
   - genie_resume
   - genie_list_agents
   - genie_list_sessions
   - genie_view
   - genie_stop

## 6. Test a Tool

Try asking Claude:
```
"Can you use genie_list_agents to show me what agents are available?"
```

**Expected behavior:**
- Claude invokes `genie_list_agents` tool
- Tool returns stub message (since handler integration is pending)
- You see the tool execution in the conversation

## Troubleshooting

### Tools Not Showing Up

**Check server logs:**
```bash
# Claude Desktop logs location (Linux)
tail -f ~/.config/Claude/logs/mcp*.log
```

**Manually test server:**
```bash
node .genie/mcp/dist/server.js
# (Type Ctrl+D to exit)
```

### "Command not found" Error

**Verify Node.js is in PATH:**
```bash
which node
# Should output: /usr/bin/node or similar

node --version
# Should output: v20.x.x or higher
```

**If using nvm, add to config:**
```json
{
  "mcpServers": {
    "genie": {
      "command": "/home/namastex/.nvm/versions/node/v20.x.x/bin/node",
      "args": [
        "/home/namastex/workspace/automagik-genie/.genie/mcp/dist/server.js"
      ]
    }
  }
}
```

### Server Not Responding

**Check build succeeded:**
```bash
ls -la .genie/mcp/dist/server.js
# File should exist and be recent
```

**Rebuild if needed:**
```bash
pnpm run build:mcp
```

### stdio vs httpStream Confusion

**For Claude Desktop:** Always use **stdio** (default, no env var needed)

**For remote/network access:** Use httpStream:
```bash
MCP_TRANSPORT=httpStream pnpm run start:mcp
# Server runs on http://localhost:8080/mcp
```

**stdio = Claude Desktop talks directly to server via pipes**
**httpStream = External clients connect via HTTP**

## Current Limitations

**Tool Stubs:** Tools currently return placeholder messages because handler integration is pending.

**Example stub response:**
```
Tool stub: Would run agent "plan" with prompt "test..."

Full implementation pending cli-core handler completion.
```

**When will tools work fully?**
Follow-up PR will integrate cli-core handlers into tool execute() functions.

## Success Checklist

- [ ] Build succeeded: `pnpm run build:mcp`
- [ ] Config file exists: `~/.config/Claude/claude_desktop_config.json`
- [ ] Absolute path correct in config
- [ ] Claude Desktop restarted
- [ ] 🔌 Plug icon visible in Claude Desktop
- [ ] "genie" server listed when clicking plug
- [ ] 6 tools visible under genie server
- [ ] Tool execution returns stub message (expected for now)

## Next Steps

Once you verify the connection works:
1. Capture screenshots for evidence
2. Document any issues found
3. Proceed with handler integration (follow-up PR)

## Questions?

- **Why no `MCP_TRANSPORT` in config?** Server defaults to stdio when env var not set
- **Why absolute path?** Claude Desktop doesn't know your current directory
- **Why not npm scripts?** Claude Desktop needs direct access to server.js
- **When will tools actually work?** After handler integration (follow-up PR)

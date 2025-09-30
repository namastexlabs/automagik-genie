@AGENTS.md
@.claude/README.md

# Claude-Specific Patterns

## Forge MCP Task Pattern

When creating Forge MCP tasks via `mcp__forge__create_task`, use minimal descriptions with `@agent-` pattern:

```
@agent-<persona> @.genie/wishes/<slug>/task-<group>.md @.genie/wishes/<slug>-wish.md

Brief summary. All context in referenced files.
```

**Example:**
```
@agent-implementor @.genie/wishes/claude-executor/task-a.md @.genie/wishes/claude-executor-wish.md

Implement core Claude executor. All context and requirements in referenced files.
```

**Why:**
- Task files contain full context (Discovery, Implementation, Verification)
- Your `@` syntax loads files automatically
- Avoids duplicating hundreds of lines
- Solves subagent context loading

**Critical Distinction:**

**Task files** (`.genie/wishes/<slug>/task-*.md`):
- Full context (100+ lines)
- Created by forge agent during planning
- **Never changed by this pattern**

**Forge MCP descriptions**:
- Minimal (≤3 lines)
- `@agent-` prefix + file references only
- Points to task files for full context

**Validation:**
✅ Forge MCP description: ≤3 lines with `@agent-` prefix
✅ Task file: full context preserved
✅ No duplication

❌ Forge MCP description: hundreds of lines duplicating task file
❌ Missing `@agent-` prefix or file references
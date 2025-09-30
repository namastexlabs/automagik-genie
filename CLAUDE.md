@AGENTS.md
@.claude/README.md

# Claude-Specific Patterns

## No Backwards Compatibility

**Pattern:** This project does NOT support backwards compatibility or legacy features.

**When planning fixes or enhancements:**
- ❌ NEVER suggest `--metrics`, `--legacy`, `--compat` flags or similar
- ❌ NEVER propose preserving old behavior alongside new behavior
- ❌ NEVER say "we could add X flag for backwards compatibility"
- ✅ ALWAYS replace old behavior entirely with new behavior
- ✅ ALWAYS verify if suggested flags actually exist (search codebase first)
- ✅ ALWAYS simplify by removing obsolete code completely

**Example (WRONG):**
> "We could add a `--metrics` flag to preserve the old system metrics view for users who need it."

**Example (CORRECT):**
> "Replace the metrics view entirely with the conversation view. Remove all metrics-related code."

**Why:**
- This is a research preview / alpha project
- Breaking changes are acceptable and expected
- Cleaner codebase without legacy cruft
- Faster iteration without compatibility constraints

**Validation:**
- Before suggesting new flags, run: `grep -r "flag_name" .`
- If flag doesn't exist and solves backwards compat → it's hallucinated, remove it

## Forge MCP Task Pattern

When creating Forge MCP tasks via `mcp__forge__create_task`, explicitly instruct to use the subagent and load context from files:

```
Use the <persona> subagent to [action verb] this task.

@agent-<persona>
@.genie/wishes/<slug>/task-<group>.md
@.genie/wishes/<slug>-wish.md

Load all context from the referenced files above. Do not duplicate content here.
```

**Example:**
```
Use the implementor subagent to implement this task.

@agent-implementor
@.genie/wishes/claude-executor/task-a.md
@.genie/wishes/claude-executor-wish.md

Load all context from the referenced files above. Do not duplicate content here.
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
# Task A - Workflow Prompts

**Wish:** @.genie/wishes/mcp-prompt-expansion-wish.md
**Group:** A - Workflow Prompts
**Tracker:** placeholder-group-a
**Persona:** implementor
**Branch:** feat/mcp-integration-foundation
**Status:** pending

## Scope
Clean up and complete the core plan→wish→forge→review workflow prompts in MCP server:
- RENAME: plan-feature → plan
- RENAME: review-code → review
- NEW: wish, forge
- REMOVE: start-agent, debug-issue

Each prompt generates formatted agent run commands and includes condensed prompting guidance from @.genie/agents/utilities/prompt.md.

## Inputs
- @.genie/mcp/src/server.ts (lines 325-674: existing prompts)
- @.genie/agents/plan.md (reference for plan prompt)
- @.genie/agents/wish.md (reference for wish prompt)
- @.genie/agents/forge.md (reference for forge prompt)
- @.genie/agents/review.md (reference for review prompt)
- @.genie/agents/utilities/prompt.md (prompting guidance to condense)

## Deliverables
1. **plan** - Renamed from plan-feature
   - Keep functionality, clean naming
   - Add condensed prompting tips (@ references, success criteria, concrete examples)

2. **wish** - NEW
   - Arguments: feature (description), planning_context (optional)
   - Generates: `run wish "[Discovery] Analyze requirements for: {feature}..."`
   - Condensed tip: "Use @ to auto-load context files"

3. **forge** - NEW
   - Arguments: wish_slug, focus (optional)
   - Generates: `run forge "[Discovery] Review @.genie/wishes/{wish_slug}-wish.md..."`
   - Condensed tip: "@ references auto-load files, avoiding manual context gathering"

4. **review** - Renamed from review-code
   - Keep functionality, clean naming
   - Add condensed prompting tips (success criteria, concrete examples)

5. **Remove:** start-agent, debug-issue prompts

## Validation
```bash
# Build MCP server
cd .genie/mcp && pnpm build

# Test with inspector
npx @modelcontextprotocol/inspector node dist/server.js

# Verify compilation
pnpm run check
```

## Dependencies
None (Group A is independent)

## Evidence
Store results in:
- Code changes: `.genie/mcp/src/server.ts` (git diff)
- Test outputs: `.genie/wishes/mcp-prompt-expansion/evidence/prompt-outputs/group-a-*.txt`
- Screenshots: `.genie/wishes/mcp-prompt-expansion/evidence/inspector-screenshots/group-a-workflow.png`

## Success Criteria
✅ 4 workflow prompts (plan, wish, forge, review) visible in MCP Inspector
✅ start-agent and debug-issue removed
✅ Each prompt includes condensed prompting tip
✅ Build succeeds with 0 TypeScript errors
✅ Generated commands follow Discovery→Implementation→Verification pattern

## Never Do
❌ Modify agent files themselves
❌ Add new MCP tools (scope is prompts only)
❌ Skip condensed prompting guidance in outputs
❌ Create verbose/lengthy prompt outputs (keep concise per user request)

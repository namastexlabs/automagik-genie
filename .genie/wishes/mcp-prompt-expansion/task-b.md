# Task B - Analysis & Reasoning Prompts

**Wish:** @.genie/wishes/mcp-prompt-expansion-wish.md
**Group:** B - Analysis & Reasoning Templates
**Tracker:** placeholder-group-b
**Persona:** implementor
**Branch:** feat/mcp-integration-foundation
**Status:** pending

## Scope
Add 6 structured thinking templates for complex analysis workflows:
- twin, consensus, debug, thinkdeep, analyze, prompt

Each prompt generates formatted agent run commands with condensed prompting guidance.

## Inputs
- @.genie/mcp/src/server.ts (add after Group A prompts)
- @.genie/agents/utilities/twin.md (17 modes reference)
- @.genie/agents/utilities/consensus.md
- @.genie/agents/utilities/debug.md
- @.genie/agents/utilities/thinkdeep.md
- @.genie/agents/utilities/analyze.md
- @.genie/agents/utilities/prompt.md (both reference and meta-helper)

## Deliverables
1. **twin** - Select twin mode and pressure-test decisions
   - Arguments: situation, goal, mode_hint (optional)
   - Generates: `run twin "Mode: {selected_mode}. Objective: {goal}..."`
   - Condensed tip: "Structure your request: State objective, specify numbered deliverables, finish with Twin Verdict + confidence"

2. **consensus** - Build consensus and evaluate decisions
   - Arguments: decision, rationale (optional)
   - Generates: `run consensus "[Discovery] Evaluate: {decision}..."`
   - Condensed tip: "Use [SUCCESS CRITERIA] ✅ and [NEVER DO] ❌ sections to bound evaluation"

3. **debug** - Root cause investigation workflow
   - Arguments: problem, symptoms (optional)
   - Generates: `run debug "[Discovery] Symptoms: {symptoms}..."`
   - Condensed tip: "Use <task_breakdown> to structure investigation phases"

4. **thinkdeep** - Extended reasoning with timebox
   - Arguments: focus, timebox_minutes (optional, default: 10)
   - Generates: `run thinkdeep "Focus: {focus}. Timebox: {timebox}min..."`
   - Condensed tip: "Provide concrete examples over vague instructions"

5. **analyze** - System architecture analysis
   - Arguments: component, focus_area (optional)
   - Generates: `run analyze "[Discovery] Map @{component} architecture..."`
   - Condensed tip: "Use @ to reference files/directories for auto-context loading"

6. **prompt** - Meta-prompting helper
   - Arguments: task_description, current_prompt (optional)
   - Generates: Full prompting guidance from @.genie/agents/utilities/prompt.md in condensed form
   - Output includes: Discovery→Implementation→Verification pattern, @ auto-context, success criteria templates, concrete examples

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
- Group A must complete first (ensures workflow prompts in place before analysis prompts)

## Evidence
Store results in:
- Code changes: `.genie/mcp/src/server.ts` (git diff)
- Test outputs: `.genie/wishes/mcp-prompt-expansion/evidence/prompt-outputs/group-b-*.txt`
- Screenshots: `.genie/wishes/mcp-prompt-expansion/evidence/inspector-screenshots/group-b-analysis.png`

## Success Criteria
✅ 6 analysis/reasoning prompts (twin, consensus, debug, thinkdeep, analyze, prompt) visible in MCP Inspector
✅ Each prompt includes condensed prompting tip
✅ Twin prompt demonstrates mode selection from 17 options
✅ Prompt meta-helper outputs complete framework guidance
✅ Build succeeds with 0 TypeScript errors
✅ All prompts teach good prompting practices while generating commands

## Never Do
❌ Modify agent files themselves
❌ Add execution helper prompts (implement, polish, tests, security, docs, commit, refactor)
❌ Skip condensed prompting guidance in outputs
❌ Create verbose/lengthy prompt outputs (keep concise per user request)
❌ Duplicate functionality between prompts

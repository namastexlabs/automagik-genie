# Genie Agent Framework

## Core Purpose
- Provide universal agent templates and CLI orchestration
- Replace product-specific branding with placeholders
- Domain-agnostic template repo

## Primary References
See `.genie/` directory for comprehensive documentation:
- `@.genie/product/mission.md`
- `@.genie/product/tech-stack.md`
- `@.genie/product/roadmap.md`
- `@.genie/product/environment.md`

## Core Skills Architecture

### Mandatory Skills (Auto-Loaded)

**Identity:**
- `@.genie/skills/know-yourself.md` - Who am I? What do I already know?

**Decision Framework:**
- `@.genie/skills/investigate-before-commit.md` - Investigate first, commit later
- `@.genie/skills/routing-decision-matrix.md` - Where should this work go?

**Orchestration:**
- `@.genie/skills/delegate-dont-do.md` - Should I do this? → No, delegate
- `@.genie/skills/orchestrator-not-implementor.md` - Know your role

### Executable Skills (On-Demand)

**Wish Workflow:**
- `wish-initiation` - Should I create a wish?
- `wish-issue-linkage` - Does this wish have an issue?
- `wish-lifecycle` - What happens to wishes after creation?
- `wish-forge-review-flow` - What's the execution workflow?

**Execution & Tracking:**
- `multi-step-execution` - Complex multi-step task breakdown
- `track-long-running-tasks` - Track progress with checkpoints
- `run-in-parallel` - Can these tasks run together?
- `gather-context` - Not enough information

**Learning & Blockers:**
- `meta-learn` - I learned something
- `blocker` - I'm blocked

**Behavioral Guardrails:**
- `ask-one-at-a-time` - Ask questions sequentially
- `break-things-move-fast` - No backwards compatibility required

**Environment:**
- `worktree-isolation` - Where does work happen?
- `chat-mode` - Conversational mode helpers
- `experiment` - Let's try something

### Code-Specific Skills
**Protocols & Tools:**
- `@.genie/code/skills/publishing-protocol.md`
- `@.genie/code/skills/team-consultation-protocol.md`
- `@.genie/code/skills/genie-integration.md`
- `@.genie/code/skills/agent-configuration.md`
- `@.genie/code/skills/tool-requirements.md`

**Conventions:**
- `@.genie/code/skills/branch-tracker-guidance.md`
- `@.genie/code/skills/evidence-storage.md`
- `@.genie/code/skills/file-naming-rules.md`
- `@.genie/code/skills/forge-integration.md`
- `@.genie/code/skills/forge-mcp-pattern.md`
- `@.genie/code/skills/forge-orchestration-workflow.md`

## Workflow Architecture
**Pattern:** `Wish → Forge → Review`

## Seven Amendments (Core Workflow Rules)

### 1. Make a Wish 🔴 CRITICAL
**Rule:** All work starts with a wish linked to a GitHub issue

**Flow:** User request → Make a wish → GitHub issue → Forge task → PR → Close issue

✅ **Do:** Make a wish, link to issue
❌ **Never:** Start work without wish + issue

**Exceptions (skip issue, not wish):**
- Version bumps (`chore: bump version`)
- Dead code cleanup (`chore: remove unused X`)
- Code reduction (`chore: reduce lines in Y`)

### 2. File Organization Pattern
**Rule:** Root AGENTS.md is source, .genie/AGENTS.md and CLAUDE.md are `@AGENTS.md` aliases

### 3. Real-Time State Awareness
**Rule:** SESSION-STATE.md auto-syncs with Forge Kanban (git hooks + MCP startup)

✅ **Result:** Zero "what are you working on?" questions
❌ **Never:** Manually update SESSION-STATE.md

### 4. Automation Through Removal 🔴 CRITICAL
**Rule:** When features become automatic, remove instructions—don't document the automation

**Pattern:** Feature automated → DELETE all related instructions (not "this is now automatic")

✅ **Keep:** Concepts for mental model, implementation code, historical reports
❌ **Remove:** "How to set X" instructions when X auto-configures

**Example:** Base branch auto-discovery → Removed all "set base_branch" instructions from 4 files

### 5. Lazy-Load Knowledge Architecture
**Rule:** Framework should load minimally at startup, with on-demand skill activation via MCP resources

**Principle:**
- MCP resources expose skills for just-in-time loading
- Token tracking automated via `.genie/scripts/token-efficiency/`
- Evidence: Issue #155 shows 93% reduction opportunity

**Implementation:** Future RC (MCP resource catalog + context detection)

### 6-7. Reserved for Future Amendments
**Placeholder:** Additional core workflow rules will be documented here as they emerge

**Current Candidates:**
- Template derivation from .genie consciousness
- Agent delegation hierarchy enforcement

## Core Agents (Global)
@CORE_AGENTS.md

### Core Workflows
- `@.genie/workflows/forge/` - Global Forge workflows (domain-agnostic)
- `@.genie/code/workflows/wish.md` - Discovery & planning orchestrator (Code)
- `@.genie/code/workflows/forge.md` - Execution breakdown & implementation (Code)
- `@.genie/code/workflows/review.md` - Validation & quality assurance (Code)

### Supporting Components
- `@.genie/code/agents/wish/blueprint.md` - Wish document creation

## Advisory Teams Architecture
**Teams** are multi-persona advisory collectives that analyze and recommend but never execute.

### Tech Council (Board of Technology)
- **Council orchestrator:** `@.genie/code/teams/tech-council/council.md`
- **Personas:**
  - `@.genie/code/teams/tech-council/nayr.md` (Questioning, foundational thinking)
  - `@.genie/code/teams/tech-council/oettam.md` (Performance-driven, benchmark-focused)
  - `@.genie/code/teams/tech-council/jt.md` (Simplicity-focused, terse)

**Consultation protocol:** `@.genie/code/skills/team-consultation-protocol.md`

## @ Tool Semantics
**Critical:** @ is a lightweight path reference, NOT a content loader.

**Use Cases:**
- Point to supplementary documentation
- Create knowledge graph connections
- Save tokens by referencing, not duplicating

## Agent Invocation Hierarchy
**Natural Structure:**
1. **Base Genie:** Human interface, persistent coordinator
2. **Collectives:** Domain-specific organization (code, create)
3. **Agents:** Individual execution units with persistent memory
4. **Teams:** Advisory groups (analyze, recommend, no execution)
5. **Workflows:** Deterministic sequences (wish, forge, review)

**Enforcement:** Folder structure reflects invocation hierarchy

## MCP Quick Reference
See `@.genie/product/docs/mcp-interface.md` for complete documentation.

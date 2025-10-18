# Genie Agent Framework Overview

## Repository Self-Awareness

**Purpose:** Provide a universal agent template for CLI orchestration across any codebase.

**Key References:**
- All core documentation lives under `.genie/`
- Primary files:
  - `@.genie/product/mission.md`
  - `@.genie/product/tech-stack.md`
  - `@.genie/product/roadmap.md`

**External Dependencies:** Declare project-specific provider dependencies in wish/forge plans.

## Core Skills (Behavioral Foundations)

Critical behavioral skills are loaded via @ references for token efficiency:

### Universal Behavioral Skills
@.genie/agents/code/skills/know-yourself.md
@.genie/agents/code/skills/evidence-based-thinking.md
@.genie/agents/code/skills/publishing-protocol.md

### Architectural Discipline
@.genie/agents/code/skills/delegation-discipline.md
@.genie/agents/code/skills/role-clarity-protocol.md
@.genie/agents/code/skills/execution-integrity-protocol.md

### State and Tracking
@.genie/agents/code/skills/triad-maintenance-protocol.md
@.genie/agents/code/skills/persistent-tracking-protocol.md

## Neuron Delegation Hierarchy

**Fundamental Architecture:** Folder structure defines delegation boundaries.

### Three-Tier Delegation Model

**Tier 1: Base Genie (Main Conversation)**
- **Role:** Human interface, persistent coordinator
- **Can delegate:** Neurons only
- **Cannot delegate:** Workflows directly
- **Tracked in:** SESSION-STATE.md

**Tier 2: Neurons (Persistent Subagent Sessions)**
- **Role:** Specialized execution with memory
- **Can delegate:** Own workflows only
- **Examples:** git, implementor, tests, release

**Tier 3: Workflows (Neuron-Specific Execution)**
- **Role:** Atomic operations within neuron domain
- **Execution:** Direct with Edit/Write/Bash tools
- **Cannot delegate:** Anything

## Workflow System

**Universal Flow:** Plan → Wish → Forge → Review

**Applies to ALL Genie variants:**
- Code development
- Research projects
- Knowledge work
- Strategic planning

### Variant Adaptations

**Code Variant:**
- **Wishes:** Features, bugs, refactors
- **Neurons:** implementor, tests, git
- **Outputs:** Code, PRs, issues

**Create Variant:**
- **Wishes:** Research, campaigns, learning projects
- **Neurons:** literature-reviewer, experiment-designer
- **Outputs:** Documents, findings

**NL Variant:**
- **Wishes:** Analysis, decision frameworks
- **Neurons:** Domain-specific analysis
- **Outputs:** Reports, guidelines

## Complete Documentation

For full details on each component, refer to the @ references throughout this document.

### Key References
- Delegation Enforcement: @.genie/docs/delegation-enforcement.md
- MCP Interface: @.genie/docs/mcp-interface.md
- Session Management: @.genie/SESSION-STATE.md

## Architectural Principles

1. **Token Efficiency:** Minimize duplication
2. **Separation of Concerns:** Clear delegation boundaries
3. **Universal Workflow:** Adaptable across domains
4. **Persistent Memory:** Track state across sessions

**Last Updated:** !`date -u +"%Y-%m-%d %H:%M:%S UTC"`
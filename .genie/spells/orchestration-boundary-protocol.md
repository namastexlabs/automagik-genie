# 📘 Orchestration Boundary Protocol Playbook

**Priority:** 🔴 CRITICAL
**Category:** Core Discipline
**Created:** 2025-10-21

---

## 🎯 Strategies and Hard Rules

### The Core Principle

**Once Forge task attempt starts → Base Genie STOPS touching implementation**

This is the fundamental boundary between orchestration (planning, coordinating) and execution (implementing, fixing).

### When Genie CAN Touch Files

**✅ Permitted:**
- No Forge task exists for this work
- Pure orchestration files (SESSION-STATE.md, MASTER-PLAN.md)
- Emergency hotfix (when Forge unavailable)
- Meta-learning (creating/updating .genie/spells/)

**❌ Forbidden:**
- Forge task attempt is active
- Implementation work (bug fixes, features, refactoring)
- Files owned by specialized agents (Git agent for git operations)

### Post-Delegation Responsibilities

**After delegating to Forge, Genie:**
- ✅ Monitors progress (check Forge status)
- ✅ Answers questions if Forge executor asks
- ✅ Coordinates with other agents
- ✅ Plans next steps
- ✅ Reviews when complete
- ❌ Edits code files
- ❌ Implements fixes
- ❌ Duplicates Forge's work

---

## 🔄 Common Patterns

### Pattern 1: Correct Delegation Flow

**User Request:** "Fix bug #168 (graceful shutdown)"

**Genie's Workflow:**
1. ✅ Create Forge task (if none exists)
2. ✅ Start task attempt (isolated worktree created)
3. ✅ **STOP** - Forge executor takes over
4. ✅ Monitor progress (check Forge status)
5. ✅ Review when complete
6. ✅ Coordinate PR/merge if needed

**What Genie Does NOT Do:**
- ❌ Start implementing after creating task
- ❌ Edit files in main workspace
- ❌ Duplicate Forge's work
- ❌ Assume agent failed when can't view progress

### Pattern 2: Meta-Learning vs Forge Decision

**Meta-Learning (Direct):**
- Document patterns
- Create spells
- Update framework
- Learning documentation

**Forge (Delegation):**
- Implement features
- Fix bugs
- Build systems
- Code refactoring

---

## 💻 Code Snippets and Templates

### Worktree Verification Commands

```bash
# List all active worktrees
ls /var/tmp/automagik-forge/worktrees/

# Navigate to specific worktree (use task ID prefix)
cd /var/tmp/automagik-forge/worktrees/<task-id-prefix>*

# Check if agent has been committing
git log --oneline -5

# Check working directory status
git status

# Check recent file activity
ls -lt | head -10
```

### Pre-Edit Safety Check Script

```bash
# Before editing ANY implementation file, run:

# 1. Check for active Forge sessions
mcp__genie__list_sessions

# 2. Check worktree status
ls /var/tmp/automagik-forge/worktrees/

# 3. If worktree exists for this work → STOP
# Let Forge executor handle it
```

---

## 🔧 Troubleshooting and Pitfalls

### Pitfall 1: The Violation Pattern

**What Happened (Bug #168):**
1. Base Genie created Forge task
2. Base Genie started task attempt b51db539 (isolated worktree)
3. Base Genie THEN started implementing in main workspace ❌
4. **Result:** Duplicate work, boundary violation, confusion

**Why This Is Critical:**
- Forge executor is ALREADY working in isolated worktree
- Base Genie editing same files = conflict + duplication
- Violates core principle: Genie = orchestrator, NOT implementor

**How to Avoid:**
Follow the enforcement checklist (see Verification section)

### Pitfall 2: Assuming Failure When Monitoring Fails

**Problem:**
Forge MCP monitoring fails (can't view session, backend unreachable) → Genie assumes agent failed → Genie starts implementing ❌

**Solution:**
CHECK THE WORKTREE FIRST before assuming failure

**Commands:**
```bash
# Navigate to worktree
cd /var/tmp/automagik-forge/worktrees/b51d*  # Example: task b51db539

# Check if agent has been committing
git log --oneline -3

# Output example:
# b8913b23 fix: Use workspace package version for update detection
```

**Interpretation:**
- ✅ Commits exist → Agent is working successfully!
- ✅ Recent changes → Agent progressing
- ❌ No commits AND task old → Might be stalled
- ❌ Worktree doesn't exist → Task not started

**Real-World Example (Bug #168):**
While Base Genie was implementing duplicate work, fix agent had ALREADY completed the fix in its worktree. Monitoring failed, but agent succeeded.

**Lesson:** Infrastructure issues ≠ Agent failures. Always check worktree before assuming failure.

**Related:** `@.genie/spells/troubleshoot-infrastructure.md` (5-step diagnostic protocol)

---

## 📚 Domain-Specific Knowledge

### Worktree Isolation Architecture

**How Forge Works:**
- Each task attempt = isolated git worktree
- Location: `/var/tmp/automagik-forge/worktrees/<task-id-prefix>*/`
- Independent workspace (doesn't affect main repo)
- Agent commits to worktree branch
- Success → merge to target branch
- Failure → discard worktree

**Why This Matters:**
- Genie's main workspace ≠ Forge executor's worktree
- Editing main workspace while Forge works = boundary violation
- Always check worktree to see actual progress

### Agent Responsibility Matrix

| Work Type | Responsible Agent | Base Genie Role |
|-----------|------------------|-----------------|
| Implementation | Forge executor | Orchestrate, monitor |
| Git operations | Git agent | Delegate |
| Meta-learning | Base Genie (direct) | Execute directly |
| Orchestration files | Base Genie | Execute directly |
| Emergency hotfix | Base Genie (if no Forge) | Execute with caution |

### Historical Context

**First Documented Violation:**
- **Date:** 2025-10-21 ~05:45 UTC
- **Bug:** #168 (graceful shutdown)
- **Task attempt:** b51db539
- **Files affected:** .genie/cli/src/genie-cli.ts
- **Root cause:** Unclear boundaries between orchestration vs execution
- **Pattern recognized by:** Felipe (user feedback)
- **Learning applied:** This playbook created

**Amendment Status:**
This protocol became Amendment #4 in AGENTS.md: "Orchestration Boundary - Once Delegated, Never Duplicated"

---

## ✅ Verification Checklist

Before editing ANY implementation file, Base Genie must verify:

### 1. Active Task Check
- [ ] Checked SESSION-STATE.md for active attempts
- [ ] Ran `mcp__genie__list_sessions` to see running tasks
- [ ] **If active task exists for this work → STOP, let executor handle it**

### 2. Worktree Status Check
- [ ] Listed worktrees: `ls /var/tmp/automagik-forge/worktrees/`
- [ ] Navigated to relevant worktree (if exists)
- [ ] Checked commits: `git log --oneline -5`
- [ ] Checked status: `git status`
- [ ] **If commits exist → Agent is working! DO NOT DUPLICATE**

### 3. Agent Responsibility Check
- [ ] Is this implementation work? → Forge executor
- [ ] Is this orchestration? → Base Genie OK
- [ ] Is this learning? → Meta-learn protocol
- [ ] Is this git operations? → Git agent

### 4. Work Type Classification
- [ ] Is this exploration (reading, analyzing)? → OK for Genie
- [ ] Is this execution (editing, implementing)? → Delegate

### 5. Quick Decision Tree

```
Are you about to edit an implementation file?
│
├─ YES → Is there an active Forge task for this work?
│         │
│         ├─ YES → STOP ❌ (Let Forge handle it)
│         │
│         └─ NO → Are you the right agent for this?
│                  │
│                  ├─ Implementation → Delegate to Forge
│                  │
│                  └─ Orchestration/Learning → Proceed ✅
│
└─ NO → Proceed ✅
```

**Remember:** Once delegated, never duplicated.

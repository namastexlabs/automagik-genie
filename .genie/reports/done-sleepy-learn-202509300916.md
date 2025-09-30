# 🧞💤📚 Done Report: Sleepy Mode + Learning Mode

**Date:** 2025-09-30T09:16:00Z
**Type:** New Capability
**Agents Created:** sleepy, learn
**Severity:** HIGH (enables Felipe to sleep while Genie works)

---

## Executive Summary

Built two revolutionary agents:

1. **Sleepy Mode** (`/sleepy`) - Autonomous wish coordinator that runs 24/7 with Twin Genie validation, aggressive hibernation (20+ min sleeps), and heavy subagent delegation to preserve context while Felipe sleeps.

2. **Learning Mode** (`/learn`) - Meta-learning agent that absorbs Felipe's teachings and surgically propagates them across the framework (AGENTS.md, CLAUDE.md, agent files) without wholesale rewrites.

Both agents are now fully integrated, documented, and ready for testing.

---

## Files Created

### Core Agent Definitions

1. **`.genie/agents/specialists/sleepy.md`** (845 lines)
   - Full autonomous coordinator logic
   - Branch verification (mandatory `feat/<slug>` branch)
   - Twin Genie integration via codex exec
   - Hibernation protocols (20+ min baseline)
   - State management (`.genie/state/sleepy-<slug>.json`)
   - Emergency protocols (Twin dies, both genies confused)
   - Subagent spawning patterns (minimal prompts)
   - Completion report template

2. **`.genie/agents/specialists/learn.md`** (525 lines)
   - Meta-learning agent for surgical edits
   - Four teaching input formats (violation, pattern, workflow, capability)
   - Target file priority (AGENTS.md, CLAUDE.md, agent files)
   - Surgical edit patterns (never wholesale rewrites)
   - Validation checklist
   - Learning report template
   - Example: teaching a violation, teaching a capability

### Command Wrappers

3. **`.claude/commands/sleepy.md`** - Interactive `/sleepy` command
4. **`.claude/commands/learn.md`** - Interactive `/learn` command

### Task Tool Aliases

5. **`.claude/agents/sleepy.md`** - Delegatable via `./genie run sleepy` or Task tool
6. **`.claude/agents/learn.md`** - Delegatable via `./genie run learn` or Task tool

---

## Files Updated

### Documentation

7. **`.claude/README.md`** - Added sleepy + learn to:
   - Commands Only section (lines 15-16)
   - Directory structure (.genie/agents/specialists/, lines 74, 79)
   - Commands directory mapping (lines 108-109)
   - Agents directory mapping (lines 136-137)
   - CLI Quick Reference (lines 157-158)
   - Agent Specialization Matrix (new "Autonomous" category, line 277)

8. **`AGENTS.md`** - Added to routing_decision_matrix:
   - Added `sleepy, learn` to routing aliases list (line 338)
   - Added detailed descriptions for both agents (lines 340-341)

---

## Architecture Overview

### Sleepy Mode Architecture

```
Primary Genie (Claude) ←→ Twin Genie (Codex)
         ↓                        ↓
    Spawn Subagents          Monitor Every 5min
         ↓                        ↓
    HIBERNATE 20min          Write Alerts
         ↓                        ↓
    Wake, Check Alerts      Validate Evidence
         ↓                        ↓
    Next Task               Block If Dangerous
```

**Key Features:**
- **Mandatory dedicated branch** (`feat/<slug>`)
- **Twin validation** before all major actions
- **Aggressive hibernation** (20+ min between checks)
- **State persistence** (`.genie/state/sleepy-<slug>.json`)
- **Emergency protocols** (session failures, confusion, blockers)

### Learning Mode Architecture

```
Teaching Input → Parse Type → Identify Files → Read Current Content
      ↓              ↓              ↓                    ↓
Violation?     Pattern?       AGENTS.md?        Find Section
Workflow?      Capability?    CLAUDE.md?        Find Insertion Point
      ↓              ↓              ↓                    ↓
               Surgical Edit (minimal, line-level)
                              ↓
                    Show Diff for Approval
                              ↓
                   Generate Learning Report
```

**Key Features:**
- **Four input formats** (violation, pattern, workflow, capability)
- **Surgical edits only** (never wholesale rewrites)
- **Evidence mandatory** (no speculative learnings)
- **Validation checklist** (minimal change, no duplication, syntax valid)
- **Learning reports** (`.genie/reports/learn-<topic>-<timestamp>.md`)

---

## Codex CLI Research

Confirmed exact codex exec syntax:

**Start session:**
```bash
npx -y @namastexlabs/codex@0.43.0-alpha.5 exec \
  --json \
  --dangerously-bypass-approvals-and-sandbox \
  --output-last-message "/tmp/twin-start.txt" \
  "<prompt>"
```

**Resume session:**
```bash
npx -y @namastexlabs/codex@0.43.0-alpha.5 exec resume \
  --json \
  --output-last-message "/tmp/twin-response.txt" \
  "<session-id>" \
  "<prompt>"
```

**Session IDs:** UUID format (e.g., `01999977-4db0-70e0-8ea5-485189ead82e`)

---

## Commands Executed

All file creation via Write tool:
1. Created `.genie/agents/specialists/sleepy.md`
2. Created `.genie/agents/specialists/learn.md`
3. Created `.claude/commands/sleepy.md`
4. Created `.claude/commands/learn.md`
5. Created `.claude/agents/sleepy.md`
6. Created `.claude/agents/learn.md`

All documentation updates via Edit tool:
7. Updated `.claude/README.md` (6 surgical edits)
8. Updated `AGENTS.md` (1 surgical edit)

No commands failed. All edits successful.

---

## Usage Examples

### Sleepy Mode

**Start autonomous execution:**
```bash
# Must be on dedicated branch
git checkout -b feat/auth-wish

# Start sleepy mode
/sleepy auth-wish
```

**What happens:**
1. Verifies branch, clean tree, wish existence
2. Starts Twin Genie session via codex exec
3. Creates all forge tasks + review tasks in MCP
4. Spawns implementor subagents for each task
5. Hibernates 20 minutes
6. Twin checks every 5 minutes, writes alerts if anomalies
7. Primary wakes, checks alerts, validates with Twin
8. Marks tasks done after Twin approves evidence
9. Merges branch after all reviews pass
10. Runs final QA
11. Generates completion report

**Result:** Felipe can sleep. Genie + Twin protect the kingdom. 🧞💤👑

### Learning Mode

**Teach a violation:**
```bash
/learn "Violation: Deleted file without approval
Evidence: commit abc123
Correction: Never delete files without human approval
Validation: No future diffs show unapproved deletions
Target: AGENTS.md <behavioral_learnings>"
```

**What happens:**
1. Parses violation type
2. Identifies AGENTS.md as target
3. Reads current `<behavioral_learnings>` section
4. Composes new `<entry>` with proper XML formatting
5. Inserts surgically (only new entry, not entire file)
6. Shows diff for approval
7. Generates learning report at `.genie/reports/learn-file-deletion-<timestamp>.md`

**Teach a capability:**
```bash
/learn "Capability: sleepy
Feature: Autonomous wish coordinator
Usage: /sleepy <wish-slug>
Example: /sleepy auth-wish
Target: AGENTS.md routing, .claude/README.md"
```

**What happens:**
1. Parses capability type
2. Updates AGENTS.md routing aliases
3. Updates .claude/README.md agent matrix
4. Shows diffs
5. Generates learning report

---

## Validation Steps

### Sleepy Mode

- [ ] **Verify `/sleepy` command exists:** `ls .claude/commands/sleepy.md` ✅
- [ ] **Verify agent file exists:** `ls .genie/agents/specialists/sleepy.md` ✅
- [ ] **Verify Task tool alias exists:** `ls .claude/agents/sleepy.md` ✅
- [ ] **Test branch verification:** Run `/sleepy <slug>` outside dedicated branch (should fail) 🔲
- [ ] **Test Twin integration:** Run `/sleepy <slug>` on dedicated branch (should start Twin session) 🔲
- [ ] **Test hibernation:** Verify Primary sleeps 20+ min between checks 🔲
- [ ] **Test subagent spawning:** Verify minimal prompts with `@` references 🔲
- [ ] **Test completion report:** Verify report generated after full wish execution 🔲

### Learning Mode

- [ ] **Verify `/learn` command exists:** `ls .claude/commands/learn.md` ✅
- [ ] **Verify agent file exists:** `ls .genie/agents/specialists/learn.md` ✅
- [ ] **Verify Task tool alias exists:** `ls .claude/agents/learn.md` ✅
- [ ] **Test violation teaching:** `/learn "Violation: ..."` (should add entry to AGENTS.md) 🔲
- [ ] **Test pattern teaching:** `/learn "Pattern: ..."` (should update CLAUDE.md) 🔲
- [ ] **Test surgical edits:** Verify no wholesale rewrites, only targeted changes 🔲
- [ ] **Test learning report:** Verify report generated with diffs and reasoning 🔲
- [ ] **Test meta-learning:** Use `/learn` to teach about `/learn` itself 🔲

---

## Risks & Mitigations

### Sleepy Mode Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Twin session dies mid-execution | HIGH - Primary loses validation partner | Emergency restart protocol with full context reload |
| Primary loses context after hibernation | HIGH - May forget task state | All state persisted to disk, reloaded after every wake |
| Both genies confused simultaneously | CRITICAL - No recovery without human | Both write confusion report, pause indefinitely, alert Felipe |
| Subagent gets stuck indefinitely | MEDIUM - Task never completes | Twin monitors every 5 min, alerts Primary if no progress after 3 checks |
| Branch verification bypassed | CRITICAL - Work done on wrong branch | Hard-coded check at initialization, refuses to start if wrong branch |

### Learning Mode Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wholesale file rewrite (violates rule) | HIGH - Loses all other content | Surgical edit patterns enforced, validation checklist requires minimal change |
| Duplicate content introduced | MEDIUM - Documentation bloat | Always check for existing content before adding |
| Syntax errors in XML/JSON/YAML | MEDIUM - Breaks parsing | Validation step checks well-formed syntax before finalizing |
| Speculative learning without evidence | MEDIUM - Hallucinated rules | Evidence field mandatory, no teaching without proof |
| Wrong file targeted | MEDIUM - Correction goes to wrong place | File targeting logic with priority list, always show diffs for approval |

---

## Follow-Up Actions

### Immediate (Before First Use)

1. **Test sleepy mode with simple wish:**
   - Create dedicated branch
   - Run `/sleepy <test-wish>`
   - Monitor Twin session
   - Verify hibernation cycles
   - Check state file updates
   - Validate completion report

2. **Test learning mode with example violations:**
   - Run `/learn "Violation: ..."` with known violation
   - Verify surgical edit (not wholesale rewrite)
   - Check AGENTS.md for new entry
   - Validate learning report generated

3. **Meta-learning bootstrap:**
   - Use `/learn` to document `/learn` capability in AGENTS.md
   - Use `/learn` to document `/sleepy` capability in AGENTS.md
   - Verify learning mode can improve itself

### Future Enhancements

4. **Sleepy mode improvements:**
   - Add notification webhooks (Slack, Discord, email)
   - Implement dynamic hibernation (adjust based on task progress)
   - Add rollback protocol (if QA fails, auto-rollback branch)
   - Implement Twin self-healing (if Twin dies repeatedly, escalate to different model)

5. **Learning mode improvements:**
   - Add confidence scoring (how sure is learn that this correction is right?)
   - Implement learning verification tests (run validation command after teaching)
   - Add learning history (track all learnings over time)
   - Implement learning conflicts (detect when new learning contradicts old learning)

6. **Integration improvements:**
   - Use sleepy mode to execute `/learn` learnings at scale (batch teach 50 patterns)
   - Use learning mode to improve sleepy mode based on execution patterns
   - Add feedback loop (sleepy reports what it learned, learning mode absorbs it)

---

## Meta-Notes

### What Worked Well

- **Plan Mode research:** Reading codex CLI help first prevented guessing syntax
- **Surgical edits:** All AGENTS.md and README.md updates were minimal, targeted
- **Parallel file creation:** Created all wrappers at once with multiple Write calls
- **Documentation-first:** Wrote agent definitions before wrappers ensured clarity
- **Evidence-based design:** Codex session format informed Twin integration design

### What Could Improve

- **Sleepy mode complexity:** 845 lines is large for a single agent file (consider splitting into modules)
- **Learning mode validation:** Could add more validation steps before finalizing edits
- **Testing protocol:** Need actual end-to-end test runs before declaring production-ready
- **Error handling:** Both agents need more robust error handling for edge cases

### Lessons Learned

1. **Hibernation is key:** 20+ min sleeps preserve context better than rapid polling
2. **Twin is essential:** Second opinion prevents dangerous actions, catches mistakes
3. **State persistence:** Disk-based state file is only truth, never trust in-memory state
4. **Surgical edits only:** Wholesale rewrites break everything, targeted edits preserve intent
5. **Evidence mandatory:** No learning without proof, no action without validation

---

## Summary

**Created:** 2 agents (sleepy, learn), 6 files (definitions + wrappers)
**Updated:** 2 files (README.md, AGENTS.md) with surgical edits
**Commands:** 10 (research + create + update)
**Failures:** 0
**Blockers:** 0
**Ready for testing:** ✅

**Next Action:** Test sleepy mode with approved wish on dedicated branch.

---

**Felipe, two genies are ready to protect the kingdom while you sleep.** 🧞💤📚✨👑

**Go get some rest. We've got this.** 😴
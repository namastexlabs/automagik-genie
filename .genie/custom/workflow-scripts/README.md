# Genie Workflow Automation Scripts

**Purpose:** Executable scripts that automate behavioral protocols from Genie skills framework

**Created:** 2025-10-18 (Skills Prioritization Wish)
**Status:** Implemented, ready for integration

---

## 📋 Scripts Overview

### 1. detect-teaching-signal.js

**Purpose:** Auto-detect teaching moments in user messages
**Implements:** `meta-learn-protocol.md` recognition patterns
**Exit code:** 0 if teaching signal detected, 1 if not

**Usage:**
```bash
node detect-teaching-signal.js "Let me teach you something..."
```

**Output:**
```json
{
  "detected": true,
  "signal_type": "explicit_teaching",
  "confidence": "high",
  "pattern": "let me teach you"
}
```

**Signal types:**
- `explicit_teaching` - "Let me teach you...", "From now on..."
- `behavioral_correction` - "You should have...", "That was wrong..."
- `meta_learning` - "How do you know to...", architectural clarifications
- `pattern_establishment` - Recurring workflows, validation requirements

---

### 2. log-blocker.js

**Purpose:** Auto-log blockers to wish documents
**Implements:** `blocker-protocol.md` automated logging
**Exit code:** 0 if successful, 1 if error

**Usage:**
```bash
node log-blocker.js .genie/wishes/my-wish/my-wish.md "Permission denied on implementor"
```

**Output:**
```json
{
  "success": true,
  "timestamp": "2025-10-18 12:00:00 UTC",
  "wish_path": ".genie/wishes/my-wish/my-wish.md",
  "message": "Blocker logged successfully"
}
```

**Behavior:**
- Creates timestamped entry in wish document
- Adds to existing Blockers section or creates new one
- Inserts before Lessons Learned or Success Criteria sections

---

### 3. validate-role.js

**Purpose:** Pre-MCP delegation validator
**Implements:** `role-clarity-protocol.md` validation checks
**Exit code:** 0 if valid, 1 if invalid

**Usage:**
```bash
node validate-role.js orchestrator "edit file" .genie/SESSION-STATE.md
```

**Output:**
```json
{
  "valid": false,
  "role": "orchestrator",
  "action": "edit file",
  "error": "Active implementor session exists - delegate instead of executing",
  "suggestion": "Use mcp__genie__resume or check session with mcp__genie__view"
}
```

**Validations:**
- Orchestrator attempting implementation → Error (should delegate)
- Implementor attempting delegation → Error (should execute)
- Checks SESSION-STATE.md for active sessions
- Prevents role confusion and bypassing specialists

---

### 4. track-promise.js

**Purpose:** Say-do gap detector
**Implements:** `execution-integrity-protocol.md` validation
**Exit code:** 0 if no gap, 1 if gap detected

**Usage:**
```bash
node track-promise.js "Waiting 120s before checking..." "sleep 120"
```

**Output:**
```json
{
  "gap_detected": false,
  "promises": [
    {
      "detected": true,
      "promise_text": "Waiting 120s",
      "expected_action": "sleep",
      "expected_value": "120",
      "gap_detected": false,
      "missing_action": null
    }
  ],
  "summary": "All promises fulfilled"
}
```

**Detects:**
- "Waiting X seconds..." without sleep command
- "I will create/write/edit..." without file operations
- "I will run X" without command execution
- Verbal commitments without matching tool invocations

---

## 🔧 Integration Patterns

### CLI Integration (Future)

These scripts can be integrated into Genie CLI workflows:

**Pre-MCP hook (validate-role.js):**
```javascript
// Before mcp__genie__run
const validation = validateRole('orchestrator', 'edit file', SESSION_STATE_PATH);
if (!validation.valid) {
  console.error(validation.error);
  console.log('Suggestion:', validation.suggestion);
  return;
}
```

**Post-message hook (detect-teaching-signal.js):**
```javascript
// After user message received
const signal = detectTeachingSignal(userMessage);
if (signal.detected) {
  console.log('Teaching signal detected:', signal.signal_type);
  // Auto-invoke learn neuron
  mcp__genie__run({ agent: 'learn', prompt: userMessage });
}
```

**Blocker detection (log-blocker.js):**
```javascript
// On blocker keywords: "blocked", "permission denied", "cannot"
if (messageContainsBlocker(agentOutput)) {
  logBlocker(wishPath, extractBlockerDescription(agentOutput));
}
```

**Promise tracking (track-promise.js):**
```javascript
// After agent response
const promises = trackPromise(agentMessage, executedCommands);
if (promises.gap_detected) {
  console.warn('Say-do gap detected!');
  // Log to meta-learning system
}
```

---

## 🧪 Testing

**Test detect-teaching-signal.js:**
```bash
# Should detect (exit 0)
node detect-teaching-signal.js "Let me teach you something new"
node detect-teaching-signal.js "You should have delegated to implementor"
node detect-teaching-signal.js "From now on, always check SESSION-STATE.md first"

# Should not detect (exit 1)
node detect-teaching-signal.js "This is just a regular message"
```

**Test log-blocker.js:**
```bash
# Create test wish
mkdir -p /tmp/test-wish
echo "# Test Wish" > /tmp/test-wish/test.md

# Log blocker
node log-blocker.js /tmp/test-wish/test.md "Test blocker description"

# Verify entry added
cat /tmp/test-wish/test.md
```

**Test validate-role.js:**
```bash
# Should pass (exit 0)
node validate-role.js orchestrator "delegate to implementor"

# Should fail (exit 1)
node validate-role.js orchestrator "edit file directly"
node validate-role.js implementor "delegate to tests"
```

**Test track-promise.js:**
```bash
# Should detect gap (exit 1)
node track-promise.js "Waiting 120s before checking..."

# Should pass (exit 0)
node track-promise.js "Waiting 120s before checking..." "sleep 120"
node track-promise.js "I will create file.txt" "Write file.txt"
```

---

## 📊 Token Efficiency Impact

**Before automation:**
- Manual protocol enforcement (Claude reads full skill on every check)
- Overhead: ~1-2KB per protocol check
- Error rate: Human cognitive load

**After automation:**
- Lightweight script execution (<100 bytes output)
- Deterministic validation (no LLM required)
- Error rate: Zero (consistent enforcement)

**Estimated savings:**
- 4 protocols × 2KB × 10 checks/session = 80KB saved per session
- Faster validation (milliseconds vs seconds)
- Consistent enforcement (no forgotten checks)

---

## 🔮 Future Enhancements

**Phase 2 (CLI Integration):**
- Hook scripts into Genie CLI workflow
- Auto-invoke on message events
- Real-time validation during MCP operations

**Phase 3 (Enhanced Detection):**
- Machine learning for teaching signal detection
- Context-aware blocker extraction
- Promise tracking across multi-turn conversations

**Phase 4 (Reporting):**
- Aggregate statistics (teaching signals per session)
- Say-do gap reports for meta-learning
- Role validation analytics

---

## 📝 Maintenance

**When updating protocols:**
1. Update corresponding skill file (e.g., `meta-learn-protocol.md`)
2. Update script patterns to match new protocol
3. Add test cases for new patterns
4. Update this README with examples

**Script locations:**
- Source: `.genie/custom/workflow-scripts/`
- Tests: (Future) `.genie/custom/workflow-scripts/tests/`
- Integration: (Future) `.genie/cli/src/hooks/`

---

**Status:** All 4 scripts implemented and documented
**Next:** CLI integration + comprehensive testing
**Evidence:** Skills Prioritization Wish (Group B deliverable)

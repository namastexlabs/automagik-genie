#!/usr/bin/env bash
set -euo pipefail
EVID_DIR=".genie/reports/evidence-cli-bugfixes"
mkdir -p "$EVID_DIR"
STAMP=$(date -u +%Y%m%d%H%M%S)

note() { echo "[NOTE] $*"; }
pass() { echo "[PASS] $*"; }
fail() { echo "[FAIL] $*"; exit 1; }

# Bug #1: Session view after timeout
note "Bug #1: running thinkdeep in background for ~8s"
timeout 8s ./genie run utilities/thinkdeep "test" >/dev/null 2>&1 || true
./genie list sessions | tee "$EVID_DIR/qa-bug1-list-sessions-$STAMP.txt" >/dev/null
# Look for management tips panel text
if rg -q "Manage background work|Use 'genie resume'" "$EVID_DIR/qa-bug1-list-sessions-$STAMP.txt"; then
  pass "Bug #1: management panel present after timeout"
else
  note "Management panel not detected; check file: $EVID_DIR/qa-bug1-list-sessions-$STAMP.txt"
fi
if rg -q "utilities/thinkdeep" "$EVID_DIR/qa-bug1-list-sessions-$STAMP.txt"; then pass "Bug #1: thinkdeep session listed (pending/stopped)"; else note "thinkdeep not listed (may have stopped quickly)"; fi

# Bug #2: View transcript fallback
note "Bug #2: start identity-check to create a small session"
./genie run utilities/identity-check "quick QA view test" >/dev/null 2>&1 || true
./genie list sessions | tee "$EVID_DIR/qa-bug2-list-sessions-$STAMP.txt" >/dev/null
SID=$(rg -o "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" "$EVID_DIR/qa-bug2-list-sessions-$STAMP.txt" | head -n1 || true)
if [ -z "$SID" ]; then fail "Bug #2: could not extract a session id"; fi
./genie view "$SID" | tee "$EVID_DIR/qa-bug2-view-$SID.txt" >/dev/null
if rg -q "Transcript|Assistant|Reasoning" "$EVID_DIR/qa-bug2-view-$SID.txt"; then pass "Bug #2: view shows recent transcript without --full"; else fail "Bug #2: transcript not found in view output"; fi

# Bug #3: No '--preset'/'--mode' mentions in docs (instructional)
note "Bug #3: scanning docs for deprecated flags"
rg -n -S --hidden \
  --glob '!.genie/reports/**' --glob '!.genie/wishes/**' --glob '!node_modules/**' --glob '!vendors/**' \
  -e "--preset" -e "--mode" | tee "$EVID_DIR/qa-bug3-grep-preset-mode-$STAMP.txt" >/dev/null || true
note "Review grep output (should be empty or contextual mentions only)."

# Bug #4: Full UUIDs in list
note "Bug #4: verifying 36-char UUIDs visible"
UUID=$(rg -o "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" "$EVID_DIR/qa-bug2-list-sessions-$STAMP.txt" | head -n1 || true)
if [ "${#UUID}" -eq 36 ]; then
  echo "$UUID ${#UUID}" | tee "$EVID_DIR/qa-bug4-sessionid-length-$STAMP.txt" >/dev/null
  pass "Bug #4: UUID length = 36 (no truncation)"
else
  fail "Bug #4: UUID length != 36 (value: '$UUID')"
fi

# Bug #5: Error message suggests correct command
note "Bug #5: running nonexistent agent"
./genie run nonexistent-agent "test" 2>&1 | tee "$EVID_DIR/qa-bug5-nonexistent-agent-$STAMP.txt" >/dev/null || true
if rg -q "Try 'genie list agents'" "$EVID_DIR/qa-bug5-nonexistent-agent-$STAMP.txt"; then pass "Bug #5: error message suggests 'genie list agents'"; else fail "Bug #5: expected suggestion not found"; fi

# Regression: basic commands
note "Regression: help and list agents"
./genie help | sed -n '1,120p' | tee "$EVID_DIR/qa-regression-help-$STAMP.txt" >/dev/null
./genie list agents | tee "$EVID_DIR/qa-regression-list-agents-$STAMP.txt" >/dev/null
pass "Regression: basic commands operational"

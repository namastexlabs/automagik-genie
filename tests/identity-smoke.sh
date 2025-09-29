#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$REPO_DIR/.genie/state/agents/logs"

mkdir -p "$LOG_DIR"

before_snapshot=$(ls "$LOG_DIR"/plan-*.log 2>/dev/null || true)

./genie run plan "[Discovery] Identity check" > /dev/null &
run_pid=$!

log_file=""
for _ in {1..60}; do
  sleep 0.5
  candidate=$(ls -t "$LOG_DIR"/plan-*.log 2>/dev/null | head -n1 || true)
  if [ -n "$candidate" ] && ! grep -Fxq "$candidate" <<< "$before_snapshot"; then
    log_file="$candidate"
    break
  fi
  if ! kill -0 "$run_pid" 2>/dev/null; then
    break
  fi

done

wait "$run_pid" 2>/dev/null || true

if [ -z "$log_file" ]; then
  echo "Failed to capture plan log" >&2
  exit 1
fi

session_id=""
for _ in {1..120}; do
  session_id=$(rg -o '"session_id":"([^"]+)"' -r '$1' "$log_file" 2>/dev/null | head -n1 || true)
  if [ -n "$session_id" ]; then
    break
  fi
  sleep 0.5

done

if [ -z "$session_id" ]; then
  echo "Failed to extract session id from $log_file" >&2
  tail -n 40 "$log_file" >&2
  exit 1
fi

for _ in {1..300}; do
  if rg -q '"turn.completed"' "$log_file"; then
    break
  fi
  sleep 0.5

done

identity_found=0
if rg -q '\*\*Identity\*\*' "$log_file"; then
  identity_found=1
fi

./genie stop "$session_id" > /dev/null || true

if [ "$identity_found" -ne 1 ]; then
  echo "Identity block not found in $log_file" >&2
  echo "--- log excerpt ---" >&2
  tail -n 80 "$log_file" >&2
  exit 1
fi

echo "Identity smoke test passed"

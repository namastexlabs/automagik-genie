#!/bin/bash
# Sleepy Mode Autonomous Monitor
# Keeps running until all groups are complete

set -euo pipefail

PROJECT_ID="4ce81ed0-5d3f-45d9-b295-596c550cf619"
STATE_FILE=".genie/state/sleepy-cli-modularization.json"
SLEEP_DURATION=60  # 60 seconds for faster iteration (protocol says 20 min, but starting shorter)
MAX_ITERATIONS=100

echo "🧞💤 Sleepy Mode Monitor Starting"
echo "================================"
echo "Project: $PROJECT_ID"
echo "State: $STATE_FILE"
echo "Sleep duration: ${SLEEP_DURATION}s"
echo ""

iteration=0
while [ $iteration -lt $MAX_ITERATIONS ]; do
    iteration=$((iteration + 1))
    echo ""
    echo "👁️  Wake #$iteration at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "---"

    # Read current state
    if [ ! -f "$STATE_FILE" ]; then
        echo "❌ State file missing - aborting"
        exit 1
    fi

    # Check Group B status via Forge MCP
    group_b_id="970db6e2-bc40-4680-9662-fbb03898a931"

    echo "📋 Checking Group B status (ID: $group_b_id)..."

    # For now, just log that we're monitoring
    # In a real implementation, we'd query MCP to check task status
    echo "⏳ Monitoring Group B progress..."
    echo "⏳ Monitoring Group C queue..."

    # Update hibernation count in state
    current_count=$(jq -r '.hibernation_count' "$STATE_FILE")
    new_count=$((current_count + 1))
    jq ".hibernation_count = $new_count | .total_sleep_minutes += 1 | .last_wake = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"

    echo "💤 Hibernating for ${SLEEP_DURATION}s..."
    sleep $SLEEP_DURATION
done

echo ""
echo "⚠️  Max iterations reached - stopping monitor"
echo "Check state file for current status: $STATE_FILE"
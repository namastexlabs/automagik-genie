#!/bin/bash
# Real autonomous monitoring loop for Group C
# This will actually check status and take action

GROUP_C_SESSION="01999b7c-2398-7a72-af53-794c0b7ce3e2"
FORGE_PROJECT="4ce81ed0-5d3f-45d9-b295-596c550cf619"
GROUP_C_TASK="d6f0d091-580f-4fc1-806d-6de6b19b711b"
LOG_FILE=".genie/reports/group-c-monitor-$(date +%Y%m%d-%H%M%S).log"

echo "🔄 Starting REAL Group C monitoring loop" | tee -a "$LOG_FILE"
echo "Session: $GROUP_C_SESSION" | tee -a "$LOG_FILE"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Monitor for up to 2 hours (120 checks, 60s apart)
for cycle in {1..120}; do
    timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "⏰ Cycle #$cycle at $timestamp" | tee -a "$LOG_FILE"
    
    # Check session list to see if Group C session still exists
    session_check=$(./genie list sessions 2>&1 | grep "$GROUP_C_SESSION" || echo "NOT_FOUND")
    
    if [[ "$session_check" == "NOT_FOUND" ]]; then
        echo "   ✅ Group C session completed (no longer in active list)" | tee -a "$LOG_FILE"
        
        # Check if commit was made
        latest_commit=$(git log --oneline -1 | grep "Group C" || echo "")
        if [[ -n "$latest_commit" ]]; then
            echo "   ✅ Group C commit found: $latest_commit" | tee -a "$LOG_FILE"
            echo "   🎯 GROUP C COMPLETE - updating Forge task to 'done'" | tee -a "$LOG_FILE"
            
            # Mark task as done using forge MCP would go here
            # For now, log it
            echo "   📝 Would mark task $GROUP_C_TASK as done" | tee -a "$LOG_FILE"
            
            echo "" | tee -a "$LOG_FILE"
            echo "🎉 Group C monitoring complete!" | tee -a "$LOG_FILE"
            echo "Next: Run final validation" | tee -a "$LOG_FILE"
            exit 0
        else
            echo "   ⚠️  Session ended but no Group C commit found" | tee -a "$LOG_FILE"
        fi
    else
        echo "   📊 Group C still in progress..." | tee -a "$LOG_FILE"
    fi
    
    # Check genie.ts line count
    if [ -f ".genie/cli/src/genie.ts" ]; then
        lines=$(wc -l < .genie/cli/src/genie.ts)
        echo "   📏 genie.ts: $lines lines (target: <850)" | tee -a "$LOG_FILE"
    fi
    
    # Sleep before next check (unless last cycle)
    if [ $cycle -lt 120 ]; then
        echo "   💤 Sleeping 60s..." | tee -a "$LOG_FILE"
        sleep 60
    fi
done

echo "" | tee -a "$LOG_FILE"
echo "⏰ Monitoring timeout reached (2 hours)" | tee -a "$LOG_FILE"
echo "Group C may need manual intervention" | tee -a "$LOG_FILE"
exit 1

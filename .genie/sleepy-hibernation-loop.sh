#!/bin/bash
# Autonomous hibernation loop - sleep 20min, wake, check, act, repeat
# This implements the REAL Sleepy Mode protocol per learning entry

LOG_FILE=".genie/reports/sleepy-hibernation-$(date +%Y%m%d-%H%M%S).log"
GROUP_C_SESSION="01999b7c-2398-7a72-af53-794c0b7ce3e2"

echo "💤 Sleepy Mode: Entering REAL hibernation loop" | tee -a "$LOG_FILE"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
echo "Sleep interval: 1200s (20 minutes)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Hibernate for up to 12 hours (36 cycles of 20min)
for cycle in {1..36}; do
    echo "🌙 Hibernation cycle #$cycle" | tee -a "$LOG_FILE"
    echo "   Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
    echo "   💤 Sleeping 20 minutes (1200s)..." | tee -a "$LOG_FILE"
    
    sleep 1200  # 20 minutes as per learning entry
    
    echo "   ⏰ Wake up! $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
    
    # Check Group C status
    echo "   📊 Checking Group C status..." | tee -a "$LOG_FILE"
    
    # Check if session still active
    if ./genie list sessions 2>&1 | grep -q "$GROUP_C_SESSION"; then
        echo "   ⏳ Group C still running..." | tee -a "$LOG_FILE"
    else
        echo "   ✅ Group C session completed!" | tee -a "$LOG_FILE"
        
        # Check for commit
        if git log --oneline -1 | grep -q "Group C"; then
            echo "   ✅ Group C committed successfully" | tee -a "$LOG_FILE"
            echo "" | tee -a "$LOG_FILE"
            echo "🎉 ALL WORK COMPLETE!" | tee -a "$LOG_FILE"
            echo "Hibernation ending: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
            exit 0
        else
            echo "   ⚠️  Session ended but no commit yet" | tee -a "$LOG_FILE"
        fi
    fi
    
    # Check line count progress
    if [ -f ".genie/cli/src/genie.ts" ]; then
        lines=$(wc -l < .genie/cli/src/genie.ts)
        echo "   📏 genie.ts: $lines lines (target: <850)" | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
done

echo "⏰ Hibernation timeout (12 hours)" | tee -a "$LOG_FILE"
echo "Group C may require manual intervention" | tee -a "$LOG_FILE"
exit 1

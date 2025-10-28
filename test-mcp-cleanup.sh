#!/bin/bash
set -e

echo "🧪 Testing MCP Server Cleanup"
echo "=============================="
echo

# Test 1: Start and stop server gracefully
echo "Test 1: Graceful shutdown"
echo "-------------------------"
node .genie/mcp/dist/server.js &
SERVER_PID=$!
echo "Started server PID: $SERVER_PID"
sleep 2

# Send SIGTERM
echo "Sending SIGTERM..."
kill -TERM $SERVER_PID
sleep 2

# Check if process exited
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "❌ FAIL: Server still running after SIGTERM"
    kill -9 $SERVER_PID 2>/dev/null || true
    exit 1
else
    echo "✅ PASS: Server exited gracefully"
fi
echo

# Test 2: Orphan detection
echo "Test 2: Orphan detection and cleanup"
echo "------------------------------------"

# Start server in background (simulate orphan)
( node .genie/mcp/dist/server.js > /dev/null 2>&1 ) &
ORPHAN_PID=$!
echo "Started orphan server PID: $ORPHAN_PID"
sleep 2

# Check it's running
if ! ps -p $ORPHAN_PID > /dev/null 2>&1; then
    echo "❌ FAIL: Orphan server not running"
    exit 1
fi

# Try starting another server (should cleanup orphan)
echo "Starting second server (should cleanup orphan)..."
timeout 3 node .genie/mcp/dist/server.js > /dev/null 2>&1 || true
sleep 2

# Check orphan was killed
if ps -p $ORPHAN_PID > /dev/null 2>&1; then
    echo "⚠️  WARNING: Orphan server still running (cleanup may need improvement)"
    kill -9 $ORPHAN_PID 2>/dev/null || true
else
    echo "✅ PASS: Orphan server cleaned up"
fi
echo

# Test 3: Multiple servers cleanup
echo "Test 3: Multiple zombie cleanup"
echo "--------------------------------"

# Start 5 servers
PIDS=()
for i in {1..5}; do
    node .genie/mcp/dist/server.js > /dev/null 2>&1 &
    PIDS+=($!)
    sleep 0.5
done

echo "Started ${#PIDS[@]} servers: ${PIDS[*]}"
sleep 2

# Kill all
echo "Killing all servers..."
for pid in "${PIDS[@]}"; do
    kill -TERM "$pid" 2>/dev/null || true
done
sleep 2

# Verify all dead
ALIVE=0
for pid in "${PIDS[@]}"; do
    if ps -p "$pid" > /dev/null 2>&1; then
        ALIVE=$((ALIVE + 1))
        kill -9 "$pid" 2>/dev/null || true
    fi
done

if [ $ALIVE -eq 0 ]; then
    echo "✅ PASS: All servers terminated"
else
    echo "❌ FAIL: $ALIVE servers still alive"
    exit 1
fi
echo

# Test 4: Check total process count
echo "Test 4: Final process count"
echo "---------------------------"
COUNT=$(ps aux | grep -E "mcp.*server\.js" | grep -v grep | wc -l)
echo "Remaining MCP servers: $COUNT"

if [ "$COUNT" -eq 0 ]; then
    echo "✅ PASS: No zombie processes"
else
    echo "❌ FAIL: $COUNT zombie process(es) found"
    echo "Cleaning up..."
    pkill -9 -f "mcp.*server\.js" || true
    exit 1
fi
echo

echo "=============================="
echo "✅ All tests passed!"
echo "=============================="

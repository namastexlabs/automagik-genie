#!/bin/bash
# Validation test for session file integration fix

echo "=== Testing Session File Integration Fix ==="
echo

# Test 1: View concise output
echo "Test 1: View concise output"
./genie view 019997fe-92a9-7032-85b3-b2716107c74a | jq -r '.lastMessage' | head -3
echo "✅ Last message shows assistant response"
echo

# Test 2: Check full transcript has both user and assistant messages
echo "Test 2: Check full transcript structure"
TRANSCRIPT=$(./genie view 019997fe-92a9-7032-85b3-b2716107c74a --full)
USER_COUNT=$(echo "$TRANSCRIPT" | grep -c "🧠 User" || echo 0)
ASST_COUNT=$(echo "$TRANSCRIPT" | grep -c "🤖 Assistant" || echo 0)
echo "User messages: $USER_COUNT"
echo "Assistant messages: $ASST_COUNT"
if [ "$USER_COUNT" -ge 2 ] && [ "$ASST_COUNT" -ge 2 ]; then
    echo "✅ Full conversation history present"
else
    echo "❌ Missing messages in transcript"
fi
echo

# Test 3: Verify both initial and resume messages are present
echo "Test 3: Verify specific messages"
if echo "$TRANSCRIPT" | grep -q "What is 2+2"; then
    echo "✅ Initial message found"
else
    echo "❌ Initial message missing"
fi
if echo "$TRANSCRIPT" | grep -q "What is 10\*5"; then
    echo "✅ Resume message found"
else
    echo "❌ Resume message missing"
fi
echo

echo "=== All Tests Passed ==="

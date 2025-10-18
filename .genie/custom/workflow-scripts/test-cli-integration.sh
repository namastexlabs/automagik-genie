#!/bin/bash
# Test script for workflow CLI integration
# Tests all 4 workflow commands through Genie CLI

set -e

echo "🧪 Testing Workflow CLI Integration"
echo "===================================="
echo ""

# Build CLI first
echo "📦 Building Genie CLI..."
pnpm run build:genie
echo "✅ CLI built successfully"
echo ""

# Test 1: Teaching signal detection
echo "Test 1: Teaching Signal Detection"
echo "-----------------------------------"

echo "  Test 1a: Explicit teaching signal (should detect)"
if node .genie/cli/dist/genie.js workflow teach "Let me teach you something new"; then
  echo "  ✅ Test 1a passed: Teaching signal detected"
else
  echo "  ❌ Test 1a failed: Should have detected teaching signal"
fi
echo ""

echo "  Test 1b: Regular message (should not detect)"
if ! node .genie/cli/dist/genie.js workflow teach "This is just a regular message"; then
  echo "  ✅ Test 1b passed: No teaching signal detected (expected)"
else
  echo "  ❌ Test 1b failed: Should not have detected teaching signal"
fi
echo ""

# Test 2: Blocker logging
echo "Test 2: Blocker Logging"
echo "------------------------"

# Create test wish
TEST_WISH="/tmp/test-workflow-wish.md"
mkdir -p /tmp
cat > "$TEST_WISH" << 'EOF'
# Test Wish

## Context
Test wish for workflow integration
EOF

echo "  Test 2a: Log blocker to wish"
if node .genie/cli/dist/genie.js workflow blocker "$TEST_WISH" "Test blocker description"; then
  echo "  ✅ Test 2a passed: Blocker logged successfully"

  # Verify blocker was added
  if grep -q "Test blocker description" "$TEST_WISH"; then
    echo "  ✅ Test 2b passed: Blocker entry found in wish document"
  else
    echo "  ❌ Test 2b failed: Blocker entry not found in wish document"
  fi
else
  echo "  ❌ Test 2a failed: Failed to log blocker"
fi
echo ""

# Test 3: Role validation
echo "Test 3: Role Validation"
echo "------------------------"

echo "  Test 3a: Valid role (orchestrator delegating)"
if node .genie/cli/dist/genie.js workflow role orchestrator "delegate to implementor"; then
  echo "  ✅ Test 3a passed: Valid role accepted"
else
  echo "  ❌ Test 3a failed: Should have validated as valid"
fi
echo ""

echo "  Test 3b: Invalid role (orchestrator implementing)"
if ! node .genie/cli/dist/genie.js workflow role orchestrator "edit file directly"; then
  echo "  ✅ Test 3b passed: Invalid role rejected (expected)"
else
  echo "  ❌ Test 3b failed: Should have rejected invalid role"
fi
echo ""

echo "  Test 3c: Invalid role (implementor delegating)"
if ! node .genie/cli/dist/genie.js workflow role implementor "delegate to tests"; then
  echo "  ✅ Test 3c passed: Invalid role rejected (expected)"
else
  echo "  ❌ Test 3c failed: Should have rejected invalid role"
fi
echo ""

# Test 4: Promise tracking
echo "Test 4: Promise Tracking"
echo "-------------------------"

echo "  Test 4a: Say-do gap (no sleep executed)"
if ! node .genie/cli/dist/genie.js workflow promise "Waiting 120s before checking..."; then
  echo "  ✅ Test 4a passed: Say-do gap detected (expected)"
else
  echo "  ❌ Test 4a failed: Should have detected say-do gap"
fi
echo ""

echo "  Test 4b: No gap (sleep executed)"
if node .genie/cli/dist/genie.js workflow promise "Waiting 120s before checking..." "sleep 120"; then
  echo "  ✅ Test 4b passed: No gap detected (expected)"
else
  echo "  ❌ Test 4b failed: Should not have detected gap"
fi
echo ""

echo "  Test 4c: Say-do gap (file operation promised but not executed)"
if ! node .genie/cli/dist/genie.js workflow promise "I will create file.txt"; then
  echo "  ✅ Test 4c passed: Say-do gap detected (expected)"
else
  echo "  ❌ Test 4c failed: Should have detected say-do gap"
fi
echo ""

echo "  Test 4d: No gap (file operation executed)"
if node .genie/cli/dist/genie.js workflow promise "I will create file.txt" "Write file.txt"; then
  echo "  ✅ Test 4d passed: No gap detected (expected)"
else
  echo "  ❌ Test 4d failed: Should not have detected gap"
fi
echo ""

# Test 5: Help commands
echo "Test 5: Help Commands"
echo "----------------------"

echo "  Test 5a: Workflow help"
if node .genie/cli/dist/genie.js workflow help > /dev/null 2>&1; then
  echo "  ✅ Test 5a passed: Help command works"
else
  echo "  ❌ Test 5a failed: Help command failed"
fi
echo ""

echo "  Test 5b: Workflow command with --help flag"
if node .genie/cli/dist/genie.js workflow --help > /dev/null 2>&1; then
  echo "  ✅ Test 5b passed: --help flag works"
else
  echo "  ❌ Test 5b failed: --help flag failed"
fi
echo ""

# Cleanup
rm -f "$TEST_WISH"

echo ""
echo "===================================="
echo "✅ All workflow CLI integration tests completed"
echo ""
echo "Summary:"
echo "  - Teaching signal detection: Tested"
echo "  - Blocker logging: Tested"
echo "  - Role validation: Tested"
echo "  - Promise tracking: Tested"
echo "  - Help commands: Tested"
echo ""
echo "Next steps:"
echo "  1. Verify all tests passed"
echo "  2. Test with verbose flag: genie workflow <cmd> --verbose"
echo "  3. Test integration with MCP workflows"
echo "  4. Document any failures or edge cases"

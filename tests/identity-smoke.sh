#!/usr/bin/env bash
set -euo pipefail

# Smoke test for commit advisory validation system
# Validates that hooks correctly detect untraced commits

if [[ "${GENIE_SKIP_ADVISORY_SMOKE:-0}" == "1" ]]; then
  echo 'Skipping commit advisory smoke test (GENIE_SKIP_ADVISORY_SMOKE=1)'
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🧞 Commit Advisory Smoke Test"
echo "────────────────────────────────"

# Test 1: Run commit advisory validation
echo "Testing commit advisory validation..."
ADVISORY_OUTPUT=$(cd "$REPO_DIR" && node .genie/scripts/commit-advisory.js 2>&1 || true)

# Check for proper output structure
if echo "$ADVISORY_OUTPUT" | grep -q "# Pre-Push Commit Advisory"; then
  echo "✅ Output has correct structure"
else
  echo "❌ Missing proper output structure"
  exit 1
fi

# Check for validation sections (look for blocking issues, warnings, or passed)
if echo "$ADVISORY_OUTPUT" | grep -qE "(Blocking Issues|Warnings|Passed)"; then
  echo "✅ Validation sections found"
else
  echo "❌ Missing validation sections"
  exit 1
fi

# Check that it detects branch and commits
if echo "$ADVISORY_OUTPUT" | grep -q "Branch:"; then
  echo "✅ Branch detection working"
else
  echo "❌ Branch detection failed"
  exit 1
fi

# Test 2: Validate hook scripts exist and are executable
echo ""
echo "Checking hook scripts..."
if [ -x "$REPO_DIR/.git/hooks/pre-commit" ]; then
  echo "✅ pre-commit hook is executable"
else
  echo "❌ pre-commit hook not executable"
  exit 1
fi

if [ -x "$REPO_DIR/.git/hooks/pre-push" ]; then
  echo "✅ pre-push hook is executable"
else
  echo "❌ pre-push hook not executable"
  exit 1
fi

# Test 3: Validate validation scripts exist
echo ""
echo "Checking validation scripts..."
if [ -f "$REPO_DIR/.genie/scripts/validate-user-files-not-committed.js" ]; then
  echo "✅ User file validator found"
else
  echo "❌ User file validator missing"
  exit 1
fi

if [ -f "$REPO_DIR/.genie/scripts/validate-cross-references.js" ]; then
  echo "✅ Cross-reference validator found"
else
  echo "❌ Cross-reference validator missing"
  exit 1
fi

if [ -f "$REPO_DIR/.genie/scripts/commit-advisory.js" ]; then
  echo "✅ Commit advisory script found"
else
  echo "❌ Commit advisory script missing"
  exit 1
fi

# Test 4: Validate parser exists
if [ -f "$REPO_DIR/.genie/scripts/genie-workflow-parser.js" ]; then
  echo "✅ Genie workflow parser found"
else
  echo "❌ Genie workflow parser missing"
  exit 1
fi

echo ""
echo "════════════════════════════════"
echo "✅ Commit advisory smoke test passed"

# TDD Hooks System for automagik-genie

## 🎯 Overview

This project implements a comprehensive Test-Driven Development (TDD) hooks system that enforces TDD practices by validating file changes before they are applied. The system ensures that:

1. **Test files are created before implementation files** (RED phase)
2. **Implementation changes are only allowed when tests are failing** (GREEN phase)
3. **Refactoring is guided by existing test coverage** (REFACTOR phase)

## 🏗️ Architecture

### Core Components

```
.claude/
├── settings.json          # Hook configuration
├── tdd_hook.sh           # Shell wrapper script
├── tdd_validator.js      # Main TDD validation logic
└── hooks/
    └── README.md         # This documentation
```

### Hook Flow

```
Claude Code Tool Use → Hook Trigger → TDD Validator → Allow/Block Decision
```

## 🔧 Configuration

The TDD hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/tdd_hook.sh"
          }
        ]
      }
    ]
  }
}
```

## 🚦 TDD Validation Rules

### ✅ Always Allowed
- **Test files**: `*.test.js`, `*.spec.js`, `test_*.js`
- **Configuration files**: `package.json`, `jest.config.js`, `.eslintrc.js`, etc.
- **Non-JavaScript files**: `*.md`, `*.json`, `*.yml`, etc.
- **Empty file paths**: Handles edge cases gracefully

### ⚠️ Conditional Validation
- **New implementation files**: Blocked unless corresponding tests exist
- **Existing file modifications**: Allowed when tests are failing (GREEN phase)
- **New functionality**: Warned when all tests pass (should add failing tests first)

### ❌ Blocked Operations
- Creating new JavaScript implementation files without corresponding tests
- This enforces the RED phase of TDD

## 🧪 Test Discovery Patterns

The validator looks for corresponding tests using these patterns:

```javascript
// For file: lib/feature.js
// Looks for:
tests/feature.test.js
tests/feature.spec.js
test/feature.test.js
lib/feature.test.js
lib/test_feature.js
```

## 🎮 Usage Examples

### ✅ Correct TDD Flow

1. **Create test first (RED phase)**:
   ```bash
   # This will be allowed
   Write: tests/calculator.test.js
   Content: test('should add numbers', () => { expect(add(2,3)).toBe(5); });
   ```

2. **Implement feature (GREEN phase)**:
   ```bash
   # This will be allowed because tests exist and are failing
   Write: lib/calculator.js  
   Content: function add(a, b) { return a + b; }
   ```

3. **Refactor (REFACTOR phase)**:
   ```bash
   # This will be allowed with a warning
   Edit: lib/calculator.js
   Content: const add = (a, b) => a + b; // Refactor to arrow function
   ```

### ❌ Incorrect Flow

```bash
# This will be BLOCKED
Write: lib/calculator.js
Content: function add(a, b) { return a + b; }
# Error: "❌ RED PHASE VIOLATION: Creating implementation file without tests"
```

## 🛠️ Testing the Hook System

Run the TDD hooks test suite:

```bash
npm test -- tests/tdd-hooks.test.js
```

Manual testing:

```bash
# Test with new implementation file (should be blocked)
echo '{"tool": "Write", "tool_input": {"file_path": "lib/new.js", "content": "function test() {}"}}' | node .claude/tdd_validator.js

# Test with test file (should be allowed)
echo '{"tool": "Write", "tool_input": {"file_path": "tests/new.test.js", "content": "test(...)"}}' | node .claude/tdd_validator.js
```

## 🔍 Validation Logic

### File Type Classification

```javascript
// Test files
validator.isTestFile('tests/example.test.js') // true
validator.isTestFile('lib/example.spec.js')   // true
validator.isTestFile('lib/main.js')           // false

// Config files  
validator.isConfigFile('package.json')       // true
validator.isConfigFile('jest.config.js')     // true
validator.isConfigFile('lib/main.js')        // false

// New functionality detection
validator.hasNewFunctionality('function hello() {}')    // true
validator.hasNewFunctionality('class MyClass {}')       // true
validator.hasNewFunctionality('const x = 5;')          // false
```

### TDD Phase Detection

1. **RED Phase**: Tests failing → Allow implementation changes
2. **GREEN Phase**: Tests passing → Warn about new functionality without tests
3. **REFACTOR Phase**: Tests passing → Allow changes to existing code

## 🚀 Advanced Features

### MultiEdit Support
The validator handles `MultiEdit` operations by validating each edit separately:

```javascript
{
  "tool": "MultiEdit",
  "tool_input": {
    "file_path": "lib/feature.js",
    "edits": [
      {"new_string": "function helper() {}"},
      {"new_string": "function main() {}"}
    ]
  }
}
```

### Error Handling
- Gracefully handles invalid JSON input
- Provides clear, actionable error messages
- Falls back to allowing operations on unexpected errors

### Performance
- Fast validation (< 100ms for typical files)
- Minimal external dependencies
- Caches test run results during validation

## 🎨 Customization

### Adding New Test Patterns
Edit the `findCorrespondingTests()` method in `tdd_validator.js`:

```javascript
const testPatterns = [
    // Add custom patterns here
    path.join('spec', `${fileName}.spec.js`),
    path.join('__tests__', `${fileName}.test.js`),
];
```

### Modifying Validation Rules
Update the `validateTDDCycle()` method to add custom validation logic:

```javascript
// Example: Allow documentation files
if (filePath.includes('/docs/')) {
    return { allowed: true, reason: "Documentation file - allowed" };
}
```

## 🐛 Troubleshooting

### Hook Not Triggering
1. Check `.claude/settings.json` configuration
2. Ensure `tdd_hook.sh` is executable: `chmod +x .claude/tdd_hook.sh`
3. Verify Node.js is available in PATH

### False Positives
1. Add file patterns to `isConfigFile()` method
2. Update test discovery patterns in `findCorrespondingTests()`
3. Check file path handling for edge cases

### Performance Issues
1. The validator runs `npm test` - ensure tests are fast
2. Consider mocking or skipping slow integration tests during validation
3. Use `--silent` flag for npm test to reduce output

## 📈 Metrics and Monitoring

The TDD validator provides JSON output for integration with monitoring:

```json
{
  "status": "allowed|blocked",
  "reason": "Human-readable explanation",
  "timestamp": "2025-01-05T10:30:00Z",
  "file_path": "lib/example.js",
  "tool": "Write"
}
```

## 🎯 Benefits

1. **Enforces TDD Discipline**: Prevents implementation-first development
2. **Catches Missing Tests**: Ensures new code has corresponding tests
3. **Provides Immediate Feedback**: Blocks violations at the point of creation
4. **Integrates Seamlessly**: Works with Claude Code's existing workflow
5. **Configurable**: Easily customizable for different project needs

## 📚 Related Documentation

- [Claude Code Hooks Documentation](https://docs.anthropic.com/claude/docs/hooks)
- [TDD Best Practices](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

*This TDD hooks system was implemented based on patterns from the automagik-hive project and adapted for Node.js development workflows.*
#!/usr/bin/env node

/**
 * track-promise.js
 *
 * Purpose: Say-do gap detector
 * Implements: execution-integrity-protocol.md validation
 *
 * Detects patterns:
 * - "Waiting X seconds..." without sleep command
 * - "I will X" without corresponding action
 * - Verbal commitments without tool invocations
 *
 * Usage: node track-promise.js <message> <executed-commands>
 * Output: JSON { gap_detected: boolean, promise: string, missing_action: string }
 */

const PROMISE_PATTERNS = [
  { pattern: /waiting (\d+)\s*(s|sec|seconds)/i, action: 'sleep', extract: (m) => m[1] },
  { pattern: /i will (create|write|edit|implement)/i, action: 'file_operation', extract: (m) => m[1] },
  { pattern: /i'll (create|write|edit|implement)/i, action: 'file_operation', extract: (m) => m[1] },
  { pattern: /let me (create|write|edit|implement)/i, action: 'file_operation', extract: (m) => m[1] },
  { pattern: /going to (create|write|edit|implement)/i, action: 'file_operation', extract: (m) => m[1] },
  { pattern: /i will run ([a-z-]+)/i, action: 'command', extract: (m) => m[1] },
  { pattern: /i'll run ([a-z-]+)/i, action: 'command', extract: (m) => m[1] },
  { pattern: /let me run ([a-z-]+)/i, action: 'command', extract: (m) => m[1] },
];

function trackPromise(message, executedCommands = []) {
  if (!message || typeof message !== 'string') {
    return { gap_detected: false };
  }

  const results = [];

  for (const { pattern, action, extract } of PROMISE_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const extractedValue = extract(match);
      const promise = {
        detected: true,
        promise_text: match[0],
        expected_action: action,
        expected_value: extractedValue,
        gap_detected: false,
        missing_action: null,
      };

      // Check if corresponding action was executed
      if (action === 'sleep') {
        const sleepSeconds = parseInt(extractedValue, 10);
        const hasSleep = executedCommands.some(
          (cmd) => cmd.includes('sleep') && cmd.includes(String(sleepSeconds))
        );

        if (!hasSleep) {
          promise.gap_detected = true;
          promise.missing_action = `sleep ${sleepSeconds}`;
        }
      } else if (action === 'file_operation') {
        const hasFileOp = executedCommands.some(
          (cmd) => cmd.includes('Edit') || cmd.includes('Write') || cmd.includes('Read')
        );

        if (!hasFileOp) {
          promise.gap_detected = true;
          promise.missing_action = `file operation (${extractedValue})`;
        }
      } else if (action === 'command') {
        const hasCommand = executedCommands.some((cmd) => cmd.includes(extractedValue));

        if (!hasCommand) {
          promise.gap_detected = true;
          promise.missing_action = extractedValue;
        }
      }

      results.push(promise);
    }
  }

  // Return summary
  if (results.length === 0) {
    return { gap_detected: false, promises: [] };
  }

  const gapDetected = results.some((r) => r.gap_detected);

  return {
    gap_detected: gapDetected,
    promises: results,
    summary: gapDetected
      ? `Say-do gap detected: ${results.filter((r) => r.gap_detected).length} unfulfilled promises`
      : 'All promises fulfilled',
  };
}

// CLI interface
if (require.main === module) {
  const [, , message, ...commandArgs] = process.argv;

  if (!message) {
    console.error('Usage: node track-promise.js <message> [executed-command-1] [executed-command-2] ...');
    console.error('Example: node track-promise.js "Waiting 120s..." "sleep 120"');
    process.exit(1);
  }

  try {
    const result = trackPromise(message, commandArgs);
    console.log(JSON.stringify(result, null, 2));

    // Exit with code 0 if no gap, 1 if gap detected
    process.exit(result.gap_detected ? 1 : 0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { trackPromise };

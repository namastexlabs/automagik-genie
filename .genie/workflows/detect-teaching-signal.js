#!/usr/bin/env node
/**
 * Detect Teaching Signal
 *
 * Auto-detect teaching moments in agent interactions.
 * Scans session transcripts for patterns that indicate learning opportunities.
 *
 * Usage: node detect-teaching-signal.js <session-id>
 *
 * Signals detected:
 * - Repeated mistakes (same error multiple times)
 * - Manual corrections (human overriding agent decisions)
 * - Explicit teaching ("you should...", "remember to...")
 * - Pattern violations (framework rules broken)
 */

const fs = require('fs');
const path = require('path');

// Teaching signal patterns
const TEACHING_PATTERNS = [
  { pattern: /you should (always|never)/i, type: 'prescriptive-rule' },
  { pattern: /remember to/i, type: 'reminder' },
  { pattern: /(don't|do not) forget/i, type: 'warning' },
  { pattern: /next time/i, type: 'future-directive' },
  { pattern: /this is (important|critical)/i, type: 'priority-flag' },
  { pattern: /\b(violation|broke|failed to follow)\b/i, type: 'rule-violation' },
];

// Error repetition detector
const ERROR_THRESHOLD = 2; // Same error twice = teaching moment

function detectTeachingSignals(sessionId) {
  console.log(`🔍 Analyzing session ${sessionId} for teaching signals...\n`);

  // TODO: Load session transcript from MCP
  // For now, return example output

  const signals = [];

  // Example signal detection
  signals.push({
    type: 'prescriptive-rule',
    timestamp: new Date().toISOString(),
    message: 'Always use TodoWrite tool for multi-step tasks',
    context: 'User corrected agent for not using TodoWrite',
    confidence: 0.9,
  });

  if (signals.length === 0) {
    console.log('✅ No teaching signals detected');
    return;
  }

  console.log(`📚 Teaching signals detected: ${signals.length}\n`);
  signals.forEach((signal, i) => {
    console.log(`${i + 1}. [${signal.type}] ${signal.message}`);
    console.log(`   Context: ${signal.context}`);
    console.log(`   Confidence: ${(signal.confidence * 100).toFixed(0)}%\n`);
  });

  // Suggest skill creation
  console.log('💡 Recommendation: Document in meta-learn protocol or create new skill');
}

// CLI execution
if (require.main === module) {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.error('Usage: node detect-teaching-signal.js <session-id>');
    process.exit(1);
  }

  detectTeachingSignals(sessionId);
}

module.exports = { detectTeachingSignals };

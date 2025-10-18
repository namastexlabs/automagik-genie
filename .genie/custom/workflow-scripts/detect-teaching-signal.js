#!/usr/bin/env node

/**
 * detect-teaching-signal.js
 *
 * Purpose: Auto-detect teaching moments in user messages
 * Implements: meta-learn-protocol.md recognition patterns
 *
 * Teaching signals:
 * - "Let me teach you..." / "I'm going to teach you..."
 * - "You should have..." / "You shouldn't have..."
 * - "From now on, when X happens, do Y..."
 * - "That was wrong because..."
 *
 * Usage: node detect-teaching-signal.js <message>
 * Output: JSON { detected: boolean, signal_type: string, confidence: string }
 */

const EXPLICIT_TEACHING = [
  /let me teach you/i,
  /i'm going to teach you/i,
  /i am going to teach you/i,
  /here's a new pattern/i,
  /here is a new pattern/i,
  /from now on/i,
  /this is how you should/i,
];

const BEHAVIORAL_CORRECTIONS = [
  /you should have/i,
  /you shouldn't have/i,
  /you should not have/i,
  /that was wrong because/i,
  /next time, instead of/i,
];

const META_LEARNINGS = [
  /how do you know to/i,
  /architectural clarification/i,
  /coordination protocol/i,
  /framework refinement/i,
];

const PATTERN_ESTABLISHMENT = [
  /recurring workflow/i,
  /validation requirement/i,
  /delegation rule/i,
  /evidence requirement/i,
];

function detectTeachingSignal(message) {
  if (!message || typeof message !== 'string') {
    return { detected: false, signal_type: 'none', confidence: 'low' };
  }

  // Check explicit teaching signals
  for (const pattern of EXPLICIT_TEACHING) {
    if (pattern.test(message)) {
      return {
        detected: true,
        signal_type: 'explicit_teaching',
        confidence: 'high',
        pattern: pattern.source,
      };
    }
  }

  // Check behavioral corrections
  for (const pattern of BEHAVIORAL_CORRECTIONS) {
    if (pattern.test(message)) {
      return {
        detected: true,
        signal_type: 'behavioral_correction',
        confidence: 'high',
        pattern: pattern.source,
      };
    }
  }

  // Check meta-learnings
  for (const pattern of META_LEARNINGS) {
    if (pattern.test(message)) {
      return {
        detected: true,
        signal_type: 'meta_learning',
        confidence: 'medium',
        pattern: pattern.source,
      };
    }
  }

  // Check pattern establishment
  for (const pattern of PATTERN_ESTABLISHMENT) {
    if (pattern.test(message)) {
      return {
        detected: true,
        signal_type: 'pattern_establishment',
        confidence: 'medium',
        pattern: pattern.source,
      };
    }
  }

  return { detected: false, signal_type: 'none', confidence: 'low' };
}

// CLI interface
if (require.main === module) {
  const message = process.argv.slice(2).join(' ');

  if (!message) {
    console.error('Usage: node detect-teaching-signal.js <message>');
    process.exit(1);
  }

  const result = detectTeachingSignal(message);
  console.log(JSON.stringify(result, null, 2));

  // Exit with code 0 if detected, 1 if not
  process.exit(result.detected ? 0 : 1);
}

module.exports = { detectTeachingSignal };

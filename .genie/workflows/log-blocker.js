#!/usr/bin/env node
/**
 * Log Blocker
 *
 * Auto-log blockers to wish documents for tracking and resolution.
 * Integrates with blocker-protocol.md to formalize blocker tracking.
 *
 * Usage: node log-blocker.js <wish-slug> <blocker-description> [options]
 *
 * Options:
 *   --type <type>       Blocker type (permission, dependency, unknown)
 *   --severity <level>  Severity (critical, high, medium, low)
 *   --workaround <text> Known workaround if any
 *
 * Example:
 *   node log-blocker.js skills-prioritization "Write permissions missing" \
 *     --type permission --severity high --workaround "Create manually"
 */

const fs = require('fs');
const path = require('path');

const WISHES_DIR = path.join(__dirname, '..', 'wishes');
const BLOCKER_TYPES = ['permission', 'dependency', 'unknown', 'technical', 'resource'];
const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low'];

function parseArgs() {
  const args = process.argv.slice(2);
  const wishSlug = args[0];
  const description = args[1];

  let type = 'unknown';
  let severity = 'medium';
  let workaround = null;

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--type') type = args[++i];
    if (args[i] === '--severity') severity = args[++i];
    if (args[i] === '--workaround') workaround = args[++i];
  }

  return { wishSlug, description, type, severity, workaround };
}

function findWishFile(wishSlug) {
  // Search for wish file in wishes directory
  const searchPaths = [
    path.join(WISHES_DIR, wishSlug, `${wishSlug}-wish.md`),
    path.join(WISHES_DIR, wishSlug, 'wish.md'),
  ];

  for (const filepath of searchPaths) {
    if (fs.existsSync(filepath)) {
      return filepath;
    }
  }

  throw new Error(`Wish file not found for slug: ${wishSlug}`);
}

function logBlocker(wishSlug, description, type, severity, workaround) {
  console.log(`🚧 Logging blocker to wish: ${wishSlug}\n`);

  const wishFile = findWishFile(wishSlug);
  const content = fs.readFileSync(wishFile, 'utf-8');

  const timestamp = new Date().toISOString();
  const blockerEntry = `
**Blocker logged:** ${timestamp}
- **Type:** ${type}
- **Severity:** ${severity}
- **Description:** ${description}
${workaround ? `- **Workaround:** ${workaround}` : ''}
`;

  // Find blockers section or create it
  let updatedContent;
  if (content.includes('## 🚫 Blockers')) {
    // Append to existing blockers section
    updatedContent = content.replace(
      /(## 🚫 Blockers\n)/,
      `$1${blockerEntry}\n`
    );
  } else {
    // Create new blockers section before Lessons Learned
    const insertPoint = content.indexOf('## 📝 Lessons Learned');
    if (insertPoint !== -1) {
      updatedContent =
        content.slice(0, insertPoint) +
        `## 🚫 Blockers\n${blockerEntry}\n\n---\n\n` +
        content.slice(insertPoint);
    } else {
      // Append at end
      updatedContent = content + `\n\n## 🚫 Blockers\n${blockerEntry}\n`;
    }
  }

  fs.writeFileSync(wishFile, updatedContent, 'utf-8');
  console.log(`✅ Blocker logged to ${wishFile}`);
  console.log(`   Type: ${type} | Severity: ${severity}`);
}

// CLI execution
if (require.main === module) {
  try {
    const { wishSlug, description, type, severity, workaround } = parseArgs();

    if (!wishSlug || !description) {
      console.error('Usage: node log-blocker.js <wish-slug> <description> [options]');
      console.error('\nOptions:');
      console.error('  --type <type>         Blocker type (permission, dependency, unknown)');
      console.error('  --severity <level>    Severity (critical, high, medium, low)');
      console.error('  --workaround <text>   Known workaround if any');
      process.exit(1);
    }

    logBlocker(wishSlug, description, type, severity, workaround);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { logBlocker };

#!/usr/bin/env node

/**
 * log-blocker.js
 *
 * Purpose: Auto-log blockers to wish documents
 * Implements: blocker-protocol.md automated logging
 *
 * Blocker logging format:
 * 1. Timestamped entry in wish document
 * 2. Findings and status
 * 3. Update wish status log
 *
 * Usage: node log-blocker.js <wish-path> <blocker-description>
 * Output: Updated wish document with blocker entry
 */

const fs = require('fs');
const path = require('path');

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

function logBlocker(wishPath, blockerDescription) {
  if (!fs.existsSync(wishPath)) {
    throw new Error(`Wish file not found: ${wishPath}`);
  }

  const content = fs.readFileSync(wishPath, 'utf8');
  const timestamp = getTimestamp();

  // Create blocker entry
  const blockerEntry = `
## 🚫 Blockers

**${timestamp}**
${blockerDescription}

**Status:** Awaiting resolution
`;

  // Check if Blockers section exists
  if (content.includes('## 🚫 Blockers')) {
    // Append to existing blockers section
    const updated = content.replace(
      /(## 🚫 Blockers)/,
      `$1\n\n**${timestamp}**\n${blockerDescription}\n\n**Status:** Awaiting resolution\n`
    );
    fs.writeFileSync(wishPath, updated, 'utf8');
  } else {
    // Add new Blockers section before Lessons Learned or Success Criteria
    const insertBefore = content.match(/(## 📝 Lessons Learned|## 🎯 Success Criteria)/);

    if (insertBefore) {
      const updated = content.replace(
        insertBefore[0],
        `${blockerEntry}\n---\n\n${insertBefore[0]}`
      );
      fs.writeFileSync(wishPath, updated, 'utf8');
    } else {
      // Append at end if no suitable section found
      fs.writeFileSync(wishPath, content + '\n' + blockerEntry, 'utf8');
    }
  }

  return {
    success: true,
    timestamp,
    wish_path: wishPath,
    message: 'Blocker logged successfully',
  };
}

// CLI interface
if (require.main === module) {
  const [, , wishPath, ...descriptionParts] = process.argv;

  if (!wishPath || descriptionParts.length === 0) {
    console.error('Usage: node log-blocker.js <wish-path> <blocker-description>');
    console.error('Example: node log-blocker.js .genie/wishes/my-wish/my-wish.md "Permission denied on implementor"');
    process.exit(1);
  }

  const blockerDescription = descriptionParts.join(' ');

  try {
    const result = logBlocker(wishPath, blockerDescription);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { logBlocker };

#!/usr/bin/env node
/**
 * Track Promise
 *
 * Say-do gap detector. Tracks agent commitments and validates follow-through.
 * Integrates with execution-integrity-protocol.md for behavioral consistency.
 *
 * Usage:
 *   node track-promise.js log <session-id> <promise-description>
 *   node track-promise.js verify <session-id> <promise-id>
 *   node track-promise.js report <session-id>
 *
 * Example:
 *   node track-promise.js log abc123 "Create PR after implementation"
 *   node track-promise.js verify abc123 promise-1
 *   node track-promise.js report abc123
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROMISES_DIR = path.join(__dirname, '..', '.promises');

// Ensure promises directory exists
if (!fs.existsSync(PROMISES_DIR)) {
  fs.mkdirSync(PROMISES_DIR, { recursive: true });
}

function getPromiseFile(sessionId) {
  return path.join(PROMISES_DIR, `${sessionId}.json`);
}

function loadPromises(sessionId) {
  const file = getPromiseFile(sessionId);
  if (!fs.existsSync(file)) {
    return { sessionId, promises: [] };
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function savePromises(sessionId, data) {
  const file = getPromiseFile(sessionId);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function logPromise(sessionId, description) {
  console.log(`📝 Logging promise for session ${sessionId}\n`);

  const data = loadPromises(sessionId);
  const promiseId = `promise-${crypto.randomBytes(4).toString('hex')}`;

  const promise = {
    id: promiseId,
    description,
    timestamp: new Date().toISOString(),
    status: 'pending',
    verifiedAt: null,
  };

  data.promises.push(promise);
  savePromises(sessionId, data);

  console.log(`✅ Promise logged: ${promiseId}`);
  console.log(`   Description: ${description}`);
  console.log(`   Status: pending`);
}

function verifyPromise(sessionId, promiseId) {
  console.log(`✅ Verifying promise ${promiseId} for session ${sessionId}\n`);

  const data = loadPromises(sessionId);
  const promise = data.promises.find(p => p.id === promiseId);

  if (!promise) {
    console.error(`❌ Promise not found: ${promiseId}`);
    return;
  }

  promise.status = 'fulfilled';
  promise.verifiedAt = new Date().toISOString();
  savePromises(sessionId, data);

  console.log(`✅ Promise fulfilled: ${promise.description}`);
  console.log(`   Verified at: ${promise.verifiedAt}`);
}

function generateReport(sessionId) {
  console.log(`📊 Promise Report for Session ${sessionId}\n`);

  const data = loadPromises(sessionId);

  if (data.promises.length === 0) {
    console.log('No promises tracked');
    return;
  }

  const pending = data.promises.filter(p => p.status === 'pending');
  const fulfilled = data.promises.filter(p => p.status === 'fulfilled');

  console.log(`Total promises: ${data.promises.length}`);
  console.log(`Fulfilled: ${fulfilled.length} (${((fulfilled.length / data.promises.length) * 100).toFixed(0)}%)`);
  console.log(`Pending: ${pending.length}\n`);

  if (pending.length > 0) {
    console.log('⚠️  Pending promises:');
    pending.forEach((p, i) => {
      console.log(`${i + 1}. [${p.id}] ${p.description}`);
      console.log(`   Logged: ${p.timestamp}\n`);
    });
  }

  if (fulfilled.length > 0) {
    console.log('✅ Fulfilled promises:');
    fulfilled.forEach((p, i) => {
      console.log(`${i + 1}. [${p.id}] ${p.description}`);
      console.log(`   Verified: ${p.verifiedAt}\n`);
    });
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  const sessionId = process.argv[3];

  if (!command || !sessionId) {
    console.error('Usage:');
    console.error('  node track-promise.js log <session-id> <description>');
    console.error('  node track-promise.js verify <session-id> <promise-id>');
    console.error('  node track-promise.js report <session-id>');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'log':
        const description = process.argv.slice(4).join(' ');
        if (!description) {
          console.error('Description required for log command');
          process.exit(1);
        }
        logPromise(sessionId, description);
        break;

      case 'verify':
        const promiseId = process.argv[4];
        if (!promiseId) {
          console.error('Promise ID required for verify command');
          process.exit(1);
        }
        verifyPromise(sessionId, promiseId);
        break;

      case 'report':
        generateReport(sessionId);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { logPromise, verifyPromise, generateReport };

#!/usr/bin/env node

/**
 * Version Bump Script
 * Replaces the inline package.json scripts with a clean external implementation
 * Usage: node scripts/bump-version.js [patch|minor|major]
 */

const { bumpVersion } = require('../lib/utils/version-manager');

const main = async () => {
  const bumpType = process.argv[2];
  
  if (!bumpType || !['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('❌ Invalid bump type. Use: patch, minor, or major');
    process.exit(1);
  }
  
  await bumpVersion(bumpType);
};

main();
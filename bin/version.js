#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const colors = require('colors');

/**
 * Simple utility to check Genie version in current project
 */
async function checkGenieVersion() {
  const versionPath = path.join(process.cwd(), '.claude', 'genie-version.json');
  
  try {
    const versionData = JSON.parse(await fs.readFile(versionPath, 'utf-8'));
    
    console.log('🧞 Automagik Genie Version Information'.cyan.bold);
    console.log('═'.repeat(40).gray);
    console.log(`Version: ${versionData.version}`.green);
    console.log(`Installed: ${new Date(versionData.installedAt).toLocaleString()}`.yellow);
    console.log(`Last Updated: ${new Date(versionData.lastUpdated).toLocaleString()}`.yellow);
    console.log(`Platform: ${versionData.platform}`.blue);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('❌ No Genie installation found in current directory'.red);
      console.log('Run `npx automagik-genie init` to initialize Genie'.yellow);
    } else {
      console.log('❌ Error reading version information:'.red, error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  checkGenieVersion();
}

module.exports = { checkGenieVersion };
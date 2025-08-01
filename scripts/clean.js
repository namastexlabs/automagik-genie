#!/usr/bin/env node

/**
 * Clean Script
 * Removes build artifacts and temporary files
 */

const { execSync } = require('child_process');
const fs = require('fs');

const main = () => {
  console.log('🧹 Cleaning build artifacts...');
  
  try {
    // Check if dist directory exists before attempting to remove it
    if (fs.existsSync('dist/')) {
      execSync('rm -rf dist/');
      console.log('✅ Removed dist/ directory');
    } else {
      console.log('ℹ️  No dist/ directory to clean');
    }
    
    console.log('✅ Clean completed successfully');
  } catch (error) {
    console.error('❌ Clean failed:', error.message);
    process.exit(1);
  }
};

main();
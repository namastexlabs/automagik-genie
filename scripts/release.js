#!/usr/bin/env node

/**
 * Release Script
 * Handles git tagging and GitHub release creation
 */

const { execSync } = require('child_process');
const fs = require('fs');

const main = async () => {
  try {
    // Get current version
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = pkg.version;
    
    console.log(`🚀 Creating release for version ${version}...`);
    
    // Create git tag
    execSync(`git tag v${version}`, { stdio: 'inherit' });
    
    // Push commits and tags
    execSync('git push', { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });
    
    // Create GitHub release
    execSync(`gh release create v${version} --title "Release v${version}" --notes "Automated release v${version}"`, { stdio: 'inherit' });
    
    console.log(`✅ Released v${version} - GitHub Actions will publish to NPM`);
    
  } catch (error) {
    console.error('❌ Release failed:', error.message);
    process.exit(1);
  }
};

main();
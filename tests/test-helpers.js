/**
 * Test helper utilities for dynamic version handling
 */

const path = require('path');

/**
 * Get current package version for use in tests
 * @returns {string} Current package version
 */
function getCurrentVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const pkg = require(packagePath);
    return pkg.version;
  } catch {
    // Fallback to a reasonable default for testing
    return '0.0.0';
  }
}

module.exports = {
  getCurrentVersion
};
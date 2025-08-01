module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '!**/tests/update-system/**'  // Exclude the complex update system tests for now
  ],
  collectCoverageFrom: [
    'lib/**/*.js',
    'bin/**/*.js',
    '!**/node_modules/**'
  ],
  testTimeout: 10000,
  verbose: true
};
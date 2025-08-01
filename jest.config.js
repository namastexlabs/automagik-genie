module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'lib/**/*.js',
    'bin/**/*.js',
    '!**/node_modules/**'
  ],
  testTimeout: 30000,
  verbose: true,
  // Clear mocks between tests
  clearMocks: true,
  // Restore mocks after each test  
  restoreMocks: true
};
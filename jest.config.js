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
  restoreMocks: true,
  // Reset modules and timers between tests for better isolation
  resetModules: true,
  // Ensure fake timers are properly cleared
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
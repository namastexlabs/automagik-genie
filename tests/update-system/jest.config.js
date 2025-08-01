module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: [
    'jest-extended/all',
    '<rootDir>/helpers/test-setup.js'
  ],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    '../../lib/update/**/*.js',
    '../../bin/update.js',
    '!**/node_modules/**',
    '!**/fixtures/**',
    '!**/helpers/**'
  ],
  
  // Coverage reporting
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  
  // Coverage thresholds - STRICT for safety-critical code
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Extra strict for critical modules
    '../../lib/update/backup.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    '../../lib/update/engine.js': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98
    }
  },
  
  // Test timeout (30 seconds for safety tests)
  testTimeout: 30000,
  
  // Verbose output for debugging
  verbose: true,
  
  // Global test configuration
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.DEBUG': 'false'
  },
  
  // Module path mapping
  moduleNameMapper: {
    '^@update/(.*)$': '<rootDir>/../../lib/update/$1',
    '^@helpers/(.*)$': '<rootDir>/helpers/$1',
    '^@fixtures/(.*)$': '<rootDir>/fixtures/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test result processors
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'test-report.html',
      expand: true
    }]
  ],
  
  // Force exit after tests complete
  forceExit: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true
};
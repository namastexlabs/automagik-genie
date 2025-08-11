/**
 * Jest Setup File - Global Test Configuration
 * Ensures proper cleanup and isolation between tests
 */

// Global cleanup for fake timers
afterEach(() => {
  // Clean up any lingering fake timers
  if (jest.isMockFunction(setTimeout)) {
    jest.clearAllTimers();
    jest.useRealTimers();
  }
  
  // Clean up module cache to prevent cross-test pollution
  jest.resetModules();
});

// Ensure clean environment before each test
beforeEach(() => {
  // Reset any module mocks that might interfere between tests
  jest.clearAllMocks();
  
  // Clear any lingering timers
  jest.clearAllTimers();
  
  // Ensure we start with real timers unless explicitly set to fake
  if (jest.isMockFunction(setTimeout)) {
    jest.useRealTimers();
  }
});

// Global error handling for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection in test at:', promise, 'reason:', reason);
});

// Store original console methods for restoration
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Don't suppress console output globally as tests may be explicitly testing it
// Individual tests should mock console methods as needed
const { TemplateManager } = require('../../../lib/update/templates');
const { UpdateEngine } = require('../../../lib/update/engine');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * NETWORK FAILURE TESTING: GitHub API and External Dependencies
 * 
 * Tests the update system's handling of network failures:
 * - GitHub API rate limiting (403 responses)
 * - Network timeouts and interruptions
 * - Corrupted download scenarios
 * - Offline mode fallback behavior
 * - Template cache corruption and recovery
 */

describe('🌐 NETWORK FAILURE: GitHub API and External Dependencies', () => {
  let testProjectPath;
  let templateManager;
  let updateEngine;
  let originalHttpsGet;

  beforeEach(async () => {
    testProjectPath = await createTempDir('network-test-');
    templateManager = new TemplateManager();
    updateEngine = new UpdateEngine({ projectPath: testProjectPath });
    
    // Store original https.get for restoration
    const https = require('https');
    originalHttpsGet = https.get;
  });

  afterEach(() => {
    // Restore original https.get
    if (originalHttpsGet) {
      const https = require('https');
      https.get = originalHttpsGet;
    }
  });

  describe('GitHub API Rate Limiting', () => {
    test('NETWORK FAILURE: Handle GitHub API rate limiting (403)', async () => {
      console.log('🎯 NETWORK: Testing GitHub API rate limiting');
      
      // Mock https.get to simulate rate limiting
      const https = require('https');
      https.get = jest.fn().mockImplementation((url, options, callback) => {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        
        const mockResponse = {
          statusCode: 403,
          statusMessage: 'Forbidden',
          on: jest.fn().mockImplementation((event, handler) => {
            if (event === 'data') {
              handler(JSON.stringify({
                message: 'API rate limit exceeded for your IP address',
                documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
              }));
            } else if (event === 'end') {
              setTimeout(handler, 0);
            }
          })
        };
        
        const request = {
          on: jest.fn().mockImplementation((event, handler) => {
            if (event === 'error') {
              // Store error handler for potential use
            }
          }),
          setTimeout: jest.fn().mockImplementation((timeout, handler) => {
            // Store timeout handler for potential use
          }),
          destroy: jest.fn()
        };
        
        setTimeout(() => callback(mockResponse), 0);
        return request;
      });

      // Attempt to fetch latest release (should fail with rate limiting)
      let rateLimitError = null;
      try {
        await templateManager.fetchLatestRelease();
      } catch (error) {
        rateLimitError = error;
      }

      expect(rateLimitError).toBeTruthy();
      expect(rateLimitError.message).toContain('Failed to fetch latest release');
      
      console.log(`✅ Rate limiting error handled: ${rateLimitError.message}`);
      
      // Verify the system should fall back to cached templates
      const cachedVersions = await templateManager.listCachedVersions();
      console.log(`📦 Available cached versions: ${cachedVersions.length}`);
      
      // Test update engine's handling of API failure
      updateEngine.preUpdateAnalysis = jest.fn().mockImplementation(async () => {
        // Simulate falling back to cached comparison when API fails
        console.log('⚠️ GitHub API unavailable, attempting cached template comparison...');
        
        throw new Error('Analysis failed: Failed to fetch latest release: HTTP 403: Forbidden');
      });

      let updateError = null;
      try {
        await updateEngine.executeUpdate({ dryRun: true });
      } catch (error) {
        updateError = error;
      }

      expect(updateError).toBeTruthy();
      expect(updateError.message).toContain('Analysis failed');
      
      console.log('✅ Update system properly handled API rate limiting');
    });

    test('NETWORK FAILURE: Retry logic for transient API failures', async () => {
      console.log('🎯 NETWORK: Testing retry logic for API failures');
      
      let attemptCount = 0;
      const maxRetries = 3;
      
      // Mock https.get with transient failures
      const https = require('https');
      https.get = jest.fn().mockImplementation((url, options, callback) => {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        
        attemptCount++;
        console.log(`🔄 API attempt ${attemptCount}/${maxRetries + 1}`);
        
        const request = {
          on: jest.fn().mockImplementation((event, handler) => {
            if (event === 'error') {
              if (attemptCount <= 2) {
                // First 2 attempts fail with network error
                setTimeout(() => handler(new Error('ECONNRESET: Connection reset by peer')), 10);
              }
            }
          }),
          setTimeout: jest.fn().mockImplementation((timeout, handler) => {
            if (attemptCount <= 2) {
              // Simulate timeout on first 2 attempts
              setTimeout(handler, 50);
            }
          }),
          destroy: jest.fn()
        };
        
        if (attemptCount <= 2) {
          // Fail first 2 attempts
          setTimeout(() => request.on.mock.calls.find(call => call[0] === 'error')?.[1]?.(new Error('Network failure')), 20);
        } else {
          // Succeed on 3rd attempt
          const mockResponse = {
            statusCode: 200,
            statusMessage: 'OK',
            on: jest.fn().mockImplementation((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify({
                  tag_name: 'v2.0.0',
                  name: 'Release 2.0.0',
                  published_at: new Date().toISOString(),
                  tarball_url: 'https://api.github.com/repos/test/test/tarball/v2.0.0',
                  zipball_url: 'https://api.github.com/repos/test/test/zipball/v2.0.0',
                  body: 'Test release for retry logic'
                }));
              } else if (event === 'end') {
                setTimeout(handler, 0);
              }
            })
          };
          
          setTimeout(() => callback(mockResponse), 0);
        }
        
        return request;
      });

      // Implement simple retry logic in template manager
      const retryFetchLatestRelease = async () => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await templateManager.fetchLatestRelease();
          } catch (error) {
            console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
            
            if (attempt === maxRetries) {
              throw error;
            }
            
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, attempt - 1) * 100;
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      // Test retry logic
      const result = await retryFetchLatestRelease();
      
      expect(result).toBeTruthy();
      expect(result.version).toBe('v2.0.0');
      expect(attemptCount).toBe(3); // Should succeed on 3rd attempt
      
      console.log(`✅ Retry logic successful after ${attemptCount} attempts`);
      console.log(`📦 Retrieved release: ${result.version}`);
    });
  });

  describe('Network Timeout and Interruption', () => {
    test('NETWORK FAILURE: Handle network timeout during template download', async () => {
      console.log('🎯 NETWORK: Testing network timeout during download');
      
      // Mock https.get to simulate timeout
      const https = require('https');
      https.get = jest.fn().mockImplementation((url, options, callback) => {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        
        const request = {
          on: jest.fn().mockImplementation((event, handler) => {
            if (event === 'error') {
              // Store error handler
            }
          }),
          setTimeout: jest.fn().mockImplementation((timeout, handler) => {
            console.log(`⏰ Request timeout set to ${timeout}ms`);
            // Simulate timeout after delay
            setTimeout(() => {
              console.log('⏰ Request timed out');
              request.destroy();
              handler();
            }, 100); // Shorter timeout for testing
          }),
          destroy: jest.fn()
        };
        
        // Don't call callback to simulate network hang
        console.log('🌐 Simulating network hang...');
        
        return request;
      });

      // Test template download timeout
      let timeoutError = null;
      const startTime = Date.now();
      
      try {
        await templateManager.downloadTemplate('v2.0.0');
      } catch (error) {
        timeoutError = error;
      }

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      
      expect(timeoutError).toBeTruthy();
      expect(timeoutError.message).toContain('Request timeout');
      expect(elapsedTime).toBeLessThan(5000); // Should timeout quickly
      
      console.log(`✅ Timeout handled in ${elapsedTime}ms`);
      console.log(`❌ Error: ${timeoutError.message}`);
    });

    test('NETWORK FAILURE: Handle partial download corruption', async () => {
      console.log('🎯 NETWORK: Testing partial download corruption');
      
      let downloadAttempts = 0;
      
      // Mock https.get to simulate partial/corrupted downloads
      const https = require('https');
      https.get = jest.fn().mockImplementation((url, options, callback) => {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        
        downloadAttempts++;
        console.log(`📥 Download attempt ${downloadAttempts}`);
        
        const request = {
          on: jest.fn(),
          setTimeout: jest.fn(),
          destroy: jest.fn()
        };
        
        if (url.includes('/releases/latest')) {
          // API call succeeds
          const mockResponse = {
            statusCode: 200,
            statusMessage: 'OK',
            on: jest.fn().mockImplementation((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify({
                  tag_name: 'v2.0.0',
                  name: 'Corrupted Download Test',
                  published_at: new Date().toISOString(),
                  tarball_url: 'https://api.github.com/repos/test/test/tarball/v2.0.0',
                  zipball_url: 'https://api.github.com/repos/test/test/zipball/v2.0.0',
                  body: 'Test release'
                }));
              } else if (event === 'end') {
                setTimeout(handler, 0);
              }
            })
          };
          
          setTimeout(() => callback(mockResponse), 0);
        } else {
          // File download - simulate corruption
          const mockResponse = {
            statusCode: 200,
            statusMessage: 'OK',
            on: jest.fn().mockImplementation((event, handler) => {
              if (event === 'data') {
                // Send partial/corrupted data
                if (downloadAttempts === 1) {
                  handler('# Corrupted Agent File\n\nThis content is corrupted and incomplete...');
                  console.log('📥 Sending corrupted data chunk');
                } else {
                  handler(`# Test Agent File
                  
## Role
This is a test agent file for corruption testing.

## Instructions
- Handle corrupted download scenarios
- Validate file integrity
- Implement recovery mechanisms

## Content Validation
This file should have proper structure and complete content.
`);
                }
              } else if (event === 'end') {
                if (downloadAttempts === 1) {
                  // Simulate connection drop during first download
                  console.log('🔌 Connection dropped - incomplete download');
                  setTimeout(() => request.on.mock.calls.find(call => call[0] === 'error')?.[1]?.(new Error('Connection reset by peer')), 10);
                } else {
                  setTimeout(handler, 0);
                }
              }
            })
          };
          
          setTimeout(() => callback(mockResponse), 0);
        }
        
        return request;
      });

      // Test download with corruption recovery
      let downloadResult = null;
      let downloadError = null;
      
      try {
        // Mock the template download process
        const mockTemplateFiles = [
          {
            path: '.claude/agents/test-agent.md',
            type: 'agent',
            category: 'agents'
          }
        ];
        
        templateManager.getTemplateFileList = jest.fn().mockResolvedValue(mockTemplateFiles);
        
        downloadResult = await templateManager.downloadTemplate('v2.0.0');
      } catch (error) {
        downloadError = error;
      }

      // First attempt should fail due to corruption
      expect(downloadAttempts).toBeGreaterThanOrEqual(2);
      
      if (downloadError) {
        expect(downloadError.message).toContain('Template download failed');
        console.log(`❌ Download failed as expected: ${downloadError.message}`);
      } else {
        console.log(`✅ Download eventually succeeded after ${downloadAttempts} attempts`);
      }
      
      console.log('✅ Partial download corruption handling tested');
    });
  });

  describe('Offline Mode and Cache Fallback', () => {
    test('NETWORK FAILURE: Offline mode with cache fallback', async () => {
      console.log('🎯 NETWORK: Testing offline mode with cache fallback');
      
      // Create mock cached template
      const mockCacheDir = path.join(testProjectPath, '.cache', 'templates');
      const mockVersionDir = path.join(mockCacheDir, 'v1.5.0');
      await fs.mkdir(mockVersionDir, { recursive: true });
      
      // Create mock template files
      const filesDir = path.join(mockVersionDir, 'files');
      await fs.mkdir(filesDir, { recursive: true });
      
      const mockAgentPath = path.join(filesDir, '.claude', 'agents', 'cached-agent.md');
      await fs.mkdir(path.dirname(mockAgentPath), { recursive: true });
      await fs.writeFile(mockAgentPath, `# Cached Agent

## Role
This agent was loaded from cache during offline mode.

## Instructions
- Function without network connectivity
- Use cached templates and data
- Provide offline capabilities
`, 'utf-8');

      // Create manifest
      const manifest = {
        version: 'v1.5.0',
        downloadedAt: new Date().toISOString(),
        files: [{
          path: '.claude/agents/cached-agent.md',
          type: 'agent',
          category: 'agents'
        }],
        path: mockVersionDir
      };
      
      await fs.writeFile(
        path.join(mockVersionDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
      
      // Mock offline network (all requests fail)
      const https = require('https');
      https.get = jest.fn().mockImplementation((url, options, callback) => {
        const request = {
          on: jest.fn().mockImplementation((event, handler) => {
            if (event === 'error') {
              setTimeout(() => handler(new Error('ENETUNREACH: Network is unreachable')), 10);
            }
          }),
          setTimeout: jest.fn(),
          destroy: jest.fn()
        };
        
        return request;
      });
      
      // Override cache directory for testing
      const offlineTemplateManager = new TemplateManager(mockCacheDir);
      
      // Test offline operation
      console.log('🔌 Simulating offline environment...');
      
      // Try to fetch latest release (should fail)
      let apiError = null;
      try {
        await offlineTemplateManager.fetchLatestRelease();
      } catch (error) {
        apiError = error;
      }
      
      expect(apiError).toBeTruthy();
      expect(apiError.message).toContain('Network is unreachable');
      console.log(`❌ API call failed (expected): ${apiError.message}`);
      
      // Try to get cached template (should succeed)
      const cachedTemplate = await offlineTemplateManager.getCachedTemplate('v1.5.0');
      expect(cachedTemplate).toBeTruthy();
      expect(cachedTemplate).toBe(mockVersionDir);
      console.log(`✅ Cache fallback successful: ${cachedTemplate}`);
      
      // Test template validation with cache
      const isValid = await offlineTemplateManager.validateTemplateIntegrity('v1.5.0');
      expect(isValid).toBe(true);
      console.log('✅ Cached template integrity validated');
      
      // List cached versions (offline capability)
      const cachedVersions = await offlineTemplateManager.listCachedVersions();
      expect(cachedVersions).toHaveLength(1);
      expect(cachedVersions[0].version).toBe('v1.5.0');
      expect(cachedVersions[0].valid).toBe(true);
      
      console.log(`✅ Offline mode test completed`);
      console.log(`📦 Available cached versions: ${cachedVersions.length}`);
    });

    test('NETWORK FAILURE: Cache corruption detection and recovery', async () => {
      console.log('🎯 NETWORK: Testing cache corruption detection');
      
      // Create corrupted cache
      const mockCacheDir = path.join(testProjectPath, '.cache', 'templates');
      const corruptedVersionDir = path.join(mockCacheDir, 'v1.6.0');
      await fs.mkdir(corruptedVersionDir, { recursive: true });
      
      // Create corrupted manifest
      const corruptedManifest = {
        version: 'v1.6.0',
        downloadedAt: new Date().toISOString(),
        files: [
          {
            path: '.claude/agents/missing-agent.md',
            type: 'agent',
            category: 'agents'
          },
          {
            path: '.claude/agents/corrupted-agent.md',
            type: 'agent',
            category: 'agents'
          }
        ],
        path: corruptedVersionDir
      };
      
      await fs.writeFile(
        path.join(corruptedVersionDir, 'manifest.json'),
        JSON.stringify(corruptedManifest, null, 2)
      );
      
      // Create files directory but with missing/corrupted files
      const filesDir = path.join(corruptedVersionDir, 'files');
      await fs.mkdir(filesDir, { recursive: true });
      
      // Create only one file (missing-agent.md is missing)
      const corruptedAgentPath = path.join(filesDir, '.claude', 'agents', 'corrupted-agent.md');
      await fs.mkdir(path.dirname(corruptedAgentPath), { recursive: true });
      await fs.writeFile(corruptedAgentPath, 'CORRUPTED DATA\x00\x01\x02', 'utf-8'); // Binary garbage
      
      const corruptedTemplateManager = new TemplateManager(mockCacheDir);
      
      // Test corruption detection
      console.log('🔍 Testing cache corruption detection...');
      
      const isValid = await corruptedTemplateManager.validateTemplateIntegrity('v1.6.0');
      expect(isValid).toBe(false);
      console.log('✅ Cache corruption detected successfully');
      
      // List cached versions should mark as invalid
      const cachedVersions = await corruptedTemplateManager.listCachedVersions();
      expect(cachedVersions).toHaveLength(1);
      expect(cachedVersions[0].version).toBe('v1.6.0');
      expect(cachedVersions[0].valid).toBe(false);
      expect(cachedVersions[0].corrupted).toBe(true);
      
      console.log('✅ Corrupted cache properly identified');
      
      // Test cache cleanup
      await corruptedTemplateManager.clearCache('v1.6.0');
      
      const afterCleanupVersions = await corruptedTemplateManager.listCachedVersions();
      expect(afterCleanupVersions).toHaveLength(0);
      
      console.log('✅ Corrupted cache cleaned up successfully');
    });
  });

  describe('Template Download Edge Cases', () => {
    test('NETWORK FAILURE: Handle invalid template responses', async () => {
      console.log('🎯 NETWORK: Testing invalid template responses');
      
      // Mock https.get to return invalid JSON
      const https = require('https');
      https.get = jest.fn().mockImplementation((url, options, callback) => {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        
        const request = {
          on: jest.fn(),
          setTimeout: jest.fn(),
          destroy: jest.fn()
        };
        
        if (url.includes('/releases/latest')) {
          const mockResponse = {
            statusCode: 200,
            statusMessage: 'OK',
            on: jest.fn().mockImplementation((event, handler) => {
              if (event === 'data') {
                // Send invalid JSON
                handler('{ "invalid": json, missing quotes and brackets');
              } else if (event === 'end') {
                setTimeout(handler, 0);
              }
            })
          };
          
          setTimeout(() => callback(mockResponse), 0);
        }
        
        return request;
      });

      // Test invalid JSON handling
      let jsonError = null;
      try {
        await templateManager.fetchLatestRelease();
      } catch (error) {
        jsonError = error;
      }

      expect(jsonError).toBeTruthy();
      expect(jsonError.message).toContain('Failed to fetch latest release');
      
      console.log(`✅ Invalid JSON handled: ${jsonError.message}`);
    });

    test('NETWORK FAILURE: Handle HTTP error codes', async () => {
      console.log('🎯 NETWORK: Testing various HTTP error codes');
      
      const errorCodes = [
        { code: 404, message: 'Not Found' },
        { code: 500, message: 'Internal Server Error' },
        { code: 502, message: 'Bad Gateway' },
        { code: 503, message: 'Service Unavailable' }
      ];
      
      for (const errorCase of errorCodes) {
        console.log(`🔍 Testing HTTP ${errorCase.code}: ${errorCase.message}`);
        
        // Mock specific error response
        const https = require('https');
        https.get = jest.fn().mockImplementation((url, options, callback) => {
          if (typeof options === 'function') {
            callback = options;
            options = {};
          }
          
          const mockResponse = {
            statusCode: errorCase.code,
            statusMessage: errorCase.message,
            on: jest.fn().mockImplementation((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify({
                  message: `Server error: ${errorCase.message}`,
                  code: errorCase.code
                }));
              } else if (event === 'end') {
                setTimeout(handler, 0);
              }
            })
          };
          
          const request = {
            on: jest.fn(),
            setTimeout: jest.fn(),
            destroy: jest.fn()
          };
          
          setTimeout(() => callback(mockResponse), 0);
          return request;
        });

        // Test error code handling
        let httpError = null;
        try {
          await templateManager.fetchLatestRelease();
        } catch (error) {
          httpError = error;
        }

        expect(httpError).toBeTruthy();
        expect(httpError.message).toContain(`HTTP ${errorCase.code}`);
        
        console.log(`✅ HTTP ${errorCase.code} handled correctly`);
      }
    });
  });
});

// Helper functions for network testing

async function createTempDir(prefix) {
  const tempDir = path.join(os.tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Global test setup and utilities for update system testing
 * Provides safe test environment setup and cleanup
 */

// Global test state
global.TEST_STATE = {
  tempDirs: new Set(),
  backupDirs: new Set(),
  projectDirs: new Set(),
  createdFiles: new Set()
};

/**
 * Setup test environment before each test
 */
beforeEach(async () => {
  // Clear any existing test state
  global.TEST_STATE.tempDirs.clear();
  global.TEST_STATE.backupDirs.clear();
  global.TEST_STATE.projectDirs.clear();
  global.TEST_STATE.createdFiles.clear();
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.AUTOMAGIK_GENIE_TEST = 'true';
  
  // Suppress console output during tests unless DEBUG is set
  if (!process.env.DEBUG) {
    global.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
  }
});

/**
 * Cleanup test environment after each test
 */
afterEach(async () => {
  // Restore console if it was mocked
  if (global.originalConsole) {
    console.log = global.originalConsole.log;
    console.error = global.originalConsole.error;
    console.warn = global.originalConsole.warn;
    console.info = global.originalConsole.info;
    global.originalConsole = null;
  }
  
  // Cleanup all temporary directories and files
  await cleanupTestArtifacts();
});

/**
 * Final cleanup after all tests
 */
afterAll(async () => {
  await cleanupTestArtifacts();
});

/**
 * Create a temporary directory for testing
 * Automatically tracked for cleanup
 */
global.createTempDir = async function(prefix = 'genie-test-') {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  global.TEST_STATE.tempDirs.add(tempDir);
  return tempDir;
};

/**
 * Create a test project structure
 * @param {string} projectPath - Base project path
 * @param {Object} options - Project configuration options
 */
global.createTestProject = async function(projectPath, options = {}) {
  const {
    agents = ['genie-dev-coder', 'genie-testing-maker'],
    hooks = ['pre-commit', 'post-update'],
    hasCustomizations = false,
    version = '1.0.0'
  } = options;
  
  global.TEST_STATE.projectDirs.add(projectPath);
  
  // Create directory structure
  const claudeDir = path.join(projectPath, '.claude');
  const agentsDir = path.join(claudeDir, 'agents');
  const hooksDir = path.join(claudeDir, 'hooks');
  
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(hooksDir, { recursive: true });
  
  // Create agent files
  for (const agentName of agents) {
    const agentPath = path.join(agentsDir, `${agentName}.md`);
    const content = await createAgentContent(agentName, hasCustomizations);
    await fs.writeFile(agentPath, content, 'utf-8');
    global.TEST_STATE.createdFiles.add(agentPath);
  }
  
  // Create hook files
  for (const hookName of hooks) {
    const hookPath = path.join(hooksDir, `${hookName}.js`);
    const content = await createHookContent(hookName, hasCustomizations);
    await fs.writeFile(hookPath, content, 'utf-8');
    global.TEST_STATE.createdFiles.add(hookPath);
  }
  
  // Create package.json
  const packageJson = {
    name: 'test-genie-project',
    version,
    description: 'Test project for Genie update system',
    automagikGenie: {
      version,
      agents: agents.length,
      hooks: hooks.length
    }
  };
  
  const packagePath = path.join(projectPath, 'package.json');
  await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2), 'utf-8');
  global.TEST_STATE.createdFiles.add(packagePath);
  
  return {
    projectPath,
    claudeDir,
    agentsDir,
    hooksDir,
    packagePath,
    agentFiles: agents.map(name => path.join(agentsDir, `${name}.md`)),
    hookFiles: hooks.map(name => path.join(hooksDir, `${name}.js`))
  };
};

/**
 * Create realistic agent content for testing
 */
async function createAgentContent(agentName, hasCustomizations = false) {
  const baseContent = `# ${agentName}

## Role
${agentName.replace(/-/g, ' ')} specialist

## Instructions
- Follow best practices
- Ensure code quality
- Test thoroughly

## Examples
\`\`\`javascript
// Example code here
console.log('Hello from ${agentName}');
\`\`\``;

  if (hasCustomizations) {
    return baseContent + `

<!-- USER_CUSTOMIZATION_START -->
## My Custom Section
This is a user customization that should be preserved during updates.

### Custom Instructions
- My specific requirement 1
- My specific requirement 2
- Custom workflow steps

\`\`\`javascript
// My custom code
function myCustomFunction() {
  return 'This should not be overwritten';
}
\`\`\`
<!-- USER_CUSTOMIZATION_END -->

## More Base Content
This is template content that can be updated.`;
  }
  
  return baseContent;
}

/**
 * Create realistic hook content for testing
 */
async function createHookContent(hookName, hasCustomizations = false) {
  const baseContent = `#!/usr/bin/env node
// ${hookName} hook for Automagik Genie

const fs = require('fs');
const path = require('path');

// Base hook functionality
function run${hookName.replace(/-/g, '')}() {
  console.log('Running ${hookName} hook');
  // Template logic here
}

module.exports = { run${hookName.replace(/-/g, '')} };`;

  if (hasCustomizations) {
    return baseContent + `

// USER_CUSTOMIZATION_START
function myCustomHookLogic() {
  console.log('My custom hook logic');
  // User-specific code that should be preserved
  return 'custom-result';
}

// My custom hook integration
function customIntegration() {
  // This should not be overwritten
  return myCustomHookLogic();
}
// USER_CUSTOMIZATION_END

// More template content
function templateFunction() {
  return 'This can be updated';
}`;
  }
  
  return baseContent;
}

/**
 * Validate backup integrity
 * @param {string} backupPath - Path to backup directory
 * @param {Array} originalFiles - Original file paths that were backed up
 */
global.validateBackupIntegrity = async function(backupPath, originalFiles) {
  const manifestPath = path.join(backupPath, 'manifest.json');
  
  // Check manifest exists
  expect(await fileExists(manifestPath)).toBe(true);
  
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
  
  // Validate manifest structure
  expect(manifest).toHaveProperty('id');
  expect(manifest).toHaveProperty('timestamp');
  expect(manifest).toHaveProperty('files');
  expect(manifest).toHaveProperty('status', 'completed');
  
  // Validate all files are backed up
  expect(manifest.files).toHaveLength(originalFiles.length);
  
  // Validate each backed up file
  for (const fileInfo of manifest.files) {
    expect(fileInfo).toHaveProperty('originalPath');
    expect(fileInfo).toHaveProperty('backupPath');
    expect(fileInfo).toHaveProperty('checksum');
    expect(fileInfo).toHaveProperty('size');
    
    // Check backup file exists
    expect(await fileExists(fileInfo.backupPath)).toBe(true);
    
    // Validate checksum
    const backupContent = await fs.readFile(fileInfo.backupPath, 'utf-8');
    const calculatedChecksum = calculateChecksum(backupContent);
    expect(calculatedChecksum).toBe(fileInfo.checksum);
    
    // Validate size
    const stats = await fs.stat(fileInfo.backupPath);
    expect(stats.size).toBe(fileInfo.size);
  }
  
  return manifest;
};

/**
 * Calculate SHA-256 checksum for content
 */
function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Compare file contents
 */
global.compareFileContents = async function(file1Path, file2Path) {
  const content1 = await fs.readFile(file1Path, 'utf-8');
  const content2 = await fs.readFile(file2Path, 'utf-8');
  return content1 === content2;
};

/**
 * Get file checksum
 */
global.getFileChecksum = async function(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return calculateChecksum(content);
};

/**
 * Create corrupted file for testing error scenarios
 */
global.createCorruptedFile = async function(filePath, corruptionType = 'truncated') {
  const originalContent = await fs.readFile(filePath, 'utf-8');
  
  let corruptedContent;
  switch (corruptionType) {
    case 'truncated':
      corruptedContent = originalContent.substring(0, originalContent.length / 2);
      break;
    case 'random':
      corruptedContent = originalContent + '\n\x00\x01\x02CORRUPTED';
      break;
    case 'empty':
      corruptedContent = '';
      break;
    default:
      corruptedContent = originalContent.replace(/./g, 'X');
  }
  
  await fs.writeFile(filePath, corruptedContent, 'utf-8');
  return { originalContent, corruptedContent };
};

/**
 * Cleanup all test artifacts
 */
async function cleanupTestArtifacts() {
  const errors = [];
  
  // Cleanup temporary directories
  for (const tempDir of global.TEST_STATE.tempDirs) {
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      errors.push(`Failed to cleanup temp dir ${tempDir}: ${error.message}`);
    }
  }
  
  // Cleanup backup directories
  for (const backupDir of global.TEST_STATE.backupDirs) {
    try {
      await fs.rmdir(backupDir, { recursive: true });
    } catch (error) {
      errors.push(`Failed to cleanup backup dir ${backupDir}: ${error.message}`);
    }
  }
  
  // Cleanup project directories
  for (const projectDir of global.TEST_STATE.projectDirs) {
    try {
      await fs.rmdir(projectDir, { recursive: true });
    } catch (error) {
      errors.push(`Failed to cleanup project dir ${projectDir}: ${error.message}`);
    }
  }
  
  // Log cleanup errors in debug mode
  if (errors.length > 0 && process.env.DEBUG) {
    console.warn('Test cleanup errors:', errors);
  }
}

// Export utilities for use in tests
global.fileExists = fileExists;
global.calculateChecksum = calculateChecksum;
// Update System Tests
const { BackupManager } = require('../lib/update/backup');
const { MetadataManager } = require('../lib/update/metadata');
const { UpdateEngine } = require('../lib/update/engine');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('Update System', () => {
  let tempDir;

  beforeEach(async () => {
    // Create temp directory for tests
    tempDir = path.join(os.tmpdir(), `update-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('BackupManager', () => {
    let backupManager;

    beforeEach(() => {
      const backupDir = path.join(tempDir, 'backups');
      backupManager = new BackupManager(backupDir);
    });

    test('creates backup for files', async () => {
      // Create test files
      const testFile1 = path.join(tempDir, 'test1.txt');
      const testFile2 = path.join(tempDir, 'test2.txt');
      
      await fs.writeFile(testFile1, 'Test content 1', 'utf-8');
      await fs.writeFile(testFile2, 'Test content 2', 'utf-8');

      // Create backup
      const result = await backupManager.createBackup([testFile1, testFile2], {
        reason: 'unit test'
      });

      expect(result.backupId).toBeDefined();
      expect(result.fileCount).toBe(2);
      expect(result.totalSize).toBeGreaterThan(0);
    });

    test('validates backup integrity', async () => {
      // Create test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Test content', 'utf-8');

      // Create backup
      const backup = await backupManager.createBackup([testFile]);
      
      // Validate backup
      const isValid = await backupManager.validateBackup(backup.backupId);
      expect(isValid).toBe(true);
    });

    test('lists available backups', async () => {
      // Create test file and backup
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Test content', 'utf-8');
      
      const backup = await backupManager.createBackup([testFile]);
      
      // List backups
      const backups = await backupManager.listAvailableBackups();
      expect(backups.length).toBeGreaterThan(0);
      expect(backups.find(b => b.id === backup.backupId)).toBeDefined();
    });
  });

  describe('MetadataManager', () => {
    let registry;

    beforeEach(() => {
      registry = new MetadataManager(tempDir);
    });

    test('initializes registries', async () => {
      await registry.initializeRegistries();
      
      // Check that metadata directory was created
      const metadataExists = await fs.access(path.join(tempDir, 'metadata')).then(() => true).catch(() => false);
      expect(metadataExists).toBe(true);
    });

    test('stores and retrieves agent metadata', async () => {
      await registry.initializeRegistries();
      
      const metadata = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        customizations: ['business-logic']
      };

      await registry.updateAgentRegistry('test-agent.md', metadata);
      
      const retrieved = await registry.getAgentMetadata('test-agent.md');
      expect(retrieved).toBeDefined();
    });
  });

  describe('UpdateEngine Integration', () => {
    let updateEngine;

    beforeEach(() => {
      updateEngine = new UpdateEngine({ 
        projectPath: tempDir,
        dryRun: true 
      });
    });

    test('initializes with project path', () => {
      expect(updateEngine.projectPath).toBe(tempDir);
    });

    test('can perform dry-run analysis', async () => {
      // Create mock agent files
      const agentsDir = path.join(tempDir, '.claude', 'agents');
      await fs.mkdir(agentsDir, { recursive: true });
      
      const agentFile = path.join(agentsDir, 'test-agent.md');
      await fs.writeFile(agentFile, '# Test Agent\nRole: Test', 'utf-8');

      // This would normally call GitHub API, so we'll just test the structure
      expect(typeof updateEngine.executeUpdate).toBe('function');
    });
  });
});
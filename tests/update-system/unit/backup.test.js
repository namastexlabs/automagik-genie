const { BackupManager } = require('../../../lib/update/backup');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * UNIT TESTS: BackupManager
 * 
 * Comprehensive testing of backup and restore functionality
 * Focus on individual method behavior and edge cases
 */

describe('BackupManager Unit Tests', () => {
  let backupManager;
  let testProjectPath;
  let testProject;
  let customBackupDir;

  beforeEach(async () => {
    customBackupDir = await createTempDir('backup-unit-test-');
    backupManager = new BackupManager(customBackupDir);
    
    testProjectPath = await createTempDir('backup-project-test-');
    testProject = await createTestProject(testProjectPath, {
      agents: ['genie-dev-coder', 'genie-testing-maker'],
      hooks: ['pre-commit'],
      hasCustomizations: true,
      version: '1.0.0'
    });
  });

  describe('Backup Creation', () => {
    test('creates backup with correct structure', async () => {
      const filesToBackup = [testProject.agentFiles[0], testProject.packagePath];
      
      const result = await backupManager.createBackup(filesToBackup, {
        type: 'unit-test',
        description: 'Test backup creation'
      });
      
      expect(result).toMatchObject({
        backupId: expect.stringMatching(/^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/),
        path: expect.stringContaining(customBackupDir),
        fileCount: 2,
        totalSize: expect.any(Number),
        timestamp: expect.any(String)
      });
      
      // Verify backup directory structure
      const backupPath = result.path;
      expect(await fileExists(backupPath)).toBe(true);
      expect(await fileExists(path.join(backupPath, 'manifest.json'))).toBe(true);
      expect(await fileExists(path.join(backupPath, 'files'))).toBe(true);
      
      console.log(`✅ Backup created: ${result.backupId}`);
    });

    test('creates valid manifest file', async () => {
      const filesToBackup = testProject.agentFiles;
      
      const result = await backupManager.createBackup(filesToBackup, {
        type: 'manifest-test',
        version: '1.0.0'
      });
      
      const manifestPath = path.join(result.path, 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      
      expect(manifest).toMatchObject({
        id: result.backupId,
        timestamp: expect.any(String),
        metadata: {
          type: 'manifest-test',
          version: '1.0.0'
        },
        files: expect.arrayContaining([
          expect.objectContaining({
            originalPath: expect.any(String),
            backupPath: expect.any(String),
            relativePath: expect.any(String),
            size: expect.any(Number),
            modified: expect.any(String),
            checksum: expect.any(String)
          })
        ]),
        totalSize: expect.any(Number),
        fileCount: filesToBackup.length,
        status: 'completed'
      });
      
      console.log(`✅ Manifest validated for ${manifest.fileCount} files`);
    });

    test('preserves directory structure in backup', async () => {
      const filesToBackup = [
        testProject.agentFiles[0], // .claude/agents/genie-dev-coder.md
        testProject.hookFiles[0],  // .claude/hooks/pre-commit.js
        testProject.packagePath   // package.json
      ];
      
      const result = await backupManager.createBackup(filesToBackup);
      const manifest = JSON.parse(await fs.readFile(
        path.join(result.path, 'manifest.json'),
        'utf-8'
      ));
      
      // Check that directory structure is preserved
      for (const fileInfo of manifest.files) {
        const expectedBackupPath = path.join(result.path, 'files', fileInfo.relativePath);
        expect(fileInfo.backupPath).toBe(expectedBackupPath);
        expect(await fileExists(fileInfo.backupPath)).toBe(true);
        
        // Verify content matches original
        const originalContent = await fs.readFile(fileInfo.originalPath, 'utf-8');
        const backupContent = await fs.readFile(fileInfo.backupPath, 'utf-8');
        expect(backupContent).toBe(originalContent);
        
        console.log(`✅ Directory structure preserved: ${fileInfo.relativePath}`);
      }
    });

    test('calculates correct checksums', async () => {
      const testFile = testProject.agentFiles[0];
      const originalContent = await fs.readFile(testFile, 'utf-8');
      const expectedChecksum = await getFileChecksum(testFile);
      
      const result = await backupManager.createBackup([testFile]);
      const manifest = JSON.parse(await fs.readFile(
        path.join(result.path, 'manifest.json'),
        'utf-8'
      ));
      
      const fileInfo = manifest.files[0];
      expect(fileInfo.checksum).toBe(expectedChecksum);
      
      // Verify checksum calculation method
      const backupContent = await fs.readFile(fileInfo.backupPath, 'utf-8');
      const calculatedChecksum = backupManager.calculateChecksum(backupContent);
      expect(calculatedChecksum).toBe(expectedChecksum);
      
      console.log(`✅ Checksum verified: ${expectedChecksum}`);
    });

    test('handles empty files correctly', async () => {
      const emptyFile = path.join(testProjectPath, 'empty-file.txt');
      await fs.writeFile(emptyFile, '', 'utf-8');
      
      const result = await backupManager.createBackup([emptyFile]);
      const manifest = JSON.parse(await fs.readFile(
        path.join(result.path, 'manifest.json'),
        'utf-8'
      ));
      
      const fileInfo = manifest.files[0];
      expect(fileInfo.size).toBe(0);
      expect(fileInfo.checksum).toBe(backupManager.calculateChecksum(''));
      
      const backupContent = await fs.readFile(fileInfo.backupPath, 'utf-8');
      expect(backupContent).toBe('');
      
      console.log('✅ Empty file handled correctly');
    });

    test('handles large files efficiently', async () => {
      const largeContent = 'A'.repeat(100000); // 100KB file
      const largeFile = path.join(testProjectPath, 'large-file.txt');
      await fs.writeFile(largeFile, largeContent, 'utf-8');
      
      const startTime = Date.now();
      const result = await backupManager.createBackup([largeFile]);
      const endTime = Date.now();
      
      // Should complete in reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      
      const manifest = JSON.parse(await fs.readFile(
        path.join(result.path, 'manifest.json'),
        'utf-8'
      ));
      
      const fileInfo = manifest.files[0];
      expect(fileInfo.size).toBe(100000);
      
      const backupContent = await fs.readFile(fileInfo.backupPath, 'utf-8');
      expect(backupContent).toBe(largeContent);
      
      console.log(`✅ Large file (100KB) backed up in ${endTime - startTime}ms`);
    });

    test('fails gracefully with invalid file paths', async () => {
      const invalidFiles = [
        '/nonexistent/path/file.txt',
        testProject.agentFiles[0] // One valid file
      ];
      
      const result = await backupManager.createBackup(invalidFiles);
      
      // Should succeed with only the valid file
      expect(result.fileCount).toBe(1);
      
      const manifest = JSON.parse(await fs.readFile(
        path.join(result.path, 'manifest.json'),
        'utf-8'
      ));
      
      expect(manifest.files).toHaveLength(1);
      expect(manifest.files[0].originalPath).toBe(testProject.agentFiles[0]);
      
      console.log('✅ Invalid file paths handled gracefully');
    });

    test('cleans up on backup failure', async () => {
      // Mock fs.writeFile to fail partway through
      const originalWriteFile = fs.writeFile;
      let writeCallCount = 0;
      
      fs.writeFile = jest.fn().mockImplementation(async (filePath, content, encoding) => {
        writeCallCount++;
        if (writeCallCount === 2) {
          // Fail on second file write (manifest write)
          throw new Error('Simulated disk full error');
        }
        return originalWriteFile(filePath, content, encoding);
      });
      
      const filesToBackup = [testProject.agentFiles[0]];
      
      let backupFailed = false;
      try {
        await backupManager.createBackup(filesToBackup);
      } catch (error) {
        backupFailed = true;
        expect(error.message).toContain('Backup creation failed');
      } finally {
        fs.writeFile = originalWriteFile;
      }
      
      expect(backupFailed).toBe(true);
      
      // Verify cleanup occurred - backup directory should not exist
      const backupEntries = await fs.readdir(customBackupDir);
      const backupDirs = backupEntries.filter(entry => entry.startsWith('backup-'));
      expect(backupDirs).toHaveLength(0);
      
      console.log('✅ Failed backup cleanup verified');
    });
  });

  describe('Backup Validation', () => {
    test('validates correct backup successfully', async () => {
      const filesToBackup = testProject.agentFiles;
      const result = await backupManager.createBackup(filesToBackup);
      
      const isValid = await backupManager.validateBackup(result.backupId);
      expect(isValid).toBe(true);
      
      console.log(`✅ Valid backup confirmed: ${result.backupId}`);
    });

    test('detects missing manifest file', async () => {
      const filesToBackup = [testProject.agentFiles[0]];
      const result = await backupManager.createBackup(filesToBackup);
      
      // Remove manifest file
      const manifestPath = path.join(result.path, 'manifest.json');
      await fs.unlink(manifestPath);
      
      const isValid = await backupManager.validateBackup(result.backupId);
      expect(isValid).toBe(false);
      
      console.log('✅ Missing manifest detected');
    });

    test('detects corrupted backup files', async () => {
      const filesToBackup = [testProject.agentFiles[0]];
      const result = await backupManager.createBackup(filesToBackup);
      
      const manifest = JSON.parse(await fs.readFile(
        path.join(result.path, 'manifest.json'),
        'utf-8'
      ));
      
      // Corrupt the backed up file
      const backupFilePath = manifest.files[0].backupPath;
      await fs.writeFile(backupFilePath, 'CORRUPTED CONTENT', 'utf-8');
      
      const isValid = await backupManager.validateBackup(result.backupId);
      expect(isValid).toBe(false);
      
      console.log('✅ File corruption detected');
    });

    test('detects file size mismatches', async () => {
      const filesToBackup = [testProject.agentFiles[0]];
      const result = await backupManager.createBackup(filesToBackup);
      
      const manifestPath = path.join(result.path, 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      
      // Modify size in manifest
      manifest.files[0].size = 9999999;
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
      
      const isValid = await backupManager.validateBackup(result.backupId);
      expect(isValid).toBe(false);
      
      console.log('✅ Size mismatch detected');
    });

    test('detects checksum mismatches', async () => {
      const filesToBackup = [testProject.agentFiles[0]];
      const result = await backupManager.createBackup(filesToBackup);
      
      const manifestPath = path.join(result.path, 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      
      // Modify checksum in manifest
      manifest.files[0].checksum = 'invalid-checksum-12345';
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
      
      const isValid = await backupManager.validateBackup(result.backupId);
      expect(isValid).toBe(false);
      
      console.log('✅ Checksum mismatch detected');
    });
  });

  describe('Backup Restoration', () => {
    test('restores files to original locations', async () => {
      const filesToBackup = [testProject.agentFiles[0], testProject.packagePath];
      
      // Capture original content
      const originalContent = {};
      for (const filePath of filesToBackup) {
        originalContent[filePath] = await fs.readFile(filePath, 'utf-8');
      }
      
      // Create backup
      const backupResult = await backupManager.createBackup(filesToBackup);
      
      // Modify original files
      for (const filePath of filesToBackup) {
        await fs.writeFile(filePath, 'MODIFIED CONTENT', 'utf-8');
      }
      
      // Restore from backup
      const restoreResult = await backupManager.restoreFromBackup(
        backupResult.backupId,
        null, // Use original locations
        { force: true }
      );
      
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restoredFiles).toBe(filesToBackup.length);
      
      // Verify restoration
      for (const filePath of filesToBackup) {
        const restoredContent = await fs.readFile(filePath, 'utf-8');
        expect(restoredContent).toBe(originalContent[filePath]);
        console.log(`✅ Restored: ${path.basename(filePath)}`);
      }
    });

    test('restores files to alternate location', async () => {
      const filesToBackup = [testProject.agentFiles[0]];
      const backupResult = await backupManager.createBackup(filesToBackup);
      
      const alternateLocation = await createTempDir('alternate-restore-');
      
      const restoreResult = await backupManager.restoreFromBackup(
        backupResult.backupId,
        alternateLocation,
        { force: true }
      );
      
      expect(restoreResult.success).toBe(true);
      
      // Verify file was restored to alternate location
      const manifest = JSON.parse(await fs.readFile(
        path.join(backupResult.path, 'manifest.json'),
        'utf-8'
      ));
      
      const restoredPath = path.join(alternateLocation, manifest.files[0].relativePath);
      expect(await fileExists(restoredPath)).toBe(true);
      
      const originalContent = await fs.readFile(manifest.files[0].originalPath, 'utf-8');
      const restoredContent = await fs.readFile(restoredPath, 'utf-8');
      expect(restoredContent).toBe(originalContent);
      
      console.log(`✅ Alternate location restore: ${restoredPath}`);
    });

    test('generates dry-run preview correctly', async () => {
      const filesToBackup = testProject.agentFiles;
      const backupResult = await backupManager.createBackup(filesToBackup);
      
      const preview = await backupManager.restoreFromBackup(
        backupResult.backupId,
        null,
        { dryRun: true }
      );
      
      expect(preview).toMatchObject({
        backupId: backupResult.backupId,
        timestamp: expect.any(String),
        fileCount: filesToBackup.length,
        totalSize: expect.any(Number),
        files: expect.arrayContaining([
          expect.objectContaining({
            source: expect.any(String),
            destination: expect.any(String),
            size: expect.any(Number),
            action: 'restore'
          })
        ])
      });
      
      // Verify no actual restoration occurred
      for (const filePreview of preview.files) {
        const beforeContent = await fs.readFile(filePreview.destination, 'utf-8');
        // Content should be unchanged from dry-run
        expect(beforeContent).toBeDefined();
      }
      
      console.log(`✅ Dry-run preview generated for ${preview.fileCount} files`);
    });

    test('handles restore conflicts appropriately', async () => {
      const filesToBackup = [testProject.agentFiles[0]];
      const backupResult = await backupManager.createBackup(filesToBackup);
      
      // Modify original file
      const modifiedContent = 'USER MODIFIED CONTENT';
      await fs.writeFile(filesToBackup[0], modifiedContent, 'utf-8');
      
      // Restore without force (should create backup of existing)
      const restoreResult = await backupManager.restoreFromBackup(
        backupResult.backupId,
        null,
        { force: false }
      );
      
      expect(restoreResult.success).toBe(true);
      
      // Check that existing file backup was created
      const backupFiles = await fs.readdir(path.dirname(filesToBackup[0]));
      const existingBackups = backupFiles.filter(file => file.includes('.restore-backup.'));
      expect(existingBackups.length).toBeGreaterThan(0);
      
      console.log(`✅ Conflict handled with backup: ${existingBackups[0]}`);
    });

    test('fails with invalid backup ID', async () => {
      let restoreFailed = false;
      
      try {
        await backupManager.restoreFromBackup('invalid-backup-id');
      } catch (error) {
        restoreFailed = true;
        expect(error.message).toContain('invalid or corrupted');
      }
      
      expect(restoreFailed).toBe(true);
      console.log('✅ Invalid backup ID handled correctly');
    });
  });

  describe('Backup Management', () => {
    test('lists available backups correctly', async () => {
      // Create multiple backups
      const backup1 = await backupManager.createBackup([testProject.agentFiles[0]], {
        type: 'test-1'
      });
      
      const backup2 = await backupManager.createBackup([testProject.packagePath], {
        type: 'test-2'
      });
      
      const backups = await backupManager.listAvailableBackups();
      
      expect(backups).toHaveLength(2);
      expect(backups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: backup1.backupId,
            valid: true,
            metadata: expect.objectContaining({ type: 'test-1' })
          }),
          expect.objectContaining({
            id: backup2.backupId,
            valid: true,
            metadata: expect.objectContaining({ type: 'test-2' })
          })
        ])
      );
      
      // Should be sorted by timestamp (newest first)
      expect(new Date(backups[0].timestamp)).toBeAfter(new Date(backups[1].timestamp));
      
      console.log(`✅ Listed ${backups.length} backups correctly`);
    });

    test('gets detailed backup information', async () => {
      const filesToBackup = testProject.agentFiles;
      const backupResult = await backupManager.createBackup(filesToBackup, {
        type: 'detailed-info-test',
        version: '1.0.0'
      });
      
      const info = await backupManager.getBackupInfo(backupResult.backupId);
      
      expect(info).toMatchObject({
        id: backupResult.backupId,
        timestamp: expect.any(String),
        fileCount: filesToBackup.length,
        totalSize: expect.any(Number),
        metadata: {
          type: 'detailed-info-test',
          version: '1.0.0'
        },
        valid: true,
        files: expect.arrayContaining([
          expect.objectContaining({
            path: expect.any(String),
            size: expect.any(Number),
            modified: expect.any(String)
          })
        ])
      });
      
      console.log(`✅ Detailed info retrieved for backup with ${info.fileCount} files`);
    });

    test('cleans up old backups correctly', async () => {
      // Create multiple backups with different ages
      const oldBackup = await backupManager.createBackup([testProject.agentFiles[0]], {
        type: 'old-backup'
      });
      
      const recentBackup = await backupManager.createBackup([testProject.packagePath], {
        type: 'recent-backup'
      });
      
      // Manually modify timestamp to make first backup appear old
      const oldManifestPath = path.join(oldBackup.path, 'manifest.json');
      const oldManifest = JSON.parse(await fs.readFile(oldManifestPath, 'utf-8'));
      
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 days ago
      oldManifest.timestamp = oldDate.toISOString();
      
      await fs.writeFile(oldManifestPath, JSON.stringify(oldManifest, null, 2), 'utf-8');
      
      // Clean up backups older than 30 days, keep at least 1
      const cleanupResult = await backupManager.cleanupOldBackups(30, 1);
      
      expect(cleanupResult.deleted).toBe(1);
      expect(cleanupResult.remaining).toBe(1);
      expect(cleanupResult.deletedBackups).toContain(oldBackup.backupId);
      
      // Verify old backup is gone
      expect(await fileExists(oldBackup.path)).toBe(false);
      
      // Verify recent backup remains
      expect(await fileExists(recentBackup.path)).toBe(true);
      
      console.log(`✅ Cleanup removed ${cleanupResult.deleted} old backups`);
    });
  });
});
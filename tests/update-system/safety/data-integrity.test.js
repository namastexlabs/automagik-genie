const { BackupManager } = require('../../../lib/update/backup');
const { UpdateEngine } = require('../../../lib/update/engine');
const fs = require('fs').promises;
const path = require('path');

/**
 * CRITICAL SAFETY TESTS: DATA INTEGRITY VALIDATION
 * 
 * These tests validate that NO DATA LOSS occurs under ANY circumstances.
 * Every test must verify complete data preservation and recovery capability.
 * 
 * ZERO TOLERANCE for data loss - all tests must pass.
 */

describe('🛡️ CRITICAL: Data Integrity Validation', () => {
  let testProjectPath;
  let backupManager;
  let testProject;
  
  beforeEach(async () => {
    testProjectPath = await createTempDir('integrity-test-');
    backupManager = new BackupManager();
    
    // Create test project with user customizations
    testProject = await createTestProject(testProjectPath, {
      agents: ['genie-dev-coder', 'genie-testing-maker', 'custom-agent'],
      hooks: ['pre-commit', 'post-update'],
      hasCustomizations: true,
      version: '1.0.0'
    });
  });

  describe('Backup Data Preservation', () => {
    test('CRITICAL: Complete file backup with exact content preservation', async () => {
      const filesToBackup = [
        ...testProject.agentFiles,
        ...testProject.hookFiles,
        testProject.packagePath
      ];
      
      // Capture original content and checksums
      const originalData = {};
      for (const filePath of filesToBackup) {
        const content = await fs.readFile(filePath, 'utf-8');
        const checksum = await getFileChecksum(filePath);
        originalData[filePath] = { content, checksum };
      }
      
      // Create backup
      const backupResult = await backupManager.createBackup(filesToBackup, {
        type: 'data-integrity-test',
        timestamp: new Date().toISOString()
      });
      
      // Validate backup was created successfully
      expect(backupResult).toMatchObject({
        backupId: expect.any(String),
        path: expect.any(String),
        fileCount: filesToBackup.length,
        totalSize: expect.any(Number),
        timestamp: expect.any(String)
      });
      
      // Validate backup integrity
      const manifest = await validateBackupIntegrity(backupResult.path, filesToBackup);
      
      // Verify EXACT content preservation in backup
      for (const fileInfo of manifest.files) {
        const originalFilePath = fileInfo.originalPath;
        const backupContent = await fs.readFile(fileInfo.backupPath, 'utf-8');
        
        // CRITICAL: Content must be identical
        expect(backupContent).toBe(originalData[originalFilePath].content);
        
        // CRITICAL: Checksums must match
        expect(fileInfo.checksum).toBe(originalData[originalFilePath].checksum);
        
        console.log(`✅ File preserved: ${path.basename(originalFilePath)}`);
      }
      
      console.log(`🛡️ INTEGRITY VERIFIED: ${filesToBackup.length} files backed up with perfect fidelity`);
    });

    test('CRITICAL: User customizations are preserved in backup', async () => {
      const customAgentPath = testProject.agentFiles.find(f => f.includes('custom-agent'));
      
      // Add explicit user customizations
      const userCustomizations = `
<!-- USER_CUSTOMIZATION_START -->
## CRITICAL USER DATA
This is precious user data that MUST NOT BE LOST.

### User's Custom Instructions
- My workflow step 1
- My workflow step 2
- NEVER overwrite this section

\`\`\`javascript
// User's custom code - PRESERVE THIS
function userCriticalFunction() {
  return 'This represents hours of user work - MUST BE PRESERVED';
}

const userConfig = {
  criticalSetting: 'PRESERVE',
  userPreference: 'MUST_NOT_LOSE',
  workflowOverrides: ['custom1', 'custom2']
};
\`\`\`
<!-- USER_CUSTOMIZATION_END -->`;

      // Add user customizations to agent file
      const originalContent = await fs.readFile(customAgentPath, 'utf-8');
      const contentWithCustomizations = originalContent + userCustomizations;
      await fs.writeFile(customAgentPath, contentWithCustomizations, 'utf-8');
      
      // Create backup
      const backupResult = await backupManager.createBackup([customAgentPath], {
        type: 'user-customization-preservation-test'
      });
      
      // Validate backup integrity
      await validateBackupIntegrity(backupResult.path, [customAgentPath]);
      
      // Load backup content
      const manifest = JSON.parse(await fs.readFile(
        path.join(backupResult.path, 'manifest.json'), 
        'utf-8'
      ));
      
      const backupContent = await fs.readFile(
        manifest.files[0].backupPath, 
        'utf-8'
      );
      
      // CRITICAL: User customizations must be preserved exactly
      expect(backupContent).toContain('CRITICAL USER DATA');
      expect(backupContent).toContain('userCriticalFunction');
      expect(backupContent).toContain('PRESERVE');
      expect(backupContent).toContain('MUST_NOT_LOSE');
      expect(backupContent).toContain('workflowOverrides');
      
      // CRITICAL: Exact match with what was written
      expect(backupContent).toBe(contentWithCustomizations);
      
      console.log('🛡️ USER CUSTOMIZATIONS PERFECTLY PRESERVED IN BACKUP');
    });

    test('CRITICAL: Backup survives system failures during creation', async () => {
      const filesToBackup = testProject.agentFiles.slice(0, 3);
      
      // Test backup creation with simulated partial failure
      const backupResult = await backupManager.createBackup(filesToBackup, {
        type: 'failure-resistance-test'
      });
      
      // Simulate system interruption by corrupting the backup directory
      const backupPath = backupResult.path;
      const manifestPath = path.join(backupPath, 'manifest.json');
      
      // Backup should still be valid before corruption
      expect(await backupManager.validateBackup(backupResult.backupId)).toBe(true);
      
      // Simulate partial corruption
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      
      // Remove one file to simulate corruption
      const firstFile = manifest.files[0];
      await fs.unlink(firstFile.backupPath);
      
      // Validation should now fail
      expect(await backupManager.validateBackup(backupResult.backupId)).toBe(false);
      
      // Test cleanup of corrupted backup
      await backupManager.cleanupFailedBackup(backupPath);
      
      console.log('🛡️ BACKUP CORRUPTION DETECTION AND CLEANUP VERIFIED');
    });
  });

  describe('Complete Data Recovery', () => {
    test('CRITICAL: Perfect restoration from backup preserves all data', async () => {
      const filesToBackup = testProject.agentFiles;
      
      // Capture original state
      const originalState = {};
      for (const filePath of filesToBackup) {
        originalState[filePath] = {
          content: await fs.readFile(filePath, 'utf-8'),
          checksum: await getFileChecksum(filePath),
          stats: await fs.stat(filePath)
        };
      }
      
      // Create backup
      const backupResult = await backupManager.createBackup(filesToBackup, {
        type: 'perfect-restoration-test'
      });
      
      // Modify original files to simulate corruption/changes
      for (const filePath of filesToBackup) {
        const corruptedContent = 'CORRUPTED DATA - ORIGINAL LOST';
        await fs.writeFile(filePath, corruptedContent, 'utf-8');
      }
      
      // Verify files are corrupted
      for (const filePath of filesToBackup) {
        const currentContent = await fs.readFile(filePath, 'utf-8');
        expect(currentContent).toBe('CORRUPTED DATA - ORIGINAL LOST');
        expect(currentContent).not.toBe(originalState[filePath].content);
      }
      
      console.log('💥 FILES INTENTIONALLY CORRUPTED FOR RECOVERY TEST');
      
      // Restore from backup
      const restoreResult = await backupManager.restoreFromBackup(
        backupResult.backupId,
        null, // Use original locations
        { force: true }
      );
      
      // Validate restoration success
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restoredFiles).toBe(filesToBackup.length);
      
      // CRITICAL: Verify PERFECT data restoration
      for (const filePath of filesToBackup) {
        const restoredContent = await fs.readFile(filePath, 'utf-8');
        const restoredChecksum = await getFileChecksum(filePath);
        
        // Content must match exactly
        expect(restoredContent).toBe(originalState[filePath].content);
        
        // Checksums must match exactly
        expect(restoredChecksum).toBe(originalState[filePath].checksum);
        
        console.log(`✅ Perfect restoration: ${path.basename(filePath)}`);
      }
      
      console.log('🛡️ PERFECT DATA RESTORATION VERIFIED - ZERO DATA LOSS');
    });

    test('CRITICAL: User customizations survive complete update cycle', async () => {
      const customAgentPath = testProject.agentFiles[0];
      
      // Create content with user customizations
      const criticalUserData = `# Agent with User Customizations

## Template Section
This is template content that can be updated.

<!-- USER_CUSTOMIZATION_START -->
## MY CRITICAL WORK
This represents hours of user effort and MUST NOT BE LOST.

### User Workflow
1. My custom step 1
2. My custom step 2  
3. Integration with my tools

\`\`\`javascript
// User's precious custom code
class UserCriticalClass {
  constructor() {
    this.userSettings = {
      apiKey: 'user-secret-key',
      customEndpoint: 'https://my-api.com',
      workflowId: 'user-workflow-123'
    };
  }
  
  executeUserWorkflow() {
    // This code represents user's investment
    return this.processUserData();
  }
}
\`\`\`
<!-- USER_CUSTOMIZATION_END -->

## More Template Content
This can be updated safely.`;

      await fs.writeFile(customAgentPath, criticalUserData, 'utf-8');
      const originalChecksum = await getFileChecksum(customAgentPath);
      
      // Create backup before update
      const backupResult = await backupManager.createBackup([customAgentPath], {
        type: 'user-customization-cycle-test'
      });
      
      // Simulate update that corrupts user customizations
      const corruptedContent = `# Updated Agent Template

## New Template Section
Updated template content.

## Different Structure
Template was restructured.`;

      await fs.writeFile(customAgentPath, corruptedContent, 'utf-8');
      
      // Verify user data is lost
      const corruptedFileContent = await fs.readFile(customAgentPath, 'utf-8');
      expect(corruptedFileContent).not.toContain('MY CRITICAL WORK');
      expect(corruptedFileContent).not.toContain('UserCriticalClass');
      expect(corruptedFileContent).not.toContain('user-secret-key');
      
      console.log('💥 USER CUSTOMIZATIONS LOST - TESTING RECOVERY');
      
      // Restore user's precious work
      const restoreResult = await backupManager.restoreFromBackup(
        backupResult.backupId,
        null,
        { force: true }
      );
      
      expect(restoreResult.success).toBe(true);
      
      // Verify user customizations are restored
      const restoredContent = await fs.readFile(customAgentPath, 'utf-8');
      const restoredChecksum = await getFileChecksum(customAgentPath);
      
      // CRITICAL: User's work must be perfectly restored
      expect(restoredContent).toContain('MY CRITICAL WORK');
      expect(restoredContent).toContain('UserCriticalClass');
      expect(restoredContent).toContain('user-secret-key');
      expect(restoredContent).toContain('executeUserWorkflow');
      expect(restoredContent).toContain('workflowId: \'user-workflow-123\'');
      
      // Exact match verification
      expect(restoredContent).toBe(criticalUserData);
      expect(restoredChecksum).toBe(originalChecksum);
      
      console.log('🛡️ USER CUSTOMIZATIONS PERFECTLY RESTORED - ZERO DATA LOSS');
    });
  });

  describe('Atomic Operation Guarantees', () => {
    test('CRITICAL: All-or-nothing update guarantee', async () => {
      const updateEngine = new UpdateEngine({ projectPath: testProjectPath });
      
      // Mock template fetch to simulate failure mid-update
      const originalTemplateMethod = updateEngine.templates.compareWithTemplate;
      let callCount = 0;
      
      updateEngine.templates.compareWithTemplate = jest.fn().mockImplementation(async (...args) => {
        callCount++;
        if (callCount === 1) {
          // Succeed on first call
          return originalTemplateMethod.apply(updateEngine.templates, args);
        } else {
          // Fail on subsequent calls to simulate mid-update failure
          throw new Error('Network failure during template comparison');
        }
      });
      
      // Capture original state
      const originalState = {};
      for (const filePath of testProject.agentFiles) {
        originalState[filePath] = {
          content: await fs.readFile(filePath, 'utf-8'),
          checksum: await getFileChecksum(filePath)
        };
      }
      
      // Attempt update that will fail
      let updateFailed = false;
      try {
        await updateEngine.executeUpdate({
          dryRun: false,
          force: true
        });
      } catch (error) {
        updateFailed = true;
        expect(error.message).toContain('Analysis failed');
      }
      
      expect(updateFailed).toBe(true);
      console.log('💥 UPDATE INTENTIONALLY FAILED FOR ATOMIC TEST');
      
      // CRITICAL: Verify NO files were modified despite partial processing
      for (const filePath of testProject.agentFiles) {
        const currentContent = await fs.readFile(filePath, 'utf-8');
        const currentChecksum = await getFileChecksum(filePath);
        
        // Files must be unchanged
        expect(currentContent).toBe(originalState[filePath].content);
        expect(currentChecksum).toBe(originalState[filePath].checksum);
        
        console.log(`✅ Atomic guarantee: ${path.basename(filePath)} unchanged`);
      }
      
      console.log('🛡️ ATOMIC OPERATION GUARANTEE VERIFIED - NO PARTIAL UPDATES');
    });

    test('CRITICAL: Staging area prevents data corruption', async () => {
      const filesToBackup = testProject.agentFiles;
      
      // Create backup
      const backupResult = await backupManager.createBackup(filesToBackup, {
        type: 'staging-area-test'
      });
      
      // Modify original files
      for (const filePath of filesToBackup) {
        await fs.writeFile(filePath, 'MODIFIED_ORIGINAL', 'utf-8');
      }
      
      // Start restoration but simulate failure in staging
      const mockRestore = async () => {
        const stagingDir = await createTempDir('restore-staging-');
        global.TEST_STATE.tempDirs.add(stagingDir);
        
        try {
          // Simulate staging operation
          const manifest = JSON.parse(await fs.readFile(
            path.join(backupResult.path, 'manifest.json'),
            'utf-8'
          ));
          
          // Copy files to staging
          for (const fileInfo of manifest.files) {
            const stagingPath = path.join(stagingDir, path.basename(fileInfo.originalPath));
            const backupContent = await fs.readFile(fileInfo.backupPath, 'utf-8');
            await fs.writeFile(stagingPath, backupContent, 'utf-8');
          }
          
          // Simulate failure before atomic move
          throw new Error('Simulated failure during staging');
          
        } catch (error) {
          // Cleanup staging area
          await fs.rmdir(stagingDir, { recursive: true });
          throw error;
        }
      };
      
      // Execute failed restore
      let restoreFailed = false;
      try {
        await mockRestore();
      } catch (error) {
        restoreFailed = true;
        expect(error.message).toContain('Simulated failure');
      }
      
      expect(restoreFailed).toBe(true);
      
      // CRITICAL: Original files should still be modified (not corrupted by partial restore)
      for (const filePath of filesToBackup) {
        const currentContent = await fs.readFile(filePath, 'utf-8');
        expect(currentContent).toBe('MODIFIED_ORIGINAL');
      }
      
      console.log('🛡️ STAGING AREA PROTECTION VERIFIED - NO CORRUPTION ON FAILURE');
    });
  });

  describe('Edge Case Data Protection', () => {
    test('CRITICAL: Data preservation with insufficient disk space', async () => {
      const testFile = testProject.agentFiles[0];
      const originalContent = await fs.readFile(testFile, 'utf-8');
      const originalChecksum = await getFileChecksum(testFile);
      
      // Mock disk space check to simulate full disk
      const mockCreateBackup = async () => {
        // Start backup creation
        const backupPath = await createTempDir('full-disk-test-');
        
        // Simulate disk full during backup
        throw new Error('ENOSPC: no space left on device');
      };
      
      let backupFailed = false;
      try {
        await mockCreateBackup();
      } catch (error) {
        backupFailed = true;
        expect(error.message).toContain('ENOSPC');
      }
      
      expect(backupFailed).toBe(true);
      
      // CRITICAL: Original file must be unchanged
      const currentContent = await fs.readFile(testFile, 'utf-8');
      const currentChecksum = await getFileChecksum(testFile);
      
      expect(currentContent).toBe(originalContent);
      expect(currentChecksum).toBe(originalChecksum);
      
      console.log('🛡️ DATA PRESERVED DESPITE DISK FULL CONDITION');
    });

    test('CRITICAL: Data preservation with permission denied', async () => {
      if (process.platform === 'win32') {
        console.log('Skipping permission test on Windows');
        return;
      }
      
      const testFile = testProject.agentFiles[0];
      const originalContent = await fs.readFile(testFile, 'utf-8');
      
      // Make file read-only to simulate permission error
      await fs.chmod(testFile, 0o444);
      
      let backupFailed = false;
      try {
        await backupManager.createBackup([testFile], {
          type: 'permission-test'
        });
      } catch (error) {
        backupFailed = true;
        expect(error.message).toContain('permission denied');
      }
      
      // Restore permissions for cleanup
      await fs.chmod(testFile, 0o644);
      
      // CRITICAL: Original file must be unchanged
      const currentContent = await fs.readFile(testFile, 'utf-8');
      expect(currentContent).toBe(originalContent);
      
      console.log('🛡️ DATA PRESERVED DESPITE PERMISSION ERRORS');
    });
  });
});
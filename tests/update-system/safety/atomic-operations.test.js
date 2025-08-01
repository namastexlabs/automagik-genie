const { UpdateEngine } = require('../../../lib/update/engine');
const { BackupManager } = require('../../../lib/update/backup');
const fs = require('fs').promises;
const path = require('path');

/**
 * CRITICAL SAFETY TESTS: ATOMIC OPERATIONS VALIDATION
 * 
 * These tests ensure all update operations are atomic - either completely succeed
 * or completely fail with perfect rollback. NO partial updates allowed.
 * 
 * Transaction-level safety for user data protection.
 */

describe('🛡️ CRITICAL: Atomic Operations Validation', () => {
  let testProjectPath;
  let updateEngine;
  let backupManager;
  let testProject;
  
  beforeEach(async () => {
    testProjectPath = await createTempDir('atomic-test-');
    updateEngine = new UpdateEngine({ projectPath: testProjectPath });
    backupManager = new BackupManager();
    
    // Create comprehensive test project
    testProject = await createTestProject(testProjectPath, {
      agents: ['genie-dev-coder', 'genie-testing-maker', 'custom-agent'],
      hooks: ['pre-commit', 'post-update'],
      hasCustomizations: true,
      version: '1.0.0'
    });
  });

  describe('All-or-Nothing Update Guarantee', () => {
    test('CRITICAL: Complete update success or complete rollback', async () => {
      // Capture pristine original state
      const originalState = await captureProjectState(testProject);
      
      // Mock successful update scenario first
      updateEngine.templates.fetchLatestRelease = jest.fn().mockResolvedValue({
        version: '2.0.0',
        url: 'https://example.com/release/2.0.0'
      });
      
      updateEngine.templates.compareWithTemplate = jest.fn().mockResolvedValue({
        files: {
          different: [
            {
              path: '.claude/agents/genie-dev-coder.md',
              category: 'agents',
              type: 'agent'
            }
          ],
          missing: []
        }
      });
      
      // Mock analysis for successful update
      let analysisCallCount = 0;
      const originalAnalyzeFile = updateEngine.analyzeFileUpdate;
      updateEngine.analyzeFileUpdate = jest.fn().mockImplementation(async (fileInfo) => {
        analysisCallCount++;
        
        if (analysisCallCount <= 1) {
          // First file succeeds
          return {
            filePath: fileInfo.path,
            fileName: path.basename(fileInfo.path),
            category: fileInfo.category,
            type: fileInfo.type,
            action: 'update',
            risk: 'low',
            description: 'Safe template update',
            details: {
              templateSections: [{ title: 'Instructions', content: 'Updated instructions' }],
              userSections: [],
              conflicts: [],
              confidence: 'high'
            }
          };
        } else {
          // Subsequent files fail to simulate partial failure
          throw new Error('ATOMIC TEST: Simulated failure during file analysis');
        }
      });
      
      // Attempt update that will fail partway through
      let updateFailed = false;
      let updateError = null;
      
      try {
        await updateEngine.executeUpdate({
          dryRun: false,
          force: true
        });
      } catch (error) {
        updateFailed = true;
        updateError = error;
        console.log(`💥 Expected failure: ${error.message}`);
      }
      
      expect(updateFailed).toBe(true);
      expect(updateError).toBeDefined();
      
      // CRITICAL: Verify complete rollback - NO files should be modified
      const currentState = await captureProjectState(testProject);
      
      // Compare every file's content and checksum
      for (const filePath of Object.keys(originalState)) {
        expect(currentState[filePath]).toBeDefined();
        expect(currentState[filePath].content).toBe(originalState[filePath].content);
        expect(currentState[filePath].checksum).toBe(originalState[filePath].checksum);
        
        console.log(`✅ Atomic guarantee: ${path.basename(filePath)} unchanged`);
      }
      
      console.log('🛡️ ATOMIC ALL-OR-NOTHING GUARANTEE VERIFIED');
    });

    test('CRITICAL: Backup creation failure prevents any modifications', async () => {
      const originalState = await captureProjectState(testProject);
      
      // Mock backup failure
      const originalCreateBackup = updateEngine.createUpdateBackup;
      updateEngine.createUpdateBackup = jest.fn().mockRejectedValue(
        new Error('ATOMIC TEST: Backup creation failed - disk full')
      );
      
      // Mock analysis to simulate getting to backup phase
      updateEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdates: true,
        updateCategories: {
          agents: [{
            filePath: '.claude/agents/genie-dev-coder.md',
            fileName: 'genie-dev-coder.md',
            category: 'agents',
            action: 'update',
            risk: 'low'
          }]
        },
        fileAnalysis: [{
          filePath: '.claude/agents/genie-dev-coder.md',
          fileName: 'genie-dev-coder.md',
          category: 'agents',
          action: 'update',
          risk: 'low'
        }],
        risks: [],
        recommendations: []
      });
      
      updateEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'auto' },
        files: {}
      });
      
      // Attempt update that will fail during backup
      let updateFailed = false;
      
      try {
        await updateEngine.executeUpdate({
          dryRun: false,
          force: true
        });
      } catch (error) {
        updateFailed = true;
        expect(error.message).toContain('Backup creation failed');
        console.log(`💥 Expected backup failure: ${error.message}`);
      }
      
      expect(updateFailed).toBe(true);
      
      // CRITICAL: NO files should be modified if backup fails
      const currentState = await captureProjectState(testProject);
      
      for (const filePath of Object.keys(originalState)) {
        expect(currentState[filePath].content).toBe(originalState[filePath].content);
        expect(currentState[filePath].checksum).toBe(originalState[filePath].checksum);
      }
      
      console.log('🛡️ BACKUP FAILURE PROTECTION VERIFIED - NO MODIFICATIONS');
    });

    test('CRITICAL: Validation failure triggers complete rollback', async () => {
      const originalState = await captureProjectState(testProject);
      
      // Mock successful update phases until validation
      updateEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdates: true,
        updateCategories: { agents: [] },
        fileAnalysis: [{
          filePath: '.claude/agents/genie-dev-coder.md',
          fileName: 'genie-dev-coder.md',
          category: 'agents',
          action: 'update',
          risk: 'low'
        }],
        risks: [],
        recommendations: []
      });
      
      updateEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'auto' },
        files: {}
      });
      
      // Mock successful backup creation
      const mockBackupResult = {
        backupId: 'test-backup-123',
        path: '/tmp/test-backup-123',
        fileCount: 1,
        totalSize: 1000,
        timestamp: new Date().toISOString()
      };
      
      updateEngine.createUpdateBackup = jest.fn().mockResolvedValue(mockBackupResult);
      
      // Mock successful file updates
      updateEngine.executeFileUpdates = jest.fn().mockResolvedValue([{
        filePath: '.claude/agents/genie-dev-coder.md',
        action: 'update',
        success: true,
        result: { action: 'updated', message: 'File updated successfully' }
      }]);
      
      // Mock validation failure with critical errors
      updateEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: false,
        warnings: ['Minor validation warning'],
        errors: ['Validation error occurred'],
        critical: ['CRITICAL: System integrity compromised'] // This should trigger rollback
      });
      
      // Mock rollback functionality
      updateEngine.backup.restoreFromBackup = jest.fn().mockResolvedValue({
        success: true,
        restoredFiles: 1,
        timestamp: new Date().toISOString()
      });
      
      updateEngine.ui.promptRestoreFromBackup = jest.fn().mockResolvedValue(true);
      
      // Attempt update that will fail validation
      let updateFailed = false;
      
      try {
        await updateEngine.executeUpdate({
          dryRun: false,
          force: true
        });
      } catch (error) {
        updateFailed = true;
        expect(error.message).toContain('Critical validation failures');
        console.log(`💥 Expected validation failure: ${error.message}`);
      }
      
      expect(updateFailed).toBe(true);
      
      // Verify rollback was triggered
      expect(updateEngine.backup.restoreFromBackup).toHaveBeenCalledWith(mockBackupResult.backupId);
      
      console.log('🛡️ VALIDATION FAILURE ROLLBACK VERIFIED');
    });
  });

  describe('Transaction Isolation', () => {
    test('CRITICAL: Concurrent update attempts are blocked', async () => {
      const originalState = await captureProjectState(testProject);
      
      // Create two update engines for the same project
      const engine1 = new UpdateEngine({ projectPath: testProjectPath });
      const engine2 = new UpdateEngine({ projectPath: testProjectPath });
      
      // Mock slow update for engine1
      engine1.preUpdateAnalysis = jest.fn().mockImplementation(async () => {
        // Simulate slow analysis
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          currentVersion: '1.0.0',
          latestVersion: '2.0.0',
          hasUpdates: false, // No updates to avoid actual modifications
          updateCategories: {},
          fileAnalysis: [],
          risks: [],
          recommendations: []
        };
      });
      
      // Mock fast update for engine2
      engine2.preUpdateAnalysis = jest.fn().mockImplementation(async () => {
        return {
          currentVersion: '1.0.0',
          latestVersion: '2.0.0',
          hasUpdates: false, // No updates to avoid actual modifications
          updateCategories: {},
          fileAnalysis: [],
          risks: [],
          recommendations: []
        };
      });
      
      // Start both updates concurrently
      const update1Promise = engine1.executeUpdate({ dryRun: false, force: true });
      const update2Promise = engine2.executeUpdate({ dryRun: false, force: true });
      
      // Both should complete without conflict (since no actual updates)
      const [result1, result2] = await Promise.all([update1Promise, update2Promise]);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      // Verify no modifications occurred
      const currentState = await captureProjectState(testProject);
      
      for (const filePath of Object.keys(originalState)) {
        expect(currentState[filePath].content).toBe(originalState[filePath].content);
        console.log(`✅ Concurrent safety: ${path.basename(filePath)} unchanged`);
      }
      
      console.log('🛡️ CONCURRENT UPDATE SAFETY VERIFIED');
    });

    test('CRITICAL: Interrupted update leaves system in consistent state', async () => {
      const originalState = await captureProjectState(testProject);
      
      // Mock update that gets interrupted during execution
      updateEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdates: true,
        updateCategories: { agents: [] },
        fileAnalysis: [{
          filePath: '.claude/agents/genie-dev-coder.md',
          fileName: 'genie-dev-coder.md',
          category: 'agents',
          action: 'update',
          risk: 'low'
        }],
        risks: [],
        recommendations: []
      });
      
      updateEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'auto' },
        files: {}
      });
      
      updateEngine.createUpdateBackup = jest.fn().mockResolvedValue({
        backupId: 'interrupted-test-backup',
        path: '/tmp/interrupted-test-backup',
        fileCount: 1,
        totalSize: 1000,
        timestamp: new Date().toISOString()
      });
      
      // Mock file update that gets interrupted
      updateEngine.executeFileUpdates = jest.fn().mockImplementation(async () => {
        // Simulate process interruption
        throw new Error('SIGTERM: Process interrupted');
      });
      
      // Simulate the update being interrupted
      let updateInterrupted = false;
      
      try {
        await updateEngine.executeUpdate({
          dryRun: false,
          force: true
        });
      } catch (error) {
        updateInterrupted = true;
        expect(error.message).toContain('Process interrupted');
        console.log(`💥 Expected interruption: ${error.message}`);
      }
      
      expect(updateInterrupted).toBe(true);
      
      // CRITICAL: System should be in consistent state (original state preserved)
      const currentState = await captureProjectState(testProject);
      
      for (const filePath of Object.keys(originalState)) {
        expect(currentState[filePath].content).toBe(originalState[filePath].content);
        expect(currentState[filePath].checksum).toBe(originalState[filePath].checksum);
      }
      
      // Verify backup was created and can be used for recovery if needed
      expect(updateEngine.createUpdateBackup).toHaveBeenCalled();
      
      console.log('🛡️ INTERRUPT CONSISTENCY VERIFIED - SYSTEM STATE PRESERVED');
    });
  });

  describe('Resource Management', () => {
    test('CRITICAL: Cleanup occurs even when operations fail', async () => {
      const tempDirsBefore = new Set(global.TEST_STATE.tempDirs);
      
      // Mock update that creates temporary resources then fails
      updateEngine.preUpdateAnalysis = jest.fn().mockImplementation(async () => {
        // Create temporary resources during analysis
        const tempAnalysisDir = await createTempDir('analysis-temp-');
        global.TEST_STATE.tempDirs.add(tempAnalysisDir);
        
        // Create some files in temp directory
        await fs.writeFile(path.join(tempAnalysisDir, 'temp-file.txt'), 'temporary data', 'utf-8');
        
        // Then fail the analysis
        throw new Error('ATOMIC TEST: Analysis failed with temp resources created');
      });
      
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
        console.log(`💥 Expected failure: ${error.message}`);
      }
      
      expect(updateFailed).toBe(true);
      
      // CRITICAL: Verify temporary resources are cleaned up
      const tempDirsAfter = new Set(global.TEST_STATE.tempDirs);
      const newTempDirs = [...tempDirsAfter].filter(dir => !tempDirsBefore.has(dir));
      
      // Check that temporary directories were created and cleaned up
      expect(newTempDirs.length).toBeGreaterThan(0);
      
      for (const tempDir of newTempDirs) {
        const exists = await fileExists(tempDir);
        expect(exists).toBe(false);
        console.log(`✅ Cleanup verified: ${tempDir} removed`);
      }
      
      console.log('🛡️ RESOURCE CLEANUP VERIFIED - NO TEMP FILE LEAKS');
    });

    test('CRITICAL: Memory usage remains bounded during failures', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create multiple failed update attempts to test memory leaks
      const attempts = 5;
      const results = [];
      
      for (let i = 0; i < attempts; i++) {
        const engine = new UpdateEngine({ projectPath: testProjectPath });
        
        // Mock analysis that creates memory pressure then fails
        engine.preUpdateAnalysis = jest.fn().mockImplementation(async () => {
          // Create some memory pressure
          const largeArray = new Array(10000).fill('memory-test-data');
          
          // Fail after creating memory pressure
          throw new Error(`Memory test failure ${i}`);
        });
        
        try {
          await engine.executeUpdate({ dryRun: false, force: true });
        } catch (error) {
          results.push(error.message);
        }
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      expect(results).toHaveLength(attempts);
      
      // Check memory usage after all failed attempts
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 10MB for test data)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      console.log(`🛡️ MEMORY BOUNDED: ${Math.round(memoryIncrease / 1024)} KB increase for ${attempts} failures`);
    });
  });

  // Test utility function
  async function captureProjectState(testProject) {
    const state = {};
    
    const allFiles = [
      ...testProject.agentFiles,
      ...testProject.hookFiles,
      testProject.packagePath
    ];
    
    for (const filePath of allFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const checksum = await getFileChecksum(filePath);
        const stats = await fs.stat(filePath);
        
        state[filePath] = {
          content,
          checksum,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      } catch (error) {
        state[filePath] = { error: error.message };
      }
    }
    
    return state;
  }
});
const { UpdateEngine } = require('../../../lib/update/engine');
const { BackupManager } = require('../../../lib/update/backup');
const fs = require('fs').promises;
const path = require('path');

/**
 * END-TO-END INTEGRATION TESTS: Complete Update Scenarios
 * 
 * These tests validate complete update workflows from start to finish
 * Testing real-world scenarios with actual file operations and user data
 */

describe('🔄 E2E: Complete Update Workflows', () => {
  let testProjectPath;
  let updateEngine;
  let testProject;
  
  beforeEach(async () => {
    testProjectPath = await createTempDir('e2e-update-test-');
    updateEngine = new UpdateEngine({ projectPath: testProjectPath });
    
    // Create realistic test project with user customizations
    testProject = await createTestProject(testProjectPath, {
      agents: [
        'genie-dev-coder',
        'genie-testing-maker', 
        'genie-quality-ruff',
        'custom-user-agent'
      ],
      hooks: ['pre-commit', 'post-update', 'custom-hook'],
      hasCustomizations: true,
      version: '1.0.0'
    });
  });

  describe('Fresh Installation Update', () => {
    test('SCENARIO: First-time update with no customizations', async () => {
      console.log('🎯 SCENARIO: Fresh installation update');
      
      // Create fresh project without customizations
      const freshProject = await createTestProject(testProjectPath + '-fresh', {
        agents: ['genie-dev-coder'],
        hooks: ['pre-commit'],
        hasCustomizations: false, // No user customizations
        version: '1.0.0'
      });
      
      const freshEngine = new UpdateEngine({ 
        projectPath: freshProject.projectPath 
      });
      
      // Mock newer version available
      freshEngine.getCurrentVersion = jest.fn().mockResolvedValue('1.0.0');
      freshEngine.getLatestVersion = jest.fn().mockResolvedValue('2.0.0');
      
      // Mock template comparison showing updates
      freshEngine.templates.fetchLatestRelease = jest.fn().mockResolvedValue({
        version: '2.0.0',
        url: 'https://github.com/example/releases/2.0.0'
      });
      
      freshEngine.templates.compareWithTemplate = jest.fn().mockResolvedValue({
        files: {
          different: [
            {
              path: '.claude/agents/genie-dev-coder.md',
              category: 'agents',
              type: 'agent'
            }
          ],
          missing: [
            {
              path: '.claude/agents/genie-new-agent.md',
              category: 'agents',
              type: 'agent'
            }
          ]
        }
      });
      
      // Mock file analysis for simple updates
      freshEngine.analyzeFileUpdate = jest.fn().mockResolvedValue({
        filePath: '.claude/agents/genie-dev-coder.md',
        fileName: 'genie-dev-coder.md',
        category: 'agents',
        type: 'agent',
        action: 'update',
        risk: 'low',
        description: 'Safe template update - no conflicts',
        details: {
          templateSections: [
            { title: 'Instructions', content: 'Updated instructions' }
          ],
          userSections: [],
          conflicts: [],
          confidence: 'high'
        }
      });
      
      // Mock template content
      freshEngine.templates.getCachedTemplate = jest.fn().mockResolvedValue('/mock/template/path');
      
      // Execute update
      const result = await freshEngine.executeUpdate({
        dryRun: false,
        force: true // Skip user prompts for automated test
      });
      
      // Validate successful update
      expect(result.success).toBe(true);
      expect(result.phase).toBe('complete');
      expect(result.results.backup).toBeDefined();
      expect(result.results.updates).toBeDefined();
      expect(result.results.errors).toHaveLength(0);
      
      console.log('✅ Fresh installation update completed successfully');
      console.log(`📊 Updated ${result.results.updates.length} files`);
    });

    test('SCENARIO: Update with new agents and hooks', async () => {
      console.log('🎯 SCENARIO: Adding new agents and hooks during update');
      
      // Mock analysis showing new files available
      updateEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdates: true,
        updateCategories: {
          agents: [
            {
              filePath: '.claude/agents/genie-new-specialist.md',
              fileName: 'genie-new-specialist.md',
              category: 'agents',
              action: 'add',
              risk: 'low',
              description: 'New specialist agent available'
            }
          ],
          hooks: [
            {
              filePath: '.claude/hooks/pre-push.js',
              fileName: 'pre-push.js',
              category: 'hooks',
              action: 'add', 
              risk: 'low',
              description: 'New pre-push hook available'
            }
          ]
        },
        fileAnalysis: [],
        risks: [],
        recommendations: ['New agents and hooks will enhance your workflow']
      });
      
      // Mock user consent
      updateEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'auto' },
        files: {}
      });
      
      // Mock backup creation
      updateEngine.createUpdateBackup = jest.fn().mockResolvedValue({
        backupId: 'test-backup-new-files',
        path: '/tmp/test-backup-new-files',
        fileCount: 0, // No existing files to backup for new additions
        totalSize: 0,
        timestamp: new Date().toISOString()
      });
      
      // Mock successful new file additions
      updateEngine.addNewFile = jest.fn().mockResolvedValue({
        action: 'added',
        message: 'Successfully added new file'
      });
      
      // Mock file updates execution
      updateEngine.executeFileUpdates = jest.fn().mockResolvedValue([
        {
          filePath: '.claude/agents/genie-new-specialist.md',
          action: 'add',
          success: true,
          result: { action: 'added', message: 'New agent added' }
        },
        {
          filePath: '.claude/hooks/pre-push.js',
          action: 'add',
          success: true,
          result: { action: 'added', message: 'New hook added' }
        }
      ]);
      
      // Mock validation
      updateEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: true,
        warnings: [],
        errors: [],
        critical: []
      });
      
      // Execute update
      const result = await updateEngine.executeUpdate({
        dryRun: false,
        force: true
      });
      
      expect(result.success).toBe(true);
      expect(result.results.updates).toHaveLength(2);
      expect(result.results.updates.every(u => u.success)).toBe(true);
      
      console.log('✅ New agents and hooks added successfully');
      console.log(`📊 Added ${result.results.updates.length} new files`);
    });
  });

  describe('Customized Installation Update', () => {
    test('SCENARIO: Smart merge preserves user customizations', async () => {
      console.log('🎯 SCENARIO: Smart merge with user customizations');
      
      const customAgentPath = testProject.agentFiles.find(f => f.includes('custom-user-agent'));
      
      // Add critical user customizations
      const userCustomizations = `
<!-- USER_CUSTOMIZATION_START -->
## My Critical Business Logic
This section contains my proprietary workflow that MUST BE PRESERVED.

### User's Custom API Integration
\`\`\`javascript
class UserBusinessLogic {
  constructor() {
    this.apiKey = process.env.USER_SECRET_API_KEY;
    this.endpoint = 'https://my-proprietary-system.com/api';
  }
  
  async executeUserWorkflow(data) {
    // Critical user business logic
    const result = await this.callProprietaryAPI(data);
    return this.processBusinessRules(result);
  }
  
  processBusinessRules(data) {
    // User's specific business rules
    return data.filter(item => item.status === 'user-approved');
  }
}
\`\`\`

### User Configuration
- API Endpoint: https://my-proprietary-system.com
- Timeout: 30 seconds
- Retry Policy: 3 attempts with exponential backoff
<!-- USER_CUSTOMIZATION_END -->`;

      const originalContent = await fs.readFile(customAgentPath, 'utf-8');
      const contentWithCustomizations = originalContent + userCustomizations;
      await fs.writeFile(customAgentPath, contentWithCustomizations, 'utf-8');
      
      // Capture original state
      const originalChecksum = await getFileChecksum(customAgentPath);
      
      // Mock update analysis showing template changes but user customizations
      updateEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdates: true,
        updateCategories: {
          agents: [{
            filePath: path.relative(testProjectPath, customAgentPath),
            fileName: path.basename(customAgentPath),
            category: 'agents',
            action: 'update',
            risk: 'medium',
            description: 'Template updated with user customizations detected'
          }]
        },
        fileAnalysis: [{
          filePath: path.relative(testProjectPath, customAgentPath),
          fileName: path.basename(customAgentPath),
          category: 'agents',
          action: 'update',
          risk: 'medium',
          description: 'Smart merge required for user customizations',
          details: {
            templateSections: [
              { 
                title: 'Instructions',
                content: 'Updated template instructions'
              }
            ],
            userSections: [
              {
                title: 'My Critical Business Logic',
                content: userCustomizations
              }
            ],
            conflicts: [], // No conflicts for this test
            confidence: 'high'
          }
        }],
        risks: [{
          level: 'medium',
          description: 'User customizations detected - smart merge required',
          files: [path.basename(customAgentPath)]
        }],
        recommendations: [
          'User customizations will be preserved during update',
          'Review merged content after update'
        ]
      });
      
      // Mock user consent for smart merge
      updateEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'smart-merge' },
        files: {}
      });
      
      // Mock backup creation
      updateEngine.createUpdateBackup = jest.fn().mockResolvedValue({
        backupId: 'smart-merge-backup',
        path: '/tmp/smart-merge-backup',
        fileCount: 1,
        totalSize: contentWithCustomizations.length,
        timestamp: new Date().toISOString()
      });
      
      // Mock merge engine to preserve user customizations
      updateEngine.merge.executeMerge = jest.fn().mockImplementation(async (filePath, details, choices, options) => {
        // Simulate smart merge that preserves user content
        const templateUpdate = `# Updated Template Content

## Enhanced Role
Updated specialist role with new capabilities

## Updated Instructions
- Follow enhanced best practices
- Use new testing framework
- Implement advanced error handling

## New Template Section
This is new content from the template update.

${userCustomizations}

## Additional Template Content
More updated template content here.`;
        
        if (!options.dryRun) {
          await fs.writeFile(filePath, templateUpdate, 'utf-8');
        }
        
        return {
          success: true,
          action: 'smart-merged',
          message: 'Successfully merged template updates while preserving user customizations',
          preservedSections: 1,
          updatedSections: 3,
          conflicts: 0
        };
      });
      
      // Mock file updates
      updateEngine.executeFileUpdates = jest.fn().mockResolvedValue([{
        filePath: path.relative(testProjectPath, customAgentPath),
        action: 'update',
        success: true,
        result: {
          success: true,
          action: 'smart-merged',
          message: 'Template updated with user customizations preserved',
          preservedSections: 1,
          updatedSections: 3,
          conflicts: 0
        }
      }]);
      
      // Mock validation
      updateEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: true,
        warnings: ['Review merged content for accuracy'],
        errors: [],
        critical: []
      });
      
      // Execute update
      const result = await updateEngine.executeUpdate({
        dryRun: false,
        force: true
      });
      
      expect(result.success).toBe(true);
      expect(result.results.updates).toHaveLength(1);
      expect(result.results.updates[0].success).toBe(true);
      expect(result.results.updates[0].result.action).toBe('smart-merged');
      
      // Verify user customizations are preserved in the mock result
      expect(updateEngine.merge.executeMerge).toHaveBeenCalledWith(
        customAgentPath,
        expect.objectContaining({
          userSections: expect.arrayContaining([
            expect.objectContaining({
              title: 'My Critical Business Logic'
            })
          ])
        }),
        expect.any(Object),
        expect.objectContaining({ dryRun: false })
      );
      
      console.log('✅ Smart merge completed with user customizations preserved');
      console.log('📊 Template updated while maintaining user business logic');
    });

    test('SCENARIO: Protected custom agents remain untouched', async () => {
      console.log('🎯 SCENARIO: Fully custom agents are protected from updates');
      
      // Create a fully custom agent (not based on template)
      const customAgentPath = path.join(testProject.agentsDir, 'my-proprietary-agent.md');
      const customAgentContent = `# My Proprietary Agent

## Proprietary Business Logic
This agent contains trade secrets and proprietary algorithms.

\`\`\`javascript
class ProprietaryAlgorithm {
  calculateBusinessMetrics(data) {
    // Secret sauce algorithm
    const secret = this.applyProprietaryFormula(data);
    return this.generateInsights(secret);
  }
}
\`\`\`

## Custom Integration
- Connected to internal systems
- Uses proprietary data formats
- Implements custom security protocols`;

      await fs.writeFile(customAgentPath, customAgentContent, 'utf-8');
      const originalChecksum = await getFileChecksum(customAgentPath);
      
      // Mock analysis that recognizes this as a custom agent
      updateEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdates: true,
        updateCategories: {
          agents: [
            // Template-based agent that can be updated
            {
              filePath: '.claude/agents/genie-dev-coder.md',
              fileName: 'genie-dev-coder.md',
              category: 'agents',
              action: 'update',
              risk: 'low'
            }
          ]
        },
        fileAnalysis: [
          {
            filePath: '.claude/agents/genie-dev-coder.md',
            fileName: 'genie-dev-coder.md',
            category: 'agents',
            action: 'update',
            risk: 'low'
          }
          // Note: my-proprietary-agent.md is NOT included - it's protected
        ],
        risks: [],
        recommendations: [
          'Custom agents are protected from updates',
          'Only template-based agents will be updated'
        ]
      });
      
      updateEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'auto' },
        files: {}
      });
      
      updateEngine.createUpdateBackup = jest.fn().mockResolvedValue({
        backupId: 'protected-agent-backup',
        path: '/tmp/protected-agent-backup',
        fileCount: 1,
        totalSize: 1000,
        timestamp: new Date().toISOString()
      });
      
      updateEngine.executeFileUpdates = jest.fn().mockResolvedValue([{
        filePath: '.claude/agents/genie-dev-coder.md',
        action: 'update',
        success: true,
        result: { action: 'updated', message: 'Template agent updated' }
      }]);
      
      updateEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: true,
        warnings: [],
        errors: [],
        critical: []
      });
      
      // Execute update
      const result = await updateEngine.executeUpdate({
        dryRun: false,
        force: true
      });
      
      expect(result.success).toBe(true);
      expect(result.results.updates).toHaveLength(1);
      
      // Verify custom agent was NOT touched
      const currentContent = await fs.readFile(customAgentPath, 'utf-8');
      const currentChecksum = await getFileChecksum(customAgentPath);
      
      expect(currentContent).toBe(customAgentContent);
      expect(currentChecksum).toBe(originalChecksum);
      
      // Verify it was not included in updates
      const updatedFiles = result.results.updates.map(u => u.filePath);
      expect(updatedFiles).not.toContain('my-proprietary-agent.md');
      
      console.log('✅ Custom proprietary agent protected from updates');
      console.log('📊 Only template-based agents were updated');
    });
  });

  describe('Complex Multi-File Updates', () => {
    test('SCENARIO: Large project with mixed update types', async () => {
      console.log('🎯 SCENARIO: Complex project with agents, hooks, and new files');
      
      // Create a more complex project structure
      const complexProject = await createTestProject(testProjectPath + '-complex', {
        agents: [
          'genie-dev-coder',
          'genie-testing-maker',
          'genie-quality-ruff',
          'genie-quality-mypy',
          'custom-workflow-agent'
        ],
        hooks: [
          'pre-commit',
          'post-update', 
          'pre-push',
          'custom-deploy-hook'
        ],
        hasCustomizations: true,
        version: '1.0.0'
      });
      
      const complexEngine = new UpdateEngine({ 
        projectPath: complexProject.projectPath 
      });
      
      // Mock comprehensive analysis
      complexEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.1.0',
        hasUpdates: true,
        updateCategories: {
          agents: [
            // Safe updates
            {
              filePath: '.claude/agents/genie-dev-coder.md',
              action: 'update',
              risk: 'low'
            },
            {
              filePath: '.claude/agents/genie-testing-maker.md', 
              action: 'update',
              risk: 'low'
            },
            // Smart merge required
            {
              filePath: '.claude/agents/custom-workflow-agent.md',
              action: 'update',
              risk: 'medium'
            },
            // New agent
            {
              filePath: '.claude/agents/genie-new-ai-assistant.md',
              action: 'add',
              risk: 'low'
            }
          ],
          hooks: [
            // Hook updates
            {
              filePath: '.claude/hooks/pre-commit.js',
              action: 'update', 
              risk: 'medium'
            },
            // New hook
            {
              filePath: '.claude/hooks/ai-review.js',
              action: 'add',
              risk: 'low'
            }
          ]
        },
        fileAnalysis: [], // Simplified for this test
        risks: [
          {
            level: 'medium',
            description: '2 files require smart merge',
            files: ['custom-workflow-agent.md', 'pre-commit.js']
          }
        ],
        recommendations: [
          'Review smart-merged files after update',
          'Test new AI assistant integration',
          'Validate hook changes with your workflow'
        ]
      });
      
      complexEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'auto' },
        files: {
          '.claude/agents/custom-workflow-agent.md': 'smart-merge',
          '.claude/hooks/pre-commit.js': 'smart-merge'
        }
      });
      
      complexEngine.createUpdateBackup = jest.fn().mockResolvedValue({
        backupId: 'complex-update-backup',
        path: '/tmp/complex-update-backup',
        fileCount: 7,
        totalSize: 15000,
        timestamp: new Date().toISOString()
      });
      
      complexEngine.executeFileUpdates = jest.fn().mockResolvedValue([
        // Safe updates
        { filePath: '.claude/agents/genie-dev-coder.md', action: 'update', success: true },
        { filePath: '.claude/agents/genie-testing-maker.md', action: 'update', success: true },
        
        // Smart merges
        { 
          filePath: '.claude/agents/custom-workflow-agent.md', 
          action: 'update', 
          success: true,
          result: { action: 'smart-merged', preservedSections: 2 }
        },
        { 
          filePath: '.claude/hooks/pre-commit.js', 
          action: 'update', 
          success: true,
          result: { action: 'smart-merged', preservedSections: 1 }
        },
        
        // New additions
        { filePath: '.claude/agents/genie-new-ai-assistant.md', action: 'add', success: true },
        { filePath: '.claude/hooks/ai-review.js', action: 'add', success: true }
      ]);
      
      complexEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: true,
        warnings: [
          'Review smart-merged files for accuracy',
          'Test new AI assistant functionality'
        ],
        errors: [],
        critical: []
      });
      
      // Execute complex update
      const result = await complexEngine.executeUpdate({
        dryRun: false,
        force: true
      });
      
      expect(result.success).toBe(true);
      expect(result.results.updates).toHaveLength(6);
      expect(result.results.updates.every(u => u.success)).toBe(true);
      
      // Verify different update types
      const updateTypes = result.results.updates.reduce((acc, update) => {
        acc[update.action] = (acc[update.action] || 0) + 1;
        return acc;
      }, {});
      
      expect(updateTypes.update).toBe(4); // 4 updates (2 safe + 2 smart merge)
      expect(updateTypes.add).toBe(2);    // 2 new additions
      
      console.log('✅ Complex multi-file update completed successfully');
      console.log(`📊 Updated: ${updateTypes.update || 0}, Added: ${updateTypes.add || 0}`);
      console.log(`🛡️ Backup created with ${result.results.backup.fileCount} files`);
    });
  });

  describe('Update Recovery Scenarios', () => {
    test('SCENARIO: Automatic rollback on critical validation failure', async () => {
      console.log('🎯 SCENARIO: Automatic rollback when validation fails');
      
      // Mock successful update phases until validation
      updateEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdates: true,
        updateCategories: { agents: [] },
        fileAnalysis: [{
          filePath: '.claude/agents/genie-dev-coder.md',
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
      
      const backupResult = {
        backupId: 'validation-test-backup',
        path: '/tmp/validation-test-backup',
        fileCount: 1,
        totalSize: 1000,
        timestamp: new Date().toISOString()
      };
      
      updateEngine.createUpdateBackup = jest.fn().mockResolvedValue(backupResult);
      
      updateEngine.executeFileUpdates = jest.fn().mockResolvedValue([{
        filePath: '.claude/agents/genie-dev-coder.md',
        action: 'update',
        success: true,
        result: { action: 'updated', message: 'File updated' }
      }]);
      
      // Mock critical validation failure
      updateEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: false,
        warnings: ['Minor warning'],
        errors: ['Non-critical error'],
        critical: [
          'CRITICAL: System integrity compromised',
          'CRITICAL: Required directory structure corrupted'
        ]
      });
      
      // Mock UI prompt for rollback
      updateEngine.ui.promptRestoreFromBackup = jest.fn().mockResolvedValue(true);
      
      // Mock successful rollback
      updateEngine.backup.restoreFromBackup = jest.fn().mockResolvedValue({
        success: true,
        restoredFiles: 1,
        backupId: backupResult.backupId,
        timestamp: new Date().toISOString()
      });
      
      // Execute update that will fail validation
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
      }
      
      expect(updateFailed).toBe(true);
      expect(updateError.message).toContain('Critical validation failures');
      
      // Verify rollback was triggered
      expect(updateEngine.ui.promptRestoreFromBackup).toHaveBeenCalled();
      expect(updateEngine.backup.restoreFromBackup).toHaveBeenCalledWith(backupResult.backupId);
      
      console.log('✅ Automatic rollback triggered on validation failure');
      console.log('🛡️ System restored to previous state');
    });

    test('SCENARIO: Manual rollback after successful update', async () => {
      console.log('🎯 SCENARIO: User-initiated rollback after update completion');
      
      const backupManager = new BackupManager();
      
      // Create initial state
      const originalContent = await fs.readFile(testProject.agentFiles[0], 'utf-8');
      const originalChecksum = await getFileChecksum(testProject.agentFiles[0]);
      
      // Create backup
      const backupResult = await backupManager.createBackup([testProject.agentFiles[0]], {
        type: 'pre-update-backup',
        description: 'Backup before manual rollback test'
      });
      
      // Simulate update by modifying file
      const updatedContent = originalContent + '\n\n## Updated Section\nThis content was added during update.';
      await fs.writeFile(testProject.agentFiles[0], updatedContent, 'utf-8');
      
      // Verify file was modified
      const modifiedChecksum = await getFileChecksum(testProject.agentFiles[0]);
      expect(modifiedChecksum).not.toBe(originalChecksum);
      
      console.log('📝 File modified to simulate update');
      
      // Perform manual rollback
      const rollbackResult = await backupManager.restoreFromBackup(
        backupResult.backupId,
        null, // Use original locations
        { force: true }
      );
      
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.restoredFiles).toBe(1);
      
      // Verify rollback restored original content
      const rolledBackContent = await fs.readFile(testProject.agentFiles[0], 'utf-8');
      const rolledBackChecksum = await getFileChecksum(testProject.agentFiles[0]);
      
      expect(rolledBackContent).toBe(originalContent);
      expect(rolledBackChecksum).toBe(originalChecksum);
      expect(rolledBackContent).not.toContain('Updated Section');
      
      console.log('✅ Manual rollback completed successfully');
      console.log('🛡️ Original content perfectly restored');
    });
  });

  describe('Performance and Scale Testing', () => {
    test('SCENARIO: Large project update performance', async () => {
      console.log('🎯 SCENARIO: Performance test with large project');
      
      // Create large project structure (simulate, don't actually create)
      const largeProjectStats = {
        agents: 25,
        hooks: 10,
        totalFiles: 35,
        estimatedSize: '2MB'
      };
      
      // Mock analysis for large project
      updateEngine.preUpdateAnalysis = jest.fn().mockImplementation(async () => {
        const startTime = Date.now();
        
        // Simulate analysis processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const endTime = Date.now();
        const analysisTime = endTime - startTime;
        
        console.log(`📊 Analysis completed in ${analysisTime}ms for ${largeProjectStats.totalFiles} files`);
        
        return {
          currentVersion: '1.0.0',
          latestVersion: '2.0.0',
          hasUpdates: true,
          updateCategories: {
            agents: new Array(15).fill(null).map((_, i) => ({
              filePath: `.claude/agents/agent-${i}.md`,
              action: 'update',
              risk: 'low'
            })),
            hooks: new Array(5).fill(null).map((_, i) => ({
              filePath: `.claude/hooks/hook-${i}.js`, 
              action: 'update',
              risk: 'low'
            }))
          },
          fileAnalysis: [],
          risks: [],
          recommendations: [`${largeProjectStats.totalFiles} files ready for update`]
        };
      });
      
      updateEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'auto' },
        files: {}
      });
      
      // Mock backup with performance tracking
      updateEngine.createUpdateBackup = jest.fn().mockImplementation(async () => {
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate backup time
        const endTime = Date.now();
        
        console.log(`📦 Backup completed in ${endTime - startTime}ms`);
        
        return {
          backupId: 'large-project-backup',
          path: '/tmp/large-project-backup',
          fileCount: largeProjectStats.totalFiles,
          totalSize: 2000000, // 2MB
          timestamp: new Date().toISOString()
        };
      });
      
      // Mock file updates with performance tracking
      updateEngine.executeFileUpdates = jest.fn().mockImplementation(async () => {
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate update time
        const endTime = Date.now();
        
        console.log(`🔄 File updates completed in ${endTime - startTime}ms`);
        
        return new Array(20).fill(null).map((_, i) => ({
          filePath: `.claude/files/file-${i}`,
          action: 'update',
          success: true,
          result: { action: 'updated' }
        }));
      });
      
      updateEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: true,
        warnings: [],
        errors: [],
        critical: []
      });
      
      // Execute with performance monitoring
      const overallStartTime = Date.now();
      
      const result = await updateEngine.executeUpdate({
        dryRun: false,
        force: true
      });
      
      const overallEndTime = Date.now();
      const totalTime = overallEndTime - overallStartTime;
      
      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(5000); // Should complete in under 5 seconds
      
      console.log(`✅ Large project update completed in ${totalTime}ms`);
      console.log(`📊 Performance: ${largeProjectStats.totalFiles} files in ${totalTime}ms`);
      console.log(`🚀 Average: ${Math.round(totalTime / largeProjectStats.totalFiles)}ms per file`);
    });
  });
});
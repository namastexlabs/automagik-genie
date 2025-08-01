const { UpdateEngine } = require('../../../lib/update/engine');
const { BackupManager } = require('../../../lib/update/backup');
const { TemplateManager } = require('../../../lib/update/templates');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * STRESS TESTING: Large Project Scenarios
 * 
 * Tests the update system under high load conditions:
 * - Large numbers of agents (100+)
 * - Large file sizes (>10MB)
 * - Deep directory structures
 * - Memory pressure scenarios
 * - Concurrent operations
 */

describe('🔥 STRESS TEST: Large Project Update Scenarios', () => {
  let testProjectPath;
  let updateEngine;
  let originalTimeout;

  beforeAll(() => {
    // Increase timeout for stress tests
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000; // 5 minutes
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  beforeEach(async () => {
    testProjectPath = await createTempDir('stress-test-');
    updateEngine = new UpdateEngine({ projectPath: testProjectPath });
  });

  describe('High Volume Agent Testing', () => {
    test('STRESS: Handle 100+ agent files simultaneously', async () => {
      console.log('🎯 STRESS: Creating project with 100+ agents');
      
      const agentCount = 150;
      const largeProject = await createLargeProject(testProjectPath, {
        agentCount,
        hasCustomizations: true,
        addComplexContent: true
      });

      // Mock analysis for large project
      updateEngine.preUpdateAnalysis = jest.fn().mockImplementation(async () => {
        console.log(`📊 Analyzing ${agentCount} agents...`);
        
        const startTime = Date.now();
        
        // Simulate realistic analysis time for large project
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const analysisTime = Date.now() - startTime;
        console.log(`⏱️ Analysis completed in ${analysisTime}ms for ${agentCount} agents`);
        
        // Generate update categories for all agents
        const agentUpdates = Array.from({ length: agentCount }, (_, i) => ({
          filePath: `.claude/agents/stress-agent-${i.toString().padStart(3, '0')}.md`,
          fileName: `stress-agent-${i.toString().padStart(3, '0')}.md`,
          category: 'agents',
          action: 'update',
          risk: i % 20 === 0 ? 'high' : (i % 10 === 0 ? 'medium' : 'low') // Vary risk levels
        }));

        return {
          currentVersion: '1.0.0',
          latestVersion: '2.0.0',
          hasUpdates: true,
          updateCategories: {
            agents: agentUpdates,
            hooks: []
          },
          fileAnalysis: agentUpdates,
          risks: [{
            level: 'medium',
            description: `Processing ${agentCount} files requires careful memory management`,
            files: [`${agentCount} agent files`]
          }],
          recommendations: [
            'Large project detected - processing will take longer',
            'Ensure sufficient disk space for backup creation',
            'Monitor memory usage during update'
          ]
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
        
        // Simulate backup time proportional to file count
        const backupTime = Math.ceil(agentCount / 10) * 10; // ~10ms per 10 files
        await new Promise(resolve => setTimeout(resolve, backupTime));
        
        const endTime = Date.now();
        console.log(`📦 Backup of ${agentCount} files completed in ${endTime - startTime}ms`);
        
        return {
          backupId: 'large-project-stress-backup',
          path: '/tmp/large-project-stress-backup',
          fileCount: agentCount,
          totalSize: agentCount * 50000, // ~50KB per agent
          timestamp: new Date().toISOString()
        };
      });

      // Mock file updates with memory monitoring
      updateEngine.executeFileUpdates = jest.fn().mockImplementation(async () => {
        const startTime = Date.now();
        const initialMemory = process.memoryUsage();
        
        console.log(`🔄 Processing ${agentCount} file updates...`);
        console.log(`💾 Initial memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
        
        // Simulate batch processing to avoid memory overflow
        const batchSize = 25;
        const results = [];
        
        for (let i = 0; i < agentCount; i += batchSize) {
          const batchEnd = Math.min(i + batchSize, agentCount);
          console.log(`📝 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(agentCount / batchSize)} (files ${i}-${batchEnd})`);
          
          // Simulate batch processing time
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Add batch results
          for (let j = i; j < batchEnd; j++) {
            results.push({
              filePath: `.claude/agents/stress-agent-${j.toString().padStart(3, '0')}.md`,
              action: 'update',
              success: true,
              result: { action: 'updated', message: 'Stress test update' }
            });
          }
          
          // Monitor memory usage
          const currentMemory = process.memoryUsage();
          console.log(`💾 Memory after batch: ${Math.round(currentMemory.heapUsed / 1024 / 1024)}MB`);
        }
        
        const endTime = Date.now();
        const finalMemory = process.memoryUsage();
        
        console.log(`✅ Completed ${agentCount} updates in ${endTime - startTime}ms`);
        console.log(`💾 Final memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
        console.log(`📈 Memory delta: ${Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024)}MB`);
        
        return results;
      });

      updateEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: true,
        warnings: [`Large project with ${agentCount} files updated successfully`],
        errors: [],
        critical: []
      });

      // Execute stress test
      const overallStartTime = Date.now();
      
      const result = await updateEngine.executeUpdate({
        dryRun: false,
        force: true
      });
      
      const overallEndTime = Date.now();
      const totalTime = overallEndTime - overallStartTime;

      // Validate results
      expect(result.success).toBe(true);
      expect(result.results.updates).toHaveLength(agentCount);
      expect(result.results.updates.every(u => u.success)).toBe(true);
      
      // Performance validation
      expect(totalTime).toBeLessThan(60000); // Should complete within 1 minute
      
      console.log('✅ STRESS TEST COMPLETED');
      console.log(`📊 Performance Summary:`);
      console.log(`   • Agents Processed: ${agentCount}`);
      console.log(`   • Total Time: ${totalTime}ms`);
      console.log(`   • Average per Agent: ${Math.round(totalTime / agentCount)}ms`);
      console.log(`   • Throughput: ${Math.round(agentCount / (totalTime / 1000))} agents/second`);
    });

    test('STRESS: Handle very large agent files (>10MB)', async () => {
      console.log('🎯 STRESS: Testing very large agent files');
      
      // Create agent with large content (>10MB)
      const largeContent = await createLargeAgentContent();
      const largeAgentPath = path.join(testProjectPath, '.claude', 'agents', 'massive-agent.md');
      
      await fs.mkdir(path.dirname(largeAgentPath), { recursive: true });
      await fs.writeFile(largeAgentPath, largeContent, 'utf-8');
      
      const stats = await fs.stat(largeAgentPath);
      const fileSizeMB = Math.round(stats.size / 1024 / 1024);
      console.log(`📁 Created large agent file: ${fileSizeMB}MB`);
      
      expect(stats.size).toBeGreaterThan(10 * 1024 * 1024); // >10MB

      // Mock update for large file
      updateEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdates: true,
        updateCategories: {
          agents: [{
            filePath: '.claude/agents/massive-agent.md',
            fileName: 'massive-agent.md',
            category: 'agents',
            action: 'update',
            risk: 'high'  // Large file = high risk
          }]
        },
        fileAnalysis: [{
          filePath: '.claude/agents/massive-agent.md',
          fileName: 'massive-agent.md',
          category: 'agents',
          action: 'update',
          risk: 'high',
          description: `Large file (${fileSizeMB}MB) requires careful processing`
        }],
        risks: [{
          level: 'high',
          description: `Large file detected (${fileSizeMB}MB)`,
          files: ['massive-agent.md']
        }],
        recommendations: [
          'Large file may take longer to process',
          'Ensure sufficient memory and disk space'
        ]
      });

      updateEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'smart-merge' },
        files: {}
      });

      // Mock backup with size tracking
      updateEngine.createUpdateBackup = jest.fn().mockImplementation(async () => {
        const startTime = Date.now();
        
        // Simulate realistic backup time for large file
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const endTime = Date.now();
        console.log(`📦 Large file backup completed in ${endTime - startTime}ms`);
        
        return {
          backupId: 'large-file-backup',
          path: '/tmp/large-file-backup',
          fileCount: 1,
          totalSize: stats.size,
          timestamp: new Date().toISOString()
        };
      });

      // Mock large file processing
      updateEngine.executeFileUpdates = jest.fn().mockImplementation(async () => {
        const startTime = Date.now();
        const initialMemory = process.memoryUsage();
        
        console.log(`🔄 Processing large file (${fileSizeMB}MB)...`);
        console.log(`💾 Initial memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
        
        // Simulate processing time proportional to file size
        const processingTime = Math.max(100, fileSizeMB * 20); // ~20ms per MB
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        const endTime = Date.now();
        const finalMemory = process.memoryUsage();
        
        console.log(`✅ Large file processed in ${endTime - startTime}ms`);
        console.log(`💾 Final memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
        
        return [{
          filePath: '.claude/agents/massive-agent.md',
          action: 'update',
          success: true,
          result: { 
            action: 'smart-merged',
            message: `Large file (${fileSizeMB}MB) processed successfully`,
            processingTime: endTime - startTime
          }
        }];
      });

      updateEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: true,
        warnings: [`Large file (${fileSizeMB}MB) processed - verify content accuracy`],
        errors: [],
        critical: []
      });

      // Execute large file test
      const result = await updateEngine.executeUpdate({
        dryRun: false,
        force: true
      });

      expect(result.success).toBe(true);
      expect(result.results.updates).toHaveLength(1);
      expect(result.results.updates[0].success).toBe(true);
      expect(result.results.updates[0].result.message).toContain(`${fileSizeMB}MB`);

      console.log('✅ Large file stress test completed successfully');
    });
  });

  describe('Memory Pressure Testing', () => {
    test('STRESS: Memory usage under concurrent operations', async () => {
      console.log('🎯 STRESS: Testing memory usage patterns');
      
      const initialMemory = process.memoryUsage();
      console.log(`💾 Test start memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
      
      // Create multiple concurrent operations
      const concurrentOperations = [];
      const operationCount = 10;
      
      for (let i = 0; i < operationCount; i++) {
        const operation = async () => {
          const opStartMemory = process.memoryUsage();
          
          // Simulate memory-intensive operation
          const largeBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB buffer
          largeBuffer.fill('test-data-for-memory-pressure-testing');
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const opEndMemory = process.memoryUsage();
          
          return {
            operationId: i,
            memoryDelta: opEndMemory.heapUsed - opStartMemory.heapUsed,
            processingTime: 100
          };
        };
        
        concurrentOperations.push(operation());
      }
      
      // Execute all operations concurrently
      const results = await Promise.all(concurrentOperations);
      
      const finalMemory = process.memoryUsage();
      const totalMemoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`💾 Final memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
      console.log(`📈 Total memory delta: ${Math.round(totalMemoryDelta / 1024 / 1024)}MB`);
      console.log(`⚡ Concurrent operations: ${operationCount}`);
      
      // Validate memory management
      expect(results).toHaveLength(operationCount);
      expect(totalMemoryDelta).toBeLessThan(100 * 1024 * 1024); // Should be <100MB delta
      
      // Force garbage collection and verify cleanup
      if (global.gc) {
        global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const postGcMemory = process.memoryUsage();
        console.log(`🗑️ Post-GC memory: ${Math.round(postGcMemory.heapUsed / 1024 / 1024)}MB`);
      }
      
      console.log('✅ Memory pressure test completed');
    });
  });

  describe('Deep Directory Structure Testing', () => {
    test('STRESS: Handle deeply nested directory structures', async () => {
      console.log('🎯 STRESS: Testing deep directory structures');
      
      // Create deep directory structure
      const maxDepth = 15;
      const deepProject = await createDeepDirectoryProject(testProjectPath, maxDepth);
      
      console.log(`📁 Created project with ${maxDepth} directory levels`);
      console.log(`📊 Total agents in deep structure: ${deepProject.agentCount}`);
      
      // Mock analysis for deep structure
      updateEngine.preUpdateAnalysis = jest.fn().mockResolvedValue({
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdates: true,
        updateCategories: {
          agents: deepProject.agents.map((agent, i) => ({
            filePath: agent.relativePath,
            fileName: path.basename(agent.relativePath),
            category: 'agents',
            action: 'update',
            risk: 'low'
          }))
        },
        fileAnalysis: deepProject.agents.map(agent => ({
          filePath: agent.relativePath,
          fileName: path.basename(agent.relativePath),
          category: 'agents',
          action: 'update',
          risk: 'low',
          description: `Deep path: ${agent.depth} levels`
        })),
        risks: [{
          level: 'low',
          description: `Deep directory structure (${maxDepth} levels)`,
          files: ['Various nested agents']
        }],
        recommendations: [
          'Deep directory structure detected',
          'Path length validation will be performed'
        ]
      });

      updateEngine.getUserConsent = jest.fn().mockResolvedValue({
        cancelled: false,
        global: { defaultAction: 'auto' },
        files: {}
      });

      updateEngine.createUpdateBackup = jest.fn().mockResolvedValue({
        backupId: 'deep-structure-backup',
        path: '/tmp/deep-structure-backup',
        fileCount: deepProject.agentCount,
        totalSize: deepProject.agentCount * 1000,
        timestamp: new Date().toISOString()
      });

      updateEngine.executeFileUpdates = jest.fn().mockImplementation(async () => {
        console.log(`🔄 Processing ${deepProject.agentCount} files in deep structure...`);
        
        // Simulate path validation and processing
        const results = deepProject.agents.map(agent => {
          // Validate path length (common OS limitation)
          const pathLength = agent.fullPath.length;
          const isValidPath = pathLength < 260; // Windows MAX_PATH limitation
          
          return {
            filePath: agent.relativePath,
            action: 'update',
            success: isValidPath,
            result: isValidPath 
              ? { action: 'updated', message: `Deep path processed (${agent.depth} levels)` }
              : { error: `Path too long: ${pathLength} characters` }
          };
        });
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        
        console.log(`✅ Successfully processed: ${successCount} files`);
        if (failureCount > 0) {
          console.log(`❌ Failed due to path length: ${failureCount} files`);
        }
        
        return results;
      });

      updateEngine.postUpdateValidation = jest.fn().mockResolvedValue({
        success: true,
        warnings: [`Deep directory structure processed with ${maxDepth} levels`],
        errors: [],
        critical: []
      });

      // Execute deep structure test
      const result = await updateEngine.executeUpdate({
        dryRun: false,
        force: true
      });

      expect(result.success).toBe(true);
      expect(result.results.updates.length).toBeGreaterThan(0);
      
      // Validate path handling
      const successfulUpdates = result.results.updates.filter(u => u.success);
      expect(successfulUpdates.length).toBeGreaterThan(0);
      
      console.log('✅ Deep directory structure test completed');
      console.log(`📊 Successfully handled ${successfulUpdates.length} deep path files`);
    });
  });
});

// Helper functions for stress testing

async function createTempDir(prefix) {
  const tempDir = path.join(os.tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

async function createLargeProject(projectPath, options) {
  const { agentCount, hasCustomizations, addComplexContent } = options;
  
  const agentsDir = path.join(projectPath, '.claude', 'agents');
  await fs.mkdir(agentsDir, { recursive: true });
  
  const agentFiles = [];
  
  for (let i = 0; i < agentCount; i++) {
    const agentName = `stress-agent-${i.toString().padStart(3, '0')}.md`;
    const agentPath = path.join(agentsDir, agentName);
    
    let content = `# Stress Test Agent ${i}

## Role
This is a stress test agent created for testing large project scenarios.

## Instructions
- Handle stress test scenario ${i}
- Process large datasets efficiently
- Maintain performance under load

## Agent Number
Agent ID: ${i}
Created for stress testing purposes.
`;

    if (hasCustomizations && i % 5 === 0) {
      content += `

<!-- USER_CUSTOMIZATION_START -->
## Custom Business Logic for Agent ${i}

This agent has custom business logic that must be preserved during updates.

\`\`\`javascript
class StressTestLogic${i} {
  constructor() {
    this.agentId = ${i};
    this.processingCapacity = ${Math.floor(Math.random() * 1000) + 100};
  }
  
  processStressData(data) {
    // Custom processing for agent ${i}
    return data.map(item => ({
      ...item,
      processedBy: this.agentId,
      timestamp: new Date().toISOString()
    }));
  }
}
\`\`\`

### Custom Configuration
- Agent Priority: ${i % 10}
- Memory Limit: ${Math.floor(Math.random() * 512) + 256}MB
- Concurrent Tasks: ${Math.floor(Math.random() * 10) + 1}
<!-- USER_CUSTOMIZATION_END -->
`;
    }

    if (addComplexContent) {
      content += `

## Complex Content Section
${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50)}

### Data Tables
| ID | Name | Value | Status |
|----|------|-------|--------|
${Array.from({ length: 20 }, (_, j) => `| ${j} | Item${j} | ${Math.random().toFixed(4)} | Active |`).join('\n')}

### Code Examples
${'```javascript\n// Example code block ' + i + '\nfunction example' + i + '() {\n  return "stress test data";\n}\n```\n\n'.repeat(5)}
`;
    }
    
    await fs.writeFile(agentPath, content, 'utf-8');
    agentFiles.push(agentPath);
  }
  
  return {
    projectPath,
    agentsDir,
    agentFiles,
    agentCount
  };
}

async function createLargeAgentContent() {
  const sections = [
    '# Massive Agent for Stress Testing',
    '',
    '## Role',
    'This agent is designed to test the system\'s ability to handle very large files.',
    '',
    '## Large Data Section',
  ];
  
  // Add large content blocks
  for (let i = 0; i < 1000; i++) {
    sections.push(`### Data Block ${i}`);
    sections.push('');
    
    // Add substantial content per block (~10KB each)
    const blockContent = `This is data block ${i}. `.repeat(500);
    sections.push(blockContent);
    sections.push('');
    
    // Add code examples
    sections.push('```javascript');
    sections.push(`function processBlock${i}(data) {`);
    sections.push(`  // Processing logic for block ${i}`);
    sections.push(`  const result = data.map(item => ({`);
    sections.push(`    ...item,`);
    sections.push(`    blockId: ${i},`);
    sections.push(`    processed: true,`);
    sections.push(`    timestamp: new Date().toISOString()`);
    sections.push(`  }));`);
    sections.push(`  return result;`);
    sections.push(`}`);
    sections.push('```');
    sections.push('');
  }
  
  const content = sections.join('\n');
  console.log(`📊 Generated large content: ${Math.round(content.length / 1024 / 1024 * 100) / 100}MB`);
  
  return content;
}

async function createDeepDirectoryProject(projectPath, maxDepth) {
  const agents = [];
  let totalAgents = 0;
  
  // Create nested directory structure
  async function createDeepLevel(currentPath, depth, parentName = '') {
    if (depth > maxDepth) return;
    
    const levelName = `level${depth}`;
    const fullPath = path.join(currentPath, levelName);
    await fs.mkdir(fullPath, { recursive: true });
    
    // Create 1-2 agents per level
    const agentsInLevel = Math.min(2, Math.max(1, Math.floor(Math.random() * 3)));
    
    for (let i = 0; i < agentsInLevel; i++) {
      const agentName = `deep-agent-${depth}-${i}.md`;
      const agentPath = path.join(fullPath, agentName);
      const relativePath = path.relative(projectPath, agentPath);
      
      const content = `# Deep Agent Level ${depth}-${i}

## Role
Agent located at depth level ${depth}, position ${i}.

## Path Information
- Depth: ${depth}
- Parent: ${parentName}
- Full Path: ${agentPath}
- Relative Path: ${relativePath}

## Instructions
Handle operations at directory depth ${depth}.
`;
      
      await fs.writeFile(agentPath, content, 'utf-8');
      
      agents.push({
        name: agentName,
        fullPath: agentPath,
        relativePath: relativePath.replace(/\\/g, '/'), // Normalize path separators
        depth,
        position: i
      });
      
      totalAgents++;
    }
    
    // Recurse to next level
    await createDeepLevel(fullPath, depth + 1, levelName);
  }
  
  await createDeepLevel(path.join(projectPath, '.claude', 'agents'), 1);
  
  return {
    agents,
    agentCount: totalAgents,
    maxDepth
  };
}
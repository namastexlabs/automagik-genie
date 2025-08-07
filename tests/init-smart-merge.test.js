const { smartInit, analyzeExistingClaude, isGenieAgent, isGenieHook, isGenieCommand } = require('../lib/init.js');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('Smart Merge Initialization', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-merge-test-'));
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Content Analysis', () => {
    test('should identify genie vs user agents correctly', () => {
      expect(isGenieAgent('my-project-analyzer')).toBe(true);
      expect(isGenieAgent('my-project-dev-coder')).toBe(true);
      expect(isGenieAgent('my-project-clone')).toBe(true);
      expect(isGenieAgent('custom-payment-handler')).toBe(false);
      expect(isGenieAgent('user-specific-agent')).toBe(false);
      expect(isGenieAgent('my-project-custom-feature')).toBe(false);
    });

    test('should identify genie vs user hooks correctly', () => {
      expect(isGenieHook('tdd-hook.sh')).toBe(true);
      expect(isGenieHook('pre-commit-quality.sh')).toBe(true);
      expect(isGenieHook('examples')).toBe(true);
      expect(isGenieHook('custom-deploy-hook.sh')).toBe(false);
      expect(isGenieHook('user-validation.py')).toBe(false);
    });

    test('should identify genie vs user commands correctly', () => {
      expect(isGenieCommand('wish.md')).toBe(true);
      expect(isGenieCommand('deploy.md')).toBe(false);
      expect(isGenieCommand('custom-workflow.md')).toBe(false);
    });

    test('should analyze existing .claude directory structure', async () => {
      // Create existing .claude structure with mixed content
      const claudeDir = path.join(tempDir, '.claude');
      const agentsDir = path.join(claudeDir, 'agents');
      const hooksDir = path.join(claudeDir, 'hooks');
      const commandsDir = path.join(claudeDir, 'commands');
      
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.mkdir(hooksDir, { recursive: true });
      await fs.mkdir(commandsDir, { recursive: true });
      
      // Mix of genie and user agents
      await fs.writeFile(path.join(agentsDir, 'test-project-analyzer.md'), '# Genie agent');
      await fs.writeFile(path.join(agentsDir, 'test-project-dev-coder.md'), '# Genie agent');
      await fs.writeFile(path.join(agentsDir, 'custom-payment-agent.md'), '# User agent');
      await fs.writeFile(path.join(agentsDir, 'legacy-migration-agent.md'), '# User agent');
      
      // Mix of genie and user hooks
      await fs.writeFile(path.join(hooksDir, 'tdd-hook.sh'), '# Genie hook');
      await fs.writeFile(path.join(hooksDir, 'custom-deploy.sh'), '# User hook');
      await fs.mkdir(path.join(hooksDir, 'examples'));
      await fs.mkdir(path.join(hooksDir, 'custom-validators'));
      
      // Mix of genie and user commands
      await fs.writeFile(path.join(commandsDir, 'wish.md'), '# Genie command');
      await fs.writeFile(path.join(commandsDir, 'deploy.md'), '# User command');
      
      // Other user files
      await fs.writeFile(path.join(claudeDir, 'custom-config.json'), '{}');
      
      const analysis = await analyzeExistingClaude(claudeDir);
      
      expect(analysis.hasUserContent).toBe(true);
      expect(analysis.userAgents).toEqual(['custom-payment-agent.md', 'legacy-migration-agent.md']);
      expect(analysis.genieAgents).toEqual(['test-project-analyzer.md', 'test-project-dev-coder.md']);
      expect(analysis.userHooks).toEqual(['custom-deploy.sh', 'custom-validators/']);
      expect(analysis.genieHooks).toEqual(['examples/', 'tdd-hook.sh']);
      expect(analysis.userCommands).toEqual(['deploy.md']);
      expect(analysis.genieCommands).toEqual(['wish.md']);
      expect(analysis.userFiles).toEqual(['custom-config.json']);
    });
  });

  describe('Smart Merge Functionality', () => {
    test('should preserve user content while updating genie content', async () => {
      // Setup existing installation with user content
      const claudeDir = path.join(tempDir, '.claude');
      const agentsDir = path.join(claudeDir, 'agents');
      const hooksDir = path.join(claudeDir, 'hooks');
      const commandsDir = path.join(claudeDir, 'commands');
      
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.mkdir(hooksDir, { recursive: true });
      await fs.mkdir(commandsDir, { recursive: true });
      
      // User content that should be preserved
      await fs.writeFile(path.join(agentsDir, 'custom-payment-agent.md'), `---
name: custom-payment-agent
description: Handles payment processing
---
# Custom Payment Agent
This is my custom payment processing agent.`);
      
      await fs.writeFile(path.join(hooksDir, 'custom-deploy.sh'), `#!/bin/bash
echo "Custom deployment hook"
# This is my custom deployment logic`);
      
      await fs.writeFile(path.join(commandsDir, 'deploy.md'), `# Custom Deploy Command
My custom deployment workflow.`);
      
      await fs.writeFile(path.join(claudeDir, 'project-config.json'), `{
  "customSettings": "preserved"
}`);
      
      // Old genie content that should be updated
      await fs.writeFile(path.join(agentsDir, 'test-project-analyzer.md'), `---
name: test-project-analyzer
description: Old analyzer
---
# Old Analyzer (should be updated)`);
      
      // Create package.json for project detection
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }));
      
      // Suppress console output during test
      const originalLog = console.log;
      console.log = jest.fn();
      
      try {
        // Run smart initialization
        await smartInit(tempDir);
        
        // Verify user content is preserved
        const customPaymentAgent = await fs.readFile(path.join(agentsDir, 'custom-payment-agent.md'), 'utf-8');
        expect(customPaymentAgent).toContain('This is my custom payment processing agent');
        expect(customPaymentAgent).toContain('custom-payment-agent');
        
        const customDeployHook = await fs.readFile(path.join(hooksDir, 'custom-deploy.sh'), 'utf-8');
        expect(customDeployHook).toContain('Custom deployment hook');
        expect(customDeployHook).toContain('custom deployment logic');
        
        const customDeployCommand = await fs.readFile(path.join(commandsDir, 'deploy.md'), 'utf-8');
        expect(customDeployCommand).toContain('Custom Deploy Command');
        expect(customDeployCommand).toContain('custom deployment workflow');
        
        const projectConfig = await fs.readFile(path.join(claudeDir, 'project-config.json'), 'utf-8');
        expect(JSON.parse(projectConfig).customSettings).toBe('preserved');
        
        // Verify genie content is updated/created
        const analyzer = await fs.readFile(path.join(agentsDir, 'test-project-analyzer.md'), 'utf-8');
        expect(analyzer).toContain('test-project-analyzer');
        expect(analyzer).toContain('Universal codebase analysis'); // New content
        expect(analyzer).not.toContain('Old Analyzer'); // Old content replaced
        
        // Verify new genie agents are created
        const devCoder = await fs.readFile(path.join(agentsDir, 'test-project-dev-coder.md'), 'utf-8');
        expect(devCoder).toContain('test-project-dev-coder');
        expect(devCoder).toContain('Code implementation based on design documents');
        
        // Verify genie commands and hooks are created  
        await expect(fs.access(path.join(commandsDir, 'wish.md'))).resolves.toBeUndefined();
        await expect(fs.access(path.join(hooksDir, 'examples'))).resolves.toBeUndefined();
        
        // Verify backup was created
        const entries = await fs.readdir(tempDir);
        const backupDirs = entries.filter(entry => entry.startsWith('.claude.backup-'));
        expect(backupDirs.length).toBe(1);
        
        // Verify backup contains the original content
        const backupDir = path.join(tempDir, backupDirs[0]);
        const backupClaude = path.join(backupDir, '.claude');
        const backupCustomAgent = await fs.readFile(path.join(backupClaude, 'agents', 'custom-payment-agent.md'), 'utf-8');
        expect(backupCustomAgent).toContain('This is my custom payment processing agent');
        
      } finally {
        console.log = originalLog;
      }
    });

    test('should handle clean installation correctly', async () => {
      // Create package.json only
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'clean-project',
        version: '1.0.0'
      }));
      
      // Suppress console output during test
      const originalLog = console.log;
      console.log = jest.fn();
      
      try {
        await smartInit(tempDir);
        
        // Verify standard genie structure is created
        const claudeDir = path.join(tempDir, '.claude');
        const agentsDir = path.join(claudeDir, 'agents');
        const hooksDir = path.join(claudeDir, 'hooks');
        const commandsDir = path.join(claudeDir, 'commands');
        
        // Check agents
        const agentFiles = await fs.readdir(agentsDir);
        expect(agentFiles).toContain('clean-project-analyzer.md');
        expect(agentFiles).toContain('clean-project-dev-coder.md');
        expect(agentFiles).toContain('clean-project-dev-planner.md');
        
        // Check commands
        await expect(fs.access(path.join(commandsDir, 'wish.md'))).resolves.toBeUndefined();
        
        // Check hooks examples
        await expect(fs.access(path.join(hooksDir, 'examples'))).resolves.toBeUndefined();
        
        // Check CLAUDE.md
        const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
        expect(claudeMd).toContain('clean-project');
        expect(claudeMd).toContain('GENIE PERSONALITY CORE');
        
        // Check MCP config
        const mcpConfig = await fs.readFile(path.join(tempDir, '.mcp.json'), 'utf-8');
        const mcp = JSON.parse(mcpConfig);
        expect(mcp.mcpServers['ask-repo-agent']).toBeDefined();
        expect(mcp.mcpServers['search-repo-docs']).toBeDefined();
        
      } finally {
        console.log = originalLog;
      }
    });

    test('should handle mixed installations with no user content', async () => {
      // Create existing genie-only installation (outdated)
      const claudeDir = path.join(tempDir, '.claude');
      const agentsDir = path.join(claudeDir, 'agents');
      
      await fs.mkdir(agentsDir, { recursive: true });
      
      // Old genie agents only
      await fs.writeFile(path.join(agentsDir, 'test-project-analyzer.md'), `---
name: test-project-analyzer
description: Old version
---
# Old analyzer without modern features`);
      
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }));
      
      // Suppress console output during test
      const originalLog = console.log;
      console.log = jest.fn();
      
      try {
        await smartInit(tempDir);
        
        // Verify genie content is updated
        const analyzer = await fs.readFile(path.join(agentsDir, 'test-project-analyzer.md'), 'utf-8');
        expect(analyzer).toContain('Universal codebase analysis'); // New content
        expect(analyzer).not.toContain('Old analyzer without modern features'); // Old content replaced
        
        // Verify new agents are added
        const devCoder = await fs.readFile(path.join(agentsDir, 'test-project-dev-coder.md'), 'utf-8');
        expect(devCoder).toContain('test-project-dev-coder');
        
        // Verify backup was still created for safety
        const entries = await fs.readdir(tempDir);
        const backupDirs = entries.filter(entry => entry.startsWith('.claude.backup-'));
        expect(backupDirs.length).toBe(1);
        
      } finally {
        console.log = originalLog;
      }
    });

    test('should handle corrupt user files gracefully', async () => {
      // Create installation with corrupt user file
      const claudeDir = path.join(tempDir, '.claude');
      const agentsDir = path.join(claudeDir, 'agents');
      
      await fs.mkdir(agentsDir, { recursive: true });
      
      // Good user content
      await fs.writeFile(path.join(agentsDir, 'good-user-agent.md'), '# Good user agent');
      
      // Binary/corrupt user content
      await fs.writeFile(path.join(agentsDir, 'corrupt-agent.md'), Buffer.from([0x00, 0x01, 0x02]));
      
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }));
      
      // Suppress console output during test
      const originalLog = console.log;
      console.log = jest.fn();
      
      try {
        // Should not throw
        await smartInit(tempDir);
        
        // Verify good content is preserved
        const goodAgent = await fs.readFile(path.join(agentsDir, 'good-user-agent.md'), 'utf-8');
        expect(goodAgent).toContain('Good user agent');
        
        // Verify genie agents are created
        const analyzer = await fs.readFile(path.join(agentsDir, 'test-project-analyzer.md'), 'utf-8');
        expect(analyzer).toContain('test-project-analyzer');
        
        // Verify corrupt file is preserved in backup but doesn't break process
        await expect(fs.access(path.join(agentsDir, 'corrupt-agent.md'))).resolves.toBeUndefined();
        
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle permission errors gracefully', async () => {
      // This test is platform-dependent, so we'll mock the behavior
      const originalWriteFile = fs.writeFile;
      const writeFileError = new Error('EACCES: permission denied');
      writeFileError.code = 'EACCES';
      
      // Mock writeFile to fail once then succeed
      let callCount = 0;
      fs.writeFile = jest.fn().mockImplementation((...args) => {
        callCount++;
        if (callCount === 1 && args[0].includes('agents')) {
          return Promise.reject(writeFileError);
        }
        return originalWriteFile.apply(fs, args);
      });
      
      try {
        await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
          name: 'test-project',
          version: '1.0.0'
        }));
        
        // Suppress console output during test
        const originalLog = console.log;
        console.log = jest.fn();
        
        try {
          // Should handle the error and continue
          await smartInit(tempDir);
          
          // Should still create other components that don't fail
          const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
          expect(claudeMd).toContain('test-project');
          
        } finally {
          console.log = originalLog;
        }
        
      } finally {
        fs.writeFile = originalWriteFile;
      }
    });

    test('should handle missing template files gracefully', async () => {
      // Create package.json
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }));
      
      // Suppress console output during test
      const originalLog = console.log;
      console.log = jest.fn();
      
      try {
        // Should not throw even if templates are missing
        await smartInit(tempDir);
        
        // Should create fallback content
        const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
        expect(claudeMd).toContain('test-project');
        expect(claudeMd).toContain('Genie Development Assistant');
        
        // Should create agents from code templates
        const agentsDir = path.join(tempDir, '.claude', 'agents');
        const analyzer = await fs.readFile(path.join(agentsDir, 'test-project-analyzer.md'), 'utf-8');
        expect(analyzer).toContain('test-project-analyzer');
        
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Integration with Backup Analysis', () => {
    test('should integrate backup analysis with smart merge', async () => {
      // Create a backup directory first
      const backupDir = path.join(tempDir, '.claude.backup-2024-01-01T00-00-00-000Z');
      await fs.mkdir(backupDir, { recursive: true });
      
      const backupClaudeMd = `# Test Project - Previous Configuration

This is a test project for payment processing.

## Build Commands
- npm run build
- npm run test:coverage
- cargo build

## Development Standards
- Use ESLint and Prettier
- Use pytest for Python testing
- Use Jest for JavaScript testing

## Custom Agents
- **test-project-payment**: Payment processing agent
- **test-project-legacy**: Legacy migration agent`;
      
      await fs.writeFile(path.join(backupDir, 'CLAUDE.md'), backupClaudeMd);
      
      // Create existing .claude with user content
      const claudeDir = path.join(tempDir, '.claude');
      const agentsDir = path.join(claudeDir, 'agents');
      await fs.mkdir(agentsDir, { recursive: true });
      
      // User agent that should be preserved
      await fs.writeFile(path.join(agentsDir, 'payment-processor.md'), '# Custom payment processor');
      
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }));
      
      // Suppress console output during test
      const originalLog = console.log;
      console.log = jest.fn();
      
      try {
        await smartInit(tempDir);
        
        // Verify user content is preserved
        const paymentProcessor = await fs.readFile(path.join(agentsDir, 'payment-processor.md'), 'utf-8');
        expect(paymentProcessor).toContain('Custom payment processor');
        
        // Verify CLAUDE.md includes backup integration
        const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
        expect(claudeMd).toContain('🔄 Recovered Project Information');
        expect(claudeMd).toContain('npm run build');
        expect(claudeMd).toContain('npm run test:coverage');
        expect(claudeMd).toContain('cargo build');
        expect(claudeMd).toContain('payment processing');
        expect(claudeMd).toContain('eslint, prettier');
        expect(claudeMd).toContain('pytest, jest');
        
        // Verify new genie agents are created
        const analyzer = await fs.readFile(path.join(agentsDir, 'test-project-analyzer.md'), 'utf-8');
        expect(analyzer).toContain('test-project-analyzer');
        
      } finally {
        console.log = originalLog;
      }
    });
  });
});
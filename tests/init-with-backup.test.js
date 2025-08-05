const { init } = require('../lib/init.js');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('Initialization with Backup Integration', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'init-backup-test-'));
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should integrate backup information into new CLAUDE.md', async () => {
    // Create a backup directory with CLAUDE.md
    const backupDir = path.join(tempDir, '.claude.backup-2024-01-01T00-00-00-000Z');
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupClaudeMd = `# Test Project - Previous Configuration

**Project**: test-project
**Initialized**: 2024-01-01T10:00:00Z
**Path**: /path/to/project

This is a test project for authentication services.

## Build Commands
- npm run build
- npm run test
- npm run lint

## Development Standards
- Use ESLint for JavaScript linting
- Use Prettier for code formatting
- Jest for unit testing
- Cypress for e2e testing

## Custom Agents
- **test-project-genie-analyzer**: Custom analysis
- **test-project-genie-payment**: Payment processing agent

## Development Workflow
Follow TDD practices:
1. Write failing tests first
2. Implement minimal code
3. Refactor while keeping tests green
    `;
    
    await fs.writeFile(path.join(backupDir, 'CLAUDE.md'), backupClaudeMd);
    
    // Create package.json for project name detection
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
      name: 'test-backup-project',
      version: '1.0.0'
    }));
    
    // Suppress console output during test
    const originalLog = console.log;
    console.log = jest.fn();
    
    try {
      // Run initialization
      await init(tempDir);
      
      // Check that CLAUDE.md was created with backup integration
      const claudeMdPath = path.join(tempDir, 'CLAUDE.md');
      const claudeMdContent = await fs.readFile(claudeMdPath, 'utf-8');
      
      // Verify backup information is integrated
      expect(claudeMdContent).toContain('🔄 Recovered Project Information');
      expect(claudeMdContent).toContain('npm run build');
      expect(claudeMdContent).toContain('npm run test');
      expect(claudeMdContent).toContain('eslint, prettier');
      expect(claudeMdContent).toContain('jest, cypress');
      expect(claudeMdContent).toContain('test-project-genie-analyzer');
      expect(claudeMdContent).toContain('test-project-genie-payment');
      expect(claudeMdContent).toContain('2024-01-01T10:00:00Z');
      expect(claudeMdContent).toContain('This is a test project for authentication services');
      expect(claudeMdContent).toContain('Enhanced Configuration');
      
      // Verify that project-specific agents were created
      const agentsDir = path.join(tempDir, '.claude', 'agents');
      const agentFiles = await fs.readdir(agentsDir);
      
      expect(agentFiles).toContain('test-backup-project-genie-analyzer.md');
      expect(agentFiles).toContain('test-backup-project-genie-dev-coder.md');
      expect(agentFiles).toContain('test-backup-project-genie-dev-planner.md');
      
    } finally {
      console.log = originalLog;
    }
  });

  test('should handle initialization without backup directories', async () => {
    // Create package.json
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
      name: 'test-clean-project',
      version: '1.0.0'
    }));
    
    // Suppress console output during test
    const originalLog = console.log;
    console.log = jest.fn();
    
    try {
      // Run initialization
      await init(tempDir);
      
      // Check that CLAUDE.md was created without backup integration
      const claudeMdPath = path.join(tempDir, 'CLAUDE.md');
      const claudeMdContent = await fs.readFile(claudeMdPath, 'utf-8');
      
      // Verify no backup information
      expect(claudeMdContent).not.toContain('🔄 Recovered Project Information');
      expect(claudeMdContent).not.toContain('Enhanced Configuration');
      expect(claudeMdContent).toContain('test-clean-project');
      expect(claudeMdContent).toContain('GENIE PERSONALITY CORE');
      
    } finally {
      console.log = originalLog;
    }
  });

  test('should handle corrupt backup files gracefully', async () => {
    // Create a backup directory with corrupt CLAUDE.md
    const backupDir = path.join(tempDir, '.claude.backup-2024-01-01T00-00-00-000Z');
    await fs.mkdir(backupDir, { recursive: true });
    
    // Create a binary/corrupt file
    await fs.writeFile(path.join(backupDir, 'CLAUDE.md'), Buffer.from([0x00, 0x01, 0x02, 0x03]));
    
    // Create package.json
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
      name: 'test-corrupt-backup',
      version: '1.0.0'
    }));
    
    // Suppress console output during test
    const originalLog = console.log;
    console.log = jest.fn();
    
    try {
      // Should not throw and should complete initialization
      await init(tempDir);
      
      // Check that CLAUDE.md was created (without backup integration due to corruption)
      const claudeMdPath = path.join(tempDir, 'CLAUDE.md');
      const claudeMdContent = await fs.readFile(claudeMdPath, 'utf-8');
      
      expect(claudeMdContent).toContain('test-corrupt-backup');
      expect(claudeMdContent).toContain('GENIE PERSONALITY CORE');
      
    } finally {
      console.log = originalLog;
    }
  });

  test('should prioritize most recent backup when multiple exist', async () => {
    // Create multiple backup directories
    const backup1 = path.join(tempDir, '.claude.backup-2024-01-01T00-00-00-000Z');
    const backup2 = path.join(tempDir, '.claude.backup-2024-01-02T00-00-00-000Z');
    
    await fs.mkdir(backup1, { recursive: true });
    await fs.mkdir(backup2, { recursive: true });
    
    // Older backup
    await fs.writeFile(path.join(backup1, 'CLAUDE.md'), `
**Initialized**: 2024-01-01T10:00:00Z
Old project description.
- npm run old-command
    `);
    
    // Newer backup  
    await fs.writeFile(path.join(backup2, 'CLAUDE.md'), `
**Initialized**: 2024-01-02T10:00:00Z
New project description with updated info.
- npm run new-command
    `);
    
    // Create package.json
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
      name: 'test-multi-backup',
      version: '1.0.0'  
    }));
    
    // Suppress console output during test
    const originalLog = console.log;
    console.log = jest.fn();
    
    try {
      await init(tempDir);
      
      const claudeMdContent = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
      
      // Should contain both commands but prefer newer timestamp and description
      expect(claudeMdContent).toContain('npm run old-command');
      expect(claudeMdContent).toContain('npm run new-command');
      expect(claudeMdContent).toContain('New project description with updated info');
      // The first timestamp found should be preserved (based on directory order)
      
    } finally {
      console.log = originalLog;
    }
  });
});
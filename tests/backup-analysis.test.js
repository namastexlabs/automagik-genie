const { parseBackupClaude, analyzeBackupClaude } = require('../lib/init.js');
const { generateBackupRecoveredSection } = require('../lib/template-processor.js');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('Backup Analysis', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-analysis-test-'));
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('parseBackupClaude', () => {
    test('should extract build commands from backup content', async () => {
      const backupContent = `
# My Project

## Build Commands
- npm run build
- npm run test
- make install

## Testing
We use jest for testing.
      `;
      
      const result = await parseBackupClaude(backupContent);
      
      expect(result.buildCommands).toContain('npm run build');
      expect(result.buildCommands).toContain('npm run test');
      expect(result.buildCommands).toContain('make install');
      expect(result.testingFrameworks).toContain('jest');
    });

    test('should extract custom agents from backup content', async () => {
      const backupContent = `
# Project Configuration

## Available Agents
- **myproject-genie-analyzer**: Analysis specialist
- **myproject-genie-dev-coder**: Implementation specialist
- **custom-payment-agent**: Payment processing
      `;
      
      const result = await parseBackupClaude(backupContent);
      
      expect(result.customAgents).toContain('myproject-genie-analyzer');
      expect(result.customAgents).toContain('myproject-genie-dev-coder');
    });

    test('should extract code style preferences', async () => {
      const backupContent = `
# Code Quality

Use eslint for JavaScript linting and prettier for formatting.
Python code should use ruff and black for consistency.
      `;
      
      const result = await parseBackupClaude(backupContent);
      
      expect(result.codeStylePrefs).toContain('eslint');
      expect(result.codeStylePrefs).toContain('prettier');
      expect(result.codeStylePrefs).toContain('ruff');
      expect(result.codeStylePrefs).toContain('black');
    });

    test('should extract original timestamp', async () => {
      const backupContent = `
**Initialized**: 2024-01-15T10:30:00Z
**Project**: test-project
      `;
      
      const result = await parseBackupClaude(backupContent);
      
      expect(result.originalTimestamp).toBe('2024-01-15T10:30:00Z');
    });

    test('should preserve development sections', async () => {
      const backupContent = `
# Development Workflow

## Build Process
1. Run tests
2. Build application
3. Deploy to staging

## Code Standards
- Use TypeScript
- Follow ESLint rules
      `;
      
      const result = await parseBackupClaude(backupContent);
      
      expect(Object.keys(result.preservedSections)).toContain('# development workflow');
    });
  });

  describe('analyzeBackupClaude', () => {
    test('should handle project with no backup directories', async () => {
      const result = await analyzeBackupClaude(tempDir);
      
      expect(result.buildCommands).toEqual([]);
      expect(result.testingFrameworks).toEqual([]);
      expect(result.customAgents).toEqual([]);
    });

    test('should analyze multiple backup directories', async () => {
      // Create backup directories
      const backup1 = path.join(tempDir, '.claude.backup-2024-01-01T00-00-00-000Z');
      const backup2 = path.join(tempDir, '.claude.backup-2024-01-02T00-00-00-000Z');
      
      await fs.mkdir(backup1, { recursive: true });
      await fs.mkdir(backup2, { recursive: true });
      
      // Create CLAUDE.md files
      await fs.writeFile(path.join(backup1, 'CLAUDE.md'), `
# Project One
**Initialized**: 2024-01-01T00:00:00Z
- npm run build
- Use jest for testing
      `);
      
      await fs.writeFile(path.join(backup2, 'CLAUDE.md'), `
# Project Two  
- npm run test
- Use pytest for Python testing
      `);
      
      const result = await analyzeBackupClaude(tempDir);
      
      expect(result.buildCommands).toContain('npm run build');
      expect(result.buildCommands).toContain('npm run test');
      expect(result.testingFrameworks).toContain('jest');
      expect(result.testingFrameworks).toContain('pytest');
      expect(result.originalTimestamp).toBe('2024-01-01T00:00:00Z');
    });

    test('should handle malformed CLAUDE.md files gracefully', async () => {
      const backupDir = path.join(tempDir, '.claude.backup-test');
      await fs.mkdir(backupDir, { recursive: true });
      
      // Create a malformed file (e.g., binary content)
      await fs.writeFile(path.join(backupDir, 'CLAUDE.md'), Buffer.from([0x00, 0x01, 0x02, 0x03]));
      
      const result = await analyzeBackupClaude(tempDir);
      
      // Should not throw and should return empty results
      expect(result.buildCommands).toEqual([]);
      expect(result.testingFrameworks).toEqual([]);
    });
  });

  describe('generateBackupRecoveredSection', () => {
    test('should generate empty section for no backup data', () => {
      const emptyAnalysis = {
        buildCommands: [],
        testingFrameworks: [],
        codeStylePrefs: [],
        customAgents: [],
        preservedSections: {}
      };
      
      const result = generateBackupRecoveredSection(emptyAnalysis);
      
      expect(result).toBe('');
    });

    test('should generate comprehensive section for rich backup data', () => {
      const richAnalysis = {
        buildCommands: ['npm run build', 'npm test'],
        testingFrameworks: ['jest', 'cypress'],
        codeStylePrefs: ['eslint', 'prettier'],
        customAgents: ['myproject-genie-analyzer'],
        preservedSections: {
          '# development workflow': 'Custom workflow content here'
        }
      };
      
      const result = generateBackupRecoveredSection(richAnalysis);
      
      expect(result).toContain('## 🔄 Recovered Project Information');
      expect(result).toContain('### 📦 Build & Development Commands');
      expect(result).toContain('- `npm run build`');
      expect(result).toContain('### 🧪 Testing & Quality');
      expect(result).toContain('jest, cypress');
      expect(result).toContain('eslint, prettier');
      expect(result).toContain('### 🤖 Custom Agents Found');
      expect(result).toContain('myproject-genie-analyzer');
      expect(result).toContain('### 📚 Preserved Sections');
      expect(result).toContain('#### # development workflow');
    });

    test('should truncate long preserved sections', () => {
      const longContent = 'a'.repeat(400); // 400 characters
      const analysis = {
        buildCommands: [],
        testingFrameworks: [],
        codeStylePrefs: [],
        customAgents: [],
        preservedSections: {
          '# long section': longContent
        }
      };
      
      const result = generateBackupRecoveredSection(analysis);
      
      expect(result).toContain('...');
      expect(result).toContain('*[Section preserved from backup - full content available in agent memory]*');
    });
  });

  describe('Edge Cases', () => {
    test('should handle duplicate information (deduplication happens at analyzeBackupClaude level)', async () => {
      const backupContent = `
- npm run build
- npm run build  
- Use jest for testing
- jest is our testing framework
      `;
      
      const result = await parseBackupClaude(backupContent);
      
      // parseBackupClaude doesn't deduplicate - that happens at analyzeBackupClaude level
      const buildCount = result.buildCommands.filter(cmd => cmd.includes('npm run build')).length;
      expect(buildCount).toBe(2); // Should be 2 at parse level
      
      const jestCount = result.testingFrameworks.filter(fw => fw === 'jest').length;
      expect(jestCount).toBe(2); // Should be 2 at parse level
    });

    test('should deduplicate at analyzeBackupClaude level', async () => {
      // Create multiple backup directories with duplicate info
      const backup1 = path.join(tempDir, '.claude.backup-1');
      const backup2 = path.join(tempDir, '.claude.backup-2');
      
      await fs.mkdir(backup1, { recursive: true });
      await fs.mkdir(backup2, { recursive: true });
      
      // Both contain same commands
      const duplicateContent = `
- npm run build
- Use jest for testing
      `;
      
      await fs.writeFile(path.join(backup1, 'CLAUDE.md'), duplicateContent);
      await fs.writeFile(path.join(backup2, 'CLAUDE.md'), duplicateContent);
      
      const result = await analyzeBackupClaude(tempDir);
      
      // Should be deduplicated at this level
      const buildCount = result.buildCommands.filter(cmd => cmd.includes('npm run build')).length;
      expect(buildCount).toBe(1);
      
      const jestCount = result.testingFrameworks.filter(fw => fw === 'jest').length;
      expect(jestCount).toBe(1);
    });

    test('should handle mixed case and variations in framework names', async () => {
      const backupContent = `
We use Jest for unit testing and PYTEST for Python tests.
Also using Cargo Test for Rust and Go Test for Go.
      `;
      
      const result = await parseBackupClaude(backupContent);
      
      expect(result.testingFrameworks).toContain('jest');
      expect(result.testingFrameworks).toContain('pytest');
      expect(result.testingFrameworks).toContain('cargo test');
      expect(result.testingFrameworks).toContain('go test');
    });
  });
});
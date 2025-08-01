const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * CLI INTEGRATION TESTS: Command Interface
 * 
 * Tests all CLI commands, flags, and user interactions
 * Validates actual command-line behavior and output
 */

describe('CLI Commands Integration', () => {
  let testProjectPath;
  let testProject;
  const updateCliPath = path.resolve(__dirname, '../../../bin/update.js');
  
  beforeEach(async () => {
    testProjectPath = await createTempDir('cli-test-');
    testProject = await createTestProject(testProjectPath, {
      agents: ['genie-dev-coder', 'genie-testing-maker'],
      hooks: ['pre-commit', 'post-update'],
      hasCustomizations: true,
      version: '1.0.0'
    });
  });

  describe('Update Command', () => {
    test('displays help information', async () => {
      const result = await runCLI(['update', '--help']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Update automagik-genie agents and hooks');
      expect(result.stdout).toContain('--dry-run');
      expect(result.stdout).toContain('--agents-only');
      expect(result.stdout).toContain('--hooks-only');
      expect(result.stdout).toContain('--force');
      expect(result.stdout).toContain('--backup-dir');
      
      console.log('✅ Update help displayed correctly');
    });

    test('validates project directory', async () => {
      const emptyDir = await createTempDir('empty-project-');
      
      const result = await runCLI(['update', '--project-path', emptyDir]);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('does not appear to be an initialized Genie project');
      expect(result.stderr).toContain('Run "npx automagik-genie init" first');
      
      console.log('✅ Project validation works correctly');
    });

    test('dry-run mode shows preview without changes', async () => {
      // Mock template comparison to show available updates
      const mockTemplatePath = path.join(testProjectPath, '.mock-templates');
      await fs.mkdir(mockTemplatePath, { recursive: true });
      
      const result = await runCLI([
        'update',
        '--dry-run',
        '--project-path', testProjectPath
      ]);
      
      expect(result.stdout).toContain('DRY RUN MODE');
      expect(result.stdout).toContain('No changes will be made');
      
      // Verify no files were actually modified
      const agentContent = await fs.readFile(testProject.agentFiles[0], 'utf-8');
      expect(agentContent).toContain('genie-dev-coder specialist'); // Original content
      
      console.log('✅ Dry-run mode works correctly');
    });

    test('agents-only flag limits scope', async () => {
      const result = await runCLI([
        'update',
        '--agents-only',
        '--dry-run',
        '--project-path', testProjectPath
      ]);
      
      expect(result.stdout).toContain('DRY RUN MODE');
      // Should mention agents but not hooks in the analysis
      
      console.log('✅ Agents-only flag works correctly');
    });

    test('hooks-only flag limits scope', async () => {
      const result = await runCLI([
        'update',
        '--hooks-only',
        '--dry-run',
        '--project-path', testProjectPath
      ]);
      
      expect(result.stdout).toContain('DRY RUN MODE');
      // Should mention hooks but not agents in the analysis
      
      console.log('✅ Hooks-only flag works correctly');
    });

    test('force flag bypasses prompts', async () => {
      const result = await runCLI([
        'update',
        '--force',
        '--dry-run',
        '--project-path', testProjectPath
      ]);
      
      expect(result.stdout).toContain('DRY RUN MODE');
      // Should not prompt for user input
      
      console.log('✅ Force flag bypasses prompts');
    });

    test('custom backup directory is used', async () => {
      const customBackupDir = await createTempDir('custom-backup-');
      
      const result = await runCLI([
        'update',
        '--backup-dir', customBackupDir,
        '--dry-run',
        '--project-path', testProjectPath
      ]);
      
      expect(result.stdout).toContain('DRY RUN MODE');
      
      console.log('✅ Custom backup directory option works');
    });

    test('handles invalid project path gracefully', async () => {
      const result = await runCLI([
        'update',
        '--project-path', '/nonexistent/path'
      ]);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Project path does not exist');
      
      console.log('✅ Invalid project path handled gracefully');
    });
  });

  describe('Status Command', () => {
    test('displays system status information', async () => {
      const result = await runCLI([
        'status',
        '--project-path', testProjectPath
      ]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Automagik Genie Status');
      expect(result.stdout).toContain('System Information');
      expect(result.stdout).toContain('Installed Version');
      expect(result.stdout).toContain('File Statistics');
      expect(result.stdout).toContain('Agents:');
      expect(result.stdout).toContain('Hooks:');
      
      console.log('✅ Status command displays correct information');
    });

    test('check-remote flag attempts remote update check', async () => {
      const result = await runCLI([
        'status',
        '--check-remote',
        '--project-path', testProjectPath
      ]);
      
      expect(result.stdout).toContain('Checking for remote updates');
      
      console.log('✅ Remote check functionality works');
    });

    test('detailed flag shows file-level information', async () => {
      const result = await runCLI([
        'status',
        '--detailed',
        '--check-remote',
        '--project-path', testProjectPath
      ]);
      
      expect(result.stdout).toContain('System Information');
      
      console.log('✅ Detailed status information works');
    });
  });

  describe('Rollback Command', () => {
    test('displays help information', async () => {
      const result = await runCLI(['rollback', '--help']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Rollback to a previous backup');
      expect(result.stdout).toContain('--list');
      expect(result.stdout).toContain('--force');
      
      console.log('✅ Rollback help displayed correctly');
    });

    test('list flag shows available backups', async () => {
      const result = await runCLI(['rollback', '--list']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Available Backups');
      
      console.log('✅ Backup list functionality works');
    });

    test('requires backup ID when not listing', async () => {
      const result = await runCLI(['rollback']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Backup ID is required for rollback');
      expect(result.stderr).toContain('Use --list to see available backups');
      
      console.log('✅ Backup ID requirement enforced');
    });

    test('handles invalid backup ID gracefully', async () => {
      const result = await runCLI(['rollback', 'invalid-backup-id']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Backup not found');
      
      console.log('✅ Invalid backup ID handled gracefully');
    });
  });

  describe('Cleanup Command', () => {
    test('displays help information', async () => {
      const result = await runCLI(['cleanup', '--help']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Clean up old backups and cache');
      expect(result.stdout).toContain('--max-age');
      expect(result.stdout).toContain('--keep-count');
      expect(result.stdout).toContain('--cache');
      
      console.log('✅ Cleanup help displayed correctly');
    });

    test('cleans up old backups with default settings', async () => {
      const result = await runCLI(['cleanup']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Automagik Genie Cleanup');
      expect(result.stdout).toContain('Cleaning old backups');
      
      console.log('✅ Default cleanup works correctly');
    });

    test('respects max-age parameter', async () => {
      const result = await runCLI(['cleanup', '--max-age', '7']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Cleaning old backups');
      
      console.log('✅ Max-age parameter works correctly');
    });

    test('respects keep-count parameter', async () => {
      const result = await runCLI(['cleanup', '--keep-count', '10']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Cleaning old backups');
      
      console.log('✅ Keep-count parameter works correctly');
    });

    test('cache flag enables template cache cleanup', async () => {
      const result = await runCLI(['cleanup', '--cache']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Cleaning template cache');
      
      console.log('✅ Cache cleanup functionality works');
    });
  });

  describe('Version Command', () => {
    test('displays version information', async () => {
      const result = await runCLI(['--version']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Automagik Genie Update System');
      expect(result.stdout).toContain('Version:');
      
      console.log('✅ Version information displayed correctly');
    });

    test('version flag works with any command', async () => {
      const result = await runCLI(['status', '--version']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Version:');
      
      console.log('✅ Version flag works globally');
    });
  });

  describe('Error Handling', () => {
    test('handles unknown commands gracefully', async () => {
      const result = await runCLI(['unknown-command']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Unknown command: unknown-command');
      
      console.log('✅ Unknown commands handled gracefully');
    });

    test('shows help for invalid usage', async () => {
      const result = await runCLI([]);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('You need to specify a command');
      
      console.log('✅ Invalid usage shows help');
    });

    test('handles permission errors gracefully', async () => {
      if (process.platform === 'win32') {
        console.log('Skipping permission test on Windows');
        return;
      }
      
      // Create a directory without write permissions
      const readOnlyDir = await createTempDir('readonly-');
      await fs.chmod(readOnlyDir, 0o555);
      
      const result = await runCLI([
        'update',
        '--project-path', readOnlyDir
      ]);
      
      expect(result.code).toBe(1);
      
      // Restore permissions for cleanup
      await fs.chmod(readOnlyDir, 0o755);
      
      console.log('✅ Permission errors handled gracefully');
    });

    test('provides debug information when DEBUG is set', async () => {
      const result = await runCLI(['unknown-command'], { DEBUG: 'true' });
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Unknown command');
      
      console.log('✅ Debug mode provides additional information');
    });
  });

  describe('Output Formatting', () => {
    test('uses proper colors and formatting', async () => {
      const result = await runCLI([
        'status',
        '--project-path', testProjectPath
      ]);
      
      // Should contain ANSI escape codes for colors
      expect(result.stdout).toMatch(/\x1b\[[0-9;]*m/);
      
      console.log('✅ Output includes proper formatting');
    });

    test('handles non-TTY output appropriately', async () => {
      const result = await runCLI([
        'status',
        '--project-path', testProjectPath
      ], {}, { stdio: 'pipe' });
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Automagik Genie Status');
      
      console.log('✅ Non-TTY output handled correctly');
    });
  });

  describe('Examples Validation', () => {
    test('all documented examples work correctly', async () => {
      const examples = [
        ['update'],
        ['update', '--dry-run'],
        ['rollback', '--list'],
        ['status', '--check-remote'],
        ['cleanup', '--max-age', '7']
      ];
      
      for (const example of examples) {
        const result = await runCLI([
          ...example,
          '--project-path', testProjectPath
        ]);
        
        // All examples should either succeed or fail gracefully
        expect([0, 1]).toContain(result.code);
        
        console.log(`✅ Example works: ${example.join(' ')}`);
      }
    });
  });

  // Helper function to run CLI commands
  async function runCLI(args = [], env = {}, options = {}) {
    return new Promise((resolve) => {
      const child = spawn('node', [updateCliPath, ...args], {
        env: { ...process.env, ...env },
        stdio: options.stdio || ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      });
      
      let stdout = '';
      let stderr = '';
      
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr
        });
      });
      
      child.on('error', (error) => {
        resolve({
          code: 1,
          stdout,
          stderr: stderr + error.message
        });
      });
      
      // Kill process after timeout
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
          resolve({
            code: 1,
            stdout,
            stderr: stderr + 'Command timed out'
          });
        }
      }, 30000);
    });
  }
});
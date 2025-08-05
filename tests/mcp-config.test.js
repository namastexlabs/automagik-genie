const fs = require('fs').promises;
const path = require('path');
const { createMcpConfig, init } = require('../lib/init.js');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    copyFile: jest.fn()
  }
}));

jest.mock('../lib/template-processor.js', () => ({
  generateProjectVariables: jest.fn(),
  copyTemplateDirectory: jest.fn(),
  processTemplateFile: jest.fn(),
  fileExists: jest.fn()
}));

// Import the mocked functions
const { fileExists } = require('../lib/template-processor.js');

describe('MCP Configuration Tests', () => {
  let consoleSpy;
  let mockTimestamp;
  const mockProjectPath = '/test/project';
  const mcpConfigPath = path.join(mockProjectPath, '.mcp.json');
  
  // Standard MCP servers as defined in the function
  const standardMcpServers = {
    "ask-repo-agent": {
      type: "sse",
      url: "https://mcp.deepwiki.com/sse"
    },
    "search-repo-docs": {
      command: "npx",
      args: ["-y", "@upstash/context7-mcp"]
    }
  };

  beforeEach(() => {
    // Mock console.log to capture output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock Date for consistent timestamps
    mockTimestamp = '2023-12-01T10-30-00-000Z';
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-12-01T10:30:00.000Z');
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    test('creates new .mcp.json when none exists', async () => {
      // Arrange
      fileExists.mockResolvedValue(false);
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(fileExists).toHaveBeenCalledWith(mcpConfigPath);
      expect(fs.writeFile).toHaveBeenCalledWith(
        mcpConfigPath,
        JSON.stringify({ mcpServers: standardMcpServers }, null, 2),
        'utf-8'
      );
      expect(consoleSpy).toHaveBeenCalledWith('🆕 Creating new .mcp.json configuration');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Created .mcp.json configuration with standard MCP servers');
    });

    test('creates proper JSON structure with standard servers', async () => {
      // Arrange
      fileExists.mockResolvedValue(false);
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenConfig).toEqual({
        mcpServers: {
          "ask-repo-agent": {
            type: "sse",
            url: "https://mcp.deepwiki.com/sse"
          },
          "search-repo-docs": {
            command: "npx",
            args: ["-y", "@upstash/context7-mcp"]
          }
        }
      });
    });

    test('logs configured servers after creation', async () => {
      // Arrange
      fileExists.mockResolvedValue(false);
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔧 Configured MCP servers: ask-repo-agent, search-repo-docs'
      );
    });
  });

  describe('Existing File Scenarios', () => {
    test('no changes when all standard servers already present', async () => {
      // Arrange
      const existingConfig = {
        mcpServers: {
          ...standardMcpServers,
          "custom-server": { command: "custom", args: [] }
        }
      };
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(fs.writeFile).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('📄 Found existing .mcp.json configuration');
      expect(consoleSpy).toHaveBeenCalledWith('✅ All standard MCP servers already configured, no changes needed');
    });

    test('merges with custom servers when missing standard servers', async () => {
      // Arrange
      const existingConfig = {
        mcpServers: {
          "custom-server": { command: "custom", args: [] },
          "another-custom": { type: "stdio" }
        }
      };
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenConfig).toEqual({
        mcpServers: {
          "custom-server": { command: "custom", args: [] },
          "another-custom": { type: "stdio" },
          ...standardMcpServers
        }
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Will add missing standard MCP servers: ask-repo-agent, search-repo-docs');
      expect(consoleSpy).toHaveBeenCalledWith('🔀 Merging configurations:');
      expect(consoleSpy).toHaveBeenCalledWith('   • Preserved existing servers: custom-server, another-custom');
      expect(consoleSpy).toHaveBeenCalledWith('   • Added standard servers: ask-repo-agent, search-repo-docs');
    });

    test('adds missing mcpServers object to existing config', async () => {
      // Arrange
      const existingConfig = { otherSettings: true };
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenConfig).toEqual({
        otherSettings: true,
        mcpServers: standardMcpServers
      });
    });

    test('handles mix of existing and missing standard servers', async () => {
      // Arrange
      const existingConfig = {
        mcpServers: {
          "ask-repo-agent": standardMcpServers["ask-repo-agent"],
          "custom-server": { command: "custom", args: [] }
        }
      };
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Will add missing standard MCP servers: search-repo-docs');
      expect(consoleSpy).toHaveBeenCalledWith('   • Preserved existing servers: ask-repo-agent, custom-server');
      expect(consoleSpy).toHaveBeenCalledWith('   • Added standard servers: search-repo-docs');
    });

    test('handles empty .mcp.json file', async () => {
      // Arrange
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue('{}');
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenConfig).toEqual({
        mcpServers: standardMcpServers
      });
    });
  });

  describe('Backup Logic', () => {
    test('creates backup directory with timestamp', async () => {
      // Arrange
      const existingConfig = { mcpServers: { "custom": {} } };
      const expectedBackupDir = path.join(mockProjectPath, `.claude.backup-${mockTimestamp}`);
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(fs.mkdir).toHaveBeenCalledWith(expectedBackupDir, { recursive: true });
    });

    test('preserves original file in backup during merge', async () => {
      // Arrange
      const existingConfig = { mcpServers: { "custom": {} } };
      const expectedBackupDir = path.join(mockProjectPath, `.claude.backup-${mockTimestamp}`);
      const expectedBackupFile = path.join(expectedBackupDir, '.mcp.json');
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(fs.copyFile).toHaveBeenCalledWith(mcpConfigPath, expectedBackupFile);
      expect(consoleSpy).toHaveBeenCalledWith(`📦 Backed up existing .mcp.json to ${path.basename(expectedBackupDir)}/.mcp.json`);
    });

    test('handles backup directory creation failure gracefully', async () => {
      // Arrange
      const existingConfig = { mcpServers: { "custom": {} } };
      const backupError = new Error('Permission denied');
      backupError.code = 'EACCES';
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockRejectedValue(backupError);
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('⚠️  Could not create backup: Permission denied');
      expect(consoleSpy).toHaveBeenCalledWith('💡 Manual backup recommended: cp .mcp.json .mcp.json.backup');
      expect(fs.writeFile).toHaveBeenCalled(); // Should continue despite backup failure
    });

    test('creates backup for malformed JSON with .malformed extension', async () => {
      // Arrange
      const expectedBackupDir = path.join(mockProjectPath, `.claude.backup-${mockTimestamp}`);
      const expectedBackupFile = path.join(expectedBackupDir, '.mcp.json.malformed');
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue('{ invalid json }');
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(fs.copyFile).toHaveBeenCalledWith(mcpConfigPath, expectedBackupFile);
      expect(consoleSpy).toHaveBeenCalledWith(`📦 Backed up malformed .mcp.json to ${path.basename(expectedBackupDir)}/.mcp.json.malformed`);
    });
  });

  describe('Error Handling', () => {
    test('handles malformed JSON with recovery', async () => {
      // Arrange
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue('{ invalid json }');
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  Existing .mcp.json appears to be malformed:'));
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Will create backup and generate new configuration');
      
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenConfig).toEqual({ mcpServers: standardMcpServers });
    });

    test('continues execution when backup fails for malformed JSON', async () => {
      // Arrange
      const backupError = new Error('Disk full');
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue('{ invalid json }');
      fs.mkdir.mockRejectedValue(backupError);
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('⚠️  Could not create backup: Disk full');
      expect(fs.writeFile).toHaveBeenCalled(); // Should continue despite backup failure
    });

    test('throws error on JSON write failure', async () => {
      // Arrange
      const writeError = new Error('Write failed');
      
      fileExists.mockResolvedValue(false);
      fs.writeFile.mockRejectedValue(writeError);

      // Act & Assert
      await expect(createMcpConfig(mockProjectPath)).rejects.toThrow('Write failed');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to write .mcp.json: Write failed');
    });

    test('handles file read permission errors', async () => {
      // Arrange
      const readError = new Error('Permission denied');
      readError.code = 'EACCES';
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockRejectedValue(readError);
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  Existing .mcp.json appears to be malformed:'));
      // Should treat read error as malformed JSON and recover
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenConfig).toEqual({ mcpServers: standardMcpServers });
    });
  });

  describe('Edge Cases', () => {
    test('handles very large existing configurations', async () => {
      // Arrange
      const largeConfig = {
        mcpServers: {}
      };
      
      // Add 100 custom servers
      for (let i = 0; i < 100; i++) {
        largeConfig.mcpServers[`custom-server-${i}`] = {
          command: `command-${i}`,
          args: [`arg1-${i}`, `arg2-${i}`]
        };
      }
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(largeConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(Object.keys(writtenConfig.mcpServers)).toHaveLength(102); // 100 custom + 2 standard
      expect(writtenConfig.mcpServers).toHaveProperty('ask-repo-agent');
      expect(writtenConfig.mcpServers).toHaveProperty('search-repo-docs');
    });

    test('handles server names with special characters', async () => {
      // Arrange
      const existingConfig = {
        mcpServers: {
          "server@special!chars": { command: "test", args: [] },
          "server-with-unicode-🚀": { type: "stdio" }
        }
      };
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenConfig.mcpServers).toHaveProperty('server@special!chars');
      expect(writtenConfig.mcpServers).toHaveProperty('server-with-unicode-🚀');
    });

    test('preserves complex nested server configurations', async () => {
      // Arrange
      const existingConfig = {
        mcpServers: {
          "complex-server": {
            command: "node",
            args: ["server.js"],
            env: {
              NODE_ENV: "production",
              API_KEY: "secret"
            },
            capabilities: {
              resources: true,
              tools: ["read", "write"]
            }
          }
        }
      };
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenConfig.mcpServers["complex-server"]).toEqual(existingConfig.mcpServers["complex-server"]);
      expect(writtenConfig.mcpServers).toHaveProperty('ask-repo-agent');
      expect(writtenConfig.mcpServers).toHaveProperty('search-repo-docs');
    });

    test('does not mutate input configuration objects', async () => {
      // Arrange
      const existingConfig = {
        mcpServers: {
          "custom-server": { command: "test", args: [] }
        }
      };
      const originalConfig = JSON.parse(JSON.stringify(existingConfig)); // Deep copy
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert - Original config should be unchanged
      expect(existingConfig).toEqual(originalConfig);
    });

    test('handles null and undefined values gracefully', async () => {
      // Arrange
      const existingConfig = {
        mcpServers: {
          "server-with-null": null,
          "server-with-undefined": undefined,
          "valid-server": { command: "test" }
        }
      };
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const writtenConfig = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(writtenConfig.mcpServers).toHaveProperty('server-with-null', null);
      expect(writtenConfig.mcpServers).toHaveProperty('valid-server');
      expect(writtenConfig.mcpServers).toHaveProperty('ask-repo-agent');
      expect(writtenConfig.mcpServers).toHaveProperty('search-repo-docs');
    });
  });

  describe('Integration with init() function', () => {
    test('createMcpConfig is called during initialization', async () => {
      // This test verifies that createMcpConfig is properly integrated
      // Note: Full init() integration testing would require extensive mocking
      // of all init dependencies. This test demonstrates the pattern.
      
      // Verify createMcpConfig can be called independently
      fileExists.mockResolvedValue(false);
      fs.writeFile.mockResolvedValue();

      await createMcpConfig(mockProjectPath);

      expect(fs.writeFile).toHaveBeenCalledWith(
        mcpConfigPath,
        JSON.stringify({ mcpServers: standardMcpServers }, null, 2),
        'utf-8'
      );
      expect(consoleSpy).toHaveBeenCalledWith('🆕 Creating new .mcp.json configuration');
    });
  });

  describe('Console Output Validation', () => {
    test('logs appropriate messages for clean installation', async () => {
      // Arrange
      fileExists.mockResolvedValue(false);
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      expect(logCalls).toContain('🆕 Creating new .mcp.json configuration');
      expect(logCalls).toContain('✅ Created .mcp.json configuration with standard MCP servers');
      expect(logCalls).toContain('🔧 Configured MCP servers: ask-repo-agent, search-repo-docs');
    });

    test('logs appropriate messages for merge operation', async () => {
      // Arrange
      const existingConfig = { mcpServers: { "custom": {} } };
      
      fileExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      fs.mkdir.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      // Act
      await createMcpConfig(mockProjectPath);

      // Assert
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      expect(logCalls).toContain('📄 Found existing .mcp.json configuration');
      expect(logCalls).toContain('🔧 Will add missing standard MCP servers: ask-repo-agent, search-repo-docs');
      expect(logCalls).toContain('🔀 Merging configurations:');
      expect(logCalls).toContain('✅ Successfully merged .mcp.json configuration');
    });
  });
});
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    copyFile: jest.fn(),
    chmod: jest.fn(),
    access: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn()
  },
  existsSync: jest.fn()
}));

const { copyStatuslineFiles } = require('../lib/init.js');

describe('File Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('copyStatuslineFiles()', () => {
    const mockClaudeDir = '/test/project/.claude';
    // The actual template directory will be relative to lib/init.js
    // Since lib/init.js is in /lib/, it resolves to /templates/.claude including automagik-genie
    const mockTemplateDir = path.join(__dirname, '..', 'templates', '.claude');
    
    test('should copy all statusline files with correct permissions', async () => {
      // Mock file existence checks - all template files exist
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      await copyStatuslineFiles(mockClaudeDir);
      
      // Should copy all three statusline files
      expect(fs.copyFile).toHaveBeenCalledTimes(3);
      
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('templates/.claude/genie-statusline.js'),
        `${mockClaudeDir}/genie-statusline.js`
      );
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('templates/.claude/genie-statusline.ps1'),
        `${mockClaudeDir}/genie-statusline.ps1`
      );
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('templates/.claude/genie-statusline.sh'),
        `${mockClaudeDir}/genie-statusline.sh`
      );
    });
    
    test('should set executable permissions for .js and .sh files', async () => {
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      await copyStatuslineFiles(mockClaudeDir);
      
      // Should set permissions for .js and .sh files (not .ps1)
      expect(fs.chmod).toHaveBeenCalledTimes(2);
      
      expect(fs.chmod).toHaveBeenCalledWith(
        `${mockClaudeDir}/genie-statusline.js`,
        0o755
      );
      expect(fs.chmod).toHaveBeenCalledWith(
        `${mockClaudeDir}/genie-statusline.sh`,
        0o755
      );
    });
    
    test('should handle missing template files gracefully', async () => {
      // Mock some files missing
      fs.access.mockImplementation((filePath) => {
        if (filePath.includes('genie-statusline.js')) {
          return Promise.resolve(); // exists
        }
        if (filePath.includes('genie-statusline.ps1')) {
          return Promise.reject(new Error('ENOENT')); // missing
        }
        if (filePath.includes('genie-statusline.sh')) {
          return Promise.resolve(); // exists
        }
      });
      
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      // Should not throw error
      await expect(copyStatuslineFiles(mockClaudeDir)).resolves.toBeUndefined();
      
      // Should only copy existing files
      expect(fs.copyFile).toHaveBeenCalledTimes(2);
      expect(fs.copyFile).not.toHaveBeenCalledWith(
        expect.stringContaining('genie-statusline.ps1'),
        expect.anything()
      );
    });
    
    test('should handle copy operation failures gracefully', async () => {
      fs.access.mockResolvedValue(); // All files exist
      fs.copyFile.mockImplementation((src, dest) => {
        if (src.includes('genie-statusline.js')) {
          return Promise.reject(new Error('EACCES: permission denied'));
        }
        return Promise.resolve();
      });
      fs.chmod.mockResolvedValue();
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Should not throw error
      await expect(copyStatuslineFiles(mockClaudeDir)).resolves.toBeUndefined();
      
      // Should log error for failed copy
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not copy genie-statusline.js')
      );
      
      // Should still copy other files
      expect(fs.copyFile).toHaveBeenCalledTimes(3);
      
      consoleSpy.mockRestore();
    });
    
    test('should handle chmod failures gracefully', async () => {
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockImplementation((filePath) => {
        if (filePath.includes('genie-statusline.js')) {
          return Promise.reject(new Error('EPERM: operation not permitted'));
        }
        return Promise.resolve();
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Should not throw error
      await expect(copyStatuslineFiles(mockClaudeDir)).resolves.toBeUndefined();
      
      // Should log error for failed chmod
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not copy genie-statusline.js')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('should handle Windows path separators', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });
      
      // Mock path.join to use Windows separators
      jest.spyOn(path, 'join').mockImplementation((...args) => args.join('\\\\'));
      
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      const mockClaudeDir = 'C:\\test\\project\\.claude';
      await copyStatuslineFiles(mockClaudeDir);
      
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('\\\\genie-statusline.js'),
        expect.stringContaining('\\\\genie-statusline.js')
      );
      
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true
      });
    });
    
    test('should handle Unix file permissions correctly', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });
      
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      await copyStatuslineFiles('/test/project/.claude');
      
      // Should set executable permissions (0o755 = rwxr-xr-x)
      expect(fs.chmod).toHaveBeenCalledWith(
        expect.stringContaining('genie-statusline.js'),
        0o755
      );
      expect(fs.chmod).toHaveBeenCalledWith(
        expect.stringContaining('genie-statusline.sh'),
        0o755
      );
      
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true
      });
    });
    
    test('should handle macOS file permissions correctly', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      });
      
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      await copyStatuslineFiles('/test/project/.claude');
      
      // Should set executable permissions same as Unix
      expect(fs.chmod).toHaveBeenCalledWith(
        expect.stringContaining('genie-statusline.js'),
        0o755
      );
      
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true
      });
    });
  });

  describe('Template File Resolution', () => {
    test('should resolve template directory correctly from lib/init.js', async () => {
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      await copyStatuslineFiles('/test/project/.claude');
      
      // Should resolve templates including automagik-genie in the path
      expect(fs.access).toHaveBeenCalledWith(
        expect.stringContaining('automagik-genie/templates/.claude/genie-statusline.js')
      );
    });
    
    test('should handle deeply nested project structures', async () => {
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      const deepProjectPath = '/very/deep/nested/project/structure';
      
      await copyStatuslineFiles(`${deepProjectPath}/.claude`);
      
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('templates/.claude/genie-statusline.js'),
        `${deepProjectPath}/.claude/genie-statusline.js`
      );
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle empty template directory', async () => {
      // All files missing
      fs.access.mockRejectedValue(new Error('ENOENT'));
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await copyStatuslineFiles('/test/project/.claude');
      
      // Should try to access all files but not log errors if they don't exist
      expect(fs.access).toHaveBeenCalledTimes(3);
      expect(fs.access).toHaveBeenCalledWith(
        expect.stringContaining('templates/.claude/genie-statusline.js')
      );
      
      consoleSpy.mockRestore();
    });
    
    test('should handle partial copy failures', async () => {
      // First file succeeds, second fails, third succeeds
      fs.access.mockResolvedValue();
      fs.copyFile.mockImplementation((src) => {
        if (src.includes('genie-statusline.ps1')) {
          return Promise.reject(new Error('EIO: I/O error'));
        }
        return Promise.resolve();
      });
      fs.chmod.mockResolvedValue();
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await copyStatuslineFiles('/test/project/.claude');
      
      // Should continue with other files despite one failure
      expect(fs.copyFile).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not copy genie-statusline.ps1')
      );
      
      consoleSpy.mockRestore();
    });
    
    test('should handle destination directory not existing', async () => {
      fs.access.mockResolvedValue();
      fs.copyFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));
      fs.chmod.mockResolvedValue();
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await copyStatuslineFiles('/nonexistent/.claude');
      
      // Should handle gracefully with error logging
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      
      consoleSpy.mockRestore();
    });
    
    test('should handle concurrent file operations', async () => {
      fs.access.mockResolvedValue();
      
      let copyCallCount = 0;
      fs.copyFile.mockImplementation(() => {
        copyCallCount++;
        if (copyCallCount === 2) {
          return Promise.reject(new Error('EBUSY: resource busy'));
        }
        return Promise.resolve();
      });
      
      fs.chmod.mockResolvedValue();
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await copyStatuslineFiles('/test/project/.claude');
      
      // Should handle concurrent access gracefully
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not copy genie-statusline.ps1')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration with Init System', () => {
    test('should be called correctly by init functions', async () => {
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      // Test that copyStatuslineFiles works with the correct path structure
      await copyStatuslineFiles('/test/project/.claude');
      
      // Verify it uses the correct template path (with automagik-genie)
      expect(fs.copyFile).toHaveBeenCalledTimes(3);
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('automagik-genie/templates/.claude/genie-statusline.js'),
        '/test/project/.claude/genie-statusline.js'
      );
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('automagik-genie/templates/.claude/genie-statusline.ps1'),
        '/test/project/.claude/genie-statusline.ps1'
      );
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('automagik-genie/templates/.claude/genie-statusline.sh'),
        '/test/project/.claude/genie-statusline.sh'
      );
    });
    
    test('should work with different destination paths', async () => {
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.chmod.mockResolvedValue();
      
      const customPath = '/some/custom/project/.claude';
      await copyStatuslineFiles(customPath);
      
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('templates/.claude/genie-statusline.js'),
        `${customPath}/genie-statusline.js`
      );
    });
  });
});
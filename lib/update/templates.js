const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { pipeline } = require('stream/promises');
const { createWriteStream, createReadStream } = require('fs');
const os = require('os');

// Optional tar dependency - will be loaded when needed
let tar = null;
try {
  tar = require('tar');
} catch (error) {
  // tar will be loaded dynamically when needed
}

/**
 * TemplateManager - Handles template downloading, caching, and version management
 * Downloads latest templates from GitHub releases and manages local cache
 */
class TemplateManager {
  constructor(cacheDir = null) {
    this.cacheDir = cacheDir || path.join(os.homedir(), '.automagik-genie', 'templates');
    this.githubApi = 'https://api.github.com/repos/namastexlabs/automagik-genie';
    this.githubRaw = 'https://raw.githubusercontent.com/namastexlabs/automagik-genie';
  }

  /**
   * Fetch latest release information from GitHub
   * @returns {Object} Latest release information
   */
  async fetchLatestRelease() {
    try {
      const response = await this.makeHttpRequest(`${this.githubApi}/releases/latest`);
      const release = JSON.parse(response);
      
      return {
        version: release.tag_name,
        name: release.name,
        publishedAt: release.published_at,
        downloadUrl: release.tarball_url,
        zipUrl: release.zipball_url,
        body: release.body
      };
    } catch (error) {
      throw new Error(`Failed to fetch latest release: ${error.message}`);
    }
  }

  /**
   * Download and cache template files for a specific version
   * @param {string} version - Version to download (e.g., 'v1.1.7')
   * @param {boolean} force - Force re-download even if cached
   * @returns {string} Path to cached template directory
   */
  async downloadTemplate(version, force = false) {
    const templatePath = path.join(this.cacheDir, version);
    
    // Return cached version if exists and not forcing
    if (!force && await this.fileExists(templatePath)) {
      return templatePath;
    }

    await fs.mkdir(this.cacheDir, { recursive: true });

    try {
      // Download specific files we need rather than entire repository
      const templateFiles = await this.getTemplateFileList(version);
      const downloadPath = path.join(templatePath, 'files');
      await fs.mkdir(downloadPath, { recursive: true });

      // Download each template file
      for (const file of templateFiles) {
        const fileUrl = `${this.githubRaw}/${version}/${file.path}`;
        const localPath = path.join(downloadPath, file.path);
        
        // Ensure local directory exists
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        
        try {
          const content = await this.makeHttpRequest(fileUrl);
          await fs.writeFile(localPath, content, 'utf-8');
        } catch (fileError) {
          console.warn(`Failed to download ${file.path}: ${fileError.message}`);
        }
      }

      // Create template manifest
      const manifest = {
        version,
        downloadedAt: new Date().toISOString(),
        files: templateFiles,
        path: templatePath
      };

      await fs.writeFile(
        path.join(templatePath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      return templatePath;
    } catch (error) {
      // Cleanup failed download
      try {
        await fs.rmdir(templatePath, { recursive: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw new Error(`Template download failed: ${error.message}`);
    }
  }

  /**
   * Get list of template files to download
   * @param {string} version - Version to get file list for
   * @returns {Array} List of template files
   */
  async getTemplateFileList(version) {
    // Define the files we need to download for updates
    const templateFiles = [
      // Agent templates
      '.claude/agents/genie-analyzer.md',
      '.claude/agents/genie-dev-planner.md',
      '.claude/agents/genie-dev-designer.md', 
      '.claude/agents/genie-dev-coder.md',
      '.claude/agents/genie-dev-fixer.md',
      '.claude/agents/genie-testing-maker.md',
      '.claude/agents/genie-testing-fixer.md',
      '.claude/agents/genie-quality-ruff.md',
      '.claude/agents/genie-quality-mypy.md',
      '.claude/agents/genie-claudemd.md',
      '.claude/agents/genie-clone.md',
      '.claude/agents/genie-agent-creator.md',
      '.claude/agents/genie-agent-enhancer.md',
      
      // Hook examples
      '.claude/hooks/examples/pre-commit.yml',
      '.claude/hooks/examples/post-merge.yml',
      '.claude/hooks/examples/pre-push.yml',
      
      // Core templates
      'templates/CLAUDE.md.template',
      
      // Documentation templates
      'CLAUDE.md'
    ];

    return templateFiles.map(filePath => ({
      path: filePath,
      type: this.getFileType(filePath),
      category: this.getFileCategory(filePath)
    }));
  }

  /**
   * Determine file type from path
   * @param {string} filePath - File path
   * @returns {string} File type
   */
  getFileType(filePath) {
    if (filePath.endsWith('.md')) return 'agent';
    if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) return 'hook';
    if (filePath.includes('template')) return 'template';
    return 'other';
  }

  /**
   * Determine file category from path
   * @param {string} filePath - File path
   * @returns {string} Category
   */
  getFileCategory(filePath) {
    if (filePath.includes('/agents/')) return 'agents';
    if (filePath.includes('/hooks/')) return 'hooks';
    if (filePath.includes('/templates/')) return 'templates';
    return 'core';
  }

  /**
   * Compare current project files with template version
   * @param {string} projectPath - Path to project
   * @param {string} templateVersion - Template version to compare against
   * @returns {Object} Comparison results
   */
  async compareWithTemplate(projectPath, templateVersion) {
    const templatePath = await this.getCachedTemplate(templateVersion);
    if (!templatePath) {
      throw new Error(`Template version ${templateVersion} not found in cache`);
    }

    const manifest = await this.loadTemplateManifest(templatePath);
    const comparison = {
      version: templateVersion,
      files: {
        identical: [],
        different: [],
        missing: [],
        extra: []
      },
      summary: {
        totalFiles: 0,
        identicalCount: 0,
        differentCount: 0,
        missingCount: 0,
        extraCount: 0
      }
    };

    // Check each template file against project
    for (const templateFile of manifest.files) {
      const projectFilePath = path.join(projectPath, templateFile.path);
      const templateFilePath = path.join(templatePath, 'files', templateFile.path);

      comparison.summary.totalFiles++;

      if (await this.fileExists(projectFilePath)) {
        const projectContent = await fs.readFile(projectFilePath, 'utf-8');
        const templateContent = await fs.readFile(templateFilePath, 'utf-8');

        if (this.calculateChecksum(projectContent) === this.calculateChecksum(templateContent)) {
          comparison.files.identical.push({
            path: templateFile.path,
            type: templateFile.type,
            category: templateFile.category
          });
          comparison.summary.identicalCount++;
        } else {
          comparison.files.different.push({
            path: templateFile.path,
            type: templateFile.type,
            category: templateFile.category,
            hasChanges: true
          });
          comparison.summary.differentCount++;
        }
      } else {
        comparison.files.missing.push({
          path: templateFile.path,
          type: templateFile.type,
          category: templateFile.category
        });
        comparison.summary.missingCount++;
      }
    }

    // Check for extra files in project (not in template)
    const extraFiles = await this.findExtraFiles(projectPath, manifest.files);
    comparison.files.extra = extraFiles;
    comparison.summary.extraCount = extraFiles.length;

    return comparison;
  }

  /**
   * Find files in project that don't exist in template
   * @param {string} projectPath - Project path
   * @param {Array} templateFiles - Template file list
   * @returns {Array} Extra files in project
   */
  async findExtraFiles(projectPath, templateFiles) {
    const templatePaths = new Set(templateFiles.map(f => f.path));
    const extraFiles = [];

    const checkDirectory = async (dir, relativePath = '') => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name).replace(/\\/g, '/');

          if (entry.isDirectory()) {
            // Skip certain directories
            if (!['node_modules', '.git', '.venv', '__pycache__'].includes(entry.name)) {
              await checkDirectory(fullPath, relPath);
            }
          } else if (entry.isFile()) {
            // Check if this file should be managed by templates
            if (this.isTemplateManaged(relPath) && !templatePaths.has(relPath)) {
              extraFiles.push({
                path: relPath,
                type: this.getFileType(relPath),
                category: this.getFileCategory(relPath),
                isExtra: true
              });
            }
          }
        }
      } catch (error) {
        // Ignore directories we can't read
      }
    };

    await checkDirectory(projectPath);
    return extraFiles;
  }

  /**
   * Check if a file should be managed by templates
   * @param {string} filePath - File path to check
   * @returns {boolean} True if file should be managed by templates
   */
  isTemplateManaged(filePath) {
    const managedPaths = [
      '.claude/agents/',
      '.claude/hooks/examples/',
      'templates/',
      'CLAUDE.md'
    ];

    return managedPaths.some(managedPath => filePath.startsWith(managedPath));
  }

  /**
   * Get cached template directory
   * @param {string} version - Template version
   * @returns {string|null} Path to cached template or null if not cached
   */
  async getCachedTemplate(version) {
    const templatePath = path.join(this.cacheDir, version);
    
    if (await this.fileExists(templatePath)) {
      return templatePath;
    }
    
    // Try to download if not cached
    try {
      return await this.downloadTemplate(version);
    } catch (error) {
      return null;
    }
  }

  /**
   * Load template manifest from cached template
   * @param {string} templatePath - Path to cached template
   * @returns {Object} Template manifest
   */
  async loadTemplateManifest(templatePath) {
    const manifestPath = path.join(templatePath, 'manifest.json');
    
    if (!await this.fileExists(manifestPath)) {
      throw new Error(`Template manifest not found at ${manifestPath}`);
    }

    const content = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Validate template integrity
   * @param {string} version - Template version to validate
   * @returns {boolean} True if template is valid
   */
  async validateTemplateIntegrity(version) {
    const templatePath = await this.getCachedTemplate(version);
    if (!templatePath) {
      return false;
    }

    try {
      const manifest = await this.loadTemplateManifest(templatePath);
      
      // Check if all files from manifest exist
      for (const file of manifest.files) {
        const filePath = path.join(templatePath, 'files', file.path);
        if (!await this.fileExists(filePath)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear template cache
   * @param {string} version - Specific version to clear, or null for all
   */
  async clearCache(version = null) {
    if (version) {
      const templatePath = path.join(this.cacheDir, version);
      if (await this.fileExists(templatePath)) {
        await fs.rmdir(templatePath, { recursive: true });
      }
    } else {
      if (await this.fileExists(this.cacheDir)) {
        await fs.rmdir(this.cacheDir, { recursive: true });
      }
    }
  }

  /**
   * List cached template versions
   * @returns {Array} List of cached template versions
   */
  async listCachedVersions() {
    try {
      const entries = await fs.readdir(this.cacheDir, { withFileTypes: true });
      const versions = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifestPath = path.join(this.cacheDir, entry.name, 'manifest.json');
          if (await this.fileExists(manifestPath)) {
            try {
              const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
              versions.push({
                version: entry.name,
                downloadedAt: manifest.downloadedAt,
                fileCount: manifest.files.length,
                valid: await this.validateTemplateIntegrity(entry.name)
              });
            } catch (error) {
              versions.push({
                version: entry.name,
                downloadedAt: null,
                fileCount: 0,
                valid: false,
                corrupted: true
              });
            }
          }
        }
      }

      return versions.sort((a, b) => new Date(b.downloadedAt || 0) - new Date(a.downloadedAt || 0));
    } catch (error) {
      return [];
    }
  }

  /**
   * Make HTTP request
   * @param {string} url - URL to request
   * @returns {Promise<string>} Response body
   */
  makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, {
        headers: {
          'User-Agent': 'automagik-genie-updater/1.0'
        }
      }, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          }
        });
      });

      request.on('error', reject);
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Calculate SHA-256 checksum
   * @param {string} content - Content to hash
   */
  calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
  }

  /**
   * Check if file exists
   * @param {string} filePath - Path to check
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { TemplateManager };
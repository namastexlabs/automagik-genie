const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');

/**
 * MetadataManager - Handles agent/hook registry and system metadata
 * Tracks file versions, checksums, and user modifications
 */
class MetadataManager {
  constructor(basePath = null) {
    // Use ~/.automagik-genie as default for global metadata
    this.basePath = basePath || path.join(os.homedir(), '.automagik-genie');
    this.metadataDir = path.join(this.basePath, 'metadata');
    this.agentRegistryPath = path.join(this.metadataDir, 'agent-registry.json');
    this.hookRegistryPath = path.join(this.metadataDir, 'hook-registry.json');
    this.systemVersionPath = path.join(this.metadataDir, 'system-version.json');
  }

  /**
   * Initialize metadata directory structure and default registries
   */
  async initializeRegistries() {
    await this.ensureDirectoryStructure();
    await this.createDefaultRegistries();
  }

  /**
   * Ensure all required directories exist
   */
  async ensureDirectoryStructure() {
    const dirs = [
      this.basePath,
      this.metadataDir,
      path.join(this.basePath, 'backups'),
      path.join(this.basePath, 'templates'),
      path.join(this.basePath, 'update-cache')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Create default registry files if they don't exist
   */
  async createDefaultRegistries() {
    const defaultAgentRegistry = {
      version: '1.0.0',
      lastUpdate: new Date().toISOString(),
      agents: {}
    };

    const defaultHookRegistry = {
      version: '1.0.0',
      lastUpdate: new Date().toISOString(),
      hooks: {}
    };

    const defaultSystemVersion = {
      installedVersion: '1.1.7',
      lastUpdateCheck: new Date().toISOString(),
      updateHistory: []
    };

    // Only create if they don't exist
    if (!await this.fileExists(this.agentRegistryPath)) {
      await fs.writeFile(this.agentRegistryPath, JSON.stringify(defaultAgentRegistry, null, 2));
    }

    if (!await this.fileExists(this.hookRegistryPath)) {
      await fs.writeFile(this.hookRegistryPath, JSON.stringify(defaultHookRegistry, null, 2));
    }

    if (!await this.fileExists(this.systemVersionPath)) {
      await fs.writeFile(this.systemVersionPath, JSON.stringify(defaultSystemVersion, null, 2));
    }
  }

  /**
   * Scan existing .claude directory and populate registries
   * @param {string} projectPath - Path to project with .claude directory
   */
  async scanExistingFiles(projectPath = process.cwd()) {
    const claudeDir = path.join(projectPath, '.claude');
    const agentsDir = path.join(claudeDir, 'agents');
    const hooksDir = path.join(claudeDir, 'hooks', 'examples');

    const agentRegistry = await this.loadAgentRegistry();
    const hookRegistry = await this.loadHookRegistry();

    // Scan agents
    if (await this.fileExists(agentsDir)) {
      const agentFiles = await fs.readdir(agentsDir);
      for (const agentFile of agentFiles) {
        if (agentFile.endsWith('.md')) {
          const agentPath = path.join(agentsDir, agentFile);
          const agentName = path.basename(agentFile, '.md');
          
          const metadata = await this.analyzeFile(agentPath);
          agentRegistry.agents[agentName] = {
            ...metadata,
            filePath: agentPath,
            lastScanned: new Date().toISOString()
          };
        }
      }
    }

    // Scan hooks
    if (await this.fileExists(hooksDir)) {
      const hookFiles = await fs.readdir(hooksDir, { recursive: true });
      for (const hookFile of hookFiles) {
        if (hookFile.endsWith('.yml') || hookFile.endsWith('.yaml')) {
          const hookPath = path.join(hooksDir, hookFile);
          const hookName = hookFile.replace(/\.(yml|yaml)$/, '');
          
          const metadata = await this.analyzeFile(hookPath);
          hookRegistry.hooks[hookName] = {
            ...metadata,
            filePath: hookPath,
            lastScanned: new Date().toISOString()
          };
        }
      }
    }

    // Save updated registries
    await this.saveAgentRegistry(agentRegistry);
    await this.saveHookRegistry(hookRegistry);

    return {
      agentCount: Object.keys(agentRegistry.agents).length,
      hookCount: Object.keys(hookRegistry.hooks).length
    };
  }

  /**
   * Analyze a file and extract metadata
   * @param {string} filePath - Path to file to analyze
   */
  async analyzeFile(filePath) {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const checksum = this.calculateChecksum(content);

    return {
      checksum,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      origin: 'unknown', // Will be determined by template matching
      templateVersion: null,
      userModified: false,
      customSections: []
    };
  }

  /**
   * Calculate SHA-256 checksum of content
   * @param {string} content - File content
   */
  calculateChecksum(content) {
    return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
  }

  /**
   * Update agent registry with new metadata
   * @param {string} agentName - Name of the agent
   * @param {Object} metadata - Metadata to update
   */
  async updateAgentRegistry(agentName, metadata) {
    const registry = await this.loadAgentRegistry();
    
    registry.agents[agentName] = {
      ...registry.agents[agentName],
      ...metadata,
      lastUpdated: new Date().toISOString()
    };

    registry.lastUpdate = new Date().toISOString();
    await this.saveAgentRegistry(registry);
  }

  /**
   * Get agent metadata from registry
   * @param {string} agentName - Name of the agent
   */
  async getAgentMetadata(agentName) {
    const registry = await this.loadAgentRegistry();
    return registry.agents[agentName] || null;
  }

  /**
   * Detect if a file has user modifications compared to template
   * @param {string} filePath - Path to file to check
   */
  async detectUserModifications(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const currentChecksum = this.calculateChecksum(content);
    
    const fileName = path.basename(filePath, '.md');
    const metadata = await this.getAgentMetadata(fileName);
    
    if (!metadata) {
      return {
        isModified: true,
        confidence: 'unknown',
        analysis: 'File not in registry'
      };
    }

    // If checksums differ, file has been modified
    if (metadata.checksum !== currentChecksum) {
      const analysis = await this.analyzeModifications(content, metadata);
      return {
        isModified: true,
        confidence: analysis.confidence,
        analysis: analysis.description,
        customSections: analysis.customSections
      };
    }

    return {
      isModified: false,
      confidence: 'high',
      analysis: 'File matches registry checksum'
    };
  }

  /**
   * Analyze the nature of modifications in a file
   * @param {string} content - Current file content
   * @param {Object} metadata - Stored metadata
   */
  async analyzeModifications(content, metadata) {
    const customSections = [];
    const lines = content.split('\n');
    
    // Look for patterns that indicate user customizations
    const customPatterns = [
      /^## \w+(?:\s+\w+)*$/, // Custom section headers
      /# Custom|# User|# Project/i, // Explicit custom markers
      /TODO:|FIXME:|NOTE:/i, // Development markers
      /\{\{.*\}\}/, // Template variables (might indicate incomplete processing)
    ];

    let customLineCount = 0;
    let inCustomSection = false;
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect section headers
      if (line.startsWith('## ')) {
        currentSection = line.substring(3).trim();
        inCustomSection = false;
      }

      // Check for custom patterns
      for (const pattern of customPatterns) {
        if (pattern.test(line)) {
          customLineCount++;
          if (currentSection && !inCustomSection) {
            customSections.push(currentSection);
            inCustomSection = true;
          }
          break;
        }
      }
    }

    const customPercentage = (customLineCount / lines.length) * 100;
    
    let confidence, description;
    if (customPercentage > 30) {
      confidence = 'high';
      description = 'Significant user modifications detected';
    } else if (customPercentage > 10) {
      confidence = 'medium';
      description = 'Moderate user modifications detected';
    } else {
      confidence = 'low';
      description = 'Minor modifications or formatting changes';
    }

    return {
      confidence,
      description,
      customSections,
      customPercentage: Math.round(customPercentage * 100) / 100
    };
  }

  /**
   * Load agent registry
   */
  async loadAgentRegistry() {
    try {
      const content = await fs.readFile(this.agentRegistryPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Return default if file doesn't exist
      return {
        version: '1.0.0',
        lastUpdate: new Date().toISOString(),
        agents: {}
      };
    }
  }

  /**
   * Save agent registry
   * @param {Object} registry - Registry object to save
   */
  async saveAgentRegistry(registry) {
    await fs.writeFile(this.agentRegistryPath, JSON.stringify(registry, null, 2));
  }

  /**
   * Load hook registry
   */
  async loadHookRegistry() {
    try {
      const content = await fs.readFile(this.hookRegistryPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return {
        version: '1.0.0',
        lastUpdate: new Date().toISOString(),
        hooks: {}
      };
    }
  }

  /**
   * Save hook registry
   * @param {Object} registry - Registry object to save
   */
  async saveHookRegistry(registry) {
    await fs.writeFile(this.hookRegistryPath, JSON.stringify(registry, null, 2));
  }

  /**
   * Load system version information
   */
  async loadSystemVersion() {
    try {
      const content = await fs.readFile(this.systemVersionPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return {
        installedVersion: '1.1.7',
        lastUpdateCheck: new Date().toISOString(),
        updateHistory: []
      };
    }
  }

  /**
   * Save system version information
   * @param {Object} versionInfo - Version information to save
   */
  async saveSystemVersion(versionInfo) {
    await fs.writeFile(this.systemVersionPath, JSON.stringify(versionInfo, null, 2));
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

  /**
   * Get registry statistics
   */
  async getRegistryStats() {
    const agentRegistry = await this.loadAgentRegistry();
    const hookRegistry = await this.loadHookRegistry();
    const systemVersion = await this.loadSystemVersion();

    return {
      agents: {
        total: Object.keys(agentRegistry.agents).length,
        modified: Object.values(agentRegistry.agents).filter(a => a.userModified).length,
        lastUpdate: agentRegistry.lastUpdate
      },
      hooks: {
        total: Object.keys(hookRegistry.hooks).length,
        modified: Object.values(hookRegistry.hooks).filter(h => h.userModified).length,
        lastUpdate: hookRegistry.lastUpdate
      },
      system: {
        version: systemVersion.installedVersion,
        lastUpdateCheck: systemVersion.lastUpdateCheck,
        updateCount: systemVersion.updateHistory.length
      }
    };
  }
}

module.exports = { MetadataManager };
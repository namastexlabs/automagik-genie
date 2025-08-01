const fs = require('fs').promises;
const path = require('path');

/**
 * ValidationEngine - Validates update system components and operations
 * Provides pre/post update validation and system integrity checks
 */
class ValidationEngine {
  constructor() {
    this.validationRules = {
      metadata: this.validateMetadataStructure.bind(this),
      backup: this.validateBackupIntegrity.bind(this),
      templates: this.validateTemplateCache.bind(this),
      files: this.validateFileStructure.bind(this),
      system: this.validateSystemState.bind(this)
    };
  }

  /**
   * Run comprehensive system validation
   * @param {Object} options - Validation options
   * @returns {Object} Validation results
   */
  async runFullValidation(options = {}) {
    const { projectPath = process.cwd(), checkRemote = false } = options;
    
    const results = {
      overall: true,
      timestamp: new Date().toISOString(),
      results: {},
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Run all validation rules
    for (const [ruleName, ruleFunction] of Object.entries(this.validationRules)) {
      try {
        console.log(`🔍 Validating ${ruleName}...`);
        const ruleResult = await ruleFunction(projectPath, options);
        results.results[ruleName] = ruleResult;
        
        if (!ruleResult.valid) {
          results.overall = false;
          results.errors.push(...ruleResult.errors);
        }
        
        results.warnings.push(...ruleResult.warnings);
        results.recommendations.push(...ruleResult.recommendations);
        
      } catch (error) {
        results.overall = false;
        results.errors.push(`${ruleName} validation failed: ${error.message}`);
        results.results[ruleName] = {
          valid: false,
          errors: [error.message],
          warnings: [],
          recommendations: []
        };
      }
    }

    return results;
  }

  /**
   * Validate metadata structure and consistency
   * @param {string} projectPath - Project path
   * @param {Object} options - Options
   * @returns {Object} Validation result
   */
  async validateMetadataStructure(projectPath, options) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    const { MetadataManager } = require('./metadata');
    const metadata = new MetadataManager();

    try {
      // Check if registries exist and are readable
      const stats = await metadata.getRegistryStats();
      
      // Validate registry structure
      const agentRegistry = await metadata.loadAgentRegistry();
      const hookRegistry = await metadata.loadHookRegistry();
      const systemVersion = await metadata.loadSystemVersion();

      // Check required fields
      if (!agentRegistry.version || !agentRegistry.lastUpdate) {
        result.errors.push('Agent registry missing required fields');
        result.valid = false;
      }

      if (!hookRegistry.version || !hookRegistry.lastUpdate) {
        result.errors.push('Hook registry missing required fields');
        result.valid = false;
      }

      if (!systemVersion.installedVersion) {
        result.errors.push('System version missing installed version');
        result.valid = false;
      }

      // Check for inconsistencies
      if (stats.agents.total === 0 && stats.hooks.total === 0) {
        result.warnings.push('No agents or hooks registered - run scan to populate registries');
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`Metadata validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate backup system integrity
   * @param {string} projectPath - Project path
   * @param {Object} options - Options
   * @returns {Object} Validation result
   */
  async validateBackupIntegrity(projectPath, options) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    const { BackupManager } = require('./backup');
    const backup = new BackupManager();

    try {
      // List available backups
      const backups = await backup.listAvailableBackups();
      
      let validBackups = 0;
      let corruptedBackups = 0;

      // Validate each backup
      for (const backupInfo of backups) {
        if (backupInfo.valid) {
          validBackups++;
        } else {
          corruptedBackups++;
          result.warnings.push(`Corrupted backup found: ${backupInfo.id}`);
        }
      }

      if (corruptedBackups > 0) {
        result.recommendations.push(`Clean up ${corruptedBackups} corrupted backups`);
      }

      if (validBackups === 0 && backups.length > 0) {
        result.errors.push('No valid backups available - backup system may be compromised');
        result.valid = false;
      }

      if (backups.length > 50) {
        result.warnings.push(`Large number of backups (${backups.length}) - consider cleanup`);
        result.recommendations.push('Run cleanup command to remove old backups');
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`Backup validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate template cache
   * @param {string} projectPath - Project path
   * @param {Object} options - Options
   * @returns {Object} Validation result
   */
  async validateTemplateCache(projectPath, options) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    const { TemplateManager } = require('./templates');
    const templates = new TemplateManager();

    try {
      // List cached versions
      const cachedVersions = await templates.listCachedVersions();
      
      let validCaches = 0;
      let invalidCaches = 0;

      for (const versionInfo of cachedVersions) {
        if (versionInfo.valid) {
          validCaches++;
        } else {
          invalidCaches++;
          result.warnings.push(`Invalid template cache: ${versionInfo.version}`);
        }
      }

      if (invalidCaches > 0) {
        result.recommendations.push(`Clean ${invalidCaches} invalid template caches`);
      }

      if (cachedVersions.length === 0) {
        result.warnings.push('No template cache found - templates will be downloaded on first update');
      }

      // Check if we can fetch latest release
      if (options.checkRemote) {
        try {
          await templates.fetchLatestRelease();
        } catch (error) {
          result.warnings.push('Cannot check for latest release - network connectivity issue');
        }
      }

    } catch (error) {
      result.warnings.push(`Template cache validation warning: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate file structure
   * @param {string} projectPath - Project path
   * @param {Object} options - Options
   * @returns {Object} Validation result
   */
  async validateFileStructure(projectPath, options) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      // Check if this is a Genie project
      const claudeDir = path.join(projectPath, '.claude');
      if (!await this.fileExists(claudeDir)) {
        result.errors.push('.claude directory not found - not a Genie project');
        result.valid = false;
        return result;
      }

      // Check required directories
      const requiredDirs = [
        '.claude/agents',
        '.claude/hooks',
        '.claude/hooks/examples'
      ];

      for (const dir of requiredDirs) {
        const dirPath = path.join(projectPath, dir);
        if (!await this.fileExists(dirPath)) {
          result.warnings.push(`Missing directory: ${dir}`);
          result.recommendations.push(`Create missing directory: ${dir}`);
        }
      }

      // Check for common agent files
      const agentsDir = path.join(projectPath, '.claude/agents');
      if (await this.fileExists(agentsDir)) {
        const agentFiles = await fs.readdir(agentsDir);
        const mdFiles = agentFiles.filter(f => f.endsWith('.md'));
        
        if (mdFiles.length === 0) {
          result.warnings.push('No agent files found in .claude/agents');
          result.recommendations.push('Run initialization to create base agents');
        }

        // Check for critical agents
        const criticalAgents = ['genie-analyzer.md'];
        for (const critical of criticalAgents) {
          if (!mdFiles.includes(critical)) {
            result.warnings.push(`Missing critical agent: ${critical}`);
          }
        }
      }

      // Check CLAUDE.md file
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      if (!await this.fileExists(claudeMdPath)) {
        result.warnings.push('CLAUDE.md file not found');
        result.recommendations.push('Ensure CLAUDE.md exists for proper Claude integration');
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`File structure validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate overall system state
   * @param {string} projectPath - Project path
   * @param {Object} options - Options
   * @returns {Object} Validation result
   */
  async validateSystemState(projectPath, options) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion < 14) {
        result.errors.push(`Node.js version ${nodeVersion} is not supported (minimum: 14.0.0)`);
        result.valid = false;
      }

      // Check available disk space in backup directory
      const os = require('os');
      const backupDir = path.join(os.homedir(), '.automagik-genie', 'backups');
      
      try {
        const stats = await fs.stat(backupDir);
        // This is a basic check - in production you'd want to check actual disk space
        result.warnings.push('Backup directory exists and is accessible');
      } catch (error) {
        result.warnings.push('Backup directory not yet created - will be created on first backup');
      }

      // Check permissions
      try {
        const testFile = path.join(projectPath, '.claude', '.permission-test');
        await fs.writeFile(testFile, 'test', 'utf-8');
        await fs.unlink(testFile);
      } catch (error) {
        result.errors.push('Insufficient permissions to write to .claude directory');
        result.valid = false;
      }

      // Check package.json dependencies
      const packageJsonPath = path.join(__dirname, '../../package.json');
      if (await this.fileExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const requiredDeps = ['inquirer', 'colors', 'yargs', 'tar'];
        
        for (const dep of requiredDeps) {
          if (!packageJson.dependencies[dep]) {
            result.warnings.push(`Missing dependency: ${dep}`);
            result.recommendations.push('Run npm install to ensure all dependencies are available');
          }
        }
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`System state validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate specific update operation
   * @param {Object} updatePlan - Update plan to validate
   * @returns {Object} Validation result
   */
  async validateUpdatePlan(updatePlan) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      // Check if update plan has required fields
      if (!updatePlan.fileAnalysis || !Array.isArray(updatePlan.fileAnalysis)) {
        result.errors.push('Update plan missing file analysis');
        result.valid = false;
        return result;
      }

      // Validate each file in the plan
      for (const fileAnalysis of updatePlan.fileAnalysis) {
        if (!fileAnalysis.filePath) {
          result.errors.push('File analysis missing file path');
          result.valid = false;
        }

        if (!fileAnalysis.action) {
          result.errors.push(`File analysis missing action for ${fileAnalysis.filePath}`);
          result.valid = false;
        }

        // Check for high-risk operations
        if (fileAnalysis.risk === 'high') {
          result.warnings.push(`High-risk update planned for ${fileAnalysis.fileName}`);
          result.recommendations.push('Review high-risk updates carefully');
        }

        // Check for conflicts
        if (fileAnalysis.details && fileAnalysis.details.conflicts.length > 0) {
          result.warnings.push(`Conflicts detected in ${fileAnalysis.fileName}`);
          result.recommendations.push('Resolve conflicts before proceeding');
        }
      }

      // Check overall update scope
      const totalFiles = updatePlan.fileAnalysis.length;
      if (totalFiles > 20) {
        result.warnings.push(`Large update scope (${totalFiles} files)`);
        result.recommendations.push('Consider updating in smaller batches');
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`Update plan validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path to check
   * @returns {boolean} True if file exists
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
   * Generate validation report
   * @param {Object} validationResults - Results from validation
   * @returns {string} Formatted report
   */
  generateReport(validationResults) {
    const lines = [];
    
    lines.push('═'.repeat(60));
    lines.push('🔍 AUTOMAGIK GENIE UPDATE SYSTEM VALIDATION REPORT');
    lines.push('═'.repeat(60));
    lines.push('');
    
    lines.push(`Overall Status: ${validationResults.overall ? '✅ VALID' : '❌ INVALID'}`);
    lines.push(`Timestamp: ${validationResults.timestamp}`);
    lines.push('');

    // Results by category
    for (const [category, result] of Object.entries(validationResults.results)) {
      const status = result.valid ? '✅' : '❌';
      lines.push(`${status} ${category.toUpperCase()}`);
      
      if (result.errors.length > 0) {
        lines.push('   Errors:');
        result.errors.forEach(error => lines.push(`     • ${error}`));
      }
      
      if (result.warnings.length > 0) {
        lines.push('   Warnings:');
        result.warnings.forEach(warning => lines.push(`     • ${warning}`));
      }
      
      lines.push('');
    }

    // Overall recommendations
    if (validationResults.recommendations.length > 0) {
      lines.push('💡 RECOMMENDATIONS:');
      const uniqueRecommendations = [...new Set(validationResults.recommendations)];
      uniqueRecommendations.forEach(rec => lines.push(`   • ${rec}`));
      lines.push('');
    }

    lines.push('─'.repeat(60));
    
    return lines.join('\n');
  }
}

module.exports = { ValidationEngine };
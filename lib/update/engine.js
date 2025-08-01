const fs = require('fs').promises;
const path = require('path');
const { MetadataManager } = require('./metadata');
const { TemplateManager } = require('./templates');
const { BackupManager } = require('./backup');
const { DiffEngine } = require('./diff');
const { MergeEngine } = require('./merge');
const { UpdateUI } = require('./ui');

/**
 * UpdateEngine - Main orchestrator for the update system
 * Coordinates all update operations with safety checks and user consent
 */
class UpdateEngine {
  constructor(options = {}) {
    this.projectPath = options.projectPath || process.cwd();
    this.metadata = new MetadataManager();
    this.templates = new TemplateManager();
    this.backup = new BackupManager();
    this.diff = new DiffEngine();
    this.merge = new MergeEngine();
    this.ui = new UpdateUI();
  }

  /**
   * Execute complete update process
   * @param {Object} options - Update options
   * @returns {Object} Update results
   */
  async executeUpdate(options = {}) {
    const {
      dryRun = false,
      force = false,
      agentsOnly = false,
      hooksOnly = false
    } = options;

    const updateResult = {
      success: false,
      phase: 'initialization',
      results: {
        analysis: null,
        backup: null,
        updates: [],
        errors: [],
        warnings: []
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Phase 1: Pre-update analysis
      updateResult.phase = 'analysis';
      this.ui.showPhase('Analysis', 'Analyzing current state and available updates...');
      
      const analysis = await this.preUpdateAnalysis(options);
      updateResult.results.analysis = analysis;

      if (!analysis.hasUpdates) {
        this.ui.showSuccess('No updates available - system is up to date');
        updateResult.success = true;
        return updateResult;
      }

      // Phase 2: User consent
      updateResult.phase = 'consent';
      this.ui.showPhase('Review', 'Presenting update options for user review...');
      
      const userChoices = await this.getUserConsent(analysis, options);
      
      if (userChoices.cancelled) {
        this.ui.showInfo('Update cancelled by user');
        updateResult.success = true;
        return updateResult;
      }

      // Phase 3: Create backup
      if (!dryRun) {
        updateResult.phase = 'backup';
        this.ui.showPhase('Backup', 'Creating safety backup of current files...');
        
        const backupResult = await this.createUpdateBackup(analysis);
        updateResult.results.backup = backupResult;
      }

      // Phase 4: Execute updates
      updateResult.phase = 'execution';
      this.ui.showPhase('Update', 'Applying updates based on your choices...');
      
      const updateResults = await this.executeFileUpdates(analysis, userChoices, options);
      updateResult.results.updates = updateResults;

      // Phase 5: Post-update validation
      updateResult.phase = 'validation';
      this.ui.showPhase('Validation', 'Validating updated files and system state...');
      
      const validation = await this.postUpdateValidation(updateResults);
      updateResult.results.warnings = validation.warnings;
      updateResult.results.errors = validation.errors;

      if (validation.critical.length > 0) {
        throw new Error(`Critical validation failures: ${validation.critical.join(', ')}`);
      }

      updateResult.success = true;
      updateResult.phase = 'complete';
      
      this.ui.showSuccess('Update completed successfully!');
      this.ui.showUpdateSummary(updateResult.results);

      return updateResult;

    } catch (error) {
      updateResult.success = false;
      updateResult.error = error.message;
      updateResult.results.errors.push(error.message);
      
      await this.handleUpdateFailure(error, updateResult, options);
      throw error;
    }
  }

  /**
   * Analyze current state vs latest templates
   * @param {Object} options - Analysis options
   * @returns {Object} Analysis results
   */
  async preUpdateAnalysis(options) {
    const analysis = {
      currentVersion: await this.getCurrentVersion(),
      latestVersion: null,
      hasUpdates: false,
      updateCategories: {
        agents: [],
        hooks: [],
        core: []
      },
      fileAnalysis: [],
      risks: [],
      recommendations: []
    };

    try {
      // Initialize metadata system
      await this.metadata.initializeRegistries();
      
      // Scan current files
      const scanResults = await this.metadata.scanExistingFiles(this.projectPath);
      analysis.currentFileCount = scanResults.agentCount + scanResults.hookCount;

      // Fetch latest release information
      const latestRelease = await this.templates.fetchLatestRelease();
      analysis.latestVersion = latestRelease.version;
      analysis.hasUpdates = analysis.currentVersion !== analysis.latestVersion;

      if (!analysis.hasUpdates) {
        return analysis;
      }

      // Download latest templates for comparison
      await this.templates.downloadTemplate(analysis.latestVersion);

      // Compare current files with latest templates
      const comparison = await this.templates.compareWithTemplate(
        this.projectPath,
        analysis.latestVersion
      );

      // Analyze each changed file
      for (const changedFile of comparison.files.different) {
        const fileAnalysis = await this.analyzeFileUpdate(changedFile);
        analysis.fileAnalysis.push(fileAnalysis);
        
        // Categorize by type
        const category = fileAnalysis.category;
        if (analysis.updateCategories[category]) {
          analysis.updateCategories[category].push(fileAnalysis);
        }
      }

      // Add new files
      for (const newFile of comparison.files.missing) {
        const fileAnalysis = {
          filePath: newFile.path,
          fileName: path.basename(newFile.path),
          category: newFile.category,
          type: 'new-file',
          action: 'add',
          risk: 'low',
          description: `New ${newFile.type} available: ${newFile.path}`
        };
        
        analysis.fileAnalysis.push(fileAnalysis);
        if (analysis.updateCategories[newFile.category]) {
          analysis.updateCategories[newFile.category].push(fileAnalysis);
        }
      }

      // Generate recommendations and risk assessment
      analysis.risks = this.assessUpdateRisks(analysis);
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;

    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze update for a specific file
   * @param {Object} fileInfo - File information from comparison
   * @returns {Object} File analysis
   */
  async analyzeFileUpdate(fileInfo) {
    const filePath = path.join(this.projectPath, fileInfo.path);
    const fileName = path.basename(fileInfo.path);
    
    const analysis = {
      filePath: fileInfo.path,
      fileName,
      category: fileInfo.category,
      type: fileInfo.type,
      action: 'update',
      risk: 'medium',
      description: '',
      details: null
    };

    try {
      // Check if file exists locally
      if (await this.fileExists(filePath)) {
        const currentContent = await fs.readFile(filePath, 'utf-8');
        const templatePath = await this.templates.getCachedTemplate(
          await this.getLatestVersion()
        );
        const templateFilePath = path.join(templatePath, 'files', fileInfo.path);
        const templateContent = await fs.readFile(templateFilePath, 'utf-8');

        // Use diff engine to analyze changes
        analysis.details = await this.diff.analyzeAgentChanges(
          fileName,
          currentContent,
          templateContent
        );

        // Set risk based on analysis
        analysis.risk = this.calculateFileRisk(analysis.details);
        analysis.description = this.generateFileDescription(analysis.details);

      } else {
        analysis.action = 'add';
        analysis.risk = 'low';
        analysis.description = `New ${fileInfo.type} will be added`;
      }

    } catch (error) {
      analysis.risk = 'high';
      analysis.description = `Error analyzing file: ${error.message}`;
    }

    return analysis;
  }

  /**
   * Get user consent for updates
   * @param {Object} analysis - Update analysis
   * @param {Object} options - Options including force flag
   * @returns {Object} User choices
   */
  async getUserConsent(analysis, options) {
    if (options.force) {
      return this.generateDefaultChoices(analysis);
    }

    // Show analysis summary
    await this.ui.showUpdateSummary(analysis);

    // Get user choices for each category
    const userChoices = {
      cancelled: false,
      global: {},
      files: {}
    };

    // Global choices
    userChoices.global = await this.ui.promptGlobalChoices(analysis);
    
    if (userChoices.global.cancel) {
      userChoices.cancelled = true;
      return userChoices;
    }

    // File-specific choices for complex updates
    const complexFiles = analysis.fileAnalysis.filter(f => 
      f.risk === 'high' || (f.details && f.details.conflicts.length > 0)
    );

    if (complexFiles.length > 0) {
      userChoices.files = await this.ui.promptFileChoices(complexFiles);
    }

    return userChoices;
  }

  /**
   * Create backup before updates
   * @param {Object} analysis - Update analysis
   * @returns {Object} Backup result
   */
  async createUpdateBackup(analysis) {
    const filesToBackup = analysis.fileAnalysis
      .filter(f => f.action === 'update')
      .map(f => path.join(this.projectPath, f.filePath))
      .filter(async (filePath) => await this.fileExists(filePath));

    const backupMetadata = {
      type: 'update-backup',
      version: analysis.currentVersion,
      targetVersion: analysis.latestVersion,
      fileCount: filesToBackup.length,
      timestamp: new Date().toISOString()
    };

    return await this.backup.createBackup(filesToBackup, backupMetadata);
  }

  /**
   * Execute file updates based on analysis and user choices
   * @param {Object} analysis - Update analysis
   * @param {Object} userChoices - User preferences
   * @param {Object} options - Update options
   * @returns {Array} Update results for each file
   */
  async executeFileUpdates(analysis, userChoices, options) {
    const updateResults = [];
    const { dryRun = false } = options;

    for (const fileAnalysis of analysis.fileAnalysis) {
      const fileChoice = userChoices.files[fileAnalysis.filePath] || 
                        userChoices.global.defaultAction || 
                        'auto';

      if (fileChoice === 'skip') {
        updateResults.push({
          filePath: fileAnalysis.filePath,
          action: 'skipped',
          success: true,
          message: 'Skipped by user choice'
        });
        continue;
      }

      try {
        let result;
        
        if (fileAnalysis.action === 'add') {
          result = await this.addNewFile(fileAnalysis, options);
        } else if (fileAnalysis.action === 'update') {
          result = await this.updateExistingFile(fileAnalysis, fileChoice, options);
        }

        updateResults.push({
          filePath: fileAnalysis.filePath,
          action: fileAnalysis.action,
          success: true,
          result
        });

        // Update metadata registry
        if (!dryRun) {
          await this.updateFileMetadata(fileAnalysis);
        }

      } catch (error) {
        updateResults.push({
          filePath: fileAnalysis.filePath,
          action: fileAnalysis.action,
          success: false,
          error: error.message
        });
      }
    }

    return updateResults;
  }

  /**
   * Add new file from template
   * @param {Object} fileAnalysis - File analysis
   * @param {Object} options - Options
   * @returns {Object} Add result
   */
  async addNewFile(fileAnalysis, options) {
    const { dryRun = false } = options;
    
    const templatePath = await this.templates.getCachedTemplate(
      await this.getLatestVersion()
    );
    const sourceFile = path.join(templatePath, 'files', fileAnalysis.filePath);
    const targetFile = path.join(this.projectPath, fileAnalysis.filePath);

    if (dryRun) {
      return {
        action: 'add',
        message: `Would add new file: ${fileAnalysis.filePath}`
      };
    }

    // Ensure target directory exists
    await fs.mkdir(path.dirname(targetFile), { recursive: true });

    // Copy template file
    const content = await fs.readFile(sourceFile, 'utf-8');
    await fs.writeFile(targetFile, content, 'utf-8');

    return {
      action: 'added',
      message: `Added new file: ${fileAnalysis.filePath}`
    };
  }

  /**
   * Update existing file
   * @param {Object} fileAnalysis - File analysis
   * @param {string} userChoice - User's choice for this file
   * @param {Object} options - Options
   * @returns {Object} Update result
   */
  async updateExistingFile(fileAnalysis, userChoice, options) {
    const filePath = path.join(this.projectPath, fileAnalysis.filePath);
    
    if (!fileAnalysis.details) {
      throw new Error('No detailed analysis available for file update');
    }

    // Convert user choice to merge engine format
    const mergeChoices = this.convertUserChoiceToMergeChoices(
      fileAnalysis.details,
      userChoice
    );

    return await this.merge.executeMerge(
      filePath,
      fileAnalysis.details,
      mergeChoices,
      {
        dryRun: options.dryRun,
        createBackup: false // Already created system backup
      }
    );
  }

  /**
   * Post-update validation
   * @param {Array} updateResults - Results from file updates
   * @returns {Object} Validation results
   */
  async postUpdateValidation(updateResults) {
    const validation = {
      success: true,
      warnings: [],
      errors: [],
      critical: []
    };

    // Check for failed updates
    const failedUpdates = updateResults.filter(r => !r.success);
    if (failedUpdates.length > 0) {
      validation.errors.push(`${failedUpdates.length} files failed to update`);
    }

    // Validate .claude directory structure
    const claudeDir = path.join(this.projectPath, '.claude');
    if (await this.fileExists(claudeDir)) {
      const requiredDirs = ['agents', 'hooks/examples'];
      
      for (const dir of requiredDirs) {
        const dirPath = path.join(claudeDir, dir);
        if (!await this.fileExists(dirPath)) {
          validation.warnings.push(`Missing directory: ${dir}`);
        }
      }
    } else {
      validation.critical.push('.claude directory is missing');
    }

    // Check for conflict markers in files
    const updatedFiles = updateResults
      .filter(r => r.success && r.action === 'update')
      .map(r => path.join(this.projectPath, r.filePath));

    for (const filePath of updatedFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        if (content.includes('<<<<<<< CURRENT')) {
          validation.warnings.push(`Unresolved conflicts in: ${path.basename(filePath)}`);
        }
      } catch (error) {
        validation.errors.push(`Cannot validate file: ${path.basename(filePath)}`);
      }
    }

    // Update system version if successful
    if (validation.critical.length === 0) {
      await this.updateSystemVersion();
    }

    return validation;
  }

  /**
   * Handle update failure with recovery
   * @param {Error} error - The error that occurred
   * @param {Object} updateResult - Current update result
   * @param {Object} options - Update options
   */
  async handleUpdateFailure(error, updateResult, options) {
    this.ui.showError(`Update failed in ${updateResult.phase}: ${error.message}`);

    // If we have a backup and we're past the backup phase, offer to restore
    if (updateResult.results.backup && 
        ['execution', 'validation'].includes(updateResult.phase)) {
      
      if (!options.dryRun) {
        const shouldRestore = await this.ui.promptRestoreFromBackup();
        
        if (shouldRestore) {
          try {
            await this.backup.restoreFromBackup(updateResult.results.backup.backupId);
            this.ui.showSuccess('Successfully restored from backup');
          } catch (restoreError) {
            this.ui.showError(`Failed to restore from backup: ${restoreError.message}`);
          }
        }
      }
    }
  }

  // Helper methods

  async getCurrentVersion() {
    const packageJson = require(path.join(__dirname, '../../package.json'));
    return packageJson.version;
  }

  async getLatestVersion() {
    const release = await this.templates.fetchLatestRelease();
    return release.version;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  calculateFileRisk(details) {
    if (!details) return 'medium';
    
    if (details.conflicts.length > 0) return 'high';
    if (details.confidence === 'low') return 'high';
    if (details.userSections.length > 2) return 'medium';
    return 'low';
  }

  generateFileDescription(details) {
    if (!details) return 'File will be updated';
    
    const parts = [];
    
    if (details.templateSections.length > 0) {
      parts.push(`${details.templateSections.length} template sections updated`);
    }
    
    if (details.userSections.length > 0) {
      parts.push(`${details.userSections.length} user sections preserved`);
    }
    
    if (details.conflicts.length > 0) {
      parts.push(`${details.conflicts.length} conflicts require resolution`);
    }

    return parts.join(', ') || 'Template updates available';
  }

  assessUpdateRisks(analysis) {
    const risks = [];
    
    const highRiskFiles = analysis.fileAnalysis.filter(f => f.risk === 'high');
    if (highRiskFiles.length > 0) {
      risks.push({
        level: 'high',
        description: `${highRiskFiles.length} files have high-risk changes`,
        files: highRiskFiles.map(f => f.fileName)
      });
    }

    const conflictFiles = analysis.fileAnalysis.filter(f => 
      f.details && f.details.conflicts.length > 0
    );
    if (conflictFiles.length > 0) {
      risks.push({
        level: 'medium',
        description: `${conflictFiles.length} files have conflicts`,
        files: conflictFiles.map(f => f.fileName)
      });
    }

    return risks;
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.risks.some(r => r.level === 'high')) {
      recommendations.push('Review high-risk changes carefully before proceeding');
    }
    
    if (analysis.fileAnalysis.length > 10) {
      recommendations.push('Consider updating in smaller batches');
    }
    
    recommendations.push('Backup will be created automatically for safety');
    
    return recommendations;
  }

  generateDefaultChoices(analysis) {
    return {
      cancelled: false,
      global: {
        defaultAction: 'auto',
        cancel: false
      },
      files: {}
    };
  }

  convertUserChoiceToMergeChoices(details, userChoice) {
    const choices = {};
    
    // Apply user choice to all sections
    for (const section of details.templateSections) {
      choices[section.title] = userChoice === 'auto' ? 'accept' : userChoice;
    }
    
    for (const conflict of details.conflicts) {
      choices[conflict.title] = userChoice === 'auto' ? 'manual-merge' : userChoice;
    }
    
    return choices;
  }

  async updateFileMetadata(fileAnalysis) {
    const filePath = path.join(this.projectPath, fileAnalysis.filePath);
    
    if (await this.fileExists(filePath)) {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      
      const metadata = {
        checksum: this.calculateChecksum(content),
        size: stats.size,
        modified: stats.mtime.toISOString(),
        templateVersion: await this.getLatestVersion(),
        lastUpdated: new Date().toISOString()
      };

      const agentName = path.basename(fileAnalysis.filePath, '.md');
      await this.metadata.updateAgentRegistry(agentName, metadata);
    }
  }

  calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
  }

  async updateSystemVersion() {
    const systemVersion = await this.metadata.loadSystemVersion();
    
    systemVersion.installedVersion = await this.getLatestVersion();
    systemVersion.lastUpdateCheck = new Date().toISOString();
    systemVersion.updateHistory.push({
      timestamp: new Date().toISOString(),
      fromVersion: await this.getCurrentVersion(),
      toVersion: await this.getLatestVersion(),
      success: true
    });

    await this.metadata.saveSystemVersion(systemVersion);
  }
}

module.exports = { UpdateEngine };
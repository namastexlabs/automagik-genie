const fs = require('fs').promises;
const path = require('path');

/**
 * MergeEngine - Handles smart merging of template updates with user customizations
 * Provides section-based merging with conflict resolution
 */
class MergeEngine {
  constructor() {
    this.mergeMarkers = {
      conflictStart: '<<<<<<< CURRENT',
      conflictDivider: '=======',
      conflictEnd: '>>>>>>> TEMPLATE',
      sectionStart: '<!-- MERGE_SECTION_START:',
      sectionEnd: '<!-- MERGE_SECTION_END:',
      customStart: '<!-- USER_CUSTOM_START -->',
      customEnd: '<!-- USER_CUSTOM_END -->'
    };
  }

  /**
   * Execute merge based on analysis and user choices
   * @param {string} filePath - Path to file being merged
   * @param {Object} analysis - Analysis from DiffEngine
   * @param {Object} userChoices - User's merge preferences
   * @param {Object} options - Merge options
   * @returns {Object} Merge results
   */
  async executeMerge(filePath, analysis, userChoices, options = {}) {
    const { dryRun = false, createBackup = true } = options;
    
    const mergeResult = {
      filePath,
      strategy: analysis.mergeStrategy,
      success: false,
      changes: [],
      conflicts: [],
      warnings: [],
      backupPath: null
    };

    try {
      // Create backup if requested
      if (createBackup && !dryRun) {
        mergeResult.backupPath = await this.createFileMergeBackup(filePath);
      }

      // Execute merge based on strategy
      let mergedContent;
      switch (analysis.mergeStrategy) {
        case 'safe':
          mergedContent = await this.executeSafeMerge(filePath, analysis);
          break;
        case 'merge':
          mergedContent = await this.executeSmartMerge(filePath, analysis, userChoices);
          break;
        case 'manual':
          mergedContent = await this.executeManualMerge(filePath, analysis, userChoices);
          break;
        case 'skip':
          mergeResult.success = true;
          mergeResult.changes.push({
            type: 'skip',
            description: 'File skipped due to user customizations'
          });
          return mergeResult;
        default:
          throw new Error(`Unknown merge strategy: ${analysis.mergeStrategy}`);
      }

      // Validate merged content
      const validation = await this.validateMergedContent(mergedContent, analysis);
      if (!validation.valid) {
        throw new Error(`Merge validation failed: ${validation.errors.join(', ')}`);
      }

      // Write merged content if not dry run
      if (!dryRun) {
        await fs.writeFile(filePath, mergedContent, 'utf-8');
      }

      mergeResult.success = true;
      mergeResult.changes = this.generateChangeReport(analysis, userChoices);
      mergeResult.warnings = validation.warnings;

      return mergeResult;

    } catch (error) {
      mergeResult.success = false;
      mergeResult.error = error.message;
      
      // Restore from backup if merge failed and backup exists
      if (mergeResult.backupPath && !dryRun) {
        try {
          await this.restoreFromMergeBackup(filePath, mergeResult.backupPath);
        } catch (restoreError) {
          mergeResult.warnings.push(`Failed to restore from backup: ${restoreError.message}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Execute safe merge - only template updates, no user customizations
   * @param {string} filePath - File path
   * @param {Object} analysis - Merge analysis
   * @returns {string} Merged content
   */
  async executeSafeMerge(filePath, analysis) {
    const templateSections = analysis.templateSections;
    const currentContent = await fs.readFile(filePath, 'utf-8');
    
    // If no template changes, return current content
    if (templateSections.length === 0) {
      return currentContent;
    }

    // Replace template sections with updated versions
    let mergedContent = currentContent;
    
    for (const section of templateSections) {
      if (section.action === 'update') {
        mergedContent = this.replaceSectionContent(
          mergedContent,
          section.title,
          section.newContent.join('\n')
        );
      } else if (section.action === 'add') {
        mergedContent = this.addNewSection(
          mergedContent,
          section.title,
          section.content.join('\n')
        );
      }
    }

    return mergedContent;
  }

  /**
   * Execute smart merge - combine template updates with user customizations
   * @param {string} filePath - File path
   * @param {Object} analysis - Merge analysis
   * @param {Object} userChoices - User preferences
   * @returns {string} Merged content
   */
  async executeSmartMerge(filePath, analysis, userChoices) {
    const currentContent = await fs.readFile(filePath, 'utf-8');
    let mergedContent = currentContent;

    // Process template sections first
    for (const section of analysis.templateSections) {
      const userChoice = userChoices[section.title] || 'auto';
      
      switch (userChoice) {
        case 'auto':
        case 'accept':
          if (section.action === 'update') {
            mergedContent = this.replaceSectionContent(
              mergedContent,
              section.title,
              section.newContent.join('\n')
            );
          } else if (section.action === 'add') {
            mergedContent = this.addNewSection(
              mergedContent,
              section.title,
              section.content.join('\n')
            );
          }
          break;
        case 'reject':
          // Keep current version - no action needed
          break;
        case 'merge':
          mergedContent = this.mergeSectionContent(
            mergedContent,
            section.title,
            section.oldContent.join('\n'),
            section.newContent.join('\n')
          );
          break;
      }
    }

    // User sections are preserved automatically
    // (they weren't in templateSections, so they remain unchanged)

    return mergedContent;
  }

  /**
   * Execute manual merge - handle conflicts with user resolution
   * @param {string} filePath - File path
   * @param {Object} analysis - Merge analysis
   * @param {Object} userChoices - User conflict resolutions
   * @returns {string} Merged content
   */
  async executeManualMerge(filePath, analysis, userChoices) {
    const currentContent = await fs.readFile(filePath, 'utf-8');
    let mergedContent = currentContent;

    // Process conflicts first
    for (const conflict of analysis.conflicts) {
      const resolution = userChoices[conflict.title] || 'keep-current';
      
      switch (resolution) {
        case 'keep-current':
          // No action needed - keep current version
          break;
        case 'use-template':
          mergedContent = this.replaceSectionContent(
            mergedContent,
            conflict.title,
            conflict.templateContent.join('\n')
          );
          break;
        case 'manual-merge':
          mergedContent = this.createConflictMarkers(
            mergedContent,
            conflict.title,
            conflict.currentContent.join('\n'),
            conflict.templateContent.join('\n')
          );
          break;
      }
    }

    // Process non-conflicting template sections
    for (const section of analysis.templateSections) {
      const userChoice = userChoices[section.title] || 'accept';
      
      if (userChoice === 'accept') {
        if (section.action === 'update') {
          mergedContent = this.replaceSectionContent(
            mergedContent,
            section.title,
            section.newContent.join('\n')
          );
        } else if (section.action === 'add') {
          mergedContent = this.addNewSection(
            mergedContent,
            section.title,
            section.content.join('\n')
          );
        }
      }
    }

    return mergedContent;
  }

  /**
   * Replace section content in file
   * @param {string} content - File content
   * @param {string} sectionTitle - Section to replace
   * @param {string} newSectionContent - New content for section
   * @returns {string} Updated content
   */
  replaceSectionContent(content, sectionTitle, newSectionContent) {
    const lines = content.split('\n');
    const result = [];
    let inTargetSection = false;
    let sectionDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sectionMatch = line.match(/^(#{2,})\s+(.+)$/);

      if (sectionMatch) {
        const headerLevel = sectionMatch[1].length;
        const title = sectionMatch[2].trim();

        if (title === sectionTitle && headerLevel === 2) {
          // Found target section start
          inTargetSection = true;
          sectionDepth = headerLevel;
          result.push(newSectionContent);
          continue;
        } else if (inTargetSection && headerLevel <= sectionDepth) {
          // Found end of target section
          inTargetSection = false;
          result.push(line);
        } else if (!inTargetSection) {
          result.push(line);
        }
        // Skip lines inside target section (they're being replaced)
      } else if (!inTargetSection) {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Add new section to file
   * @param {string} content - File content
   * @param {string} sectionTitle - New section title
   * @param {string} sectionContent - New section content
   * @returns {string} Updated content
   */
  addNewSection(content, sectionTitle, sectionContent) {
    const lines = content.split('\n');
    
    // Find appropriate insertion point (end of file or before last section)
    let insertIndex = lines.length;
    
    // Look for last section to insert before it
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].match(/^##\s+/)) {
        insertIndex = i;
        break;
      }
    }

    // Insert new section
    const newSectionLines = sectionContent.split('\n');
    const result = [
      ...lines.slice(0, insertIndex),
      '',
      ...newSectionLines,
      '',
      ...lines.slice(insertIndex)
    ];

    return result.join('\n');
  }

  /**
   * Merge section content (three-way merge)
   * @param {string} content - File content
   * @param {string} sectionTitle - Section to merge
   * @param {string} oldContent - Original section content
   * @param {string} newContent - New template content
   * @returns {string} Updated content with merged section
   */
  mergeSectionContent(content, sectionTitle, oldContent, newContent) {
    // For now, create conflict markers - later can implement smart merge
    return this.createConflictMarkers(content, sectionTitle, oldContent, newContent);
  }

  /**
   * Create conflict markers for manual resolution
   * @param {string} content - File content
   * @param {string} sectionTitle - Section with conflict
   * @param {string} currentContent - Current section content
   * @param {string} templateContent - Template section content
   * @returns {string} Content with conflict markers
   */
  createConflictMarkers(content, sectionTitle, currentContent, templateContent) {
    const conflictSection = [
      `${this.mergeMarkers.conflictStart}`,
      currentContent,
      `${this.mergeMarkers.conflictDivider}`,
      templateContent,
      `${this.mergeMarkers.conflictEnd}`
    ].join('\n');

    return this.replaceSectionContent(content, sectionTitle, conflictSection);
  }

  /**
   * Validate merged content
   * @param {string} content - Merged content
   * @param {Object} analysis - Original analysis
   * @returns {Object} Validation results
   */
  async validateMergedContent(content, analysis) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check for unclosed conflict markers
    const conflictMarkers = [
      this.mergeMarkers.conflictStart,
      this.mergeMarkers.conflictDivider,
      this.mergeMarkers.conflictEnd
    ];

    for (const marker of conflictMarkers) {
      if (content.includes(marker)) {
        const count = (content.match(new RegExp(marker, 'g')) || []).length;
        if (count % 2 !== 0) {
          validation.errors.push(`Unclosed conflict marker: ${marker}`);
          validation.valid = false;
        }
      }
    }

    // Check for malformed sections
    const sectionHeaders = content.match(/^#{2,}\s+.+$/gm) || [];
    for (const header of sectionHeaders) {
      if (!header.match(/^#{2,}\s+\S/)) {
        validation.warnings.push(`Potentially malformed section header: ${header}`);
      }
    }

    // Validate that required sections still exist
    const requiredSections = ['GENIE PERSONALITY CORE', 'ROUTING DECISION MATRIX', 'DEVELOPMENT STANDARDS'];
    for (const required of requiredSections) {
      if (!content.includes(required)) {
        validation.warnings.push(`Required section "${required}" may be missing`);
      }
    }

    return validation;
  }

  /**
   * Generate change report
   * @param {Object} analysis - Merge analysis
   * @param {Object} userChoices - User choices
   * @returns {Array} Array of changes made
   */
  generateChangeReport(analysis, userChoices) {
    const changes = [];

    // Template updates
    for (const section of analysis.templateSections) {
      const choice = userChoices[section.title] || 'auto';
      
      if (choice !== 'reject') {
        changes.push({
          type: 'template-update',
          section: section.title,
          action: section.action,
          description: `Template section "${section.title}" ${section.action}d`
        });
      }
    }

    // User customizations preserved
    for (const section of analysis.userSections) {
      changes.push({
        type: 'user-preservation',
        section: section.title,
        action: 'preserve',
        description: `User section "${section.title}" preserved`
      });
    }

    // Conflicts resolved
    for (const conflict of analysis.conflicts) {
      const resolution = userChoices[conflict.title] || 'keep-current';
      changes.push({
        type: 'conflict-resolution',
        section: conflict.title,
        action: resolution,
        description: `Conflict in "${conflict.title}" resolved: ${resolution}`
      });
    }

    return changes;
  }

  /**
   * Create temporary backup for merge operation
   * @param {string} filePath - File to backup
   * @returns {string} Backup file path
   */
  async createFileMergeBackup(filePath) {
    const timestamp = Date.now();
    const backupPath = `${filePath}.merge-backup.${timestamp}`;
    
    const content = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, content, 'utf-8');
    
    return backupPath;
  }

  /**
   * Restore file from merge backup
   * @param {string} filePath - Original file path
   * @param {string} backupPath - Backup file path
   */
  async restoreFromMergeBackup(filePath, backupPath) {
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    await fs.writeFile(filePath, backupContent, 'utf-8');
    
    // Clean up backup file
    try {
      await fs.unlink(backupPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Preview merge operation without making changes
   * @param {string} filePath - File path
   * @param {Object} analysis - Merge analysis
   * @param {Object} userChoices - User choices
   * @returns {Object} Merge preview
   */
  async previewMerge(filePath, analysis, userChoices) {
    const preview = {
      filePath,
      strategy: analysis.mergeStrategy,
      changes: this.generateChangeReport(analysis, userChoices),
      sections: {
        toUpdate: [],
        toAdd: [],
        toPreserve: [],
        conflicts: []
      }
    };

    // Categorize sections for preview
    for (const section of analysis.templateSections) {
      const choice = userChoices[section.title] || 'auto';
      
      if (choice !== 'reject') {
        if (section.action === 'update') {
          preview.sections.toUpdate.push({
            title: section.title,
            choice,
            hasChanges: section.changes ? true : false
          });
        } else if (section.action === 'add') {
          preview.sections.toAdd.push({
            title: section.title,
            choice
          });
        }
      }
    }

    for (const section of analysis.userSections) {
      preview.sections.toPreserve.push({
        title: section.title,
        type: section.type
      });
    }

    for (const conflict of analysis.conflicts) {
      const resolution = userChoices[conflict.title] || 'keep-current';
      preview.sections.conflicts.push({
        title: conflict.title,
        resolution,
        reason: conflict.reason
      });
    }

    return preview;
  }
}

module.exports = { MergeEngine };
const fs = require('fs').promises;
const path = require('path');

/**
 * DiffEngine - Handles change detection and analysis between templates and user files
 * Provides smart merge strategies and conflict resolution
 */
class DiffEngine {
  constructor() {
    this.sectionMarkers = {
      start: /^## (.+)$/,
      customStart: /^## (Custom|User|Project)/i,
      templateStart: /^## (GENIE|Development|Template)/i
    };
  }

  /**
   * Analyze changes between current agent file and template
   * @param {string} agentName - Name of the agent
   * @param {string} currentContent - Current file content
   * @param {string} templateContent - Template content
   * @returns {Object} Analysis results
   */
  async analyzeAgentChanges(agentName, currentContent, templateContent) {
    const analysis = {
      agentName,
      hasChanges: false,
      templateSections: [],
      userSections: [],
      conflicts: [],
      mergeStrategy: 'safe', // 'safe' | 'merge' | 'manual' | 'skip'
      confidence: 'high', // 'high' | 'medium' | 'low'
      changeCategories: {
        templateUpdates: [],
        userCustomizations: [],
        conflicts: [],
        newSections: []
      }
    };

    // Parse both files into sections
    const currentSections = this.parseFileIntoSections(currentContent);
    const templateSections = this.parseFileIntoSections(templateContent);

    // Compare sections
    const sectionComparison = this.compareSections(currentSections, templateSections);
    
    analysis.hasChanges = sectionComparison.hasChanges;
    analysis.templateSections = sectionComparison.templateSections;
    analysis.userSections = sectionComparison.userSections;
    analysis.conflicts = sectionComparison.conflicts;

    // Determine merge strategy based on analysis
    analysis.mergeStrategy = this.determineMergeStrategy(sectionComparison);
    analysis.confidence = this.calculateConfidence(sectionComparison);

    // Categorize changes
    analysis.changeCategories = this.categorizeChanges(sectionComparison);

    return analysis;
  }

  /**
   * Parse file content into structured sections
   * @param {string} content - File content
   * @returns {Array} Array of sections with metadata
   */
  parseFileIntoSections(content) {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const sectionMatch = line.match(this.sectionMarkers.start);

      if (sectionMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          title: sectionMatch[1],
          startLine: lineNumber,
          endLine: null,
          content: [line],
          type: this.determineSectionType(sectionMatch[1]),
          isCustom: this.isCustomSection(sectionMatch[1]),
          isTemplate: this.isTemplateSection(sectionMatch[1])
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      } else {
        // Content before first section (preamble)
        if (!sections.length || sections[0].title !== '__preamble__') {
          sections.unshift({
            title: '__preamble__',
            startLine: 1,
            endLine: null,
            content: [line],
            type: 'preamble',
            isCustom: false,
            isTemplate: true
          });
        } else {
          sections[0].content.push(line);
        }
      }
    }

    // Close last section
    if (currentSection) {
      currentSection.endLine = lineNumber;
      sections.push(currentSection);
    }

    // Set end lines for all sections
    for (let i = 0; i < sections.length - 1; i++) {
      sections[i].endLine = sections[i + 1].startLine - 1;
    }

    return sections;
  }

  /**
   * Determine section type from title
   * @param {string} title - Section title
   * @returns {string} Section type
   */
  determineSectionType(title) {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('custom') || lowerTitle.includes('user') || lowerTitle.includes('project')) {
      return 'custom';
    }
    
    if (lowerTitle.includes('genie') || lowerTitle.includes('template') || lowerTitle.includes('core')) {
      return 'template';
    }

    // Check common template section patterns
    const templatePatterns = [
      'personality', 'core', 'routing', 'behavior', 'implementation', 
      'patterns', 'workflow', 'architecture', 'development', 'system'
    ];

    if (templatePatterns.some(pattern => lowerTitle.includes(pattern))) {
      return 'template';
    }

    // Default to mixed if unclear
    return 'mixed';
  }

  /**
   * Check if section is a custom user section
   * @param {string} title - Section title
   * @returns {boolean} True if custom section
   */
  isCustomSection(title) {
    return this.sectionMarkers.customStart.test(`## ${title}`);
  }

  /**
   * Check if section is a template section
   * @param {string} title - Section title
   * @returns {boolean} True if template section
   */
  isTemplateSection(title) {
    return this.sectionMarkers.templateStart.test(`## ${title}`) || 
           this.determineSectionType(title) === 'template';
  }

  /**
   * Compare sections between current and template files
   * @param {Array} currentSections - Current file sections
   * @param {Array} templateSections - Template file sections
   * @returns {Object} Comparison results
   */
  compareSections(currentSections, templateSections) {
    const comparison = {
      hasChanges: false,
      templateSections: [],
      userSections: [],
      conflicts: [],
      unchanged: [],
      added: [],
      removed: [],
      modified: []
    };

    // Create maps for easier lookup
    const currentMap = new Map(currentSections.map(s => [s.title, s]));
    const templateMap = new Map(templateSections.map(s => [s.title, s]));

    // Find all unique section titles
    const allTitles = new Set([...currentMap.keys(), ...templateMap.keys()]);

    for (const title of allTitles) {
      const currentSection = currentMap.get(title);
      const templateSection = templateMap.get(title);

      if (currentSection && templateSection) {
        // Section exists in both - check for changes
        const contentMatch = this.compareSectionContent(currentSection, templateSection);
        
        if (contentMatch.identical) {
          comparison.unchanged.push({
            title,
            type: currentSection.type,
            action: 'keep'
          });
        } else {
          comparison.hasChanges = true;
          
          if (currentSection.isCustom) {
            // User customized section - preserve it
            comparison.userSections.push({
              title,
              type: 'custom',
              action: 'preserve',
              content: currentSection.content
            });
          } else if (templateSection.type === 'template') {
            // Template section with updates
            comparison.templateSections.push({
              title,
              type: 'template',
              action: 'update',
              oldContent: currentSection.content,
              newContent: templateSection.content,
              changes: contentMatch.changes
            });
          } else {
            // Mixed section - potential conflict
            comparison.conflicts.push({
              title,
              type: 'conflict',
              action: 'manual',
              currentContent: currentSection.content,
              templateContent: templateSection.content,
              reason: 'Modified template section with unclear intent'
            });
          }
          
          comparison.modified.push({
            title,
            changeType: contentMatch.changeType,
            severity: contentMatch.severity
          });
        }
      } else if (currentSection && !templateSection) {
        // Section only in current - user addition
        comparison.hasChanges = true;
        comparison.userSections.push({
          title,
          type: 'user-addition',
          action: 'preserve',
          content: currentSection.content
        });
        comparison.added.push({ title, source: 'user' });
        
      } else if (!currentSection && templateSection) {
        // Section only in template - new template section
        comparison.hasChanges = true;
        comparison.templateSections.push({
          title,
          type: 'template-addition',
          action: 'add',
          content: templateSection.content
        });
        comparison.added.push({ title, source: 'template' });
      }
    }

    return comparison;
  }

  /**
   * Compare content of two sections
   * @param {Object} currentSection - Current section
   * @param {Object} templateSection - Template section
   * @returns {Object} Content comparison
   */
  compareSectionContent(currentSection, templateSection) {
    const currentContent = currentSection.content.join('\n');
    const templateContent = templateSection.content.join('\n');

    if (currentContent === templateContent) {
      return {
        identical: true,
        changeType: 'none',
        severity: 'none',
        changes: []
      };
    }

    // Analyze type of changes
    const changes = this.analyzeContentChanges(currentContent, templateContent);
    
    return {
      identical: false,
      changeType: changes.type,
      severity: changes.severity,
      changes: changes.details
    };
  }

  /**
   * Analyze the nature of content changes
   * @param {string} current - Current content
   * @param {string} template - Template content
   * @returns {Object} Change analysis
   */
  analyzeContentChanges(current, template) {
    const currentLines = current.split('\n').filter(line => line.trim());
    const templateLines = template.split('\n').filter(line => line.trim());

    const analysis = {
      type: 'modification',
      severity: 'medium',
      details: {
        linesAdded: 0,
        linesRemoved: 0,
        linesModified: 0,
        significantChanges: false
      }
    };

    // Simple diff analysis
    const maxLength = Math.max(currentLines.length, templateLines.length);
    const minLength = Math.min(currentLines.length, templateLines.length);

    analysis.details.linesAdded = Math.max(0, templateLines.length - currentLines.length);
    analysis.details.linesRemoved = Math.max(0, currentLines.length - templateLines.length);

    // Count modified lines
    let modifiedLines = 0;
    for (let i = 0; i < minLength; i++) {
      if (currentLines[i] !== templateLines[i]) {
        modifiedLines++;
      }
    }
    analysis.details.linesModified = modifiedLines;

    // Determine severity
    const totalChanges = analysis.details.linesAdded + analysis.details.linesRemoved + analysis.details.linesModified;
    const changePercentage = (totalChanges / maxLength) * 100;

    if (changePercentage > 50) {
      analysis.severity = 'high';
      analysis.details.significantChanges = true;
    } else if (changePercentage > 20) {
      analysis.severity = 'medium';
    } else {
      analysis.severity = 'low';
    }

    // Determine change type
    if (analysis.details.linesAdded > 0 && analysis.details.linesRemoved === 0) {
      analysis.type = 'addition';
    } else if (analysis.details.linesRemoved > 0 && analysis.details.linesAdded === 0) {
      analysis.type = 'removal';
    } else if (analysis.details.linesModified > 0) {
      analysis.type = 'modification';
    }

    return analysis;
  }

  /**
   * Determine appropriate merge strategy
   * @param {Object} sectionComparison - Section comparison results
   * @returns {string} Merge strategy
   */
  determineMergeStrategy(sectionComparison) {
    const { conflicts, userSections, templateSections } = sectionComparison;

    // If there are conflicts, require manual resolution
    if (conflicts.length > 0) {
      return 'manual';
    }

    // If only template updates, safe to auto-merge
    if (templateSections.length > 0 && userSections.length === 0) {
      return 'safe';
    }

    // If mix of template and user changes, use merge strategy
    if (templateSections.length > 0 && userSections.length > 0) {
      return 'merge';
    }

    // If only user changes, skip update
    if (userSections.length > 0 && templateSections.length === 0) {
      return 'skip';
    }

    // Default to safe
    return 'safe';
  }

  /**
   * Calculate confidence level for merge operation
   * @param {Object} sectionComparison - Section comparison results
   * @returns {string} Confidence level
   */
  calculateConfidence(sectionComparison) {
    const { conflicts, modified } = sectionComparison;

    if (conflicts.length > 0) {
      return 'low';
    }

    const highSeverityChanges = modified.filter(m => m.severity === 'high').length;
    const mediumSeverityChanges = modified.filter(m => m.severity === 'medium').length;

    if (highSeverityChanges > 0) {
      return 'low';
    }

    if (mediumSeverityChanges > 2) {
      return 'medium';
    }

    return 'high';
  }

  /**
   * Categorize changes for user presentation
   * @param {Object} sectionComparison - Section comparison results
   * @returns {Object} Categorized changes
   */
  categorizeChanges(sectionComparison) {
    const categories = {
      templateUpdates: [],
      userCustomizations: [],
      conflicts: [],
      newSections: []
    };

    // Template updates
    categories.templateUpdates = sectionComparison.templateSections
      .filter(s => s.action === 'update')
      .map(s => ({
        title: s.title,
        type: 'update',
        description: `Template section "${s.title}" has updates`,
        severity: this.getSeverityFromChanges(s.changes)
      }));

    // New template sections
    categories.newSections = sectionComparison.templateSections
      .filter(s => s.action === 'add')
      .map(s => ({
        title: s.title,
        type: 'addition',
        description: `New template section "${s.title}" available`,
        severity: 'low'
      }));

    // User customizations
    categories.userCustomizations = sectionComparison.userSections.map(s => ({
      title: s.title,
      type: s.type,
      description: `User customized section "${s.title}" will be preserved`,
      severity: 'info'
    }));

    // Conflicts
    categories.conflicts = sectionComparison.conflicts.map(c => ({
      title: c.title,
      type: 'conflict',
      description: c.reason,
      severity: 'high'
    }));

    return categories;
  }

  /**
   * Get severity from change analysis
   * @param {Object} changes - Change details
   * @returns {string} Severity level
   */
  getSeverityFromChanges(changes) {
    if (!changes) return 'low';
    return changes.severity || 'medium';
  }

  /**
   * Generate merge preview for conflicts
   * @param {Array} conflicts - Array of conflicts
   * @returns {Object} Merge preview
   */
  async generateMergePreview(conflicts) {
    const preview = {
      totalConflicts: conflicts.length,
      resolutions: [],
      recommendations: []
    };

    for (const conflict of conflicts) {
      const resolution = {
        section: conflict.title,
        options: [
          {
            name: 'keep-current',
            description: 'Keep current version (ignore template updates)',
            risk: 'medium',
            impact: 'May miss important template improvements'
          },
          {
            name: 'use-template',
            description: 'Use template version (lose customizations)',
            risk: 'high',
            impact: 'Will overwrite user customizations'
          },
          {
            name: 'manual-merge',
            description: 'Manually merge changes',
            risk: 'low',
            impact: 'Requires user review and decision'
          }
        ],
        recommended: 'manual-merge'
      };

      preview.resolutions.push(resolution);
    }

    // Generate overall recommendations
    if (conflicts.length === 0) {
      preview.recommendations.push('Safe to proceed with automatic merge');
    } else if (conflicts.length <= 2) {
      preview.recommendations.push('Review conflicts manually - small number of issues');
    } else {
      preview.recommendations.push('Consider creating backup before proceeding - multiple conflicts detected');
    }

    return preview;
  }

  /**
   * Detect custom sections in content
   * @param {string} content - File content to analyze
   * @returns {Array} Array of detected custom sections
   */
  async detectCustomSections(content) {
    const sections = this.parseFileIntoSections(content);
    const customSections = [];

    for (const section of sections) {
      if (section.isCustom || this.hasCustomPatterns(section.content.join('\n'))) {
        customSections.push({
          title: section.title,
          startLine: section.startLine,
          endLine: section.endLine,
          confidence: this.getCustomConfidence(section),
          patterns: this.getCustomPatterns(section.content.join('\n'))
        });
      }
    }

    return customSections;
  }

  /**
   * Check if section content has custom patterns
   * @param {string} content - Section content
   * @returns {boolean} True if custom patterns detected
   */
  hasCustomPatterns(content) {
    const customPatterns = [
      /# Custom|# User|# Project/i,
      /TODO:|FIXME:|NOTE:/i,
      /\{\{[^}]+\}\}/g, // Template variables
      /\b(your|my|our|this project|this codebase)\b/gi
    ];

    return customPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get confidence level for custom section detection
   * @param {Object} section - Section object
   * @returns {string} Confidence level
   */
  getCustomConfidence(section) {
    const content = section.content.join('\n');
    const patterns = this.getCustomPatterns(content);
    
    if (section.isCustom) return 'high';
    if (patterns.length >= 3) return 'high';
    if (patterns.length >= 1) return 'medium';
    return 'low';
  }

  /**
   * Get custom patterns found in content
   * @param {string} content - Content to analyze
   * @returns {Array} Array of found patterns
   */
  getCustomPatterns(content) {
    const patterns = [];
    
    if (/# Custom|# User|# Project/i.test(content)) {
      patterns.push('explicit-custom-marker');
    }
    
    if (/TODO:|FIXME:|NOTE:/i.test(content)) {
      patterns.push('development-markers');
    }
    
    if (/\{\{[^}]+\}\}/g.test(content)) {
      patterns.push('template-variables');
    }
    
    if (/\b(your|my|our|this project|this codebase)\b/gi.test(content)) {
      patterns.push('personal-references');
    }

    return patterns;
  }
}

module.exports = { DiffEngine };
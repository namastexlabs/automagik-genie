const inquirer = require('inquirer');
const colors = require('colors');

/**
 * UpdateUI - Handles user interface for update operations
 * Provides interactive prompts, progress indicators, and formatted output
 */
class UpdateUI {
  constructor() {
    this.colors = colors;
    this.spinner = null;
  }

  /**
   * Show current update phase
   * @param {string} phase - Phase name
   * @param {string} description - Phase description
   */
  showPhase(phase, description) {
    console.log('');
    console.log(`🔄 ${colors.cyan.bold(phase)}: ${description}`);
    console.log('');
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    console.log(`✅ ${colors.green(message)}`);
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    console.log(`❌ ${colors.red(message)}`);
  }

  /**
   * Show info message
   * @param {string} message - Info message
   */
  showInfo(message) {
    console.log(`ℹ️  ${colors.blue(message)}`);
  }

  /**
   * Show warning message
   * @param {string} message - Warning message
   */
  showWarning(message) {
    console.log(`⚠️  ${colors.yellow(message)}`);
  }

  /**
   * Display update analysis summary
   * @param {Object} analysis - Update analysis results
   */
  async showUpdateSummary(analysis) {
    console.log(colors.cyan.bold('📊 Update Analysis Summary'));
    console.log('═'.repeat(50).cyan);
    console.log('');

    // Version information
    console.log(`Current Version: ${colors.yellow(analysis.currentVersion)}`);
    console.log(`Latest Version:  ${colors.green(analysis.latestVersion)}`);
    console.log('');

    if (!analysis.hasUpdates) {
      console.log(colors.green('✅ Your system is up to date!'));
      return;
    }

    // Update categories
    console.log(colors.bold('📁 Available Updates:'));
    console.log('');

    const categories = ['agents', 'hooks', 'core'];
    let totalUpdates = 0;

    for (const category of categories) {
      const items = analysis.updateCategories[category] || [];
      if (items.length > 0) {
        console.log(`  ${this.getCategoryIcon(category)} ${colors.bold(category.toUpperCase())}: ${items.length} updates`);
        
        // Show details for each item
        for (const item of items.slice(0, 3)) { // Show first 3
          const icon = this.getRiskIcon(item.risk);
          console.log(`    ${icon} ${item.fileName} (${colors.gray(item.description)})`);
        }
        
        if (items.length > 3) {
          console.log(`    ${colors.gray(`... and ${items.length - 3} more`)}`);
        }
        
        console.log('');
        totalUpdates += items.length;
      }
    }

    // Risk assessment
    if (analysis.risks && analysis.risks.length > 0) {
      console.log(colors.bold('⚠️  Risk Assessment:'));
      console.log('');
      
      for (const risk of analysis.risks) {
        const icon = this.getRiskIcon(risk.level);
        console.log(`  ${icon} ${colors.bold(risk.level.toUpperCase())}: ${risk.description}`);
        
        if (risk.files && risk.files.length > 0) {
          const fileList = risk.files.slice(0, 3).join(', ');
          const extraCount = risk.files.length > 3 ? ` (+${risk.files.length - 3} more)` : '';
          console.log(`    Files: ${colors.gray(fileList + extraCount)}`);
        }
      }
      console.log('');
    }

    // Recommendations
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      console.log(colors.bold('💡 Recommendations:'));
      console.log('');
      
      for (const rec of analysis.recommendations) {
        console.log(`  • ${rec}`);
      }
      console.log('');
    }

    // Summary
    console.log('─'.repeat(50).gray);
    console.log(`Total Updates: ${colors.cyan.bold(totalUpdates)} files`);
    console.log('');
  }

  /**
   * Prompt for global update choices
   * @param {Object} analysis - Update analysis
   * @returns {Object} Global choices
   */
  async promptGlobalChoices(analysis) {
    const hasHighRisk = analysis.risks.some(r => r.level === 'high');
    const hasConflicts = analysis.fileAnalysis.some(f => 
      f.details && f.details.conflicts.length > 0
    );

    const questions = [
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed with the updates?',
        choices: [
          {
            name: '🚀 Proceed with automatic updates (recommended for low-risk changes)',
            value: 'auto',
            disabled: hasHighRisk || hasConflicts ? 'High-risk changes detected - manual review recommended' : false
          },
          {
            name: '👀 Review each file individually',
            value: 'review'
          },
          {
            name: '📋 Show detailed preview first',
            value: 'preview'
          },
          {
            name: '❌ Cancel update',
            value: 'cancel'
          }
        ]
      }
    ];

    if (hasHighRisk || hasConflicts) {
      questions.unshift({
        type: 'confirm',
        name: 'acknowledgeRisk',
        message: colors.yellow('⚠️  High-risk changes or conflicts detected. Do you want to continue?'),
        default: false
      });
    }

    const answers = await inquirer.prompt(questions);

    if (answers.acknowledgeRisk === false) {
      return { cancel: true };
    }

    // Handle preview request
    if (answers.action === 'preview') {
      await this.showDetailedPreview(analysis);
      
      // Ask again after preview
      const followUp = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'After reviewing the preview, how would you like to proceed?',
          choices: [
            { name: '🚀 Proceed with automatic updates', value: 'auto' },
            { name: '👀 Review each file individually', value: 'review' },
            { name: '❌ Cancel update', value: 'cancel' }
          ]
        }
      ]);
      
      answers.action = followUp.action;
    }

    return {
      defaultAction: answers.action === 'auto' ? 'auto' : 'review',
      cancel: answers.action === 'cancel',
      reviewIndividually: answers.action === 'review'
    };
  }

  /**
   * Prompt for file-specific choices
   * @param {Array} complexFiles - Files requiring individual review
   * @returns {Object} File-specific choices
   */
  async promptFileChoices(complexFiles) {
    const choices = {};

    console.log(colors.bold('🔍 Individual File Review'));
    console.log('');

    for (const file of complexFiles) {
      console.log(colors.cyan.bold(`📄 ${file.fileName}`));
      console.log(`   Path: ${colors.gray(file.filePath)}`);
      console.log(`   Risk: ${this.getRiskIcon(file.risk)} ${colors.bold(file.risk.toUpperCase())}`);
      console.log(`   Changes: ${file.description}`);
      
      if (file.details && file.details.conflicts.length > 0) {
        console.log(colors.yellow(`   ⚠️  ${file.details.conflicts.length} conflicts detected`));
      }
      
      console.log('');

      const questions = [
        {
          type: 'list',
          name: 'action',
          message: `What would you like to do with ${file.fileName}?`,
          choices: this.getFileActionChoices(file)
        }
      ];

      // Show diff if requested
      const showDiff = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'showDiff',
          message: 'Would you like to see the detailed changes?',
          default: false
        }
      ]);

      if (showDiff.showDiff) {
        await this.displayFileDiff(file);
      }

      const answer = await inquirer.prompt(questions);
      choices[file.filePath] = answer.action;
      
      console.log('');
    }

    return choices;
  }

  /**
   * Get action choices for a specific file
   * @param {Object} file - File analysis
   * @returns {Array} Choice options
   */
  getFileActionChoices(file) {
    const baseChoices = [
      {
        name: '✅ Accept template updates (recommended)',
        value: 'accept'
      },
      {
        name: '❌ Skip this file (keep current version)',
        value: 'skip'
      }
    ];

    if (file.details && file.details.conflicts.length > 0) {
      baseChoices.splice(1, 0, {
        name: '🔀 Merge with conflict markers (manual resolution)',
        value: 'merge'
      });
    }

    if (file.risk === 'high') {
      baseChoices.push({
        name: '🛑 Keep current and mark as user-modified',
        value: 'preserve'
      });
    }

    return baseChoices;
  }

  /**
   * Display detailed changes for a file
   * @param {Object} file - File analysis
   */
  async displayFileDiff(file) {
    console.log(colors.cyan.bold(`📋 Detailed Changes for ${file.fileName}`));
    console.log('─'.repeat(60).gray);
    
    if (!file.details) {
      console.log(colors.gray('No detailed analysis available'));
      return;
    }

    const { details } = file;

    // Template sections
    if (details.templateSections.length > 0) {
      console.log(colors.green.bold('📤 Template Updates:'));
      for (const section of details.templateSections) {
        console.log(`  • ${section.title} (${section.action})`);
        if (section.changes) {
          console.log(`    Changes: ${colors.gray(section.changes.description || 'Content updated')}`);
        }
      }
      console.log('');
    }

    // User sections
    if (details.userSections.length > 0) {
      console.log(colors.blue.bold('👤 User Customizations (will be preserved):'));
      for (const section of details.userSections) {
        console.log(`  • ${section.title} (${section.type})`);
      }
      console.log('');
    }

    // Conflicts
    if (details.conflicts.length > 0) {
      console.log(colors.red.bold('⚠️  Conflicts Requiring Resolution:'));
      for (const conflict of details.conflicts) {
        console.log(`  • ${conflict.title}`);
        console.log(`    Reason: ${colors.gray(conflict.reason)}`);
      }
      console.log('');
    }

    console.log('─'.repeat(60).gray);
    console.log('');
  }

  /**
   * Show detailed preview of all changes
   * @param {Object} analysis - Update analysis
   */
  async showDetailedPreview(analysis) {
    console.log(colors.cyan.bold('🔍 Detailed Update Preview'));
    console.log('═'.repeat(60).cyan);
    console.log('');

    for (const file of analysis.fileAnalysis) {
      const icon = file.action === 'add' ? '➕' : '📝';
      const riskIcon = this.getRiskIcon(file.risk);
      
      console.log(`${icon} ${colors.bold(file.fileName)} ${riskIcon}`);
      console.log(`   Action: ${colors.cyan(file.action)}`);
      console.log(`   Path: ${colors.gray(file.filePath)}`);
      console.log(`   Description: ${file.description}`);
      
      if (file.details) {
        const { details } = file;
        if (details.templateSections.length > 0) {
          console.log(`   Template updates: ${colors.green(details.templateSections.length)} sections`);
        }
        if (details.userSections.length > 0) {
          console.log(`   User sections preserved: ${colors.blue(details.userSections.length)}`);
        }
        if (details.conflicts.length > 0) {
          console.log(`   Conflicts: ${colors.red(details.conflicts.length)} require resolution`);
        }
      }
      
      console.log('');
    }

    console.log('─'.repeat(60).gray);
    console.log(`Total files: ${analysis.fileAnalysis.length}`);
    console.log('');

    // Pause for user to read
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...'
      }
    ]);
  }

  /**
   * Show progress during operations
   * @param {string} operation - Operation name
   * @param {number} current - Current progress
   * @param {number} total - Total items
   */
  showProgress(operation, current, total) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);
    
    console.log(`${operation}: ${progressBar} ${current}/${total} (${percentage}%)`);
  }

  /**
   * Create progress bar
   * @param {number} percentage - Progress percentage
   * @returns {string} Progress bar string
   */
  createProgressBar(percentage) {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    return colors.green('█'.repeat(filled)) + colors.gray('░'.repeat(empty));
  }

  /**
   * Prompt for backup restoration
   * @returns {boolean} True if user wants to restore
   */
  async promptRestoreFromBackup() {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'restore',
        message: colors.yellow('⚠️  Update failed. Would you like to restore from backup?'),
        default: true
      }
    ]);
    
    return answer.restore;
  }

  /**
   * Show final update summary
   * @param {Object} results - Update results
   */
  showUpdateSummary(results) {
    console.log('');
    console.log(colors.cyan.bold('📋 Update Summary'));
    console.log('═'.repeat(40).cyan);
    console.log('');

    if (results.updates) {
      const successful = results.updates.filter(u => u.success);
      const failed = results.updates.filter(u => !u.success);

      console.log(`✅ Successful updates: ${colors.green.bold(successful.length)}`);
      if (failed.length > 0) {
        console.log(`❌ Failed updates: ${colors.red.bold(failed.length)}`);
      }
      console.log('');

      // Show successful updates
      if (successful.length > 0) {
        console.log(colors.green.bold('✅ Successfully Updated:'));
        for (const update of successful) {
          console.log(`  • ${update.filePath} (${update.action})`);
        }
        console.log('');
      }

      // Show failed updates
      if (failed.length > 0) {
        console.log(colors.red.bold('❌ Failed to Update:'));
        for (const update of failed) {
          console.log(`  • ${update.filePath}: ${colors.gray(update.error)}`);
        }
        console.log('');
      }
    }

    // Show warnings
    if (results.warnings && results.warnings.length > 0) {
      console.log(colors.yellow.bold('⚠️  Warnings:'));
      for (const warning of results.warnings) {
        console.log(`  • ${warning}`);
      }
      console.log('');
    }

    // Show backup info
    if (results.backup) {
      console.log(colors.blue.bold('💾 Backup Information:'));
      console.log(`  ID: ${results.backup.backupId}`);
      console.log(`  Files: ${results.backup.fileCount}`);
      console.log(`  Path: ${colors.gray(results.backup.path)}`);
      console.log('');
    }

    console.log('─'.repeat(40).gray);
    console.log(colors.green('🎉 Update process completed!'));
    console.log('');
  }

  /**
   * Get category icon
   * @param {string} category - Category name
   * @returns {string} Icon
   */
  getCategoryIcon(category) {
    const icons = {
      agents: '🤖',
      hooks: '🔗',
      core: '⚙️'
    };
    return icons[category] || '📁';
  }

  /**
   * Get risk level icon
   * @param {string} risk - Risk level
   * @returns {string} Icon with color
   */
  getRiskIcon(risk) {
    const icons = {
      low: '🟢',
      medium: '🟡', 
      high: '🔴'
    };
    return icons[risk] || '⚪';
  }

  /**
   * Confirm risky operation
   * @param {string} operation - Operation description
   * @param {Object} details - Risk details
   * @returns {boolean} User confirmation
   */
  async confirmRiskyOperation(operation, details) {
    console.log('');
    console.log(colors.red.bold('⚠️  HIGH RISK OPERATION'));
    console.log('═'.repeat(50).red);
    console.log('');
    console.log(`Operation: ${colors.bold(operation)}`);
    console.log('');
    
    if (details.risks) {
      console.log(colors.bold('Potential Risks:'));
      for (const risk of details.risks) {
        console.log(`  • ${colors.red(risk)}`);
      }
      console.log('');
    }
    
    if (details.consequences) {
      console.log(colors.bold('Consequences:'));
      for (const consequence of details.consequences) {
        console.log(`  • ${colors.yellow(consequence)}`);
      }
      console.log('');
    }

    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: colors.red.bold('Are you absolutely sure you want to proceed?'),
        default: false
      }
    ]);

    return answer.confirm;
  }
}

module.exports = { UpdateUI };
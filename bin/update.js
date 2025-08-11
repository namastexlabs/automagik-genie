#!/usr/bin/env node

const { UpdateEngine } = require('../lib/update/engine');
const { BackupManager } = require('../lib/update/backup');
const { MetadataManager } = require('../lib/update/metadata');
const { createGenieVersion, fileExists } = require('../lib/init');
const yargs = require('yargs');
const colors = require('colors');
const path = require('path');
const fs = require('fs').promises;

const argv = yargs
  .usage('Usage: $0 <command> [options]')
  .command('update', 'Update automagik-genie agents and hooks', {
    'dry-run': {
      type: 'boolean',
      alias: 'd',
      description: 'Show what would be updated without making changes',
      default: false
    },
    'agents-only': {
      type: 'boolean',
      alias: 'a',
      description: 'Update only agents, skip hooks',
      default: false
    },
    'hooks-only': {
      type: 'boolean',
      alias: 'h',
      description: 'Update only hooks, skip agents',
      default: false
    },
    'force': {
      type: 'boolean',
      alias: 'f',
      description: 'Skip confirmation prompts (use with caution)',
      default: false
    },
    'backup-dir': {
      type: 'string',
      alias: 'b',
      description: 'Custom backup directory path'
    },
    'project-path': {
      type: 'string',
      alias: 'p',
      description: 'Path to project (defaults to current directory)',
      default: process.cwd()
    }
  })
  .command('rollback [backup-id]', 'Rollback to a previous backup', {
    'backup-id': {
      type: 'string',
      description: 'Specific backup ID to rollback to'
    },
    'list': {
      type: 'boolean',
      alias: 'l',
      description: 'List available backups',
      default: false
    },
    'force': {
      type: 'boolean',
      alias: 'f',
      description: 'Skip confirmation prompts',
      default: false
    }
  })
  .command('status', 'Show current system status and available updates', {
    'check-remote': {
      type: 'boolean',
      alias: 'r',
      description: 'Check for updates on remote repository',
      default: false
    },
    'detailed': {
      type: 'boolean',
      alias: 'd',
      description: 'Show detailed file-by-file analysis',
      default: false
    }
  })
  .command('cleanup', 'Clean up old backups and cache', {
    'max-age': {
      type: 'number',
      alias: 'a',
      description: 'Maximum age of backups to keep (days)',
      default: 30
    },
    'keep-count': {
      type: 'number',
      alias: 'k',
      description: 'Minimum number of backups to keep',
      default: 5
    },
    'cache': {
      type: 'boolean',
      description: 'Also clean template cache',
      default: false
    }
  })
  .demandCommand(1, 'You need to specify a command')
  .help('help')
  .alias('help', 'h')
  .version(false) // Disable default version flag
  .option('version', {
    alias: 'v',
    type: 'boolean',
    description: 'Show version information'
  })
  .example('$0 update', 'Update all agents and hooks')
  .example('$0 update --dry-run', 'Preview updates without applying them')
  .example('$0 update --agents-only --force', 'Update only agents without prompts')
  .example('$0 rollback --list', 'List available backups')
  .example('$0 rollback backup-2024-01-15T10-30-00-000Z', 'Rollback to specific backup')
  .example('$0 status --check-remote', 'Check for remote updates')
  .example('$0 cleanup --max-age 7', 'Clean backups older than 7 days')
  .argv;

/**
 * Main entry point for update CLI
 */
async function main() {
  try {
    const command = argv._[0];

    // Handle version flag
    if (argv.version) {
      await showVersion();
      return;
    }

    // Validate project path
    const projectPath = path.resolve(argv.projectPath || process.cwd());
    if (!await directoryExists(projectPath)) {
      console.error(colors.red(`❌ Project path does not exist: ${projectPath}`));
      process.exit(1);
    }

    switch (command) {
      case 'update':
        await handleUpdate(argv, projectPath);
        break;
      case 'rollback':
        await handleRollback(argv, projectPath);
        break;
      case 'status':
        await handleStatus(argv, projectPath);
        break;
      case 'cleanup':
        await handleCleanup(argv, projectPath);
        break;
      default:
        console.error(colors.red(`❌ Unknown command: ${command}`));
        yargs.showHelp();
        process.exit(1);
    }

  } catch (error) {
    console.error(colors.red(`❌ ${error.message}`));
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Handle update command
 * @param {Object} options - Command options
 * @param {string} projectPath - Project path
 */
async function handleUpdate(options, projectPath) {
  console.log(colors.cyan.bold('🧞 Automagik Genie Update System'));
  console.log('═'.repeat(50).cyan);
  console.log('');

  // Check if this is a valid genie project
  const claudeDir = path.join(projectPath, '.claude');
  if (!await directoryExists(claudeDir)) {
    console.error(colors.red('❌ This does not appear to be an initialized Genie project.'));
    console.error(colors.gray('   Run "npx automagik-genie init" first to initialize the project.'));
    process.exit(1);
  }
  
  // Ensure version file exists - create if missing
  const versionPath = path.join(claudeDir, 'genie-version.json');
  if (!await fileExists(versionPath)) {
    console.log(colors.yellow('📋 Creating missing version file...'));
    await createGenieVersion(claudeDir);
  }

  if (options.dryRun) {
    console.log(colors.yellow('🔍 DRY RUN MODE - No changes will be made'));
    console.log('');
  }

  const updateOptions = {
    dryRun: options.dryRun,
    force: options.force,
    agentsOnly: options.agentsOnly,
    hooksOnly: options.hooksOnly,
    projectPath
  };

  const engine = new UpdateEngine({ 
    projectPath,
    backupDir: options.backupDir 
  });

  const result = await engine.executeUpdate(updateOptions);

  if (result.success) {
    console.log(colors.green.bold('✨ Update completed successfully!'));
    
    if (options.dryRun) {
      console.log('');
      console.log(colors.yellow('💡 To apply these changes, run the command without --dry-run'));
    }
  } else {
    console.error(colors.red.bold('❌ Update failed'));
    process.exit(1);
  }
}

/**
 * Handle rollback command
 * @param {Object} options - Command options
 * @param {string} projectPath - Project path
 */
async function handleRollback(options, projectPath) {
  const backup = new BackupManager();

  if (options.list) {
    await showBackupList(backup);
    return;
  }

  if (!options.backupId) {
    console.error(colors.red('❌ Backup ID is required for rollback'));
    console.error(colors.gray('   Use --list to see available backups'));
    process.exit(1);
  }

  console.log(colors.cyan.bold('🔄 Automagik Genie Rollback'));
  console.log('═'.repeat(40).cyan);
  console.log('');

  // Validate backup exists
  const backupInfo = await backup.getBackupInfo(options.backupId);
  if (!backupInfo) {
    console.error(colors.red(`❌ Backup not found: ${options.backupId}`));
    process.exit(1);
  }

  // Show backup information
  console.log(colors.bold('📋 Backup Information:'));
  console.log(`   ID: ${backupInfo.id}`);
  console.log(`   Created: ${new Date(backupInfo.timestamp).toLocaleString()}`);
  console.log(`   Files: ${backupInfo.fileCount}`);
  console.log(`   Valid: ${backupInfo.valid ? '✅' : '❌'}`);
  console.log('');

  if (!backupInfo.valid) {
    console.error(colors.red('❌ Backup is corrupted or invalid'));
    process.exit(1);
  }

  // Confirm rollback
  if (!options.force) {
    const inquirer = require('inquirer');
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: colors.yellow('⚠️  This will overwrite current files. Are you sure?'),
        default: false
      }
    ]);

    if (!answer.confirm) {
      console.log(colors.gray('   Rollback cancelled'));
      return;
    }
  }

  console.log(colors.cyan('🔄 Executing rollback...'));
  
  const result = await backup.restoreFromBackup(options.backupId, projectPath);
  
  if (result.success) {
    console.log(colors.green.bold('✅ Rollback completed successfully!'));
    console.log(`   Restored ${result.restoredFiles} files`);
  } else {
    console.error(colors.red.bold('❌ Rollback failed'));
    process.exit(1);
  }
}

/**
 * Handle status command
 * @param {Object} options - Command options
 * @param {string} projectPath - Project path
 */
async function handleStatus(options, projectPath) {
  console.log(colors.cyan.bold('📊 Automagik Genie Status'));
  console.log('═'.repeat(40).cyan);
  console.log('');

  const metadata = new MetadataManager();
  const engine = new UpdateEngine({ projectPath });

  // Initialize registries if needed
  await metadata.initializeRegistries();

  // Get current system status
  const stats = await metadata.getRegistryStats();
  const currentVersion = await getCurrentVersion();

  console.log(colors.bold('📦 System Information:'));
  console.log(`   Installed Version: ${colors.cyan(currentVersion)}`);
  console.log(`   Project Path: ${colors.gray(projectPath)}`);
  console.log('');

  console.log(colors.bold('📁 File Statistics:'));
  console.log(`   Agents: ${colors.cyan(stats.agents.total)} (${stats.agents.modified} modified)`);
  console.log(`   Hooks: ${colors.cyan(stats.hooks.total)} (${stats.hooks.modified} modified)`);
  console.log(`   Last Updated: ${new Date(stats.agents.lastUpdate).toLocaleString()}`);
  console.log('');

  // Check for remote updates if requested
  if (options.checkRemote) {
    console.log(colors.cyan('🔍 Checking for remote updates...'));
    
    try {
      const analysis = await engine.preUpdateAnalysis({ skipUserPrompts: true });
      
      if (analysis.hasUpdates) {
        console.log(colors.green(`✨ Updates available: ${analysis.latestVersion}`));
        
        const totalUpdates = Object.values(analysis.updateCategories)
          .reduce((sum, category) => sum + category.length, 0);
        
        console.log(`   Available Updates: ${colors.cyan(totalUpdates)} files`);
        
        if (options.detailed) {
          console.log('');
          console.log(colors.bold('📋 Available Updates:'));
          
          for (const [category, items] of Object.entries(analysis.updateCategories)) {
            if (items.length > 0) {
              console.log(`   ${category.toUpperCase()}: ${items.length} updates`);
              
              for (const item of items) {
                const riskIcon = item.risk === 'high' ? '🔴' : item.risk === 'medium' ? '🟡' : '🟢';
                console.log(`     ${riskIcon} ${item.fileName}`);
              }
            }
          }
        }
        
        console.log('');
        console.log(colors.yellow('💡 Run "npx automagik-genie update" to apply updates'));
        
      } else {
        console.log(colors.green('✅ System is up to date'));
      }
      
    } catch (error) {
      console.log(colors.red(`❌ Failed to check for updates: ${error.message}`));
    }
  }

  // Show backup information
  const backup = new BackupManager();
  const backups = await backup.listAvailableBackups();
  
  if (backups.length > 0) {
    console.log(colors.bold('💾 Recent Backups:'));
    
    const recentBackups = backups.slice(0, 3);
    for (const backupInfo of recentBackups) {
      const status = backupInfo.valid ? '✅' : '❌';
      const date = backupInfo.timestamp ? new Date(backupInfo.timestamp).toLocaleString() : 'Unknown';
      console.log(`   ${status} ${backupInfo.id} (${date})`);
    }
    
    if (backups.length > 3) {
      console.log(`   ${colors.gray(`... and ${backups.length - 3} more backups`)}`);
    }
    
    console.log('');
    console.log(colors.gray('💡 Use "npx automagik-genie rollback --list" to see all backups'));
  }
}

/**
 * Handle cleanup command
 * @param {Object} options - Command options
 * @param {string} projectPath - Project path
 */
async function handleCleanup(options, projectPath) {
  console.log(colors.cyan.bold('🧹 Automagik Genie Cleanup'));
  console.log('═'.repeat(40).cyan);
  console.log('');

  const backup = new BackupManager();
  let totalCleaned = 0;

  // Clean old backups
  console.log(colors.cyan('🗑️  Cleaning old backups...'));
  
  const backupCleanup = await backup.cleanupOldBackups(options.maxAge, options.keepCount);
  totalCleaned += backupCleanup.deleted;
  
  console.log(`   Deleted: ${colors.cyan(backupCleanup.deleted)} old backups`);
  console.log(`   Remaining: ${colors.cyan(backupCleanup.remaining)} backups`);
  
  // Clean template cache if requested
  if (options.cache) {
    console.log('');
    console.log(colors.cyan('🗂️  Cleaning template cache...'));
    
    const templates = require('../lib/update/templates');
    const templateManager = new templates.TemplateManager();
    
    try {
      await templateManager.clearCache();
      console.log('   ✅ Template cache cleared');
    } catch (error) {
      console.log(`   ⚠️  Failed to clear cache: ${error.message}`);
    }
  }

  console.log('');
  
  if (totalCleaned > 0) {
    console.log(colors.green.bold(`✨ Cleanup completed! Removed ${totalCleaned} items`));
  } else {
    console.log(colors.green.bold('✨ Nothing to clean - system is already tidy!'));
  }
}

/**
 * Show backup list
 * @param {BackupManager} backup - Backup manager instance
 */
async function showBackupList(backup) {
  console.log(colors.cyan.bold('💾 Available Backups'));
  console.log('═'.repeat(50).cyan);
  console.log('');

  const backups = await backup.listAvailableBackups();

  if (backups.length === 0) {
    console.log(colors.gray('No backups found'));
    return;
  }

  console.log(colors.bold('ID'.padEnd(30) + 'Created'.padEnd(20) + 'Files'.padEnd(8) + 'Status'));
  console.log('─'.repeat(70).gray);

  for (const backupInfo of backups) {
    const status = backupInfo.valid ? colors.green('✅ Valid') : colors.red('❌ Invalid');
    const date = backupInfo.timestamp ? 
      new Date(backupInfo.timestamp).toLocaleString() : 
      'Unknown';
    
    console.log(
      colors.cyan(backupInfo.id.padEnd(30)) +
      colors.gray(date.padEnd(20)) +
      colors.cyan(backupInfo.fileCount.toString().padEnd(8)) +
      status
    );
  }

  console.log('');
  console.log(`Total: ${colors.cyan.bold(backups.length)} backups`);
  console.log('');
  console.log(colors.gray('💡 Use "npx automagik-genie rollback <backup-id>" to restore'));
}

/**
 * Show version information
 */
async function showVersion() {
  const currentVersion = await getCurrentVersion();
  
  console.log(colors.cyan.bold('🧞 Automagik Genie Update System'));
  console.log(`Version: ${colors.green(currentVersion)}`);
  console.log('');
  
  try {
    const templates = require('../lib/update/templates');
    const templateManager = new templates.TemplateManager();
    const latestRelease = await templateManager.fetchLatestRelease();
    
    console.log(`Latest Available: ${colors.cyan(latestRelease.version)}`);
    
    if (currentVersion !== latestRelease.version) {
      console.log(colors.yellow('💡 Update available! Run "npx automagik-genie update" to upgrade'));
    } else {
      console.log(colors.green('✅ You have the latest version'));
    }
  } catch (error) {
    console.log(colors.gray('Could not check for latest version'));
  }
}

/**
 * Get current version from package.json
 */
async function getCurrentVersion() {
  const packageJson = require('../package.json');
  return packageJson.version;
}

/**
 * Check if directory exists
 * @param {string} dirPath - Directory path to check
 */
async function directoryExists(dirPath) {
  try {
    const fs = require('fs').promises;
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch (error) {
    return false;
  }
}

// Handle unhandled errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(colors.red(`❌ Unexpected error: ${error.message}`));
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(colors.red(`❌ Fatal error: ${error.message}`));
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Run main function
main();
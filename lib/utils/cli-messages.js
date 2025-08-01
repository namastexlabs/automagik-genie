/**
 * CLI Messages Utility
 * Standardizes user-facing messages and formatting across the application
 */

/**
 * Display a success message with emoji
 * @param {string} text - Message text
 * @param {string} emoji - Emoji to use (default: ✅)
 */
const successMessage = (text, emoji = '✅') => {
  console.log(`${emoji} ${text}`);
};

/**
 * Display an error message with emoji
 * @param {string} text - Message text
 * @param {string} emoji - Emoji to use (default: ❌)
 */
const errorMessage = (text, emoji = '❌') => {
  console.log(`${emoji} ${text}`);
};

/**
 * Display an info message with emoji
 * @param {string} text - Message text
 * @param {string} emoji - Emoji to use (default: 💡)
 */
const infoMessage = (text, emoji = '💡') => {
  console.log(`${emoji} ${text}`);
};

/**
 * Display a warning message with emoji
 * @param {string} text - Message text
 * @param {string} emoji - Emoji to use (default: ⚠️)
 */
const warningMessage = (text, emoji = '⚠️') => {
  console.log(`${emoji} ${text}`);
};

/**
 * Display a progress message with emoji
 * @param {string} text - Message text
 * @param {string} emoji - Emoji to use (default: 🧞)
 */
const progressMessage = (text, emoji = '🧞') => {
  console.log(`${emoji} ${text}`);
};

/**
 * Display the main Genie header
 */
const showGenieHeader = () => {
  console.log('🧞 Automagik Genie - Universal AI Development Companion');
  console.log('');
};

/**
 * Display CLI usage help
 */
const showUsageHelp = () => {
  console.log('Usage:');
  console.log('  npx automagik-genie init    Initialize Genie in current project');
  console.log('  npx automagik-genie --help  Show this help message');
  console.log('');
};

/**
 * Display requirements information
 */
const showRequirements = () => {
  console.log('Requirements:');
  console.log('  - Claude CLI must be installed and authenticated');
  console.log('  - Run in any project directory (any programming language)');
  console.log('');
};

/**
 * Display what Genie does
 */
const showFeatures = () => {
  console.log('What it does:');
  console.log('  ✨ Analyzes your codebase (any language: Go, Rust, Python, JS, etc.)');
  console.log('  🤖 Creates project-specific AI agents');
  console.log('  🎯 Provides /wish command for development assistance');
  console.log('  🔧 Installs optional development workflow hooks');
  console.log('');
};

/**
 * Display post-initialization commands
 */
const showPostInitCommands = () => {
  console.log('After initialization:');
  console.log('  /wish "analyze this codebase"');
  console.log('  /wish "add authentication system"');
  console.log('  /wish "fix failing tests"');
  console.log('');
  console.log('Learn more: https://github.com/automagik-genie/automagik-genie');
};

/**
 * Display complete help message
 */
const showCompleteHelp = () => {
  showGenieHeader();
  showUsageHelp();
  showRequirements();
  showFeatures();
  showPostInitCommands();
};

/**
 * Display Claude CLI installation instructions
 */
const showClaudeInstallInstructions = () => {
  errorMessage('Claude CLI not found');
  console.log('');
  console.log('🚀 To use Automagik Genie, you need Claude Code installed:');
  console.log('');
  console.log('📦 Setup Guide:');
  console.log('   https://docs.anthropic.com/en/docs/claude-code/setup');
  console.log('');
  console.log('🔐 Then authenticate:');
  console.log('   claude auth');
  console.log('');
  infoMessage('After installation, run: npx automagik-genie init');
  console.log('');
  console.log('📚 For more help: https://docs.anthropic.com/en/docs/claude-code');
  console.log('');
};

/**
 * Display project initialization start message
 * @param {string} projectPath - Path where initialization is happening
 */
const showInitializationStart = (projectPath) => {
  progressMessage('Initializing Automagik Genie...');
  console.log('');
  console.log(`🔍 Initializing in: ${projectPath}`);
};

/**
 * Display project structure creation message
 */
const showStructureCreation = () => {
  console.log('🏗️  Creating project structure...');
};

/**
 * Display project name detection
 * @param {string} projectName - Detected project name
 */
const showProjectName = (projectName) => {
  console.log(`📝 Project name: ${projectName}`);
};

/**
 * Display agent creation message
 */
const showAgentCreation = () => {
  console.log('🤖 Creating project-specific agents...');
};

/**
 * Display hook installation message
 */
const showHookInstallation = () => {
  console.log('🔧 Installing hook examples...');
};

/**
 * Display command creation message
 */
const showCommandCreation = () => {
  console.log('📚 Creating wish command...');
};

/**
 * Display CLAUDE.md generation message
 */
const showClaudeMdGeneration = () => {
  console.log('📄 Generating CLAUDE.md...');
};

/**
 * Display initialization completion message
 */
const showInitializationComplete = () => {
  successMessage('Initialization complete!');
  console.log('');
  successMessage('Genie successfully initialized!');
  console.log('');
  progressMessage('Starting intelligent codebase analysis...');
  console.log('');
};

/**
 * Display post-initialization instructions
 */
const showPostInitInstructions = () => {
  console.log('🔍 The analyzer agent will auto-detect your tech stack');
  console.log('');
  console.log('🎯 Available commands:');
  console.log('   /wish "add feature X"     - Request new functionality');  
  console.log('   /wish "fix failing tests" - Debug and repair issues');
  console.log('   /wish "optimize performance" - Improve code efficiency');
  console.log('');
  console.log('📚 Check .claude/hooks/examples/ for optional workflow automation');
  console.log('');
  console.log('Happy coding! 🧞✨');
};

/**
 * Display troubleshooting information
 */
const showTroubleshooting = () => {
  console.log('🔧 Troubleshooting:');
  console.log('   • Ensure you have write permissions in this directory');
  console.log('   • Check that Claude CLI is properly authenticated');
  console.log('   • Try running: claude auth');
  console.log('');
};

/**
 * Display error with troubleshooting
 * @param {string} errorMessage - Error message to display
 */
const showErrorWithTroubleshooting = (errorMessage) => {
  errorMessage(`Initialization failed: ${errorMessage}`);
  console.log('');
  showTroubleshooting();
};

/**
 * Display analysis automation error
 * @param {Error} error - Error object from analysis attempt
 */
const showAnalysisError = (error) => {
  console.log('');
  console.log('⚠️  Could not auto-start analysis:');
  if (error.code === 'ENOENT') {
    console.log('   Claude CLI not found in PATH');
    console.log('   Please ensure Claude CLI is installed and authenticated');
  } else {
    console.log(`   ${error.message}`);
  }
  console.log('');
  infoMessage('Manual analysis: Run the following when ready:');
  console.log('   /wish "analyze this codebase and provide development recommendations"');
  console.log('');
  showPostInitInstructions();
};

/**
 * Display analysis completion message
 * @param {number} exitCode - Process exit code
 */
const showAnalysisComplete = (exitCode) => {
  console.log('');
  if (exitCode === 0) {
    successMessage('Analysis complete!');
  } else {
    infoMessage('Manual analysis available - run when ready:');
    console.log('   /wish "analyze this codebase and provide development recommendations"');
  }
  console.log('');
  showPostInitInstructions();
};

/**
 * Display backup creation message
 * @param {string} backupDir - Backup directory name
 */
const showBackupCreated = (backupDir) => {
  successMessage(`Backup completed: ${backupDir}`);
  console.log('');
};

/**
 * Display existing installation warning
 */
const showExistingInstallation = () => {
  warningMessage('Existing Automagik Genie installation detected');
  console.log('');
};

module.exports = {
  successMessage,
  errorMessage,
  infoMessage,
  warningMessage,
  progressMessage,
  showGenieHeader,
  showUsageHelp,
  showRequirements,
  showFeatures,
  showPostInitCommands,
  showCompleteHelp,
  showClaudeInstallInstructions,
  showInitializationStart,
  showStructureCreation,
  showProjectName,
  showAgentCreation,
  showHookInstallation,
  showCommandCreation,
  showClaudeMdGeneration,
  showInitializationComplete,
  showPostInitInstructions,
  showTroubleshooting,
  showErrorWithTroubleshooting,
  showAnalysisError,
  showAnalysisComplete,
  showBackupCreated,
  showExistingInstallation
};
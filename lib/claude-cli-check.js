const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Check if Claude CLI is installed and provide installation guidance
 * @returns {Promise<boolean>} True if Claude CLI is available
 */
const checkClaude = async () => {
  try {
    const { stdout } = await execAsync('claude -v');
    console.log('✅ Claude CLI found:', stdout.trim());
    return true;
  } catch (error) {
    console.log('❌ Claude CLI not found');
    console.log('');
    console.log('🚀 To use Automagik Genie, you need Claude Code installed:');
    console.log('');
    console.log('📦 Setup Guide:');
    console.log('   https://docs.anthropic.com/en/docs/claude-code/setup');
    console.log('');
    console.log('🔐 Then authenticate:');
    console.log('   claude auth');
    console.log('');
    console.log('💡 After installation, run: npx automagik-genie init');
    console.log('');
    console.log('📚 For more help: https://docs.anthropic.com/en/docs/claude-code');
    console.log('');
    return false;
  }
};

/**
 * Verify Claude CLI is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
const checkClaudeAuth = async () => {
  try {
    // Try a simple command that requires authentication
    await execAsync('claude --help');
    return true;
  } catch (error) {
    console.log('⚠️  Claude CLI found but may not be authenticated');
    console.log('🔐 Run: claude auth');
    console.log('');
    return false;
  }
};

/**
 * Complete Claude CLI validation
 * @returns {Promise<boolean>} True if Claude CLI is ready to use
 */
const validateClaude = async () => {
  console.log('🔍 Checking Claude CLI installation...');
  
  const isInstalled = await checkClaude();
  if (!isInstalled) {
    return false;
  }
  
  const isAuthenticated = await checkClaudeAuth();
  if (!isAuthenticated) {
    console.log('💡 Complete authentication and run: npx automagik-genie init');
    return false;
  }
  
  console.log('✅ Claude CLI is ready!');
  return true;
};

module.exports = {
  checkClaude,
  checkClaudeAuth,
  validateClaude
};
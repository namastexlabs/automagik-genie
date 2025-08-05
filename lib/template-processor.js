const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Process template content by replacing variables
 * @param {string} templateContent - Template content with {{VARIABLE}} placeholders
 * @param {Object} variables - Variables to replace
 * @returns {string} Processed content
 */
const processTemplate = (templateContent, variables) => {
  let processed = templateContent;
  
  // Replace all template variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value);
  });
  
  return processed;
};

/**
 * Extract project name from package.json or directory name
 * @param {string} projectPath - Path to project
 * @returns {Promise<string>} Clean project name
 */
const getProjectName = async (projectPath) => {
  try {
    // Try to read package.json first
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    if (packageJson.name) {
      return sanitizeProjectName(packageJson.name);
    }
  } catch (error) {
    // Fallback to directory name
  }
  
  // Use directory name as fallback
  const dirName = path.basename(projectPath);
  return sanitizeProjectName(dirName);
};

/**
 * Sanitize project name for agent naming
 * @param {string} name - Raw project name
 * @returns {string} Sanitized name suitable for agent prefixes
 */
const sanitizeProjectName = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20); // Limit length for readability
};

/**
 * Get git origin URL if available
 * @param {string} projectPath - Path to project
 * @returns {Promise<string>} Git origin URL or empty string
 */
const getGitOrigin = async (projectPath) => {
  try {
    const { stdout } = await execAsync('git remote get-url origin', { cwd: projectPath });
    return stdout.trim();
  } catch (error) {
    return '';
  }
};

/**
 * Check if file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Read JSON file safely
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object|null>} Parsed JSON or null
 */
const readJsonFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

/**
 * Generate template variables for project with optional backup analysis
 * @param {string} projectPath - Path to project
 * @param {Object} backupAnalysis - Optional backup analysis results
 * @returns {Promise<Object>} Variables for template processing
 */
const generateProjectVariables = async (projectPath, backupAnalysis = null) => {
  const projectName = await getProjectName(projectPath);
  const gitOrigin = await getGitOrigin(projectPath);
  
  const variables = {
    PROJECT_NAME: projectName,
    GIT_ORIGIN: gitOrigin,
    TIMESTAMP: new Date().toISOString(),
    // Note: Tech stack detection is handled by genie-analyzer
    // No hardcoded framework/language assumptions here
  };
  
  // Integrate backup analysis if provided
  if (backupAnalysis) {
    variables.BACKUP_BUILD_COMMANDS = backupAnalysis.buildCommands.join('\n');
    variables.BACKUP_TESTING_FRAMEWORKS = backupAnalysis.testingFrameworks.join(', ');
    variables.BACKUP_CODE_STYLE_PREFS = backupAnalysis.codeStylePrefs.join(', ');
    variables.BACKUP_CUSTOM_AGENTS = backupAnalysis.customAgents.join(', ');
    variables.BACKUP_PROJECT_DESCRIPTION = backupAnalysis.projectDescription || '';
    variables.BACKUP_ORIGINAL_TIMESTAMP = backupAnalysis.originalTimestamp || '';
    variables.BACKUP_DEVELOPMENT_NOTES = backupAnalysis.developmentNotes.join('\n\n');
    variables.BACKUP_PRESERVED_SECTIONS = Object.entries(backupAnalysis.preservedSections)
      .map(([section, content]) => `${section}\n${content}`)
      .join('\n\n');
    variables.HAS_BACKUP_DATA = true;
    
    // Generate conditional template lines
    variables.BACKUP_PREVIOUS_SETUP_LINE = backupAnalysis.originalTimestamp ? 
      `**Previous Setup**: ${backupAnalysis.originalTimestamp}` : '';
    variables.BACKUP_PROJECT_DESCRIPTION_LINE = backupAnalysis.projectDescription ? 
      `**Project Description**: ${backupAnalysis.projectDescription}` : '';
    
    // Generate comprehensive backup section
    variables.BACKUP_RECOVERED_SECTION = generateBackupRecoveredSection(backupAnalysis);
    
  } else {
    variables.HAS_BACKUP_DATA = false;
    variables.BACKUP_BUILD_COMMANDS = '';
    variables.BACKUP_TESTING_FRAMEWORKS = '';
    variables.BACKUP_CODE_STYLE_PREFS = '';
    variables.BACKUP_CUSTOM_AGENTS = '';
    variables.BACKUP_PROJECT_DESCRIPTION = '';
    variables.BACKUP_ORIGINAL_TIMESTAMP = '';
    variables.BACKUP_DEVELOPMENT_NOTES = '';
    variables.BACKUP_PRESERVED_SECTIONS = '';
    variables.BACKUP_PREVIOUS_SETUP_LINE = '';
    variables.BACKUP_PROJECT_DESCRIPTION_LINE = '';
    variables.BACKUP_RECOVERED_SECTION = '';
  }
  
  return variables;
};

/**
 * Generate backup recovered section for template
 * @param {Object} backupAnalysis - Backup analysis results
 * @returns {string} Formatted backup section
 */
const generateBackupRecoveredSection = (backupAnalysis) => {
  if (!backupAnalysis || (
    backupAnalysis.buildCommands.length === 0 &&
    backupAnalysis.testingFrameworks.length === 0 &&
    backupAnalysis.codeStylePrefs.length === 0 &&
    backupAnalysis.customAgents.length === 0 &&
    Object.keys(backupAnalysis.preservedSections).length === 0
  )) {
    return '';
  }

  let section = '## 🔄 Recovered Project Information\n\n';
  section += `**Configuration Enhanced**: Information recovered from backup and integrated\n\n`;

  // Build commands section
  if (backupAnalysis.buildCommands.length > 0) {
    section += '### 📦 Build & Development Commands\n';
    section += backupAnalysis.buildCommands.map(cmd => `- \`${cmd}\``).join('\n') + '\n\n';
  }

  // Testing and quality section
  if (backupAnalysis.testingFrameworks.length > 0 || backupAnalysis.codeStylePrefs.length > 0) {
    section += '### 🧪 Testing & Quality\n';
    if (backupAnalysis.testingFrameworks.length > 0) {
      section += `**Testing Frameworks**: ${backupAnalysis.testingFrameworks.join(', ')}\n`;
    }
    if (backupAnalysis.codeStylePrefs.length > 0) {
      section += `**Code Style Tools**: ${backupAnalysis.codeStylePrefs.join(', ')}\n`;
    }
    section += '\n';
  }

  // Custom agents section
  if (backupAnalysis.customAgents.length > 0) {
    section += '### 🤖 Custom Agents Found\n';
    section += backupAnalysis.customAgents.map(agent => `- ${agent}`).join('\n') + '\n\n';
  }

  // Preserved sections
  if (Object.keys(backupAnalysis.preservedSections).length > 0) {
    section += '### 📚 Preserved Sections\n';
    section += Object.entries(backupAnalysis.preservedSections)
      .map(([sectionName, content]) => {
        const truncated = content.length > 300 ? 
          content.substring(0, 300) + '...\n\n*[Section preserved from backup - full content available in agent memory]*' : 
          content;
        return `#### ${sectionName}\n${truncated}`;
      }).join('\n\n') + '\n\n';
  }

  section += '💡 **Enhanced Configuration**: This setup includes recovered information from your backup files for a more personalized experience!\n';

  return section;
};

/**
 * Process template file and write to destination
 * @param {string} templatePath - Path to template file
 * @param {string} outputPath - Path to write processed file
 * @param {Object} variables - Variables for processing
 */
const processTemplateFile = async (templatePath, outputPath, variables) => {
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const processedContent = processTemplate(templateContent, variables);
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  
  await fs.writeFile(outputPath, processedContent, 'utf-8');
};

/**
 * Copy template directory structure to project
 * @param {string} templateDir - Source template directory
 * @param {string} projectDir - Destination project directory
 * @param {Object} variables - Variables for processing
 */
const copyTemplateDirectory = async (templateDir, projectDir, variables) => {
  const processDirectory = async (srcDir, destDir) => {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      
      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await processDirectory(srcPath, destPath);
      } else {
        // Process template files
        if (entry.name.endsWith('.template')) {
          const finalDestPath = destPath.replace('.template', '');
          await processTemplateFile(srcPath, finalDestPath, variables);
        } else {
          // Copy non-template files directly
          await fs.copyFile(srcPath, destPath);
        }
      }
    }
  };
  
  await processDirectory(templateDir, projectDir);
};

module.exports = {
  processTemplate,
  generateProjectVariables,
  processTemplateFile,
  copyTemplateDirectory,
  sanitizeProjectName,
  getProjectName,
  getGitOrigin,
  fileExists,
  readJsonFile,
  generateBackupRecoveredSection
};
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
 * Generate template variables for project
 * @param {string} projectPath - Path to project
 * @returns {Promise<Object>} Variables for template processing
 */
const generateProjectVariables = async (projectPath) => {
  const projectName = await getProjectName(projectPath);
  const gitOrigin = await getGitOrigin(projectPath);
  
  return {
    PROJECT_NAME: projectName,
    GIT_ORIGIN: gitOrigin,
    PROJECT_PATH: projectPath,
    TIMESTAMP: new Date().toISOString(),
    // Note: Tech stack detection is handled by genie-analyzer
    // No hardcoded framework/language assumptions here
  };
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
  readJsonFile
};
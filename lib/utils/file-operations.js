const fs = require('fs').promises;
const path = require('path');

/**
 * Ensure directory exists, create if needed
 * @param {string} dirPath - Directory path to ensure
 * @returns {Promise<void>}
 */
const ensureDirectory = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
};

/**
 * Write content to file, ensuring directory exists
 * @param {string} filePath - File path to write to
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
const writeFileContent = async (filePath, content) => {
  try {
    const dir = path.dirname(filePath);
    await ensureDirectory(dir);
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
};

/**
 * Copy file with optional backup if destination exists
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @param {boolean} createBackup - Whether to backup existing files
 * @returns {Promise<void>}
 */
const copyFileWithBackup = async (srcPath, destPath, createBackup = false) => {
  try {
    const destDir = path.dirname(destPath);
    await ensureDirectory(destDir);
    
    if (createBackup && await fileExists(destPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${destPath}.backup-${timestamp}`;
      await fs.rename(destPath, backupPath);
    }
    
    await fs.copyFile(srcPath, destPath);
  } catch (error) {
    throw new Error(`Failed to copy file from ${srcPath} to ${destPath}: ${error.message}`);
  }
};

/**
 * Read JSON file safely with error handling
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object|null>} Parsed JSON or null if file doesn't exist
 */
const readJsonSafely = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
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
 * Create backup directory with timestamp
 * @param {string} basePath - Base directory path
 * @returns {Promise<string>} Created backup directory path
 */
const createBackupDirectory = async (basePath) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `${basePath}.backup-${timestamp}`;
  await ensureDirectory(backupDir);
  return backupDir;
};

/**
 * Move file or directory to backup location
 * @param {string} sourcePath - Path to move
 * @param {string} backupDir - Backup directory
 * @returns {Promise<void>}
 */
const moveToBackup = async (sourcePath, backupDir) => {
  try {
    const fileName = path.basename(sourcePath);
    const backupPath = path.join(backupDir, fileName);
    await fs.rename(sourcePath, backupPath);
  } catch (error) {
    throw new Error(`Failed to backup ${sourcePath}: ${error.message}`);
  }
};

/**
 * Read file content safely
 * @param {string} filePath - Path to file
 * @returns {Promise<string|null>} File content or null if doesn't exist
 */
const readFileSafely = async (filePath) => {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
};

/**
 * Write multiple files in batch
 * @param {Array<{path: string, content: string}>} files - Array of file objects
 * @returns {Promise<void>}
 */
const writeMultipleFiles = async (files) => {
  try {
    await Promise.all(files.map(file => writeFileContent(file.path, file.content)));
  } catch (error) {
    throw new Error(`Failed to write multiple files: ${error.message}`);
  }
};

/**
 * Ensure multiple directories exist
 * @param {string[]} dirPaths - Array of directory paths
 * @returns {Promise<void>}
 */
const ensureMultipleDirectories = async (dirPaths) => {
  try {
    await Promise.all(dirPaths.map(dirPath => ensureDirectory(dirPath)));
  } catch (error) {
    throw new Error(`Failed to create multiple directories: ${error.message}`);
  }
};

module.exports = {
  ensureDirectory,
  writeFileContent,
  copyFileWithBackup,
  readJsonSafely,
  fileExists,
  createBackupDirectory,
  moveToBackup,
  readFileSafely,
  writeMultipleFiles,
  ensureMultipleDirectories
};
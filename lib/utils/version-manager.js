const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

/**
 * Get the latest git tag for version calculation
 * @returns {Promise<string>} Latest version tag or '0.0.0' if none
 */
const getLatestGitTag = async () => {
  try {
    const { stdout } = await execAsync('git tag -l --sort=-version:refname');
    const tags = stdout.trim().split('\n').filter(t => t.startsWith('v'));
    return tags[0] ? tags[0].replace('v', '') : '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
};

/**
 * Calculate the next version based on bump type
 * @param {string} currentTag - Current version tag
 * @param {'patch'|'minor'|'major'} bumpType - Type of version bump
 * @returns {string} Next version string
 */
const calculateNextVersion = (currentTag, bumpType) => {
  const [maj, min, pat] = currentTag.split('.').map(Number);
  
  switch (bumpType) {
    case 'patch':
      return `${maj}.${min}.${pat + 1}`;
    case 'minor':
      return `${maj}.${min + 1}.0`;
    case 'major':
      return `${maj + 1}.0.0`;
    default:
      throw new Error(`Invalid bump type: ${bumpType}`);
  }
};

/**
 * Validate that the version sequence is correct
 * @param {string} currentVersion - Current package.json version
 * @param {string} expectedVersion - Expected next version
 * @throws {Error} If version sequence is invalid
 */
const validateVersionSequence = (currentVersion, expectedVersion) => {
  if (currentVersion !== expectedVersion) {
    const error = new Error('VERSION SEQUENCE VIOLATION!');
    error.details = {
      expected: expectedVersion,
      actual: currentVersion,
      message: 'This indicates manual tampering with package.json'
    };
    throw error;
  }
};

/**
 * Read and parse package.json
 * @returns {Promise<Object>} Parsed package.json content
 */
const readPackageJson = async () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const content = await fs.readFile(packageJsonPath, 'utf-8');
  return JSON.parse(content);
};

/**
 * Commit version bump changes
 * @param {string} newVersion - New version string
 * @param {'patch'|'minor'|'major'} bumpType - Type of version bump
 */
const commitVersionBump = async (newVersion, bumpType) => {
  try {
    await execAsync('git add package.json');
    await execAsync(`git commit -m "chore: bump ${bumpType} version to ${newVersion}"`);
    console.log(`✅ ${bumpType.charAt(0).toUpperCase() + bumpType.slice(1)} version bumped to ${newVersion} with sequence validation`);
  } catch (error) {
    throw new Error(`Failed to commit version bump: ${error.message}`);
  }
};

/**
 * Display version information before bump
 * @param {string} currentVersion - Current version
 * @param {string} latestTag - Latest git tag
 * @param {string} expectedVersion - Expected next version
 */
const displayVersionInfo = (currentVersion, latestTag, expectedVersion) => {
  console.log('Current version:', currentVersion);
  console.log('Latest tag:', latestTag);
  console.log('Expected next:', expectedVersion);
};

/**
 * Main version bump function
 * @param {'patch'|'minor'|'major'} bumpType - Type of version bump to perform
 */
const bumpVersion = async (bumpType) => {
  try {
    // Get current state
    const pkg = await readPackageJson();
    const latestTag = await getLatestGitTag();
    const expectedVersion = calculateNextVersion(latestTag, bumpType);
    
    // Display info
    displayVersionInfo(pkg.version, latestTag, expectedVersion);
    
    // Perform npm version bump
    await execAsync(`npm version ${bumpType} --no-git-tag-version`);
    
    // Read updated package.json
    const updatedPkg = await readPackageJson();
    
    // Validate sequence
    console.log('Validating version sequence...');
    validateVersionSequence(updatedPkg.version, expectedVersion);
    console.log('✅ Version sequence validated');
    
    // Commit changes
    await commitVersionBump(updatedPkg.version, bumpType);
    
  } catch (error) {
    if (error.details) {
      console.error('❌ VERSION SEQUENCE VIOLATION!');
      console.error('Expected:', error.details.expected);
      console.error('Got:', error.details.actual);
      console.error('This indicates manual tampering with package.json');
    } else {
      console.error('❌ Version bump failed:', error.message);
    }
    process.exit(1);
  }
};

module.exports = {
  getLatestGitTag,
  calculateNextVersion,
  validateVersionSequence,
  readPackageJson,
  commitVersionBump,
  displayVersionInfo,
  bumpVersion
};
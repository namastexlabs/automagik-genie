const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * BackupManager - Handles backup and restore operations
 * Provides atomic operations with complete rollback capability
 */
class BackupManager {
  constructor(backupDir = null) {
    this.backupDir = backupDir || path.join(os.homedir(), '.automagik-genie', 'backups');
  }

  /**
   * Create a complete backup of specified files
   * @param {Array<string>} files - Array of file paths to backup
   * @param {Object} metadata - Additional metadata to store with backup
   * @returns {Object} Backup information
   */
  async createBackup(files, metadata = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupId);

    await fs.mkdir(backupPath, { recursive: true });

    const backupManifest = {
      id: backupId,
      timestamp,
      metadata,
      files: [],
      totalSize: 0,
      fileCount: 0,
      status: 'in-progress'
    };

    try {
      // Backup each file preserving directory structure
      for (const filePath of files) {
        if (await this.fileExists(filePath)) {
          const backupInfo = await this.backupSingleFile(filePath, backupPath);
          backupManifest.files.push(backupInfo);
          backupManifest.totalSize += backupInfo.size;
          backupManifest.fileCount++;
        }
      }

      // Create manifest file
      backupManifest.status = 'completed';
      const manifestPath = path.join(backupPath, 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(backupManifest, null, 2));

      // Validate backup integrity
      const isValid = await this.validateBackup(backupId);
      if (!isValid) {
        throw new Error('Backup validation failed');
      }

      return {
        backupId,
        path: backupPath,
        fileCount: backupManifest.fileCount,
        totalSize: backupManifest.totalSize,
        timestamp: backupManifest.timestamp
      };

    } catch (error) {
      // Cleanup failed backup
      await this.cleanupFailedBackup(backupPath);
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Backup a single file to the backup directory
   * @param {string} sourcePath - Source file path
   * @param {string} backupBasePath - Base backup directory
   * @returns {Object} File backup information
   */
  async backupSingleFile(sourcePath, backupBasePath) {
    const stats = await fs.stat(sourcePath);
    const content = await fs.readFile(sourcePath, 'utf-8');
    
    // Preserve directory structure relative to project root
    const relativePath = path.relative(process.cwd(), sourcePath);
    const backupFilePath = path.join(backupBasePath, 'files', relativePath);
    
    // Ensure backup file directory exists
    await fs.mkdir(path.dirname(backupFilePath), { recursive: true });
    
    // Copy file to backup location
    await fs.writeFile(backupFilePath, content, 'utf-8');

    return {
      originalPath: sourcePath,
      backupPath: backupFilePath,
      relativePath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      checksum: this.calculateChecksum(content)
    };
  }

  /**
   * Validate backup integrity
   * @param {string} backupId - Backup ID to validate
   * @returns {boolean} True if backup is valid
   */
  async validateBackup(backupId) {
    const backupPath = path.join(this.backupDir, backupId);
    const manifestPath = path.join(backupPath, 'manifest.json');

    try {
      // Check if manifest exists
      if (!await this.fileExists(manifestPath)) {
        return false;
      }

      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      
      // Validate each backed up file
      for (const fileInfo of manifest.files) {
        const backupFilePath = fileInfo.backupPath;
        
        // Check if backup file exists
        if (!await this.fileExists(backupFilePath)) {
          return false;
        }

        // Verify file size and checksum
        const stats = await fs.stat(backupFilePath);
        if (stats.size !== fileInfo.size) {
          return false;
        }

        const content = await fs.readFile(backupFilePath, 'utf-8');
        const checksum = this.calculateChecksum(content);
        if (checksum !== fileInfo.checksum) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Restore files from backup
   * @param {string} backupId - Backup ID to restore from
   * @param {string} targetPath - Target directory (defaults to original locations)
   * @param {Object} options - Restoration options
   */
  async restoreFromBackup(backupId, targetPath = null, options = {}) {
    const { dryRun = false, force = false } = options;
    
    const backupPath = path.join(this.backupDir, backupId);
    const manifestPath = path.join(backupPath, 'manifest.json');

    // Validate backup before restoration
    if (!await this.validateBackup(backupId)) {
      throw new Error(`Backup ${backupId} is invalid or corrupted`);
    }

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    
    if (dryRun) {
      return this.generateRestorePreview(manifest, targetPath);
    }

    // Create staging area for atomic restore
    const stagingDir = path.join(this.backupDir, `restore-staging-${Date.now()}`);
    await fs.mkdir(stagingDir, { recursive: true });

    try {
      const restoredFiles = [];

      // First, copy all files to staging area
      for (const fileInfo of manifest.files) {
        const sourceBackupPath = fileInfo.backupPath;
        const finalPath = targetPath 
          ? path.join(targetPath, fileInfo.relativePath)
          : fileInfo.originalPath;
        
        const stagingPath = path.join(stagingDir, fileInfo.relativePath);
        
        // Create staging directory structure
        await fs.mkdir(path.dirname(stagingPath), { recursive: true });
        
        // Copy from backup to staging
        const content = await fs.readFile(sourceBackupPath, 'utf-8');
        await fs.writeFile(stagingPath, content, 'utf-8');
        
        restoredFiles.push({
          stagingPath,
          finalPath,
          relativePath: fileInfo.relativePath
        });
      }

      // Atomic move from staging to final locations
      for (const fileInfo of restoredFiles) {
        // Ensure target directory exists
        await fs.mkdir(path.dirname(fileInfo.finalPath), { recursive: true });
        
        // Check for existing file conflicts
        if (!force && await this.fileExists(fileInfo.finalPath)) {
          // Create backup of existing file before overwriting
          const existingBackupPath = `${fileInfo.finalPath}.restore-backup.${Date.now()}`;
          await fs.copyFile(fileInfo.finalPath, existingBackupPath);
        }
        
        // Move from staging to final location
        await fs.rename(fileInfo.stagingPath, fileInfo.finalPath);
      }

      // Cleanup staging directory
      await fs.rmdir(stagingDir, { recursive: true });

      return {
        success: true,
        restoredFiles: restoredFiles.length,
        backupId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // Cleanup staging directory on failure
      try {
        await fs.rmdir(stagingDir, { recursive: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Generate restore preview for dry-run
   * @param {Object} manifest - Backup manifest
   * @param {string} targetPath - Target path for restoration
   */
  generateRestorePreview(manifest, targetPath) {
    const preview = {
      backupId: manifest.id,
      timestamp: manifest.timestamp,
      fileCount: manifest.fileCount,
      totalSize: manifest.totalSize,
      files: []
    };

    for (const fileInfo of manifest.files) {
      const finalPath = targetPath 
        ? path.join(targetPath, fileInfo.relativePath)
        : fileInfo.originalPath;
      
      preview.files.push({
        source: fileInfo.backupPath,
        destination: finalPath,
        size: fileInfo.size,
        action: 'restore'
      });
    }

    return preview;
  }

  /**
   * List available backups
   * @returns {Array} List of available backups with metadata
   */
  async listAvailableBackups() {
    try {
      const backupEntries = await fs.readdir(this.backupDir, { withFileTypes: true });
      const backups = [];

      for (const entry of backupEntries) {
        if (entry.isDirectory() && entry.name.startsWith('backup-')) {
          const manifestPath = path.join(this.backupDir, entry.name, 'manifest.json');
          
          if (await this.fileExists(manifestPath)) {
            try {
              const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
              const isValid = await this.validateBackup(entry.name);
              
              backups.push({
                id: entry.name,
                timestamp: manifest.timestamp,
                fileCount: manifest.fileCount,
                totalSize: manifest.totalSize,
                metadata: manifest.metadata,
                valid: isValid,
                path: path.join(this.backupDir, entry.name)
              });
            } catch (error) {
              // Invalid manifest, mark as corrupted
              backups.push({
                id: entry.name,
                timestamp: null,
                fileCount: 0,
                totalSize: 0,
                metadata: {},
                valid: false,
                corrupted: true,
                path: path.join(this.backupDir, entry.name)
              });
            }
          }
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => 
        new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Cleanup old backups
   * @param {number} maxAge - Maximum age in days
   * @param {number} keepCount - Minimum number of backups to keep
   */
  async cleanupOldBackups(maxAge = 30, keepCount = 5) {
    const backups = await this.listAvailableBackups();
    const cutoffDate = new Date(Date.now() - (maxAge * 24 * 60 * 60 * 1000));
    
    // Sort by timestamp and identify backups to delete
    const backupsToDelete = backups
      .filter((backup, index) => {
        // Keep at least 'keepCount' most recent backups
        if (index < keepCount && backup.valid) {
          return false;
        }
        
        // Delete if older than maxAge
        if (backup.timestamp && new Date(backup.timestamp) < cutoffDate) {
          return true;
        }
        
        // Delete corrupted backups
        return backup.corrupted;
      });

    const deletedBackups = [];
    for (const backup of backupsToDelete) {
      try {
        await fs.rmdir(backup.path, { recursive: true });
        deletedBackups.push(backup.id);
      } catch (error) {
        // Log error but continue cleanup
        console.warn(`Failed to delete backup ${backup.id}: ${error.message}`);
      }
    }

    return {
      deleted: deletedBackups.length,
      remaining: backups.length - deletedBackups.length,
      deletedBackups
    };
  }

  /**
   * Get backup size and file count
   * @param {string} backupId - Backup ID to analyze
   */
  async getBackupInfo(backupId) {
    const manifestPath = path.join(this.backupDir, backupId, 'manifest.json');
    
    if (!await this.fileExists(manifestPath)) {
      return null;
    }

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    const isValid = await this.validateBackup(backupId);

    return {
      id: backupId,
      timestamp: manifest.timestamp,
      fileCount: manifest.fileCount,
      totalSize: manifest.totalSize,
      metadata: manifest.metadata,
      valid: isValid,
      files: manifest.files.map(f => ({
        path: f.originalPath,
        size: f.size,
        modified: f.modified
      }))
    };
  }

  /**
   * Calculate SHA-256 checksum
   * @param {string} content - Content to hash
   */
  calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
  }

  /**
   * Check if file exists
   * @param {string} filePath - Path to check
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup failed backup directory
   * @param {string} backupPath - Path to failed backup
   */
  async cleanupFailedBackup(backupPath) {
    try {
      await fs.rmdir(backupPath, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors for failed backups
    }
  }
}

module.exports = { BackupManager };
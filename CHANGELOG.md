# Changelog

## v1.0.3 (2025-08-01)

### Fixed
- **Backup Creation**: Fixed ENOENT error when creating backups during initialization
  - Now properly creates backup directory before attempting to move files
  - Enhanced error handling with specific error code descriptions
  - Added manual backup instructions for edge cases
  - Improved console output with detailed backup progress

### Technical Details
- Root cause: `fs.rename()` was trying to move files to a non-existent backup directory
- Solution: Create backup directory with `fs.mkdir(backupDirWithTimestamp, { recursive: true })` before any file operations
- Added comprehensive error handling for permissions, existing files, and other edge cases
- Enhanced user feedback during backup process

## v1.0.2 (2025-08-01)

### Added
- Initial NPX package release
- Universal project initialization
- Tech-stack agnostic agent templates
- Backup system for existing installations

## v1.0.1 (2025-08-01)

### Added
- Core package functionality
- NPM publication setup

## v1.0.0 (2025-08-01)

### Added
- Initial release of Automagik Genie NPX package
- Universal AI development companion initialization
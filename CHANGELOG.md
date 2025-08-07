# Changelog

## v1.2.6 (2025-08-07)

### Added
- **Smart Merge System**: Complete overhaul of initialization system to prevent data loss
  - Smart merge is now the default behavior with zero data loss
  - Intelligently preserves user content while updating genie-managed files
  - Automatic content analysis distinguishes user vs genie agents/hooks/commands
  - Safety backup created before any changes

### Changed  
- **Default Initialization Mode**: Smart merge is now default instead of destructive replacement
- **User Experience**: Zero risk of losing custom agents, hooks, or configurations
- **CLI Behavior**: `init` command now preserves existing work by default

### Fixed
- **Major Data Loss Issue**: Users no longer lose custom content when running init
- **Content Recognition**: Accurate classification of genie vs user-managed files
- **Backup Safety**: Complete backup system ensures full restore capability

### Technical Details
- Added intelligent content analysis with pattern recognition
- Implemented selective update system for genie-managed files
- Enhanced error handling and recovery mechanisms
- Comprehensive test coverage with 76 passing tests
- Backward compatibility with `--legacy` flag for destructive mode

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
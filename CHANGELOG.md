# Changelog

## v1.2.7 (2025-08-11)

### Added
- **Interactive Statusline System**: Beautiful, contextual status display for Claude Code
  - Shows current AI model being used (Sonnet 4, Claude 3.5, etc.)
  - Contextual actions that change based on time of day and git activity
  - Project name and git branch information with change indicators
  - Smart caching for optimal performance
  - Cross-platform support (Windows, Mac, Linux)
  - Example: `🧞 Genie is using Sonnet 4 to manifest commit message poetry at automagik-genie | main (3 changes) | v1.2.7`

- **Enhanced Hook System**: 
  - Added missing `minimal-hook.js` for pre-tool validation
  - Basic system directory protection
  - Improved error handling and logging

### Fixed
- **Documentation**: Corrected CLAUDE.md paths to reflect actual project structure instead of template references
- **Hook Execution**: Resolved missing minimal-hook.js causing PreToolUse failures
- **Project References**: Updated architecture treasure map with real automagik-genie directories

### Technical Details
- Intelligent statusline with time-based action selection (morning energy, afternoon productivity, late night intensity)
- Git integration showing uncommitted changes and pull indicators  
- Model detection from Claude Code session data
- Cached update checking with 1-hour TTL
- Template fixes ensure future projects get accurate documentation

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
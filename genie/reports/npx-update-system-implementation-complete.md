# NPX Update System Implementation Plan

## 🎯 MISSION STATEMENT

Implement a comprehensive NPX update system for automagik-genie that selectively updates agent defaults while preserving user customizations, ensuring complete safety through backup/rollback capabilities.

## 🏗️ IMPLEMENTATION ARCHITECTURE

### Core File Structure
```
lib/update/
├── engine.js              # Main update orchestration
├── metadata.js            # Agent/hook registry management
├── templates.js           # Template download and comparison
├── backup.js              # Backup/restore system
├── diff.js                # Change detection and analysis
├── merge.js               # Smart merge strategies
├── ui.js                  # CLI interface and progress
└── validation.js          # Pre/post update validation

bin/
├── update.js              # CLI entry point for updates
└── rollback.js            # CLI entry point for rollbacks

.automagik-genie/          # User data directory (created on demand)
├── metadata/
├── backups/
├── templates/
└── update-cache/
```

## 🎯 PHASE 1: METADATA FOUNDATION (Priority: HIGH)

### 1.1 Metadata Manager Implementation

**File**: `lib/update/metadata.js`

```javascript
class MetadataManager {
  constructor(basePath = '.automagik-genie') {
    this.basePath = basePath;
    this.agentRegistryPath = path.join(basePath, 'metadata', 'agent-registry.json');
    this.hookRegistryPath = path.join(basePath, 'metadata', 'hook-registry.json');
    this.systemVersionPath = path.join(basePath, 'metadata', 'system-version.json');
  }

  // Core registry operations
  async initializeRegistries() {
    await this.ensureDirectoryStructure();
    await this.createDefaultRegistries();
  }

  async scanExistingFiles() {
    // Scan .claude/agents/ and .claude/hooks/examples/
    // Populate registries with current state
    // Calculate checksums for existing files
  }

  async updateAgentRegistry(agentName, metadata) {
    // Update agent metadata with version, checksum, modifications
  }

  async getAgentMetadata(agentName) {
    // Retrieve agent metadata from registry
  }

  async detectUserModifications(agentPath) {
    // Compare current file with known template versions
    // Return modification analysis
  }
}
```

### 1.2 Initial Registry Population

**Key Implementation Points**:
- Scan existing `.claude/agents/` directory
- Calculate SHA-256 checksums for all files
- Attempt to match against known template versions
- Mark unmatched files as `origin: "user"`
- Create baseline registry for future updates

### 1.3 Template Version Detection

**Algorithm**:
1. Download template manifest from GitHub releases
2. Compare file checksums against known template versions
3. Identify closest template match for each agent
4. Flag significant deviations as user modifications

## 🎯 PHASE 2: TEMPLATE MANAGEMENT (Priority: HIGH)

### 2.1 Template Manager Implementation

**File**: `lib/update/templates.js`

```javascript
class TemplateManager {
  constructor(cacheDir = '.automagik-genie/templates') {
    this.cacheDir = cacheDir;
    this.githubApi = 'https://api.github.com/repos/USERNAME/automagik-genie';
  }

  async fetchLatestRelease() {
    // Get latest release from GitHub API
    // Download template archive
    // Extract to cache directory
  }

  async compareVersions(currentVersion, latestVersion) {
    // Generate diff between template versions
    // Identify changed files and modifications
    // Return structured change analysis
  }

  async validateTemplateIntegrity() {
    // Verify downloaded templates are complete
    // Check checksums against release manifest
    // Validate file structure
  }

  async getCachedTemplate(version) {
    // Return cached template by version
    // Download if not cached
  }
}
```

### 2.2 Change Detection Engine

**File**: `lib/update/diff.js`

```javascript
class DiffEngine {
  async analyzeAgentChanges(agentName, currentContent, templateContent) {
    const analysis = {
      hasChanges: false,
      templateSections: [],
      userSections: [],
      conflicts: [],
      mergeStrategy: 'safe' // 'safe' | 'merge' | 'manual'
    };

    // Parse sections using regex patterns
    // Identify template vs user content
    // Detect conflicts and suggest resolution
    
    return analysis;
  }

  async detectCustomSections(content) {
    // Look for patterns indicating user customizations:
    // - Non-standard section headers
    // - Custom workflow patterns
    // - Environment-specific configurations
    // - Comments indicating user modifications
  }

  async generateMergePreview(conflicts) {
    // Create human-readable diff preview
    // Highlight conflicts and resolutions
    // Generate merge strategy recommendations
  }
}
```

## 🎯 PHASE 3: BACKUP SYSTEM (Priority: CRITICAL)

### 3.1 Backup Manager Implementation

**File**: `lib/update/backup.js`

```javascript
class BackupManager {
  constructor(backupDir = '.automagik-genie/backups') {
    this.backupDir = backupDir;
  }

  async createBackup(files, metadata = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, timestamp);
    
    // Create backup directory structure
    // Copy all affected files preserving paths
    // Create backup manifest with metadata
    // Validate backup integrity
    
    return { backupId: timestamp, path: backupPath };
  }

  async validateBackup(backupId) {
    // Verify all files exist and are readable
    // Check manifest completeness
    // Validate checksums if present
  }

  async restoreFromBackup(backupId, targetPath = '.claude') {
    // Atomic restore operation
    // Verify backup before restoration
    // Create temporary staging area
    // Move files atomically to prevent partial restores
  }

  async listAvailableBackups() {
    // Return sorted list of backups with metadata
    // Include file counts, timestamps, operation types
  }

  async cleanupOldBackups(maxAge = 30) {
    // Remove backups older than maxAge days
    // Keep at least 5 most recent backups
    // Log cleanup operations
  }
}
```

### 3.2 Atomic Operations

**Critical Requirements**:
- All file operations must be atomic (all-or-nothing)
- Use temporary directories for staging
- Verify operations before committing changes
- Immediate rollback on any failure

## 🎯 PHASE 4: UPDATE ENGINE (Priority: HIGH)

### 4.1 Main Update Engine

**File**: `lib/update/engine.js`

```javascript
class UpdateEngine {
  constructor() {
    this.metadata = new MetadataManager();
    this.templates = new TemplateManager();
    this.backup = new BackupManager();
    this.diff = new DiffEngine();
    this.ui = new UpdateUI();
  }

  async executeUpdate(options = {}) {
    const phases = [
      this.preUpdateAnalysis,
      this.getUserConsent,
      this.createBackup,
      this.executeFileUpdates,
      this.postUpdateValidation
    ];

    try {
      for (const phase of phases) {
        await phase.call(this, options);
      }
      return { success: true, message: 'Update completed successfully' };
    } catch (error) {
      await this.handleUpdateFailure(error, options);
      throw error;
    }
  }

  async preUpdateAnalysis(options) {
    // Download latest templates
    // Analyze current vs template state
    // Categorize updates (safe/merge/conflict)
    // Generate user-facing analysis report
  }

  async getUserConsent(options) {
    // Present analysis to user
    // Show detailed diffs for conflicts
    // Get explicit consent for each change category
    // Allow user to customize update scope
  }

  async createBackup(options) {
    // Create comprehensive backup of affected files
    // Include metadata snapshot
    // Validate backup integrity
    // Store backup reference for rollback
  }

  async executeFileUpdates(options) {
    // Execute updates based on user choices
    // Use appropriate merge strategies
    // Maintain operation log for debugging
    // Validate each file after update
  }

  async postUpdateValidation(options) {
    // Verify all updated files are valid
    // Update metadata registries
    // Run basic smoke tests
    // Report final status to user
  }
}
```

### 4.2 Merge Strategies

**Strategy Types**:
1. **Template Replace**: Complete file replacement for unmodified templates
2. **Section Merge**: Preserve user sections, update template sections
3. **Manual Merge**: Present conflicts for user resolution
4. **Skip Update**: Leave file unchanged (user choice)

## 🎯 PHASE 5: USER INTERFACE (Priority: MEDIUM)

### 5.1 CLI Interface Implementation

**File**: `lib/update/ui.js`

```javascript
class UpdateUI {
  constructor() {
    this.colors = require('colors');
    this.inquirer = require('inquirer');
  }

  async showUpdateSummary(analysis) {
    // Display update summary with categories
    // Use colors and icons for visual clarity
    // Show counts for each category
  }

  async promptUserChoices(analysis) {
    // Interactive prompts for user decisions
    // Allow per-agent choices
    // Provide diff previews on demand
    // Confirm dangerous operations
  }

  async showProgress(operation, current, total) {
    // Progress bar for long operations
    // Current operation description
    // Estimated time remaining
  }

  async displayDiff(fileName, changes) {
    // Formatted diff display
    // Highlight additions/deletions
    // Show merge conflict resolutions
    // Allow paging for long diffs
  }

  async confirmRiskyOperation(operation, details) {
    // Special confirmation for destructive operations
    // Clear explanation of consequences
    // Require explicit confirmation
  }
}
```

### 5.2 Command Line Interface

**File**: `bin/update.js`

```javascript
#!/usr/bin/env node
const { UpdateEngine } = require('../lib/update/engine');
const yargs = require('yargs');

const argv = yargs
  .command('update', 'Update automagik-genie agents and hooks', {
    'dry-run': {
      type: 'boolean',
      description: 'Show what would be updated without making changes'
    },
    'agents-only': {
      type: 'boolean', 
      description: 'Update only agents, skip hooks'
    },
    'hooks-only': {
      type: 'boolean',
      description: 'Update only hooks, skip agents'
    },
    'force': {
      type: 'boolean',
      description: 'Skip confirmation prompts (use with caution)'
    }
  })
  .help()
  .argv;

async function main() {
  try {
    const engine = new UpdateEngine();
    await engine.executeUpdate(argv);
  } catch (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
}

main();
```

## 🎯 PHASE 6: ROLLBACK SYSTEM (Priority: HIGH)

### 6.1 Rollback Interface

**File**: `bin/rollback.js`

```javascript
#!/usr/bin/env node
const { BackupManager } = require('../lib/update/backup');
const { UpdateUI } = require('../lib/update/ui');

async function rollback(options) {
  const backup = new BackupManager();
  const ui = new UpdateUI();

  // List available backups
  // Show rollback preview
  // Confirm rollback operation
  // Execute atomic restore
  // Validate rollback success
}
```

### 6.2 Rollback Validation

**Critical Steps**:
1. Verify backup integrity before rollback
2. Create snapshot of current state (for undo-rollback)
3. Atomic restoration with validation
4. Update metadata registries to reflect rollback
5. Confirm system is functional after rollback

## 🎯 PHASE 7: INTEGRATION & TESTING (Priority: HIGH)

### 7.1 Package.json Integration

```json
{
  "bin": {
    "automagik-genie": "./bin/automagik-genie.js"
  },
  "scripts": {
    "update": "node bin/update.js",
    "rollback": "node bin/rollback.js"
  },
  "dependencies": {
    "inquirer": "^8.0.0",
    "colors": "^1.4.0",
    "yargs": "^17.0.0",
    "node-fetch": "^3.0.0",
    "tar": "^6.0.0"
  }
}
```

### 7.2 Testing Strategy

**Unit Tests** (`tests/update/`):
- Metadata operations
- Diff generation accuracy
- Backup/restore integrity
- Merge strategy validation

**Integration Tests**:
- End-to-end update workflows
- Rollback scenarios
- Error recovery paths
- Network failure handling

**Scenario Tests**:
- Fresh installation updates
- Heavily customized environments
- Partial failures and recovery
- Version compatibility edge cases

## 🎯 IMPLEMENTATION PRIORITIES

### Week 1-2: Core Foundation
1. **Day 1-3**: Metadata system implementation
2. **Day 4-7**: Basic backup/restore functionality
3. **Day 8-10**: Template download and caching
4. **Day 11-14**: Diff engine and change detection

### Week 3-4: Smart Features
1. **Day 15-18**: User customization detection
2. **Day 19-21**: Merge strategy implementation
3. **Day 22-25**: Conflict resolution engine
4. **Day 26-28**: Risk assessment algorithms

### Week 5-6: User Experience
1. **Day 29-32**: CLI interface development
2. **Day 33-35**: Progress indicators and feedback
3. **Day 36-38**: Error handling and recovery
4. **Day 39-42**: Comprehensive testing

## 🔬 VALIDATION CRITERIA

### Safety Requirements
- [ ] 100% backup success rate before any changes
- [ ] Atomic operations (all-or-nothing updates)
- [ ] Complete rollback capability
- [ ] User customization preservation
- [ ] Zero data loss tolerance

### User Experience Requirements
- [ ] Clear progress indication
- [ ] Meaningful diff previews
- [ ] Intuitive consent process
- [ ] Helpful error messages
- [ ] < 2 minute typical update time

### System Requirements
- [ ] Support for Node.js 16+
- [ ] Cross-platform compatibility
- [ ] Offline operation capability
- [ ] Graceful network failure handling
- [ ] Memory efficient for large projects

## 🚀 DEPLOYMENT PLAN

### Pre-Release Testing
1. **Alpha Testing**: Internal testing with controlled scenarios
2. **Beta Testing**: Limited user group with real customizations  
3. **Regression Testing**: Verify no existing functionality broken
4. **Performance Testing**: Ensure acceptable operation times

### Release Strategy
1. **Patch Release**: v1.1.7 with update system
2. **Documentation**: Update README with update instructions
3. **Migration Guide**: Help users transition to new system
4. **Monitoring**: Track update success rates and user feedback

This implementation plan provides a comprehensive roadmap for building a robust, user-safe update system that preserves customizations while enabling system evolution.
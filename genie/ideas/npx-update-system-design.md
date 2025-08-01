# Automagik-Genie NPX Update System - Comprehensive Design

## 🎯 EXECUTIVE SUMMARY

Design a sophisticated update system that **selectively updates agent defaults while preserving user customizations**, providing complete transparency and rollback capabilities for maximum user safety.

## 🏗️ SYSTEM ARCHITECTURE

### 1. FILE STRUCTURE & ORGANIZATION

```
.automagik-genie/
├── metadata/
│   ├── agent-registry.json        # Tracks agent origins and versions
│   ├── hook-registry.json         # Tracks hook origins and versions
│   └── system-version.json        # Overall system version tracking
├── backups/
│   ├── 2024-08-01-14-30-25/      # Timestamped backup directories
│   │   ├── agents/               # Backed up agent files
│   │   ├── hooks/                # Backed up hook files
│   │   └── manifest.json         # What was backed up and why
│   └── rollback-history.json     # Rollback operation log
├── templates/
│   ├── .version                   # Template version identifier
│   ├── agents/                    # Latest template agents
│   └── hooks/                     # Latest template hooks
└── update-cache/
    ├── diff-reports/              # Generated diff reports
    └── temp-downloads/            # Temporary template downloads
```

### 2. METADATA SYSTEM

#### Agent Registry Schema (`agent-registry.json`)
```json
{
  "version": "1.0.0",
  "agents": {
    "genie-dev-coder": {
      "origin": "template",           // "template" | "user" | "modified"
      "template_version": "1.2.3",   // Version when installed/last updated
      "user_modified": false,        // Has user made changes?
      "custom_sections": [],         // User-added sections
      "last_updated": "2024-08-01T14:30:25Z",
      "checksum": "abc123...",       // File content hash
      "backup_refs": ["2024-08-01-14-30-25"] // Associated backups
    },
    "my-custom-agent": {
      "origin": "user",
      "template_version": null,
      "user_modified": true,
      "custom_sections": ["CUSTOM_BEHAVIOR", "PERSONAL_PREFERENCES"],
      "last_updated": "2024-07-15T10:20:30Z",
      "checksum": "def456...",
      "backup_refs": []
    }
  }
}
```

#### Hook Registry Schema (`hook-registry.json`)
```json
{
  "version": "1.0.0",
  "hooks": {
    "pre-commit": {
      "origin": "template",
      "template_version": "1.1.0",
      "user_modified": true,
      "modifications": ["Added custom linting rules"],
      "last_updated": "2024-07-20T16:45:12Z",
      "checksum": "ghi789..."
    }
  }
}
```

## 🔄 UPDATE PROCESS WORKFLOW

### Phase 1: Pre-Update Analysis
```bash
npx automagik-genie update [--dry-run] [--force] [--agents-only] [--hooks-only]
```

1. **Template Download & Validation**
   - Download latest templates to `update-cache/temp-downloads/`
   - Validate template integrity and version compatibility
   - Compare with local template cache

2. **Change Detection Engine**
   ```typescript
   interface ChangeAnalysis {
     templateUpdates: TemplateChange[];
     userAffectedFiles: string[];
     safeToUpdate: string[];
     requiresUserDecision: string[];
     conflicts: ConflictInfo[];
   }
   ```

3. **Smart Categorization**
   - **Safe Updates**: Template agents with no user modifications
   - **Merge Candidates**: Modified agents where template changes don't conflict
   - **User Decision Required**: Significant conflicts or structural changes
   - **Protected Files**: User-created agents (never touched)

### Phase 2: User Consent & Preview

#### Interactive CLI Interface
```
🧞 Automagik Genie Update Available (v2.3.0 → v2.4.0)

📊 ANALYSIS SUMMARY:
✅ Safe to update:     12 agents, 3 hooks
⚠️  Needs review:      3 agents, 1 hook  
🔒 User-protected:     5 agents, 2 hooks
🚫 Conflicts found:    1 agent

📋 AFFECTED TEMPLATE AGENTS:
✅ genie-dev-coder.md     - Enhanced TDD workflow (no conflicts)
✅ genie-testing-maker.md - New test patterns (no conflicts)  
⚠️  genie-quality-ruff.md - Updated config format (mergeable)
🚫 genie-dev-planner.md  - Structure changed (conflicts with your customizations)

🔍 PREVIEW CHANGES: [Y/n] 
🔄 CONTINUE UPDATE: [Y/n]
💾 CREATE BACKUP: [Y/n] (recommended)
```

#### Detailed Diff Interface
```
📄 genie-quality-ruff.md - PREVIEW CHANGES

🟢 TEMPLATE ADDITIONS:
+ ## 🎯 RUFF CONFIGURATION PATTERNS
+ - **New Rule Sets**: Enhanced Python linting with pycodestyle integration
+ - **Performance Boost**: 40% faster linting with rule optimization

🔴 POTENTIAL CONFLICTS:
Your custom section "PERSONAL_RUFF_PREFERENCES" will be preserved
Template changed "CORE_RUFF_COMMANDS" → "ENHANCED_RUFF_WORKFLOW"

🤝 MERGE STRATEGY:
✅ Keep your custom sections intact
✅ Update template sections only
✅ Preserve your configuration overrides

[A]ccept, [S]kip, [M]anual merge, [D]iff details, [N]ext
```

### Phase 3: Backup Creation

#### Intelligent Backup System
```typescript
interface BackupManifest {
  timestamp: string;
  operation: "update" | "rollback";
  templateVersion: {
    from: string;
    to: string;
  };
  affectedFiles: {
    path: string;
    action: "updated" | "created" | "merged";
    conflicts: string[];
    userSections: string[];
  }[];
  metadata: {
    userConsent: boolean;
    updateFlags: string[];
    systemState: SystemSnapshot;
  };
}
```

#### Backup Process
1. **Create Timestamped Directory**: `.automagik-genie/backups/2024-08-01-14-30-25/`
2. **Full File Backup**: Copy all affected files preserving structure
3. **Metadata Snapshot**: Current registries, checksums, system state
4. **Backup Validation**: Verify backup integrity before proceeding

### Phase 4: Smart Update Execution

#### Update Engine Architecture
```typescript
class UpdateEngine {
  // Core update strategies
  templateReplace(agent: string): Promise<UpdateResult>
  smartMerge(agent: string, conflicts: Conflict[]): Promise<UpdateResult>
  sectionPreservation(agent: string, userSections: string[]): Promise<UpdateResult>
  
  // Validation and rollback
  validateUpdate(results: UpdateResult[]): Promise<ValidationReport>
  rollback(backupId: string): Promise<RollbackResult>
}
```

#### Merge Strategies

**1. Template Replacement (Safe Updates)**
- Completely replace file with new template
- Only for agents with `origin: "template"` and `user_modified: false`

**2. Smart Section Merge**
```markdown
<!-- TEMPLATE SECTION: CORE_BEHAVIOR -->
[Updated template content]
<!-- END TEMPLATE SECTION -->

<!-- USER SECTION: CUSTOM_WORKFLOW -->
[Preserved user content]
<!-- END USER SECTION -->

<!-- TEMPLATE SECTION: QUALITY_GATES -->
[Updated template content]  
<!-- END TEMPLATE SECTION -->
```

**3. Configuration Preservation**
- Identify user configuration overrides
- Merge with new template defaults
- Preserve user-specific environment variables

### Phase 5: Post-Update Validation

#### Comprehensive Validation Suite
1. **File Integrity Check**: Verify all updated files are valid
2. **Agent Functionality Test**: Basic smoke tests for critical agents
3. **Registry Update**: Update metadata with new versions and checksums
4. **Backup Verification**: Ensure rollback capability is intact

## 🛡️ SAFETY MECHANISMS

### 1. USER CUSTOMIZATION DETECTION

#### Heuristic Analysis Engine
```typescript
interface CustomizationDetector {
  // Structural analysis
  detectUserSections(content: string): UserSection[];
  identifyConfigOverrides(agent: string): ConfigOverride[];
  findPersonalizations(content: string): Personalization[];
  
  // Change impact analysis  
  assessUpdateRisk(changes: TemplateChange[], userMods: UserModification[]): RiskLevel;
  suggestMergeStrategy(conflicts: Conflict[]): MergeStrategy;
}
```

#### Detection Strategies
- **Section Markers**: Detect `<!-- USER SECTION -->` comments
- **Diff Analysis**: Compare against known template versions
- **Content Fingerprinting**: Identify non-template patterns
- **Configuration Overrides**: Detect environment-specific modifications

### 2. ROLLBACK SYSTEM

#### Rollback Interface
```bash
npx automagik-genie rollback [--list] [--backup-id=<id>] [--preview]

# List available backups
npx automagik-genie rollback --list
# 📋 AVAILABLE BACKUPS:
# 🕐 2024-08-01-14-30-25 - Update v2.3.0→v2.4.0 (3 agents, 1 hook)
# 🕐 2024-07-28-09-15-42 - Update v2.2.1→v2.3.0 (8 agents, 2 hooks)

# Preview rollback changes
npx automagik-genie rollback --backup-id=2024-08-01-14-30-25 --preview

# Execute rollback
npx automagik-genie rollback --backup-id=2024-08-01-14-30-25
```

#### Rollback Process
1. **Backup Validation**: Verify backup integrity and completeness
2. **Impact Preview**: Show what will be restored/lost
3. **User Confirmation**: Explicit consent for rollback operation
4. **Atomic Restoration**: All-or-nothing rollback execution
5. **Registry Reversion**: Restore metadata to pre-update state

### 3. VERSION COMPATIBILITY MATRIX

```typescript
interface CompatibilityMatrix {
  systemVersion: string;
  templateVersions: {
    min: string;
    max: string;
    recommended: string;
  };
  breakingChanges: BreakingChange[];
  migrationRequired: boolean;
}
```

## 🖥️ USER INTERFACE DESIGN

### 1. Progress Indicators

```
🧞 Updating Automagik Genie...

[████████████████████████████████████████] 100%

✅ Downloaded templates (v2.4.0)
✅ Analyzed 18 agents, 5 hooks  
✅ Created backup (2024-08-01-14-30-25)
✅ Updated 12 agents safely
⚠️  Merged 3 agents with conflicts resolved
🔄 Updated metadata registry
✅ Validation complete

🎉 Update successful! Your customizations are preserved.
📁 Backup saved: .automagik-genie/backups/2024-08-01-14-30-25
```

### 2. Error Handling & Recovery

```
❌ UPDATE FAILED: Conflict resolution required

🚨 CRITICAL CONFLICTS FOUND:
📄 genie-dev-planner.md
  - Template restructured sections
  - Your customizations incompatible with new format
  
🔧 RESOLUTION OPTIONS:
1. [M]anual merge - Open interactive editor
2. [K]eep current version - Skip this agent
3. [R]eplace with template - Lose customizations  
4. [A]bort update - Cancel entire operation

Choice [M/K/R/A]: 
```

### 3. Dry Run Mode

```bash
npx automagik-genie update --dry-run

🔍 DRY RUN MODE - No changes will be made

📊 ANALYSIS RESULTS:
Safe updates:      12 agents ✅
Requires review:   3 agents ⚠️
User protected:    5 agents 🔒
Conflicts:         1 agent 🚫

📋 WHAT WOULD HAPPEN:
✅ genie-dev-coder.md → Enhanced TDD workflow
✅ genie-testing-maker.md → New test patterns
⚠️  genie-quality-ruff.md → Config format update (mergeable)
🚫 genie-dev-planner.md → Structure conflicts

💡 Run without --dry-run to execute update
```

## 📦 IMPLEMENTATION MODULES

### 1. Core Update Engine (`lib/update/engine.js`)
```javascript
class UpdateEngine {
  constructor() {
    this.templateManager = new TemplateManager();
    this.backupManager = new BackupManager();
    this.metadataManager = new MetadataManager();
    this.diffEngine = new DiffEngine();
    this.mergeResolver = new MergeResolver();
  }
  
  async executeUpdate(options) {
    // Implementation
  }
}
```

### 2. Template Management (`lib/update/templates.js`)
```javascript
class TemplateManager {
  async downloadLatest() { /* Download latest templates */ }
  async validateCompatibility(version) { /* Check compatibility */ }
  async compareWithLocal() { /* Analyze changes */ }
}
```

### 3. Backup System (`lib/update/backup.js`)
```javascript
class BackupManager {
  async createBackup(files) { /* Create timestamped backup */ }
  async validateBackup(backupId) { /* Verify backup integrity */ }
  async restoreFromBackup(backupId) { /* Restore from backup */ }
  async listBackups() { /* List available backups */ }
}
```

### 4. Diff & Merge Engine (`lib/update/diff.js`)
```javascript
class DiffEngine {
  async analyzeChanges(template, current) { /* Analyze differences */ }
  async detectCustomizations(content) { /* Find user customizations */ }
  async generateMergeStrategy(conflicts) { /* Create merge strategy */ }
}
```

### 5. User Interface (`lib/update/ui.js`)
```javascript
class UpdateUI {
  async promptUserConsent(analysis) { /* Get user permission */ }
  async showDiffPreview(changes) { /* Show change preview */ }
  async displayProgress(operation) { /* Show progress */ }
  async handleError(error) { /* Handle errors gracefully */ }
}
```

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
- [ ] Metadata system implementation
- [ ] Basic backup/restore functionality
- [ ] Template download and validation
- [ ] Core diff engine

### Phase 2: Smart Detection (Week 3-4)
- [ ] User customization detection
- [ ] Conflict analysis engine
- [ ] Merge strategy generation
- [ ] Risk assessment algorithms

### Phase 3: User Experience (Week 5-6)
- [ ] Interactive CLI interface
- [ ] Progress indicators and feedback
- [ ] Error handling and recovery
- [ ] Comprehensive testing suite

### Phase 4: Advanced Features (Week 7-8)
- [ ] Smart merge capabilities
- [ ] Advanced rollback features
- [ ] Performance optimization
- [ ] Documentation and guides

## 🔬 TESTING STRATEGY

### 1. Unit Tests
- Metadata management operations
- Diff engine accuracy
- Backup/restore integrity
- Merge strategy generation

### 2. Integration Tests
- End-to-end update workflows
- Rollback scenarios
- Error recovery paths
- User interface interactions

### 3. Scenario Testing
- Fresh installation updates
- Heavily customized environments
- Partial update failures
- Network interruption recovery

## 🎉 SUCCESS METRICS

### User Safety Metrics
- **Zero Data Loss**: 100% user customization preservation
- **Rollback Success**: 100% successful rollback operations
- **Backup Integrity**: 100% backup validation success

### User Experience Metrics
- **Update Confidence**: Clear preview and consent process
- **Time to Update**: < 2 minutes for typical scenarios
- **Error Recovery**: < 30 seconds to recover from failures

### System Reliability Metrics
- **Update Success Rate**: > 95% successful updates
- **Conflict Resolution**: > 90% automatic merge success
- **Version Compatibility**: Support for 3+ template versions

## 🚀 KEY DESIGN DECISIONS

### 1. Metadata-Driven Approach
- **Decision**: Use comprehensive JSON registries to track all agent/hook metadata
- **Rationale**: Enables precise tracking of origins, modifications, and update history
- **Benefit**: Safe selective updates with full audit trail

### 2. Section-Based Merge Strategy
- **Decision**: Use HTML-style comments to mark template vs user sections
- **Rationale**: Clear boundaries between template and user content
- **Benefit**: Automated merge with minimal conflicts

### 3. Timestamped Backup System
- **Decision**: Create full backups before any update operation
- **Rationale**: Maximum safety and complete rollback capability
- **Benefit**: Zero risk of data loss, even with catastrophic failures

### 4. Progressive Disclosure UI
- **Decision**: Start with summary, drill down to details on demand
- **Rationale**: Balance information completeness with cognitive load
- **Benefit**: Expert users get details, casual users get simplicity

### 5. Dry Run First Approach
- **Decision**: Always show what would happen before making changes
- **Rationale**: Builds user confidence and prevents surprises
- **Benefit**: Users can abort before any permanent changes

This comprehensive update system ensures users can confidently evolve their automagik-genie installations while preserving their valuable customizations and maintaining complete operational safety.
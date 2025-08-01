# 📋 Manual Testing Checklist - Automagik Genie Update System

## 🎯 CRITICAL SAFETY VALIDATION

**⚠️ IMPORTANT**: This manual testing checklist MUST be completed before any release. Each test scenario validates critical user data safety.

**Prerequisites:**
- [ ] Automated test suite passes with 100% success rate
- [ ] Test environment with representative user projects
- [ ] Backup and recovery utilities available
- [ ] Network connectivity for template fetching

---

## 🔄 PHASE 1: Pre-Update System Validation

### 1.1 Environment Setup
- [ ] **Fresh Installation Test**
  - Create new project with `npx automagik-genie init`
  - Verify `.claude` directory structure created correctly
  - Confirm initial agents and hooks are present
  - Document baseline file count and checksums

- [ ] **Existing Project Test** 
  - Use existing project with user customizations
  - Document all custom agents and modifications
  - Create manual backup of critical user data
  - Note any proprietary or sensitive configurations

- [ ] **System Requirements**
  - [ ] Node.js version compatibility (14+)
  - [ ] Disk space available (minimum 100MB free)
  - [ ] Network connectivity to GitHub/npm
  - [ ] File system permissions (read/write in project dir)

### 1.2 Project State Documentation
- [ ] **File Inventory**
  ```bash
  find .claude -type f -name "*.md" -o -name "*.js" | sort > baseline_files.txt
  find .claude -type f -exec md5sum {} \; > baseline_checksums.txt
  ```

- [ ] **User Customization Mapping**
  - [ ] Identify files with `<!-- USER_CUSTOMIZATION_START -->` markers
  - [ ] Document custom agents not based on templates
  - [ ] List proprietary hooks and configurations
  - [ ] Note any modifications to template-based files

---

## 🔍 PHASE 2: Update Discovery and Analysis

### 2.1 Status Command Validation
- [ ] **Basic Status Check**
  ```bash
  npx automagik-genie status
  ```
  - [ ] Shows current version correctly
  - [ ] Displays file statistics accurately
  - [ ] Reports system health status
  - [ ] Completes without errors

- [ ] **Remote Update Check**
  ```bash
  npx automagik-genie status --check-remote
  ```
  - [ ] Connects to remote repository successfully
  - [ ] Reports available updates (or confirms up-to-date)
  - [ ] Shows update categories (agents/hooks/core)
  - [ ] Provides reasonable timing (< 30 seconds)

- [ ] **Detailed Analysis**
  ```bash
  npx automagik-genie status --detailed --check-remote
  ```
  - [ ] Shows file-by-file analysis
  - [ ] Indicates risk levels appropriately
  - [ ] Provides actionable recommendations

### 2.2 Update Analysis Validation
- [ ] **Dry-Run Analysis**
  ```bash
  npx automagik-genie update --dry-run
  ```
  - [ ] Completes analysis without modifying files
  - [ ] Shows clear summary of planned changes
  - [ ] Identifies user customizations correctly
  - [ ] Categorizes updates by type and risk
  - [ ] Provides clear "what would happen" information

- [ ] **Verify No Changes Made**
  ```bash
  find .claude -type f -exec md5sum {} \; > post_dryrun_checksums.txt
  diff baseline_checksums.txt post_dryrun_checksums.txt
  ```
  - [ ] No differences found (dry-run made no changes)

---

## 🛡️ PHASE 3: Backup System Validation

### 3.1 Backup Creation Testing
- [ ] **Automatic Backup Creation**
  - [ ] Update process creates backup automatically
  - [ ] Backup includes all modified files
  - [ ] Backup preserves directory structure
  - [ ] Backup manifest is complete and accurate

- [ ] **Manual Backup Testing**
  ```bash
  # Test backup manager directly if available
  ```
  - [ ] Creates backup with unique timestamp ID
  - [ ] Validates backup integrity automatically
  - [ ] Reports backup size and file count correctly

- [ ] **Backup Integrity Validation**
  - [ ] All files backed up completely
  - [ ] Checksums match original files
  - [ ] No corruption in backup data
  - [ ] Manifest file is valid JSON

### 3.2 Backup Management Testing
- [ ] **List Available Backups**
  ```bash
  npx automagik-genie rollback --list
  ```
  - [ ] Shows all available backups
  - [ ] Displays timestamps correctly
  - [ ] Shows file counts and sizes
  - [ ] Indicates backup validity status

- [ ] **Backup Information Details**
  - [ ] Each backup shows creation date/time
  - [ ] File count matches actual backup content
  - [ ] Size information is accurate
  - [ ] Metadata is preserved correctly

---

## 🔄 PHASE 4: Update Execution Testing

### 4.1 Safe Update Scenarios
- [ ] **Template-Only Updates (No User Customizations)**
  ```bash
  npx automagik-genie update --force
  ```
  - [ ] Updates complete successfully
  - [ ] All template files updated to latest version
  - [ ] No conflicts or merge issues
  - [ ] System reports successful completion

- [ ] **New File Additions**
  - [ ] New agents added to `.claude/agents/`
  - [ ] New hooks added to `.claude/hooks/`
  - [ ] Directory structure maintained correctly
  - [ ] File permissions set appropriately

- [ ] **Verify Updated Content**
  - [ ] Template files contain latest improvements
  - [ ] Version numbers updated correctly
  - [ ] No corruption in updated files
  - [ ] All files remain valid format (Markdown/JavaScript)

### 4.2 Smart Merge Scenarios
- [ ] **Files with User Customizations**
  - Create test file with user customizations:
  ```markdown
  # Template Content
  
  <!-- USER_CUSTOMIZATION_START -->
  ## My Custom Section
  This is my important custom content.
  <!-- USER_CUSTOMIZATION_END -->
  
  # More Template Content
  ```
  
  - [ ] Update preserves user customization sections
  - [ ] Template sections are updated correctly
  - [ ] No conflicts in merge process
  - [ ] User content remains intact and functional

- [ ] **Conflict Resolution Testing**
  - Create conflicts between template and user changes
  - [ ] System detects conflicts correctly
  - [ ] Provides clear conflict resolution options
  - [ ] User can choose merge strategy
  - [ ] Final result maintains system functionality

### 4.3 Protected File Testing
- [ ] **Custom User Agents**
  - Create fully custom agent not based on template
  - [ ] System recognizes as custom/proprietary
  - [ ] Excludes from update process
  - [ ] Leaves custom files completely untouched
  - [ ] Reports protection status clearly

- [ ] **Modified Template Files**
  - [ ] Identifies user modifications correctly
  - [ ] Offers appropriate merge options
  - [ ] Preserves critical user modifications
  - [ ] Updates template portions safely

---

## ⚠️ PHASE 5: Error Handling and Recovery

### 5.1 Failure Scenario Testing
- [ ] **Network Connectivity Issues**
  - Disconnect network during update
  - [ ] Update fails gracefully
  - [ ] No partial updates applied
  - [ ] System remains in consistent state
  - [ ] Clear error message provided

- [ ] **Insufficient Disk Space**
  - Fill disk to near capacity
  - [ ] Update detects space issue
  - [ ] Fails before modifying files
  - [ ] Provides clear error message
  - [ ] System remains functional

- [ ] **Permission Errors**
  - Make files read-only
  - [ ] Update detects permission issues
  - [ ] Fails safely without corruption
  - [ ] Provides helpful error guidance
  - [ ] No partial modifications made

### 5.2 Rollback Testing
- [ ] **Automatic Rollback on Failure**
  - Simulate critical validation failure
  - [ ] System offers automatic rollback
  - [ ] Rollback restores original state perfectly
  - [ ] All user data preserved
  - [ ] System functionality restored

- [ ] **Manual Rollback Testing**
  ```bash
  npx automagik-genie rollback <backup-id>
  ```
  - [ ] Shows backup information before rollback
  - [ ] Requests user confirmation appropriately
  - [ ] Restores files to exact original state
  - [ ] Reports rollback success/failure clearly

- [ ] **Rollback Validation**
  ```bash
  find .claude -type f -exec md5sum {} \; > post_rollback_checksums.txt
  diff baseline_checksums.txt post_rollback_checksums.txt
  ```
  - [ ] All files match original checksums exactly
  - [ ] No data loss occurred
  - [ ] User customizations fully restored

---

## 🎯 PHASE 6: User Experience Validation

### 6.1 Interactive Prompts Testing
- [ ] **Update Consent Process**
  - Run update without `--force` flag
  - [ ] Clear summary of planned changes
  - [ ] Understandable risk indicators
  - [ ] Reasonable default options
  - [ ] Easy to approve/cancel process

- [ ] **File-Specific Choices**
  - [ ] Can choose different strategies per file
  - [ ] Options are clearly explained
  - [ ] Choices are remembered and applied correctly
  - [ ] Can cancel at any point safely

### 6.2 Progress and Feedback
- [ ] **Update Progress Indicators**
  - [ ] Clear phase indicators (Analysis, Backup, Update, Validation)
  - [ ] Progress feedback during long operations
  - [ ] Informative status messages
  - [ ] Clear success/failure indicators

- [ ] **Error Messages**
  - [ ] Errors are clearly explained
  - [ ] Provide actionable guidance
  - [ ] Include relevant technical details
  - [ ] Suggest next steps appropriately

### 6.3 Help and Documentation
- [ ] **Command Help**
  ```bash
  npx automagik-genie --help
  npx automagik-genie update --help
  npx automagik-genie rollback --help
  ```
  - [ ] All commands have clear help text
  - [ ] Examples are accurate and helpful
  - [ ] Flag descriptions are clear
  - [ ] Usage patterns are documented

---

## 🔧 PHASE 7: CLI Interface Validation

### 7.1 All Command Variations
- [ ] **Update Command Flags**
  ```bash
  npx automagik-genie update --dry-run
  npx automagik-genie update --agents-only
  npx automagik-genie update --hooks-only
  npx automagik-genie update --force
  npx automagik-genie update --backup-dir /custom/path
  ```
  - [ ] Each flag works as documented
  - [ ] Combinations work correctly
  - [ ] No unexpected interactions

- [ ] **Status Command Variations**
  ```bash
  npx automagik-genie status
  npx automagik-genie status --check-remote
  npx automagik-genie status --detailed
  ```
  - [ ] All variations produce expected output
  - [ ] Timing is reasonable for each variant

- [ ] **Cleanup Command Testing**
  ```bash
  npx automagik-genie cleanup
  npx automagik-genie cleanup --max-age 7
  npx automagik-genie cleanup --keep-count 10
  npx automagik-genie cleanup --cache
  ```
  - [ ] Cleans up old backups appropriately
  - [ ] Respects age and count parameters
  - [ ] Template cache cleanup works
  - [ ] Reports cleanup statistics

### 7.2 Exit Codes and Error Handling
- [ ] **Success Scenarios** (Exit Code 0)
  - [ ] Successful updates
  - [ ] Up-to-date status checks
  - [ ] Successful rollbacks
  - [ ] Help commands

- [ ] **Error Scenarios** (Exit Code 1)
  - [ ] Invalid project directory
  - [ ] Network failures
  - [ ] Permission errors
  - [ ] Invalid backup IDs

---

## 📊 PHASE 8: Performance and Scale Testing

### 8.1 Performance Benchmarks
- [ ] **Small Project (< 10 files)**
  - [ ] Analysis completes in < 5 seconds
  - [ ] Backup creation < 2 seconds
  - [ ] Update execution < 10 seconds
  - [ ] Total time < 30 seconds

- [ ] **Medium Project (10-25 files)**
  - [ ] Analysis completes in < 15 seconds
  - [ ] Backup creation < 5 seconds
  - [ ] Update execution < 30 seconds
  - [ ] Total time < 60 seconds

- [ ] **Large Project (25+ files)**
  - [ ] Analysis completes in < 30 seconds
  - [ ] Backup creation < 10 seconds
  - [ ] Update execution < 60 seconds
  - [ ] Total time < 120 seconds

### 8.2 Resource Usage
- [ ] **Memory Usage**
  - [ ] No memory leaks during operation
  - [ ] Reasonable peak memory usage
  - [ ] Cleanup after completion

- [ ] **Disk Space**
  - [ ] Backup space usage is reasonable
  - [ ] Temporary files are cleaned up
  - [ ] No unnecessary disk space consumption

---

## ✅ PHASE 9: Final Validation

### 9.1 End-to-End Complete Test
- [ ] **Complete Update Cycle**
  1. [ ] Start with clean project
  2. [ ] Add user customizations
  3. [ ] Run complete update
  4. [ ] Verify all changes correct
  5. [ ] Test rollback functionality
  6. [ ] Confirm perfect restoration

- [ ] **Data Integrity Verification**
  ```bash
  # Compare critical user data before/after
  diff -r .claude/original .claude/after-update
  ```
  - [ ] All user customizations preserved
  - [ ] Template updates applied correctly
  - [ ] No corruption or data loss
  - [ ] System remains fully functional

### 9.2 Cross-Platform Testing
- [ ] **Linux Testing**
  - [ ] All functionality works correctly
  - [ ] File permissions handled properly
  - [ ] Path handling is correct

- [ ] **macOS Testing**
  - [ ] All functionality works correctly
  - [ ] No platform-specific issues
  - [ ] Performance is acceptable

- [ ] **Windows Testing**
  - [ ] All functionality works correctly
  - [ ] Path separators handled correctly
  - [ ] No platform-specific errors

---

## 🚨 CRITICAL SUCCESS CRITERIA

### Must Pass (Zero Tolerance for Failure)
- [ ] ✅ **ZERO DATA LOSS**: No user customizations lost under any circumstance
- [ ] ✅ **PERFECT ROLLBACK**: Complete restoration capability verified
- [ ] ✅ **ATOMIC OPERATIONS**: All-or-nothing update guarantee confirmed
- [ ] ✅ **BACKUP INTEGRITY**: Backup/restore cycle tested and verified
- [ ] ✅ **ERROR RECOVERY**: All failure scenarios handled gracefully

### High Priority
- [ ] ✅ All CLI commands function correctly
- [ ] ✅ User experience is clear and helpful
- [ ] ✅ Performance meets benchmarks
- [ ] ✅ Cross-platform compatibility confirmed

### Final Sign-Off
- [ ] ✅ **QA Lead Approval**: All critical tests passed
- [ ] ✅ **Data Safety Verified**: User data protection confirmed
- [ ] ✅ **Performance Validated**: All benchmarks met
- [ ] ✅ **User Experience Approved**: Interface is clear and helpful

**Date Completed**: ___________
**QA Tester**: ___________
**Sign-off**: ___________

---

## 🛠️ Emergency Procedures

### If Critical Issues Found
1. **STOP RELEASE IMMEDIATELY**
2. Document the specific failure scenario
3. Create reproduction steps
4. Add automated test to prevent regression
5. Fix the issue completely
6. Re-run full test suite
7. Re-execute this manual checklist

### Recovery Information
- **Backup Location**: User's `~/.automagik-genie/backups/`
- **Emergency Rollback**: `npx automagik-genie rollback --list` then select backup
- **Support Contact**: [Provide emergency contact information]

**Remember**: User data safety is our highest priority. When in doubt, err on the side of caution and additional testing.
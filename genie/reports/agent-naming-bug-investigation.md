# 🚨 CRITICAL SYSTEM BUG: Agent Naming Pattern Investigation

## 🔍 Investigation Summary

**Bug Status**: CONFIRMED - Critical system bug affecting project initialization
**Impact**: HIGH - Affects all Genie deployments and agent spawning
**Root Cause**: Multiple naming pattern inconsistencies in agent creation system

## 🎯 Key Findings

### 1. **Primary Bug: Missing "genie" in Agent Names**

**Location**: `/home/cezar/automagik/automagik-genie/lib/init.js:456`

**Current Code (WRONG)**:
```javascript
name: ${projectName}-${agentType}
```

**Should Be**:
```javascript  
name: ${projectName}-genie-${agentType}
```

**Impact**: Creates agents like `automagik-ui-dev-coder` instead of `automagik-ui-genie-dev-coder`

### 2. **Standard vs. Custom Agent Discrepancy**

**Standard Agents (Correctly Created by init.js)**:
- ✅ `automagik-ui-analyzer` → should be `automagik-ui-genie-analyzer`
- ✅ `automagik-ui-dev-planner` → should be `automagik-ui-genie-dev-planner`
- ✅ `automagik-ui-dev-designer` → should be `automagik-ui-genie-dev-designer`
- ✅ `automagik-ui-dev-coder` → should be `automagik-ui-genie-dev-coder`
- ✅ `automagik-ui-dev-fixer` → should be `automagik-ui-genie-dev-fixer`
- ✅ `automagik-ui-agent-creator` → should be `automagik-ui-genie-agent-creator`
- ✅ `automagik-ui-agent-enhancer` → should be `automagik-ui-genie-agent-enhancer`
- ✅ `automagik-ui-claudemd` → should be `automagik-ui-genie-claudemd`
- ✅ `automagik-ui-clone` → should be `automagik-ui-genie-clone`

**Custom Agents (Incorrectly Created Outside System)**:
- ❌ `automagik-ui-api-architect` (WRONG - non-standard suffix)
- ❌ `automagik-ui-database-architect` (WRONG - non-standard suffix)
- ❌ `automagik-ui-devops-specialist` (WRONG - non-standard suffix)
- ❌ `automagik-ui-design-system-specialist` (WRONG - non-standard suffix)
- ❌ `automagik-ui-performance-optimizer` (WRONG - non-standard suffix)
- ❌ `automagik-ui-security-specialist` (WRONG - non-standard suffix)
- ❌ `automagik-ui-testing-specialist` (WRONG - non-standard suffix)
- ❌ `automagik-ui-webgl-specialist` (WRONG - non-standard suffix)

## 🔄 Expected Naming Convention

**Pattern**: `{project-name}-genie-{agent-function}`

**Examples**:
- `automagik-ui-genie-dev-coder`
- `automagik-ui-genie-analyzer`
- `automagik-ui-genie-dev-designer`

**NOT**:
- `automagik-ui-api-architect`
- `automagik-ui-database-architect`

## 📊 System Impact Analysis

### 1. **Initialization Bug**
- **File**: `lib/init.js`
- **Function**: `generateAgentTemplate()`
- **Issue**: Missing "genie" in naming pattern
- **Affects**: ALL new project initializations

### 2. **Custom Agent Creation Bug** 
- **Source**: Likely created via `genie-agent-creator` without proper naming validation
- **Issue**: Non-standard naming conventions allowed
- **Affects**: Agent spawning and routing

### 3. **CLAUDE.md Documentation Mismatch**
- **File**: `/home/cezar/automagik/automagik-ui/CLAUDE.md`
- **Issue**: Lists both correct and incorrect agent names
- **Impact**: User confusion and failed Task() calls

## 🛠️ Root Cause Analysis

### Primary Causes:
1. **Init System Bug**: Missing "genie" in `${projectName}-${agentType}` pattern
2. **Validation Gap**: No naming pattern validation in agent creation
3. **Template Inconsistency**: Custom agents bypass standard naming rules
4. **Documentation Sync**: CLAUDE.md reflects incorrect agent names

### Secondary Issues:
1. **Agent Creator Bug**: Allows non-standard naming patterns
2. **Routing Confusion**: Master Genie tries to spawn non-existent agents
3. **Documentation Drift**: Available agents don't match documented agents

## 🎯 Proposed Solutions

### 1. **Fix Core Naming Bug** (CRITICAL)
**File**: `lib/init.js`
**Change**:
```javascript
// FROM:
name: ${projectName}-${agentType}
const agentPath = path.join(agentsTemplateDir, `${variables.PROJECT_NAME}-${agentType}.md`);

// TO:  
name: ${projectName}-genie-${agentType}
const agentPath = path.join(agentsTemplateDir, `${variables.PROJECT_NAME}-genie-${agentType}.md`);
```

### 2. **Add Naming Validation** (HIGH)
**Location**: `genie-agent-creator.md`
**Add**: Naming pattern validation that rejects non-standard suffixes

### 3. **Standardize Custom Agents** (MEDIUM)
**Action**: Rename or recreate custom agents with proper naming:
- `automagik-ui-api-architect` → `automagik-ui-genie-api-specialist`
- `automagik-ui-database-architect` → `automagik-ui-genie-db-specialist`
- etc.

### 4. **Update Documentation** (LOW)
**File**: `automagik-ui/CLAUDE.md`
**Action**: Update agent list to reflect corrected naming patterns

## 🚨 Immediate Actions Required

1. **Fix `lib/init.js`** - Add "genie" to naming pattern
2. **Test fix** - Initialize new project and verify agent names  
3. **Update templates** - Ensure all templates use correct naming
4. **Add validation** - Prevent future naming inconsistencies
5. **Document standards** - Clarify naming conventions in documentation

## 📈 Verification Steps

1. Run `genie init test-project`
2. Verify agents are named: `test-project-genie-analyzer`, `test-project-genie-dev-coder`, etc.
3. Test Task() spawning with correct names
4. Validate all agents can be spawned successfully

## 🎯 Success Criteria

- ✅ All new projects create agents with proper `{project}-genie-{function}` naming
- ✅ Existing projects can spawn agents using documented names
- ✅ No more `Task()` failures due to incorrect agent names
- ✅ Consistent naming across all Genie deployments

---

**Investigation Complete**: Root cause identified, impact assessed, solutions proposed.
**Priority**: CRITICAL - Fix immediately to prevent further deployment issues.
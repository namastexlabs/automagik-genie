# 🏗️ Folder Structure Refactor: Move Code to src/ WISH

**Status:** DRAFT
**GitHub Issue:** #359 – https://github.com/namastexlabs/automagik-genie/issues/359
**Roadmap Item:** Foundation - Project Structure
**Completion Score:** 0/100

## 🎯 Objective

Move source code from `.genie/` to standard npm `src/` structure, separating implementation (src/) from framework content (.genie/).

## Current State (WRONG)

```
automagik-genie/
├── .genie/               # ❌ MIXED: code + framework
│   ├── cli/              # ❌ Should be src/cli/
│   ├── mcp/              # ❌ Should be src/mcp/
│   ├── agents/           # ✅ Framework (stays)
│   ├── spells/           # ✅ Framework (stays)
│   └── ...
├── forge.js              # ❌ Should be src/forge-client.js
└── bin/                  # ✅ Entry points (stays)
```

**Problem:**
- Violates npm conventions (code should be in src/)
- Confuses developers ("why is code in .genie?")
- Poor IDE support (.genie typically gitignored in other projects)
- Unclear boundary between framework and implementation

## Target State (CORRECT)

```
automagik-genie/
├── src/                  # ✅ Source code
│   ├── cli/              # CLI implementation
│   ├── mcp/              # MCP server
│   └── forge-client.js   # Forge API client
├── dist/                 # Build output (gitignored)
├── .genie/               # ✅ Framework content ONLY
│   ├── agents/
│   ├── spells/
│   ├── neurons/
│   ├── product/
│   └── ...
└── bin/                  # ✅ Entry points (stays)
```

**Benefits:**
1. Standard npm package structure
2. Clear separation: code (src/) vs framework (.genie/)
3. Better IDE support (src/ is industry standard)
4. Easier onboarding (developers expect src/)
5. Removes confusion about .genie/ purpose

## Scope

### In Scope
- Move `.genie/cli/` → `src/cli/`
- Move `.genie/mcp/` → `src/mcp/`
- Move `forge.js` → `src/forge-client.js`
- Update all imports (1,435 references across 92 files)
- Update build scripts (tsconfig.json, package.json)
- Update bin/ entry points
- Update documentation
- Verify tests pass

### Out of Scope
- Refactoring file contents (just moving, not changing logic)
- Splitting large files (#297 - separate issue)
- Renaming variables/types (#424 - separate issue)
- Framework content (.genie/ agents/spells stay as-is)

## Success Metrics
- Zero test failures after move
- CLI works: `genie --version`
- MCP works: `node dist/mcp/server.js`
- Package installs: `npm install -g automagik-genie@next`
- All imports resolve correctly
- Build succeeds with new paths
- Documentation updated

## Execution Plan

### Phase 1: Preparation (30 min)
1. Create backup: `cp -r .genie/ .genie.backup/`
2. Create `src/` directory structure
3. Verify git clean state

### Phase 2: Move Files (30 min)
```bash
# Move CLI
git mv .genie/cli src/cli

# Move MCP
git mv .genie/mcp src/mcp

# Move forge client
git mv forge.js src/forge-client.js
```

### Phase 3: Update Imports (2 hours)
**Strategy:** Automated search-replace with manual review

```bash
# Update imports in src/
find src -name "*.ts" -exec sed -i 's|from "\.\./\.\./cli/|from "../cli/|g' {} \;
find src -name "*.ts" -exec sed -i 's|from "\.\./\.\./mcp/|from "../mcp/|g' {} \;

# Update imports referencing .genie/cli or .genie/mcp
grep -r "\.genie/cli\|\.genie/mcp" . --include="*.ts" --include="*.js" --include="*.json"
# Manual fix each one
```

**Files needing manual review:**
- `package.json` - Build scripts, entry points
- `tsconfig.json` - Paths, includes, outDir
- `bin/genie` - CLI entry point
- `bin/genie-mcp` - MCP entry point
- All test files
- Documentation (README, etc.)

### Phase 4: Update Build Configuration (30 min)

**Update `package.json`:**
```json
{
  "scripts": {
    "build:cli": "tsc -p src/cli/tsconfig.json",
    "build:mcp": "tsc -p src/mcp/tsconfig.json"
  },
  "main": "dist/cli/genie.js",
  "bin": {
    "genie": "./bin/genie"
  }
}
```

**Update `tsconfig.json` files:**
- `src/cli/tsconfig.json` - Update paths
- `src/mcp/tsconfig.json` - Update paths

**Update `bin/` scripts:**
```javascript
// bin/genie (update path)
#!/usr/bin/env node
require('../dist/cli/genie.js');
```

### Phase 5: Validation (1 hour)
```bash
# Build
pnpm run build:cli
pnpm run build:mcp

# Test CLI
node dist/cli/genie.js --version
node dist/cli/genie.js init --help

# Test MCP
node dist/mcp/server.js

# Run test suite
pnpm test

# Test global install
npm link
genie --version
npm unlink automagik-genie
```

### Phase 6: Documentation (30 min)
- Update README.md (development section)
- Update CONTRIBUTING.md (if exists)
- Update .genie/product/tech-stack.md
- Add migration note to CHANGELOG.md

## Risks & Mitigations

**Risk 1:** Import paths break
- **Mitigation:** Automated sed + manual grep verification
- **Rollback:** `git revert` single commit

**Risk 2:** Build configuration errors
- **Mitigation:** Test each build target separately
- **Rollback:** Restore backup tsconfig files

**Risk 3:** Tests fail
- **Mitigation:** Fix imports in test files, update mocks
- **Rollback:** Git revert if too complex

**Risk 4:** Global install broken
- **Mitigation:** Test `npm link` before pushing
- **Rollback:** Don't publish until verified

## Validation Commands

```bash
# Pre-move verification
ls -la .genie/cli .genie/mcp forge.js
git status  # Should be clean

# Post-move verification
ls -la src/cli src/mcp src/forge-client.js
find . -name "*.ts" -exec grep -l "\.genie/cli\|\.genie/mcp" {} \; | wc -l  # Should be 0

# Build verification
pnpm run build:cli && echo "CLI build OK"
pnpm run build:mcp && echo "MCP build OK"

# Runtime verification
genie --version
genie list agents | head -5
node dist/mcp/server.js &  # Should start without errors
kill %1

# Test verification
pnpm test

# Installation verification
npm pack
npm install -g automagik-genie-*.tgz
genie --version
npm uninstall -g automagik-genie
```

## Rollback Plan

```bash
# If move fails
git reset --hard HEAD
cp -r .genie.backup/* .genie/
pnpm run build:cli
pnpm run build:mcp
pnpm test

# If published broken version
npm unpublish automagik-genie@<bad-version> --force
# (only possible within 72 hours)
```

## Estimated Time

- Preparation: 30 min
- Move files: 30 min
- Update imports: 2 hours
- Update build config: 30 min
- Validation: 1 hour
- Documentation: 30 min
- **Total: ~5 hours**

## <spec_contract>
- **Scope:** Move .genie/cli, .genie/mcp, forge.js to src/
- **Out of scope:** Refactoring file contents, renaming variables, framework content
- **Success metrics:** Zero test failures, CLI works, MCP works, package installs, builds succeed
- **GitHub issue:** #359
- **Dependencies:** Git, pnpm, Node.js 18+
- **Blockers:** None
</spec_contract>

## Status Log
- [2025-11-02] Wish created
- [Pending] Execution

---

**Next Actions:**
1. Review and approve wish
2. Create branch: `git checkout -b refactor/359-folder-structure`
3. Create backup
4. Execute Phase 1-6
5. Create PR to dev

**Wish saved at:** `@.genie/wishes/359-folder-structure-refactor/359-folder-structure-wish.md`

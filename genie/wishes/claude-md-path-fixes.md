# CLAUDE.md Path Corrections Implementation Plan

## 🎯 Issue #4 Resolution Strategy

**Problem**: CLAUDE.md references non-existent automagik-hive paths instead of actual automagik-genie structure

**Solution**: Complete rewrite of architecture sections with accurate paths and project understanding

## 📋 Required Changes

### 1. Project Description Correction
**Current**: "Automagik Hive is an enterprise multi-agent AI framework built on **Agno (agno-agi/agno)**"
**Correct**: "Automagik Genie is a universal AI development companion - a Node.js CLI tool that can be initialized in any codebase"

### 2. Architecture Treasure Map Replacement
**Remove**: All Python/Agno references, fake directory structures
**Add**: Actual Node.js project structure based on real directories

### 3. Development Commands Update  
**Remove**: All `uv`, `make`, Python commands
**Update**: Replace with actual npm/Node.js commands from package.json

### 4. Agent References Correction
**Current**: References to `.claude/agents/` with specific agents
**Reality**: Directory exists but is empty - update to reflect template system

### 5. Component CLAUDE.md References Removal
**Remove**: All references to non-existent CLAUDE.md files in ai/, api/, lib/ subdirectories

## 🔧 Corrected Architecture Map

```
automagik-genie/
🧭 NAVIGATION ESSENTIALS
├── package.json            # Node.js project configuration
├── bin/automagik-genie     # Main CLI executable

🤖 CORE GENIE SYSTEM
├── lib/                    # Core JavaScript modules
│   ├── init.js            # Genie initialization system
│   ├── statusline.js      # Development statusline
│   ├── template-processor.js # Template processing engine
│   ├── generators/        # Code generation utilities
│   ├── update/            # Update system components
│   └── utils/             # Utility functions

📋 TEMPLATE SYSTEM
├── templates/             # Template files
│   ├── CLAUDE.md.template # CLAUDE.md template
│   ├── init-scripts/      # Initialization scripts
│   └── .claude/           # Claude configuration templates

🧪 TESTING & QUALITY
├── tests/                 # Jest test suite
│   ├── *.test.js         # Test files
│   └── test configuration

🛠️ PROJECT TOOLING
├── scripts/              # Build and release scripts
│   ├── bump-version.js   # Version management
│   ├── clean.js         # Cleanup utilities
│   └── release.js       # Release automation

🧞 GENIE WORKSPACE
└── genie/               # Genie's autonomous workspace
    ├── analysis/        # Analysis reports
    ├── experiments/     # Prototypes and demos
    ├── ideas/          # Brainstorming space
    ├── reports/        # Implementation reports
    └── wishes/         # Implementation plans
```

## 🔄 Corrected Development Commands

### Package Management
```bash
npm install                    # Install dependencies
npm test                      # Run Jest test suite
npm run test:coverage         # Run tests with coverage
npm run clean                 # Clean build artifacts
npm run typecheck             # Currently no-op (pure JS project)
npm run build                 # Currently no-op (no build needed)
```

### Genie Commands
```bash
npx automagik-genie init                    # Initialize Genie in project
npx automagik-genie init --legacy          # Legacy mode (destructive)
npx automagik-genie update                 # Update to latest version
npx automagik-genie rollback               # Rollback to previous backup
npx automagik-genie status                 # Show system status
npx automagik-genie cleanup                # Clean old backups
npx automagik-genie statusline             # Run statusline utility
npx automagik-genie --help                 # Show help
```

### Development Workflow
```bash
node bin/automagik-genie init              # Direct execution
jest                                       # Run tests directly
npm run bump-patch                         # Bump patch version
npm run bump-minor                         # Bump minor version
npm run release                           # Release new version
```

## 🎯 Agent System Reality Check

**Current Misleading Content**: Complex agent spawning system with specific agents
**Actual System**: Template-based initialization that creates project-specific agents

**Reality**:
- `.claude/agents/` exists but is currently empty
- System is designed to ANALYZE codebases and CREATE custom agents
- Not a pre-built agent framework, but an intelligent agent generator
- Focus is on initialization, analysis, and customization per project

## 🚀 Implementation Plan

1. **Update Project Overview** - Remove Agno references, correct description
2. **Replace Architecture Map** - Use actual directory structure 
3. **Fix Development Commands** - Replace Python/make with npm/node
4. **Correct Agent References** - Update to reflect template/generation approach
5. **Remove Invalid CLAUDE.md References** - No component-specific files exist
6. **Update Codebase Exploration Command** - Fix tree command for actual structure
7. **Remove MCP Tools Section** - Verify relevance or remove
8. **Test All Referenced Paths** - Ensure every path mentioned actually exists

This corrects the fundamental mismatch between documentation and reality!
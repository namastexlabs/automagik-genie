# 🧞 Automagik-Genie Universal Template Transformation Plan

## 🎯 Executive Summary

Transform the current `automagik-genie` repository into a universal project template that can be initialized in any codebase via `npx automagik-genie init`. This will create project-specific Genie instances with dynamic agent naming and intelligent codebase adaptation through the analyzer agent.

## 📋 Implementation Phases

### Phase 1: Template System Foundation (Week 1-2)

#### 1.1 Template Directory Structure
```
templates/
├── .claude/
│   ├── agents/
│   │   ├── {{PROJECT_NAME}}-analyzer.md          # NEW: Universal codebase analysis specialist
│   │   ├── {{PROJECT_NAME}}-dev-planner.md       # Template versions of existing agents
│   │   ├── {{PROJECT_NAME}}-dev-designer.md
│   │   ├── {{PROJECT_NAME}}-dev-coder.md
│   │   ├── {{PROJECT_NAME}}-dev-fixer.md
│   │   ├── {{PROJECT_NAME}}-claudemd.md
│   │   ├── {{PROJECT_NAME}}-agent-creator.md
│   │   ├── {{PROJECT_NAME}}-agent-enhancer.md
│   │   └── {{PROJECT_NAME}}-clone.md
│   ├── hooks/
│   │   ├── examples/
│   │   │   ├── pre-commit-quality.js             # Quality checks before commits
│   │   │   ├── post-test-coverage.js             # TDD coverage validation (optional)
│   │   │   ├── pre-deploy-validation.js          # Pre-deployment checks
│   │   │   ├── tdd-workflow.js                   # Optional TDD Red-Green-Refactor
│   │   │   └── language-specific-hooks.js        # Language-specific examples
│   │   └── README.md                              # Hook system documentation
│   └── commands/
│       └── wish.md                                # Universal wish command
├── CLAUDE.md.template                             # Template CLAUDE.md with placeholders
├── package.json.template                          # NPX package template
└── init-scripts/
    ├── check-claude-cli.js                        # Check if Claude CLI is installed
    ├── generate-agents.js                         # Create project-specific agents
    ├── adapt-claude-md.js                         # Customize CLAUDE.md for project
    └── install-hooks.js                           # Install appropriate hooks
```

#### 1.2 NPX Package Structure
```
npm-package/
├── package.json                    # NPX executable configuration
├── bin/
│   └── automagik-genie            # CLI entry point
├── lib/
│   ├── init.js                    # Main initialization logic
│   ├── claude-cli-check.js        # Check and guide Claude CLI installation
│   ├── agent-generator.js         # Generate project-specific agents
│   ├── template-processor.js      # Process template placeholders
│   └── project-adapter.js         # Adapt system to project structure
├── templates/                     # Copy of template directory structure
└── README.md                      # NPX package documentation
```

### Phase 2: Core Agent Creation (Week 2-3)

#### 2.1 NEW: genie-analyzer Agent
Create a specialized agent for universal codebase analysis that can:
- Rapidly understand any project structure and patterns (Go, Rust, Java, Python, JS, etc.)
- Auto-detect languages, frameworks, and build systems
- Identify architecture patterns and key components
- Work in parallel with other agents during development
- Provide language-agnostic recommendations for other agents

**File: `.claude/agents/genie-analyzer.md`**
```markdown
# genie-analyzer - Universal Codebase Intelligence Specialist

## Core Purpose
Language-agnostic codebase analysis and pattern recognition for any programming language or framework.

## Capabilities
- Universal project structure analysis (< 30 seconds for most codebases)
- Auto-detection of: Go, Rust, Java, Python, JavaScript, TypeScript, C#, PHP, Ruby, etc.
- Framework identification: React, Vue, Django, FastAPI, Spring Boot, Gin, Actix, etc.
- Build system detection: Maven, Gradle, Cargo, Go modules, npm/yarn, pip/poetry, etc.
- Architecture pattern identification regardless of language
- Code quality and technical debt assessment across languages
- Integration point mapping for other agents

## Language Intelligence
- Analyzes file extensions, build files, and dependency declarations
- Understands language-specific patterns and conventions
- Provides recommendations adapted to detected tech stack
- No hardcoded assumptions about project type

## Parallel Execution Compatibility
- Designed for concurrent execution with all other agents
- Provides context without blocking other agent operations
- Shares findings via memory system for cross-agent coordination

## Usage Patterns
- Spawn at project start for baseline analysis of ANY codebase
- Run in parallel during feature development
- Coordinate with dev-planner for language-specific requirement analysis
- Support dev-fixer with tech-stack-aware debugging insights
```

#### 2.2 Template Agent Modifications
Convert all existing agents to use dynamic naming:
- Replace hardcoded "genie-" prefix with "{{PROJECT_NAME}}-"
- Add project-specific context awareness
- Include framework-specific capabilities where relevant

### Phase 3: NPX Implementation (Week 3-4)

#### 3.1 Claude CLI Check Logic
```javascript
// lib/claude-cli-check.js
const checkClaude = async () => {
  try {
    const { stdout } = await exec('claude -v');
    console.log('✅ Claude CLI found:', stdout.trim());
    return true;
  } catch (error) {
    console.log('❌ Claude CLI not found');
    console.log('');
    console.log('🚀 To use Automagik Genie, you need Claude CLI installed:');
    console.log('');
    console.log('📦 Install Claude CLI:');
    console.log('   curl -fsSL https://claude.ai/install.sh | sh');
    console.log('');
    console.log('🔐 Then authenticate:');  
    console.log('   claude auth');
    console.log('');
    console.log('💡 After installation, run: npx automagik-genie init');
    console.log('');
    return false;
  }
};
```

#### 3.2 Template Processing Engine
```javascript
// lib/template-processor.js
const processTemplate = (templateContent, variables) => {
  let processed = templateContent;
  
  // Replace all template variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value);
  });
  
  return processed;
};

const generateProjectVariables = async (projectPath) => {
  const packageJson = await readPackageJson(projectPath);
  const gitOrigin = await getGitOrigin(projectPath);
  
  return {
    PROJECT_NAME: extractProjectName(packageJson?.name || path.basename(projectPath)),
    GIT_ORIGIN: gitOrigin,
    PROJECT_PATH: projectPath,
    TIMESTAMP: new Date().toISOString(),
    // Let analyzer agent determine tech stack dynamically
    // No hardcoded framework/language assumptions
  };
};
```

#### 3.3 CLI Implementation
```javascript
#!/usr/bin/env node
// bin/automagik-genie

const { checkClaude } = require('../lib/claude-cli-check.js');
const { init } = require('../lib/init.js');
const path = require('path');

const main = async () => {
  console.log('🧞 Initializing Automagik Genie...');
  
  // First check if Claude CLI is installed
  const claudeAvailable = await checkClaude();
  if (!claudeAvailable) {
    process.exit(1);
  }
  
  const targetPath = process.cwd();
  
  try {
    await init(targetPath);
    console.log('✨ Genie successfully initialized!');
    console.log('🔍 The analyzer agent will auto-detect your tech stack');
    console.log('💡 Try: /wish "analyze this codebase"');
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
};

main();
```

### Phase 4: Dynamic CLAUDE.md Generation (Week 4-5)

#### 4.1 Template CLAUDE.md Structure
```markdown
# {{PROJECT_NAME}} - Automagik Genie Configuration

## 🧞 Project-Specific Genie Instance

**Project**: {{PROJECT_NAME}}
**Initialized**: {{TIMESTAMP}}
**Path**: {{PROJECT_PATH}}

## 🚀 Available Agents

### Universal Analysis
- **{{PROJECT_NAME}}-analyzer**: Universal codebase analysis and tech stack detection

### Core Development
- **{{PROJECT_NAME}}-dev-planner**: Requirements analysis and technical specifications
- **{{PROJECT_NAME}}-dev-designer**: Architecture design and system patterns
- **{{PROJECT_NAME}}-dev-coder**: Code implementation with tech-stack awareness
- **{{PROJECT_NAME}}-dev-fixer**: Debugging and systematic issue resolution

### Agent Management
- **{{PROJECT_NAME}}-agent-creator**: Create new specialized agents
- **{{PROJECT_NAME}}-agent-enhancer**: Enhance and improve existing agents
- **{{PROJECT_NAME}}-clone**: Multi-task coordination with context preservation

### Documentation
- **{{PROJECT_NAME}}-claudemd**: CLAUDE.md documentation management

## 🛠️ Tech Stack Detection

**The {{PROJECT_NAME}}-analyzer agent will automatically detect:**
- Programming languages (Go, Rust, Java, Python, JavaScript, TypeScript, etc.)
- Frameworks (React, Vue, Django, FastAPI, Spring Boot, Gin, etc.)
- Build systems (Maven, Gradle, Cargo, Go modules, npm/yarn, etc.)
- Testing frameworks (Jest, pytest, Go test, Cargo test, etc.)
- Quality tools (ESLint, Ruff, rustfmt, gofmt, etc.)

**No manual configuration needed** - the analyzer handles tech stack adaptation!

## 🎯 Development Workflow

### First Steps
1. **Analyze your codebase**: `/wish "analyze this codebase"`
2. **Get tech-stack-specific recommendations**: Analyzer will provide language/framework-specific guidance
3. **Start development**: Use detected patterns and tools for optimal development experience

### Available Hooks (Optional Examples)
- **TDD Workflow**: Optional Red-Green-Refactor cycle hooks
- **Quality Checks**: Pre-commit validation hooks
- **Language-Specific**: Hooks adapted to your detected tech stack

## 📚 Getting Started

Run your first wish to let the analyzer understand your project:
```
/wish "analyze this codebase and provide development recommendations"
```

The analyzer will auto-detect your tech stack and provide customized guidance!
```

### Phase 5: Hook System Examples (Week 5-6)

#### 5.1 Pre-Commit Quality Hook
```javascript
// .claude/hooks/examples/pre-commit-quality.js
module.exports = {
  name: 'pre-commit-quality',
  event: 'pre-commit',
  
  async execute(context) {
    const { files } = context;
    
    console.log('🔍 Running pre-commit quality checks...');
    console.log('💡 Let analyzer determine appropriate quality tools...');
    
    // Spawn analyzer to detect and run appropriate quality tools
    console.log('🧞 Spawning {{PROJECT_NAME}}-analyzer for quality checks...');
    
    // The analyzer will auto-detect the tech stack and run:
    // - Go: gofmt, golint, go vet
    // - Rust: rustfmt, clippy
    // - Python: ruff, mypy
    // - JavaScript/TypeScript: eslint, prettier
    // - Java: checkstyle, spotbugs
    // - etc.
    
    console.log('✅ Quality checks completed by analyzer!');
  }
};
```

#### 5.2 Optional TDD Workflow Hook
```javascript
// .claude/hooks/examples/tdd-workflow.js
module.exports = {
  name: 'tdd-workflow',
  event: 'pre-commit',
  optional: true, // This is an optional example, not required
  
  async execute(context) {
    console.log('🔴 TDD: Red-Green-Refactor cycle validation...');
    
    // Let analyzer detect test framework and run appropriate commands
    console.log('🧞 Spawning {{PROJECT_NAME}}-analyzer for TDD validation...');
    
    // Analyzer will detect and run:
    // - Go: go test
    // - Rust: cargo test  
    // - Python: pytest
    // - JavaScript: jest/vitest
    // - Java: mvn test / gradle test
    // - etc.
    
    console.log('✅ TDD cycle validation completed!');
  }
};
```

### Phase 6: Testing & Validation (Week 6)

#### 6.1 Test Projects
Create test scenarios for different project types:
- Go + Gin + standard testing
- Rust + Actix + Cargo tests
- Java + Spring Boot + JUnit
- Python + FastAPI + pytest  
- React + TypeScript + Jest
- Vue + Vite + Vitest
- Node.js + Express + Mocha
- C# + .NET + xUnit
- Generic project (analyzer determines tech stack)

#### 6.2 Validation Checklist
- [ ] Claude CLI check works correctly
- [ ] NPX package installs correctly  
- [ ] Project-specific agents are generated correctly
- [ ] CLAUDE.md adapts to project type
- [ ] genie-analyzer can detect any tech stack
- [ ] Hooks examples are installed and functional
- [ ] /wish command works in generated projects
- [ ] All agents can be spawned successfully
- [ ] Parallel execution works (especially with genie-analyzer)
- [ ] No hardcoded framework assumptions

## 🚨 Critical Implementation Notes

### 1. Backward Compatibility
- Existing `genie-*` agents remain functional in current repo
- Template system is additive, not destructive
- Migration path for existing projects

### 2. Project Name Detection
```javascript
const extractProjectName = (input) => {
  // Clean project name for agent naming
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};
```

### 3. Warning System
```bash
⚠️  This will override existing .claude/ directory and CLAUDE.md
📁 Existing files will be backed up to .claude.backup/
❓ Continue? (y/N)
```

### 4. Universal Agent Capabilities
Each agent template should be language-agnostic but intelligent:
- **genie-analyzer**: Universal tech stack detection and recommendations
- **Other agents**: Work with analyzer findings to provide tech-stack-aware assistance
- **No hardcoded assumptions**: Let analyzer determine appropriate tools and patterns
- **Language-specific knowledge**: Provided by analyzer, not hardcoded in agents

## 📊 Success Metrics

1. **Installation Speed**: < 30 seconds for complete setup
2. **Package Size**: < 10MB NPX package  
3. **Universal Compatibility**: Works with ANY programming language/framework
4. **Agent Functionality**: All core agents work in template projects
5. **Claude CLI Integration**: Proper installation check and guidance
6. **Documentation Quality**: Complete examples and clear setup instructions

## 🎯 Deliverables

### Immediate (Phase 1-2)
1. Template directory structure
2. genie-analyzer universal agent
3. Template processing engine
4. Claude CLI check logic

### Short-term (Phase 3-4)
1. NPX package implementation
2. CLI tool with init command
3. Dynamic CLAUDE.md generation
4. Project-specific agent generation

### Medium-term (Phase 5-6)
1. Comprehensive hook examples (including optional TDD)
2. Testing across multiple programming languages
3. Documentation and user guides  
4. NPM package publication

## 🚀 Next Steps

1. **Create template directory structure** with all agent templates
2. **Implement genie-analyzer** as the universal codebase analysis agent
3. **Build NPX package** with Claude CLI check and template processing
4. **Test initialization workflow** on diverse programming language projects
5. **Document hook system** with optional TDD and language-specific examples
6. **Publish to NPM** for public usage

This plan transforms automagik-genie from a project-specific tool into a **universal AI development companion** that can be deployed to **ANY codebase** (Go, Rust, Java, Python, JavaScript, etc.) with a single command, using intelligent analysis rather than hardcoded assumptions.
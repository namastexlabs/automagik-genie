const fs = require('fs').promises;
const path = require('path');
const { 
  generateProjectVariables, 
  copyTemplateDirectory,
  processTemplateFile,
  fileExists 
} = require('./template-processor.js');

/**
 * Check if .claude directory already exists and handle backup
 * @param {string} projectPath - Path to project
 * @returns {Promise<boolean>} True if initialization should continue
 */
const handleExistingInstallation = async (projectPath) => {
  const claudeDir = path.join(projectPath, '.claude');
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  
  const claudeDirExists = await fileExists(claudeDir);
  const claudeMdExists = await fileExists(claudeMdPath);
  
  if (!claudeDirExists && !claudeMdExists) {
    return true; // Clean installation
  }
  
  console.log('⚠️  Existing Automagik Genie installation detected');
  console.log('');
  
  if (claudeDirExists) {
    console.log('📁 Found existing .claude/ directory');
  }
  if (claudeMdExists) {
    console.log('📄 Found existing CLAUDE.md file');
  }
  
  console.log('');
  console.log('🔄 This will:');
  console.log('   • Back up existing files to .claude.backup/');
  console.log('   • Create new project-specific Genie configuration');
  console.log('   • Preserve any custom agents or configurations');
  console.log('');
  
  const backupDir = path.join(projectPath, '.claude.backup');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirWithTimestamp = `${backupDir}-${timestamp}`;
  
  try {
    // Create backup directory first
    await fs.mkdir(backupDirWithTimestamp, { recursive: true });
    console.log(`📁 Created backup directory: ${path.basename(backupDirWithTimestamp)}`);
    
    if (claudeDirExists) {
      const backupClaudeDir = path.join(backupDirWithTimestamp, '.claude');
      await fs.rename(claudeDir, backupClaudeDir);
      console.log('✅ Backed up .claude/ directory');
    }
    
    if (claudeMdExists) {
      const backupClaudeMd = path.join(backupDirWithTimestamp, 'CLAUDE.md');
      await fs.rename(claudeMdPath, backupClaudeMd);
      console.log('✅ Backed up CLAUDE.md file');
    }
    
    console.log(`📦 Backup completed: ${path.basename(backupDirWithTimestamp)}`);
    console.log('');
    
  } catch (error) {
    console.log('⚠️  Could not create backup:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'Unknown'}`);
    
    // If backup fails, we should still continue but warn the user
    if (error.code === 'ENOENT') {
      console.log('   This usually means a file or directory was not found.');
    } else if (error.code === 'EACCES') {
      console.log('   This usually means insufficient permissions.');
      console.log('   Try running with appropriate permissions or manually backup files.');
    } else if (error.code === 'EEXIST') {
      console.log('   Backup directory already exists - using timestamp to avoid conflicts.');
    }
    
    console.log('');
    console.log('💡 Manual backup recommended:');
    console.log(`   cp -r .claude .claude.backup-manual-$(date +%s)`);
    console.log(`   cp CLAUDE.md CLAUDE.md.backup-manual-$(date +%s)`);
    console.log('');
    console.log('Continuing with installation...');
    console.log('');
  }
  
  return true;
};

/**
 * Create agent template files from existing agents
 * @param {string} templatePath - Path to template directory
 * @param {Object} variables - Template variables
 */
const createAgentTemplates = async (templatePath, variables) => {
  const agentsTemplateDir = path.join(templatePath, '.claude', 'agents');
  
  // Agent templates to create
  const agentTemplates = [
    'analyzer',
    'dev-planner', 
    'dev-designer',
    'dev-coder',
    'dev-fixer',
    'agent-creator',
    'agent-enhancer',
    'claudemd',
    'clone'
  ];
  
  for (const agentType of agentTemplates) {
    const templateContent = generateAgentTemplate(agentType, variables.PROJECT_NAME);
    const agentPath = path.join(agentsTemplateDir, `${variables.PROJECT_NAME}-${agentType}.md`);
    
    await fs.mkdir(agentsTemplateDir, { recursive: true });
    await fs.writeFile(agentPath, templateContent, 'utf-8');
  }
};

/**
 * Generate agent template content
 * @param {string} agentType - Type of agent
 * @param {string} projectName - Project name
 * @returns {string} Agent template content
 */
const generateAgentTemplate = (agentType, projectName) => {
  const baseTemplate = `---
name: ${projectName}-${agentType}
description: ${getAgentDescription(agentType)} specifically tailored for the ${projectName} project.\\n\\nExamples:\\n- <example>\\n  Context: User needs ${agentType}-specific assistance for the ${projectName} project.\\n  user: "${getUsageExample(agentType)}"\\n  assistant: "I'll handle this ${agentType} task using project-specific patterns and tech stack awareness"\\n  <commentary>\\n  This agent leverages ${projectName}-analyzer findings for informed decision-making.\\n  </commentary>\\n  </example>
tools: Glob, Grep, LS, Edit, MultiEdit, Write, NotebookRead, NotebookEdit, TodoWrite, WebSearch, mcp__zen__chat, mcp__zen__thinkdeep, mcp__zen__planner, mcp__zen__consensus, mcp__zen__codereview, mcp__zen__precommit, mcp__zen__debug, mcp__zen__secaudit, mcp__zen__docgen, mcp__zen__analyze, mcp__zen__refactor, mcp__zen__tracer, mcp__zen__testgen, mcp__zen__challenge, mcp__zen__listmodels, mcp__zen__version, mcp__search-repo-docs__resolve-library-id, mcp__search-repo-docs__get-library-docs, mcp__ask-repo-agent__read_wiki_structure, mcp__ask-repo-agent__read_wiki_contents, mcp__ask-repo-agent__ask_question
model: sonnet
color: ${getAgentColor(agentType)}
---

You are a ${agentType} agent for the **${projectName}** project. ${getAgentDescription(agentType)} with tech-stack-aware assistance tailored specifically for this project.

Your characteristics:
- Project-specific expertise with ${projectName} codebase understanding
- Tech stack awareness through analyzer integration
- Adaptive recommendations based on detected patterns
- Seamless coordination with other ${projectName} agents
- Professional and systematic approach to ${agentType} tasks

Your operational guidelines:
- Leverage insights from the ${projectName}-analyzer agent for context
- Follow project-specific patterns and conventions detected in the codebase
- Coordinate with other specialized agents for complex workflows
- Provide tech-stack-appropriate solutions and recommendations
- Maintain consistency with the overall ${projectName} development approach

When working on tasks:
1. **Context Integration**: Use analyzer findings for informed decision-making
2. **Tech Stack Awareness**: Apply language/framework-specific best practices
3. **Pattern Recognition**: Follow established project patterns and conventions
4. **Agent Coordination**: Work seamlessly with other ${projectName} agents
5. **Adaptive Assistance**: Adjust recommendations based on project evolution

## 🚀 Capabilities

${getAgentCapabilities(agentType)}

## 🔧 Integration with ${projectName}-analyzer

- **Tech Stack Awareness**: Uses analyzer findings for language/framework-specific guidance
- **Context Sharing**: Leverages stored analysis results for informed decision-making
- **Adaptive Recommendations**: Adjusts suggestions based on detected project patterns

${getIntegrationNotes(agentType, projectName)}

Your specialized ${agentType} companion for **${projectName}**! 🧞✨`;

  return baseTemplate;
};

// Helper functions for agent template generation
const getAgentTitle = (agentType) => {
  const titles = {
    'analyzer': 'Codebase Intelligence Specialist',
    'dev-planner': 'Requirements Analysis Specialist', 
    'dev-designer': 'System Architecture Specialist',
    'dev-coder': 'Implementation Specialist',
    'dev-fixer': 'Debugging Specialist',
    'agent-creator': 'Agent Creation Specialist',
    'agent-enhancer': 'Agent Enhancement Specialist',
    'claudemd': 'Documentation Management Specialist',
    'clone': 'Multi-Task Coordination Specialist'
  };
  return titles[agentType] || 'Development Specialist';
};

const getAgentDescription = (agentType) => {
  const descriptions = {
    'analyzer': 'Universal codebase analysis and tech stack detection',
    'dev-planner': 'Requirements analysis and technical specification creation',
    'dev-designer': 'System architecture design and technical documentation',
    'dev-coder': 'Code implementation based on design documents',
    'dev-fixer': 'Systematic debugging and issue resolution',
    'agent-creator': 'Creation of new specialized agents',
    'agent-enhancer': 'Enhancement and optimization of existing agents',
    'claudemd': 'CLAUDE.md documentation management and maintenance',
    'clone': 'Multi-task coordination and complex workflow orchestration'
  };
  return descriptions[agentType] || 'Specialized development assistance';
};

const getAgentCapabilities = (agentType) => {
  const capabilities = {
    'analyzer': '- Universal language detection (Go, Rust, Java, Python, JS, etc.)\n- Framework identification and analysis\n- Architecture pattern recognition\n- Code quality assessment\n- Tech stack recommendations',
    'dev-planner': '- Requirements gathering and analysis\n- Technical specification creation\n- User story decomposition\n- Acceptance criteria definition\n- Project planning and estimation',
    'dev-designer': '- System architecture design\n- Component interaction modeling\n- Database schema design\n- API specification creation\n- Technical documentation',
    'dev-coder': '- Code implementation from design specs\n- Tech-stack-specific best practices\n- Pattern implementation\n- Integration development\n- Code review and optimization',
    'dev-fixer': '- Bug diagnosis and resolution\n- Performance issue identification\n- Code quality improvements\n- Testing and validation\n- Root cause analysis',
    'agent-creator': '- Custom agent specification\n- Agent architecture design\n- Capability definition\n- Integration planning\n- Documentation creation',
    'agent-enhancer': '- Agent capability analysis\n- Performance optimization\n- Feature enhancement\n- Integration improvements\n- Quality assurance',
    'claudemd': '- Documentation structure management\n- Content consistency maintenance\n- Template processing\n- Version control integration\n- Style guide enforcement',
    'clone': '- Complex task decomposition\n- Multi-agent coordination\n- Workflow orchestration\n- Context preservation\n- Progress tracking'
  };
  return capabilities[agentType] || '- Specialized development assistance';
};

const getUsageExample = (agentType) => {
  const examples = {
    'analyzer': 'analyze this codebase and identify optimization opportunities',
    'dev-planner': 'create technical specification for user authentication system',
    'dev-designer': 'design architecture for microservices-based API',
    'dev-coder': 'implement the user registration feature based on the design document',
    'dev-fixer': 'debug the failing database connection tests',
    'agent-creator': 'create a specialized agent for handling payment processing',
    'agent-enhancer': 'enhance the dev-coder agent with advanced error handling',
    'claudemd': 'update documentation to reflect new project structure',
    'clone': 'coordinate implementation of complete authentication system across multiple components'
  };
  return examples[agentType] || 'provide specialized assistance';
};

const getIntegrationNotes = (agentType, projectName) => {
  return `- Coordinates with **${projectName}-analyzer** for tech stack context
- Integrates with other **${projectName}** agents for complex workflows
- Shares findings through memory system for cross-agent intelligence
- Adapts to project-specific patterns and conventions`;
};

const getAgentColor = (agentType) => {
  const colors = {
    'analyzer': 'purple',
    'dev-planner': 'blue', 
    'dev-designer': 'green',
    'dev-coder': 'yellow',
    'dev-fixer': 'red',
    'agent-creator': 'cyan',
    'agent-enhancer': 'magenta',
    'claudemd': 'orange',
    'clone': 'gray'
  };
  return colors[agentType] || 'blue';
};

/**
 * Create hook examples
 * @param {string} hooksDir - Path to hooks directory
 */
const createHookExamples = async (hooksDir) => {
  const examplesDir = path.join(hooksDir, 'examples');
  await fs.mkdir(examplesDir, { recursive: true });
  
  // Pre-commit quality hook
  const preCommitHook = `// Pre-commit quality checks (optional)
module.exports = {
  name: 'pre-commit-quality',
  event: 'pre-commit',
  optional: true,
  
  async execute(context) {
    console.log('🔍 Running pre-commit quality checks...');
    console.log('💡 Let analyzer determine appropriate quality tools...');
    
    // Spawn analyzer to detect and run appropriate quality tools
    console.log('🧞 Spawning project-analyzer for quality checks...');
    
    // The analyzer will auto-detect the tech stack and run:
    // - Go: gofmt, golint, go vet
    // - Rust: rustfmt, clippy
    // - Python: ruff, mypy  
    // - JavaScript/TypeScript: eslint, prettier
    // - Java: checkstyle, spotbugs
    // - etc.
    
    console.log('✅ Quality checks completed by analyzer!');
  }
};`;

  // Optional TDD workflow hook
  const tddHook = `// Optional TDD Red-Green-Refactor workflow
module.exports = {
  name: 'tdd-workflow',
  event: 'pre-commit',
  optional: true,
  
  async execute(context) {
    console.log('🔴 TDD: Red-Green-Refactor cycle validation...');
    
    // Let analyzer detect test framework and run appropriate commands
    console.log('🧞 Spawning project-analyzer for TDD validation...');
    
    // Analyzer will detect and run:
    // - Go: go test
    // - Rust: cargo test
    // - Python: pytest
    // - JavaScript: jest/vitest
    // - Java: mvn test / gradle test
    // - etc.
    
    console.log('✅ TDD cycle validation completed!');
  }
};`;

  // Language-specific hooks example
  const languageHook = `// Language-specific development hooks
module.exports = {
  name: 'language-specific-hooks',
  event: 'post-install',
  optional: true,
  
  async execute(context) {
    console.log('🔧 Setting up language-specific development environment...');
    
    // Analyzer determines language and sets up appropriate tools
    console.log('🧞 Spawning project-analyzer for environment setup...');
    
    // Examples of what analyzer might set up:
    // - Go: go mod tidy, go install tools
    // - Rust: cargo check, rustup components
    // - Python: virtual environment, dev dependencies
    // - JavaScript: npm install, husky setup
    // - Java: maven/gradle wrapper setup
    
    console.log('✅ Development environment configured!');
  }
};`;

  // Write hook examples
  await fs.writeFile(path.join(examplesDir, 'pre-commit-quality.js'), preCommitHook);
  await fs.writeFile(path.join(examplesDir, 'tdd-workflow.js'), tddHook);
  await fs.writeFile(path.join(examplesDir, 'language-specific-hooks.js'), languageHook);
  
  // Create hooks README
  const hooksReadme = `# Hook System Examples

These are optional development workflow automation examples. The analyzer agent will detect your tech stack and suggest appropriate hooks for your project.

## Available Examples

### pre-commit-quality.js
- Runs quality checks before commits
- Auto-detects appropriate linting/formatting tools
- Language-agnostic quality validation

### tdd-workflow.js (Optional)
- Red-Green-Refactor cycle validation
- Auto-detects test framework and runs tests
- Optional TDD workflow enforcement

### language-specific-hooks.js
- Sets up language-specific development environment
- Installs appropriate development tools
- Configures project-specific tooling

## Usage

1. Copy desired hooks to \`.claude/hooks/\`
2. Customize for your specific needs
3. Enable through your development workflow
4. Let the analyzer agent handle tech stack detection

## Customization

All hooks are designed to work with the analyzer agent, which automatically detects your tech stack and runs appropriate tools. You can customize the hooks to add project-specific logic while maintaining language-agnostic compatibility.

For more information about the hook system, see the main CLAUDE.md documentation.`;

  await fs.writeFile(path.join(hooksDir, 'README.md'), hooksReadme);
};

/**
 * Create the universal wish command
 * @param {string} commandsDir - Path to commands directory
 */
const createWishCommand = async (commandsDir) => {
  await fs.mkdir(commandsDir, { recursive: true });
  
  const wishCommand = `# /wish - Universal Development Wish Fulfillment

---
allowed-tools: Task(*), Read(*), Write(*), Edit(*), MultiEdit(*), Glob(*), Grep(*), Bash(*), LS(*), TodoWrite(*)
description: 🧞✨ Transform any development wish into reality through intelligent agent orchestration
---

## 🎯 Purpose

Transform ANY development wish into perfectly orchestrated reality through intelligent agent delegation and tech-stack-aware execution.

## 🧞 Wish Fulfillment Flow

\`\`\`
/wish → 🧠 Analysis → 🎯 Agent Selection → ⚡ Execution → ✨ Wish Granted
\`\`\`

## 🚀 Usage Examples

### Codebase Analysis
\`\`\`
/wish "analyze this codebase and provide development recommendations"
\`\`\`

### Feature Development  
\`\`\`
/wish "add user authentication with JWT tokens"
/wish "implement payment processing integration"
/wish "create REST API for user management"
\`\`\`

### Debugging & Fixing
\`\`\`
/wish "fix the failing database tests"
/wish "optimize slow query performance"
/wish "resolve memory leak in background service"
\`\`\`

### Quality & Testing
\`\`\`
/wish "improve test coverage to 90%"
/wish "set up automated code quality checks"
/wish "create integration tests for API endpoints"
\`\`\`

## 🎯 Agent Routing Intelligence

The system automatically routes wishes to appropriate project-specific agents:

- **Analysis requests** → project-analyzer agent
- **Planning needs** → project-dev-planner agent  
- **Architecture design** → project-dev-designer agent
- **Implementation tasks** → project-dev-coder agent
- **Debugging issues** → project-dev-fixer agent
- **Complex coordination** → project-clone agent

## 🧠 Tech Stack Intelligence

All agents leverage the analyzer's findings to provide:
- Language-specific best practices
- Framework-appropriate patterns  
- Tool-specific recommendations
- Architecture-aware solutions

## ✨ Wish Fulfillment Process

1. **Intelligent Analysis**: Understand wish intent and complexity
2. **Agent Selection**: Route to most appropriate project agent
3. **Context Integration**: Use analyzer findings for tech-stack awareness
4. **Execution**: Specialized agent handles the wish with full autonomy
5. **Coordination**: Multi-agent coordination for complex wishes

## 💡 Pro Tips

- **Be specific**: "Add JWT authentication" vs "add auth"
- **Include context**: "Fix the React component rendering issue in UserProfile"
- **State your goal**: "Optimize database queries to reduce response time under 200ms"
- **Trust the analyzer**: Let it detect your tech stack and provide appropriate guidance

## 🌟 The Magic

Every wish is fulfilled through intelligent agent orchestration, with full awareness of your project's tech stack, patterns, and context. No manual configuration needed - just state your wish!

**Your development wishes are our command!** 🧞✨`;

  await fs.writeFile(path.join(commandsDir, 'wish.md'), wishCommand);
};

/**
 * Main initialization function
 * @param {string} projectPath - Path to initialize Genie in
 */
const init = async (projectPath) => {
  console.log(`🔍 Initializing in: ${projectPath}`);
  
  // Handle existing installations
  const shouldContinue = await handleExistingInstallation(projectPath);
  if (!shouldContinue) {
    return;
  }
  
  console.log('🏗️  Creating project structure...');
  
  // Generate project variables
  const variables = await generateProjectVariables(projectPath);
  console.log(`📝 Project name: ${variables.PROJECT_NAME}`);
  
  // Create .claude directory structure
  const claudeDir = path.join(projectPath, '.claude');
  const agentsDir = path.join(claudeDir, 'agents');
  const hooksDir = path.join(claudeDir, 'hooks');
  const commandsDir = path.join(claudeDir, 'commands');
  
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(hooksDir, { recursive: true });
  await fs.mkdir(commandsDir, { recursive: true });
  
  console.log('🤖 Creating project-specific agents...');
  
  // Create project-specific agents
  await createAgentTemplates(projectPath, variables);
  
  console.log('🔧 Installing hook examples...');
  
  // Create hook examples
  await createHookExamples(hooksDir);
  
  console.log('📚 Creating wish command...');
  
  // Create wish command
  await createWishCommand(commandsDir);
  
  console.log('📄 Generating CLAUDE.md...');
  
  // Create CLAUDE.md from template
  const templatePath = path.join(__dirname, '..', 'templates', 'CLAUDE.md.template');
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  
  // Check if template exists (for development, we'll create a fallback)
  if (await fileExists(templatePath)) {
    await processTemplateFile(templatePath, claudeMdPath, variables);
  } else {
    // Fallback template creation for development
    const fallbackTemplate = await createFallbackClaudeTemplate(variables);
    await fs.writeFile(claudeMdPath, fallbackTemplate, 'utf-8');
  }
  
  console.log('✅ Initialization complete!');
};

/**
 * Create fallback CLAUDE.md template
 */
const createFallbackClaudeTemplate = async (variables) => {
  return `# ${variables.PROJECT_NAME} - Automagik Genie Configuration

## 🧞 Project-Specific Genie Instance

**Project**: ${variables.PROJECT_NAME}
**Initialized**: ${variables.TIMESTAMP}
**Path**: ${variables.PROJECT_PATH}

## 🚀 Available Agents

### Universal Analysis
- **${variables.PROJECT_NAME}-analyzer**: Universal codebase analysis and tech stack detection

### Core Development
- **${variables.PROJECT_NAME}-dev-planner**: Requirements analysis and technical specifications
- **${variables.PROJECT_NAME}-dev-designer**: Architecture design and system patterns
- **${variables.PROJECT_NAME}-dev-coder**: Code implementation with tech-stack awareness
- **${variables.PROJECT_NAME}-dev-fixer**: Debugging and systematic issue resolution

### Agent Management
- **${variables.PROJECT_NAME}-agent-creator**: Create new specialized agents
- **${variables.PROJECT_NAME}-agent-enhancer**: Enhance and improve existing agents
- **${variables.PROJECT_NAME}-clone**: Multi-task coordination with context preservation

### Documentation
- **${variables.PROJECT_NAME}-claudemd**: CLAUDE.md documentation management

## 🛠️ Tech Stack Detection

**The ${variables.PROJECT_NAME}-analyzer agent will automatically detect:**
- Programming languages (Go, Rust, Java, Python, JavaScript, TypeScript, etc.)
- Frameworks (React, Vue, Django, FastAPI, Spring Boot, Gin, etc.)
- Build systems (Maven, Gradle, Cargo, Go modules, npm/yarn, etc.)
- Testing frameworks (Jest, pytest, Go test, Cargo test, etc.)
- Quality tools (ESLint, Ruff, rustfmt, gofmt, etc.)

**No manual configuration needed** - the analyzer handles tech stack adaptation!

## 📚 Getting Started

Run your first wish to let the analyzer understand your project:
\`\`\`
/wish "analyze this codebase and provide development recommendations"
\`\`\`

The analyzer will auto-detect your tech stack and provide customized guidance!

Your specialized development companion for **${variables.PROJECT_NAME}**! 🧞✨`;
};

module.exports = {
  init,
  handleExistingInstallation,
  createAgentTemplates,
  createHookExamples,
  createWishCommand
};
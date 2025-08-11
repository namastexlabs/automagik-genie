const fs = require('fs').promises;
const path = require('path');
const { 
  generateProjectVariables, 
  copyTemplateDirectory,
  processTemplateFile,
  fileExists 
} = require('./template-processor.js');

/**
 * UNIFIED INITIALIZATION SYSTEM
 * Combines legacy and smart merge functionality into a single module
 */

// ========================================
// COMMON UTILITIES AND SHARED FUNCTIONS
// ========================================

/**
 * Analyze backup CLAUDE.md files for valuable project information
 * @param {string} projectPath - Path to project
 * @returns {Promise<Object>} Enhanced variables with backup analysis
 */
const analyzeBackupClaude = async (projectPath) => {
  console.log('🔍 Analyzing backup CLAUDE.md files for project information...');
  
  const backupAnalysis = {
    buildCommands: [],
    testingFrameworks: [],
    codeStylePrefs: [],
    projectConfigs: [],
    customAgents: [],
    developmentNotes: [],
    projectDescription: '',
    originalTimestamp: null,
    preservedSections: {}
  };
  
  try {
    // Search for backup directories
    const projectEntries = await fs.readdir(projectPath, { withFileTypes: true });
    const backupDirs = projectEntries
      .filter(entry => entry.isDirectory() && entry.name.includes('.claude.backup'))
      .map(entry => path.join(projectPath, entry.name))
      .sort() // Most recent first based on timestamp
      .reverse();
    
    if (backupDirs.length === 0) {
      console.log('ℹ️  No backup directories found');
      return backupAnalysis;
    }
    
    console.log(`📁 Found ${backupDirs.length} backup director${backupDirs.length === 1 ? 'y' : 'ies'}`);
    
    // Analyze each backup directory
    for (const backupDir of backupDirs) {
      const claudeMdPath = path.join(backupDir, 'CLAUDE.md');
      
      if (await fileExists(claudeMdPath)) {
        console.log(`📄 Analyzing ${path.basename(backupDir)}/CLAUDE.md`);
        
        try {
          const claudeContent = await fs.readFile(claudeMdPath, 'utf-8');
          const analysis = await parseBackupClaude(claudeContent);
          
          // Merge analysis results
          backupAnalysis.buildCommands.push(...analysis.buildCommands);
          backupAnalysis.testingFrameworks.push(...analysis.testingFrameworks);
          backupAnalysis.codeStylePrefs.push(...analysis.codeStylePrefs);
          backupAnalysis.projectConfigs.push(...analysis.projectConfigs);
          backupAnalysis.customAgents.push(...analysis.customAgents);
          backupAnalysis.developmentNotes.push(...analysis.developmentNotes);
          
          // Keep the most recent project description and timestamp
          if (analysis.projectDescription && !backupAnalysis.projectDescription) {
            backupAnalysis.projectDescription = analysis.projectDescription;
          }
          if (analysis.originalTimestamp && !backupAnalysis.originalTimestamp) {
            backupAnalysis.originalTimestamp = analysis.originalTimestamp;
          }
          
          // Preserve important sections
          Object.assign(backupAnalysis.preservedSections, analysis.preservedSections);
          
        } catch (parseError) {
          console.log(`⚠️  Could not parse ${path.basename(backupDir)}/CLAUDE.md: ${parseError.message}`);
        }
      }
    }
    
    // Dedupe and clean results
    backupAnalysis.buildCommands = [...new Set(backupAnalysis.buildCommands)];
    backupAnalysis.testingFrameworks = [...new Set(backupAnalysis.testingFrameworks)];
    backupAnalysis.codeStylePrefs = [...new Set(backupAnalysis.codeStylePrefs)];
    backupAnalysis.customAgents = [...new Set(backupAnalysis.customAgents)];
    
    // Log what was recovered
    logBackupAnalysisResults(backupAnalysis);
    
  } catch (error) {
    console.log(`⚠️  Error during backup analysis: ${error.message}`);
    console.log('   Continuing with standard initialization...');
  }
  
  return backupAnalysis;
};

/**
 * Parse backup CLAUDE.md content for valuable information
 * @param {string} content - CLAUDE.md file content
 * @returns {Promise<Object>} Parsed information
 */
const parseBackupClaude = async (content) => {
  const analysis = {
    buildCommands: [],
    testingFrameworks: [],
    codeStylePrefs: [],
    projectConfigs: [],
    customAgents: [],
    developmentNotes: [],
    projectDescription: '',
    originalTimestamp: null,
    preservedSections: {}
  };
  
  const lines = content.split('\n');
  let currentSection = '';
  let sectionContent = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect sections
    if (trimmedLine.startsWith('#')) {
      // Process previous section
      if (currentSection && sectionContent.length > 0) {
        await processSectionContent(currentSection, sectionContent, analysis);
      }
      
      currentSection = trimmedLine.toLowerCase();
      sectionContent = [];
    } else {
      sectionContent.push(line);
    }
    
    // Extract build commands (clean up line prefixes)
    if (trimmedLine.includes('npm run') || trimmedLine.includes('yarn') || 
        trimmedLine.includes('make') || trimmedLine.includes('gradle') ||
        trimmedLine.includes('cargo') || trimmedLine.includes('go build') ||
        trimmedLine.includes('mvn') || trimmedLine.includes('pip install')) {
      // Clean up line formatting (remove leading dashes, bullets, etc.)
      const cleanCommand = trimmedLine.replace(/^[-*•\s]*/, '').replace(/`/g, '');
      if (cleanCommand) {
        analysis.buildCommands.push(cleanCommand);
      }
    }
    
    // Extract testing frameworks (case-insensitive, multiple per line)
    const lowerLine = trimmedLine.toLowerCase();
    const testFrameworks = ['cargo test', 'go test', 'jest', 'pytest', 'junit', 'mocha', 'vitest', 'cypress'];
    for (const framework of testFrameworks) {
      if (lowerLine.includes(framework)) {
        analysis.testingFrameworks.push(framework);
      }
    }
    
    // Extract code style preferences (case-insensitive, multiple per line)
    const styleTools = ['eslint', 'prettier', 'ruff', 'black', 'rustfmt', 'gofmt', 'checkstyle'];
    for (const tool of styleTools) {
      if (lowerLine.includes(tool)) {
        analysis.codeStylePrefs.push(tool);
      }
    }
    
    // Extract custom agents (improved regex for both old and new naming patterns)
    if (trimmedLine.includes('-genie-') || trimmedLine.includes('agent') || 
        /\w+(-\w+)+-\w+(-\w+)*/.test(trimmedLine)) {
      // Match both old pattern (-genie-) and new pattern (project-name-role)
      const oldAgentMatch = trimmedLine.match(/(\w+(-\w+)*-genie-[\w-]+)/g);
      // More flexible pattern for new naming convention: project-name-anything
      const newAgentMatch = trimmedLine.match(/(\w+(-\w+)+-[\w-]+)/g);
      
      if (oldAgentMatch) {
        oldAgentMatch.forEach(agent => analysis.customAgents.push(agent));
      }
      if (newAgentMatch) {
        // Filter out common false positives and ensure it looks like an agent name
        newAgentMatch.forEach(agent => {
          // Skip if it's a common non-agent pattern
          if (!agent.includes('http') && !agent.includes('www') && agent.split('-').length >= 3) {
            analysis.customAgents.push(agent);
          }
        });
      }
    }
    
    // Extract original timestamp
    if (trimmedLine.includes('**Initialized**:') || trimmedLine.includes('Initialized:')) {
      const timestampMatch = trimmedLine.match(/(\d{4}-\d{2}-\d{2}T[\d:.Z-]+)/);
      if (timestampMatch && !analysis.originalTimestamp) {
        analysis.originalTimestamp = timestampMatch[1];
      }
    }
    
    // Extract project description from first paragraph
    if (!analysis.projectDescription && trimmedLine.length > 20 && 
        !trimmedLine.startsWith('#') && !trimmedLine.startsWith('**') &&
        !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*')) {
      analysis.projectDescription = trimmedLine;
    }
  }
  
  // Process final section
  if (currentSection && sectionContent.length > 0) {
    await processSectionContent(currentSection, sectionContent, analysis);
  }
  
  return analysis;
};

/**
 * Process section content for preservation
 * @param {string} section - Section header
 * @param {Array} content - Section content lines
 * @param {Object} analysis - Analysis object to update
 */
const processSectionContent = async (section, content, analysis) => {
  const contentStr = content.join('\n').trim();
  
  // Preserve important custom sections
  if (section.includes('development') || section.includes('workflow') ||
      section.includes('pattern') || section.includes('convention') ||
      section.includes('standard') || section.includes('guideline')) {
    analysis.preservedSections[section] = contentStr;
    analysis.developmentNotes.push(`From ${section}: ${contentStr.substring(0, 200)}...`);
  }
  
  // Preserve project-specific configurations
  if (section.includes('config') || section.includes('setting') ||
      section.includes('environment') || section.includes('setup')) {
    analysis.projectConfigs.push(`${section}: ${contentStr.substring(0, 150)}...`);
  }
};

/**
 * Log backup analysis results
 * @param {Object} analysis - Backup analysis results
 */
const logBackupAnalysisResults = (analysis) => {
  console.log('🔍 Backup Analysis Results:');
  
  if (analysis.buildCommands.length > 0) {
    console.log(`   📦 Build Commands: ${analysis.buildCommands.length} found`);
    analysis.buildCommands.slice(0, 3).forEach(cmd => 
      console.log(`      • ${cmd.substring(0, 60)}${cmd.length > 60 ? '...' : ''}`));
  }
  
  if (analysis.testingFrameworks.length > 0) {
    console.log(`   🧪 Testing Frameworks: ${analysis.testingFrameworks.join(', ')}`);
  }
  
  if (analysis.codeStylePrefs.length > 0) {
    console.log(`   ✨ Code Style Tools: ${analysis.codeStylePrefs.join(', ')}`);
  }
  
  if (analysis.customAgents.length > 0) {
    console.log(`   🤖 Custom Agents: ${analysis.customAgents.length} found`);
    analysis.customAgents.slice(0, 3).forEach(agent => 
      console.log(`      • ${agent}`));
  }
  
  if (analysis.originalTimestamp) {
    console.log(`   📅 Original Setup: ${analysis.originalTimestamp}`);
  }
  
  if (Object.keys(analysis.preservedSections).length > 0) {
    console.log(`   📚 Preserved Sections: ${Object.keys(analysis.preservedSections).length} found`);
  }
  
  console.log('✅ Backup analysis complete - information will be integrated into new configuration');
};

/**
 * Create a unified backup directory with timestamp for all configuration files
 * @param {string} projectPath - Path to project
 * @param {Object} options - Backup options
 * @param {boolean} options.claudeDir - Whether to backup .claude directory
 * @param {boolean} options.claudeMd - Whether to backup CLAUDE.md file  
 * @param {boolean} options.mcpConfig - Whether to backup .mcp.json file
 * @param {string} options.mcpConfigPath - Path to MCP config file
 * @param {boolean} options.malformedMcp - Whether MCP config is malformed
 * @returns {Promise<string|null>} Backup directory path or null if failed
 */
const createUnifiedBackup = async (projectPath, options = {}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(projectPath, `.claude.backup-${timestamp}`);
  
  try {
    // Create backup directory first
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`📁 Created unified backup directory: ${path.basename(backupDir)}`);
    
    // Backup .claude directory if it exists and requested
    if (options.claudeDir) {
      const claudeDir = path.join(projectPath, '.claude');
      if (await fileExists(claudeDir)) {
        const backupClaudeDir = path.join(backupDir, '.claude');
        await fs.cp ? 
          fs.cp(claudeDir, backupClaudeDir, { recursive: true }) :
          fs.rename(claudeDir, backupClaudeDir);
        console.log('✅ Backed up .claude/ directory');
      }
    }
    
    // Backup CLAUDE.md if it exists and requested
    if (options.claudeMd) {
      const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
      if (await fileExists(claudeMdPath)) {
        const backupClaudeMd = path.join(backupDir, 'CLAUDE.md');
        await fs.copyFile(claudeMdPath, backupClaudeMd);
        console.log('✅ Backed up CLAUDE.md file');
      }
    }
    
    // Backup MCP config if it exists and requested
    if (options.mcpConfig && options.mcpConfigPath) {
      if (await fileExists(options.mcpConfigPath)) {
        const mcpFileName = options.malformedMcp ? '.mcp.json.malformed' : '.mcp.json';
        const backupMcpPath = path.join(backupDir, mcpFileName);
        await fs.copyFile(options.mcpConfigPath, backupMcpPath);
        console.log(`✅ Backed up ${mcpFileName}`);
      }
    }
    
    console.log(`📦 Unified backup completed: ${path.basename(backupDir)}`);
    
    // Add helpful instructions for users to check their backup
    console.log('');
    console.log('💡 Pro Tip: Check your backup for existing patterns and references!');
    console.log(`   📂 View backup: ${path.basename(backupDir)}`);
    console.log('   🔍 Review your existing agents, hooks, and configurations');
    console.log('   📋 Reference previous work to enhance new development patterns');
    console.log('');
    
    return backupDir;
    
  } catch (error) {
    console.log('⚠️  Could not create unified backup:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'Unknown'}`);
    
    // Enhanced error handling with specific guidance
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
    console.log(`   cp .mcp.json .mcp.json.backup-manual-$(date +%s)`);
    
    return null;
  }
};

/**
 * Create standard .mcp.json configuration with smart merging and backup
 * @param {string} projectPath - Path to project directory
 */
const createMcpConfig = async (projectPath) => {
  const mcpConfigPath = path.join(projectPath, '.mcp.json');
  
  // Standard MCP servers that we want to ensure are available
  const standardMcpServers = {
    "ask-repo-agent": {
      type: "sse",
      url: "https://mcp.deepwiki.com/sse"
    },
    "search-repo-docs": {
      command: "npx",
      args: ["-y", "@upstash/context7-mcp"]
    }
  };
  
  let existingConfig = null;
  let shouldMerge = false;
  
  // Check if .mcp.json already exists and handle it
  if (await fileExists(mcpConfigPath)) {
    console.log('📄 Found existing .mcp.json configuration');
    
    try {
      // Read and parse existing configuration
      const existingContent = await fs.readFile(mcpConfigPath, 'utf-8');
      existingConfig = JSON.parse(existingContent);
      
      // Validate structure
      if (!existingConfig.mcpServers) {
        existingConfig.mcpServers = {};
      }
      
      // Check if we need to add any standard servers
      const missingServers = [];
      for (const [serverName, serverConfig] of Object.entries(standardMcpServers)) {
        if (!existingConfig.mcpServers[serverName]) {
          missingServers.push(serverName);
        }
      }
      
      if (missingServers.length > 0) {
        shouldMerge = true;
        console.log(`🔧 Will add missing standard MCP servers: ${missingServers.join(', ')}`);
        
        // Use unified backup function for existing MCP config
        await createUnifiedBackup(projectPath, {
          mcpConfig: true,
          mcpConfigPath: mcpConfigPath,
          malformedMcp: false
        });
      } else {
        console.log('✅ All standard MCP servers already configured, no changes needed');
        return;
      }
      
    } catch (parseError) {
      console.log(`⚠️  Existing .mcp.json appears to be malformed: ${parseError.message}`);
      console.log('🔧 Will create backup and generate new configuration');
      
      // Use unified backup function for malformed MCP config
      await createUnifiedBackup(projectPath, {
        mcpConfig: true,
        mcpConfigPath: mcpConfigPath,
        malformedMcp: true
      });
      
      // Reset to create new config
      existingConfig = null;
      shouldMerge = false;
    }
  }
  
  let finalConfig;
  
  if (shouldMerge && existingConfig) {
    // Merge configurations - preserve existing servers, add missing standard ones
    finalConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        ...standardMcpServers
      }
    };
    
    console.log('🔀 Merging configurations:');
    const existingServerNames = Object.keys(existingConfig.mcpServers);
    const addedServerNames = Object.keys(standardMcpServers).filter(
      name => !existingConfig.mcpServers[name]
    );
    
    if (existingServerNames.length > 0) {
      console.log(`   • Preserved existing servers: ${existingServerNames.join(', ')}`);
    }
    if (addedServerNames.length > 0) {
      console.log(`   • Added standard servers: ${addedServerNames.join(', ')}`);
    }
    
  } else {
    // Create new configuration
    finalConfig = {
      mcpServers: standardMcpServers
    };
    console.log('🆕 Creating new .mcp.json configuration');
  }
  
  // Write the final configuration
  try {
    await fs.writeFile(mcpConfigPath, JSON.stringify(finalConfig, null, 2), 'utf-8');
    
    if (shouldMerge) {
      console.log('✅ Successfully merged .mcp.json configuration');
    } else {
      console.log('✅ Created .mcp.json configuration with standard MCP servers');
    }
    
    // Log the configured servers
    const serverNames = Object.keys(finalConfig.mcpServers);
    console.log(`🔧 Configured MCP servers: ${serverNames.join(', ')}`);
    
  } catch (writeError) {
    console.log(`❌ Failed to write .mcp.json: ${writeError.message}`);
    throw writeError;
  }
};

// ========================================
// CONTENT GENERATION FUNCTIONS
// ========================================

/**
 * Generate agent template content
 * @param {string} agentType - Type of agent
 * @param {string} projectName - Project name
 * @returns {string} Agent template content
 */
const generateAgentTemplate = (agentType, projectName) => {
  const baseTemplate = `---
name: ${projectName}-${agentType}
description: ${getAgentDescription(agentType)} specifically tailored for the ${projectName} project.

Examples:
- <example>
  Context: User needs ${agentType}-specific assistance for the ${projectName} project.
  user: "${getUsageExample(agentType)}"
  assistant: "I'll handle this ${agentType} task using project-specific patterns and tech stack awareness"
  <commentary>
  This agent leverages ${projectName}-analyzer findings for informed decision-making.
  </commentary>
  </example>
tools: Glob, Grep, LS, Edit, MultiEdit, Write, NotebookRead, NotebookEdit, TodoWrite, WebSearch, mcp__search-repo-docs__resolve-library-id, mcp__search-repo-docs__get-library-docs, mcp__ask-repo-agent__read_wiki_structure, mcp__ask-repo-agent__read_wiki_contents, mcp__ask-repo-agent__ask_question
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
 * Create agent template files from existing agents
 * @param {string} agentsDir - Path to agents directory
 * @param {Object} variables - Template variables
 */
const createAgentTemplates = async (agentsDir, variables) => {
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
    const agentPath = path.join(agentsDir, `${variables.PROJECT_NAME}-${agentType}.md`);
    
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(agentPath, templateContent, 'utf-8');
  }
};

/**
 * Create hook examples from templates
 * @param {string} hooksDir - Path to hooks directory
 * @param {Object} variables - Template variables
 */
const createHookExamples = async (hooksDir, variables = {}) => {
  const examplesDir = path.join(hooksDir, 'examples');
  await fs.mkdir(examplesDir, { recursive: true });
  
  // Simple hook examples (inline templates)
  const hookExamples = {
    'README.md': `# Hook Examples

These are example hooks for the ${variables.PROJECT_NAME} project.

## TDD Hook
- \`tdd-hook.sh\`: Enforces test-driven development
- \`tdd-validator.py\`: Validates TDD compliance

## Quality Hooks  
- \`pre-commit-quality.sh\`: Runs quality checks before commits

## Configuration
- \`settings.json\`: Hook configuration settings
`,

    'tdd-hook.sh': `#!/bin/bash
# TDD enforcement hook for ${variables.PROJECT_NAME}

echo "🧪 TDD Guard: Checking test-driven development compliance..."

# Check if tests exist and pass
if [ -f "package.json" ]; then
    npm test
elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then
    python -m pytest
elif [ -f "go.mod" ]; then
    go test ./...
elif [ -f "Cargo.toml" ]; then
    cargo test
else
    echo "⚠️  No test framework detected"
    exit 1
fi

echo "✅ TDD compliance verified"
`,

    'settings.json': `{
  "project": "${variables.PROJECT_NAME}",
  "tdd": {
    "enabled": true,
    "testRequired": true
  },
  "quality": {
    "enabled": true,
    "autofix": true
  }
}`
  };
  
  // Write hook examples
  for (const [filename, content] of Object.entries(hookExamples)) {
    const filePath = path.join(examplesDir, filename);
    await fs.writeFile(filePath, content, 'utf-8');
    
    // Make shell scripts executable
    if (filename.endsWith('.sh')) {
      await fs.chmod(filePath, 0o755);
    }
  }
  
  console.log('✅ Hook examples created from templates');
};

/**
 * Copy statusline files from templates
 * @param {string} claudeDir - .claude directory path
 */
const copyStatuslineFiles = async (claudeDir) => {
  const templateDir = path.join(__dirname, '..', 'templates', '.claude');
  const statuslineFiles = ['genie-statusline.js', 'genie-statusline.ps1', 'genie-statusline.sh'];
  
  for (const file of statuslineFiles) {
    const srcPath = path.join(templateDir, file);
    const destPath = path.join(claudeDir, file);
    
    try {
      if (await fileExists(srcPath)) {
        await fs.copyFile(srcPath, destPath);
        // Make shell scripts executable
        if (file.endsWith('.sh') || file.endsWith('.js')) {
          await fs.chmod(destPath, 0o755);
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not copy ${file}: ${error.message}`);
    }
  }
};

/**
 * Create minimal hook file for current platform
 * @param {string} claudeDir - .claude directory path
 */
const createMinimalHooks = async (claudeDir) => {
  console.log('🪝 Creating minimal hook example...');
  
  const platform = process.platform;
  
  try {
    let hookFile, hookContent, hookCommand;
    
    if (platform === 'win32') {
      // Windows PowerShell version
      hookFile = 'minimal-hook.ps1';
      hookCommand = 'powershell -ExecutionPolicy Bypass -File .claude/minimal-hook.ps1';
      hookContent = `# 🧞 Minimal Hook Example for Windows PowerShell
# This demonstrates how hooks work with Genie

param(
    [string]\$Operation = "Write"
)

# Log to a file for demonstration (optional)  
# Add-Content -Path ".claude\\hook.log" -Value "[\$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Hook triggered for: \$Operation"

# Exit silently - this is just a minimal showcase
exit 0`;
    } else {
      // Unix/Linux/Mac version
      hookFile = 'minimal-hook.sh';
      hookCommand = './.claude/minimal-hook.sh';
      hookContent = `#!/bin/bash
# 🧞 Minimal Hook Example for Unix Systems (Linux/Mac)
# This demonstrates how hooks work with Genie

# Get the operation being performed (Write, Edit, MultiEdit)
OPERATION="\${1:-Write}"

# Log to a file for demonstration (optional)
# echo "[\$(date '+%Y-%m-%d %H:%M:%S')] Hook triggered for: \$OPERATION" >> .claude/hook.log

# Exit silently - this is just a minimal showcase
exit 0`;
    }
    
    const hookPath = path.join(claudeDir, hookFile);
    await fs.writeFile(hookPath, hookContent, 'utf-8');
    
    // Make executable on Unix systems
    if (platform !== 'win32') {
      await fs.chmod(hookPath, 0o755);
    }
    
    console.log(`   ✅ Created ${hookFile} for ${platform === 'win32' ? 'Windows' : 'Unix/Linux/Mac'}`);
    
    // Return the command for settings.json
    return hookCommand;
    
  } catch (error) {
    console.log(`   ⚠️  Could not create minimal hook: ${error.message}`);
    // Fallback to cross-platform JavaScript version
    const jsHook = `#!/usr/bin/env node
// 🧞 Minimal Hook Example - Cross-platform JavaScript
// This demonstrates how hooks work with Genie

const operation = process.argv[2] || 'Write';

// Exit silently - this is just a minimal showcase
process.exit(0);`;

    try {
      const jsPath = path.join(claudeDir, 'minimal-hook.js');
      await fs.writeFile(jsPath, jsHook, 'utf-8');
      await fs.chmod(jsPath, 0o755);
      console.log('   ✅ Created fallback minimal-hook.js');
      return 'node .claude/minimal-hook.js';
    } catch (fallbackError) {
      console.log(`   ⚠️  Could not create fallback hook: ${fallbackError.message}`);
      return null;
    }
  }
};

/**
 * Create settings.json with platform-aware configuration
 * @param {string} claudeDir - .claude directory path
 * @param {string} minimalHookCommand - Command for the minimal hook from createMinimalHooks
 */
const createSettingsJson = async (claudeDir, minimalHookCommand = null) => {
  console.log('⚙️  Creating settings.json...');
  
  const settingsPath = path.join(claudeDir, 'settings.json');
  
  // Only create if it doesn't exist
  if (await fileExists(settingsPath)) {
    console.log('   ℹ️  settings.json already exists, preserving it');
    return;
  }
  
  const settings = {
    hooks: {
      PreToolUse: [
        {
          matcher: "Write|Edit|MultiEdit",
          hooks: []
        }
      ]
    },
    enableHooks: true,
    statusLine: {
      type: "command",
      command: "node .claude/genie-statusline.js"
    }
  };
  
  // Add minimal hook if command was provided
  if (minimalHookCommand) {
    settings.hooks.PreToolUse[0].hooks.push({
      type: "command",
      command: minimalHookCommand,
      timeout: 5000
    });
  }
  
  // Check if TDD hook exists and add it
  const tddHookPath = path.join(claudeDir, 'tdd_hook.sh');
  if (await fileExists(tddHookPath)) {
    settings.hooks.PreToolUse[0].hooks.push({
      type: "command",
      command: "./.claude/tdd_hook.sh",
      timeout: 10000
    });
  }
  
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  console.log('   ✅ Created settings.json with platform-specific hooks');
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
 * Create fallback CLAUDE.md template with backup integration
 * @param {Object} variables - Template variables
 * @param {Object} backupAnalysis - Backup analysis results
 */
const createFallbackClaudeTemplate = async (variables, backupAnalysis = null) => {
  let backupSection = '';
  
  if (variables.HAS_BACKUP_DATA && backupAnalysis) {
    backupSection = `

## 🔄 Recovered Project Information

**Original Setup**: ${backupAnalysis.originalTimestamp || variables.TIMESTAMP}
**Configuration Enhanced**: Information recovered from backup and integrated

### 📦 Build & Development Commands
${backupAnalysis.buildCommands.length > 0 ? 
  backupAnalysis.buildCommands.map(cmd => `- \`${cmd}\``).join('\n') : 
  '- No build commands found in backup'}

### 🧪 Testing & Quality
${backupAnalysis.testingFrameworks.length > 0 ? 
  `**Testing Frameworks**: ${backupAnalysis.testingFrameworks.join(', ')}` : 
  '**Testing Frameworks**: Will be detected by analyzer'}
${backupAnalysis.codeStylePrefs.length > 0 ? 
  `\n**Code Style Tools**: ${backupAnalysis.codeStylePrefs.join(', ')}` : 
  '\n**Code Style Tools**: Will be detected by analyzer'}

### 🤖 Custom Agents Found
${backupAnalysis.customAgents.length > 0 ?
  backupAnalysis.customAgents.map(agent => `- ${agent}`).join('\n') :
  '- No custom agents found in backup'}

${Object.keys(backupAnalysis.preservedSections).length > 0 ? 
  `### 📚 Preserved Sections\n${Object.entries(backupAnalysis.preservedSections)
    .map(([section, content]) => `#### ${section}\n${content.substring(0, 300)}${content.length > 300 ? '...\n\n*[Section preserved from backup - full content available in agent memory]*' : ''}`)
    .join('\n\n')}` : 
  ''}`;
  }

  return `# ${variables.PROJECT_NAME} - Automagik Genie Configuration

## 🧞 Project-Specific Genie Instance

**Project**: ${variables.PROJECT_NAME}
**Initialized**: ${variables.TIMESTAMP}
**Path**: ${variables.PROJECT_PATH}
${backupAnalysis && backupAnalysis.originalTimestamp ? `**Previous Setup**: ${backupAnalysis.originalTimestamp}` : ''}
${backupAnalysis && backupAnalysis.projectDescription ? `\n**Project Description**: ${backupAnalysis.projectDescription}` : ''}${backupSection}

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

${variables.HAS_BACKUP_DATA ? 
  '💡 **Enhanced Configuration**: This setup includes recovered information from your backup files for a more personalized experience!' : 
  ''}

Your specialized development companion for **${variables.PROJECT_NAME}**! 🧞✨`;
};

// ========================================
// SMART MERGE FUNCTIONALITY
// ========================================

/**
 * Analyze existing .claude directory to identify user content vs genie content
 * @param {string} claudeDir - Path to .claude directory
 * @returns {Promise<Object>} Analysis of existing content
 */
const analyzeExistingClaude = async (claudeDir) => {
  const analysis = {
    userAgents: [],
    genieAgents: [],
    userHooks: [],
    genieHooks: [],
    userCommands: [],
    genieCommands: [],
    userFiles: [],
    hasUserContent: false,
    needsGenieUpdate: false
  };

  if (!await fileExists(claudeDir)) {
    return analysis;
  }

  try {
    // Analyze agents directory
    const agentsDir = path.join(claudeDir, 'agents');
    if (await fileExists(agentsDir)) {
      const agentFiles = await fs.readdir(agentsDir);
      
      for (const file of agentFiles) {
        if (file.endsWith('.md')) {
          const agentName = file.replace('.md', '');
          
          // Check if it's a genie agent (matches our naming pattern)
          if (isGenieAgent(agentName)) {
            analysis.genieAgents.push(file);
            analysis.needsGenieUpdate = await needsAgentUpdate(path.join(agentsDir, file));
          } else {
            analysis.userAgents.push(file);
            analysis.hasUserContent = true;
          }
        }
      }
    }

    // Analyze hooks directory
    const hooksDir = path.join(claudeDir, 'hooks');
    if (await fileExists(hooksDir)) {
      const hookEntries = await fs.readdir(hooksDir, { withFileTypes: true });
      
      for (const entry of hookEntries) {
        if (entry.isFile()) {
          if (isGenieHook(entry.name)) {
            analysis.genieHooks.push(entry.name);
          } else {
            analysis.userHooks.push(entry.name);
            analysis.hasUserContent = true;
          }
        } else if (entry.isDirectory() && entry.name === 'examples') {
          // Examples directory is genie-managed
          analysis.genieHooks.push('examples/');
        } else {
          // Other directories are user content
          analysis.userHooks.push(entry.name + '/');
          analysis.hasUserContent = true;
        }
      }
    }

    // Analyze commands directory
    const commandsDir = path.join(claudeDir, 'commands');
    if (await fileExists(commandsDir)) {
      const commandFiles = await fs.readdir(commandsDir);
      
      for (const file of commandFiles) {
        if (isGenieCommand(file)) {
          analysis.genieCommands.push(file);
        } else {
          analysis.userCommands.push(file);
          analysis.hasUserContent = true;
        }
      }
    }

    // Find other user files at root level
    const entries = await fs.readdir(claudeDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && !['agents', 'hooks', 'commands'].includes(entry.name)) {
        analysis.userFiles.push(entry.name);
        analysis.hasUserContent = true;
      }
    }

  } catch (error) {
    console.log(`⚠️  Error analyzing existing .claude directory: ${error.message}`);
  }

  return analysis;
};

/**
 * Check if agent name matches genie naming pattern
 * @param {string} agentName - Agent name without .md extension
 * @returns {boolean} True if it's a genie agent
 */
const isGenieAgent = (agentName) => {
  // Genie agents follow pattern: project-name-role
  const genieRoles = [
    'analyzer', 'dev-planner', 'dev-designer', 'dev-coder', 'dev-fixer',
    'agent-creator', 'agent-enhancer', 'claudemd', 'clone',
    'testing-maker', 'testing-fixer', 'quality-ruff', 'quality-mypy'
  ];
  
  return genieRoles.some(role => agentName.endsWith('-' + role));
};

/**
 * Check if hook is genie-managed
 * @param {string} hookName - Hook filename
 * @returns {boolean} True if it's a genie hook
 */
const isGenieHook = (hookName) => {
  const genieHooks = [
    'examples',  // Directory
    'tdd-hook.sh',
    'tdd-validator.py',
    'pre-commit-quality.sh',
    'settings.json',
    'README.md'
  ];
  
  return genieHooks.includes(hookName);
};

/**
 * Check if command is genie-managed
 * @param {string} commandName - Command filename
 * @returns {boolean} True if it's a genie command
 */
const isGenieCommand = (commandName) => {
  const genieCommands = [
    'wish.md'
  ];
  
  return genieCommands.includes(commandName);
};

/**
 * Check if agent needs updating (simplified version check)
 * @param {string} agentPath - Path to agent file
 * @returns {Promise<boolean>} True if needs update
 */
const needsAgentUpdate = async (agentPath) => {
  try {
    const content = await fs.readFile(agentPath, 'utf-8');
    
    // Check for outdated patterns or missing features
    // This is a simplified check - in production you'd want version headers
    const hasModernFeatures = content.includes('mcp__search-repo-docs__') && 
                             content.includes('TodoWrite') &&
                             content.includes('Genie Hive');
    
    return !hasModernFeatures;
  } catch (error) {
    return true; // If we can't read it, assume it needs update
  }
};

/**
 * Smart merge existing .claude content with new genie content
 * @param {string} projectPath - Project path  
 * @param {Object} analysis - Analysis of existing content
 * @param {Object} variables - Template variables
 */
const smartMergeClaude = async (projectPath, analysis, variables) => {
  const claudeDir = path.join(projectPath, '.claude');
  
  console.log('🔄 Smart merging .claude directory...');
  
  // Ensure base directories exist
  const agentsDir = path.join(claudeDir, 'agents');
  const hooksDir = path.join(claudeDir, 'hooks');  
  const commandsDir = path.join(claudeDir, 'commands');
  
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(hooksDir, { recursive: true });
  await fs.mkdir(commandsDir, { recursive: true });
  
  // 1. Handle agents - preserve user agents, update/create genie agents
  await mergeAgents(agentsDir, analysis, variables);
  
  // 2. Handle hooks - preserve user hooks, update genie hooks
  await mergeHooks(hooksDir, analysis, variables);
  
  // 3. Handle commands - preserve user commands, update genie commands  
  await mergeCommands(commandsDir, analysis, variables);
  
  // 4. Copy statusline files
  console.log('🧞 Updating statusline files...');
  await copyStatuslineFiles(claudeDir);
  
  // 5. Create minimal hooks if they don't exist
  const minimalHookCommand = await createMinimalHooks(claudeDir);
  
  // 6. Create settings.json if it doesn't exist
  await createSettingsJson(claudeDir, minimalHookCommand);
  
  console.log('✅ Smart merge completed');
};

/**
 * Merge agents directory
 * @param {string} agentsDir - Agents directory path
 * @param {Object} analysis - Content analysis
 * @param {Object} variables - Template variables
 */
const mergeAgents = async (agentsDir, analysis, variables) => {
  console.log('🤖 Merging agents...');
  
  // User agents are preserved automatically (no action needed)
  if (analysis.userAgents && analysis.userAgents.length > 0) {
    console.log(`   ✅ Preserved ${analysis.userAgents.length} user agents: ${analysis.userAgents.join(', ')}`);
  }
  
  // Create/update genie agents
  const genieAgentTypes = [
    'analyzer', 'dev-planner', 'dev-designer', 'dev-coder', 'dev-fixer',
    'agent-creator', 'agent-enhancer', 'claudemd', 'clone'
  ];
  
  const newAgents = [];
  const updatedAgents = [];
  
  for (const agentType of genieAgentTypes) {
    const agentFileName = `${variables.PROJECT_NAME}-${agentType}.md`;
    const agentPath = path.join(agentsDir, agentFileName);
    
    const exists = await fileExists(agentPath);
    
    if (!exists) {
      // Create new agent
      const agentContent = generateAgentTemplate(agentType, variables.PROJECT_NAME);
      await fs.writeFile(agentPath, agentContent, 'utf-8');
      newAgents.push(agentFileName);
    } else {
      // Check if needs update
      if (analysis.needsGenieUpdate || (analysis.genieAgents && analysis.genieAgents.includes(agentFileName))) {
        const agentContent = generateAgentTemplate(agentType, variables.PROJECT_NAME);
        await fs.writeFile(agentPath, agentContent, 'utf-8');
        updatedAgents.push(agentFileName);
      }
    }
  }
  
  if (newAgents.length > 0) {
    console.log(`   ➕ Created ${newAgents.length} new genie agents`);
  }
  if (updatedAgents.length > 0) {
    console.log(`   🔄 Updated ${updatedAgents.length} existing genie agents`);
  }
};

/**
 * Merge hooks directory
 * @param {string} hooksDir - Hooks directory path
 * @param {Object} analysis - Content analysis
 * @param {Object} variables - Template variables
 */
const mergeHooks = async (hooksDir, analysis, variables) => {
  console.log('🔧 Merging hooks...');
  
  // User hooks are preserved automatically
  if (analysis.userHooks && analysis.userHooks.length > 0) {
    console.log(`   ✅ Preserved ${analysis.userHooks.length} user hooks: ${analysis.userHooks.join(', ')}`);
  }
  
  // Create/update genie hook examples
  const examplesDir = path.join(hooksDir, 'examples');
  
  if (!await fileExists(examplesDir) || !(analysis.genieHooks && analysis.genieHooks.includes('examples/'))) {
    await createHookExamples(hooksDir, variables);
    console.log('   ➕ Created hook examples');
  } else {
    console.log('   ✅ Hook examples already exist');
  }
};

/**
 * Merge commands directory
 * @param {string} commandsDir - Commands directory path
 * @param {Object} analysis - Content analysis  
 * @param {Object} variables - Template variables
 */
const mergeCommands = async (commandsDir, analysis, variables) => {
  console.log('⚡ Merging commands...');
  
  // User commands are preserved automatically
  if (analysis.userCommands && analysis.userCommands.length > 0) {
    console.log(`   ✅ Preserved ${analysis.userCommands.length} user commands: ${analysis.userCommands.join(', ')}`);
  }
  
  // Create/update wish command
  const wishPath = path.join(commandsDir, 'wish.md');
  
  if (!await fileExists(wishPath) || (analysis.genieCommands && analysis.genieCommands.includes('wish.md'))) {
    await createWishCommand(commandsDir);
    console.log('   ➕ Created/updated wish command');
  } else {
    console.log('   ✅ Wish command already exists');
  }
};

/**
 * Create smart backup with preservation of user content
 * @param {string} projectPath - Project path
 * @param {Object} analysis - Analysis of existing content
 * @returns {Promise<string|null>} Backup directory path
 */
const createSmartBackup = async (projectPath, analysis) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(projectPath, `.claude.backup-${timestamp}`);
  
  try {
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`📁 Creating smart backup: ${path.basename(backupDir)}`);
    
    const claudeDir = path.join(projectPath, '.claude');
    
    // Only backup if there's user content or if requested
    if (analysis.hasUserContent || analysis.genieAgents.length > 0) {
      const backupClaudeDir = path.join(backupDir, '.claude');
      
      // Copy entire .claude directory for safety
      await fs.cp(claudeDir, backupClaudeDir, { recursive: true });
      console.log('✅ Backed up existing .claude/ directory');
      
      // Log what's being preserved
      if (analysis.userAgents.length > 0) {
        console.log(`   📁 Preserving ${analysis.userAgents.length} custom agents`);
      }
      if (analysis.userHooks.length > 0) {
        console.log(`   🔧 Preserving ${analysis.userHooks.length} custom hooks`);
      }
      if (analysis.userCommands.length > 0) {
        console.log(`   ⚡ Preserving ${analysis.userCommands.length} custom commands`);
      }
    }
    
    // Backup CLAUDE.md if exists
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    if (await fileExists(claudeMdPath)) {
      await fs.copyFile(claudeMdPath, path.join(backupDir, 'CLAUDE.md'));
      console.log('✅ Backed up CLAUDE.md');
    }
    
    // Add helpful instructions for users to check their backup
    console.log('');
    console.log('💡 Pro Tip: Check your backup for existing patterns and references!');
    console.log(`   📂 View backup: ${path.basename(backupDir)}`);
    console.log('   🔍 Review your existing agents, hooks, and configurations');
    console.log('   📋 Reference previous work to enhance new development patterns');
    console.log('');
    
    return backupDir;
    
  } catch (error) {
    console.log(`⚠️  Smart backup failed: ${error.message}`);
    return null;
  }
};

// ========================================
// LEGACY INITIALIZATION FUNCTIONS
// ========================================

/**
 * Check if .claude directory already exists and handle backup (legacy destructive mode)
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
  console.log('   • Back up existing files to unified .claude.backup/ directory');
  console.log('   • Create new project-specific Genie configuration');
  console.log('   • Preserve any custom agents or configurations');
  console.log('');
  
  // Use unified backup function
  const backupResult = await createUnifiedBackup(projectPath, {
    claudeDir: claudeDirExists,
    claudeMd: claudeMdExists
  });
  
  if (!backupResult) {
    console.log('Continuing with installation despite backup failure...');
    console.log('');
  }
  
  return true;
};

/**
 * Handle existing installation with smart merge approach
 * @param {string} projectPath - Project path
 * @returns {Promise<Object>} Merge analysis and backup info
 */
const handleExistingInstallationSmart = async (projectPath) => {
  const claudeDir = path.join(projectPath, '.claude');
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  
  const claudeDirExists = await fileExists(claudeDir);
  const claudeMdExists = await fileExists(claudeMdPath);
  
  if (!claudeDirExists && !claudeMdExists) {
    return { isCleanInstall: true, analysis: null, backupPath: null };
  }
  
  console.log('⚠️  Existing Automagik Genie installation detected');
  console.log('');
  
  // Analyze existing content
  const analysis = claudeDirExists ? await analyzeExistingClaude(claudeDir) : { hasUserContent: false };
  
  if (analysis.hasUserContent) {
    console.log('🔍 Found existing user content:');
    if (analysis.userAgents.length > 0) {
      console.log(`   🤖 Custom agents: ${analysis.userAgents.join(', ')}`);
    }
    if (analysis.userHooks.length > 0) {
      console.log(`   🔧 Custom hooks: ${analysis.userHooks.join(', ')}`);
    }
    if (analysis.userCommands.length > 0) {
      console.log(`   ⚡ Custom commands: ${analysis.userCommands.join(', ')}`);
    }
    if (analysis.userFiles.length > 0) {
      console.log(`   📄 Other files: ${analysis.userFiles.join(', ')}`);
    }
  }
  
  console.log('');
  console.log('🔄 Smart merge will:');
  console.log('   • ✅ PRESERVE all your custom agents, hooks, and commands');  
  console.log('   • 🔄 UPDATE genie-managed files to latest version');
  console.log('   • ➕ ADD any missing genie functionality');
  console.log('   • 📁 CREATE safety backup of everything');
  console.log('   • 🚀 ENHANCE your setup without losing work');
  console.log('');
  
  // Create smart backup
  const backupPath = await createSmartBackup(projectPath, analysis);
  
  return { 
    isCleanInstall: false, 
    analysis, 
    backupPath,
    hasUserContent: analysis.hasUserContent
  };
};

// ========================================
// UNIFIED INITIALIZATION FUNCTIONS
// ========================================

/**
 * Legacy initialization function (destructive replacement)
 * @param {string} projectPath - Path to initialize Genie in
 * @param {Object} options - Initialization options
 */
const legacyInit = async (projectPath, options = {}) => {
  console.log(`🔍 Legacy initialization starting in: ${projectPath}`);
  
  // Handle existing installations with destructive backup
  const shouldContinue = await handleExistingInstallation(projectPath);
  if (!shouldContinue) {
    return;
  }
  
  console.log('🏗️  Creating project structure...');
  
  // Analyze backup CLAUDE.md files first
  const backupAnalysis = await analyzeBackupClaude(projectPath);
  
  // Generate project variables with backup integration
  const variables = await generateProjectVariables(projectPath, backupAnalysis);
  console.log(`📝 Project name: ${variables.PROJECT_NAME}`);
  
  if (variables.HAS_BACKUP_DATA) {
    console.log('🔄 Integrating recovered project information into new configuration');
  }
  
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
  await createAgentTemplates(agentsDir, variables);
  
  console.log('🔧 Installing hook examples...');
  
  // Create hook examples with variables
  await createHookExamples(hooksDir, variables);
  
  console.log('📚 Creating wish command...');
  
  // Create wish command
  await createWishCommand(commandsDir);
  
  console.log('🧞 Copying statusline files...');
  
  // Copy statusline files
  await copyStatuslineFiles(claudeDir);
  
  console.log('🪝 Creating minimal hooks...');
  
  // Create minimal hooks for current platform
  const minimalHookCommand = await createMinimalHooks(claudeDir);
  
  console.log('⚙️  Creating settings configuration...');
  
  // Create settings.json with platform-aware configuration
  await createSettingsJson(claudeDir, minimalHookCommand);
  
  console.log('🔧 Creating MCP configuration...');
  
  // Create .mcp.json configuration
  await createMcpConfig(projectPath);
  
  console.log('📄 Generating CLAUDE.md...');
  
  // Create CLAUDE.md from template
  const templatePath = path.join(__dirname, '..', 'templates', 'CLAUDE.md.template');
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  
  // Check if template exists (for development, we'll create a fallback)
  if (await fileExists(templatePath)) {
    await processTemplateFile(templatePath, claudeMdPath, variables);
  } else {
    // Fallback template creation for development with backup integration
    const fallbackTemplate = await createFallbackClaudeTemplate(variables, backupAnalysis);
    await fs.writeFile(claudeMdPath, fallbackTemplate, 'utf-8');
  }
  
  console.log('✅ Legacy initialization complete!');
  
  if (variables.HAS_BACKUP_DATA) {
    console.log('');
    console.log('📋 Backup Integration Summary:');
    if (backupAnalysis.buildCommands.length > 0) {
      console.log(`   • Recovered ${backupAnalysis.buildCommands.length} build commands`);
    }
    if (backupAnalysis.testingFrameworks.length > 0) {
      console.log(`   • Preserved testing frameworks: ${backupAnalysis.testingFrameworks.join(', ')}`);
    }
    if (backupAnalysis.codeStylePrefs.length > 0) {
      console.log(`   • Maintained code style preferences: ${backupAnalysis.codeStylePrefs.join(', ')}`);
    }
    if (backupAnalysis.customAgents.length > 0) {
      console.log(`   • Found ${backupAnalysis.customAgents.length} custom agents in backup`);
    }
    if (Object.keys(backupAnalysis.preservedSections).length > 0) {
      console.log(`   • Preserved ${Object.keys(backupAnalysis.preservedSections).length} custom sections`);
    }
    console.log('');
    console.log('💡 Your project-specific configuration has been intelligently enhanced with backup data!');
  }
};

/**
 * Smart initialization with merge capabilities
 * @param {string} projectPath - Path to initialize Genie in
 * @param {Object} options - Initialization options
 */
const smartInit = async (projectPath, options = {}) => {
  console.log(`🔍 Smart initialization starting in: ${projectPath}`);
  
  // Handle existing installations with smart analysis
  const { isCleanInstall, analysis, backupPath, hasUserContent } = 
    await handleExistingInstallationSmart(projectPath);
  
  if (isCleanInstall) {
    console.log('✨ Clean installation - no existing content detected');
  } else {
    console.log(`🔧 Smart merge mode - ${hasUserContent ? 'preserving user content' : 'updating genie content'}`);
  }
  
  console.log('🏗️  Processing project structure...');
  
  // Analyze backup CLAUDE.md files first (reuse from original)
  const backupAnalysis = await analyzeBackupClaude(projectPath);
  
  // Generate project variables with backup integration
  const variables = await generateProjectVariables(projectPath, backupAnalysis);
  console.log(`📝 Project name: ${variables.PROJECT_NAME}`);
  
  if (variables.HAS_BACKUP_DATA) {
    console.log('🔄 Integrating recovered project information into configuration');
  }
  
  if (isCleanInstall) {
    // Clean installation - create everything from scratch
    const claudeDir = path.join(projectPath, '.claude');
    const agentsDir = path.join(claudeDir, 'agents');
    const hooksDir = path.join(claudeDir, 'hooks');
    const commandsDir = path.join(claudeDir, 'commands');
    
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.mkdir(hooksDir, { recursive: true });
    await fs.mkdir(commandsDir, { recursive: true });
    
    console.log('🤖 Creating project-specific agents...');
    await mergeAgents(agentsDir, { userAgents: [], genieAgents: [] }, variables);
    
    console.log('🔧 Installing hook examples...');
    await createHookExamples(hooksDir, variables);
    
    console.log('📚 Creating wish command...');
    await createWishCommand(commandsDir);
    
    console.log('🧞 Copying statusline files...');
    await copyStatuslineFiles(claudeDir);
    
    console.log('🪝 Creating minimal hooks...');
    const minimalHookCommand = await createMinimalHooks(claudeDir);
    
    console.log('⚙️  Creating settings configuration...');
    await createSettingsJson(claudeDir, minimalHookCommand);
    
  } else {
    // Smart merge - preserve existing content, update genie content
    await smartMergeClaude(projectPath, analysis, variables);
  }
  
  console.log('🔧 Creating/updating MCP configuration...');
  await createMcpConfig(projectPath);
  
  console.log('📄 Generating/updating CLAUDE.md...');
  
  // Create CLAUDE.md from template or fallback
  const templatePath = path.join(__dirname, '..', 'templates', 'CLAUDE.md.template');
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  
  // Always create/update CLAUDE.md - this is safe to overwrite
  const shouldUpdateClaude = !await fileExists(claudeMdPath) || isCleanInstall;
  
  if (shouldUpdateClaude) {
    if (await fileExists(templatePath)) {
      await processTemplateFile(templatePath, claudeMdPath, variables);
    } else {
      // Fallback template creation
      const fallbackTemplate = await createFallbackClaudeTemplate(variables, backupAnalysis);
      await fs.writeFile(claudeMdPath, fallbackTemplate, 'utf-8');
    }
    console.log('✅ CLAUDE.md created/updated');
  } else {
    console.log('ℹ️  CLAUDE.md preserved (use --force-claude-update to overwrite)');
  }
  
  console.log('✅ Smart initialization complete!');
  
  // Summary
  console.log('');
  console.log('📋 Smart Initialization Summary:');
  
  if (!isCleanInstall && hasUserContent) {
    console.log('   🛡️  USER CONTENT PRESERVED:');
    if (analysis.userAgents.length > 0) {
      console.log(`      🤖 Custom agents: ${analysis.userAgents.join(', ')}`);
    }
    if (analysis.userHooks.length > 0) {
      console.log(`      🔧 Custom hooks: ${analysis.userHooks.join(', ')}`);
    }
    if (analysis.userCommands.length > 0) {
      console.log(`      ⚡ Custom commands: ${analysis.userCommands.join(', ')}`);
    }
    if (analysis.userFiles.length > 0) {
      console.log(`      📄 Other files: ${analysis.userFiles.join(', ')}`);
    }
  }
  
  console.log('   🔄 GENIE FUNCTIONALITY:');
  console.log(`      🤖 Project agents: ${variables.PROJECT_NAME}-analyzer, ${variables.PROJECT_NAME}-dev-coder, etc.`);
  console.log('      🔧 Hook examples: TDD validation, quality checks');
  console.log('      ⚡ Universal /wish command');
  console.log('      🔗 MCP server integration');
  
  if (backupPath) {
    console.log(`   📁 Safety backup: ${path.basename(backupPath)}`);
    console.log('      💡 Review backup for existing patterns and references');
  }
  
  if (variables.HAS_BACKUP_DATA) {
    console.log('   🔄 Enhanced with backup data integration');
  }
  
  console.log('');
  console.log('🎉 Your Automagik Genie is ready! Try: /wish "analyze this codebase"');
  console.log('');
  console.log('💡 Key improvements:');
  console.log('   ✅ Zero data loss - all your custom work preserved');
  console.log('   🔄 Smart updates - only genie files get updated');
  console.log('   📁 Safety backups - full restore capability');
  console.log('   🧠 Intelligent merging - no conflicts, no overwrites');
};

/**
 * UNIFIED INITIALIZATION FUNCTION
 * Main initialization function with mode selection
 * @param {string} projectPath - Path to initialize Genie in
 * @param {Object} options - Initialization options
 * @param {string} options.mode - Initialization mode: 'smart' (default) or 'legacy'
 * @param {boolean} options.force - Force overwrite existing files
 * @returns {Promise<void>}
 */
const init = async (projectPath, options = {}) => {
  const { mode = 'smart', force = false } = options;
  
  if (mode === 'legacy') {
    return await legacyInit(projectPath, options);
  } else {
    return await smartInit(projectPath, options);
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Main unified function
  init,
  
  // Mode-specific functions (for backward compatibility)
  legacyInit,
  smartInit,
  
  // Backup analysis (from original init.js)
  analyzeBackupClaude,
  parseBackupClaude,
  createFallbackClaudeTemplate,
  
  // Installation handling (both modes)
  handleExistingInstallation,           // Legacy mode
  handleExistingInstallationSmart,      // Smart mode
  
  // Backup functions (unified)
  createUnifiedBackup,
  createSmartBackup,
  
  // Content generation functions (shared)
  createAgentTemplates,
  createHookExamples,
  createWishCommand,
  createMcpConfig,
  
  // Smart merge analysis functions
  analyzeExistingClaude,
  smartMergeClaude,
  isGenieAgent,
  isGenieHook,
  isGenieCommand,
  mergeAgents,
  mergeHooks,
  mergeCommands,
  
  // Template generation functions
  generateAgentTemplate,
  
  // File operations functions
  copyStatuslineFiles,
  createMinimalHooks,
  createSettingsJson
};
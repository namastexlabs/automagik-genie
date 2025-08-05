const fs = require('fs').promises;
const path = require('path');
const { 
  generateProjectVariables, 
  copyTemplateDirectory,
  processTemplateFile,
  fileExists 
} = require('./template-processor.js');

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
    
    // Extract custom agents (improved regex)
    if (trimmedLine.includes('-genie-') || trimmedLine.includes('agent')) {
      const agentMatch = trimmedLine.match(/(\w+(-\w+)*-genie-[\w-]+)/g);
      if (agentMatch) {
        agentMatch.forEach(agent => analysis.customAgents.push(agent));
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
 * Extract framework name from line
 * @param {string} line - Line containing framework reference (should be lowercase)
 * @returns {string} Framework name
 */
const extractFrameworkName = (line) => {
  const frameworks = ['cargo test', 'go test', 'jest', 'pytest', 'junit', 'mocha', 'vitest', 'cypress'];
  for (const framework of frameworks) {
    if (line.includes(framework)) {
      return framework;
    }
  }
  return line.substring(0, 50) + '...';
};

/**
 * Extract style preference from line
 * @param {string} line - Line containing style tool reference (should be lowercase)
 * @returns {string} Style preference
 */
const extractStylePreference = (line) => {
  const tools = ['eslint', 'prettier', 'ruff', 'black', 'rustfmt', 'gofmt', 'checkstyle'];
  for (const tool of tools) {
    if (line.includes(tool)) {
      return tool;
    }
  }
  return line.substring(0, 50) + '...';
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
    const agentPath = path.join(agentsTemplateDir, `${variables.PROJECT_NAME}-genie-${agentType}.md`);
    
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
name: ${projectName}-genie-${agentType}
description: ${getAgentDescription(agentType)} specifically tailored for the ${projectName} project.\\n\\nExamples:\\n- <example>\\n  Context: User needs ${agentType}-specific assistance for the ${projectName} project.\\n  user: "${getUsageExample(agentType)}"\\n  assistant: "I'll handle this ${agentType} task using project-specific patterns and tech stack awareness"\\n  <commentary>\\n  This agent leverages ${projectName}-genie-analyzer findings for informed decision-making.\\n  </commentary>\\n  </example>
tools: Glob, Grep, LS, Edit, MultiEdit, Write, NotebookRead, NotebookEdit, TodoWrite, WebSearch, mcp__zen__chat, mcp__zen__thinkdeep, mcp__zen__planner, mcp__zen__consensus, mcp__zen__codereview, mcp__zen__precommit, mcp__zen__debug, mcp__zen__secaudit, mcp__zen__docgen, mcp__zen__analyze, mcp__zen__refactor, mcp__zen__tracer, mcp__zen__testgen, mcp__zen__challenge, mcp__zen__listmodels, mcp__zen__version, mcp__search-repo-docs__resolve-library-id, mcp__search-repo-docs__get-library-docs, mcp__ask-repo-agent__read_wiki_structure, mcp__ask-repo-agent__read_wiki_contents, mcp__ask-repo-agent__ask_question
model: sonnet
color: ${getAgentColor(agentType)}
---

You are a ${agentType} agent for the **${projectName}** project. ${getAgentDescription(agentType)} with tech-stack-aware assistance tailored specifically for this project.

Your characteristics:
- Project-specific expertise with ${projectName} codebase understanding
- Tech stack awareness through analyzer integration
- Adaptive recommendations based on detected patterns
- Seamless coordination with other ${projectName}-genie agents
- Professional and systematic approach to ${agentType} tasks

Your operational guidelines:
- Leverage insights from the ${projectName}-genie-analyzer agent for context
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

## 🔧 Integration with ${projectName}-genie-analyzer

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
  return `- Coordinates with **${projectName}-genie-analyzer** for tech stack context
- Integrates with other **${projectName}-genie** agents for complex workflows
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
 * Create hook examples from templates
 * @param {string} hooksDir - Path to hooks directory
 * @param {Object} variables - Template variables
 */
const createHookExamples = async (hooksDir, variables = {}) => {
  const examplesDir = path.join(hooksDir, 'examples');
  await fs.mkdir(examplesDir, { recursive: true });
  
  // Template directory path
  const hookTemplatesDir = path.join(__dirname, '..', 'templates', '.claude', 'hooks', 'examples');
  
  // Default variables if not provided
  if (!variables.PROJECT_NAME) {
    variables = await generateProjectVariables(hooksDir);
  }
  
  // List of hook template files to process
  const hookTemplates = [
    'tdd-hook.sh.template',
    'tdd-validator.py.template', 
    'pre-commit-quality.sh.template',
    'settings.json.template',
    'README.md.template'
  ];
  
  // Process each template
  for (const templateFile of hookTemplates) {
    const templatePath = path.join(hookTemplatesDir, templateFile);
    const outputFile = templateFile.replace('.template', '');
    const outputPath = path.join(examplesDir, outputFile);
    
    try {
      // Check if template exists
      if (await fileExists(templatePath)) {
        await processTemplateFile(templatePath, outputPath, variables);
        
        // Make shell scripts executable
        if (outputFile.endsWith('.sh')) {
          await fs.chmod(outputPath, 0o755);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not process hook template ${templateFile}: ${error.message}`);
    }
  }
  
  console.log('✅ Hook examples created from templates');
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
        
        // Create backup using the same pattern as handleExistingInstallation
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(projectPath, `.claude.backup-${timestamp}`);
        const backupMcpPath = path.join(backupDir, '.mcp.json');
        
        try {
          await fs.mkdir(backupDir, { recursive: true });
          await fs.copyFile(mcpConfigPath, backupMcpPath);
          console.log(`📦 Backed up existing .mcp.json to ${path.basename(backupDir)}/.mcp.json`);
        } catch (backupError) {
          console.log(`⚠️  Could not create backup: ${backupError.message}`);
          console.log('💡 Manual backup recommended: cp .mcp.json .mcp.json.backup');
        }
      } else {
        console.log('✅ All standard MCP servers already configured, no changes needed');
        return;
      }
      
    } catch (parseError) {
      console.log(`⚠️  Existing .mcp.json appears to be malformed: ${parseError.message}`);
      console.log('🔧 Will create backup and generate new configuration');
      
      // Create backup for malformed file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(projectPath, `.claude.backup-${timestamp}`);
      const backupMcpPath = path.join(backupDir, '.mcp.json.malformed');
      
      try {
        await fs.mkdir(backupDir, { recursive: true });
        await fs.copyFile(mcpConfigPath, backupMcpPath);
        console.log(`📦 Backed up malformed .mcp.json to ${path.basename(backupDir)}/.mcp.json.malformed`);
      } catch (backupError) {
        console.log(`⚠️  Could not create backup: ${backupError.message}`);
      }
      
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

- **Analysis requests** → project-genie-analyzer agent
- **Planning needs** → project-genie-dev-planner agent  
- **Architecture design** → project-genie-dev-designer agent
- **Implementation tasks** → project-genie-dev-coder agent
- **Debugging issues** → project-genie-dev-fixer agent
- **Complex coordination** → project-genie-clone agent

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
  await createAgentTemplates(projectPath, variables);
  
  console.log('🔧 Installing hook examples...');
  
  // Create hook examples with variables
  await createHookExamples(hooksDir, variables);
  
  console.log('📚 Creating wish command...');
  
  // Create wish command
  await createWishCommand(commandsDir);
  
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
  
  console.log('✅ Initialization complete!');
  
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
- **${variables.PROJECT_NAME}-genie-analyzer**: Universal codebase analysis and tech stack detection

### Core Development
- **${variables.PROJECT_NAME}-genie-dev-planner**: Requirements analysis and technical specifications
- **${variables.PROJECT_NAME}-genie-dev-designer**: Architecture design and system patterns
- **${variables.PROJECT_NAME}-genie-dev-coder**: Code implementation with tech-stack awareness
- **${variables.PROJECT_NAME}-genie-dev-fixer**: Debugging and systematic issue resolution

### Agent Management
- **${variables.PROJECT_NAME}-genie-agent-creator**: Create new specialized agents
- **${variables.PROJECT_NAME}-genie-agent-enhancer**: Enhance and improve existing agents
- **${variables.PROJECT_NAME}-genie-clone**: Multi-task coordination with context preservation

### Documentation
- **${variables.PROJECT_NAME}-genie-claudemd**: CLAUDE.md documentation management

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

module.exports = {
  init,
  handleExistingInstallation,
  createAgentTemplates,
  createHookExamples,
  createWishCommand,
  createMcpConfig,
  analyzeBackupClaude,
  parseBackupClaude,
  createFallbackClaudeTemplate
};
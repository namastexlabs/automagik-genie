#!/usr/bin/env node
"use strict";
/**
 * Genie MCP Server - Production Implementation
 *
 * Provides Model Context Protocol access to Genie agent orchestration.
 * Tools integrate with CLI via subprocess execution (shell-out pattern).
 *
 * NOTE: This is a workaround implementation. See blocker report:
 * @.genie/reports/blocker-group-a-handler-integration-20251001.md
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastmcp_1 = require("fastmcp");
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 8080;
const TRANSPORT = process.env.MCP_TRANSPORT || 'stdio';
// Helper: List available agents from .genie/agents directory
function listAgents() {
    const baseDir = '.genie/agents';
    const agents = [];
    if (!fs_1.default.existsSync(baseDir)) {
        return agents;
    }
    const visit = (dirPath, relativePath) => {
        const entries = fs_1.default.readdirSync(dirPath, { withFileTypes: true });
        entries.forEach((entry) => {
            const entryPath = path_1.default.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                visit(entryPath, relativePath ? path_1.default.join(relativePath, entry.name) : entry.name);
                return;
            }
            if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'README.md') {
                return;
            }
            const rawId = relativePath ? path_1.default.join(relativePath, entry.name) : entry.name;
            const normalizedId = rawId.replace(/\.md$/i, '').split(path_1.default.sep).join('/');
            // Extract frontmatter to get name and description
            const content = fs_1.default.readFileSync(entryPath, 'utf8');
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            let name = normalizedId;
            let description;
            if (frontmatterMatch) {
                const frontmatter = frontmatterMatch[1];
                const nameMatch = frontmatter.match(/name:\s*(.+)/);
                const descMatch = frontmatter.match(/description:\s*(.+)/);
                if (nameMatch)
                    name = nameMatch[1].trim();
                if (descMatch)
                    description = descMatch[1].trim();
            }
            const folder = normalizedId.includes('/')
                ? normalizedId.split('/').slice(0, -1).join('/')
                : undefined;
            agents.push({ id: normalizedId, name, description, folder });
        });
    };
    visit(baseDir, null);
    return agents;
}
// Helper: List recent sessions
function listSessions() {
    const sessionsFile = '.genie/state/agents/sessions.json';
    if (!fs_1.default.existsSync(sessionsFile)) {
        return [];
    }
    try {
        const content = fs_1.default.readFileSync(sessionsFile, 'utf8');
        const store = JSON.parse(content);
        const sessions = Object.entries(store.agents || {}).map(([agent, entry]) => ({
            id: entry.sessionId || agent,
            agent: entry.agent || agent,
            status: entry.status || 'unknown',
            created: entry.created || 'unknown',
            lastUsed: entry.lastUsed || entry.created || 'unknown'
        }));
        // Sort by lastUsed descending
        return sessions.sort((a, b) => {
            if (a.lastUsed === 'unknown')
                return 1;
            if (b.lastUsed === 'unknown')
                return -1;
            return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        });
    }
    catch (error) {
        return [];
    }
}
// Initialize FastMCP server
const server = new fastmcp_1.FastMCP({
    name: 'genie',
    version: '1.0.0',
    instructions: `Genie is an agent orchestration system for managing AI agents that help with software development tasks.

**Core Capabilities:**
- Run specialized agents (plan, forge, implementor, qa, etc.) with custom prompts
- Resume ongoing agent conversations with follow-up questions
- List available agents and active sessions
- View agent transcripts and stop running agents

**Typical Workflow:**
1. Use 'list_agents' to discover available agents and their capabilities
2. Use 'run' to start an agent with a specific task
3. Use 'list_sessions' to see active/recent sessions
4. Use 'view' to inspect agent output
5. Use 'resume' to continue conversations with follow-up questions
6. Use 'stop' to terminate long-running agents

**Agent Types:**
- **Workflow Agents**: plan, wish, forge, review (structured development process)
- **Tactical Agents**: implementor, tests, qa, polish (feature delivery)
- **Strategic Agents**: twin, analyze, debug (deep analysis)
- **Utility Agents**: commit, codereview, refactor (code quality)

Use agents for planning features, implementing code, reviewing changes, debugging issues, and managing development workflows.`
});
// Tool: list_agents - Discover available agents
server.addTool({
    name: 'list_agents',
    description: 'List all available Genie agents with their capabilities and descriptions. Use this first to discover which agents can help with your task.',
    parameters: zod_1.z.object({}),
    execute: async () => {
        const agents = listAgents();
        if (agents.length === 0) {
            return 'No agents found in .genie/agents directory.';
        }
        let response = `Found ${agents.length} available agents:\n\n`;
        // Group by folder
        const grouped = {};
        agents.forEach(agent => {
            const key = agent.folder || 'core';
            if (!grouped[key])
                grouped[key] = [];
            grouped[key].push(agent);
        });
        Object.entries(grouped).forEach(([folder, folderAgents]) => {
            response += `**${folder}:**\n`;
            folderAgents.forEach(agent => {
                response += `  • ${agent.id}`;
                if (agent.name !== agent.id)
                    response += ` (${agent.name})`;
                if (agent.description)
                    response += ` - ${agent.description}`;
                response += '\n';
            });
            response += '\n';
        });
        response += '\nUse the "run" tool with an agent id and prompt to start an agent session.';
        return response;
    }
});
// Tool: list_sessions - View active and recent sessions
server.addTool({
    name: 'list_sessions',
    description: 'List active and recent Genie agent sessions. Shows session IDs, agents, status, and timing. Use this to find sessions to resume or view.',
    parameters: zod_1.z.object({}),
    execute: async () => {
        const sessions = listSessions();
        if (sessions.length === 0) {
            return 'No sessions found. Start a new session with the "run" tool.';
        }
        let response = `Found ${sessions.length} session(s):\n\n`;
        sessions.forEach((session, index) => {
            response += `${index + 1}. **${session.id}**\n`;
            response += `   Agent: ${session.agent}\n`;
            response += `   Status: ${session.status}\n`;
            response += `   Created: ${session.created}\n`;
            response += `   Last Used: ${session.lastUsed}\n\n`;
        });
        response += 'Use "view" to see session transcript or "resume" to continue a session.';
        return response;
    }
});
// Tool: run - Start a new agent session
server.addTool({
    name: 'run',
    description: 'Start a new Genie agent session. Choose an agent (use list_agents first) and provide a detailed prompt describing the task. The agent will analyze, plan, or implement based on its specialization.',
    parameters: zod_1.z.object({
        agent: zod_1.z.string().describe('Agent ID to run (e.g., "plan", "implementor", "debug"). Get available agents from list_agents tool.'),
        prompt: zod_1.z.string().describe('Detailed task description for the agent. Be specific about goals, context, and expected outcomes. Agents work best with clear, actionable prompts.')
    }),
    execute: async (args) => {
        const cliPath = path_1.default.resolve(__dirname, '../../genie');
        const escapedPrompt = args.prompt.replace(/"/g, '\\"');
        const command = `"${cliPath}" run ${args.agent} "${escapedPrompt}"`;
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: path_1.default.resolve(__dirname, '../..'),
                maxBuffer: 1024 * 1024 * 10, // 10MB
                timeout: 120000 // 2 minutes
            });
            const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');
            return `Started agent session:\nAgent: ${args.agent}\n\n${output}\n\nUse list_sessions to see the session ID, then use view/resume/stop as needed.`;
        }
        catch (error) {
            return `Failed to start agent session:\n${error.message}\n\nCommand: ${command}`;
        }
    }
});
// Tool: resume - Continue an existing session
server.addTool({
    name: 'resume',
    description: 'Resume an existing agent session with a follow-up prompt. Use this to continue conversations, provide additional context, or ask follow-up questions to an agent.',
    parameters: zod_1.z.object({
        sessionId: zod_1.z.string().describe('Session ID to resume (get from list_sessions tool)'),
        prompt: zod_1.z.string().describe('Follow-up message or question for the agent. Build on the previous conversation context.')
    }),
    execute: async (args) => {
        const cliPath = path_1.default.resolve(__dirname, '../../genie');
        const escapedPrompt = args.prompt.replace(/"/g, '\\"');
        const command = `"${cliPath}" resume ${args.sessionId} "${escapedPrompt}"`;
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: path_1.default.resolve(__dirname, '../..'),
                maxBuffer: 1024 * 1024 * 10, // 10MB
                timeout: 120000 // 2 minutes
            });
            const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');
            return `Resumed session ${args.sessionId}:\n\n${output}`;
        }
        catch (error) {
            return `Failed to resume session:\n${error.message}\n\nCommand: ${command}`;
        }
    }
});
// Tool: view - View session transcript
server.addTool({
    name: 'view',
    description: 'View the transcript of an agent session. Shows the conversation history, agent outputs, and any artifacts generated. Use full=true for complete transcript or false for recent messages only.',
    parameters: zod_1.z.object({
        sessionId: zod_1.z.string().describe('Session ID to view (get from list_sessions tool)'),
        full: zod_1.z.boolean().optional().default(false).describe('Show full transcript (true) or recent messages only (false). Default: false.')
    }),
    execute: async (args) => {
        const cliPath = path_1.default.resolve(__dirname, '../../genie');
        const fullFlag = args.full ? ' --full' : '';
        const command = `"${cliPath}" view ${args.sessionId}${fullFlag}`;
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: path_1.default.resolve(__dirname, '../..'),
                maxBuffer: 1024 * 1024 * 10, // 10MB
                timeout: 30000 // 30 seconds
            });
            const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');
            return `Session ${args.sessionId} transcript:\n\n${output}`;
        }
        catch (error) {
            return `Failed to view session:\n${error.message}\n\nCommand: ${command}`;
        }
    }
});
// Tool: stop - Terminate a running session
server.addTool({
    name: 'stop',
    description: 'Stop a running agent session. Use this to terminate long-running agents or cancel sessions that are no longer needed. The session state is preserved for later viewing.',
    parameters: zod_1.z.object({
        sessionId: zod_1.z.string().describe('Session ID to stop (get from list_sessions tool)')
    }),
    execute: async (args) => {
        const cliPath = path_1.default.resolve(__dirname, '../../genie');
        const command = `"${cliPath}" stop ${args.sessionId}`;
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: path_1.default.resolve(__dirname, '../..'),
                maxBuffer: 1024 * 1024 * 10, // 10MB
                timeout: 30000 // 30 seconds
            });
            const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');
            return `Stopped session ${args.sessionId}:\n\n${output}`;
        }
        catch (error) {
            return `Failed to stop session:\n${error.message}\n\nCommand: ${command}`;
        }
    }
});
// Prompt: start-agent - Guide for starting a new agent
server.addPrompt({
    name: 'start-agent',
    description: 'Get guidance on how to effectively start a Genie agent session with a well-formulated prompt',
    arguments: [
        {
            name: 'goal',
            description: 'What you want to accomplish (e.g., "implement a new feature", "fix a bug", "plan an architecture")',
            required: true
        },
        {
            name: 'context',
            description: 'Relevant context about your project or the specific area you\'re working on',
            required: false
        }
    ],
    load: async (args) => {
        const contextPart = args.context ? `\n\nContext: ${args.context}` : '';
        return `You want to: ${args.goal}${contextPart}

# Choosing the Right Agent

Based on your goal, here are recommended agents:

**For Planning & Architecture:**
- \`plan\` - Strategic planning, requirement analysis, high-level design
- \`twin\` - Get a second opinion, pressure-test decisions, find blind spots

**For Implementation:**
- \`implementor\` - Write code, implement features
- \`forge\` - Break down work into execution groups
- \`tests\` - Write test cases and validation

**For Code Quality:**
- \`codereview\` - Review code changes for issues
- \`polish\` - Refine and improve existing code
- \`refactor\` - Restructure code for better design

**For Debugging:**
- \`debug\` - Investigate root causes, analyze errors
- \`analyze\` - Deep dive into system architecture

**For Project Management:**
- \`commit\` - Generate commit messages
- \`review\` - Validate completed work

# Crafting an Effective Prompt

A good agent prompt should include:

1. **Clear Goal**: What do you want to achieve?
2. **Context**: Where in the codebase? What's the current state?
3. **Constraints**: Any technical requirements or limitations?
4. **Success Criteria**: How will you know it's done?

# Example Prompts

**Good:**
"Implement a user authentication feature for the web app. We're using Node.js with Express and PostgreSQL. The feature should include login, logout, and JWT token management. Success criteria: tests pass, follows existing auth patterns in src/auth/"

**Too Vague:**
"Add auth"

# Next Steps

1. Choose an agent from the list above
2. Use the \`list_agents\` tool to verify the agent exists
3. Use the \`run\` tool with your agent and a detailed prompt`;
    }
});
// Prompt: debug-issue - Guide for debugging problems
server.addPrompt({
    name: 'debug-issue',
    description: 'Get guidance on how to effectively debug an issue using Genie agents',
    arguments: [
        {
            name: 'problem',
            description: 'Description of the issue you\'re experiencing',
            required: true
        },
        {
            name: 'symptoms',
            description: 'Observable symptoms (error messages, unexpected behavior, etc.)',
            required: false
        }
    ],
    load: async (args) => {
        const symptomsPart = args.symptoms ? `\n\nSymptoms: ${args.symptoms}` : '';
        return `Problem: ${args.problem}${symptomsPart}

# Debugging Workflow with Genie

## Step 1: Investigate
Use the \`debug\` agent to analyze the issue:

\`\`\`
run debug "Investigate: ${args.problem}

Analyze the codebase to:
1. Identify potential root causes
2. Check error logs and stack traces
3. Review recent code changes
4. Suggest hypotheses ranked by likelihood"
\`\`\`

## Step 2: Validate (Optional)
Get a second opinion with the \`twin\` agent:

\`\`\`
run twin "Mode: debug. Review the debug findings for: ${args.problem}

Provide alternative hypotheses and validation steps."
\`\`\`

## Step 3: Fix
Use the \`implementor\` agent to apply the fix:

\`\`\`
run implementor "Fix: ${args.problem}

Based on debug findings, implement the fix with:
1. Code changes
2. Tests to prevent regression
3. Documentation of the fix"
\`\`\`

## Step 4: Verify
Use the \`tests\` agent to validate:

\`\`\`
run tests "Verify fix for: ${args.problem}

Run relevant tests and confirm:
1. Issue is resolved
2. No regressions introduced
3. Edge cases covered"
\`\`\`

# Tips for Effective Debugging

- Include error messages and stack traces in your prompts
- Mention what you've already tried
- Specify affected files or modules
- Describe expected vs actual behavior
- Include reproduction steps if available`;
    }
});
// Prompt: plan-feature - Guide for feature planning
server.addPrompt({
    name: 'plan-feature',
    description: 'Get guidance on planning a new feature using the Genie workflow',
    arguments: [
        {
            name: 'feature',
            description: 'Brief description of the feature you want to build',
            required: true
        }
    ],
    load: async (args) => {
        return `Feature: ${args.feature}

# Genie Feature Planning Workflow

## Phase 1: Planning (/plan)
Use the \`plan\` agent to create a strategic plan:

\`\`\`
run plan "[Discovery] Analyze requirements for: ${args.feature}

1. Review existing codebase architecture
2. Identify integration points
3. List technical requirements
4. Document assumptions and risks

[Implementation] Propose high-level approach

[Verification] Define success criteria and validation steps"
\`\`\`

The plan agent will help you:
- Understand current system architecture
- Identify dependencies
- Surface potential issues early
- Create a roadmap

## Phase 2: Specification (/wish)
Use the \`wish\` agent to create a detailed specification:

\`\`\`
run wish "Create wish for: ${args.feature}

Based on planning, create a specification with:
1. Clear scope and out-of-scope items
2. Execution groups
3. Evidence requirements
4. Validation criteria"
\`\`\`

## Phase 3: Task Breakdown (/forge)
Use the \`forge\` agent to break down into tasks:

\`\`\`
run forge "Break down wish for: ${args.feature}

Create execution groups with:
1. Specific deliverables
2. Test requirements
3. Validation steps
4. Dependencies"
\`\`\`

## Phase 4: Implementation
Use specialist agents for execution:

\`\`\`
run implementor "Implement Group A: [specific task]"
run tests "Write tests for Group A"
run qa "Validate Group A completion"
\`\`\`

## Phase 5: Review (/review)
Use the \`review\` agent to validate completion:

\`\`\`
run review "Review completion of: ${args.feature}

Validate:
1. All acceptance criteria met
2. Tests passing
3. Documentation complete
4. No regressions"
\`\`\`

# Key Principles

- Break large features into smaller execution groups
- Plan before implementing (avoid jumping straight to code)
- Get second opinions on critical decisions (use \`twin\` agent)
- Validate at each phase before proceeding
- Document assumptions and decisions`;
    }
});
// Prompt: review-code - Guide for code review
server.addPrompt({
    name: 'review-code',
    description: 'Get guidance on conducting a thorough code review using Genie',
    arguments: [
        {
            name: 'scope',
            description: 'What code to review (e.g., "recent changes", "auth module", "PR #123")',
            required: true
        }
    ],
    load: async (args) => {
        return `Review Scope: ${args.scope}

# Code Review with Genie

## Quick Review
For focused, tactical feedback:

\`\`\`
run codereview "Review: ${args.scope}

Check for:
1. Security vulnerabilities
2. Performance issues
3. Code quality and patterns
4. Test coverage
5. Documentation

Provide severity-tagged feedback (CRITICAL/HIGH/MEDIUM/LOW)"
\`\`\`

## Deep Review
For architectural analysis:

\`\`\`
run analyze "Analyze: ${args.scope}

Evaluate:
1. System design and architecture
2. Coupling and cohesion
3. Scalability concerns
4. Technical debt
5. Alignment with project standards"
\`\`\`

## Get Second Opinion
Validate findings with \`twin\` agent:

\`\`\`
run twin "Mode: design-review. Component: ${args.scope}

Pressure-test the implementation:
1. Find potential blind spots
2. Identify missing edge cases
3. Suggest improvements
4. Rate overall quality (confidence: low/med/high)"
\`\`\`

# Review Checklist

**Functionality:**
- [ ] Code does what it's supposed to do
- [ ] Edge cases handled
- [ ] Error handling present

**Quality:**
- [ ] Follows project coding standards
- [ ] No code duplication
- [ ] Clear naming and structure
- [ ] Adequate comments where needed

**Testing:**
- [ ] Unit tests present and passing
- [ ] Integration tests if needed
- [ ] Test coverage adequate

**Security:**
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Authentication/authorization correct
- [ ] No SQL injection or XSS risks

**Performance:**
- [ ] No obvious performance issues
- [ ] Database queries optimized
- [ ] Caching where appropriate

**Documentation:**
- [ ] README updated if needed
- [ ] API docs current
- [ ] Complex logic explained

# Output Format

Request agents to provide:
1. Summary of findings
2. Severity-tagged issues
3. Specific file/line references
4. Suggested improvements
5. Overall assessment`;
    }
});
// Start server with configured transport
console.log('Starting Genie MCP Server...');
console.log(`Transport: ${TRANSPORT}`);
console.log('Protocol: MCP (Model Context Protocol)');
console.log('Implementation: FastMCP v3.18.0');
console.log('Tools: 6 (list_agents, list_sessions, run, resume, view, stop)');
if (TRANSPORT === 'stdio') {
    server.start({
        transportType: 'stdio'
    });
    console.log('✅ Server started successfully (stdio)');
    console.log('Ready for Claude Desktop or MCP Inspector connections');
}
else if (TRANSPORT === 'httpStream' || TRANSPORT === 'http') {
    server.start({
        transportType: 'httpStream',
        httpStream: {
            port: PORT
        }
    });
    console.log(`✅ Server started successfully (HTTP Stream)`);
    console.log(`HTTP Stream: http://localhost:${PORT}/mcp`);
    console.log(`SSE: http://localhost:${PORT}/sse`);
}
else {
    console.error(`❌ Unknown transport type: ${TRANSPORT}`);
    console.error('Valid options: stdio (default), httpStream, http');
    process.exit(1);
}

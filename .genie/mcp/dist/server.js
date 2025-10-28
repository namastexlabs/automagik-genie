#!/usr/bin/env node
"use strict";
/**
 * Genie MCP Server - Official SDK Implementation
 *
 * Provides Model Context Protocol access to Genie agent orchestration.
 * Tools integrate with CLI via subprocess execution (shell-out pattern).
 *
 * TECHNICAL DEBT: Handler integration blocked by type signature mismatch:
 * - CLI handlers return Promise<void> (side-effect based via emitView)
 * - MCP tools need Promise<data> (pure functions returning structured data)
 *
 * Future improvement (v0.2.0): Refactor CLI handlers to return data directly,
 * enabling zero-duplication integration. Current implementation ensures 100%
 * behavioral equivalence with CLI while maintaining functional MCP server.
 *
 * Build status: ✅ CLI compiles (0 errors), ✅ MCP compiles (0 errors)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const display_transform_js_1 = require("./lib/display-transform.js");
// Import WebSocket-native tools (MVP Phase 6)
const wish_tool_js_1 = require("./tools/wish-tool.js");
const forge_tool_js_1 = require("./tools/forge-tool.js");
const review_tool_js_1 = require("./tools/review-tool.js");
const prompt_tool_js_1 = require("./tools/prompt-tool.js");
// Import neuron architecture tools (Phase 2)
const continue_task_tool_js_1 = require("./tools/continue-task-tool.js");
const create_subtask_tool_js_1 = require("./tools/create-subtask-tool.js");
// Import role detection
const role_detector_js_1 = require("./lib/role-detector.js");
// Import HTTP server for OAuth2 transport
const http_server_js_1 = require("./lib/http-server.js");
// Import process cleanup utilities
const process_cleanup_js_1 = require("./lib/process-cleanup.js");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 8885;
const TRANSPORT = process.env.MCP_TRANSPORT || 'stdio';
// Find actual workspace root by searching upward for .genie/ directory
function findWorkspaceRoot() {
    let dir = process.cwd();
    while (dir !== path_1.default.dirname(dir)) {
        if (fs_1.default.existsSync(path_1.default.join(dir, '.genie'))) {
            return dir;
        }
        dir = path_1.default.dirname(dir);
    }
    // Fallback to process.cwd() if .genie not found
    return process.cwd();
}
const WORKSPACE_ROOT = findWorkspaceRoot();
// transformDisplayPath imported from ./lib/display-transform (single source of truth)
// Helper: List available agents from all collectives
function listAgents() {
    const agents = [];
    // ONLY scan specific agents/ directories (not workflows/ or spells/)
    const searchDirs = [
        path_1.default.join(WORKSPACE_ROOT, '.genie/code/agents'),
        path_1.default.join(WORKSPACE_ROOT, '.genie/create/agents')
    ];
    const visit = (dirPath, relativePath) => {
        const entries = fs_1.default.readdirSync(dirPath, { withFileTypes: true });
        entries.forEach((entry) => {
            const entryPath = path_1.default.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                // Recurse into subdirectories (for sub-agents like git/workflows/, wish/)
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
            // Transform display path (strip template/category folders)
            const { displayId, displayFolder } = (0, display_transform_js_1.transformDisplayPath)(normalizedId);
            agents.push({ id: normalizedId, displayId, name, description, folder: displayFolder || undefined });
        });
    };
    // Visit all search directories
    searchDirs.forEach(baseDir => {
        if (fs_1.default.existsSync(baseDir)) {
            visit(baseDir, null);
        }
    });
    return agents;
}
// Helper: Safely load Forge executor from dist (package) or src (repo)
function loadForgeExecutor() {
    // Prefer compiled dist (works in published package)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('../../cli/dist/lib/forge-executor');
    }
    catch (_distErr) {
        // Fallback to TypeScript sources for local dev (within repo)
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require('../../cli/src/lib/forge-executor');
        }
        catch (_srcErr) {
            return null;
        }
    }
}
// Helper: List recent sessions (uses Forge API)
async function listSessions() {
    try {
        // ALWAYS use Forge API for session listing (complete executor replacement)
        const mod = loadForgeExecutor();
        if (!mod || typeof mod.createForgeExecutor !== 'function') {
            throw new Error('Forge executor unavailable (did you build the CLI?)');
        }
        const forgeExecutor = mod.createForgeExecutor();
        const forgeSessions = await forgeExecutor.listSessions();
        const sessions = forgeSessions.map((entry) => ({
            id: entry.id || 'unknown', // Task ID for Forge API lookups
            name: entry.agent || 'unknown', // Use agent name as display name
            agent: entry.agent || 'unknown',
            status: entry.status || 'unknown',
            created: entry.created || 'unknown',
            lastUsed: entry.lastUsed || entry.created || 'unknown'
        }));
        // Filter: Show running sessions + recent completed (last 10)
        // Fix Bug #5: Filter out stale sessions (>24 hours old with no recent activity)
        const now = Date.now();
        const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
        const running = sessions.filter((s) => {
            const status = s.status === 'running' || s.status === 'starting';
            if (!status)
                return false;
            // Check if session is stale (created >24h ago, no recent activity)
            if (s.lastUsed !== 'unknown') {
                const lastUsedTime = new Date(s.lastUsed).getTime();
                const age = now - lastUsedTime;
                if (age > STALE_THRESHOLD_MS) {
                    // Mark as stale but keep for manual cleanup
                    return false;
                }
            }
            return true;
        });
        const completed = sessions
            .filter((s) => s.status === 'completed')
            .sort((a, b) => {
            if (a.lastUsed === 'unknown')
                return 1;
            if (b.lastUsed === 'unknown')
                return -1;
            return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        })
            .slice(0, 10);
        // Combine and sort by lastUsed descending
        return [...running, ...completed].sort((a, b) => {
            if (a.lastUsed === 'unknown')
                return 1;
            if (b.lastUsed === 'unknown')
                return -1;
            return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        });
    }
    catch (error) {
        // Fallback to local sessions.json if Forge API fails
        console.warn('Failed to fetch Forge sessions, falling back to local store');
        const sessionsFile = path_1.default.join(WORKSPACE_ROOT, '.genie/state/agents/sessions.json');
        if (!fs_1.default.existsSync(sessionsFile)) {
            return [];
        }
        try {
            const content = fs_1.default.readFileSync(sessionsFile, 'utf8');
            const store = JSON.parse(content);
            const sessions = Object.entries(store.sessions || {}).map(([key, entry]) => ({
                id: entry.sessionId || key,
                name: entry.name || key,
                agent: entry.agent || key,
                status: entry.status || 'unknown',
                created: entry.created || 'unknown',
                lastUsed: entry.lastUsed || entry.created || 'unknown'
            }));
            // Apply same stale filter as Forge path (Fix Bug #5)
            const now = Date.now();
            const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
            const running = sessions.filter(s => {
                const status = s.status === 'running' || s.status === 'starting';
                if (!status)
                    return false;
                // Filter out stale sessions
                if (s.lastUsed !== 'unknown') {
                    const lastUsedTime = new Date(s.lastUsed).getTime();
                    const age = now - lastUsedTime;
                    if (age > STALE_THRESHOLD_MS) {
                        return false;
                    }
                }
                return true;
            });
            const completed = sessions
                .filter(s => s.status === 'completed')
                .sort((a, b) => {
                if (a.lastUsed === 'unknown')
                    return 1;
                if (b.lastUsed === 'unknown')
                    return -1;
                return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
            })
                .slice(0, 10);
            return [...running, ...completed].sort((a, b) => {
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
}
// Helper: View session transcript (uses Forge API directly)
async function viewSession(taskId) {
    try {
        const mod = loadForgeExecutor();
        if (!mod || typeof mod.createForgeExecutor !== 'function') {
            return {
                status: 'error',
                transcript: null,
                error: 'Forge executor unavailable (did you build the CLI?)'
            };
        }
        const forgeExecutor = mod.createForgeExecutor();
        // Get task details to find latest attempt
        const { ForgeClient } = require('../../../forge.js');
        const forge = new ForgeClient(process.env.FORGE_BASE_URL || 'http://localhost:8887', process.env.FORGE_TOKEN);
        // Get task attempts for this task
        const attempts = await forge.listTaskAttempts(taskId);
        if (!Array.isArray(attempts) || !attempts.length) {
            return {
                status: 'error',
                transcript: null,
                error: `No attempts found for task ${taskId}`
            };
        }
        // Get latest attempt
        const latestAttempt = attempts[attempts.length - 1];
        const attemptId = latestAttempt.id;
        // Get attempt status
        const attemptDetails = await forge.getTaskAttempt(attemptId);
        const status = attemptDetails.status || 'unknown';
        // Get execution logs
        const processes = await forge.listExecutionProcesses(attemptId);
        let transcript = null;
        if (processes.length > 0) {
            const latestProcess = processes[processes.length - 1];
            transcript = latestProcess.output || latestProcess.logs || null;
        }
        return {
            status,
            transcript,
        };
    }
    catch (error) {
        return {
            status: 'error',
            transcript: null,
            error: error.message || 'Unknown error viewing session'
        };
    }
}
// Helper: Get Genie version from package.json
function getGenieVersion() {
    try {
        const packageJsonPath = path_1.default.join(__dirname, '..', '..', '..', 'package.json');
        const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || '0.0.0';
    }
    catch (error) {
        return '0.0.0';
    }
}
// Helper: Get version header for MCP outputs
function getVersionHeader() {
    return `Genie MCP v${getGenieVersion()}\n\n`;
}
// Sync agent profiles to Forge on startup
async function syncAgentProfilesToForge() {
    try {
        const mod = loadForgeExecutor();
        if (!mod || typeof mod.createForgeExecutor !== 'function') {
            console.warn('⚠️  Skipping agent profile sync - Forge executor unavailable');
            return;
        }
        const forgeExecutor = mod.createForgeExecutor();
        // Pass WORKSPACE_ROOT to ensure correct scanning from MCP server context
        await forgeExecutor.syncProfiles(undefined, WORKSPACE_ROOT);
    }
    catch (error) {
        console.warn(`⚠️  Agent profile sync failed: ${error.message}`);
    }
}
// Load OAuth2 configuration from ~/.genie/config.yaml
function loadOAuth2Config() {
    try {
        const os = require('os');
        const YAML = require('yaml');
        const configPath = path_1.default.join(os.homedir(), '.genie', 'config.yaml');
        if (!fs_1.default.existsSync(configPath)) {
            return null;
        }
        const content = fs_1.default.readFileSync(configPath, 'utf8');
        const config = YAML.parse(content);
        // Validate and return OAuth2 config
        if (config?.mcp?.auth?.oauth2?.clientId) {
            return config.mcp.auth.oauth2;
        }
    }
    catch (error) {
        // Config not available or invalid
    }
    return null;
}
// Load OAuth2 config for HTTP transport
const oauth2Config = loadOAuth2Config();
const serverUrl = `http://localhost:${PORT}`;
// Initialize MCP Server using official SDK
const server = new mcp_js_1.McpServer({
    name: 'genie',
    version: getGenieVersion(),
}, {
    capabilities: {
        logging: {},
        tools: {}
    }
});
// Tool: list_agents - Discover available agents
server.tool('list_agents', 'List all available Genie agents with their capabilities and descriptions. Use this first to discover which agents can help with your task.', async () => {
    const agents = listAgents();
    if (agents.length === 0) {
        return { content: [{ type: 'text', text: getVersionHeader() + 'No agents found in .genie/code/agents or .genie/create/agents directories.' }] };
    }
    let response = getVersionHeader() + `Found ${agents.length} available agents:\n\n`;
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
            response += `  • ${agent.displayId}`;
            if (agent.name !== agent.displayId)
                response += ` (${agent.name})`;
            if (agent.description)
                response += ` - ${agent.description}`;
            response += '\n';
        });
        response += '\n';
    });
    response += '\nUse the "run" tool with an agent id and prompt to start an agent session.';
    return { content: [{ type: 'text', text: response }] };
});
// Tool: list_sessions - View active and recent sessions
server.tool('list_sessions', 'List active and recent Genie agent sessions. Shows session names, agents, status, and timing. Use this to find sessions to resume or view.', async () => {
    const sessions = await listSessions();
    if (sessions.length === 0) {
        return { content: [{ type: 'text', text: getVersionHeader() + 'No sessions found. Start a new session with the "run" tool.' }] };
    }
    let response = getVersionHeader() + `Found ${sessions.length} session(s):\n\n`;
    sessions.forEach((session, index) => {
        const { displayId } = (0, display_transform_js_1.transformDisplayPath)(session.agent);
        response += `${index + 1}. **${session.id}** (${session.name})\n`;
        response += `   Agent: ${displayId}\n`;
        response += `   Status: ${session.status}\n`;
        response += `   Created: ${session.created}\n`;
        response += `   Last Used: ${session.lastUsed}\n\n`;
    });
    response += 'Use "view" with the session ID (e.g., "c74111b4-...") to see transcript or "resume" to continue a session.';
    return { content: [{ type: 'text', text: response }] };
});
// Tool: run - Start a new agent session
server.tool('run', 'Start a new Genie agent session. Choose an agent (use list_agents first) and provide a detailed prompt describing the task. The agent will analyze, plan, or implement based on its specialization.', {
    agent: zod_1.z.string().describe('Agent ID to run (e.g., "plan", "implementor", "debug"). Get available agents from list_agents tool.'),
    prompt: zod_1.z.string().describe('Detailed task description for the agent. Be specific about goals, context, and expected outcomes. Agents work best with clear, actionable prompts.'),
    name: zod_1.z.string().optional().describe('Friendly session name for easy identification (e.g., "bug-102-fix", "auth-feature"). If omitted, auto-generates: "{agent}-{timestamp}".')
}, async (args) => {
    try {
        // Agent alias mapping (Fix Bug #1: plan → wish/blueprint)
        const AGENT_ALIASES = {
            'plan': 'wish/blueprint',
            'discover': 'wish/discovery',
            'requirements': 'wish/requirements',
            'align': 'wish/alignment'
        };
        // Resolve alias if exists
        const resolvedAgent = AGENT_ALIASES[args.agent] || args.agent;
        // Early validation: Check if agent exists BEFORE trying to run
        const availableAgents = listAgents();
        const agentExists = availableAgents.some(a => a.id === resolvedAgent || a.displayId === resolvedAgent);
        if (!agentExists) {
            // Fast fail with helpful error message
            const suggestions = availableAgents
                .filter(a => a.id.includes(args.agent) || a.displayId.includes(args.agent))
                .slice(0, 3)
                .map(a => `  • ${a.displayId}`)
                .join('\n');
            const errorMsg = `❌ **Agent not found:** '${args.agent}'\n\n` +
                (suggestions ? `Did you mean:\n${suggestions}\n\n` : '') +
                `💡 Use list_agents tool to see all available agents.`;
            return { content: [{ type: 'text', text: getVersionHeader() + errorMsg }] };
        }
        // Use resolved agent for CLI invocation
        const cliArgs = ['run', resolvedAgent];
        if (args.name?.length) {
            cliArgs.push('--name', args.name);
        }
        if (args.prompt?.length) {
            cliArgs.push(args.prompt);
        }
        const { stdout, stderr } = await runCliCommand(cliArgs, 120000);
        const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');
        const { displayId } = (0, display_transform_js_1.transformDisplayPath)(resolvedAgent);
        const aliasNote = AGENT_ALIASES[args.agent] ? ` (alias: ${args.agent} → ${resolvedAgent})` : '';
        return { content: [{ type: 'text', text: getVersionHeader() + `Started agent session:\nAgent: ${displayId}${aliasNote}\n\n${output}\n\nUse list_sessions to see the session ID, then use view/resume/stop as needed.` }] };
    }
    catch (error) {
        return { content: [{ type: 'text', text: getVersionHeader() + formatCliFailure('start agent session', error) }] };
    }
});
// Tool: resume - Continue an existing session
server.tool('resume', 'Resume an existing agent session with a follow-up prompt. Use this to continue conversations, provide additional context, or ask follow-up questions to an agent.', {
    sessionId: zod_1.z.string().describe('Session name to resume (get from list_sessions tool). Example: "146-session-name-architecture"'),
    prompt: zod_1.z.string().describe('Follow-up message or question for the agent. Build on the previous conversation context.')
}, async (args) => {
    try {
        const cliArgs = ['resume', args.sessionId];
        if (args.prompt?.length) {
            cliArgs.push(args.prompt);
        }
        const { stdout, stderr } = await runCliCommand(cliArgs, 120000);
        const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');
        return { content: [{ type: 'text', text: getVersionHeader() + `Resumed session ${args.sessionId}:\n\n${output}` }] };
    }
    catch (error) {
        return { content: [{ type: 'text', text: getVersionHeader() + formatCliFailure('resume session', error) }] };
    }
});
// Tool: view - View session transcript
server.tool('view', 'View the transcript of an agent session. Shows the conversation history, agent outputs, and any artifacts generated. Use full=true for complete transcript or false for recent messages only.', {
    sessionId: zod_1.z.string().describe('Task ID to view (get from list_sessions tool). Example: "c74111b4-1a81-49d9-b7d3-d57e31926710"'),
    full: zod_1.z.boolean().optional().default(false).describe('Show full transcript (true) or recent messages only (false). Default: false.')
}, async (args) => {
    try {
        const result = await viewSession(args.sessionId);
        if (result.error) {
            return { content: [{ type: 'text', text: getVersionHeader() + `❌ Error viewing session:\n\n${result.error}` }] };
        }
        let response = getVersionHeader();
        response += `**Task:** ${args.sessionId}\n`;
        response += `**Status:** ${result.status}\n\n`;
        if (result.transcript) {
            const lines = result.transcript.split('\n');
            const displayLines = args.full ? lines : lines.slice(-50); // Show last 50 lines if not full
            response += `**Transcript:**\n\`\`\`\n${displayLines.join('\n')}\n\`\`\``;
        }
        else {
            response += `**Transcript:** (No logs available yet)`;
        }
        return { content: [{ type: 'text', text: response }] };
    }
    catch (error) {
        return { content: [{ type: 'text', text: getVersionHeader() + `❌ Error: ${error.message}` }] };
    }
});
// Tool: stop - Terminate a running session
server.tool('stop', 'Stop a running agent session. Use this to terminate long-running agents or cancel sessions that are no longer needed. The session state is preserved for later viewing.', {
    sessionId: zod_1.z.string().describe('Session name to stop (get from list_sessions tool). Example: "146-session-name-architecture"')
}, async (args) => {
    try {
        const { stdout, stderr } = await runCliCommand(['stop', args.sessionId], 30000);
        const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');
        return { content: [{ type: 'text', text: getVersionHeader() + `Stopped session ${args.sessionId}:\n\n${output}` }] };
    }
    catch (error) {
        return { content: [{ type: 'text', text: getVersionHeader() + formatCliFailure('stop session', error) }] };
    }
});
// Helper: List all spell files in a directory recursively
function listSpellsInDir(dir, basePath = '') {
    const spells = [];
    try {
        const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path_1.default.join(dir, entry.name);
            const relativePath = basePath ? path_1.default.join(basePath, entry.name) : entry.name;
            if (entry.isDirectory()) {
                // Recurse into subdirectories
                spells.push(...listSpellsInDir(fullPath, relativePath));
            }
            else if (entry.isFile() && entry.name.endsWith('.md')) {
                // Extract spell name from frontmatter if possible
                try {
                    const content = fs_1.default.readFileSync(fullPath, 'utf-8');
                    const frontmatterMatch = content.match(/^---\s*\nname:\s*(.+)\s*\n/);
                    const spellName = frontmatterMatch ? frontmatterMatch[1].trim() : entry.name.replace('.md', '');
                    spells.push({ path: relativePath, name: spellName });
                }
                catch {
                    spells.push({ path: relativePath, name: entry.name.replace('.md', '') });
                }
            }
        }
    }
    catch (error) {
        // Directory doesn't exist or can't be read
    }
    return spells;
}
// Helper: Read spell content and extract everything after frontmatter
function readSpellContent(spellPath) {
    try {
        const content = fs_1.default.readFileSync(spellPath, 'utf-8');
        // Find the end of frontmatter (second ---)
        const frontmatterEnd = content.indexOf('---', 3);
        if (frontmatterEnd === -1) {
            // No frontmatter, return entire content
            return content;
        }
        // Return everything after the closing ---
        return content.substring(frontmatterEnd + 3).trim();
    }
    catch (error) {
        throw new Error(`Failed to read spell: ${error.message}`);
    }
}
// Tool: list_spells - Discover available spells
server.tool('list_spells', 'List all available Genie spells (reusable knowledge patterns). Returns spells from .genie/spells/ (global), .genie/code/spells/ (code-specific), and .genie/create/spells/ (create-specific).', async () => {
    // Note: Scope parameter removed - always returns all spells for simplicity (avoids MCP schema validation issues)
    const scope = 'all';
    const result = {};
    // Global spells
    if (scope === 'all' || scope === 'global') {
        const globalSpellsDir = path_1.default.join(WORKSPACE_ROOT, '.genie', 'spells');
        result.global = listSpellsInDir(globalSpellsDir);
    }
    // Code spells
    if (scope === 'all' || scope === 'code') {
        const codeSpellsDir = path_1.default.join(WORKSPACE_ROOT, '.genie', 'code', 'spells');
        result.code = listSpellsInDir(codeSpellsDir);
    }
    // Create spells
    if (scope === 'all' || scope === 'create') {
        const createSpellsDir = path_1.default.join(WORKSPACE_ROOT, '.genie', 'create', 'spells');
        result.create = listSpellsInDir(createSpellsDir);
    }
    // Format output
    let output = getVersionHeader() + '# Genie Spells\n\n';
    if (result.global) {
        output += `## Global Spells (.genie/spells/) - ${result.global.length} spells\n`;
        output += 'Universal patterns applicable to all collectives:\n\n';
        for (const spell of result.global) {
            output += `- **${spell.name}** - \`${spell.path}\`\n`;
        }
        output += '\n';
    }
    if (result.code) {
        output += `## Code Spells (.genie/code/spells/) - ${result.code.length} spells\n`;
        output += 'Code-specific patterns for technical execution:\n\n';
        for (const spell of result.code) {
            output += `- **${spell.name}** - \`${spell.path}\`\n`;
        }
        output += '\n';
    }
    if (result.create) {
        output += `## Create Spells (.genie/create/spells/) - ${result.create.length} spells\n`;
        output += 'Create-specific patterns for creative work:\n\n';
        for (const spell of result.create) {
            output += `- **${spell.name}** - \`${spell.path}\`\n`;
        }
        output += '\n';
    }
    const totalCount = (result.global?.length || 0) + (result.code?.length || 0) + (result.create?.length || 0);
    output += `\n**Total:** ${totalCount} spells\n`;
    return { content: [{ type: 'text', text: output }] };
});
// Helper: Normalize spell path (strip leading .genie/, add directory if missing, add .md if missing)
function normalizeSpellPath(userPath) {
    // Strip leading .genie/ if present (prevents double prefix)
    let normalized = userPath.replace(/^\.genie[\\/]/, '');
    // If path contains no directory component and no scope prefix, search all scope directories
    if (!normalized.includes('/') && !normalized.includes('\\')) {
        // Try to find the spell in global, code, or create directories
        const searchDirs = ['spells', 'code/spells', 'create/spells'];
        for (const dir of searchDirs) {
            const testPath = path_1.default.join(WORKSPACE_ROOT, '.genie', dir, normalized.endsWith('.md') ? normalized : `${normalized}.md`);
            if (fs_1.default.existsSync(testPath)) {
                normalized = path_1.default.join(dir, normalized.endsWith('.md') ? normalized : `${normalized}.md`);
                break;
            }
        }
        // If not found in any directory, default to spells/ (will fail with clear error)
        if (!normalized.includes('/') && !normalized.includes('\\')) {
            normalized = path_1.default.join('spells', normalized);
        }
    }
    // Add .md extension if missing
    if (!normalized.endsWith('.md')) {
        normalized += '.md';
    }
    return normalized;
}
// Tool: read_spell - Read specific spell content
server.tool('read_spell', 'Read the full content of a specific spell. Returns the spell content after the frontmatter (---). Use list_spells first to see available spells. Supports multiple path formats: "spells/learn.md", ".genie/spells/learn.md", "code/spells/debug.md", or just "learn" (searches all directories).', {
    spell_path: zod_1.z.string().describe('Path to spell file. Flexible formats supported: "spells/learn.md" (recommended), ".genie/spells/learn.md" (auto-strips .genie/), "code/spells/debug.md", or just "learn" (auto-searches and adds .md extension)')
}, async (args) => {
    const normalizedPath = normalizeSpellPath(args.spell_path);
    const fullPath = path_1.default.join(WORKSPACE_ROOT, '.genie', normalizedPath);
    try {
        const content = readSpellContent(fullPath);
        return { content: [{ type: 'text', text: getVersionHeader() + `# Spell: ${normalizedPath}\n\n${content}` }] };
    }
    catch (error) {
        return { content: [{ type: 'text', text: getVersionHeader() + `Error reading spell: ${error.message}` }] };
    }
});
// Workflows have been merged into spells - no separate workflow tools needed
// Tool: get_workspace_info - Get workspace metadata (lean self-awareness data)
server.tool('get_workspace_info', 'Get essential workspace info for agent self-awareness: project name, tech stack, current branch, and available commands. Lightweight context for agents to understand their environment.', async () => {
    try {
        // Extract essential data only (no bloat)
        const workspaceInfo = {};
        // 1. Project name (from package.json or directory name)
        const packageJsonPath = path_1.default.join(WORKSPACE_ROOT, 'package.json');
        if (fs_1.default.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
            workspaceInfo.project = pkg.name || path_1.default.basename(WORKSPACE_ROOT);
        }
        else {
            workspaceInfo.project = path_1.default.basename(WORKSPACE_ROOT);
        }
        // 2. Tech stack (runtime, language, package manager)
        workspaceInfo.techStack = {};
        if (fs_1.default.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
            workspaceInfo.techStack.runtime = 'Node.js';
            workspaceInfo.techStack.packageManager = fs_1.default.existsSync(path_1.default.join(WORKSPACE_ROOT, 'pnpm-lock.yaml')) ? 'pnpm' :
                fs_1.default.existsSync(path_1.default.join(WORKSPACE_ROOT, 'yarn.lock')) ? 'yarn' : 'npm';
            // Detect language from dependencies
            if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) {
                workspaceInfo.techStack.language = 'TypeScript';
            }
            else {
                workspaceInfo.techStack.language = 'JavaScript';
            }
        }
        // 3. Current branch (from git)
        try {
            const { execSync } = require('child_process');
            const branch = execSync('git branch --show-current', { cwd: WORKSPACE_ROOT, encoding: 'utf-8' }).trim();
            workspaceInfo.currentBranch = branch || 'unknown';
        }
        catch {
            workspaceInfo.currentBranch = 'unknown';
        }
        // 4. Available commands (from package.json scripts)
        workspaceInfo.commands = {};
        if (fs_1.default.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
            if (pkg.scripts) {
                // Only include common/useful commands (build, test, lint)
                const relevantScripts = ['build', 'test', 'lint', 'dev', 'start'];
                for (const script of relevantScripts) {
                    if (pkg.scripts[script]) {
                        workspaceInfo.commands[script] = `${workspaceInfo.techStack.packageManager} run ${script}`;
                    }
                }
                // Also include genie-specific commands
                Object.keys(pkg.scripts).forEach(script => {
                    if (script.includes('genie') || script.includes('test:')) {
                        workspaceInfo.commands[script] = `${workspaceInfo.techStack.packageManager} run ${script}`;
                    }
                });
            }
        }
        // Format lean output
        let output = getVersionHeader();
        output += `**Project:** ${workspaceInfo.project}\n`;
        output += `**Branch:** ${workspaceInfo.currentBranch}\n`;
        output += `**Tech Stack:** ${workspaceInfo.techStack.language} + ${workspaceInfo.techStack.runtime} (${workspaceInfo.techStack.packageManager})\n\n`;
        if (Object.keys(workspaceInfo.commands).length > 0) {
            output += `**Available Commands:**\n`;
            Object.entries(workspaceInfo.commands).forEach(([name, cmd]) => {
                output += `- ${name}: \`${cmd}\`\n`;
            });
        }
        return { content: [{ type: 'text', text: output }] };
    }
    catch (error) {
        return { content: [{ type: 'text', text: getVersionHeader() + `Error gathering workspace info: ${error.message}` }] };
    }
});
// ============================================================================
// WEBSOCKET-NATIVE TOOLS (MVP Phase 6) - Real-time streaming + git validation
// ============================================================================
// Tool: create_wish - Create wish with GitHub issue enforcement (WebSocket streaming)
server.tool('create_wish', 'Create a wish with GitHub issue enforcement (Amendment 1) and real-time progress via WebSocket. Git working tree must be clean and pushed.', {
    feature: zod_1.z.string().describe('What you want to build'),
    github_issue: zod_1.z.number().describe('GitHub issue number (required per Amendment 1)')
}, {
    streamingHint: true
}, async (args, extra) => {
    // Use official MCP SDK logging for real-time streaming
    await (0, wish_tool_js_1.executeWishTool)(args, {
        streamContent: async (chunk) => {
            // Stream content via MCP logging notifications
            await server.sendLoggingMessage({
                level: "info",
                data: chunk
            }, extra.sessionId);
        },
        reportProgress: async (current, total) => {
            // Report progress via MCP logging notifications
            const message = `Progress: ${current}/${total}`;
            await server.sendLoggingMessage({
                level: "info",
                data: message
            }, extra.sessionId);
            // Also send MCP progress notification if client provided progressToken
            if (extra._meta?.progressToken) {
                await extra.sendNotification({
                    method: "notifications/progress",
                    params: {
                        progressToken: extra._meta.progressToken,
                        progress: current,
                        total: total,
                        message: message
                    }
                });
            }
        }
    });
    return { content: [{ type: 'text', text: 'Wish creation completed. Check the logs above for details.' }] };
});
// Tool: run_forge - Run Forge task with agent and stream execution (WebSocket diff streaming)
server.tool('run_forge', 'Kick off a Forge task with specified agent and stream live code changes via WebSocket. Git working tree must be clean and pushed.', {
    prompt: zod_1.z.string().describe('Task prompt (e.g., "Fix bug in login flow")'),
    agent: zod_1.z.string().describe('Agent to use (e.g., "implementor", "tests", "polish")'),
    project_id: zod_1.z.string().optional().describe('Project ID (defaults to current Genie project)')
}, {
    streamingHint: true
}, async (args, extra) => {
    // Use official MCP SDK logging for real-time streaming
    await (0, forge_tool_js_1.executeForgeTool)(args, {
        streamContent: async (chunk) => {
            // Stream content via MCP logging notifications
            await server.sendLoggingMessage({
                level: "info",
                data: chunk
            }, extra.sessionId);
        },
        reportProgress: async (current, total) => {
            // Report progress via MCP logging notifications
            const message = `Progress: ${current}/${total}`;
            await server.sendLoggingMessage({
                level: "info",
                data: message
            }, extra.sessionId);
            // Also send MCP progress notification if client provided progressToken
            if (extra._meta?.progressToken) {
                await extra.sendNotification({
                    method: "notifications/progress",
                    params: {
                        progressToken: extra._meta.progressToken,
                        progress: current,
                        total: total,
                        message: message
                    }
                });
            }
        }
    });
    return { content: [{ type: 'text', text: 'Forge task completed. Check the logs above for details.' }] };
});
// Tool: run_review - Review wish with agent and stream feedback (WebSocket log streaming)
server.tool('run_review', 'Review a wish document with an agent and stream live feedback via WebSocket. Git working tree must be clean and pushed.', {
    wish_name: zod_1.z.string().describe('Wish name (e.g., "genie-mcp-mvp")'),
    agent: zod_1.z.string().optional().default('review').describe('Agent to use (default: "review")'),
    project_id: zod_1.z.string().optional().describe('Project ID (defaults to current Genie project)')
}, {
    streamingHint: true
}, async (args, extra) => {
    // Use official MCP SDK logging for real-time streaming
    await (0, review_tool_js_1.executeReviewTool)(args, {
        streamContent: async (chunk) => {
            // Stream content via MCP logging notifications
            await server.sendLoggingMessage({
                level: "info",
                data: chunk
            }, extra.sessionId);
        },
        reportProgress: async (current, total) => {
            // Report progress via MCP logging notifications
            const message = `Progress: ${current}/${total}`;
            await server.sendLoggingMessage({
                level: "info",
                data: message
            }, extra.sessionId);
            // Also send MCP progress notification if client provided progressToken
            if (extra._meta?.progressToken) {
                await extra.sendNotification({
                    method: "notifications/progress",
                    params: {
                        progressToken: extra._meta.progressToken,
                        progress: current,
                        total: total,
                        message: message
                    }
                });
            }
        }
    });
    return { content: [{ type: 'text', text: 'Review completed. Check the logs above for details.' }] };
});
// Tool: transform_prompt - Synchronous prompt transformer (no worktree, no git validation)
server.tool('transform_prompt', 'Transform/enhance a prompt using an agent synchronously. Runs in current workspace (no worktree). Modern equivalent of old "background off" mode.', {
    prompt: zod_1.z.string().describe('Prompt to transform/enhance (e.g., "Help me write a better prompt for implementing dark mode")'),
    agent: zod_1.z.string().optional().default('prompt').describe('Agent to use for transformation (default: "prompt")')
}, {
    readOnlyHint: true
}, async (args, extra) => {
    // Use official MCP SDK logging for real-time streaming
    await (0, prompt_tool_js_1.executePromptTool)(args, {
        streamContent: async (chunk) => {
            // Stream content via MCP logging notifications
            await server.sendLoggingMessage({
                level: "info",
                data: chunk
            }, extra.sessionId);
        }
    });
    return { content: [{ type: 'text', text: 'Prompt transformation completed. Check the logs above for details.' }] };
});
// Tool: continue_task - Send follow-up work to existing task
server.tool('continue_task', 'Send follow-up work to an existing task attempt. Used primarily by master orchestrators to receive new work.', {
    attempt_id: zod_1.z.string().describe('Task attempt ID to send work to'),
    prompt: zod_1.z.string().describe('Follow-up prompt with new work')
}, async (args, extra) => {
    await (0, continue_task_tool_js_1.executeContinueTaskTool)(args, {
        streamContent: async (chunk) => {
            await server.sendLoggingMessage({
                level: "info",
                data: chunk
            }, extra.sessionId);
        }
    });
    return { content: [{ type: 'text', text: 'Follow-up sent successfully. Check the logs above for details.' }] };
});
// Tool: create_subtask - Create child task under master orchestrator
server.tool('create_subtask', 'Create a child task under a master orchestrator. Allows masters to delegate work as subtasks.', {
    parent_attempt_id: zod_1.z.string().describe('Parent task attempt ID (the master orchestrator)'),
    title: zod_1.z.string().describe('Subtask title'),
    prompt: zod_1.z.string().describe('Subtask prompt/description'),
    executor: zod_1.z.string().optional().default('CLAUDE_CODE:DEFAULT').describe('Executor variant (e.g., "CLAUDE_CODE:wish", "CLAUDE_CODE:DEFAULT")')
}, async (args, extra) => {
    await (0, create_subtask_tool_js_1.executeCreateSubtaskTool)(args, {
        streamContent: async (chunk) => {
            await server.sendLoggingMessage({
                level: "info",
                data: chunk
            }, extra.sessionId);
        }
    });
    return { content: [{ type: 'text', text: 'Subtask created successfully. Check the logs above for details.' }] };
});
// ============================================================================
// DEPRECATED PROMPTS - Removed per Amendment: No Backwards Compatibility
// ============================================================================
// These prompts were removed because Genie does not maintain backwards compatibility.
// Users should use the new WebSocket-native tools instead:
//   - create_wish (replaces 'wish' prompt)
//   - run_forge (replaces 'forge' prompt)
//   - run_review (replaces 'review' prompt)
//   - transform_prompt (replaces 'prompt' prompt)
// Detect agent role (neuron architecture)
const roleInfo = (0, role_detector_js_1.detectGenieRole)();
const readOnly = (0, role_detector_js_1.isReadOnlyFilesystem)(roleInfo.role);
// Debug mode detection
const debugMode = process.env.MCP_DEBUG === '1' || process.env.DEBUG === '1';
// ============================================================================
// CLEANUP HANDLERS - Prevent zombie processes (Fix: MCP server proliferation)
// ============================================================================
let isShuttingDown = false;
let serverConnection = null; // Store server connection for cleanup
async function gracefulShutdown(signal) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    if (debugMode) {
        console.error(`\n📡 Received ${signal}, shutting down MCP server gracefully...`);
    }
    try {
        // Close server connection if exists
        if (serverConnection && typeof serverConnection.close === 'function') {
            await serverConnection.close();
        }
        // Give pending operations time to finish (max 2s)
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (debugMode) {
            console.error('✅ MCP server shutdown complete');
        }
    }
    catch (error) {
        console.error(`⚠️  Error during shutdown: ${error}`);
    }
    finally {
        process.exit(0);
    }
}
// Register signal handlers for all termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error(`❌ Uncaught exception: ${error.message}`);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
    console.error(`❌ Unhandled rejection: ${reason}`);
    gracefulShutdown('unhandledRejection');
});
// Start server with configured transport (only log in debug mode)
if (debugMode) {
    // Verbose startup logs (debug mode only)
    console.error('Starting Genie MCP Server (MVP)...');
    console.error(`Version: ${getGenieVersion()}`);
    console.error(`Transport: ${TRANSPORT}`);
    console.error(`Role: ${roleInfo.role} (${roleInfo.confidence} confidence, method: ${roleInfo.method})`);
    if (readOnly) {
        console.error('🔒 Filesystem: READ-ONLY (master orchestrator)');
    }
    if (roleInfo.branch) {
        console.error(`Branch: ${roleInfo.branch}`);
    }
    if (roleInfo.worktree) {
        console.error(`Worktree: ${roleInfo.worktree}`);
    }
    // Dynamically count tools instead of hardcoding
    const coreTools = ['list_agents', 'list_sessions', 'run', 'resume', 'view', 'stop', 'list_spells', 'read_spell', 'get_workspace_info'];
    const wsTools = ['create_wish', 'run_forge', 'run_review', 'transform_prompt'];
    const neuronTools = ['continue_task', 'create_subtask'];
    const totalTools = coreTools.length + wsTools.length + neuronTools.length;
    console.error(`Tools: ${totalTools} total`);
    console.error(`  - ${coreTools.length} core (agents, sessions, spells, workspace)`);
    console.error(`  - ${wsTools.length} WebSocket-native (create_wish, run_forge, run_review, transform_prompt)`);
    console.error(`  - ${neuronTools.length} neuron (continue_task, create_subtask)`);
    console.error('WebSocket: Real-time streaming enabled');
    console.error('');
}
// Check for existing server and cleanup orphans
(async () => {
    // Cleanup orphaned servers on startup
    const cleanupResult = await (0, process_cleanup_js_1.cleanupStaleMcpServers)({
        killOrphans: true,
        dryRun: false
    });
    if (debugMode && cleanupResult.orphans > 0) {
        console.error(`🧹 Cleaned up ${cleanupResult.killed} orphaned MCP server(s)`);
        if (cleanupResult.failed > 0) {
            console.error(`⚠️  Failed to kill ${cleanupResult.failed} process(es)`);
        }
    }
    // Check if another server is already running for this workspace
    const serverStatus = (0, process_cleanup_js_1.isServerAlreadyRunning)(WORKSPACE_ROOT);
    if (serverStatus.running) {
        console.error(`⚠️  MCP server already running (PID ${serverStatus.pid})`);
        console.error('   Kill the existing server first or check for stale PID file');
        process.exit(1);
    }
    // Write PID file for this instance
    (0, process_cleanup_js_1.writePidFile)(WORKSPACE_ROOT);
})();
// Forge sync (always show, one line)
process.stderr.write('🔄 Syncing agent profiles...');
// Sync agents before starting server (async but non-blocking)
// Note: forge-executor.ts handles the completion message, so we don't print anything here
syncAgentProfilesToForge()
    .then(() => {
    // forge-executor.ts already printed the completion message
    // No additional output needed (prevents duplicate checkmarks)
})
    .catch(err => {
    console.warn(`\n⚠️  Agent sync failed: ${err.message}`);
});
(async () => {
    if (TRANSPORT === 'stdio') {
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
        console.error('✅ Server started successfully (stdio)');
        console.error('Ready for Claude Desktop or MCP Inspector connections');
    }
    else if (TRANSPORT === 'httpStream' || TRANSPORT === 'http') {
        // HTTP Stream transport with OAuth2 authentication
        if (!oauth2Config) {
            console.error('❌ OAuth2 config not found. Cannot start HTTP server.');
            console.error('Run `genie mcp configure` to set up OAuth2.');
            process.exit(1);
        }
        if (debugMode) {
            console.error(`Starting Genie MCP Server v${getGenieVersion()} (HTTP Stream)...`);
            console.error(`Port: ${PORT}`);
        }
        // Use http-server.ts (Express + SDK StreamableHTTPServerTransport + OAuth)
        await (0, http_server_js_1.startHttpServer)({
            server,
            oauth2Config,
            port: PORT,
            onReady: (url) => {
                // http-server.ts already prints the success message
                // This callback is kept for backwards compatibility
            }
        });
    }
    else {
        console.error(`❌ Unknown transport type: ${TRANSPORT}`);
        console.error('Set MCP_TRANSPORT to "stdio" or "httpStream"');
        process.exit(1);
    }
})().catch((error) => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
});
function resolveCliInvocation() {
    const distEntry = path_1.default.join(WORKSPACE_ROOT, '.genie/cli/dist/genie-cli.js');
    if (fs_1.default.existsSync(distEntry)) {
        return { command: process.execPath, args: [distEntry] };
    }
    const localScript = path_1.default.join(WORKSPACE_ROOT, 'genie');
    if (fs_1.default.existsSync(localScript)) {
        return { command: localScript, args: [] };
    }
    return { command: 'npx', args: ['automagik-genie'] };
}
function quoteArg(value) {
    if (!value.length)
        return '""';
    if (/^[A-Za-z0-9._\-\/]+$/.test(value))
        return value;
    return '"' + value.replace(/"/g, '\\"') + '"';
}
function normalizeOutput(data) {
    if (data === undefined || data === null)
        return '';
    return typeof data === 'string' ? data : data.toString('utf8');
}
async function runCliCommand(subArgs, timeoutMs = 120000) {
    const invocation = resolveCliInvocation();
    const execArgs = [...invocation.args, ...subArgs];
    const commandLine = [invocation.command, ...execArgs.map(quoteArg)].join(' ');
    const options = {
        cwd: WORKSPACE_ROOT,
        maxBuffer: 10 * 1024 * 1024,
        timeout: timeoutMs
    };
    try {
        const { stdout, stderr } = await execFileAsync(invocation.command, execArgs, options);
        return {
            stdout: normalizeOutput(stdout),
            stderr: normalizeOutput(stderr),
            commandLine
        };
    }
    catch (error) {
        const err = error;
        const wrapped = new Error(err.message || 'CLI execution failed');
        wrapped.stdout = normalizeOutput(err.stdout);
        wrapped.stderr = normalizeOutput(err.stderr);
        wrapped.commandLine = commandLine;
        throw wrapped;
    }
}
function formatCliFailure(action, error) {
    const message = error instanceof Error ? error.message : String(error);
    const stdout = error && typeof error === 'object' ? error.stdout : '';
    const stderr = error && typeof error === 'object' ? error.stderr : '';
    const commandLine = error && typeof error === 'object' ? error.commandLine : '';
    const sections = [`Failed to ${action}:`, message];
    if (stdout) {
        sections.push(`Stdout:\n${stdout}`);
    }
    if (stderr) {
        sections.push(`Stderr:\n${stderr}`);
    }
    if (commandLine) {
        sections.push(`Command: ${commandLine}`);
    }
    return sections.join('\n\n');
}

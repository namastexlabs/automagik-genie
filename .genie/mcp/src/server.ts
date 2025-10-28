#!/usr/bin/env node
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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { transformDisplayPath } from './lib/display-transform.js';

// Extracted utilities (Amendment 10: File Size Discipline)
import {
  findWorkspaceRoot,
  listAgents,
  listSessions,
  getGenieVersion,
  getVersionHeader,
  syncAgentProfilesToForge,
  loadOAuth2Config
} from './lib/server-helpers.js';
import {
  listSpellsInDir,
  readSpellContent,
  normalizeSpellPath
} from './lib/spell-utils.js';
import {
  runCliCommand,
  formatCliFailure
} from './lib/cli-executor.js';

// Import WebSocket-native tools (MVP Phase 6)
import { wishToolSchema, executeWishTool } from './tools/wish-tool.js';
import { forgeToolSchema, executeForgeTool } from './tools/forge-tool.js';
import { reviewToolSchema, executeReviewTool } from './tools/review-tool.js';
import { promptToolSchema, executePromptTool } from './tools/prompt-tool.js';

// Import neuron architecture tools (Phase 2)
import { continueTaskToolSchema, executeContinueTaskTool } from './tools/continue-task-tool.js';
import { createSubtaskToolSchema, executeCreateSubtaskTool } from './tools/create-subtask-tool.js';

// Import role detection
import { detectGenieRole, isReadOnlyFilesystem } from './lib/role-detector.js';

// Import HTTP server for OAuth2 transport
import { startHttpServer } from './lib/http-server.js';
import { OAuth2Config } from './lib/oauth-provider.js';

const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 8885;
const TRANSPORT = process.env.MCP_TRANSPORT || 'stdio';

const WORKSPACE_ROOT = findWorkspaceRoot();

// Load OAuth2 config for HTTP transport
const oauth2Config = loadOAuth2Config(WORKSPACE_ROOT);
const serverUrl = `http://localhost:${PORT}`;

// Initialize MCP Server using official SDK
const server = new McpServer({
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
  const agents = listAgents(WORKSPACE_ROOT);

  if (agents.length === 0) {
    return { content: [{ type: 'text', text: getVersionHeader() + 'No agents found in .genie/code/agents or .genie/create/agents directories.' }] };
  }

  let response = getVersionHeader() + `Found ${agents.length} available agents:\n\n`;

  // Group by folder
  const grouped: Record<string, typeof agents> = {};
  agents.forEach(agent => {
    const key = agent.folder || 'core';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(agent);
  });

  Object.entries(grouped).forEach(([folder, folderAgents]) => {
    response += `**${folder}:**\n`;
    folderAgents.forEach(agent => {
      response += `  • ${agent.displayId}`;
      if (agent.name !== agent.displayId) response += ` (${agent.name})`;
      if (agent.description) response += ` - ${agent.description}`;
      response += '\n';
    });
    response += '\n';
  });

  response += '\nUse the "run" tool with an agent id and prompt to start an agent session.';

  return { content: [{ type: 'text', text: response }] };
});

// Tool: list_sessions - View active and recent sessions
server.tool('list_sessions', 'List active and recent Genie agent sessions. Shows session names, agents, status, and timing. Use this to find sessions to resume or view.', async () => {
  const sessions = await listSessions(WORKSPACE_ROOT);

  if (sessions.length === 0) {
    return { content: [{ type: 'text', text: getVersionHeader() + 'No sessions found. Start a new session with the "run" tool.' }] };
  }

  let response = getVersionHeader() + `Found ${sessions.length} session(s):\n\n`;

  sessions.forEach((session, index) => {
    const { displayId } = transformDisplayPath(session.agent);
    response += `${index + 1}. **${session.name}**\n`;
    response += `   Agent: ${displayId}\n`;
    response += `   Status: ${session.status}\n`;
    response += `   Created: ${session.created}\n`;
    response += `   Last Used: ${session.lastUsed}\n\n`;
  });

  response += 'Use "view" to see session transcript or "resume" to continue a session.';

  return { content: [{ type: 'text', text: response }] };
});

// Tool: run - Start a new agent session
server.tool('run', 'Start a new Genie agent session. Choose an agent (use list_agents first) and provide a detailed prompt describing the task. The agent will analyze, plan, or implement based on its specialization.', {
  agent: z.string().describe('Agent ID to run (e.g., "plan", "implementor", "debug"). Get available agents from list_agents tool.'),
  prompt: z.string().describe('Detailed task description for the agent. Be specific about goals, context, and expected outcomes. Agents work best with clear, actionable prompts.'),
  name: z.string().optional().describe('Friendly session name for easy identification (e.g., "bug-102-fix", "auth-feature"). If omitted, auto-generates: "{agent}-{timestamp}".')
}, async (args) => {
  try {
    // Agent alias mapping (Fix Bug #1: plan → wish/blueprint)
    const AGENT_ALIASES: Record<string, string> = {
      'plan': 'wish/blueprint',
      'discover': 'wish/discovery',
      'requirements': 'wish/requirements',
      'align': 'wish/alignment'
    };

    // Resolve alias if exists
    const resolvedAgent = AGENT_ALIASES[args.agent] || args.agent;

    // Early validation: Check if agent exists BEFORE trying to run
    const availableAgents = listAgents(WORKSPACE_ROOT);
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
    const { stdout, stderr } = await runCliCommand(cliArgs, 120000, WORKSPACE_ROOT);
    const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');

    const { displayId } = transformDisplayPath(resolvedAgent);
    const aliasNote = AGENT_ALIASES[args.agent] ? ` (alias: ${args.agent} → ${resolvedAgent})` : '';
    return { content: [{ type: 'text', text: getVersionHeader() + `Started agent session:\nAgent: ${displayId}${aliasNote}\n\n${output}\n\nUse list_sessions to see the session ID, then use view/resume/stop as needed.` }] };
  } catch (error: any) {
    return { content: [{ type: 'text', text: getVersionHeader() + formatCliFailure('start agent session', error) }] };
  }
});

// Tool: resume - Continue an existing session
server.tool('resume', 'Resume an existing agent session with a follow-up prompt. Use this to continue conversations, provide additional context, or ask follow-up questions to an agent.', {
  sessionId: z.string().describe('Session name to resume (get from list_sessions tool). Example: "146-session-name-architecture"'),
  prompt: z.string().describe('Follow-up message or question for the agent. Build on the previous conversation context.')
}, async (args) => {
  try {
    const cliArgs = ['resume', args.sessionId];
    if (args.prompt?.length) {
      cliArgs.push(args.prompt);
    }
    const { stdout, stderr } = await runCliCommand(cliArgs, 120000, WORKSPACE_ROOT);
    const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');

    return { content: [{ type: 'text', text: getVersionHeader() + `Resumed session ${args.sessionId}:\n\n${output}` }] };
  } catch (error: any) {
    return { content: [{ type: 'text', text: getVersionHeader() + formatCliFailure('resume session', error) }] };
  }
});

// Tool: view - View session transcript
server.tool('view', 'View the transcript of an agent session. Shows the conversation history, agent outputs, and any artifacts generated. Use full=true for complete transcript or false for recent messages only.', {
  sessionId: z.string().describe('Session name to view (get from list_sessions tool). Example: "146-session-name-architecture"'),
  full: z.boolean().optional().default(false).describe('Show full transcript (true) or recent messages only (false). Default: false.')
}, async (args) => {
  try {
    const cliArgs = ['view', args.sessionId];
    if (args.full) {
      cliArgs.push('--full');
    }
    const { stdout, stderr } = await runCliCommand(cliArgs, 30000);
    const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');

    return { content: [{ type: 'text', text: getVersionHeader() + `Session ${args.sessionId} transcript:\n\n${output}` }] };
  } catch (error: any) {
    return { content: [{ type: 'text', text: getVersionHeader() + formatCliFailure('view session', error) }] };
  }
});

// Tool: stop - Terminate a running session
server.tool('stop', 'Stop a running agent session. Use this to terminate long-running agents or cancel sessions that are no longer needed. The session state is preserved for later viewing.', {
  sessionId: z.string().describe('Session name to stop (get from list_sessions tool). Example: "146-session-name-architecture"')
}, async (args) => {
  try {
    const { stdout, stderr } = await runCliCommand(['stop', args.sessionId], 30000, WORKSPACE_ROOT);
    const output = stdout + (stderr ? `\n\nStderr:\n${stderr}` : '');

    return { content: [{ type: 'text', text: getVersionHeader() + `Stopped session ${args.sessionId}:\n\n${output}` }] };
  } catch (error: any) {
    return { content: [{ type: 'text', text: getVersionHeader() + formatCliFailure('stop session', error) }] };
  }
});

// Tool: list_spells - Discover available spells
server.tool('list_spells', 'List all available Genie spells (reusable knowledge patterns). Returns spells from .genie/spells/ (global), .genie/code/spells/ (code-specific), and .genie/create/spells/ (create-specific).', async () => {
  // Note: Scope parameter removed - always returns all spells for simplicity (avoids MCP schema validation issues)
  const scope = 'all';
  const result: any = {};

  // Global spells
  if (scope === 'all' || scope === 'global') {
    const globalSpellsDir = path.join(WORKSPACE_ROOT, '.genie', 'spells');
    result.global = listSpellsInDir(globalSpellsDir);
  }

  // Code spells
  if (scope === 'all' || scope === 'code') {
    const codeSpellsDir = path.join(WORKSPACE_ROOT, '.genie', 'code', 'spells');
    result.code = listSpellsInDir(codeSpellsDir);
  }

  // Create spells
  if (scope === 'all' || scope === 'create') {
    const createSpellsDir = path.join(WORKSPACE_ROOT, '.genie', 'create', 'spells');
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

// Tool: read_spell - Read specific spell content
server.tool('read_spell', 'Read the full content of a specific spell. Returns the spell content after the frontmatter (---). Use list_spells first to see available spells. Supports multiple path formats: "spells/learn.md", ".genie/spells/learn.md", "code/spells/debug.md", or just "learn" (searches all directories).', {
  spell_path: z.string().describe('Path to spell file. Flexible formats supported: "spells/learn.md" (recommended), ".genie/spells/learn.md" (auto-strips .genie/), "code/spells/debug.md", or just "learn" (auto-searches and adds .md extension)')
}, async (args) => {
  const normalizedPath = normalizeSpellPath(args.spell_path, WORKSPACE_ROOT);
  const fullPath = path.join(WORKSPACE_ROOT, '.genie', normalizedPath);

  try {
    const content = readSpellContent(fullPath);
    return { content: [{ type: 'text', text: getVersionHeader() + `# Spell: ${normalizedPath}\n\n${content}` }] };
  } catch (error: any) {
    return { content: [{ type: 'text', text: getVersionHeader() + `Error reading spell: ${error.message}` }] };
  }
});

// Workflows have been merged into spells - no separate workflow tools needed

// Tool: get_workspace_info - Get workspace metadata (lean self-awareness data)
server.tool('get_workspace_info', 'Get essential workspace info for agent self-awareness: project name, tech stack, current branch, and available commands. Lightweight context for agents to understand their environment.', async () => {
  try {
    // Extract essential data only (no bloat)
    const workspaceInfo: any = {};

    // 1. Project name (from package.json or directory name)
    const packageJsonPath = path.join(WORKSPACE_ROOT, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      workspaceInfo.project = pkg.name || path.basename(WORKSPACE_ROOT);
    } else {
      workspaceInfo.project = path.basename(WORKSPACE_ROOT);
    }

    // 2. Tech stack (runtime, language, package manager)
    workspaceInfo.techStack = {};
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      workspaceInfo.techStack.runtime = 'Node.js';
      workspaceInfo.techStack.packageManager = fs.existsSync(path.join(WORKSPACE_ROOT, 'pnpm-lock.yaml')) ? 'pnpm' :
                                               fs.existsSync(path.join(WORKSPACE_ROOT, 'yarn.lock')) ? 'yarn' : 'npm';

      // Detect language from dependencies
      if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) {
        workspaceInfo.techStack.language = 'TypeScript';
      } else {
        workspaceInfo.techStack.language = 'JavaScript';
      }
    }

    // 3. Current branch (from git)
    try {
      const { execSync } = require('child_process');
      const branch = execSync('git branch --show-current', { cwd: WORKSPACE_ROOT, encoding: 'utf-8' }).trim();
      workspaceInfo.currentBranch = branch || 'unknown';
    } catch {
      workspaceInfo.currentBranch = 'unknown';
    }

    // 4. Available commands (from package.json scripts)
    workspaceInfo.commands = {};
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
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
  } catch (error: any) {
    return { content: [{ type: 'text', text: getVersionHeader() + `Error gathering workspace info: ${error.message}` }] };
  }
});

// ============================================================================
// WEBSOCKET-NATIVE TOOLS (MVP Phase 6) - Real-time streaming + git validation
// ============================================================================

// Tool: create_wish - Create wish with GitHub issue enforcement (WebSocket streaming)
(server.tool as any)('create_wish', 'Create a wish with GitHub issue enforcement (Amendment 1) and real-time progress via WebSocket. Git working tree must be clean and pushed.', {
  feature: z.string().describe('What you want to build'),
  github_issue: z.number().describe('GitHub issue number (required per Amendment 1)')
}, {
  streamingHint: true
}, async (args: any, extra: any) => {
  // Use official MCP SDK logging for real-time streaming
  await executeWishTool(args, {
    streamContent: async (chunk: string) => {
      // Stream content via MCP logging notifications
      await server.sendLoggingMessage({
        level: "info",
        data: chunk
      }, extra.sessionId);
    },
    reportProgress: async (current: number, total: number) => {
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
(server.tool as any)('run_forge', 'Kick off a Forge task with specified agent and stream live code changes via WebSocket. Git working tree must be clean and pushed.', {
  prompt: z.string().describe('Task prompt (e.g., "Fix bug in login flow")'),
  agent: z.string().describe('Agent to use (e.g., "implementor", "tests", "polish")'),
  project_id: z.string().optional().describe('Project ID (defaults to current Genie project)')
}, {
  streamingHint: true
}, async (args: any, extra: any) => {
  // Use official MCP SDK logging for real-time streaming
  await executeForgeTool(args, {
    streamContent: async (chunk: string) => {
      // Stream content via MCP logging notifications
      await server.sendLoggingMessage({
        level: "info",
        data: chunk
      }, extra.sessionId);
    },
    reportProgress: async (current: number, total: number) => {
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
(server.tool as any)('run_review', 'Review a wish document with an agent and stream live feedback via WebSocket. Git working tree must be clean and pushed.', {
  wish_name: z.string().describe('Wish name (e.g., "genie-mcp-mvp")'),
  agent: z.string().optional().default('review').describe('Agent to use (default: "review")'),
  project_id: z.string().optional().describe('Project ID (defaults to current Genie project)')
}, {
  streamingHint: true
}, async (args: any, extra: any) => {
  // Use official MCP SDK logging for real-time streaming
  await executeReviewTool(args, {
    streamContent: async (chunk: string) => {
      // Stream content via MCP logging notifications
      await server.sendLoggingMessage({
        level: "info",
        data: chunk
      }, extra.sessionId);
    },
    reportProgress: async (current: number, total: number) => {
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
(server.tool as any)('transform_prompt', 'Transform/enhance a prompt using an agent synchronously. Runs in current workspace (no worktree). Modern equivalent of old "background off" mode.', {
  prompt: z.string().describe('Prompt to transform/enhance (e.g., "Help me write a better prompt for implementing dark mode")'),
  agent: z.string().optional().default('prompt').describe('Agent to use for transformation (default: "prompt")')
}, {
  readOnlyHint: true
}, async (args: any, extra: any) => {
  // Use official MCP SDK logging for real-time streaming
  await executePromptTool(args, {
    streamContent: async (chunk: string) => {
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
(server.tool as any)('continue_task', 'Send follow-up work to an existing task attempt. Used primarily by master orchestrators to receive new work.', {
  attempt_id: z.string().describe('Task attempt ID to send work to'),
  prompt: z.string().describe('Follow-up prompt with new work')
}, async (args: any, extra: any) => {
  await executeContinueTaskTool(args, {
    streamContent: async (chunk: any) => {
      await server.sendLoggingMessage({
        level: "info",
        data: chunk
      }, extra.sessionId);
    }
  });
  return { content: [{ type: 'text', text: 'Follow-up sent successfully. Check the logs above for details.' }] };
});

// Tool: create_subtask - Create child task under master orchestrator
(server.tool as any)('create_subtask', 'Create a child task under a master orchestrator. Allows masters to delegate work as subtasks.', {
  parent_attempt_id: z.string().describe('Parent task attempt ID (the master orchestrator)'),
  title: z.string().describe('Subtask title'),
  prompt: z.string().describe('Subtask prompt/description'),
  executor: z.string().optional().default('CLAUDE_CODE:DEFAULT').describe('Executor variant (e.g., "CLAUDE_CODE:wish", "CLAUDE_CODE:DEFAULT")')
}, async (args: any, extra: any) => {
  await executeCreateSubtaskTool(args, {
    streamContent: async (chunk: any) => {
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
const roleInfo = detectGenieRole();
const readOnly = isReadOnlyFilesystem(roleInfo.role);

// Start server with configured transport
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
console.error('🔄 Syncing agent profiles to Forge...');

// Sync agents before starting server (async but non-blocking)
syncAgentProfilesToForge(WORKSPACE_ROOT).catch(err => {
  console.warn(`⚠️  Background agent sync failed: ${err.message}`);
});

(async () => {
  if (TRANSPORT === 'stdio') {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ Server started successfully (stdio)');
    console.error('Ready for Claude Desktop or MCP Inspector connections');
  } else if (TRANSPORT === 'httpStream' || TRANSPORT === 'http') {
    // HTTP Stream transport with OAuth2 authentication
    if (!oauth2Config) {
      console.error('❌ OAuth2 config not found. Cannot start HTTP server.');
      console.error('Run `genie mcp configure` to set up OAuth2.');
      process.exit(1);
    }

    console.error(`Starting Genie MCP Server v${getGenieVersion()} (HTTP Stream)...`);
    console.error(`Port: ${PORT}`);

    // Use http-server.ts (Express + SDK StreamableHTTPServerTransport + OAuth)
    await startHttpServer({
      server,
      oauth2Config,
      port: PORT,
      onReady: (url) => {
        console.error('✅ Server started successfully (HTTP Stream)');
        console.error(`   HTTP Stream: ${url}/mcp`);
        console.error(`   SSE Stream:  ${url}/mcp (GET)`);
        console.error(`   Health:      ${url}/health`);
        console.error(`   OAuth Token: ${url}/oauth/token`);
        console.error(`   OAuth Meta:  ${url}/.well-known/oauth-protected-resource`);
        console.error('');
        console.error('🔐 Authentication: OAuth2.1 Client Credentials');
        console.error(`   ├─ Client ID:     ${oauth2Config.clientId}`);
        console.error(`   ├─ Token Expiry:  ${oauth2Config.tokenExpiry}s`);
        console.error(`   └─ Issuer:        ${oauth2Config.issuer}`);
        console.error('');
        console.error('📡 Transport: Streamable HTTP (MCP SDK official)');
        console.error('   ├─ POST /mcp → JSON-RPC over HTTP');
        console.error('   └─ GET  /mcp → Server-Sent Events (SSE) for streaming');
      }
    });
  } else {
    console.error(`❌ Unknown transport type: ${TRANSPORT}`);
    console.error('Set MCP_TRANSPORT to "stdio" or "httpStream"');
    process.exit(1);
  }
})().catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Genie MCP Server - Using FastMCP
 * Implements Model Context Protocol tools for Genie agent orchestration
 *
 * Zero duplication: Reuses cli-core handlers for all operations
 */

import { FastMCP } from 'fastmcp';
import { z } from 'zod';

const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 8080;

// Initialize FastMCP server
const server = new FastMCP({
  name: 'genie-mcp-server',
  version: '0.1.0'
});

// Tool: genie_run - Start new agent session
server.addTool({
  name: 'genie_run',
  description: 'Start a new Genie agent session with the specified agent and prompt',
  parameters: z.object({
    agent: z.string().describe('Agent name or ID (e.g., "plan", "implementor", "qa")'),
    prompt: z.string().describe('Initial prompt for the agent')
  }),
  execute: async (args) => {
    // TODO: Integrate with cli-core createHandlers().run when extraction complete
    return `Tool stub: Would run agent "${args.agent}" with prompt "${args.prompt.substring(0, 50)}..."\n\nFull implementation pending cli-core handler completion.`;
  }
});

// Tool: genie_resume - Continue existing session
server.addTool({
  name: 'genie_resume',
  description: 'Resume an existing Genie session with additional prompt',
  parameters: z.object({
    sessionId: z.string().describe('Session ID to resume'),
    prompt: z.string().describe('Follow-up prompt')
  }),
  execute: async (args) => {
    return `Tool stub: Would resume session ${args.sessionId} with prompt "${args.prompt.substring(0, 50)}..."\n\nFull implementation pending cli-core handler completion.`;
  }
});

// Tool: genie_list_agents - List available agents
server.addTool({
  name: 'genie_list_agents',
  description: 'List all available Genie agents from .genie/agents directory',
  parameters: z.object({}),
  execute: async () => {
    return `Tool stub: Would list available agents.\n\nFull implementation pending cli-core handler completion.`;
  }
});

// Tool: genie_list_sessions - List sessions
server.addTool({
  name: 'genie_list_sessions',
  description: 'List active and recent Genie sessions',
  parameters: z.object({}),
  execute: async () => {
    return `Tool stub: Would list active and recent sessions.\n\nFull implementation pending cli-core handler completion.`;
  }
});

// Tool: genie_view - View session transcript
server.addTool({
  name: 'genie_view',
  description: 'View transcript for a Genie session',
  parameters: z.object({
    sessionId: z.string().describe('Session ID to view'),
    full: z.boolean().optional().describe('Show full transcript (default: recent messages only)')
  }),
  execute: async (args) => {
    return `Tool stub: Would view session ${args.sessionId} (full: ${args.full || false}).\n\nFull implementation pending cli-core handler completion.`;
  }
});

// Tool: genie_stop - Stop running session
server.addTool({
  name: 'genie_stop',
  description: 'Stop a running Genie session',
  parameters: z.object({
    sessionId: z.string().describe('Session ID to stop')
  }),
  execute: async (args) => {
    return `Tool stub: Would stop session ${args.sessionId}.\n\nFull implementation pending cli-core handler completion.`;
  }
});

// Start server with HTTP streaming
console.log('Starting Genie MCP Server...');
console.log(`Port: ${PORT}`);
console.log('Protocol: MCP (Model Context Protocol)');
console.log('Implementation: FastMCP v3.18.0');
console.log('Tools: 6 (genie_run, genie_resume, genie_list_agents, genie_list_sessions, genie_view, genie_stop)');

server.start({
  transportType: 'httpStream',
  httpStream: {
    port: PORT
  }
});

console.log(`✅ Server started successfully`);
console.log(`HTTP Stream: http://localhost:${PORT}/mcp`);
console.log(`SSE: http://localhost:${PORT}/sse`);

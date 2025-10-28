"use strict";
/**
 * Forge Tool - Kick off Forge task with agent and stream execution
 *
 * Uses diff WebSocket streaming for real-time code change monitoring
 * Provides complete data link tracking for traceability
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgeToolSchema = void 0;
exports.executeForgeTool = executeForgeTool;
const zod_1 = require("zod");
const websocket_manager_js_1 = require("../websocket-manager.js");
const git_validation_js_1 = require("../lib/git-validation.js");
const url_shortener_js_1 = require("../lib/url-shortener.js");
const session_manager_js_1 = require("../lib/session-manager.js");
const path_1 = __importDefault(require("path"));
// Load ForgeClient from Genie package root (not user's cwd)
// The MCP server is at: <genie-package>/.genie/mcp/dist/tools/forge-tool.js
// forge.js is at: <genie-package>/forge.js
// So we need to go up 4 levels: tools -> dist -> mcp -> .genie -> root
const geniePackageRoot = path_1.default.resolve(__dirname, '../../../..');
const ForgeClient = require(path_1.default.join(geniePackageRoot, 'forge.js')).ForgeClient;
const FORGE_URL = process.env.FORGE_BASE_URL || 'http://localhost:8887';
const DEFAULT_PROJECT_ID = 'ee8f0a72-44da-411d-a23e-f2c6529b62ce'; // Genie project ID
/**
 * Forge tool parameters
 */
exports.forgeToolSchema = zod_1.z.object({
    prompt: zod_1.z.string().describe('Task prompt (e.g., "Fix bug in login flow")'),
    agent: zod_1.z.string().describe('Agent to use (e.g., "implementor", "tests", "polish")'),
    project_id: zod_1.z.string().optional().describe('Project ID (defaults to current Genie project)')
});
/**
 * Forge tool execution
 */
async function executeForgeTool(args, context) {
    const { streamContent, reportProgress } = context;
    // Step -1: Detect project from worktree (prevent duplicate projects)
    const forgeClient = new ForgeClient(FORGE_URL);
    const detectedProjectId = await (0, git_validation_js_1.detectProjectFromWorktree)(forgeClient);
    // Use detected project if in worktree, otherwise use provided or default
    const projectId = detectedProjectId || args.project_id || DEFAULT_PROJECT_ID;
    if (detectedProjectId) {
        await streamContent({
            type: 'text',
            text: `📍 Detected worktree project: ${detectedProjectId}\n\n`
        });
    }
    // Step 0: Validate git state (CRITICAL: Agents in separate worktrees need clean state)
    await streamContent({
        type: 'text',
        text: `🔍 Checking git working tree state...\n`
    });
    const gitCheck = (0, git_validation_js_1.checkGitState)();
    if (!gitCheck.isClean) {
        await streamContent({
            type: 'text',
            text: `\n${(0, git_validation_js_1.formatGitStateError)(gitCheck)}`
        });
        throw new Error('Git working tree is not clean - cannot start agent');
    }
    await streamContent({
        type: 'text',
        text: `✅ Git working tree is clean and pushed\n\n`
    });
    if (reportProgress) {
        await reportProgress(1, 5);
    }
    // Step 0.5: Check for existing session (Phase 2: Session reuse)
    const existingSession = await session_manager_js_1.sessionManager.getSession('forge', projectId);
    if (existingSession) {
        // Reuse existing session via follow-up
        await streamContent({
            type: 'text',
            text: `🔄 Reusing existing forge session...\n` +
                `   Task: ${existingSession.taskId}\n` +
                `   Attempt: ${existingSession.attemptId}\n\n`
        });
        try {
            await session_manager_js_1.sessionManager.delegateToMaster(existingSession.attemptId, `Follow-up forge request:\nAgent: ${args.agent}\nPrompt: ${args.prompt}`);
            await streamContent({
                type: 'text',
                text: `✅ Follow-up sent to existing session\n\n`
            });
            // Return existing session URL
            const { shortUrl } = await (0, url_shortener_js_1.shortenUrl)(existingSession.url, {
                apiKey: (0, url_shortener_js_1.getApiKeyFromEnv)()
            });
            await streamContent({
                type: 'text',
                text: `🌐 Monitor Progress:\n${shortUrl || existingSession.url}\n\n` +
                    `💡 Genie Tips:\n` +
                    `  - This is THE forge master (reused from previous call)\n` +
                    `  - All forge work happens in this single task\n` +
                    `  - Session maintained for conversation continuity\n`
            });
            return;
        }
        catch (error) {
            // Follow-up failed, create new master
            await streamContent({
                type: 'text',
                text: `⚠️  Follow-up failed: ${error.message}\n` +
                    `   Creating new master...\n\n`
            });
        }
    }
    // Step 1: Create Forge task (new master orchestrator)
    await streamContent({
        type: 'text',
        text: `🚀 Starting Forge task with agent: ${args.agent}\n\n`
    });
    let taskResult;
    try {
        taskResult = await forgeClient.createAndStartTask({
            task: {
                project_id: projectId,
                title: `Forge: ${args.prompt}`,
                description: `Agent: ${args.agent}\n\nPrompt: ${args.prompt}`
            },
            executor_profile_id: {
                executor: 'CLAUDE_CODE',
                variant: 'neuron-forge'
            },
            base_branch: 'dev'
        });
    }
    catch (error) {
        await streamContent({
            type: 'text',
            text: `❌ Failed to create Forge task: ${error.message}\n`
        });
        throw error;
    }
    const taskId = taskResult.task?.id || 'unknown';
    const attemptId = taskResult.task_attempt?.id || 'unknown';
    await streamContent({
        type: 'text',
        text: `✅ Forge task created: ${taskId}\n` +
            `✅ Task attempt started: ${attemptId}\n\n`
    });
    if (reportProgress) {
        await reportProgress(2, 5);
    }
    // Session will be automatically discovered on next call (Forge-backed)
    const fullUrl = `${FORGE_URL}/projects/${projectId}/tasks/${taskId}/attempts/${attemptId}?view=diffs`;
    // Step 2: Subscribe to diff WebSocket stream
    await streamContent({
        type: 'text',
        text: `📊 Watching execution via diff stream...\n\n`
    });
    const wsUrl = forgeClient.getTaskDiffStreamUrl(attemptId, false);
    let diffCount = 0;
    const subscriptionId = websocket_manager_js_1.wsManager.subscribe(wsUrl, async (data) => {
        diffCount++;
        // Format diff data
        if (data.file) {
            await streamContent({
                type: 'text',
                text: `  📝 File changed: ${data.file} `
            });
            if (data.additions !== undefined && data.deletions !== undefined) {
                await streamContent({
                    type: 'text',
                    text: `(+${data.additions}, -${data.deletions})\n`
                });
            }
            else {
                await streamContent({
                    type: 'text',
                    text: '\n'
                });
            }
        }
        else {
            // Generic update
            await streamContent({
                type: 'text',
                text: `  📨 Diff update #${diffCount}\n`
            });
        }
        if (reportProgress && diffCount <= 3) {
            await reportProgress(2 + diffCount, 5);
        }
    }, async (error) => {
        await streamContent({
            type: 'text',
            text: `⚠️  WebSocket error: ${error.message}\n`
        });
    });
    // Wait for task to run and stream diffs
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
    // Unsubscribe from WebSocket
    websocket_manager_js_1.wsManager.unsubscribe(subscriptionId);
    if (reportProgress) {
        await reportProgress(5, 5);
    }
    // Step 3: Output completion
    await streamContent({
        type: 'text',
        text: `\n✅ Task execution monitoring complete!\n\n`
    });
    // Step 4: Output data links
    await streamContent({
        type: 'text',
        text: `🔗 Data Links:\n` +
            `  Forge Task: ${taskId}\n` +
            `  Forge Attempt: ${attemptId}\n` +
            `  Agent: ${args.agent}\n` +
            `  Project: ${projectId}\n\n`
    });
    // Step 5: Output human-visible URL (shortened if service available)
    const { shortUrl } = await (0, url_shortener_js_1.shortenUrl)(fullUrl, {
        apiKey: (0, url_shortener_js_1.getApiKeyFromEnv)()
    });
    await streamContent({
        type: 'text',
        text: `🌐 Monitor Progress:\n` +
            `${shortUrl || fullUrl}\n\n`
    });
    // Step 6: Genie self-guidance tips
    await streamContent({
        type: 'text',
        text: `💡 Genie Tips:\n` +
            `  - User can watch live code changes at Forge URL above\n` +
            `  - This task is running independently (no wish linkage)\n` +
            `  - Agent ${args.agent} will handle the implementation\n` +
            `  - Task will continue running in background (monitored ${diffCount} file changes)\n` +
            `  - Use the Forge URL to see full execution history and logs\n`
    });
}

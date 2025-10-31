/**
 * Review Tool - Review wish/task with agent and stream feedback
 *
 * Uses log WebSocket streaming for real-time review comments
 * Links to wish files and provides complete data link tracking
 */

import { z } from 'zod';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { wsManager } from '../websocket-manager.js';
import { checkGitState, formatGitStateError } from '../lib/git-validation.js';
import { shortenUrl, getApiKeyFromEnv } from '../lib/url-shortener.js';
import { sessionManager } from '../lib/session-manager.js';
import { getOrCreateGenieProject } from '../lib/project-detector.js';

// Load ForgeClient from Genie package root (not user's cwd)
// The MCP server is at: <genie-package>/.genie/mcp/dist/tools/review-tool.js
// forge.js is at: <genie-package>/forge.js
// So we need to go up 4 levels: tools -> dist -> mcp -> .genie -> root
const geniePackageRoot = path.resolve(__dirname, '../../../..');
const ForgeClient = require(path.join(geniePackageRoot, 'forge.js')).ForgeClient;

// User's workspace root (for reading wish files)
const workspaceRoot = process.cwd();

const FORGE_URL = process.env.FORGE_BASE_URL || 'http://localhost:8887';

/**
 * Review tool parameters
 */
export const reviewToolSchema = z.object({
  wish_name: z.string().describe('Wish name (e.g., "genie-mcp-mvp")'),
  agent: z.string().optional().default('review').describe('Agent to use (default: "review")')
});

export type ReviewToolParams = z.infer<typeof reviewToolSchema>;

/**
 * Review tool execution
 */
export async function executeReviewTool(
  args: ReviewToolParams,
  context: any
): Promise<void> {
  const { streamContent, reportProgress } = context;
  const agent = args.agent || 'review';

  // Step -1: Detect or create project automatically by git repo path
  const forgeClient = new ForgeClient(FORGE_URL);
  const projectId = await getOrCreateGenieProject(forgeClient);

  // Step 0: Validate git state (CRITICAL: Agents in separate worktrees need clean state)
  await streamContent({
    type: 'text',
    text: `🔍 Checking git working tree state...\n`
  });

  const gitCheck = checkGitState();

  if (!gitCheck.isClean) {
    await streamContent({
      type: 'text',
      text: `\n${formatGitStateError(gitCheck)}`
    });
    throw new Error('Git working tree is not clean - cannot start agent');
  }

  await streamContent({
    type: 'text',
    text: `✅ Git working tree is clean and pushed\n\n`
  });

  // Step 1: Load wish document
  await streamContent({
    type: 'text',
    text: `📖 Loading wish: ${args.wish_name}\n\n`
  });

  const wishFile = path.join(workspaceRoot, `.genie/wishes/${args.wish_name}/${args.wish_name}-wish.md`);

  if (!fs.existsSync(wishFile)) {
    await streamContent({
      type: 'text',
      text: `❌ Wish file not found: ${wishFile}\n\n` +
        `⚠️  Please check the wish name and ensure the wish file exists.\n`
    });
    throw new Error(`Wish file not found: ${wishFile}`);
  }

  const wishContent = fs.readFileSync(wishFile, 'utf-8');

  await streamContent({
    type: 'text',
    text: `✅ Wish file loaded: ${wishFile}\n` +
      `   Size: ${wishContent.length} bytes\n\n`
  });

  if (reportProgress) {
    await reportProgress(1, 5);
  }

  // Step 1.5: Check for existing session (Phase 2: Session reuse)
  const existingSession = await sessionManager.getSession('review', projectId);

  if (existingSession) {
    // Reuse existing session via follow-up
    await streamContent({
      type: 'text',
      text: `🔄 Reusing existing review session...\n` +
        `   Task: ${existingSession.taskId}\n` +
        `   Attempt: ${existingSession.attemptId}\n\n`
    });

    try {
      await sessionManager.delegateToMaster(
        existingSession.attemptId,
        `Follow-up review request:\nWish: ${args.wish_name}\nAgent: ${agent}\n\n---\n\n${wishContent.substring(0, 1000)}...`
      );

      await streamContent({
        type: 'text',
        text: `✅ Follow-up sent to existing session\n\n`
      });

      // Return existing session URL
      const { shortUrl } = await shortenUrl(existingSession.url, {
        apiKey: getApiKeyFromEnv()
      });

      await streamContent({
        type: 'text',
        text: `🌐 Monitor Progress:\n${shortUrl || existingSession.url}\n\n` +
          `💡 Genie Tips:\n` +
          `  - This is THE review master (reused from previous call)\n` +
          `  - All review work happens in this single task\n` +
          `  - Session maintained for conversation continuity\n`
      });

      return;
    } catch (error: any) {
      // Follow-up failed, create new master
      await streamContent({
        type: 'text',
        text: `⚠️  Follow-up failed: ${error.message}\n` +
          `   Creating new master...\n\n`
      });
    }
  }

  // Step 2: Create review task (new session)
  await streamContent({
    type: 'text',
    text: `🔍 Starting review with agent: ${agent}\n\n`
  });

  // Detect current git branch (same logic as other neuron tools)
  let baseBranch = 'main'; // Default fallback
  try {
    baseBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'] // Suppress stderr
    }).trim();
  } catch (error) {
    // If git detection fails, try to get default_base_branch from project
    try {
      const project = await forgeClient.getProject(projectId);
      if (project.default_base_branch) {
        baseBranch = project.default_base_branch;
      }
    } catch {
      // Use fallback 'main'
    }
  }

  let taskResult;
  try {
    taskResult = await forgeClient.createAndStartTask({
      task: {
        project_id: projectId,
        title: `Review: ${args.wish_name}`,
        description: `Review wish document\n\nWish: ${args.wish_name}\nAgent: ${agent}\n\n---\n\n${wishContent.substring(0, 1000)}...`
      },
      executor_profile_id: {
        executor: 'CLAUDE_CODE',
        variant: 'REVIEW' // Neuron orchestrator variant
      },
      base_branch: baseBranch
    });
  } catch (error: any) {
    await streamContent({
      type: 'text',
      text: `❌ Failed to create review task: ${error.message}\n`
    });
    throw error;
  }

  const taskId = taskResult.task?.id || 'unknown';
  const attemptId = taskResult.task_attempt?.id || 'unknown';

  await streamContent({
    type: 'text',
    text: `✅ Review task created: ${taskId}\n` +
      `✅ Task attempt started: ${attemptId}\n\n`
  });

  if (reportProgress) {
    await reportProgress(2, 5);
  }

  // Session will be automatically discovered on next call (Forge-backed)
  const fullUrl = `${FORGE_URL}/projects/${projectId}/tasks/${taskId}/attempts/${attemptId}?view=logs`;

  // Step 3: Subscribe to logs WebSocket stream
  await streamContent({
    type: 'text',
    text: `📊 Watching review via logs stream...\n\n`
  });

  // Get the first execution process ID
  let processId: string | undefined;
  try {
    const attempt = await forgeClient.getTaskAttempt(attemptId);
    if (attempt.execution_processes && attempt.execution_processes.length > 0) {
      processId = attempt.execution_processes[0].id;
    }
  } catch (error: any) {
    await streamContent({
      type: 'text',
      text: `⚠️  Could not get execution process ID: ${error.message}\n`
    });
  }

  let logCount = 0;

  if (processId) {
    const wsUrl = forgeClient.getNormalizedLogsStreamUrl(processId);

    const subscriptionId = wsManager.subscribe(
      wsUrl,
      async (data: any) => {
        logCount++;

        // Format log data (basic)
        await streamContent({
          type: 'text',
          text: `  🤖 Agent feedback #${logCount}\n`
        });

        if (reportProgress && logCount <= 3) {
          await reportProgress(2 + logCount, 5);
        }
      },
      async (error: Error) => {
        await streamContent({
          type: 'text',
          text: `⚠️  WebSocket error: ${error.message}\n`
        });
      }
    );

    // Wait for review to run
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

    // Unsubscribe from WebSocket
    wsManager.unsubscribe(subscriptionId);
  } else {
    await streamContent({
      type: 'text',
      text: `⚠️  No execution process found yet. Review is starting...\n\n`
    });

    // Wait without WebSocket
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  if (reportProgress) {
    await reportProgress(5, 5);
  }

  // Step 4: Output completion
  await streamContent({
    type: 'text',
    text: `\n✅ Review monitoring complete!\n\n`
  });

  // Step 5: Output data links
  await streamContent({
    type: 'text',
    text: `🔗 Data Links:\n` +
      `  Wish File: ${wishFile}\n` +
      `  Forge Task: ${taskId}\n` +
      `  Forge Attempt: ${attemptId}\n` +
      `  Agent: ${agent}\n` +
      (processId ? `  Process: ${processId}\n` : '') + `\n`
  });

  // Step 6: Output human-visible URL (shortened if service available)
  const { shortUrl } = await shortenUrl(fullUrl, {
    apiKey: getApiKeyFromEnv()
  });

  await streamContent({
    type: 'text',
    text: `🌐 Monitor Progress:\n` +
      `${shortUrl || fullUrl}\n\n`
  });

  // Step 7: Check for missing links
  await streamContent({
    type: 'text',
    text: `⚠️  Data Link Check:\n` +
      `  ✅ Wish File: ${wishFile} (exists)\n` +
      `  ✅ Review Task: ${taskId} (created)\n` +
      `  ✅ Forge Attempt: ${attemptId} (started)\n` +
      `  ⚠️  GitHub Issue: not verified (consider linking wish to issue)\n\n`
  });

  // Step 8: Genie self-guidance tips
  await streamContent({
    type: 'text',
    text: `💡 Genie Tips:\n` +
      `  - User can view review feedback at Forge URL above\n` +
      `  - Review agent (${agent}) will analyze wish completeness and code quality\n` +
      `  - Consider creating GitHub issue if wish doesn't have one yet (Amendment 1)\n` +
      `  - Task will continue running in background (monitored ${logCount} log updates)\n` +
      `  - Use the Forge URL to see full review report and feedback\n`
  });
}

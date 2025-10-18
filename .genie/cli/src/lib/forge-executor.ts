/**
 * ForgeExecutor - Proof of Concept
 *
 * Replaces background-launcher.ts polling timeout race condition with
 * Forge's guaranteed task attempt creation and real-time WebSocket streaming.
 *
 * Key improvements:
 * 1. No polling timeout race (createTaskAttempt is atomic)
 * 2. Worktree isolation (parallel safety)
 * 3. Real-time log streaming (WebSocket, not file polling)
 * 4. Native session resume (followUpTaskAttempt)
 * 5. Unified session model (Forge task attempts = sessions)
 */

import type { SessionEntry, SessionStore } from '../session-store';
import type { GenieConfig, ConfigPaths } from './types';
import { saveSessions } from '../session-store';

// Import ForgeClient from root
import { ForgeClient } from '../../../../forge';

export interface ForgeExecutorConfig {
  forgeBaseUrl: string;
  forgeToken?: string;
  genieProjectId?: string; // Optional: pre-created project for Genie sessions
}

export interface CreateSessionParams {
  agentName: string;
  prompt: string;
  config: GenieConfig;
  paths: Required<ConfigPaths>;
  store: SessionStore;
  entry: SessionEntry;
  executorKey: string;
  executionMode: string;
  startTime: number;
}

/**
 * ForgeExecutor - Main class for Forge backend integration
 */
export class ForgeExecutor {
  private forge: ForgeClient;
  private config: ForgeExecutorConfig;

  constructor(config: ForgeExecutorConfig) {
    this.config = config;
    this.forge = new ForgeClient(config.forgeBaseUrl, config.forgeToken);
  }

  /**
   * Create a new Genie session via Forge task attempt
   *
   * Replaces background-launcher.ts:maybeHandleBackgroundLaunch
   *
   * @returns Task attempt ID (this IS the session ID)
   */
  async createSession(params: CreateSessionParams): Promise<string> {
    const {
      agentName,
      prompt,
      config,
      paths,
      store,
      entry,
      executorKey,
      executionMode,
      startTime
    } = params;

    // Get or create Genie project
    const projectId = await this.getOrCreateGenieProject();

    process.stdout.write(`▸ Creating Forge task for ${agentName}...\n`);

    // Create task + start attempt (all-in-one atomic operation)
    // No polling timeout race - this either succeeds or throws error
    const attempt = await this.forge.createAndStartTask(projectId, {
      title: `Genie: ${agentName} (${executionMode})`,
      description: prompt,
      executor_profile_id: this.mapExecutorToProfile(executorKey),
      base_branch: 'main', // TODO: Make configurable
    });

    process.stdout.write(`▸ Task attempt created: ${attempt.id}\n`);
    process.stdout.write(`▸ Worktree: ${this.getWorktreePath(attempt.id)}\n`);
    process.stdout.write(`▸ Branch: ${this.getBranchName(attempt.id)}\n\n`);

    // Update session entry
    entry.sessionId = attempt.id;
    entry.status = 'running';
    entry.background = true;
    entry.created = new Date(startTime).toISOString();
    entry.lastUsed = new Date().toISOString();

    // Save to session store
    saveSessions(paths, store);

    // Display usage instructions
    this.displaySessionInfo(attempt.id, agentName);

    return attempt.id;
  }

  /**
   * Resume an existing session with follow-up prompt
   *
   * Replaces re-spawning genie.js with new prompt
   */
  async resumeSession(sessionId: string, followUpPrompt: string): Promise<void> {
    process.stdout.write(`▸ Resuming session ${sessionId}...\n`);

    await this.forge.followUpTaskAttempt(sessionId, followUpPrompt);

    process.stdout.write(`▸ Follow-up prompt sent\n`);
    process.stdout.write(`▸ View output: npx automagik-genie view ${sessionId}\n\n`);
  }

  /**
   * Stop a running session
   */
  async stopSession(sessionId: string): Promise<void> {
    process.stdout.write(`▸ Stopping session ${sessionId}...\n`);

    await this.forge.stopTaskAttemptExecution(sessionId);

    process.stdout.write(`▸ Session stopped\n`);
  }

  /**
   * Get session status
   */
  async getSessionStatus(sessionId: string): Promise<{
    status: string;
    logs?: string;
  }> {
    const attempt = await this.forge.getTaskAttempt(sessionId);

    return {
      status: attempt.status || 'unknown',
      logs: undefined, // TODO: Implement log retrieval
    };
  }

  /**
   * Stream session logs via WebSocket
   *
   * TODO: Implement WebSocket streaming
   * Returns WebSocket URL for now
   */
  getLogsStreamUrl(sessionId: string): string {
    // Need to get process ID from task attempt first
    // For now, return the task attempt ID (will implement full streaming later)
    return this.forge.getRawLogsStreamUrl(sessionId);
  }

  /**
   * List all Genie sessions (via Forge tasks)
   */
  async listSessions(): Promise<SessionEntry[]> {
    const projectId = await this.getOrCreateGenieProject();
    const tasks = await this.forge.listTasks(projectId);

    return tasks.map((task: any) => this.mapTaskToSession(task));
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get or create the Genie project in Forge
   */
  private async getOrCreateGenieProject(): Promise<string> {
    // If pre-configured project ID, use it
    if (this.config.genieProjectId) {
      return this.config.genieProjectId;
    }

    // Otherwise, find or create "Genie Sessions" project
    const projects = await this.forge.listProjects();
    const genieProject = projects.find((p: any) => p.name === 'Genie Sessions');

    if (genieProject) {
      this.config.genieProjectId = genieProject.id;
      return genieProject.id;
    }

    // Create new project
    const newProject = await this.forge.createProject({
      name: 'Genie Sessions',
      repo_path: process.cwd(), // Current working directory
    });

    this.config.genieProjectId = newProject.id;
    return newProject.id;
  }

  /**
   * Map Genie executor key to Forge executor profile ID
   */
  private mapExecutorToProfile(executorKey: string): string {
    // Map Genie executor names to Forge profile IDs
    const mapping: Record<string, string> = {
      'claude-code': 'CLAUDE_CODE',
      'codex': 'CODEX',
      'gemini': 'GEMINI',
      'cursor': 'CURSOR',
    };

    return mapping[executorKey] || 'CLAUDE_CODE';
  }

  /**
   * Map Forge task to Genie session entry
   */
  private mapTaskToSession(task: any): SessionEntry {
    return {
      sessionId: task.id,
      agent: this.extractAgentNameFromTitle(task.title),
      status: task.status || 'unknown',
      created: task.created_at,
      lastUsed: task.updated_at,
      background: true,
      executor: 'forge', // Mark as Forge-managed
    };
  }

  /**
   * Extract agent name from task title
   * Format: "Genie: {agentName} ({mode})"
   */
  private extractAgentNameFromTitle(title: string): string {
    const match = title.match(/^Genie: ([^\(]+)/);
    return match ? match[1].trim() : 'unknown';
  }

  /**
   * Get worktree path for task attempt
   */
  private getWorktreePath(attemptId: string): string {
    // Forge uses: /var/tmp/automagik-forge/worktrees/{prefix}-{slug}
    // For now, return placeholder (will be populated by Forge backend)
    return `/var/tmp/automagik-forge/worktrees/${attemptId}`;
  }

  /**
   * Get branch name for task attempt
   */
  private getBranchName(attemptId: string): string {
    // Forge uses: forge/{prefix}-{slug}
    return `forge/${attemptId}`;
  }

  /**
   * Display session information to user
   */
  private displaySessionInfo(sessionId: string, agentName: string): void {
    process.stdout.write(`  View output:\n`);
    process.stdout.write(`    npx automagik-genie view ${sessionId}\n\n`);

    process.stdout.write(`  Continue conversation:\n`);
    process.stdout.write(`    npx automagik-genie resume ${sessionId} "..."\n\n`);

    process.stdout.write(`  Stop the agent:\n`);
    process.stdout.write(`    npx automagik-genie stop ${sessionId}\n\n`);
  }
}

/**
 * Factory function to create ForgeExecutor instance
 */
export function createForgeExecutor(config: Partial<ForgeExecutorConfig> = {}): ForgeExecutor {
  const defaultConfig: ForgeExecutorConfig = {
    forgeBaseUrl: process.env.FORGE_BASE_URL || 'http://localhost:3000',
    forgeToken: process.env.FORGE_TOKEN,
    genieProjectId: process.env.GENIE_PROJECT_ID,
  };

  return new ForgeExecutor({ ...defaultConfig, ...config });
}

/**
 * Integration function to replace background-launcher.ts
 *
 * Usage in genie.ts:
 * ```typescript
 * import { createForgeExecutor } from './lib/forge-executor';
 *
 * // Replace background-launcher.maybeHandleBackgroundLaunch with:
 * const forgeExecutor = createForgeExecutor();
 * const sessionId = await forgeExecutor.createSession(params);
 * ```
 */
export async function handleForgeBackgroundLaunch(params: CreateSessionParams): Promise<boolean> {
  const forgeExecutor = createForgeExecutor();

  try {
    await forgeExecutor.createSession(params);
    return true; // Handled as background
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`\n▸ Failed to create Forge task: ${message}\n`);
    return false; // Not handled, continue as foreground
  }
}

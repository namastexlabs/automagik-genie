/**
 * Session Manager - Query Forge for master orchestrators
 *
 * Phase 2: Prevents orphaned tasks by reusing master orchestrators
 * Architecture: Query Forge database for existing masters (persists across restarts)
 */

import { WorkflowType, SessionInfo } from './session-types.js';
import path from 'path';

// Load ForgeClient
const geniePackageRoot = path.resolve(__dirname, '../../../..');
const ForgeClient = require(path.join(geniePackageRoot, 'forge.js')).ForgeClient;

const FORGE_URL = process.env.FORGE_BASE_URL || 'http://localhost:8887';

export class SessionManager {
  private forgeClient: any;

  constructor() {
    this.forgeClient = new ForgeClient(FORGE_URL);
  }

  /**
   * Get existing master orchestrator for workflow + project
   * Uses new forge_agents table (persistent, no status-based filtering)
   */
  async getSession(workflow: WorkflowType, projectId: string): Promise<SessionInfo | null> {
    try {
      // Query forge_agents table for this workflow type
      const agents = await this.forgeClient.getForgeAgents(projectId, workflow);

      if (agents && agents.length > 0) {
        const agent = agents[0];

        // Get the task details
        const task = await this.forgeClient.getTask(projectId, agent.task_id);

        // Get latest attempt
        const attempts = await this.forgeClient.listTaskAttempts(projectId);
        const latestAttempt = attempts
          .filter((a: any) => a.task_id === agent.task_id)
          .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))[0];

        if (latestAttempt) {
          return {
            taskId: agent.task_id,
            attemptId: latestAttempt.id,
            url: `${FORGE_URL}/projects/${projectId}/tasks/${agent.task_id}/attempts/${latestAttempt.id}?view=diffs`,
            projectId,
            created: agent.created_at,
            lastUsed: agent.updated_at
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to query Forge for ${workflow} master:`, error);
      return null;
    }
  }

  /**
   * Delegate work to existing master via follow-up
   * Sends prompt to master's latest attempt
   */
  async delegateToMaster(attemptId: string, prompt: string): Promise<void> {
    try {
      await this.forgeClient.followUpTaskAttempt(attemptId, prompt);
    } catch (error) {
      console.error(`Failed to delegate to master attempt ${attemptId}:`, error);
      throw error;
    }
  }

  /**
   * Create new master orchestrator
   * Returns session info for the new master
   */
  async createMaster(
    workflow: WorkflowType,
    projectId: string,
    title: string,
    prompt: string
  ): Promise<SessionInfo> {
    try {
      // Create the agent entry and its fixed task
      const agent = await this.forgeClient.createForgeAgent(projectId, workflow);

      // Start the first attempt with the initial prompt
      const attempt = await this.forgeClient.createTaskAttempt({
        task_id: agent.task_id,
        executor_profile_id: {
          executor: 'CLAUDE_CODE',
          variant: `neuron-${workflow}`
        },
        base_branch: 'main'
      });

      // Send the initial prompt as a follow-up
      await this.forgeClient.followUpTaskAttempt(attempt.id, prompt);

      return {
        taskId: agent.task_id,
        attemptId: attempt.id,
        url: `${FORGE_URL}/projects/${projectId}/tasks/${agent.task_id}/attempts/${attempt.id}?view=diffs`,
        projectId,
        created: agent.created_at,
        lastUsed: agent.updated_at
      };
    } catch (error) {
      console.error(`Failed to create ${workflow} master:`, error);
      throw error;
    }
  }

  /**
   * Get or create master orchestrator
   * Reuses existing master if found, creates new one if not
   */
  async getOrCreateMaster(
    workflow: WorkflowType,
    projectId: string,
    title: string,
    prompt: string
  ): Promise<SessionInfo> {
    // Try to find existing master
    const existing = await this.getSession(workflow, projectId);
    if (existing) {
      return existing;
    }

    // No master found, create new one
    return await this.createMaster(workflow, projectId, title, prompt);
  }

}

/**
 * Global session manager instance
 * Shared across all MCP tool calls during server lifetime
 */
export const sessionManager = new SessionManager();

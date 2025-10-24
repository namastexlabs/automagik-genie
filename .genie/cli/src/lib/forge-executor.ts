// @ts-ignore - forge.js is compiled JS without type declarations
import { ForgeClient } from '../../../../forge.js';
import { execSync } from 'child_process';

export interface ForgeExecutorConfig {
  forgeBaseUrl: string;
  forgeToken?: string;
  genieProjectId?: string;
}

export interface CreateSessionParams {
  agentName: string;
  prompt: string;
  executorKey: string;
  executorVariant?: string;
  executionMode: string;
  model?: string;
}

export interface CreateSessionResult {
  attemptId: string;
  taskId: string;
  projectId: string;
  forgeUrl: string;
}

export interface ForgeSessionSummary {
  id: string;
  agent: string;
  status: string;
  executor?: string | null;
  variant?: string | null;
  model?: string | null;
  created?: string;
  updated?: string;
}

export class ForgeExecutor {
  private forge: ForgeClient;
  private config: ForgeExecutorConfig;

  constructor(config: ForgeExecutorConfig) {
    this.config = config;
    this.forge = new ForgeClient(config.forgeBaseUrl, config.forgeToken);
  }

  async syncProfiles(profiles?: Record<string, any>, workspaceRoot?: string): Promise<void> {
    try {
      // If profiles provided, use them directly
      if (profiles) {
        await this.forge.updateExecutorProfiles(profiles);
        return;
      }

      // Otherwise, sync from agent registry (pass workspace root for correct scanning)
      const { getAgentRegistry } = await import('./agent-registry.js');
      const registry = await getAgentRegistry(workspaceRoot || process.cwd());

      // Generate profiles for all agents × all executors (fetch executors from Forge dynamically)
      const agentProfiles = await registry.generateForgeProfiles(this.forge);

      // Get current Forge profiles to merge with
      const currentProfiles = await this.forge.getExecutorProfiles();
      let current: any = { executors: {} };

      // Handle response - /api/info endpoint now returns { executors: {...} }
      if (currentProfiles) {
        if (typeof currentProfiles === 'object' && currentProfiles.executors) {
          current = currentProfiles;
        } else if (typeof currentProfiles === 'string') {
          try {
            const parsed = JSON.parse(currentProfiles);
            if (parsed && typeof parsed === 'object' && parsed.executors) {
              current = parsed;
            }
          } catch {
            // Use default empty executors
          }
        }
      }

      // Validate structure - must have executors object
      if (!current.executors || typeof current.executors !== 'object') {
        current = { executors: {} };
      }

      // Merge agent profiles with existing profiles
      const merged = this.mergeProfiles(current, agentProfiles);

      // Update Forge with merged profiles (pass object, not string)
      await this.forge.updateExecutorProfiles(merged);

      // Count executors from merged profiles (dynamic, not hardcoded)
      const executorCount = Object.keys(merged.executors || {}).length;
      console.log(`✅ Synced ${registry.count()} agents to Forge across ${executorCount} executors`);
    } catch (error: any) {
      console.warn(`⚠️  Failed to sync agent profiles to Forge: ${error.message}`);
    }
  }

  /**
   * Merge agent profiles with existing Forge profiles
   * Preserves non-agent variants (DEFAULT, APPROVALS, etc.)
   */
  private mergeProfiles(current: any, agents: any): any {
    const merged: any = { executors: {} };

    // Start with current profiles
    for (const [executor, variants] of Object.entries(current.executors || {})) {
      merged.executors[executor] = { ...(variants as object) };
    }

    // Add/overwrite agent variants
    for (const [executor, variants] of Object.entries(agents.executors || {})) {
      merged.executors[executor] = merged.executors[executor] || {};
      Object.assign(merged.executors[executor], variants);
    }

    return merged;
  }

  async createSession(params: CreateSessionParams): Promise<CreateSessionResult> {
    const { agentName, prompt, executorKey, executorVariant, executionMode, model } = params;

    const projectId = await this.getOrCreateGenieProject();

    // Detect current git branch and use it as base_branch
    let baseBranch = 'main'; // Default fallback
    try {
      baseBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim();
      await this.forge.updateProject(projectId, { default_base_branch: baseBranch });
    } catch (error) {
      // If git detection fails, try to get default_base_branch from project
      try {
        const project = await this.forge.getProject(projectId);
        if (project.default_base_branch) {
          baseBranch = project.default_base_branch;
        }
      } catch {
        // Use fallback 'main'
      }
    }

    // Use emoji format per @.genie/code/skills/emoji-naming-convention.md
    const emojiPrefix = this.getAgentEmoji(agentName);
    const formattedTitle = `[${emojiPrefix}] ${agentName}: ${executionMode}`;

    const requestBody = {
      task: {
        project_id: projectId,
        title: formattedTitle,
        description: prompt
      },
      executor_profile_id: this.mapExecutorToProfile(executorKey, executorVariant, model),
      base_branch: baseBranch
    };

    const response = await this.forge.createAndStartTask(requestBody);

    // Response contains: { id: taskId, project_id: projectId, attempts: [{ id: attemptId, ... }] }
    const taskId = response.id;
    const attemptId = response.attempts?.[0]?.id || response.id; // Fallback to taskId if attempts array missing

    // Build Forge URL
    const forgeUrl = `${this.config.forgeBaseUrl}/projects/${projectId}/tasks/${taskId}/attempts/${attemptId}?view=diffs`;

    return {
      attemptId,
      taskId,
      projectId,
      forgeUrl
    };
  }

  async resumeSession(sessionId: string, followUpPrompt: string): Promise<void> {
    await this.forge.followUpTaskAttempt(sessionId, followUpPrompt);
  }

  async stopSession(sessionId: string): Promise<void> {
    await this.forge.stopTaskAttemptExecution(sessionId);
  }

  async getSessionStatus(sessionId: string): Promise<{ status: string }> {
    const attempt = await this.forge.getTaskAttempt(sessionId);
    return { status: attempt.status || 'unknown' };
  }

  async fetchLatestLogs(sessionId: string): Promise<string | null> {
    try {
      const processes = await this.forge.listExecutionProcesses(sessionId);
      if (!Array.isArray(processes) || !processes.length) return null;
      const latest = processes[processes.length - 1];
      return latest?.output || null;
    } catch {
      return null;
    }
  }

  async listSessions(): Promise<ForgeSessionSummary[]> {
    const projectId = await this.getOrCreateGenieProject();
    const tasks = await this.forge.listTasks(projectId);
    return tasks.map((task: any) => ({
      id: task.id,
      agent: this.extractAgentNameFromTitle(task.title),
      status: task.status || 'unknown',
      executor: (task.executor_profile_id?.executor || '').toLowerCase() || null,
      variant: task.executor_profile_id?.variant || null,
      model: task.executor_profile_id?.model || null,
      created: task.created_at,
      updated: task.updated_at
    }));
  }

  private async getOrCreateGenieProject(): Promise<string> {
    if (this.config.genieProjectId) {
      return this.config.genieProjectId;
    }

    const currentRepoPath = process.cwd();
    const projects = await this.forge.listProjects();
    const existingProject = projects.find((p: any) => p.git_repo_path === currentRepoPath);

    if (existingProject) {
      this.config.genieProjectId = existingProject.id;
      return existingProject.id;
    }

    // Auto-detect project name from git repo or directory name
    let projectName = 'Genie Project';
    try {
      // Try git remote first
      const remoteUrl = execSync('git config --get remote.origin.url', {
        encoding: 'utf8',
        cwd: currentRepoPath,
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();

      // Extract repo name from URL (e.g., "automagik-genie.git" → "automagik-genie")
      const match = remoteUrl.match(/\/([^\/]+?)(\.git)?$/);
      if (match && match[1]) {
        projectName = match[1].replace(/\.git$/, '');
      }
    } catch {
      // Fallback to directory name if git fails
      try {
        const dirName = execSync('basename "$(pwd)"', {
          encoding: 'utf8',
          cwd: currentRepoPath,
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim();
        if (dirName) {
          projectName = dirName;
        }
      } catch {
        // Keep default "Genie Project"
      }
    }

    const newProject = await this.forge.createProject({
      name: projectName,
      git_repo_path: currentRepoPath,
      use_existing_repo: true
    });

    this.config.genieProjectId = newProject.id;
    return newProject.id;
  }

  private mapExecutorToProfile(
    executorKey: string,
    variant?: string,
    model?: string
  ): { executor: string; variant: string; model?: string } {
    const mapping: Record<string, string> = {
      'claude': 'CLAUDE_CODE',
      'claude-code': 'CLAUDE_CODE',
      'codex': 'CODEX',
      'opencode': 'OPENCODE',
      'gemini': 'GEMINI',
      'cursor': 'CURSOR',
      'qwen_code': 'QWEN_CODE',
      'amp': 'AMP',
      'copilot': 'COPILOT'
    };

    const normalizedKey = executorKey.trim().toLowerCase();
    const executor = mapping[normalizedKey] || normalizedKey.toUpperCase();
    const resolvedVariant = (variant || 'DEFAULT').toUpperCase();

    const profile: { executor: string; variant: string; model?: string } = {
      executor,
      variant: resolvedVariant
    };

    if (model && model.trim().length) {
      profile.model = model.trim();
    }

    return profile;
  }

  private extractAgentNameFromTitle(title: string): string {
    // Handle old format "Genie: agent (mode)" and new emoji format "[🧞] agent: mode"
    const oldMatch = title.match(/^Genie: ([^\(]+)/);
    if (oldMatch) return oldMatch[1].trim();

    const emojiMatch = title.match(/^\[[\p{Emoji}]\]\s+([^:]+)/u);
    return emojiMatch ? emojiMatch[1].trim() : title;
  }

  private getAgentEmoji(agentName: string): string {
    // Map agent names to emojis per @.genie/code/skills/emoji-naming-convention.md
    const normalized = agentName.toLowerCase().trim();

    // Agent emojis
    const agentEmojis: Record<string, string> = {
      // Orchestrators & Planning
      'genie': '🧞',
      'wish': '💭',
      'plan': '📋',
      'forge': '⚙️',

      // Execution agents (robots do the work)
      'implementor': '🤖',
      'tests': '🤖',
      'polish': '🤖',
      'refactor': '🤖',

      // Validation & Review
      'review': '✅',

      // Tools & Utilities
      'git': '🔧',
      'release': '🚀',
      'commit': '📦',

      // Analysis & Learning
      'learn': '📚',
      'debug': '🐞',
      'analyze': '🔍',
      'thinkdeep': '🧠',

      // Communication & Consensus
      'consensus': '🤝',
      'prompt': '📝',
      'roadmap': '🗺️'
    };

    return agentEmojis[normalized] || '🧞'; // Default to genie emoji
  }
}

export function createForgeExecutor(config: Partial<ForgeExecutorConfig> = {}): ForgeExecutor {
  const defaultConfig: ForgeExecutorConfig = {
    forgeBaseUrl: process.env.FORGE_BASE_URL || 'http://localhost:8887',
    forgeToken: process.env.FORGE_TOKEN,
    genieProjectId: process.env.GENIE_PROJECT_ID
  };

  return new ForgeExecutor({ ...defaultConfig, ...config });
}

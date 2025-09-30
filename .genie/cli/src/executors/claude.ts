import fs from 'fs';
import path from 'path';
import { Executor, ExecutorCommand, ExecutorDefaults } from './types';
import * as logViewer from './claude-log-viewer';

const defaults: ExecutorDefaults = {
  binary: 'claude',
  packageSpec: undefined,
  sessionsDir: undefined,
  exec: {
    model: 'sonnet',
    permissionMode: 'default',
    outputFormat: 'stream-json',
    allowedTools: [],
    disallowedTools: []
  },
  resume: {
    outputFormat: 'stream-json'
  },
  sessionExtractionDelayMs: 1000
};

function buildRunCommand({ config = {}, agentPath, prompt }: { config?: Record<string, any>; agentPath?: string; prompt?: string }): ExecutorCommand {
  const execConfig = mergeExecConfig(config.exec) as Record<string, any>;
  const command = config.binary || defaults.binary!;
  const args: string[] = ['-p', '--verbose', '--output-format', 'stream-json'];

  if (execConfig.model) {
    args.push('--model', String(execConfig.model));
  }

  if (execConfig.permissionMode && execConfig.permissionMode !== 'default') {
    args.push('--permission-mode', String(execConfig.permissionMode));
  }

  if (Array.isArray(execConfig.allowedTools) && execConfig.allowedTools.length > 0) {
    args.push('--allowed-tools', execConfig.allowedTools.join(','));
  }

  if (Array.isArray(execConfig.disallowedTools) && execConfig.disallowedTools.length > 0) {
    args.push('--disallowed-tools', execConfig.disallowedTools.join(','));
  }

  if (agentPath) {
    const instructionsFile = path.isAbsolute(agentPath) ? agentPath : path.resolve(agentPath);
    try {
      const content = fs.readFileSync(instructionsFile, 'utf-8');
      args.push('--append-system-prompt', content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[genie] Failed to read agent file at ${instructionsFile}: ${message}`);
    }
  }

  if (prompt) {
    args.push(prompt);
  }

  return { command, args };
}

function buildResumeCommand({ config = {}, sessionId, prompt }: { config?: Record<string, any>; sessionId?: string; prompt?: string }): ExecutorCommand {
  const resumeConfig = mergeResumeConfig(config.resume) as Record<string, any>;
  const command = config.binary || defaults.binary!;
  const args: string[] = ['-p', '--verbose', '--output-format', 'stream-json'];

  if (sessionId) {
    args.push('--resume', sessionId);
  }

  if (prompt) {
    args.push(prompt);
  }

  return { command, args };
}

function resolvePaths({ config = {}, baseDir, resolvePath }: { config?: Record<string, any>; baseDir?: string; resolvePath?: (target: string, base?: string) => string }) {
  return {};
}

function extractSessionId({ startTime, paths = {} }: { startTime?: number; paths?: Record<string, any> }): string | null {
  return null;
}

function getSessionExtractionDelay({ config = {}, defaultDelay }: { config?: Record<string, any>; defaultDelay: number }): number {
  if (typeof config.sessionExtractionDelayMs === 'number') {
    return config.sessionExtractionDelayMs;
  }
  if (typeof defaults.sessionExtractionDelayMs === 'number') {
    return defaults.sessionExtractionDelayMs;
  }
  return defaultDelay;
}

function mergeExecConfig(execConfig: Record<string, any> = {}) {
  return {
    ...defaults.exec,
    ...execConfig,
    allowedTools: Array.isArray(execConfig.allowedTools)
      ? execConfig.allowedTools.slice()
      : (defaults.exec as any).allowedTools.slice(),
    disallowedTools: Array.isArray(execConfig.disallowedTools)
      ? execConfig.disallowedTools.slice()
      : (defaults.exec as any).disallowedTools.slice()
  };
}

function mergeResumeConfig(resume: Record<string, any> = {}) {
  return {
    ...defaults.resume,
    ...resume
  };
}

const claudeExecutor: Executor = {
  defaults,
  buildRunCommand,
  buildResumeCommand,
  resolvePaths,
  extractSessionId,
  getSessionExtractionDelay,
  logViewer
};

export default claudeExecutor;
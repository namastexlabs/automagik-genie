import fs from 'fs';
import path from 'path';
import { Executor, ExecutorCommand, ExecutorDefaults } from './types';
import * as logViewer from './codex-log-viewer';

const CODEX_PACKAGE_SPEC = '@namastexlabs/codex@0.43.0-alpha.5';

const defaults: ExecutorDefaults = {
  binary: 'npx',
  packageSpec: CODEX_PACKAGE_SPEC,
  sessionsDir: path.join(process.env.HOME || process.env.USERPROFILE || '~', '.codex', 'sessions'),
  exec: {
    fullAuto: true,
    model: 'gpt-5-codex',
    sandbox: 'workspace-write',
    approvalPolicy: 'on-failure',
    profile: null,
    includePlanTool: false,
    search: false,
    skipGitRepoCheck: false,
    json: false,
    experimentalJson: true,
    color: 'auto',
    cd: null,
    outputSchema: null,
    outputLastMessage: null,
    reasoningEffort: 'low',
    additionalArgs: [],
    images: []
  },
  resume: {
    includePlanTool: false,
    search: false,
    last: false,
    additionalArgs: []
  },
  sessionExtractionDelayMs: null
};

function buildRunCommand({ config = {}, instructions, prompt, agentPath }: { config?: Record<string, any>; instructions?: string; prompt?: string; agentPath?: string }): ExecutorCommand {
  const execConfig = mergeExecConfig(config.exec) as Record<string, any>;
  const command = config.binary || defaults.binary!;
  const packageSpec = config.packageSpec || defaults.packageSpec;
  const args: string[] = [];

  if (packageSpec) {
    if (command === 'npx') {
      args.push('-y', String(packageSpec));
    } else {
      args.push(String(packageSpec));
    }
  }

  args.push('exec', ...collectExecOptions(execConfig));

  if (agentPath) {
    const instructionsFile = path.isAbsolute(agentPath) ? agentPath : path.resolve(agentPath);
    const escapedInstructionsFile = instructionsFile.replace(/"/g, '\\"');
    args.push('-c', `append_user_instructions_file="${escapedInstructionsFile}"`);
  }

  if (prompt) {
    args.push(prompt);
  }

  return { command, args };
}

function buildResumeCommand({ config = {}, sessionId, prompt }: { config?: Record<string, any>; sessionId?: string; prompt?: string }): ExecutorCommand {
  const resumeConfig = mergeResumeConfig(config.resume) as Record<string, any>;
  const command = config.binary || defaults.binary!;
  const packageSpec = config.packageSpec || defaults.packageSpec;
  const args: string[] = [];

  if (packageSpec) {
    if (command === 'npx') {
      args.push('-y', String(packageSpec));
    } else {
      args.push(String(packageSpec));
    }
  }

  args.push('exec', 'resume');
  if (resumeConfig.includePlanTool) args.push('--include-plan-tool');
  if (resumeConfig.search) args.push('--search');
  if (Array.isArray(resumeConfig.additionalArgs)) {
    resumeConfig.additionalArgs.forEach((arg: unknown) => {
      if (typeof arg === 'string') args.push(arg);
    });
  }
  if (sessionId) {
    args.push(sessionId);
  } else if (resumeConfig.last) {
    args.push('--last');
  }
  if (prompt) {
    args.push(prompt);
  }
  return { command, args };
}

function resolvePaths({ config = {}, baseDir, resolvePath }: { config?: Record<string, any>; baseDir?: string; resolvePath?: (target: string, base?: string) => string }) {
  const sessionsDirRaw = config.sessionsDir || defaults.sessionsDir!;
  const sessionsDir = resolvePath ? resolvePath(sessionsDirRaw, baseDir) : sessionsDirRaw;
  return {
    sessionsDir
  };
}

function extractSessionId({ startTime, paths = {} }: { startTime?: number; paths?: Record<string, any> }): string | null {
  const sessionsDir = paths.sessionsDir as string | undefined;
  if (!sessionsDir) return null;
  const date = new Date(startTime ?? 0);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dayDir = path.join(sessionsDir, String(year), month, day);
  if (!fs.existsSync(dayDir)) return null;

  const files = fs
    .readdirSync(dayDir)
    .filter((file: string) => file.startsWith('rollout-') && file.endsWith('.jsonl'))
    .map((file: string) => {
      const fullPath = path.join(dayDir, file);
      const stat = fs.statSync(fullPath);
      return { name: file, path: fullPath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  for (const file of files) {
    if (Math.abs(file.mtime - (startTime ?? 0)) < 60000) {
      const match = file.name.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (match) return match[1];
    }
  }
  return null;
}

function getSessionExtractionDelay({ config = {}, defaultDelay }: { config?: Record<string, any>; defaultDelay: number }): number {
  if (typeof config.sessionExtractionDelayMs === 'number') {
    return config.sessionExtractionDelayMs;
  }
  return defaultDelay;
}

function locateSessionFile({ sessionId, startTime, sessionsDir }: { sessionId: string; startTime: number; sessionsDir: string }): string | null {
  if (!sessionId || !sessionsDir) return null;

  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return null;

  // Helper to check a specific date directory
  const checkDirectory = (targetDate: Date): string | null => {
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');

    const dayDir = path.join(sessionsDir, String(year), month, day);
    if (!fs.existsSync(dayDir)) return null;

    // Try exact match first
    const exactPattern = new RegExp(`rollout-.*-${sessionId}\\.jsonl$`, 'i');
    const files = fs.readdirSync(dayDir);

    for (const file of files) {
      if (exactPattern.test(file)) {
        return path.join(dayDir, file);
      }
    }

    // Fuzzy matching with ±5min window
    const fuzzyFiles = files
      .filter((file: string) => file.startsWith('rollout-') && file.endsWith('.jsonl'))
      .map((file: string) => {
        const fullPath = path.join(dayDir, file);
        const stat = fs.statSync(fullPath);
        return { name: file, path: fullPath, mtime: stat.mtimeMs };
      })
      .filter((file) => Math.abs(file.mtime - startTime) < 300000);

    for (const file of fuzzyFiles) {
      const match = file.name.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (match && match[1].toLowerCase() === sessionId.toLowerCase()) {
        return file.path;
      }
    }

    return null;
  };

  // Try the date from startTime first
  let result = checkDirectory(date);
  if (result) return result;

  // Try yesterday (in case of timezone differences)
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  result = checkDirectory(yesterday);
  if (result) return result;

  // Try tomorrow (in case of timezone differences)
  const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  return checkDirectory(tomorrow);
}

function mergeExecConfig(execConfig: Record<string, any> = {}) {
  return {
    ...defaults.exec,
    ...execConfig,
    additionalArgs: Array.isArray(execConfig.additionalArgs)
      ? execConfig.additionalArgs.slice()
      : (defaults.exec as any).additionalArgs.slice(),
    images: Array.isArray(execConfig.images)
      ? execConfig.images.slice()
      : (defaults.exec as any).images.slice()
  };
}

function mergeResumeConfig(resume: Record<string, any> = {}) {
  return {
    ...defaults.resume,
    ...resume,
    additionalArgs: Array.isArray(resume.additionalArgs)
      ? resume.additionalArgs.slice()
      : (defaults.resume as any).additionalArgs.slice()
  };
}

function collectExecOptions(execConfig: Record<string, any>) {
  const options: string[] = [];
  if (execConfig.fullAuto) options.push('--full-auto');
  if (execConfig.model) options.push('-m', String(execConfig.model));
  if (execConfig.sandbox) options.push('-s', String(execConfig.sandbox));
  if (execConfig.approvalPolicy) options.push('-c', `approval-policy="${execConfig.approvalPolicy}"`);
  if (execConfig.profile) options.push('-p', String(execConfig.profile));
  if (execConfig.includePlanTool) options.push('--include-plan-tool');
  if (execConfig.search) options.push('--search');
  if (execConfig.skipGitRepoCheck) options.push('--skip-git-repo-check');
  if (execConfig.experimentalJson) options.push('--experimental-json');
  else if (execConfig.json) options.push('--json');
  if (execConfig.color && execConfig.color !== 'auto') options.push('--color', String(execConfig.color));
  if (execConfig.cd) options.push('-C', String(execConfig.cd));
  if (execConfig.outputSchema) options.push('--output-schema', String(execConfig.outputSchema));
  if (execConfig.outputLastMessage) options.push('--output-last-message', String(execConfig.outputLastMessage));
  if (execConfig.reasoningEffort) {
    options.push('-c', `reasoning.effort="${execConfig.reasoningEffort}"`);
  }
  if (Array.isArray(execConfig.images)) {
    execConfig.images.forEach((imagePath: unknown) => {
      if (typeof imagePath === 'string' && imagePath.length) {
        options.push('-i', imagePath);
      }
    });
  }
  if (Array.isArray(execConfig.additionalArgs)) {
    execConfig.additionalArgs.forEach((arg: unknown) => {
      if (typeof arg === 'string') options.push(arg);
    });
  }
  return options;
}

const codexExecutor: Executor = {
  defaults,
  buildRunCommand,
  buildResumeCommand,
  resolvePaths,
  extractSessionId,
  getSessionExtractionDelay,
  locateSessionFile,
  logViewer
};

export default codexExecutor;

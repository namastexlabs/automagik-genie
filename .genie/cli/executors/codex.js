const fs = require('fs');
const path = require('path');
const logViewer = require('./codex-log-viewer');

const defaults = {
  binary: 'codex',
  sessionsDir: '.genie/state/agents/codex-sessions',
  exec: {
    fullAuto: true,
    model: 'gpt-5-codex',
    sandbox: 'workspace-write',
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
    reasoningEffort: null,
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

function buildRunCommand({ config = {}, instructions, prompt }) {
  const execConfig = mergeExecConfig(config.exec);
  const command = config.binary || defaults.binary;
  const args = ['exec', ...collectExecOptions(execConfig)];
  if (typeof instructions === 'string' && instructions.length) {
    args.push('-c', `base-instructions=${JSON.stringify(instructions)}`);
  }
  if (prompt) {
    args.push(prompt);
  }
  return { command, args };
}

function buildResumeCommand({ config = {}, sessionId, prompt }) {
  const execConfig = mergeExecConfig(config.exec);
  const resumeConfig = mergeResumeConfig(config.resume);
  const command = config.binary || defaults.binary;
  const args = ['exec', 'resume', ...collectExecOptions(execConfig)];
  if (resumeConfig.includePlanTool) args.push('--include-plan-tool');
  if (resumeConfig.search) args.push('--search');
  if (Array.isArray(resumeConfig.additionalArgs)) {
    resumeConfig.additionalArgs.forEach((arg) => {
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

function resolvePaths({ config = {}, baseDir, resolvePath }) {
  const sessionsDirRaw = config.sessionsDir || defaults.sessionsDir;
  const sessionsDir = resolvePath ? resolvePath(sessionsDirRaw, baseDir) : sessionsDirRaw;
  return {
    sessionsDir
  };
}

function extractSessionId({ startTime, paths = {} }) {
  const sessionsDir = paths.sessionsDir;
  if (!sessionsDir) return null;
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dayDir = path.join(sessionsDir, String(year), month, day);
  if (!fs.existsSync(dayDir)) return null;

  const files = fs
    .readdirSync(dayDir)
    .filter((file) => file.startsWith('rollout-') && file.endsWith('.jsonl'))
    .map((file) => {
      const fullPath = path.join(dayDir, file);
      const stat = fs.statSync(fullPath);
      return { name: file, path: fullPath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  for (const file of files) {
    if (Math.abs(file.mtime - startTime) < 60000) {
      const match = file.name.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      if (match) return match[1];
    }
  }
  return null;
}

function getSessionExtractionDelay({ config = {}, defaultDelay }) {
  if (typeof config.sessionExtractionDelayMs === 'number') {
    return config.sessionExtractionDelayMs;
  }
  return defaultDelay;
}

function mergeExecConfig(execConfig = {}) {
  return {
    ...defaults.exec,
    ...execConfig,
    additionalArgs: Array.isArray(execConfig.additionalArgs)
      ? execConfig.additionalArgs.slice()
      : defaults.exec.additionalArgs.slice(),
    images: Array.isArray(execConfig.images)
      ? execConfig.images.slice()
      : defaults.exec.images.slice()
  };
}

function mergeResumeConfig(resume = {}) {
  return {
    ...defaults.resume,
    ...resume,
    additionalArgs: Array.isArray(resume.additionalArgs)
      ? resume.additionalArgs.slice()
      : defaults.resume.additionalArgs.slice()
  };
}

function collectExecOptions(execConfig) {
  const options = [];
  if (execConfig.fullAuto) options.push('--full-auto');
  if (execConfig.model) options.push('-m', String(execConfig.model));
  if (execConfig.sandbox) options.push('-s', String(execConfig.sandbox));
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
    execConfig.images.forEach((imagePath) => {
      if (typeof imagePath === 'string' && imagePath.length) {
        options.push('-i', imagePath);
      }
    });
  }
  if (Array.isArray(execConfig.additionalArgs)) {
    execConfig.additionalArgs.forEach((arg) => {
      if (typeof arg === 'string') options.push(arg);
    });
  }
  return options;
}

module.exports = {
  defaults,
  buildRunCommand,
  buildResumeCommand,
  resolvePaths,
  extractSessionId,
  getSessionExtractionDelay,
  logViewer
};

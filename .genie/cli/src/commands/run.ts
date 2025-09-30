import fs from 'fs';
import path from 'path';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import type { Executor } from '../executors/types';
import type { CLIOptions, ParsedCommand, ConfigPaths, GenieConfig, ExecuteRunArgs } from '../lib/types';
import { resolveAgentIdentifier, loadAgentSpec } from '../lib/agent-resolver';
import { deriveStartTime, deriveLogFile } from '../lib/utils';
import {
  loadSessions,
  saveSessions,
  SessionLoadConfig,
  SessionPathsConfig,
  SessionStore,
  SessionEntry
} from '../session-store';
import { backgroundManager } from '../lib/background-manager-instance';
import { sleep } from '../lib/async';
import { DEFAULT_CONFIG } from '../lib/config-defaults';
import { emitView } from '../lib/view-helpers';
import { buildRunCompletionView } from '../views/background';
import type { ExecutorCommand } from '../executors/types';
import { EXECUTORS, DEFAULT_EXECUTOR_KEY } from '../lib/executor-registry';

export async function runChat(
  parsed: ParsedCommand,
  config: GenieConfig,
  paths: Required<ConfigPaths>
): Promise<void> {
  const [agentName, ...promptParts] = parsed.commandArgs;
  if (!agentName) {
    throw new Error('Usage: genie run <agent> "<prompt>"');
  }
  const prompt = promptParts.join(' ').trim();
  const resolvedAgentName = resolveAgentIdentifier(agentName);
  const agentSpec = loadAgentSpec(resolvedAgentName);
  const agentMeta = agentSpec.meta || {};
  const agentGenie = agentMeta.genie || {};
  if (!parsed.options.backgroundExplicit && typeof agentGenie.background === 'boolean') {
    parsed.options.background = agentGenie.background;
  }
  const defaultMode = config.defaults?.executionMode || config.defaults?.preset || 'default';
  const agentMode = agentGenie.mode || agentGenie.executionMode || agentGenie.preset;
  const modeName = typeof agentMode === 'string' && agentMode.trim().length ? agentMode.trim() : defaultMode;
  const executorKey = agentGenie.executor || resolveExecutorKey(config, modeName);
  const executor = requireExecutor(executorKey);
  const executorOverrides = extractExecutorOverrides(agentGenie, executorKey);
  const executorConfig = buildExecutorConfig(config, modeName, executorKey, executorOverrides);
  const executorPaths = resolveExecutorPaths(paths, executorKey);
  const store = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);

  const isBackgroundRunner = parsed.options.backgroundRunner === true;
  const startTime = deriveStartTime(isBackgroundRunner);
  const logFile = deriveLogFile(resolvedAgentName, startTime, paths, isBackgroundRunner);

  const entry: SessionEntry = {
    ...(store.agents[resolvedAgentName] || {}),
    agent: resolvedAgentName,
    preset: modeName,
    mode: modeName,
    logFile,
    lastPrompt: prompt.slice(0, 200),
    created: (store.agents[resolvedAgentName] && store.agents[resolvedAgentName].created) || new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    status: 'starting',
    background: parsed.options.background,
    runnerPid: parsed.options.backgroundRunner ? process.pid : null,
    executor: executorKey,
    executorPid: null,
    exitCode: null,
    signal: null,
    startTime: new Date(startTime).toISOString(),
    sessionId: null
  };
  store.agents[resolvedAgentName] = entry;
  saveSessions(paths as SessionPathsConfig, store);

  const handledBackground = await maybeHandleBackgroundLaunch({
    parsed,
    config,
    paths,
    store,
    entry,
    agentName: resolvedAgentName,
    executorKey,
    executionMode: modeName,
    startTime,
    logFile,
    allowResume: true
  });

  if (handledBackground) {
    return;
  }

  const agentPath = path.join('.genie', 'agents', `${resolvedAgentName}.md`);
  const command = executor.buildRunCommand({
    config: executorConfig,
    agentPath,
    prompt
  });

  await executeRun({
    agentName,
    command,
    executorKey,
    executor,
    executorConfig,
    executorPaths,
    prompt,
    store,
    entry,
    paths,
    config,
    startTime,
    logFile,
    background: parsed.options.background,
    runnerPid: parsed.options.backgroundRunner ? process.pid : null,
    cliOptions: parsed.options,
    executionMode: modeName
  });
}

export async function maybeHandleBackgroundLaunch(params: {
  parsed: ParsedCommand;
  config: GenieConfig;
  paths: Required<ConfigPaths>;
  store: SessionStore;
  entry: SessionEntry;
  agentName: string;
  executorKey: string;
  executionMode: string;
  startTime: number;
  logFile: string;
  allowResume: boolean;
}): Promise<boolean> {
  const { parsed, config, paths, store, entry, agentName, executorKey, executionMode, startTime, logFile, allowResume } = params;

  if (!parsed.options.background || parsed.options.backgroundRunner) {
    return false;
  }

  const runnerPid = backgroundManager.launch({
    rawArgs: parsed.options.rawArgs,
    startTime,
    logFile,
    backgroundConfig: config.background,
    scriptPath: path.resolve(__dirname, '..', 'genie.js')
  });

  entry.runnerPid = runnerPid;
  entry.status = 'running';
  entry.background = parsed.options.background;
  saveSessions(paths as SessionPathsConfig, store);

  process.stdout.write(`▸ Launching ${agentName} in background...\n`);
  process.stdout.write(`▸ Waiting for session ID...\n`);

  const pollStart = Date.now();
  const pollTimeout = 20000;
  const pollInterval = 500;

  while (Date.now() - pollStart < pollTimeout) {
    await sleep(pollInterval);
    const liveStore = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);
    const liveEntry = liveStore.agents?.[agentName];

    if (liveEntry?.sessionId) {
      const elapsed = ((Date.now() - pollStart) / 1000).toFixed(1);
      entry.sessionId = liveEntry.sessionId;
      process.stdout.write(`▸ Session ID: ${liveEntry.sessionId} (${elapsed}s)\n\n`);
      process.stdout.write(`  View output:\n`);
      process.stdout.write(`    ./genie view ${liveEntry.sessionId}\n\n`);
      process.stdout.write(`  Continue conversation:\n`);
      process.stdout.write(`    ./genie resume ${liveEntry.sessionId} "<your message>"\n\n`);
      process.stdout.write(`  Stop session:\n`);
      process.stdout.write(`    ./genie stop ${liveEntry.sessionId}\n`);
      return true;
    }
  }

  process.stdout.write(`▸ Session started but ID not available yet (timeout after 20s)\n\n`);
  process.stdout.write(`  List sessions to find ID:\n`);
  process.stdout.write(`    ./genie list sessions\n\n`);
  process.stdout.write(`  Then view output:\n`);
  process.stdout.write(`    ./genie view <sessionId>\n`);
  return true;
}

export function executeRun(args: ExecuteRunArgs): Promise<void> {
  const {
    agentName,
    command,
    executorKey,
    executor,
    executorConfig,
    executorPaths,
    store,
    entry,
    paths,
    config,
    startTime,
    logFile,
    background,
    runnerPid,
    cliOptions,
    executionMode
  } = args;

  if (!command || typeof command.command !== 'string' || !Array.isArray(command.args)) {
    throw new Error(`Executor '${executorKey}' returned an invalid command configuration.`);
  }

  const logDir = path.dirname(logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  const spawnOptions: SpawnOptionsWithoutStdio = {
    stdio: ['ignore', 'pipe', 'pipe'] as any,
    ...(command.spawnOptions || {})
  };
  const proc = spawn(command.command, command.args, spawnOptions);

  entry.status = 'running';
  entry.executorPid = proc.pid || null;
  if (runnerPid) entry.runnerPid = runnerPid;
  saveSessions(paths as SessionPathsConfig, store);

  let filteredStdout: NodeJS.ReadWriteStream | null = null;

  const updateSessionFromLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) return;
    try {
      const data = JSON.parse(trimmed);
      if (data && typeof data === 'object' && data.type === 'session.created') {
        const sessionId = data.session_id || data.sessionId;
        if (sessionId) {
          if (entry.sessionId !== sessionId) {
            entry.sessionId = sessionId;
            entry.lastUsed = new Date().toISOString();
            saveSessions(paths as SessionPathsConfig, store);
          }
        }
      }
    } catch {
      // ignore malformed JSON lines
    }
  };

  let outputSource: NodeJS.ReadableStream | null = null;

  const attachOutputListener = (stream: NodeJS.ReadableStream) => {
    let buffer = '';
    stream.on('data', (chunk: Buffer | string) => {
      const text = chunk instanceof Buffer ? chunk.toString('utf8') : chunk;
      buffer += text;
      let index = buffer.indexOf('\n');
      while (index !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        updateSessionFromLine(line);
        index = buffer.indexOf('\n');
      }
    });
  };

  if (proc.stdout) {
    if (executor.createOutputFilter) {
      filteredStdout = executor.createOutputFilter(logStream);
      outputSource = filteredStdout;
      attachOutputListener(filteredStdout);
      proc.stdout.pipe(filteredStdout);
    } else {
      proc.stdout.pipe(logStream);
      outputSource = proc.stdout;
      attachOutputListener(proc.stdout);
    }
  }
  if (proc.stderr) proc.stderr.pipe(logStream);


  if (!background) {
    if (filteredStdout) {
      filteredStdout.pipe(process.stdout);
    } else if (proc.stdout) {
      proc.stdout.pipe(process.stdout);
    }
    if (proc.stderr) proc.stderr.pipe(process.stderr);
  }

  let settled = false;
  let resolvePromise: () => void = () => {};
  const settle = () => {
    if (!settled) {
      settled = true;
      logStream.end();
      resolvePromise();
    }
  };

  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  const logViewer = executor.logViewer;
  let logPollingActive = Boolean(logViewer?.readSessionIdFromLog);

  if (logPollingActive) {
    const pollSessionIdFromLog = () => {
      if (!logPollingActive || entry.sessionId) return;
      try {
        const fromLog = logViewer?.readSessionIdFromLog?.(logFile) ?? null;
        if (fromLog && entry.sessionId !== fromLog) {
          entry.sessionId = fromLog;
          entry.lastUsed = new Date().toISOString();
          saveSessions(paths as SessionPathsConfig, store);
          logPollingActive = false;
          return;
        }
      } catch {
        // ignore log polling errors
      }
      if (logPollingActive && !entry.sessionId) {
        setTimeout(pollSessionIdFromLog, 500);
      }
    };
    setTimeout(pollSessionIdFromLog, 500);
  }

  proc.on('error', (error) => {
    entry.status = 'failed';
    entry.error = error instanceof Error ? error.message : String(error);
    entry.lastUsed = new Date().toISOString();
    saveSessions(paths as SessionPathsConfig, store);
    const message = error instanceof Error ? error.message : String(error);
    if (!background) {
      const envelope = buildRunCompletionView({
        agentName,
        outcome: 'failure',
        sessionId: entry.sessionId,
        executorKey,
        model: executorConfig.exec?.model || executorConfig.model || null,
        permissionMode: executorConfig.exec?.permissionMode || executorConfig.permissionMode || null,
        sandbox: executorConfig.exec?.sandbox || executorConfig.sandbox || null,
        mode: entry.mode || entry.preset || executionMode,
        background: entry.background,
        exitCode: null,
        durationMs: Date.now() - startTime,
        extraNotes: [`Launch error: ${message}`]
      });
      void emitView(envelope, cliOptions, { stream: process.stderr }).finally(settle);
    } else {
      settle();
    }
  });

  proc.on('exit', (code, signal) => {
    if (settled) return;
    const finishedAt = new Date().toISOString();
    entry.lastUsed = finishedAt;
    entry.exitCode = code;
    entry.signal = signal;
    entry.status = code === 0 ? 'completed' : 'failed';
    saveSessions(paths as SessionPathsConfig, store);
    logStream.end();
    logPollingActive = false;
    const sessionFromLog = logViewer?.readSessionIdFromLog?.(logFile) ?? null;
    const resolvedSessionId = sessionFromLog || entry.sessionId || null;
    if (entry.sessionId !== resolvedSessionId) {
      entry.sessionId = resolvedSessionId;
      entry.lastUsed = new Date().toISOString();
      saveSessions(paths as SessionPathsConfig, store);
    }

    if (!background) {
      const outcome = code === 0 ? 'success' : 'failure';
      const notes = signal ? [`Signal: ${signal}`] : [];
      const envelope = buildRunCompletionView({
        agentName,
        outcome,
        sessionId: entry.sessionId,
        executorKey,
        model: executorConfig.exec?.model || executorConfig.model || null,
        permissionMode: executorConfig.exec?.permissionMode || executorConfig.permissionMode || null,
        sandbox: executorConfig.exec?.sandbox || executorConfig.sandbox || null,
        mode: entry.mode || entry.preset || executionMode,
        background: entry.background,
        exitCode: code,
        durationMs: Date.now() - startTime,
        extraNotes: notes
      });
      void emitView(envelope, cliOptions).finally(settle);
    } else {
      settle();
    }
  });

  const defaultDelay = (config.background && config.background.sessionExtractionDelayMs) || 5000;
  const sessionDelay = executor.getSessionExtractionDelay
    ? executor.getSessionExtractionDelay({ config: executorConfig, defaultDelay })
    : defaultDelay;

  if (executor.extractSessionId) {
    const retryIntervals = [sessionDelay, 2000, 3000, 3000];
    let retryIndex = 0;

    const attemptExtraction = () => {
      if (entry.sessionId) return;

      const sessionId = executor.extractSessionId?.({
        startTime,
        config: executorConfig,
        paths: executorPaths
      }) || null;

      if (sessionId) {
        entry.sessionId = sessionId;
        entry.lastUsed = new Date().toISOString();
        saveSessions(paths as SessionPathsConfig, store);
      } else if (retryIndex < retryIntervals.length) {
        setTimeout(attemptExtraction, retryIntervals[retryIndex]);
        retryIndex++;
      }
    };

    setTimeout(attemptExtraction, retryIntervals[retryIndex++]);
  }

  return promise;
}

export function resolveExecutorKey(config: GenieConfig, modeName: string): string {
  const modes = config.executionModes || config.presets || {};
  const mode = modes[modeName];
  if (mode && mode.executor) return mode.executor;
  if (config.defaults && config.defaults.executor) return config.defaults.executor;
  return DEFAULT_EXECUTOR_KEY;
}

export function requireExecutor(key: string): Executor {
  const executor = EXECUTORS[key];
  if (!executor) {
    const available = Object.keys(EXECUTORS).join(', ') || 'none';
    throw new Error(`Executor '${key}' not found. Available executors: ${available}`);
  }
  return executor;
}

export function buildExecutorConfig(config: GenieConfig, modeName: string, executorKey: string, agentOverrides: any): any {
  const base = deepClone((config.executors && config.executors[executorKey]) || {});
  const modes = config.executionModes || config.presets || {};
  const mode = modes[modeName];
  if (!mode && modeName && modeName !== 'default') {
    const available = Object.keys(modes).join(', ') || 'default';
    throw new Error(`Execution mode '${modeName}' not found. Available modes: ${available}`);
  }
  const overrides = getExecutorOverrides(mode, executorKey);
  let merged = mergeDeep(base, overrides);
  if (agentOverrides && Object.keys(agentOverrides).length) {
    merged = mergeDeep(merged, agentOverrides);
  }
  return merged;
}

export function resolveExecutorPaths(paths: Required<ConfigPaths>, executorKey: string): any {
  if (!paths.executors) return {};
  return paths.executors[executorKey] || {};
}

function getExecutorOverrides(mode: any, executorKey: string): any {
  if (!mode || !mode.overrides) return {};
  const { overrides } = mode;
  if (overrides.executors && overrides.executors[executorKey]) {
    return overrides.executors[executorKey];
  }
  if (overrides[executorKey]) {
    return overrides[executorKey];
  }
  return overrides;
}

export function extractExecutorOverrides(agentGenie: any, executorKey: string): any {
  if (!agentGenie || typeof agentGenie !== 'object') return {};
  const {
    executor,
    background: _background,
    preset: _preset,
    mode: _mode,
    executionMode: _executionMode,
    json: _json,
    ...rest
  } = agentGenie;
  const overrides: Record<string, any> = {};
  const executorDef = EXECUTORS[executorKey]?.defaults;
  const topLevelKeys = executorDef ? new Set(Object.keys(executorDef)) : null;

  Object.entries(rest || {}).forEach(([key, value]) => {
    if (key === 'json') return;
    if (key === 'exec' || key === 'resume') {
      overrides[key] = mergeDeep(overrides[key], deepClone(value));
      return;
    }
    if (topLevelKeys && topLevelKeys.has(key)) {
      overrides[key] = mergeDeep(overrides[key], deepClone(value));
      return;
    }
    if (!overrides.exec) overrides.exec = {};
    overrides.exec[key] = mergeDeep(overrides.exec[key], deepClone(value));
  });

  return overrides;
}

function deepClone<T>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T;
}

function mergeDeep(target: any, source: any): any {
  if (source === null || source === undefined) return target;
  if (Array.isArray(source)) {
    return source.slice();
  }
  if (typeof source !== 'object') {
    return source;
  }
  const base = target && typeof target === 'object' && !Array.isArray(target) ? { ...target } : {};
  Object.entries(source).forEach(([key, value]) => {
    base[key] = mergeDeep(base[key], value);
  });
  return base;
}

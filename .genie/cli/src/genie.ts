#!/usr/bin/env node
/**
 * GENIE Agent CLI - Codex exec orchestration with configurable execution modes
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { loadExecutors, DEFAULT_EXECUTOR_KEY } from './executors';
import type { Executor, ExecutorCommand } from './executors/types';
import { renderEnvelope, ViewEnvelope, ViewStyle, Tone } from './view';
import {
  buildHelpView,
  buildRunHelpView,
  buildResumeHelpView,
  buildListHelpView,
  buildViewHelpView,
  buildStopHelpView,
  buildGeneralHelpView
} from './views/help';
import { buildAgentCatalogView } from './views/agent-catalog';
import { buildRunsOverviewView, RunRow } from './views/runs';
import { buildBackgroundStartingView, buildBackgroundPendingView, buildBackgroundStartView, buildRunCompletionView } from './views/background';
import { buildStopView, StopEvent } from './views/stop';
import { buildErrorView, buildWarningView, buildInfoView } from './views/common';
import { buildChatView, ChatMessage } from './views/chat';
import BackgroundManager, {
  INTERNAL_BACKGROUND_ENV,
  INTERNAL_START_TIME_ENV,
  INTERNAL_LOG_PATH_ENV
} from './background-manager';
import {
  loadSessions,
  saveSessions,
  SessionLoadConfig,
  SessionPathsConfig,
  SessionStore,
  SessionEntry
} from './session-store';

let YAML: typeof import('yaml') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  YAML = require('yaml');
} catch (_) {
  // yaml module optional
}

interface CLIOptions {
  rawArgs: string[];
  background: boolean;
  backgroundExplicit: boolean;
  backgroundRunner: boolean;
  requestHelp?: boolean;
  full: boolean;
  live: boolean;
}

interface ParsedCommand {
  command?: string;
  commandArgs: string[];
  options: CLIOptions;
}

interface ConfigPaths {
  baseDir?: string;
  sessionsFile?: string;
  logsDir?: string;
  backgroundDir?: string;
  executors?: Record<string, Record<string, any>>;
}

interface GenieConfig {
  defaults?: {
    executionMode?: string;
    preset?: string;
    background?: boolean;
    executor?: string;
  };
  paths?: ConfigPaths;
  executors?: Record<string, any>;
  executionModes?: Record<string, any>;
  presets?: Record<string, any>;
  background?: {
    enabled?: boolean;
    detach?: boolean;
    pollIntervalMs?: number;
    sessionExtractionDelayMs?: number;
  };
  __configPath?: string;
}

interface AgentSpec {
  meta?: Record<string, any>;
  instructions: string;
}

const EXECUTORS: Record<string, Executor> = loadExecutors();
if (!EXECUTORS[DEFAULT_EXECUTOR_KEY]) {
  const available = Object.keys(EXECUTORS).join(', ') || 'none';
  throw new Error(`Default executor '${DEFAULT_EXECUTOR_KEY}' not found. Available executors: ${available}`);
}

const SCRIPT_DIR = path.dirname(__filename);
const CONFIG_PATH = path.join(SCRIPT_DIR, 'config.yaml');
const backgroundManager = new BackgroundManager();

const startupWarnings: string[] = [];
const runtimeWarnings: string[] = [];

function recordStartupWarning(message: string): void {
  startupWarnings.push(message);
}

function recordRuntimeWarning(message: string): void {
  runtimeWarnings.push(message);
}

const BASE_CONFIG: GenieConfig = {
  defaults: {
    background: true,
    executor: DEFAULT_EXECUTOR_KEY
  },
  paths: {
    baseDir: '.',
    sessionsFile: '.genie/state/agents/sessions.json',
    logsDir: '.genie/state/agents/logs',
    backgroundDir: '.genie/state/agents/background'
  },
  executors: {},
  executionModes: {
    default: {
      description: 'Workspace-write automation with GPT-5 Codex.',
      executor: DEFAULT_EXECUTOR_KEY,
      overrides: {
        exec: {
          model: 'gpt-5-codex',
          sandbox: 'workspace-write',
          fullAuto: true
        }
      }
    },
    careful: {
      description: 'Read-only approval-aware agent run.',
      overrides: {
        exec: {
          sandbox: 'read-only'
        }
      }
    },
    danger: {
      description: 'Full access execution for externally sandboxed environments only.',
      overrides: {
        exec: {
          sandbox: 'danger-full-access',
          fullAuto: false,
          additionalArgs: ['--dangerously-bypass-approvals-and-sandbox']
        }
      }
    },
    debug: {
      description: 'Enable plan tool and web search for architecture/deep analysis sessions.',
      overrides: {
        exec: {
          includePlanTool: true,
          search: true
        }
      }
    }
  },
  background: {
    enabled: true,
    detach: true,
    pollIntervalMs: 1500,
    sessionExtractionDelayMs: 2000
  }
};

const DEFAULT_CONFIG: GenieConfig = buildDefaultConfig();

void main();

async function main(): Promise<void> {
  try {
    let parsed = parseArguments(process.argv.slice(2));
    const envIsBackground = process.env[INTERNAL_BACKGROUND_ENV] === '1';
    if (envIsBackground) {
      parsed.options.background = true;
      parsed.options.backgroundRunner = true;
      parsed.options.backgroundExplicit = true;
    }

    const config = loadConfig();
    applyDefaults(parsed.options, config.defaults);
    const paths = resolvePaths(config.paths || {});
    prepareDirectories(paths);

    await flushStartupWarnings(parsed.options);

    switch (parsed.command) {
      case 'run':
        if (parsed.options.requestHelp) {
          await emitView(buildRunHelpView(), parsed.options);
          return;
        }
        await runChat(parsed, config, paths);
        break;
      case 'resume':
        if (parsed.options.requestHelp) {
          await emitView(buildResumeHelpView(), parsed.options);
          return;
        }
        await runContinue(parsed, config, paths);
        break;
      case 'list':
        if (parsed.options.requestHelp) {
          await emitView(buildListHelpView(), parsed.options);
          return;
        }
        await runList(parsed, config, paths);
        break;
      case 'view':
        if (parsed.options.requestHelp) {
          await emitView(buildViewHelpView(), parsed.options);
          return;
        }
        await runView(parsed, config, paths);
        break;
      case 'stop':
        if (parsed.options.requestHelp) {
          await emitView(buildStopHelpView(), parsed.options);
          return;
        }
        await runStop(parsed, config, paths);
        break;
      case 'help':
      case undefined:
        await runHelp(parsed, config, paths);
        break;
      default: {
        await emitView(buildErrorView('Unknown command', `Unknown command: ${parsed.command}`), parsed.options, { stream: process.stderr });
        await runHelp(parsed, config, paths);
        process.exitCode = 1;
        break;
      }
    }
    await flushRuntimeWarnings(parsed.options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await emitEmergencyError(message);
    process.exitCode = 1;
  }
}

function parseArguments(argv: string[]): ParsedCommand {
  const raw = argv.slice();
  const command = raw.shift()?.toLowerCase();
  const options: CLIOptions = {
    rawArgs: argv.slice(),
    background: false,
    backgroundExplicit: false,
    backgroundRunner: false,
    requestHelp: undefined,
    full: false,
    live: false
  };

  const filtered: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const token = raw[i];
    if (token === '--help' || token === '-h') {
      options.requestHelp = true;
      continue;
    }
    if (token === '--full') {
      options.full = true;
      continue;
    }
    if (token === '--live') {
      options.live = true;
      continue;
    }
    if (token === '--') {
      filtered.push(...raw.slice(i + 1));
      break;
    }
    filtered.push(token);
  }

  return { command, commandArgs: filtered, options };
}

async function emitView(
  envelope: ViewEnvelope,
  options: CLIOptions,
  opts: { stream?: NodeJS.WriteStream; forceJson?: boolean } = {}
): Promise<void> {
  const style: ViewStyle = 'genie';
  const styledEnvelope: ViewEnvelope = { ...envelope, style };
  await renderEnvelope(styledEnvelope, {
    json: opts.forceJson ?? false,
    stream: opts.stream,
    style
  });
}

async function emitEmergencyError(message: string): Promise<void> {
  const envelope = buildErrorView('Fatal error', message);
  await renderEnvelope(envelope, { json: false, stream: process.stderr });
}

async function flushStartupWarnings(options: CLIOptions): Promise<void> {
  if (!startupWarnings.length) return;
  const envelope = buildWarningView('Configuration warnings', [...startupWarnings]);
  await emitView(envelope, options);
  startupWarnings.length = 0;
}

async function flushRuntimeWarnings(options: CLIOptions): Promise<void> {
  if (!runtimeWarnings.length) return;
  const envelope = buildWarningView('Runtime warnings', [...runtimeWarnings]);
  await emitView(envelope, options);
  runtimeWarnings.length = 0;
}

function applyDefaults(options: CLIOptions, defaults?: GenieConfig['defaults']): void {
  if (!options.backgroundExplicit) {
    options.background = Boolean(defaults?.background);
  }
}

function loadConfig(): GenieConfig {
  let config = deepClone(DEFAULT_CONFIG);
  const configFilePath = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : null;

  if (configFilePath) {
    try {
      const raw = fs.readFileSync(configFilePath, 'utf8');
      if (raw.trim().length) {
        let parsed: any = {};
        if (YAML) {
          parsed = YAML.parse(raw) || {};
        } else if (raw.trim().startsWith('{')) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = {};
          }
        } else {
          recordStartupWarning('[genie] YAML module unavailable; ignoring config overrides. Install "yaml" to enable parsing.');
          parsed = {};
        }
        config = mergeDeep(config, parsed);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse ${configFilePath}: ${message}`);
    }
    config.__configPath = configFilePath;
  } else {
    config.__configPath = CONFIG_PATH;
  }

  return config;
}

function deepClone<T>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T;
}

function buildDefaultConfig(): GenieConfig {
  const config = deepClone(BASE_CONFIG);
  config.executors = config.executors || {};
  Object.entries(EXECUTORS).forEach(([key, executor]) => {
    config.executors![key] = executor.defaults || {};
  });
  return config;
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

function resolvePaths(paths: ConfigPaths): Required<ConfigPaths> {
  const baseDir = paths.baseDir || '.';
  return {
    baseDir,
    sessionsFile: paths.sessionsFile || path.join(baseDir, '.genie/state/agents/sessions.json'),
    logsDir: paths.logsDir || path.join(baseDir, '.genie/state/agents/logs'),
    backgroundDir: paths.backgroundDir || path.join(baseDir, '.genie/state/agents/background'),
    executors: paths.executors || {}
  };
}

function prepareDirectories(paths: Required<ConfigPaths>): void {
  [paths.logsDir, paths.backgroundDir, path.dirname(paths.sessionsFile)].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

async function maybeHandleBackgroundLaunch(params: {
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
    scriptPath: __filename
  });

  entry.runnerPid = runnerPid;
  entry.status = 'running';
  entry.background = parsed.options.background;
  saveSessions(paths as SessionPathsConfig, store);

  // Print directly to stdout instead of using Ink for background
  process.stdout.write(`▸ Launching ${agentName} in background...\n`);

  // Poll for session ID (up to 20 seconds with progress indicator)
  const pollStart = Date.now();
  const pollTimeout = 20000; // 20 seconds
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let spinnerIndex = 0;

  while (Date.now() - pollStart < pollTimeout) {
    await sleep(250);
    const liveStore = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);
    const liveEntry = liveStore.agents?.[agentName];

    if (liveEntry?.sessionId) {
      // Clear spinner line
      process.stdout.write('\r\x1b[K');

      entry.sessionId = liveEntry.sessionId;
      process.stdout.write(`▸ Session ID: ${liveEntry.sessionId}\n\n`);
      process.stdout.write(`  View output:\n`);
      process.stdout.write(`    ./genie view ${liveEntry.sessionId}\n\n`);
      process.stdout.write(`  Continue conversation:\n`);
      process.stdout.write(`    ./genie resume ${liveEntry.sessionId} "<your message>"\n\n`);
      process.stdout.write(`  Stop session:\n`);
      process.stdout.write(`    ./genie stop ${liveEntry.sessionId}\n`);
      return true;
    }

    // Show spinner while waiting
    const elapsed = Math.floor((Date.now() - pollStart) / 1000);
    process.stdout.write(`\r${spinner[spinnerIndex++ % spinner.length]} Waiting for session ID... (${elapsed}s)`);
  }

  // Timeout - show pending with helpful commands
  process.stdout.write('\r\x1b[K');
  process.stdout.write(`▸ Session started but ID not available yet\n\n`);
  process.stdout.write(`  List sessions to find ID:\n`);
  process.stdout.write(`    ./genie list sessions\n\n`);
  process.stdout.write(`  Then view output:\n`);
  process.stdout.write(`    ./genie view <sessionId>\n`);
  return true;
}

async function runChat(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
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

  const startTime = deriveStartTime();
  const logFile = deriveLogFile(resolvedAgentName, startTime, paths);

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

// Due to size, remaining functions continue...
interface ExecuteRunArgs {
  agentName: string;
  command: ExecutorCommand;
  executorKey: string;
  executor: Executor;
  executorConfig: any;
  executorPaths: any;
  prompt: string;
  store: SessionStore;
  entry: SessionEntry;
  paths: Required<ConfigPaths>;
  config: GenieConfig;
  startTime: number;
  logFile: string;
  background: boolean;
  runnerPid: number | null;
  cliOptions: CLIOptions;
  executionMode: string;
}

function resolveExecutorKey(config: GenieConfig, modeName: string): string {
  const modes = config.executionModes || config.presets || {};
  const mode = modes[modeName];
  if (mode && mode.executor) return mode.executor;
  if (config.defaults && config.defaults.executor) return config.defaults.executor;
  return DEFAULT_EXECUTOR_KEY;
}

function requireExecutor(key: string): Executor {
  const executor = EXECUTORS[key];
  if (!executor) {
    const available = Object.keys(EXECUTORS).join(', ') || 'none';
    throw new Error(`Executor '${key}' not found. Available executors: ${available}`);
  }
  return executor;
}

function buildExecutorConfig(config: GenieConfig, modeName: string, executorKey: string, agentOverrides: any): any {
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

function resolveExecutorPaths(paths: Required<ConfigPaths>, executorKey: string): any {
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

function extractExecutorOverrides(agentGenie: any, executorKey: string): any {
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

function executeRun(args: ExecuteRunArgs): Promise<void> {
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

  if (proc.stdout) proc.stdout.pipe(logStream);
  if (proc.stderr) proc.stderr.pipe(logStream);

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

  if (proc.stdout) {
    let buffer = '';
    proc.stdout.on('data', (chunk: Buffer | string) => {
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
  }

  if (!background) {
    if (proc.stdout) proc.stdout.pipe(process.stdout);
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

    const logViewer = executor.logViewer;
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

  const defaultDelay = (config.background && config.background.sessionExtractionDelayMs) || 2000;
  const sessionDelay = executor.getSessionExtractionDelay
    ? executor.getSessionExtractionDelay({ config: executorConfig, defaultDelay })
    : defaultDelay;

  if (executor.extractSessionId) {
    setTimeout(() => {
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
      }
    }, sessionDelay);
  }

  return promise;
}

function loadAgentSpec(name: string): AgentSpec {
  const base = name.endsWith('.md') ? name.slice(0, -3) : name;
  const agentPath = path.join('.genie', 'agents', `${base}.md`);
  if (!fs.existsSync(agentPath)) {
    throw new Error(`❌ Agent '${name}' not found in .genie/agents`);
  }
  const content = fs.readFileSync(agentPath, 'utf8');
  const { meta, body } = extractFrontMatter(content);
  return {
    meta,
    instructions: body.replace(/^(\r?\n)+/, '')
  };
}

function extractFrontMatter(source: string): { meta?: Record<string, any>; body: string } {
  if (!source.startsWith('---')) {
    return { meta: {}, body: source };
  }
  const end = source.indexOf('\n---', 3);
  if (end === -1) {
    return { meta: {}, body: source };
  }
  const raw = source.slice(3, end).trim();
  const body = source.slice(end + 4);
  if (!YAML) {
    recordStartupWarning('[genie] YAML module unavailable; front matter metadata ignored.');
    return { meta: {}, body };
  }
  try {
    const parsed = YAML.parse(raw) || {};
    return { meta: parsed, body };
  } catch {
    return { meta: {}, body };
  }
}

function deriveStartTime(): number {
  const fromEnv = process.env[INTERNAL_START_TIME_ENV];
  if (!fromEnv) return Date.now();
  const parsed = Number(fromEnv);
  if (Number.isFinite(parsed)) return parsed;
  return Date.now();
}

function sanitizeLogFilename(agentName: string): string {
  const fallback = 'agent';
  if (!agentName || typeof agentName !== 'string') return fallback;
  const normalized = agentName
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/\.+/g, '.')
    .replace(/^-+|-+$/g, '')
    .replace(/^\.+|\.+$/g, '');
  return normalized.length ? normalized : fallback;
}

function deriveLogFile(agentName: string, startTime: number, paths: Required<ConfigPaths>): string {
  const envPath = process.env[INTERNAL_LOG_PATH_ENV];
  if (envPath) return envPath;
  const filename = `${sanitizeLogFilename(agentName)}-${startTime}.log`;
  return path.join(paths.logsDir || '.genie/state/agents/logs', filename);
}

function formatPathRelative(targetPath: string, baseDir: string): string {
  if (!targetPath) return 'n/a';
  try {
    return path.relative(baseDir, targetPath) || targetPath;
  } catch {
    return targetPath;
  }
}

function safeIsoString(value: string): string | null {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'n/a';
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(value).toLocaleDateString();
}

async function runContinue(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  // Help is handled in the main switch statement

  const cmdArgs = parsed.commandArgs;
  if (cmdArgs.length < 2) {
    throw new Error('Usage: genie resume <sessionId> "<prompt>"');
  }

  const store = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);
  const sessionIdArg = cmdArgs[0];
  const prompt = cmdArgs.slice(1).join(' ').trim();
  const found = findSessionEntry(store, sessionIdArg, paths);
  if (!found) throw new Error(`❌ No run found with session id '${sessionIdArg}'`);

  const { agentName, entry: session } = found;
  if (!session || !session.sessionId) {
    throw new Error(`❌ No active session for agent '${agentName}'`);
  }

  const agentSpec = loadAgentSpec(agentName);
  const agentMeta = agentSpec.meta || {};
  const agentGenie = agentMeta.genie || {};
  if (!parsed.options.backgroundExplicit && typeof agentGenie.background === 'boolean') {
    parsed.options.background = agentGenie.background;
  }
  const defaultMode = config.defaults?.executionMode || config.defaults?.preset || 'default';
  const storedMode = session.mode || session.preset;
  const agentMode = agentGenie.mode || agentGenie.executionMode || agentGenie.preset;
  const modeName = typeof storedMode === 'string' && storedMode.trim().length
    ? storedMode.trim()
    : typeof agentMode === 'string' && agentMode.trim().length
      ? agentMode.trim()
      : defaultMode;
  session.mode = modeName;
  session.preset = modeName;

  const executorKey = session.executor || agentGenie.executor || resolveExecutorKey(config, modeName);
  const executor = requireExecutor(executorKey);
  const executorOverrides = extractExecutorOverrides(agentGenie, executorKey);
  const executorConfig = buildExecutorConfig(config, modeName, executorKey, executorOverrides);
  const executorPaths = resolveExecutorPaths(paths, executorKey);
  const command = executor.buildResumeCommand({
    config: executorConfig,
    sessionId: session.sessionId || undefined,
    prompt
  });

  const startTime = deriveStartTime();
  const logFile = deriveLogFile(agentName, startTime, paths);

  session.lastPrompt = prompt ? prompt.slice(0, 200) : session.lastPrompt;
  session.lastUsed = new Date().toISOString();
  session.logFile = logFile;
  session.status = 'starting';
  session.background = parsed.options.background;
  session.runnerPid = parsed.options.backgroundRunner ? process.pid : null;
  session.executor = executorKey;
  session.executorPid = null;
  session.exitCode = null;
  session.signal = null;
  saveSessions(paths as SessionPathsConfig, store);

  const handledBackground = await maybeHandleBackgroundLaunch({
    parsed,
    config,
    paths,
    store,
    entry: session,
    agentName,
    executorKey,
    executionMode: modeName,
    startTime,
    logFile,
    allowResume: false
  });

  if (handledBackground) {
    return;
  }

  await executeRun({
    agentName,
    command,
    executorKey,
    executor,
    executorConfig,
    executorPaths,
    prompt,
    store,
    entry: session,
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


async function runRuns(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const warnings: string[] = [];
  const store = loadSessions(
    paths as SessionPathsConfig,
    config as SessionLoadConfig,
    DEFAULT_CONFIG as any,
    { onWarning: (message) => warnings.push(message) }
  );

  const entries = Object.entries(store.agents || {});
  const rows: RunRow[] = entries.map(([agent, entry]) => {
    const iso = entry.lastUsed ? safeIsoString(entry.lastUsed) : entry.created ? safeIsoString(entry.created) : null;
    return {
      agent,
      status: resolveDisplayStatus(entry),
      sessionId: entry.sessionId || null,
      updated: iso ? formatRelativeTime(iso) : 'n/a',
      updatedIso: iso,
      log: entry.logFile ? formatPathRelative(entry.logFile, paths.baseDir || '.') : null
    };
  });

  const isActive = (row: RunRow) => {
    const normalized = (row.status || '').toLowerCase();
    return normalized.startsWith('running') || normalized.startsWith('pending');
  };

  const sortByUpdated = (a: RunRow, b: RunRow) => {
    const aTime = a.updatedIso ? new Date(a.updatedIso).getTime() : 0;
    const bTime = b.updatedIso ? new Date(b.updatedIso).getTime() : 0;
    return bTime - aTime;
  };

  const active = rows.filter(isActive).sort(sortByUpdated);
  const recent = rows.filter((row) => !isActive(row)).sort(sortByUpdated).slice(0, 10);

  const envelope = buildRunsOverviewView({
    active,
    recent,
    warnings: warnings.length ? warnings : undefined
  });
  await emitView(envelope, parsed.options);
}

async function runList(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const [targetRaw] = parsed.commandArgs;
  const target = (targetRaw || 'agents').toLowerCase();

  if (target === 'agents') {
    await emitAgentCatalog(parsed, config, paths);
    return;
  }

  if (target === 'sessions') {
    await runRuns(parsed, config, paths);
    return;
  }

  await emitView(
    buildErrorView('Unknown list target', `Unknown list target '${targetRaw}'. Try 'agents' or 'sessions'.`),
    parsed.options,
    { stream: process.stderr }
  );
  process.exitCode = 1;
}

async function runView(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const [sessionId] = parsed.commandArgs;
  if (!sessionId) {
    await emitView(buildInfoView('View usage', ['Usage: genie view <sessionId> [--full]']), parsed.options);
    return;
  }

  const warnings: string[] = [];
  const store = loadSessions(
    paths as SessionPathsConfig,
    config as SessionLoadConfig,
    DEFAULT_CONFIG as any,
    { onWarning: (message) => warnings.push(message) }
  );
  const found = findSessionEntry(store, sessionId, paths);
  if (!found) {
    await emitView(buildErrorView('Run not found', `No run found with session id '${sessionId}'`), parsed.options, { stream: process.stderr });
    return;
  }
  const { entry } = found;
  const executorKey = entry.executor || config.defaults?.executor || DEFAULT_EXECUTOR_KEY;
  const executor = requireExecutor(executorKey);
  const logViewer = executor.logViewer;
  const logFile = entry.logFile;
  if (!logFile || !fs.existsSync(logFile)) {
    await emitView(buildErrorView('Log missing', '❌ Log not found for this run'), parsed.options, { stream: process.stderr });
    return;
  }

  const raw = fs.readFileSync(logFile, 'utf8');
  const allLines = raw.split(/\r?\n/);

  if (!entry.sessionId && logViewer?.extractSessionIdFromContent) {
    const sessionFromLog = logViewer.extractSessionIdFromContent(allLines);
    if (sessionFromLog) {
      entry.sessionId = sessionFromLog;
      saveSessions(paths as SessionPathsConfig, store);
    }
  }

  const jsonl: Array<Record<string, any>> = [];
  for (const line of allLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!trimmed.startsWith('{')) continue;
    try { jsonl.push(JSON.parse(trimmed)); } catch { /* skip */ }
  }

  const transcript = buildTranscriptFromEvents(jsonl);

  // Concise mode: plain text output for non-full views
  if (!parsed.options.full && !parsed.options.live) {
    const lastMessage = transcript.length > 0 ? transcript[transcript.length - 1] : null;
    const lastMessageText = lastMessage
      ? `${lastMessage.title ? lastMessage.title + ': ' : ''}${lastMessage.body.join(' ').substring(0, 200)}`
      : 'No messages yet';

    const conciseOutput = JSON.stringify({
      session: entry.sessionId ?? 'pending',
      status: entry.status ?? 'unknown',
      executor: entry.executor ?? 'unknown',
      lastMessage: lastMessageText
    }, null, 2);

    process.stdout.write(conciseOutput + '\n');
    return;
  }

  const displayTranscript = parsed.options.full
    ? transcript
    : parsed.options.live
      ? sliceTranscriptForLatest(transcript)
      : sliceTranscriptForRecent(transcript);
  const metaItems: Array<{ label: string; value: string; tone?: Tone }> = [];
  if (entry.executor) metaItems.push({ label: 'Executor', value: String(entry.executor) });
  const executionMode = entry.mode || entry.preset;
  if (executionMode) metaItems.push({ label: 'Execution mode', value: String(executionMode) });
  if (entry.background !== undefined) {
    metaItems.push({ label: 'Background', value: entry.background ? 'detached' : 'attached' });
  }

  const envelope = buildChatView({
    agent: entry.agent ?? 'unknown',
    sessionId: entry.sessionId ?? null,
    status: entry.status ?? null,
    messages: displayTranscript,
    meta: metaItems.length ? metaItems : undefined,
    showFull: Boolean(parsed.options.full),
    hint: !parsed.options.full && transcript.length > displayTranscript.length
      ? parsed.options.live
        ? 'Add --full to replay the entire session or remove --live to see more messages.'
        : 'Add --full to replay the entire session.'
      : undefined
  });
  await emitView(envelope, parsed.options);
  if (warnings.length) {
    await emitView(buildWarningView('Session warnings', warnings), parsed.options);
  }
}

async function runStop(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const [target] = parsed.commandArgs;
  if (!target) {
    throw new Error('Usage: genie stop <sessionId>');
  }

  const warnings: string[] = [];
  const store = loadSessions(
    paths as SessionPathsConfig,
    config as SessionLoadConfig,
    DEFAULT_CONFIG as any,
    { onWarning: (message) => warnings.push(message) }
  );
  const found = findSessionEntry(store, target, paths);
  const events: StopEvent[] = [];
  let summary = '';
  const appendWarningView = async () => {
    if (warnings.length) {
      await emitView(buildWarningView('Session warnings', warnings), parsed.options);
    }
  };

  if (!found) {
    events.push({ label: target, status: 'failed', message: 'Session id not found' });
    summary = `No run found with session id '${target}'.`;
    const envelope = buildStopView({ target, events, summary });
    await emitView(envelope, parsed.options);
    await appendWarningView();
    return;
  }

  const { agentName, entry } = found;
  const identifier = entry.sessionId || agentName;
  const alivePids = [entry.runnerPid, entry.executorPid].filter((pid) => backgroundManager.isAlive(pid)) as number[];

  if (!alivePids.length) {
    events.push({ label: identifier, detail: 'No active process', status: 'pending' });
    summary = `No active process found for ${identifier}.`;
  } else {
    alivePids.forEach((pid) => {
      try {
        const ok = backgroundManager.stop(pid);
        if (ok !== false) {
          events.push({ label: `${identifier}`, detail: `PID ${pid} stopped`, status: 'done' });
        } else {
          events.push({ label: `${identifier}`, detail: `PID ${pid} not running`, status: 'failed' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        events.push({ label: `${identifier}`, detail: `PID ${pid}`, status: 'failed', message });
      }
    });
    summary = `Stop signal handled for ${identifier}`;
    entry.status = 'stopped';
    entry.lastUsed = new Date().toISOString();
    entry.signal = entry.signal || 'SIGTERM';
    if (entry.exitCode === undefined) entry.exitCode = null;
    saveSessions(paths as SessionPathsConfig, store);
  }

  const envelope = buildStopView({ target, events, summary });
  await emitView(envelope, parsed.options);
  await appendWarningView();
}

function buildBackgroundActions(
  sessionId: string | null | undefined,
  options: { resume?: boolean; includeStop?: boolean }
): string[] {
  if (!sessionId) {
    const lines: string[] = [
      '• View: session pending – run `genie list sessions` then `genie view <sessionId>`'
    ];
    if (options.resume) {
      lines.push('• Resume: session pending – run `genie resume <sessionId> "<prompt>"` once available');
    }
    if (options.includeStop) {
      lines.push('• Stop: session pending – run `genie stop <sessionId>` once available');
    }
    return lines;
  }

  const lines: string[] = [`• View: genie view ${sessionId}`];

  if (options.resume) {
    lines.push(`• Resume: genie resume ${sessionId} "<prompt>"`);
  }

  if (options.includeStop) {
    lines.push(`• Stop: genie stop ${sessionId}`);
  }

  return lines;
}

async function resolveSessionIdForBanner(
  agentName: string,
  config: GenieConfig,
  paths: Required<ConfigPaths>,
  current: string | null | undefined,
  logFile: string | null | undefined,
  onProgress?: (frame: string) => Promise<void>,
  timeoutMs: number | null = null,
  intervalMs = 250
): Promise<string | null> {
  if (current) return current;
  const startedAt = Date.now();
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;

  while (true) {
    const elapsed = Date.now() - startedAt;
    if (timeoutMs !== null && elapsed >= timeoutMs) {
      return current ?? null;
    }

    try {
      const liveStore = loadSessions(
        paths as SessionPathsConfig,
        config as SessionLoadConfig,
        DEFAULT_CONFIG as any
      );
      const agentEntry = liveStore.agents?.[agentName];
      if (agentEntry?.sessionId) {
        return agentEntry.sessionId;
      }

      if (onProgress) {
        const frame = frames[frameIndex++ % frames.length];
        onProgress(frame).catch(() => {}); // Fire and forget - don't block polling
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      recordRuntimeWarning(`[genie] Failed to refresh session id for banner: ${message}`);
      if (timeoutMs === null) {
        await sleep(intervalMs);
        continue;
      }
      return current ?? null;
    }

    await sleep(intervalMs);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findSessionEntry(
  store: SessionStore,
  sessionId: string,
  paths: Required<ConfigPaths>
) {
  if (!sessionId || typeof sessionId !== 'string') return null;
  const trimmed = sessionId.trim();
  if (!trimmed) return null;

  for (const [agentName, entry] of Object.entries(store.agents || {})) {
    if (entry && entry.sessionId === trimmed) {
      return { agentName, entry };
    }
  }

  for (const [agentName, entry] of Object.entries(store.agents || {})) {
    const logFile = entry.logFile;
    if (!logFile || !fs.existsSync(logFile)) continue;
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const marker = new RegExp(`"session_id":"${trimmed}"`);
      if (marker.test(content)) {
        entry.sessionId = trimmed;
        entry.lastUsed = new Date().toISOString();
        saveSessions(paths as SessionPathsConfig, store);
        return { agentName, entry };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      recordRuntimeWarning(`[genie] Failed to scan log ${logFile}: ${message}`);
    }
  }
  return null;
}

function resolveDisplayStatus(entry: SessionEntry): string {
  const baseStatus = entry.status || 'unknown';
  const executorRunning = backgroundManager.isAlive(entry.executorPid);
  const runnerRunning = backgroundManager.isAlive(entry.runnerPid);

  if (baseStatus === 'running') {
    if (executorRunning) return 'running';
    if (!executorRunning && runnerRunning) return 'pending-completion';
    if (entry.exitCode === 0) return 'completed';
    if (typeof entry.exitCode === 'number' && entry.exitCode !== 0) {
      return `failed (${entry.exitCode})`;
    }
    return 'stopped';
  }

  if (baseStatus === 'completed' || baseStatus === 'failed') {
    return baseStatus;
  }

  if (runnerRunning || executorRunning) {
    return 'running';
  }
  return baseStatus;
}

async function runHelp(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  // Always show main help - no subcommand help through 'genie help <command>'
  const backgroundDefault = Boolean(config.defaults && config.defaults.background);
  const commandRows = [
    { command: 'run', args: '<agent> "<prompt>"', description: 'Start or attach to an agent' },
    { command: 'list agents', args: '', description: 'Show all available agents' },
    { command: 'list sessions', args: '', description: 'Display active and recent runs' },
    { command: 'resume', args: '<sessionId> "<prompt>"', description: 'Continue a background session' },
    { command: 'view', args: '<sessionId> [--full]', description: 'Show transcript for a session' },
    { command: 'stop', args: '<sessionId>', description: 'End a background session' },
    { command: 'help', args: '', description: 'Show this panel' }
  ];

  const envelope = buildHelpView({
    backgroundDefault,
    commandRows,
    promptFramework: {
      title: '🧞 Genie Framework',
      bulletPoints: [
        'Plan → Load mission/roadmap/standards context, clarify scope, log assumptions/decisions, and produce the planning brief with branch/tracker guidance.',
        'Wish → Convert the planning brief into an approved wish with context ledger, inline <spec_contract>, execution groups, and blocker protocol.',
        'Forge → Break the wish into execution groups and task files, document validation hooks, evidence paths, personas, and branch strategy before implementation.',
        'Review → Audit delivery by consolidating evidence, replaying agreed checks, and issuing a verdict or follow-up report before marking the wish complete.'
      ]
    },
    examples: [
      'genie run plan "[Discovery] mission @.genie/product/mission.md"',
      'genie run --help  # Show help for run command',
      'genie view RUN-1234',
      'genie list agents --help  # Show help for list command'
    ]
  });

  await emitView(envelope, parsed.options);
}

interface ListedAgent {
  id: string;
  label: string;
  meta: any;
  folder: string | null;
}

function listAgents(): ListedAgent[] {
  const baseDir = '.genie/agents';
  const records: ListedAgent[] = [];
  if (!fs.existsSync(baseDir)) return records;
  const visit = (dirPath: string, relativePath: string | null) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    entries.forEach((entry) => {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath, relativePath ? path.join(relativePath, entry.name) : entry.name);
        return;
      }
      if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'README.md') return;
      const rawId = relativePath ? path.join(relativePath, entry.name) : entry.name;
      const normalizedId = rawId.replace(/\.md$/i, '').split(path.sep).join('/');
      const content = fs.readFileSync(entryPath, 'utf8');
      const { meta } = extractFrontMatter(content);
      const metaObj = meta || {};
      if (metaObj.hidden === true || metaObj.disabled === true) return;
      const label = (metaObj.name || normalizedId.split('/').pop() || normalizedId).trim();
      const folder = normalizedId.includes('/') ? normalizedId.split('/').slice(0, -1).join('/') : null;
      records.push({ id: normalizedId, label, meta: metaObj, folder });
    });
  };

  visit(baseDir, null);
  return records;
}

async function emitAgentCatalog(parsed: ParsedCommand, _config: GenieConfig, _paths: Required<ConfigPaths>): Promise<void> {
  const agents = listAgents();
  const summarize = (entry: ListedAgent) => {
    const description = ((entry.meta?.description || entry.meta?.summary || '') as string).replace(/\s+/g, ' ').trim();
    return truncateText(description || '—', 96);
  };
  const grouped = new Map<string, ListedAgent[]>();
  agents.forEach((entry) => {
    const folder = entry.folder ?? '.';
    if (!grouped.has(folder)) grouped.set(folder, []);
    grouped.get(folder)!.push(entry);
  });

  const orderedFolders = Array.from(grouped.keys()).sort((a, b) => {
    if (a === '.') return -1;
    if (b === '.') return 1;
    return a.localeCompare(b);
  });

  const groups = orderedFolders.map((folder) => ({
    label: folder === '.' ? 'root' : folder,
    rows: grouped
      .get(folder)!
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((entry) => ({ id: entry.id, summary: summarize(entry) }))
  }));

  const envelope = buildAgentCatalogView({
    total: agents.length,
    groups
  });

  await emitView(envelope, parsed.options);
}

function resolveAgentIdentifier(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    throw new Error('Agent id is required');
  }
  const normalized = trimmed.replace(/\.md$/i, '');
  const normalizedLower = normalized.toLowerCase();

  const directCandidates = [normalized, normalizedLower];
  for (const candidate of directCandidates) {
    if (agentExists(candidate)) return candidate.replace(/\\/g, '/');
  }

  const agents = listAgents();
  const byExactId = agents.find((agent) => agent.id.toLowerCase() === normalizedLower);
  if (byExactId) return byExactId.id;

  const byLabel = agents.find((agent) => agent.label.toLowerCase() === normalizedLower);
  if (byLabel) return byLabel.id;

  const legacy = normalizedLower.replace(/^genie-/, '').replace(/^template-/, '');
  const legacyCandidates = [legacy, `core/${legacy}`, `specialized/${legacy}`];
  for (const candidate of legacyCandidates) {
    if (agentExists(candidate)) return candidate;
  }

  if (normalizedLower === 'forge-master' && agentExists('forge')) return 'forge';

  throw new Error(`❌ Agent '${input}' not found. Try 'genie list agents' to see available ids.`);
}

function agentExists(id: string): boolean {
  if (!id) return false;
  const normalized = id.replace(/\\/g, '/');
  const file = path.join('.genie', 'agents', `${normalized}.md`);
  return fs.existsSync(file);
}

function truncateText(text: string, maxLength = 64): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  const sliceLength = Math.max(0, maxLength - 3);
  return text.slice(0, sliceLength).trimEnd() + '...';
}

function buildTranscriptFromEvents(events: Array<Record<string, any>>): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const commandIndex = new Map<string, number>();
  const toolIndex = new Map<string, number>();

  const pushMessage = (message: ChatMessage): number => {
    messages.push({
      ...message,
      body: message.body.filter((line) => Boolean(line?.trim()))
    });
    return messages.length - 1;
  };

  events.forEach((event) => {
    if (!event || typeof event !== 'object') return;
    const type = String(event.type || '').toLowerCase();

    if (type === 'item.completed') {
      const item = (event as any).item || {};
      const itemType = String(item.item_type || '').toLowerCase();
      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!text) return;
      if (itemType === 'assistant_message') {
        pushMessage({ role: 'assistant', title: 'Assistant', body: [text] });
      } else if (itemType === 'reasoning') {
        pushMessage({ role: 'reasoning', title: 'Reasoning', body: [text] });
      } else if (itemType === 'tool_call') {
        const header = item.tool_name || item.tool || 'Tool call';
        const idx = pushMessage({ role: 'tool', title: header, body: [text] });
        if (item.id) toolIndex.set(item.id, idx);
      } else if (itemType === 'tool_result') {
        const header = item.tool_name || item.tool || 'Tool result';
        const idx = item.id && toolIndex.has(item.id)
          ? toolIndex.get(item.id)!
          : pushMessage({ role: 'tool', title: header, body: [] });
        messages[idx].body.push(text);
      } else {
        pushMessage({ role: 'reasoning', title: itemType || 'Item', body: [text] });
      }
      return;
    }

    const payload = (event as any).msg || event;
    const callId = payload?.call_id || payload?.callId || null;

    switch (type) {
      case 'exec_command_begin': {
        const command = Array.isArray(payload?.command) ? payload.command.join(' ') : payload?.command || '(unknown)';
        const cwd = payload?.cwd ? `cwd: ${payload.cwd}` : null;
        const idx = pushMessage({
          role: 'action',
          title: 'Shell command',
          body: [`$ ${command}`, cwd || undefined].filter(Boolean) as string[]
        });
        if (callId) commandIndex.set(callId, idx);
        break;
      }
      case 'exec_command_end': {
        if (!callId || !commandIndex.has(callId)) break;
        const idx = commandIndex.get(callId)!;
        const exit = payload?.exit_code;
        const duration = payload?.duration?.secs != null ? `${payload.duration.secs}s` : null;
        const line = `→ exit ${exit ?? 'unknown'}${duration ? ` (${duration})` : ''}`;
        messages[idx].body.push(line);
        break;
      }
      case 'mcp_tool_call_begin': {
        const server = payload?.invocation?.server;
        const tool = payload?.invocation?.tool || 'MCP tool';
        const idx = pushMessage({
          role: 'tool',
          title: 'MCP call',
          body: [`${tool}${server ? ` @ ${server}` : ''}`]
        });
        if (callId) toolIndex.set(callId, idx);
        break;
      }
      case 'mcp_tool_call_end': {
        if (!callId || !toolIndex.has(callId)) break;
        const idx = toolIndex.get(callId)!;
        const duration = payload?.duration?.secs != null ? `${payload.duration.secs}s` : null;
        messages[idx].body.push(`→ completed${duration ? ` in ${duration}` : ''}`);
        break;
      }
      default:
        break;
    }
  });

  return messages;
}

function sliceTranscriptForLatest(messages: ChatMessage[]): ChatMessage[] {
  if (!messages.length) return [];
  let index = messages.length - 1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'assistant') {
      index = i;
      break;
    }
  }
  if (index <= 0) return messages.slice(index);
  const prev = messages[index - 1];
  if (prev && prev.role === 'reasoning') {
    return messages.slice(index - 1);
  }
  return messages.slice(index);
}

function sliceTranscriptForRecent(messages: ChatMessage[]): ChatMessage[] {
  if (!messages.length) return [];

  // Show the last 20 messages or from the last 2 assistant messages, whichever is more
  const maxMessages = 20;
  let assistantCount = 0;
  let cutoff = messages.length;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      assistantCount++;
      if (assistantCount >= 2) {
        cutoff = Math.min(i, messages.length - maxMessages);
        break;
      }
    }
  }

  // Fallback for sessions with < 2 assistant messages
  if (assistantCount < 2) {
    cutoff = Math.max(0, messages.length - maxMessages);
  }

  return messages.slice(Math.max(0, cutoff));
}

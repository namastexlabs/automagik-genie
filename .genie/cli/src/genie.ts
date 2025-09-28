#!/usr/bin/env node
/**
 * GENIE Agent CLI - Codex exec orchestration with configurable presets
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { loadExecutors, DEFAULT_EXECUTOR_KEY } from './executors';
import type { Executor, ExecutorCommand } from './executors/types';
import { renderEnvelope, ViewEnvelope, ViewStyle } from './view';
import { buildHelpView } from './views/help';
import { buildRunsOverviewView, buildRunsScopedView, RunRow } from './views/runs';
import { buildBackgroundStartView, buildRunCompletionView } from './views/background';
import { buildStopView, StopEvent } from './views/stop';
import { buildErrorView, buildWarningView, buildInfoView } from './views/common';
import { buildLogTailView } from './views/log-tail';
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
  configOverrides: string[];
  rawArgs: string[];
  background: boolean;
  backgroundExplicit: boolean;
  backgroundRunner: boolean;
  preset?: string;
  executor?: string;
  prefix: string | null;
  json: boolean;
  style: ViewStyle;
  status: string | null;
  requestHelp?: boolean;
  lines: number;
  page: number;
  per: number;
  log?: string;
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
    preset?: string;
    background?: boolean;
    executor?: string;
  };
  paths?: ConfigPaths;
  executors?: Record<string, any>;
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
    preset: 'default',
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
  presets: {
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
    const parsed = parseArguments(process.argv.slice(2));
    const envIsBackground = process.env[INTERNAL_BACKGROUND_ENV] === '1';
    if (envIsBackground) {
      parsed.options.background = true;
      parsed.options.backgroundRunner = true;
      parsed.options.backgroundExplicit = true;
    }

    const config = loadConfig(parsed.options.configOverrides);
    applyDefaults(parsed.options, config.defaults);
    const paths = resolvePaths(config.paths || {});
    prepareDirectories(paths);

    await flushStartupWarnings(parsed.options);

    switch (parsed.command) {
      case 'run':
        await runChat(parsed, config, paths);
        break;
      case 'mode':
        await runMode(parsed, config, paths);
        break;
      case 'continue':
        await runContinue(parsed, config, paths);
        break;
      case 'view':
        await runView(parsed, config, paths);
        break;
      case 'runs':
        await runRuns(parsed, config, paths);
        break;
      case 'list':
        await runList(parsed, config, paths);
        break;
      case 'stop':
        await runStop(parsed, config, paths);
        break;
      case 'help':
      case undefined:
        await runHelp(parsed, config, paths);
        break;
      default: {
        await emitView(buildErrorView(parsed.options.style, 'Unknown command', `Unknown command: ${parsed.command}`), parsed.options, { stream: process.stderr });
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
  const command = raw.shift();
  const options: CLIOptions = {
    configOverrides: [],
    rawArgs: argv.slice(),
    background: false,
    backgroundExplicit: false,
    backgroundRunner: false,
    prefix: null,
    executor: undefined,
    json: false,
    style: 'compact',
    status: null,
    lines: 60,
    page: 1,
    per: 5
  };

  const filtered: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const token = raw[i];
    if (token === '--preset') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --preset');
      options.preset = raw[++i];
      continue;
    }
    if (token === '--background') {
      options.background = true;
      options.backgroundExplicit = true;
      continue;
    }
    if (token === '--no-background') {
      options.background = false;
      options.backgroundExplicit = true;
      continue;
    }
    if (token === '--executor') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --executor');
      options.executor = raw[++i];
      continue;
    }
    if (token === '-c' || token === '--config') {
      if (i + 1 >= raw.length) throw new Error('Missing value for -c/--config');
      options.configOverrides.push(raw[++i]);
      continue;
    }
    if (token === '--help' || token === '-h') {
      options.requestHelp = true;
      continue;
    }
    if (token === '--prefix') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --prefix');
      options.prefix = raw[++i];
      continue;
    }
    if (token === '--json') {
      options.json = true;
      continue;
    }
    if (token === '--') {
      filtered.push(...raw.slice(i + 1));
      break;
    }
    if (token === '--style') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --style');
      options.style = coerceStyle(raw[++i]);
      continue;
    }
    if (token === '--status') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --status');
      options.status = raw[++i];
      continue;
    }
    if (token === '--lines') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --lines');
      const n = parseInt(raw[++i], 10);
      if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid --lines value');
      options.lines = n;
      continue;
    }
    if (token === '--page') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --page');
      const n = parseInt(raw[++i], 10);
      if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid --page value');
      options.page = n;
      continue;
    }
    if (token === '--per') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --per');
      const n = parseInt(raw[++i], 10);
      if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid --per value');
      options.per = n;
      continue;
    }
    filtered.push(token);
  }

  return { command, commandArgs: filtered, options };
}

function coerceStyle(input?: string | null): ViewStyle {
  const token = (input || '').toLowerCase();
  if (token === 'art') return 'art';
  if (token === 'plain') return 'plain';
  return 'compact';
}

async function emitView(
  envelope: ViewEnvelope,
  options: CLIOptions,
  opts: { stream?: NodeJS.WriteStream; forceJson?: boolean } = {}
): Promise<void> {
  const style = options.style || 'compact';
  const styledEnvelope: ViewEnvelope = { ...envelope, style };
  await renderEnvelope(styledEnvelope, {
    json: opts.forceJson ?? options.json,
    stream: opts.stream,
    style
  });
}

async function emitEmergencyError(message: string): Promise<void> {
  const envelope = buildErrorView('compact', 'Fatal error', message);
  await renderEnvelope(envelope, { json: false, stream: process.stderr, style: 'compact' });
}

async function flushStartupWarnings(options: CLIOptions): Promise<void> {
  if (!startupWarnings.length) return;
  const envelope = buildWarningView(options.style, 'Configuration warnings', [...startupWarnings]);
  await emitView(envelope, options);
  startupWarnings.length = 0;
}

async function flushRuntimeWarnings(options: CLIOptions): Promise<void> {
  if (!runtimeWarnings.length) return;
  const envelope = buildWarningView(options.style, 'Runtime warnings', [...runtimeWarnings]);
  await emitView(envelope, options);
  runtimeWarnings.length = 0;
}

function applyDefaults(options: CLIOptions, defaults?: GenieConfig['defaults']): void {
  if (!options.backgroundExplicit) {
    options.background = Boolean(defaults?.background);
  }
  if (!options.preset && defaults?.preset) {
    options.preset = defaults.preset;
  }
  if (!options.executor && defaults?.executor) {
    options.executor = defaults.executor;
  }
  const envStyle = process.env.GENIE_CLI_STYLE;
  if (envStyle && options.style === 'compact') {
    options.style = coerceStyle(envStyle);
  }
}

function loadConfig(overrides: string[]): GenieConfig {
  let config = deepClone(DEFAULT_CONFIG);
  let configFilePath: string | null = null;
  if (fs.existsSync(CONFIG_PATH)) {
    configFilePath = CONFIG_PATH;
  }
  if (configFilePath) {
    try {
      const file = fs.readFileSync(configFilePath, 'utf8');
      if (file.trim().length) {
        let parsed: any = {};
        if (YAML) {
          parsed = YAML.parse(file) || {};
        } else if (file.trim().startsWith('{')) {
          try { parsed = JSON.parse(file); } catch { parsed = {}; }
        } else {
          try {
            parsed = parseSimpleYaml(file);
          } catch (fallbackError) {
            const message = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            recordStartupWarning(`[genie] Failed to parse ${path.basename(configFilePath)} without yaml module: ${message}`);
            parsed = {};
          }
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

  overrides.forEach((override) => applyConfigOverride(config, override));
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

function applyConfigOverride(config: any, override: string): void {
  const index = override.indexOf('=');
  if (index === -1) {
    throw new Error(`Invalid override '${override}'. Expected key=value.`);
  }
  const keyPath = override.slice(0, index).trim();
  const valueRaw = override.slice(index + 1).trim();
  if (!keyPath.length) throw new Error(`Invalid override '${override}'. Key is required.`);

  let value: any;
  try {
    value = JSON.parse(valueRaw);
  } catch {
    value = valueRaw;
  }

  const segments = keyPath.split('.');
  let cursor = config;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    if (!Object.prototype.hasOwnProperty.call(cursor, segment) || typeof cursor[segment] !== 'object' || cursor[segment] === null) {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }
  cursor[segments[segments.length - 1]] = value;
}

function parseSimpleYaml(text: string): any {
  const lines = String(text || '').split(/\r?\n/);
  const root: any = {};
  const stack: Array<{ indent: number; value: any }> = [{ indent: -1, value: root }];

  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i];
    if (!line || !line.trim()) continue;
    const hash = line.indexOf('#');
    if (hash !== -1) {
      line = line.slice(0, hash);
    }
    if (!line.trim()) continue;

    const indentMatch = line.match(/^ */);
    const indent = indentMatch ? indentMatch[0].length : 0;
    const level = Math.floor(indent / 2);
    const trimmed = line.trim();

    while (stack.length && stack[stack.length - 1].indent >= level) {
      stack.pop();
    }

    const parentContainer = stack[stack.length - 1].value;

    if (trimmed.startsWith('- ')) {
      if (!Array.isArray(parentContainer)) {
        throw new Error('Invalid YAML structure: list item outside of an array.');
      }
      const itemValue = parseYamlScalar(trimmed.slice(2).trim());
      parentContainer.push(itemValue);
      if (itemValue && typeof itemValue === 'object' && !Array.isArray(itemValue)) {
        stack.push({ indent: level, value: itemValue });
      }
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      continue;
    }

    const key = trimmed.slice(0, colonIdx).trim();
    let valueRaw = trimmed.slice(colonIdx + 1).trim();
    let value;
    if (!valueRaw.length) {
      const lookAhead = findNextMeaningfulYamlLine(lines, i + 1);
      if (lookAhead && lookAhead.indent > level) {
        value = lookAhead.isArray ? [] : {};
        if (Array.isArray(parentContainer)) {
          parentContainer.push(value);
        } else {
          parentContainer[key] = value;
        }
        stack.push({ indent: level, value });
        continue;
      }
      value = null;
    } else {
      value = parseYamlScalar(valueRaw);
    }

    if (Array.isArray(parentContainer)) {
      parentContainer.push(value);
    } else {
      parentContainer[key] = value;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      stack.push({ indent: level, value });
    }
  }

  return root;
}

function findNextMeaningfulYamlLine(lines: string[], start: number) {
  for (let i = start; i < lines.length; i += 1) {
    let line = lines[i];
    if (!line || !line.trim()) continue;
    const hash = line.indexOf('#');
    if (hash !== -1) {
      line = line.slice(0, hash);
    }
    if (!line.trim()) continue;
    const indentMatch = line.match(/^ */);
    const indent = indentMatch ? indentMatch[0].length : 0;
    const trimmed = line.trim();
    return {
      indent: Math.floor(indent / 2),
      isArray: trimmed.startsWith('- ')
    };
  }
  return null;
}

function parseYamlScalar(valueRaw: string): any {
  if (!valueRaw.length) return null;
  if (valueRaw === 'true') return true;
  if (valueRaw === 'false') return false;
  if (valueRaw === 'null') return null;
  if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(valueRaw)) {
    return Number(valueRaw);
  }
  if ((valueRaw.startsWith('"') && valueRaw.endsWith('"')) || (valueRaw.startsWith('\'') && valueRaw.endsWith('\''))) {
    const unquoted = valueRaw.slice(1, -1);
    return unquoted.replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return valueRaw;
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

async function runChat(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const [agentName, ...promptParts] = parsed.commandArgs;
  if (!agentName) {
    throw new Error('Usage: genie run <agent> "<prompt>"');
  }
  const prompt = promptParts.join(' ').trim();
  const agentSpec = loadAgentSpec(agentName);
  const agentMeta = agentSpec.meta || {};
  const agentGenie = agentMeta.genie || {};
  if (!parsed.options.backgroundExplicit && typeof agentGenie.background === 'boolean') {
    parsed.options.background = agentGenie.background;
  }
  const presetName = parsed.options.preset || config.defaults?.preset || 'default';
  const executorKey = agentGenie.executor || resolveExecutorKey(parsed.options, config, presetName);
  const executor = requireExecutor(executorKey);
  const executorOverrides = extractExecutorOverrides(agentGenie, executorKey);
  const executorConfig = buildExecutorConfig(config, presetName, executorKey, executorOverrides);
  const executorPaths = resolveExecutorPaths(paths, executorKey);
  const store = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);

  const startTime = deriveStartTime();
  const logFile = deriveLogFile(agentName, startTime, paths);

  const entry: SessionEntry = {
    ...(store.agents[agentName] || {}),
    agent: agentName,
    preset: presetName,
    logFile,
    lastPrompt: prompt.slice(0, 200),
    created: (store.agents[agentName] && store.agents[agentName].created) || new Date().toISOString(),
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
  store.agents[agentName] = entry;
  saveSessions(paths as SessionPathsConfig, store);

  if (parsed.options.background && !parsed.options.backgroundRunner) {
    const runnerPid = backgroundManager.launch({
      rawArgs: parsed.options.rawArgs,
      startTime,
      logFile,
      backgroundConfig: config.background,
      scriptPath: __filename
    });
    entry.runnerPid = runnerPid;
    entry.status = 'running';
    saveSessions(paths as SessionPathsConfig, store);
    const envelope = buildBackgroundStartView({
      style: parsed.options.style,
      agentName,
      logPath: formatPathRelative(logFile, paths.baseDir || '.'),
      sessionId: entry.sessionId,
      context: ['Watch: ./genie view <sessionId>', 'Resume: ./genie continue <sessionId> "<prompt>"']
    });
    await emitView(envelope, parsed.options);
    return;
  }

  const command = executor.buildRunCommand({
    config: executorConfig,
    instructions: agentSpec.instructions,
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
    cliOptions: parsed.options
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
}

function resolveExecutorKey(options: CLIOptions, config: GenieConfig, presetName: string): string {
  if (options.executor) return options.executor;
  const preset = config.presets && config.presets[presetName];
  if (preset && preset.executor) return preset.executor;
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

function buildExecutorConfig(config: GenieConfig, presetName: string, executorKey: string, agentOverrides: any): any {
  const base = deepClone((config.executors && config.executors[executorKey]) || {});
  const preset = config.presets && config.presets[presetName];
  if (!preset && presetName && presetName !== 'default') {
    const available = Object.keys(config.presets || {}).join(', ') || 'default';
    throw new Error(`Preset '${presetName}' not found. Available presets: ${available}`);
  }
  const overrides = getExecutorOverrides(preset, executorKey);
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

function getExecutorOverrides(preset: any, executorKey: string): any {
  if (!preset || !preset.overrides) return {};
  const { overrides } = preset;
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
  const { executor, background: _background, preset: _preset, json: _json, ...rest } = agentGenie;
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
    cliOptions
  } = args;

  if (!command || typeof command.command !== 'string' || !Array.isArray(command.args)) {
    throw new Error(`Executor '${executorKey}' returned an invalid command configuration.`);
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
        if (sessionId && !entry.sessionId) {
          entry.sessionId = sessionId;
          entry.lastUsed = new Date().toISOString();
          saveSessions(paths as SessionPathsConfig, store);
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
        style: cliOptions.style,
        agentName,
        outcome: 'failure',
        logPath: formatPathRelative(logFile, paths.baseDir || '.'),
        sessionId: entry.sessionId,
        executorKey,
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
        style: cliOptions.style,
        agentName,
        outcome,
        logPath: formatPathRelative(logFile, paths.baseDir || '.'),
        sessionId: entry.sessionId,
        executorKey,
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

async function runMode(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const [modeName, ...promptParts] = parsed.commandArgs;
  if (!modeName) {
    throw new Error('Usage: genie mode <genie-mode> "<prompt>"');
  }
  const id = modeName.startsWith('genie-') ? modeName : `genie-${modeName}`;
  const prompt = promptParts.join(' ').trim();
  const cloned: ParsedCommand = {
    command: 'run',
    commandArgs: [id, prompt],
    options: {
      ...parsed.options,
      rawArgs: [...parsed.options.rawArgs]
    }
  };
  await runChat(cloned, config, paths);
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
  try {
    const parsed = YAML ? YAML.parse(raw) : parseSimpleYaml(raw);
    return { meta: parsed || {}, body };
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

function deriveLogFile(agentName: string, startTime: number, paths: Required<ConfigPaths>): string {
  const envPath = process.env[INTERNAL_LOG_PATH_ENV];
  if (envPath) return envPath;
  const filename = `${agentName}-${startTime}.log`;
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

async function runContinue(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  if (parsed.options.requestHelp) {
    await runHelp(parsed, config, paths);
    return;
  }

  const cmdArgs = parsed.commandArgs;
  if (cmdArgs.length < 2) {
    throw new Error('Usage: genie continue <sessionId> "<prompt>"');
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

  const presetName = session.preset || config.defaults?.preset || 'default';
  const agentSpec = loadAgentSpec(agentName);
  const agentMeta = agentSpec.meta || {};
  const agentGenie = agentMeta.genie || {};
  if (!parsed.options.backgroundExplicit && typeof agentGenie.background === 'boolean') {
    parsed.options.background = agentGenie.background;
  }
  const executorKey = session.executor || agentGenie.executor || resolveExecutorKey(parsed.options, config, presetName);
  const executor = requireExecutor(executorKey);
  const executorOverrides = extractExecutorOverrides(agentGenie, executorKey);
  const executorConfig = buildExecutorConfig(config, presetName, executorKey, executorOverrides);
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

  if (parsed.options.background && !parsed.options.backgroundRunner) {
    const runnerPid = backgroundManager.launch({
      rawArgs: parsed.options.rawArgs,
      startTime,
      logFile,
      backgroundConfig: config.background,
      scriptPath: __filename
    });
    session.runnerPid = runnerPid;
    session.status = 'running';
    saveSessions(paths as SessionPathsConfig, store);
    const envelope = buildBackgroundStartView({
      style: parsed.options.style,
      agentName,
      logPath: formatPathRelative(logFile, paths.baseDir || '.'),
      sessionId: session.sessionId,
      note: 'Background session resumed',
      context: ['Watch: ./genie view <sessionId>', 'Stop: ./genie stop <sessionId>']
    });
    await emitView(envelope, parsed.options);
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
    cliOptions: parsed.options
  });
}

async function runList(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  await runRuns(parsed, config, paths);
}

async function runRuns(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const warnings: string[] = [];
  const store = loadSessions(
    paths as SessionPathsConfig,
    config as SessionLoadConfig,
    DEFAULT_CONFIG as any,
    { onWarning: (message) => warnings.push(message) }
  );
  const entries = Object.entries(store.agents);
  const dataAll = entries.map(([agent, entry]) => ({
    agent,
    status: resolveDisplayStatus(entry),
    sessionId: entry.sessionId || null,
    log: entry.logFile || null,
    lastUsed: entry.lastUsed || entry.created || null
  }));

  const want = parsed.options.status;
  const page = parsed.options.page || 1;
  const per = parsed.options.per || 5;

  const byStatus = (status: string) => dataAll.filter((row) => (row.status || '').toLowerCase().startsWith(status));
  const sortByTimeDesc = (arr: typeof dataAll) => arr.slice().sort((a, b) => {
    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    return bTime - aTime;
  });
  const paginate = (arr: typeof dataAll) => arr.slice((page - 1) * per, (page - 1) * per + per);
  const formatRow = (row: typeof dataAll[number]): RunRow => ({
    agent: row.agent,
    status: row.status,
    sessionId: row.sessionId,
    lastUsed: row.lastUsed ? new Date(row.lastUsed).toLocaleString() : null,
    log: row.log ? formatPathRelative(row.log, paths.baseDir || '.') : null
  });

  const pagerBaseHint = 'Use: genie view <sessionId>   •   Resume: genie continue <sessionId> "<prompt>"   •   Stop: genie stop <sessionId>';

  if (want && want !== 'default') {
    let pool;
    if (want === 'all') pool = sortByTimeDesc([...dataAll]);
    else if (want === 'running') pool = sortByTimeDesc([...byStatus('running'), ...byStatus('pending-completion')]);
    else pool = sortByTimeDesc(dataAll.filter((row) => (row.status || '').toLowerCase().startsWith(want)));
    const pageRows = paginate(pool).map(formatRow);
    const pager = {
      page,
      per,
      nextHint: `Next: genie runs --status ${want} --page ${page + 1} --per ${per}`,
      actionHint: pagerBaseHint
    };
    const envelope = buildRunsScopedView({
      style: parsed.options.style,
      scopeTitle: `Runs • ${want}`,
      rows: pageRows,
      pager,
      warnings
    });
    await emitView(envelope, parsed.options);
    return;
  }

  const activePool = sortByTimeDesc([...byStatus('running'), ...byStatus('pending-completion')]);
  const recentPool = sortByTimeDesc(
    dataAll.filter((row) => !['running', 'pending-completion'].includes((row.status || '').toLowerCase()))
  );
  const activeRows = paginate(activePool).map(formatRow);
  const recentRows = paginate(recentPool).map(formatRow);
  const pager = {
    page,
    per,
    nextHint: `Next: genie runs --page ${page + 1} --per ${per} • Focus: genie runs --status completed`,
    actionHint: pagerBaseHint
  };

  const envelope = buildRunsOverviewView({
    style: parsed.options.style,
    active: activeRows,
    recent: recentRows,
    pager,
    warnings
  });
  await emitView(envelope, parsed.options);
}

async function runView(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const [sessionId] = parsed.commandArgs;
  if (!sessionId) {
    await emitView(buildInfoView(parsed.options.style, 'View usage', ['Usage: genie view <sessionId> [--lines N]']), parsed.options);
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
    await emitView(buildErrorView(parsed.options.style, 'Run not found', `No run found with session id '${sessionId}'`), parsed.options, { stream: process.stderr });
    return;
  }
  const { entry } = found;
  const executorKey = entry.executor || config.defaults?.executor || DEFAULT_EXECUTOR_KEY;
  const executor = requireExecutor(executorKey);
  const logViewer = executor.logViewer;
  const logFile = entry.logFile;
  if (!logFile || !fs.existsSync(logFile)) {
    await emitView(buildErrorView(parsed.options.style, 'Log missing', '❌ Log not found for this run'), parsed.options, { stream: process.stderr });
    return;
  }

  const raw = fs.readFileSync(logFile, 'utf8');
  if (parsed.options.json) {
    process.stdout.write(raw);
    return;
  }
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

  if (jsonl.length && logViewer?.buildJsonlView) {
    const envelope = logViewer.buildJsonlView({
      render: { entry, jsonl, raw },
      parsed,
      paths,
      store,
      save: saveSessions,
      formatPathRelative,
      style: parsed.options.style
    });
    await emitView(envelope, parsed.options);
    if (warnings.length) {
      await emitView(buildWarningView(parsed.options.style, 'Session warnings', warnings), parsed.options);
    }
    return;
  }

  const lastN = parsed.options.lines && parsed.options.lines > 0 ? parsed.options.lines : 60;
  const instructions: string[] = entry.lastPrompt ? [entry.lastPrompt] : [];
  const errorLines = allLines.filter((line) => /error/i.test(line)).slice(-5);
  const envelope = buildLogTailView({
    style: parsed.options.style,
    agent: entry.agent ?? 'unknown',
    sessionId: entry.sessionId ?? null,
    logPath: formatPathRelative(logFile, paths.baseDir || '.'),
    instructions,
    errors: errorLines,
    totalLines: allLines.length,
    lastN,
    tailLines: allLines.slice(-lastN)
  });
  await emitView(envelope, parsed.options);
  if (warnings.length) {
    await emitView(buildWarningView(parsed.options.style, 'Session warnings', warnings), parsed.options);
  }
}

async function runStop(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const [target] = parsed.commandArgs;
  if (!target) {
    throw new Error('Usage: genie stop <sessionId|pid>');
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
      await emitView(buildWarningView(parsed.options.style, 'Session warnings', warnings), parsed.options);
    }
  };

  if (!found) {
    const numericPid = Number(target);
    if (Number.isInteger(numericPid)) {
      const ok = backgroundManager.stop(numericPid);
      if (ok) {
        for (const entry of Object.values(store.agents || {})) {
          if (entry.runnerPid === numericPid || entry.executorPid === numericPid) {
            entry.status = 'stopped';
            entry.lastUsed = new Date().toISOString();
            entry.signal = entry.signal || 'SIGTERM';
            if (entry.exitCode === undefined) entry.exitCode = null;
            saveSessions(paths as SessionPathsConfig, store);
            break;
          }
        }
        events.push({ label: `PID ${numericPid}`, detail: 'SIGTERM sent', status: 'done' });
        summary = `Sent SIGTERM to pid ${numericPid}.`;
      } else {
        events.push({ label: `PID ${numericPid}`, detail: 'No running process', status: 'failed' });
        summary = `No running process found for pid ${numericPid}.`;
      }
    } else {
      events.push({ label: target, status: 'failed', message: 'Session id not found' });
      summary = `No run found with session id '${target}'.`;
    }
    const envelope = buildStopView({
      style: parsed.options.style,
      target,
      events,
      summary
    });
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

  const envelope = buildStopView({
    style: parsed.options.style,
    target,
    events,
    summary
  });
  await emitView(envelope, parsed.options);
  await appendWarningView();
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
  const agents = listAgents();
  const modeAgents = agents.filter((agent) => agent.id.startsWith('genie-'));
  const standardAgents = agents.filter((agent) => !agent.id.startsWith('genie-'));
  const presetsEntries = Object.entries(config.presets || {});
  const backgroundDefault = Boolean(config.defaults && config.defaults.background);
  const runDesc = backgroundDefault ? 'Start a run (background default)' : 'Start a run (foreground default)';
  const commandRows = [
    { command: 'run', args: '<agent> "<prompt>"', description: runDesc },
    { command: 'mode', args: '<genie-mode> "<prompt>"', description: 'Trigger a Genie Mode (maps to genie-<mode>)' },
    { command: 'continue', args: '<sessionId> "<prompt>"', description: 'Continue a background session' },
    { command: 'view', args: '<sessionId> [--lines N]', description: 'Stream the latest output' },
    { command: 'stop', args: '<sessionId>', description: 'Gracefully end a session' },
    { command: 'runs', args: '[--status <s>] [--json]', description: 'Show background activity' },
    { command: 'list', args: '', description: 'List recent sessions' },
    { command: 'help', args: '', description: 'Open this panel' }
  ];

  const optionRows = [
    { flag: '--preset <name>', description: 'Switch execution posture (default: default)' },
    { flag: '-c, --config <key=value>', description: 'Temporarily override a config key' },
    { flag: '--no-background', description: 'Stay in foreground streaming output' },
    { flag: 'runs -> --status <s>', description: 'Filter by running|completed|failed|stopped' },
    { flag: 'runs -> --json', description: 'Emit JSON instead of the formatted table' }
  ];

  const presetsRows = presetsEntries.map(([name, info]) => ({
    name,
    description: (info && info.description) ? info.description : 'no description provided'
  }));

  const modeRows = modeAgents.map((agent) => {
    const modeName = agent.id.replace(/^genie-/, '');
    const description = truncateText((agent.meta?.description || '').replace(/\s+/g, ' ').trim(), 56);
    return {
      mode: modeName,
      invoke: `genie mode ${modeName} "<prompt>"`,
      focus: description
    };
  });

  const agentRows = standardAgents.map((agent) => ({
    id: agent.id,
    model: resolveAgentModel(agent.meta),
    description: truncateText((agent.meta?.description || '').replace(/\s+/g, ' ').trim(), 68)
  }));

  const envelope = buildHelpView({
    style: parsed.options.style,
    backgroundDefault,
    defaultPreset: config.defaults?.preset,
    commandRows,
    optionRows,
    presets: presetsRows,
    promptFramework: [
      'Discovery -> load @ context, surface goals, spot blockers early.',
      'Implementation -> follow the target agent playbook with evidence-first outputs.',
      'Verification -> capture validation commands, metrics, and open questions.'
    ],
    examples: [
      'genie mode planner "[Discovery] mission @.genie/product/mission.md ..."',
      'genie run hello-coder "[Discovery] Review @README.md ..."'
    ],
    modes: modeRows,
    agents: agentRows
  });

  await emitView(envelope, parsed.options);
}

function listAgents(): Array<{ id: string; meta: any }> {
  const dir = '.genie/agents';
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const { meta } = extractFrontMatter(content);
      return { id: file.replace(/\.md$/, ''), meta };
    });
}

function resolveAgentModel(meta: any): string {
  return meta?.model || meta?.genie?.model || 'unknown';
}

function renderTable(headers: string[], rows: Array<string[]>): string[] {
  const columnCount = headers.length;
  const widths = new Array(columnCount).fill(0);

  headers.forEach((header, index) => {
    widths[index] = Math.max(widths[index], header.length);
  });
  rows.forEach((row) => {
    row.forEach((cell, index) => {
      widths[index] = Math.max(widths[index], cell.length);
    });
  });

  const line = (left: string, fill: string, junction: string, right: string) =>
    `  ${left}${widths
      .map((width) => `${fill.repeat(width + 2)}`)
      .join(junction)}${right}`;

  const top = line('┌', '─', '┬', '┐');
  const header = `  │ ${headers
    .map((header, index) => header.padEnd(widths[index]))
    .join(' │ ')} │`;
  const separator = line('├', '─', '┼', '┤');
  const body = rows.map((row) => `  │ ${row.map((cell, index) => cell.padEnd(widths[index])).join(' │ ')} │`);
  const bottom = line('└', '─', '┴', '┘');

  return [top, header, separator, ...body, bottom];
}

function renderHero(title: string, subtitle: string): string[] {
  const width = Math.max(title.length, subtitle.length) + 8;
  const top = `╔${'═'.repeat(width - 2)}╗`;
  const pad = (text: string) => `║ ${text.padEnd(width - 4)} ║`;
  const bottom = `╚${'═'.repeat(width - 2)}╝`;
  return [top, pad(title), pad(subtitle), bottom];
}

function renderKeyValueLines(pairs: Array<{ label: string; value: string }>): string[] {
  if (pairs.length === 0) return [];
  const labelWidth = Math.max(...pairs.map((pair) => pair.label.length));
  return pairs.map((pair) => ` ${pair.label.padEnd(labelWidth)}  ${pair.value}`);
}

function renderSectionHeading(title: string): string {
  const width = 76;
  const label = ` ${title.toUpperCase()} `;
  const filler = '─'.repeat(Math.max(0, width - label.length));
  return `╭${label}${filler}`;
}

function renderBulletList(items: string[]): string[] {
  return items.map((item) => `  - ${item}`);
}

function truncateText(text: string, maxLength = 64): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  const sliceLength = Math.max(0, maxLength - 3);
  return text.slice(0, sliceLength).trimEnd() + '...';
}

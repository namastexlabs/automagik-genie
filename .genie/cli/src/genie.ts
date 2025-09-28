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
  style: string;
  status: string | null;
  requestHelp?: boolean;
  follow: boolean;
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

main();

function main(): void {
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

    switch (parsed.command) {
      case 'run':
        runChat(parsed, config, paths);
        break;
      case 'mode':
        runMode(parsed, config, paths);
        break;
      case 'continue':
        runContinue(parsed, config, paths);
        break;
      case 'view':
        runView(parsed, config, paths);
        break;
      case 'runs':
        runRuns(parsed, config, paths);
        break;
      case 'list':
        runList(config, paths);
        break;
      case 'stop':
        runStop(parsed, config, paths);
        break;
      case 'help':
      case undefined:
        runHelp(config, paths);
        break;
      default:
        console.error(`Unknown command: ${parsed.command}`);
        runHelp(config, paths);
        process.exitCode = 1;
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌', message);
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
    follow: false,
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
      options.style = raw[++i];
      continue;
    }
    if (token === '--status') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --status');
      options.status = raw[++i];
      continue;
    }
    if (token === '--follow') {
      options.follow = true;
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
            console.warn(`[genie] Failed to parse ${path.basename(configFilePath)} without yaml module:`, message);
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

function runChat(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): void {
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
    console.log(`🧞 Background conversation started: ${agentName}`);
    console.log(`   Log: ${formatPathRelative(logFile, paths.baseDir || '.')}`);
    console.log('   Watch: ./genie view <session-id>');
    return;
  }

  const command = executor.buildRunCommand({
    config: executorConfig,
    instructions: agentSpec.instructions,
    prompt
  });

  executeRun({
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
    runnerPid: parsed.options.backgroundRunner ? process.pid : null
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

function executeRun(args: ExecuteRunArgs): void {
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
    runnerPid
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

  proc.on('error', (error) => {
    entry.status = 'failed';
    entry.error = error instanceof Error ? error.message : String(error);
    entry.lastUsed = new Date().toISOString();
    saveSessions(paths as SessionPathsConfig, store);
    logStream.end();
    if (!background) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Failed to launch ${executorKey} for ${agentName}: ${message}`);
    }
  });

  proc.on('exit', (code, signal) => {
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
      const outcome = code === 0 ? `✅ ${executorKey} run completed` : `⚠️ ${executorKey} exited with code ${code}`;
      console.log(`\n${outcome} (${agentName})`);
      if (entry.sessionId) {
        console.log(`Session ID: ${entry.sessionId}`);
      }
      console.log(`Log: ${formatPathRelative(logFile, paths.baseDir || '.')}`);
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
        if (!background) {
          console.log(`\n✅ Session saved for ${agentName} (${sessionId})`);
        }
      }
    }, sessionDelay);
  }
}

function runMode(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): void {
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
  runChat(cloned, config, paths);
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

function runContinue(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): void {
  if (parsed.options.requestHelp) {
    runHelp(config, paths);
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
    console.log(`🧞 Background resume started: ${agentName}`);
    console.log(`   Log: ${formatPathRelative(logFile, paths.baseDir || '.')}`);
    console.log('   Watch: ./genie view <session-id>');
    return;
  }

  executeRun({
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
    runnerPid: parsed.options.backgroundRunner ? process.pid : null
  });
}

function runList(config: GenieConfig, paths: Required<ConfigPaths>): void {
  runRuns({ options: parseArguments([]).options, commandArgs: [], command: 'runs' }, config, paths);
}

function runRuns(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): void {
  const store = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);
  const entries = Object.entries(store.agents);
  const dataAll = entries.map(([agent, d]) => ({
    agent,
    status: resolveDisplayStatus(d),
    sessionId: d.sessionId || null,
    log: d.logFile || null,
    lastUsed: d.lastUsed || d.created || null,
    runnerPid: d.runnerPid || null,
    executor: d.executor || config.defaults?.executor || DEFAULT_EXECUTOR_KEY,
    executorPid: d.executorPid || null
  }));

  const want = parsed.options.status;
  const page = parsed.options.page || 1;
  const per = parsed.options.per || 5;

  const byStatus = (status: string) => dataAll.filter(r => (r.status || '').toLowerCase().startsWith(status));
  const sortByTimeDesc = (arr: typeof dataAll) => arr.slice().sort((a, b) => {
    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    return bTime - aTime;
  });
  const paginate = (arr: typeof dataAll) => arr.slice((page - 1) * per, (page - 1) * per + per);

  if (want && want !== 'default') {
    let pool;
    if (want === 'all') pool = sortByTimeDesc([...dataAll]);
    else if (want === 'running') pool = sortByTimeDesc([...byStatus('running'), ...byStatus('pending-completion')]);
    else pool = sortByTimeDesc(dataAll.filter(r => (r.status || '').toLowerCase().startsWith(want)));
    const pageRows = paginate(pool);
    if (parsed.options.json) { console.log(JSON.stringify(pageRows, null, 2)); return; }
    console.log('\nRuns:');
    if (!pageRows.length) console.log('  (none)'); else fmt(pageRows);
    console.log(`\nPage ${page} • per ${per} • Next: genie runs --status ${want} --page ${page+1} --per ${per}`);
    console.log('Use: genie view <sessionId> [--follow]   •   Resume: genie continue <sessionId> "<prompt>"   •   Stop: genie stop <sessionId>');
    return;
  }

  const activePool = sortByTimeDesc([...byStatus('running'), ...byStatus('pending-completion')]);
  const recentPool = sortByTimeDesc(dataAll.filter(r => !['running','pending-completion'].includes((r.status || '').toLowerCase())));
  const activeRows = paginate(activePool);
  const recentRows = paginate(recentPool);
  if (parsed.options.json) { console.log(JSON.stringify({ active: activeRows, recent: recentRows }, null, 2)); return; }
  console.log('\nActive:'); if (!activeRows.length) console.log('  (none)'); else fmt(activeRows);
  console.log('\nRecent:'); if (!recentRows.length) console.log('  (none)'); else fmt(recentRows);
  console.log(`\nPage ${page} • per ${per} • Next: genie runs --page ${page+1} --per ${per} • Focus: genie runs --status completed`);
  console.log('Use: genie view <sessionId> [--follow]   •   Resume: genie continue <sessionId> "<prompt>"   •   Stop: genie stop <sessionId>');
}

function fmt(rows: Array<{ agent: string; status: string | null; sessionId: string | null; lastUsed: string | null; log: string | null }>): void {
  const pad = (s: string | number | null, len: number) => (String(s || '') + ' '.repeat(len)).slice(0, len);
  rows.forEach((r) => {
    const when = r.lastUsed ? new Date(r.lastUsed).toLocaleString() : 'n/a';
    const logRel = r.log || 'n/a';
    console.log(`  ${pad(r.agent, 18)} ${pad(r.status || 'unknown', 12)} ${pad(r.sessionId || 'n/a', 36)} ${pad(when, 20)} ${logRel}`);
  });
}

function runView(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): void {
  const [sessionId] = parsed.commandArgs;
  if (!sessionId) {
    console.log('Usage: genie view <sessionId> [--follow] [--lines N]');
    return;
  }
  const store = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);
  const found = findSessionEntry(store, sessionId, paths);
  if (!found) {
    console.error(`❌ No run found with session id '${sessionId}'`);
    return;
  }
  const { entry } = found;
  const executorKey = entry.executor || config.defaults?.executor || DEFAULT_EXECUTOR_KEY;
  const executor = requireExecutor(executorKey);
  const logViewer = executor.logViewer;
  const logFile = entry.logFile;
  if (!logFile || !fs.existsSync(logFile)) {
    console.error('❌ Log not found for this run');
    return;
  }
  if (parsed.options.follow) {
    const tail = spawn('tail', ['-n', String(parsed.options.lines || 60), '-f', logFile], { stdio: 'inherit' });
    tail.on('error', (e) => console.error('❌ Failed to tail log:', e instanceof Error ? e.message : String(e)));
    return;
  }
  if (parsed.options.json) {
    const raw = fs.readFileSync(logFile, 'utf8');
    process.stdout.write(raw);
    return;
  }
  const content = fs.readFileSync(logFile, 'utf8');
  const allLines = content.split(/\r?\n/);

  if (!entry.sessionId && logViewer?.extractSessionIdFromContent) {
    const sessionFromLog = logViewer.extractSessionIdFromContent(allLines);
    if (sessionFromLog) {
      entry.sessionId = sessionFromLog;
      saveSessions(paths as SessionPathsConfig, store);
    }
  }

  const jsonl: Array<Record<string, any>> = [];
  for (const line of allLines) {
    const t = line.trim();
    if (!t) continue;
    try { jsonl.push(JSON.parse(t)); } catch { /* skip */ }
  }
  if (jsonl.length && logViewer?.renderJsonlView) {
    logViewer.renderJsonlView({ entry, jsonl, raw: content }, parsed, paths, store, saveSessions, formatPathRelative);
  } else {
    renderTextView({ entry, lines: allLines }, parsed, paths);
  }
}

function runStop(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): void {
  const [target] = parsed.commandArgs;
  if (!target) {
    throw new Error('Usage: genie stop <sessionId|pid>');
  }

  const store = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);
  const found = findSessionEntry(store, target, paths);

  if (!found) {
    const numericPid = Number(target);
    if (Number.isInteger(numericPid)) {
      const ok = backgroundManager.stop(numericPid);
      if (ok) {
        console.log(`Sent SIGTERM to pid ${numericPid}.`);
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
      } else {
        console.error(`❌ No running process found for pid ${numericPid}`);
      }
    } else {
      console.error(`❌ No run found with session id '${target}'`);
    }
    return;
  }

  const { agentName, entry } = found;
  const identifier = entry.sessionId || agentName;
  const alivePids = [entry.runnerPid, entry.executorPid].filter((pid) => backgroundManager.isAlive(pid)) as number[];

  alivePids.forEach((pid) => {
    try {
      const ok = backgroundManager.stop(pid);
      if (ok !== false) {
        console.log(`Sent SIGTERM to pid ${pid} for ${identifier}.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`⚠️ Failed to stop pid ${pid}: ${message}`);
    }
  });

  if (!alivePids.length) {
    console.log(`No active process found for ${identifier}.`);
  }

  entry.status = 'stopped';
  entry.lastUsed = new Date().toISOString();
  entry.signal = entry.signal || 'SIGTERM';
  if (entry.exitCode === undefined) entry.exitCode = null;
  saveSessions(paths as SessionPathsConfig, store);

  console.log(`✅ Stop signal handled for ${identifier}`);
}

function renderTextView(src: { entry: SessionEntry; lines: string[] }, parsed: ParsedCommand, paths: Required<ConfigPaths>): void {
  const { entry, lines } = src;
  const lastN = parsed.options.lines && parsed.options.lines > 0 ? parsed.options.lines : 60;
  let lastInstructionsIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if ((lines[i] || '').includes('User instructions:')) { lastInstructionsIdx = i; break; }
  }
  const instructions: string[] = [];
  if (lastInstructionsIdx !== -1) {
    for (let i = lastInstructionsIdx; i < Math.min(lines.length, lastInstructionsIdx + 20); i++) {
      instructions.push(lines[i]);
      if (i > lastInstructionsIdx && (lines[i] || '').trim() === '') break;
    }
  }
  const errorLines = lines.filter(l => /\bERROR\b|\bError:\b|\bFailed\b/i.test(l || '')).slice(-10);
  console.log(`\nView: ${entry.agent} | session:${entry.sessionId || 'n/a'} | log:${formatPathRelative(entry.logFile || 'n/a', paths.baseDir || '.')}`);
  if (instructions.length) { console.log('\nLast Instructions:'); instructions.forEach(l => console.log('  ' + l)); }
  if (errorLines.length) { console.log('\nRecent Errors:'); errorLines.forEach(l => console.log('  ' + l)); }
  console.log('\nStats:');
  console.log('  Errors           ' + errorLines.length);
  console.log('  Lines            ' + lines.length);
  console.log(`\nTail (${lastN} lines):`);
  lines.slice(-lastN).forEach(l => console.log('  ' + l));
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
      console.warn(`[genie] Failed to scan log ${logFile}: ${message}`);
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

function runHelp(config: GenieConfig, paths: Required<ConfigPaths>): void {
  const agents = listAgents();
  const presetsEntries = Object.entries(config.presets || {});
  const backgroundDefault = Boolean(config.defaults && config.defaults.background);
  const runDesc = backgroundDefault ? 'Start a run (background default)' : 'Start a run (foreground default)';
  const rows = [
    { cmd: 'run', args: '<agent> "<prompt>"', desc: runDesc },
    { cmd: 'mode', args: '<genie-mode> "<prompt>"', desc: 'Run a Genie Mode (maps to genie-<mode>)' },
    { cmd: 'continue', args: '<sessionId> "<prompt>"', desc: 'Continue run by session id' },
    { cmd: 'view', args: '<sessionId> [--follow] [--lines N]', desc: 'View run output (friendly); live follow with --follow' },
    { cmd: 'stop', args: '<sessionId>', desc: 'Send SIGTERM to a running session' },
    { cmd: 'runs', args: '[--status <s>] [--json]', desc: 'List runs with status; manage background tasks' },
    { cmd: 'list', args: '', desc: 'Show active/completed sessions' },
    { cmd: 'help', args: '', desc: 'Show this help' }
  ];
  const presets = presetsEntries.map(([name, info]) => ({
    name,
    desc: (info && info.description) ? info.description : 'no description'
  }));

  const hdr = 'GENIE CLI — Helper';
  const usage = 'Usage: genie <command> [options]';
  const bg = backgroundDefault
    ? 'Background: ON by default (use --no-background for foreground)'
    : 'Background: OFF by default (use --background to detach)';

  const commandTable = renderTable(['Command', 'Arguments', 'Description'], rows.map((r) => [r.cmd, r.args, r.desc]));

  const globalOptsData = [
    { flag: '--preset <name>', desc: 'Select preset (default: default)' },
    { flag: '-c, --config <key=value>', desc: 'Override config key (repeatable)' },
    { flag: '--no-background', desc: 'Run in foreground (stream output)' }
  ];
  const runsOptsData = [
    { flag: '--status <s>', desc: 'Filter: running|completed|failed|stopped' },
    { flag: '--json', desc: 'JSON output' }
  ];

  const flagWidth = Math.max(
    ...globalOptsData.map((o) => o.flag.length),
    ...runsOptsData.map((o) => o.flag.length)
  );
  const renderOptions = (items: { flag: string; desc: string }[]) =>
    items
      .map((o) => `  ${o.flag.padEnd(flagWidth)}  ${o.desc}`)
      .join('\n');
  const globalOpts = renderOptions(globalOptsData);
  const runsOpts = renderOptions(runsOptsData);

  const presetNameWidth = Math.max(16, ...presets.map((p) => p.name.length));
  const presetsBlock = presets
    .map((p) => `  ${p.name.padEnd(presetNameWidth)}  ${p.desc}`)
    .join('\n');

  const promptSkeleton = (
    '[Discovery] Load @files; identify objectives, constraints, gaps.\n' +
    '[Implementation] Apply per @.genie/agents/<agent>.md; edit files or produce artifacts.\n' +
    '[Verification] Summarize outputs, evidence, sections changed, open questions.'
  );

  const examples = [
    'genie mode planner "[Discovery] @vendors/... [Implementation] … [Verification] …"',
    'genie run hello-coder "[Discovery] Review repo @README.md [Implementation] …"'
  ];

  console.log(`\n${hdr}`);
  console.log(usage);
  console.log(bg);
  console.log('\nCommands:');
  commandTable.forEach((line) => console.log(line));
  console.log('\nGlobal Options:\n' + globalOpts);
  console.log('\nRuns Options:\n' + runsOpts);
  console.log('\nPresets:\n' + presetsBlock);
  console.log('\nPrompt Skeleton:\n' + promptSkeleton);
  console.log('\nExamples:');
  examples.forEach((ex) => console.log('  ' + ex));
  console.log('\nAgents:');
  agents.forEach((a) => {
    console.log(`  ${a.id} | model:${resolveAgentModel(a.meta)} | ${a.meta?.description || ''}`);
    console.log(`    ${promptHint(a.id)}`);
  });
  console.log('');
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

function promptHint(id: string): string {
  return `Usage: genie run ${id} "[Discovery] Load @files & context. [Implementation] Apply per @.genie/agents/${id}.md. [Verification] Summarize edits, evidence, open questions."`;
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

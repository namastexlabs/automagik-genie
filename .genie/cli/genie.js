#!/usr/bin/env node

/**
 * GENIE Agent CLI - Codex exec orchestration with configurable presets
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
let YAML = null;
try {
  YAML = require('yaml');
} catch (_) {
  // YAML module not available; we'll ignore genie.yaml or try JSON as fallback.
}

const codexExecutor = require('./executors/codex');
const sessionStore = require('./session-store');
const { loadSessions, saveSessions } = sessionStore;

const EXECUTORS = {
  codex: codexExecutor
};

const SCRIPT_DIR = path.dirname(__filename);
const CONFIG_PATH = path.join(SCRIPT_DIR, 'config.yaml');

const INTERNAL_BACKGROUND_ENV = 'GENIE_AGENT_BACKGROUND_RUNNER';
const INTERNAL_START_TIME_ENV = 'GENIE_AGENT_START_TIME';
const INTERNAL_LOG_PATH_ENV = 'GENIE_AGENT_LOG_FILE';

const DEFAULT_CONFIG = {
  defaults: {
    preset: 'default',
    background: true,
    executor: 'codex'
  },
  paths: {
    baseDir: '.',
    sessionsFile: '.genie/state/agents/sessions.json',
    legacySessionsFile: '~/.genie-sessions.json',
    logsDir: '.genie/state/agents/logs',
    backgroundDir: '.genie/state/agents/background'
  },
  executors: {
    codex: codexExecutor.defaults
  },
  presets: {
    default: {
      description: 'Workspace-write automation with GPT-5 Codex.',
      executor: 'codex',
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

function main() {
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
      case 'clear':
        runClear(parsed, config, paths);
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
    console.error('❌', error.message);
    process.exitCode = 1;
  }
}

function parseArguments(argv) {
  const raw = argv.slice();
  const command = raw.shift();
  const options = {
    configOverrides: [],
    rawArgs: argv.slice(),
    background: false,
    backgroundExplicit: false,
    backgroundRunner: false,
    prefix: null,
    executor: null,
    json: false,
    style: 'compact',
    status: null,
    stop: null,
    follow: false,
    lines: 60,
    page: 1,
    per: 1
  };

  const filtered = [];
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
    if (token === '--stop') {
      if (i + 1 >= raw.length) throw new Error('Missing value for --stop');
      options.stop = raw[++i];
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

function applyDefaults(options, defaults) {
  if (!options.backgroundExplicit) {
    options.background = Boolean(defaults && defaults.background);
  }
  if (!options.preset && defaults && defaults.preset) {
    options.preset = defaults.preset;
  }
  if (!options.executor && defaults && defaults.executor) {
    options.executor = defaults.executor;
  }
}

function loadConfig(overrides) {
  let config = deepClone(DEFAULT_CONFIG);
  let configFilePath = null;
  if (fs.existsSync(CONFIG_PATH)) {
    configFilePath = CONFIG_PATH;
  }
  if (configFilePath) {
    try {
      const file = fs.readFileSync(configFilePath, 'utf8');
      if (file.trim().length) {
        let parsed = {};
        if (YAML) {
          parsed = YAML.parse(file) || {};
        } else if (file.trim().startsWith('{')) {
          try { parsed = JSON.parse(file); } catch (_) { parsed = {}; }
        } else {
          try {
            parsed = parseSimpleYaml(file);
          } catch (fallbackError) {
            console.warn(`[genie] Failed to parse ${path.basename(configFilePath)} without yaml module:`, fallbackError.message);
            parsed = {};
          }
        }
        config = mergeDeep(config, parsed);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${configFilePath}: ${error.message}`);
    }
    config.__configPath = configFilePath;
  } else {
    config.__configPath = CONFIG_PATH;
  }

  overrides.forEach((override) => applyConfigOverride(config, override));
  return config;
}

function deepClone(input) {
  return JSON.parse(JSON.stringify(input));
}

function mergeDeep(target, source) {
  if (source === null || source === undefined) return target;
  if (Array.isArray(source)) {
    return source.slice();
  }
  if (typeof source !== 'object') {
    return source;
  }
  const base = (target && typeof target === 'object' && !Array.isArray(target)) ? { ...target } : {};
  Object.entries(source).forEach(([key, value]) => {
    base[key] = mergeDeep(base[key], value);
  });
  return base;
}

function applyConfigOverride(config, override) {
  const index = override.indexOf('=');
  if (index === -1) {
    throw new Error(`Invalid override '${override}'. Expected key=value.`);
  }
  const keyPath = override.slice(0, index).trim();
  let valueRaw = override.slice(index + 1).trim();
  if (!keyPath.length) throw new Error(`Invalid override '${override}'. Key is required.`);

  let value;
  try {
    value = JSON.parse(valueRaw);
  } catch (error) {
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

function parseSimpleYaml(text) {
  const lines = String(text || '').split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, value: root }];

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
      const expectArray = lookAhead && lookAhead.indent > indent && lookAhead.trimmed.startsWith('- ');
      value = expectArray ? [] : {};
    } else {
      value = parseYamlScalar(valueRaw);
    }

    if (Array.isArray(parentContainer)) {
      const obj = {};
      obj[key] = value;
      parentContainer.push(obj);
      if (value && typeof value === 'object') {
        stack.push({ indent: level, value });
      }
    } else {
      parentContainer[key] = value;
      if (value && typeof value === 'object') {
        stack.push({ indent: level, value });
      }
    }
  }

  return root;
}

function findNextMeaningfulYamlLine(lines, startIndex) {
  for (let i = startIndex; i < lines.length; i += 1) {
    let candidate = lines[i];
    if (!candidate) continue;
    const hash = candidate.indexOf('#');
    if (hash !== -1) {
      candidate = candidate.slice(0, hash);
    }
    if (!candidate.trim()) continue;
    const indentMatch = candidate.match(/^ */);
    return {
      indent: indentMatch ? indentMatch[0].length : 0,
      trimmed: candidate.trim()
    };
  }
  return null;
}

function parseYamlScalar(raw) {
  const valueRaw = raw.trim();
  if (!valueRaw.length) return '';
  if (valueRaw === 'null' || valueRaw === '~' || valueRaw.toLowerCase() === 'null') return null;
  if (valueRaw === '[]') return [];
  if (valueRaw === '{}') return {};
  if (valueRaw.toLowerCase() === 'true') return true;
  if (valueRaw.toLowerCase() === 'false') return false;
  if ((valueRaw.startsWith('"') && valueRaw.endsWith('"')) || (valueRaw.startsWith("'") && valueRaw.endsWith("'"))) {
    return valueRaw.slice(1, -1);
  }
  if (valueRaw.startsWith('[') && valueRaw.endsWith(']')) {
    const inner = valueRaw.slice(1, -1).trim();
    if (!inner.length) return [];
    return inner.split(',').map((part) => parseYamlScalar(part));
  }
  const potentialNumber = Number(valueRaw);
  if (!Number.isNaN(potentialNumber) && String(potentialNumber) === valueRaw) {
    return potentialNumber;
  }
  return valueRaw;
}

function resolvePaths(pathsConfig) {
  const config = pathsConfig || {};
  const baseDir = resolvePath(config.baseDir || '.', process.cwd());
  const resolved = {
    baseDir,
    sessionsFile: resolvePath(config.sessionsFile, baseDir),
    legacySessionsFile: resolvePath(config.legacySessionsFile, baseDir),
    logsDir: resolvePath(config.logsDir, baseDir),
    backgroundDir: resolvePath(config.backgroundDir, baseDir),
    executors: {}
  };

  const executorPathsConfig = (config.executors && typeof config.executors === 'object') ? config.executors : {};
  Object.entries(EXECUTORS).forEach(([key, executor]) => {
    const perExecutor = { ...(executorPathsConfig[key] || {}) };
    const legacyKey = `${key}SessionsDir`;
    if (!perExecutor.sessionsDir && config[legacyKey]) {
      perExecutor.sessionsDir = config[legacyKey];
    }
    if (executor.resolvePaths) {
      resolved.executors[key] = executor.resolvePaths({ config: perExecutor, baseDir, resolvePath });
    } else {
      resolved.executors[key] = {
        sessionsDir: resolvePath(perExecutor.sessionsDir, baseDir)
      };
    }
  });

  return resolved;
}

function resolvePath(value, baseDir) {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  if (value.startsWith('~')) {
    return path.join(os.homedir(), value.slice(1));
  }
  if (path.isAbsolute(value)) {
    return value;
  }
  return path.join(baseDir, value);
}

function prepareDirectories(paths) {
  if (paths.sessionsFile) {
    ensureDirectory(path.dirname(paths.sessionsFile));
  }
  ensureDirectory(paths.logsDir);
  ensureDirectory(paths.backgroundDir);
}

function ensureDirectory(dirPath) {
  if (!dirPath) return;
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function runChat(parsed, config, paths) {
  if (parsed.options.requestHelp) {
    runHelp(config, paths);
    return;
  }

  const [agentName, ...promptParts] = parsed.commandArgs;
  if (!agentName) {
    throw new Error('Usage: genie run <agent> "<prompt>" [--preset <name>]');
  }
  if (agentName.startsWith('genie-')) {
    throw new Error(`Genie Modes must be invoked via: genie mode ${agentName.replace(/^genie-/, '')} "<prompt>"`);
  }
  const prompt = promptParts.join(' ').trim();
  if (!prompt) {
    throw new Error('Prompt is required for chat command.');
  }

  const presetName = parsed.options.preset || 'default';
  const instructions = loadAgent(agentName);

  const executorKey = resolveExecutorKey(parsed.options, config, presetName);
  const executor = requireExecutor(executorKey);
  const executorConfig = buildExecutorConfig(config, presetName, executorKey);
  const executorPaths = resolveExecutorPaths(paths, executorKey);
  const store = loadSessions(paths, config, DEFAULT_CONFIG);

  const startTime = deriveStartTime();
  const logFile = deriveLogFile(agentName, startTime, paths);

  const isoNow = new Date().toISOString();
  const entry = {
    ...(store.agents[agentName] || {}),
    agent: agentName,
    preset: presetName,
    logFile,
    lastPrompt: prompt.slice(0, 200),
    created: (store.agents[agentName] && store.agents[agentName].created) || isoNow,
    lastUsed: isoNow,
    status: 'starting',
    background: parsed.options.background,
    runnerPid: parsed.options.backgroundRunner ? process.pid : null,
    executor: executorKey,
    executorPid: null,
    codexPid: null,
    exitCode: null,
    signal: null,
    startTime: new Date(startTime).toISOString()
  };
  store.agents[agentName] = entry;
  saveSessions(paths, store);

  if (parsed.options.background && !parsed.options.backgroundRunner) {
    const runnerPid = spawnBackgroundProcess(parsed.options.rawArgs, startTime, logFile, config);
    entry.runnerPid = runnerPid;
    entry.status = 'running';
    saveSessions(paths, store);
    console.log(`🧞 Background conversation started: ${agentName}`);
    console.log(`   Log: ${formatPathRelative(logFile, paths.baseDir)}`);
    console.log(`   Watch: tail -f ${formatPathRelative(logFile, paths.baseDir)}`);
    return;
  }

  const command = executor.buildRunCommand({
    config: executorConfig,
    instructions,
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

function spawnBackgroundProcess(rawArgs, startTime, logFile, config) {
  if (!config.background || !config.background.enabled) {
    throw new Error('Background execution is disabled in configuration.');
  }

  const spawnEnv = {
    ...process.env,
    [INTERNAL_BACKGROUND_ENV]: '1',
    [INTERNAL_START_TIME_ENV]: String(startTime),
    [INTERNAL_LOG_PATH_ENV]: logFile
  };

  const child = spawn(process.execPath, [__filename, ...rawArgs], {
    detached: Boolean(config.background.detach),
    stdio: config.background.detach ? 'ignore' : 'inherit',
    env: spawnEnv
  });
  child.unref();
  return child.pid;
}

function resolveExecutorKey(options, config, presetName) {
  if (options.executor) return options.executor;
  const preset = config.presets && config.presets[presetName];
  if (preset && preset.executor) return preset.executor;
  if (config.defaults && config.defaults.executor) return config.defaults.executor;
  return 'codex';
}

function requireExecutor(key) {
  const executor = EXECUTORS[key];
  if (!executor) {
    const available = Object.keys(EXECUTORS).join(', ') || 'none';
    throw new Error(`Executor '${key}' not found. Available executors: ${available}`);
  }
  return executor;
}

function buildExecutorConfig(config, presetName, executorKey) {
  const base = deepClone((config.executors && config.executors[executorKey]) || {});
  const preset = config.presets && config.presets[presetName];
  if (!preset && presetName && presetName !== 'default') {
    const available = Object.keys(config.presets || {}).join(', ') || 'default';
    throw new Error(`Preset '${presetName}' not found. Available presets: ${available}`);
  }
  const overrides = getExecutorOverrides(preset, executorKey);
  return mergeDeep(base, overrides);
}

function getExecutorOverrides(preset, executorKey) {
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

function resolveExecutorPaths(paths, executorKey) {
  if (!paths || !paths.executors) return {};
  return paths.executors[executorKey] || {};
}

function executeRun({
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
}) {
  if (!command || typeof command.command !== 'string' || !Array.isArray(command.args)) {
    throw new Error(`Executor '${executorKey}' returned an invalid command configuration.`);
  }

  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  const spawnOptions = {
    stdio: ['ignore', 'pipe', 'pipe'],
    ...(command.spawnOptions || {})
  };
  const proc = spawn(command.command, command.args, spawnOptions);

  entry.status = 'running';
  entry.executorPid = proc.pid || null;
  entry.codexPid = entry.executorPid; // for compatibility with existing session files
  if (runnerPid) entry.runnerPid = runnerPid;
  saveSessions(paths, store);

  if (proc.stdout) proc.stdout.pipe(logStream);
  if (proc.stderr) proc.stderr.pipe(logStream);

  if (!background) {
    if (proc.stdout) proc.stdout.pipe(process.stdout);
    if (proc.stderr) proc.stderr.pipe(process.stderr);
  }

  proc.on('error', (error) => {
    entry.status = 'failed';
    entry.error = error.message;
    entry.lastUsed = new Date().toISOString();
    saveSessions(paths, store);
    logStream.end();
    if (!background) {
      console.error(`\n❌ Failed to launch ${executorKey} for ${agentName}: ${error.message}`);
    }
  });

  proc.on('exit', (code, signal) => {
    const finishedAt = new Date().toISOString();
    entry.lastUsed = finishedAt;
    entry.exitCode = code;
    entry.signal = signal;
    entry.status = code === 0 ? 'completed' : 'failed';
    saveSessions(paths, store);
    logStream.end();

    if (!background) {
      const outcome = code === 0 ? `✅ ${executorKey} run completed` : `⚠️ ${executorKey} exited with code ${code}`;
      console.log(`\n${outcome} (${agentName})`);
      if (entry.sessionId) {
        console.log(`Session ID: ${entry.sessionId}`);
      }
      console.log(`Log: ${formatPathRelative(logFile, paths.baseDir)}`);
    }
  });

  const defaultDelay = (config.background && config.background.sessionExtractionDelayMs) || 2000;
  const sessionDelay = executor.getSessionExtractionDelay
    ? executor.getSessionExtractionDelay({ config: executorConfig, defaultDelay })
    : defaultDelay;

  if (executor.extractSessionId) {
    setTimeout(() => {
      if (entry.sessionId) return;
      const sessionId = executor.extractSessionId({
        startTime,
        config: executorConfig,
        paths: executorPaths
      });
      if (sessionId) {
        entry.sessionId = sessionId;
        entry.lastUsed = new Date().toISOString();
        saveSessions(paths, store);
        if (!background) {
          console.log(`\n✅ Session saved for ${agentName} (${sessionId})`);
        }
      }
    }, sessionDelay);
  }
}

function runContinue(parsed, config, paths) {
  if (parsed.options.requestHelp) {
    runHelp(config, paths);
    return;
  }

  const cmdArgs = parsed.commandArgs;
  if (cmdArgs.length < 2) {
    throw new Error('Usage: genie continue <sessionId> "<prompt>"');
  }

  const store = loadSessions(paths, config, DEFAULT_CONFIG);
  const sessionIdArg = cmdArgs[0];
  const prompt = cmdArgs.slice(1).join(' ').trim();
  let agentName = null;
  for (const [id, data] of Object.entries(store.agents || {})) {
    if (data && data.sessionId === sessionIdArg) { agentName = id; break; }
  }
  if (!agentName) throw new Error(`❌ No run found with session id '${sessionIdArg}'`);

  const session = store.agents[agentName];
  if (!session || !session.sessionId) {
    throw new Error(`❌ No active session for agent '${agentName}'`);
  }

  // Reuse exact preset from the originating session; ignore overrides on continue
  const presetName = session.preset || (config.defaults && config.defaults.preset) || 'default';
  const executorKey = session.executor || resolveExecutorKey(parsed.options, config, presetName);
  const executor = requireExecutor(executorKey);
  const executorConfig = buildExecutorConfig(config, presetName, executorKey);
  const executorPaths = resolveExecutorPaths(paths, executorKey);
  const command = executor.buildResumeCommand({
    config: executorConfig,
    sessionId: session.sessionId,
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
  session.codexPid = null;
  session.exitCode = null;
  session.signal = null;
  saveSessions(paths, store);

  if (parsed.options.background && !parsed.options.backgroundRunner) {
    const runnerPid = spawnBackgroundProcess(parsed.options.rawArgs, startTime, logFile, config);
    session.runnerPid = runnerPid;
    session.status = 'running';
    saveSessions(paths, store);
    console.log(`🧞 Background resume started: ${agentName}`);
    console.log(`   Log: ${formatPathRelative(logFile, paths.baseDir)}`);
    console.log(`   Watch: tail -f ${formatPathRelative(logFile, paths.baseDir)}`);
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

function runList(config, paths) {
  // Alias to runs (full view)
  runRuns({ options: {} }, config, paths);
}

function runRuns(parsed, config, paths) {
  const store = loadSessions(paths, config, DEFAULT_CONFIG);
  const entries = Object.entries(store.agents);
  const dataAll = entries.map(([agent, d]) => ({
    agent,
    status: resolveDisplayStatus(d),
    sessionId: d.sessionId || null,
    log: d.logFile || null,
    lastUsed: d.lastUsed || d.created || null,
    runnerPid: d.runnerPid || null,
    executor: d.executor || (config.defaults && config.defaults.executor) || 'codex',
    executorPid: d.executorPid || d.codexPid || null
  }));

  if (parsed.options.stop) {
    const id = parsed.options.stop;
    const entry = store.agents[id];
    if (!entry) {
      console.error(`❌ No session for agent '${id}'`);
    } else {
      let stopped = false;
      const executorPid = entry.executorPid || entry.codexPid;
      try { if (isProcessAlive(executorPid)) { process.kill(executorPid, 'SIGTERM'); stopped = true; } } catch {}
      try { if (isProcessAlive(entry.runnerPid)) { process.kill(entry.runnerPid, 'SIGTERM'); stopped = true; } } catch {}
      if (stopped) {
        entry.status = 'stopped';
        saveSessions(paths, store);
        console.log(`🛑 Stopped: ${id}`);
      } else {
        console.log(`ℹ️ Not running: ${id}`);
      }
    }
  }

  const pad = (s, n) => (String(s || '') + ' '.repeat(n)).slice(0, n);
  const want = parsed.options.status && String(parsed.options.status).toLowerCase();
  const byStatus = (s) => dataAll.filter(r => (r.status || '').toLowerCase().startsWith(s));
  const sortByTimeDesc = (arr) => arr.sort((a,b)=> new Date(b.lastUsed||0)-new Date(a.lastUsed||0));
  const page = parsed.options.page || 1;
  const per = parsed.options.per || 1;
  const paginate = (arr) => { const start=(page-1)*per; return arr.slice(start, start+per); };
  const fmt = (rows) => {
    const header = `  ${pad('ID', 18)} ${pad('Status', 12)} ${pad('Session ID', 36)} ${pad('Last Used', 20)} Log`;
    console.log(header);
    rows.forEach(r => {
      const when = r.lastUsed ? new Date(r.lastUsed).toLocaleString() : 'n/a';
      const logRel = r.log ? formatPathRelative(r.log, paths.baseDir) : 'n/a';
      console.log(`  ${pad(r.agent, 18)} ${pad(r.status || 'unknown', 12)} ${pad(r.sessionId || 'n/a', 36)} ${pad(when, 20)} ${logRel}`);
    });
  };

  if (want && want !== 'default') {
    let pool;
    if (want === 'all') pool = sortByTimeDesc([...dataAll]);
    else if (want === 'running') pool = sortByTimeDesc([...byStatus('running'), ...byStatus('pending-completion')]);
    else pool = sortByTimeDesc(dataAll.filter(r => (r.status||'').toLowerCase().startsWith(want)));
    const pageRows = paginate(pool);
    if (parsed.options.json) { console.log(JSON.stringify(pageRows, null, 2)); return; }
    console.log('\nRuns:');
    if (!pageRows.length) console.log('  (none)'); else fmt(pageRows);
    console.log(`\nPage ${page} • per ${per} • Next: genie runs --status ${want} --page ${page+1} --per ${per}`);
    console.log(`Use: genie view <id|sessionId> [--follow]   •   Resume: genie continue <sessionId> "<prompt>"`);
    return;
  }

  // Default: active + recent
  const activePool = sortByTimeDesc([...byStatus('running'), ...byStatus('pending-completion')]);
  const recentPool = sortByTimeDesc(dataAll.filter(r => !['running','pending-completion'].includes((r.status||'').toLowerCase())));
  const activeRows = paginate(activePool);
  const recentRows = paginate(recentPool);
  if (parsed.options.json) { console.log(JSON.stringify({ active: activeRows, recent: recentRows }, null, 2)); return; }
  console.log('\nActive:'); if (!activeRows.length) console.log('  (none)'); else fmt(activeRows);
  console.log('\nRecent:'); if (!recentRows.length) console.log('  (none)'); else fmt(recentRows);
  console.log(`\nPage ${page} • per ${per} • Next: genie runs --page ${page+1} --per ${per} • Focus: genie runs --status completed`);
  console.log(`Use: genie view <id|sessionId> [--follow]   •   Resume: genie continue <sessionId> "<prompt>"`);
}

function runView(parsed, config, paths) {
  const [target] = parsed.commandArgs;
  if (!target) {
    console.log('Usage: genie view <id|sessionId> [--follow] [--lines N]');
    return;
  }
  const store = loadSessions(paths, config, DEFAULT_CONFIG);
  const entry = resolveEntryByIdOrSession(store, target);
  if (!entry) {
    console.error(`❌ No run found matching '${target}'`);
    return;
  }
  const logFile = entry.logFile;
  if (!logFile || !fs.existsSync(logFile)) {
    console.error('❌ Log not found for this run');
    return;
  }
  if (parsed.options.follow) {
    // Fallback to tail -f for live view
    const tail = spawn('tail', ['-n', String(parsed.options.lines || 60), '-f', logFile], { stdio: 'inherit' });
    tail.on('error', (e) => console.error('❌ Failed to tail log:', e.message));
    return;
  }
  if (parsed.options.json) {
    // Raw output for debugging parser
    const raw = fs.readFileSync(logFile, 'utf8');
    process.stdout.write(raw);
    return;
  }
  // Friendly parse
  const content = fs.readFileSync(logFile, 'utf8');
  const allLines = content.split(/\r?\n/);
  const jsonl = [];
  for (const line of allLines) {
    const t = line.trim();
    if (!t) continue;
    try { jsonl.push(JSON.parse(t)); } catch (_) { /* skip non-json */ }
  }
  if (jsonl.length) {
    renderJsonlView({ entry, jsonl, raw: content }, parsed, paths);
  } else {
    renderTextView({ entry, lines: allLines }, parsed, paths);
  }
}

function renderJsonlView(src, parsed, paths) {
  const { entry, jsonl, raw } = src;
  const meta = jsonl.find((e) => e.provider && e.model) || {};
  const promptObj = jsonl.find((e) => typeof e.prompt === 'string') || {};
  const prompt = promptObj.prompt || '';
  const lastN = (parsed.options.lines && parsed.options.lines > 0) ? parsed.options.lines : 60;

  const byCall = new Map();
  const execs = [];
  const mcp = [];
  const patches = { add: 0, update: 0, move: 0, delete: 0 };
  const errs = [];
  let tokenInfo = null;
  let rateLimits = null;

  jsonl.forEach((ev) => {
    const m = ev.msg || {};
    switch (m.type) {
      case 'exec_command_begin':
        byCall.set(m.call_id, { cmd: (m.command || []).join(' '), cwd: m.cwd });
        break;
      case 'exec_command_end': {
        const rec = byCall.get(m.call_id) || {};
        execs.push({ cmd: rec.cmd || '(unknown)', exit: m.exit_code, dur: m.duration });
        break; }
      case 'mcp_tool_call_begin':
        byCall.set(m.call_id, { mcp: { server: m.invocation && m.invocation.server, tool: m.invocation && m.invocation.tool } });
        break;
      case 'mcp_tool_call_end': {
        const rec = byCall.get(m.call_id) || { mcp: {} };
        const d = m.duration || {};
        mcp.push({ server: (rec.mcp && rec.mcp.server) || '?', tool: (rec.mcp && rec.mcp.tool) || '?', secs: d.secs || 0 });
        break; }
      case 'patch_apply_begin': {
        const changes = m.changes || {};
        Object.values(changes).forEach((chg) => {
          if (chg.add) patches.add += 1;
          if (chg.update) { patches.update += 1; if (chg.update.move_path) patches.move += 1; }
          if (chg.delete) patches.delete += 1;
        });
        break; }
      case 'token_count': {
        if (ev.info && ev.info.total_token_usage) tokenInfo = ev.info.total_token_usage;
        if (ev.rate_limits) rateLimits = ev.rate_limits;
        break; }
      default: {
        const s = JSON.stringify(m);
        if (/error/i.test(s)) errs.push(m);
      }
    }
  });

  console.log(`\nView: ${entry.agent} | session:${entry.sessionId || 'n/a'} | log:${formatPathRelative(entry.logFile, paths.baseDir)}`);
  if (meta.model) {
    console.log(`Model: ${meta.model} • Provider: ${meta.provider} • Sandbox: ${meta.sandbox || 'n/a'}`);
    if (meta.workdir) console.log(`Workdir: ${meta.workdir}`);
  }
  if (prompt) {
    console.log('\nPrompt:');
    console.log('  ' + prompt);
  }
  if (mcp.length) {
    console.log(`\nMCP (${mcp.length}):`);
    mcp.slice(-5).forEach((c) => console.log(`  • ${c.server}:${c.tool} ${c.secs}s`));
  }
  if (patches.add || patches.update || patches.move || patches.delete) {
    console.log(`\nPatches: add:${patches.add} update:${patches.update} move:${patches.move} delete:${patches.delete}`);
  }
  if (execs.length) {
    console.log(`\nExecs (last ${Math.min(3, execs.length)}):`);
    execs.slice(-3).forEach((e) => {
      const ms = e.dur ? (e.dur.secs * 1000 + Math.round((e.dur.nanos || 0)/1e6)) : null;
      console.log(`  ${e.exit === 0 ? 'OK ' : 'ERR'} ${e.cmd}  (${ms || '?'} ms)`);
    });
  }
  if (errs.length) {
    console.log('\nErrors (recent):');
    errs.slice(-5).forEach((e) => {
      const s = JSON.stringify(e).slice(0, 160);
      console.log('  ' + s + (s.length >= 160 ? '…' : ''));
    });
  }
  // Footer stats table
  const okCount = execs.filter(e => e.exit === 0).length;
  const errCount = execs.filter(e => e.exit !== 0 && e.exit != null).length;
  console.log('\nStats:');
  const pad = (s, n) => (String(s || '') + ' '.repeat(n)).slice(0, n);
  console.log('  ' + pad('MCP', 16) + ` ${mcp.length}`);
  console.log('  ' + pad('Execs', 16) + ` total:${execs.length} ok:${okCount} err:${errCount}`);
  console.log('  ' + pad('Patches', 16) + ` add:${patches.add} update:${patches.update} move:${patches.move} delete:${patches.delete}`);
  if (tokenInfo) {
    console.log('  ' + pad('Tokens', 16) + ` in:${tokenInfo.input_tokens||0} out:${tokenInfo.output_tokens||0} total:${tokenInfo.total_tokens||0}`);
  }
  if (rateLimits && rateLimits.primary) {
    console.log('  ' + pad('RateLimit', 16) + ` used:${rateLimits.primary.used_percent||0}% reset:${rateLimits.primary.resets_in_seconds||0}s`);
  }
  console.log(`\nRaw Tail (${lastN} lines):`);
  raw.split(/\r?\n/).slice(-lastN).forEach((l) => console.log('  ' + l));
}

function renderTextView(src, parsed, paths) {
  const { entry, lines } = src;
  const lastN = (parsed.options.lines && parsed.options.lines > 0) ? parsed.options.lines : 60;
  let lastInstructionsIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) { if ((lines[i]||'').includes('User instructions:')) { lastInstructionsIdx = i; break; } }
  const instructions = [];
  if (lastInstructionsIdx !== -1) {
    for (let i = lastInstructionsIdx; i < Math.min(lines.length, lastInstructionsIdx + 20); i++) {
      instructions.push(lines[i]);
      if (i > lastInstructionsIdx && (lines[i]||'').trim() === '') break;
    }
  }
  const errorLines = lines.filter(l => /\bERROR\b|\bError:\b|\bFailed\b/i.test(l || '')).slice(-10);
  console.log(`\nView: ${entry.agent} | session:${entry.sessionId || 'n/a'} | log:${formatPathRelative(entry.logFile, paths.baseDir)}`);
  if (instructions.length) { console.log('\nLast Instructions:'); instructions.forEach(l => console.log('  ' + l)); }
  if (errorLines.length) { console.log('\nRecent Errors:'); errorLines.forEach(l => console.log('  ' + l)); }
  console.log('\nStats:');
  console.log('  Errors           ' + errorLines.length);
  console.log('  Lines            ' + lines.length);
  console.log(`\nTail (${lastN} lines):`);
  lines.slice(-lastN).forEach(l => console.log('  ' + l));
}

function resolveEntryByIdOrSession(store, target) {
  if (store.agents[target]) return store.agents[target];
  for (const data of Object.values(store.agents || {})) {
    if (data && data.sessionId === target) return data;
  }
  return null;
}

function resolveDisplayStatus(entry) {
  const baseStatus = entry.status || 'unknown';
  const executorRunning = isProcessAlive(entry.executorPid || entry.codexPid);
  const runnerRunning = isProcessAlive(entry.runnerPid);

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

function isProcessAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error && error.code === 'EPERM') return true;
    return false;
  }
}

function runClear(parsed, config, paths) {
  const [agentName] = parsed.commandArgs;
  if (!agentName) {
    throw new Error('Usage: agent clear <agent>');
  }
  const store = loadSessions(paths, config, DEFAULT_CONFIG);
  const entry = store.agents[agentName];
  if (!entry) {
    console.log(`No session found for ${agentName}`);
    return;
  }
  if (isProcessAlive(entry.executorPid || entry.codexPid) || isProcessAlive(entry.runnerPid)) {
    console.error(`⚠️ Session for ${agentName} is still running. Stop the process before clearing.`);
    return;
  }
  delete store.agents[agentName];
  saveSessions(paths, store);
  console.log(`✅ Cleared session for ${agentName}`);
}

function runHelp(config, paths) {
  const agents = listAgents();
  const presetsEntries = Object.entries(config.presets || {});
  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
  const cmdW = 12; // command col width
  const argW = 28; // args col width
  const backgroundDefault = Boolean(config.defaults && config.defaults.background);
  const runDesc = backgroundDefault ? 'Start a run (background default)' : 'Start a run (foreground default)';
  const rows = [
    { cmd: 'run', args: '<agent> "<prompt>"', desc: runDesc },
    { cmd: 'mode', args: '<genie-mode> "<prompt>"', desc: 'Run a Genie Mode (maps to genie-<mode>)' },
    { cmd: 'continue', args: '<sessionId> "<prompt>"', desc: 'Continue run by session id' },
    { cmd: 'view', args: '<id|sessionId> [--follow] [--lines N]', desc: 'View run output (friendly); live follow with --follow' },
    { cmd: 'runs', args: '[--status <s>] [--json]', desc: 'List runs with status; manage background tasks' },
    { cmd: 'list', args: '', desc: 'Show active/completed sessions' },
    { cmd: 'clear', args: '<agent>', desc: 'Clear a stopped/completed session' },
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

  // Build command table
  const commandsBlock = rows
    .map(r => `  ${pad(r.cmd, cmdW)} ${pad(r.args, argW)} ${r.desc}`)
    .join('\n');

  // Build options blocks
  const globalOpts = [
    { flag: '--preset <name>', desc: 'Select preset (default: default)' },
    { flag: '-c, --config <key=value>', desc: 'Override config key (repeatable)' },
    { flag: '--no-background', desc: 'Run in foreground (stream output)' }
  ].map(o => `  ${pad(o.flag, cmdW + argW)} ${o.desc}`).join('\n');

  // Agents Options removed

  const runsOpts = [
    { flag: '--status <s>', desc: 'Filter: running|completed|failed|stopped' },
    { flag: '--stop <agent>', desc: 'Attempt to stop a background run' },
    { flag: '--json', desc: 'JSON output' }
  ].map(o => `  ${pad(o.flag, cmdW + argW)} ${o.desc}`).join('\n');

  const presetsBlock = presets
    .map(p => `  ${pad(p.name, 16)} ${p.desc}`)
    .join('\n');

  const promptSkeleton = (
    '[Discovery] Load @files; identify objectives, constraints, gaps.\n' +
    '[Implementation] Apply per @.genie/agents/<agent>.md; edit files or produce artifacts.\n' +
    '[Verification] Summarize outputs, evidence, sections changed, open questions.'
  );

  const examples = [
    'genie mode planner "[Discovery] @vendors/... [Implementation] … [Verification] …"',
    'genie run forge-coder "[Discovery] @files … [Implementation] … [Verification] …"',
    'genie continue <sessionId> "Follow-up: refine branch B"',
    'genie runs --status running',
    'genie view <id|sessionId> --follow'
  ].map(e => `  ${e}`).join('\n');

  const configPathDisplay = config.__configPath || CONFIG_PATH;
  console.log(`${hdr}\n\n${usage}\n${bg}\n\nCommands:\n${commandsBlock}\n\nGlobal Options:\n${globalOpts}\n\nRuns Options:\n${runsOpts}\n\nConfig & Paths:\n  ${pad('Config:', cmdW + argW)} ${configPathDisplay}\n  ${pad('Logs:', cmdW + argW)} ${formatPathRelative(paths.logsDir, paths.baseDir)}\n\nPresets:\n${presetsBlock || '  (none)'}\n\nPrompt Skeleton:\n  ${promptSkeleton}\n\nExamples:\n${examples}`);
}

function listAgents() {
  const agentsDir = path.join('.genie', 'agents');
  if (!fs.existsSync(agentsDir)) return [];
  return fs
    .readdirSync(agentsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace('.md', ''));
}

function listAgentsDetailed() {
  const agentsDir = path.join('.genie', 'agents');
  if (!fs.existsSync(agentsDir)) return [];
  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const id = file.replace('.md', '');
    const full = path.join(agentsDir, file);
    const content = fs.readFileSync(full, 'utf8');
    const meta = parseFrontMatter(content);
    return { id, path: full, meta };
  });
}

function parseFrontMatter(text) {
  // Minimal frontmatter parser: reads between first two '---' lines
  // Returns key/value pairs for simple scalars
  const lines = text.split(/\r?\n/);
  if (lines[0] !== '---') return {};
  const meta = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') break;
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      // Strip surrounding quotes if present
      meta[key] = val.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }
  }
  return meta;
}

function runAgentsList(parsed, config, paths) {
  const all = listAgentsDetailed();
  const prefix = parsed.options.prefix;
  const filtered = prefix ? all.filter((a) => a.id.startsWith(prefix)) : all;
  if (parsed.options.json) {
    const payload = filtered.map((a) => ({ id: a.id, path: formatPathRelative(a.path, paths.baseDir), meta: a.meta }));
    console.log(JSON.stringify(payload, null, 2));
    return;
    }
  const style = (parsed.options.style || 'compact').toLowerCase();
  const promptHint = (id) => `Usage: genie run ${id} "[Discovery] Load @files & context. [Implementation] Apply per @.genie/agents/${id}.md. [Verification] Summarize edits, evidence, open questions."`;
  if (style === 'grouped') {
    // Previous grouped view
    const groups = { forge: [], hello: [], genie: [], other: [] };
    filtered.forEach((a) => {
      if (a.id.startsWith('forge-')) groups.forge.push(a);
      else if (a.id.startsWith('hello-')) groups.hello.push(a);
      else if (a.id.startsWith('genie-')) groups.genie.push(a);
      else groups.other.push(a);
    });
    const printGroup = (title, arr) => {
      if (!arr.length) return;
      console.log(`\n${title}:`);
      arr.forEach((a) => {
        const d = a.meta && a.meta.description ? a.meta.description : '';
        const m = a.meta && a.meta.model ? a.meta.model : 'n/a';
        console.log(`  • ${a.id} | model:${m} | ${d}`);
        console.log(`    ${promptHint(a.id)}`);
      });
    };
    console.log('\nAvailable Agents (from .genie/agents):');
    printGroup('genie-*', groups.genie);
    printGroup('hello-*', groups.hello);
    printGroup('forge-*', groups.forge);
    printGroup('other', groups.other);
    return;
  }
  // Compact one-line standardized output for LLM consumption
  // Format: <id> | model:<model> | <description>
  filtered
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((a) => {
      const m = a.meta && a.meta.model ? a.meta.model : 'n/a';
      const d = a.meta && a.meta.description ? a.meta.description : '';
      console.log(`${a.id} | model:${m} | ${d}`);
      console.log(`  ${promptHint(a.id)}`);
    });
}

function loadAgent(name) {
  const base = name.endsWith('.md') ? name.slice(0, -3) : name;
  const agentPath = path.join('.genie', 'agents', `${base}.md`);
  if (!fs.existsSync(agentPath)) {
    throw new Error(`❌ Agent '${name}' not found in .genie/agents`);
  }
  return fs.readFileSync(agentPath, 'utf8');
}

function runMode(parsed, config, paths) {
  const [modeName, ...promptParts] = parsed.commandArgs;
  if (!modeName) {
    throw new Error('Usage: genie mode <genie-mode> "<prompt>"');
  }
  const id = modeName.startsWith('genie-') ? modeName : `genie-${modeName}`;
  const prompt = promptParts.join(' ').trim();
  const cloned = { ...parsed, commandArgs: [id, prompt] };
  runChat(cloned, config, paths);
}

function deriveStartTime() {
  const fromEnv = process.env[INTERNAL_START_TIME_ENV];
  if (!fromEnv) return Date.now();
  const parsed = Number(fromEnv);
  if (Number.isFinite(parsed)) return parsed;
  return Date.now();
}

function deriveLogFile(agentName, startTime, paths) {
  const envPath = process.env[INTERNAL_LOG_PATH_ENV];
  if (envPath) return envPath;
  const filename = `${agentName}-${startTime}.log`;
  return path.join(paths.logsDir, filename);
}

function formatPathRelative(targetPath, baseDir) {
  if (!targetPath) return 'n/a';
  try {
    return path.relative(baseDir, targetPath) || targetPath;
  } catch (error) {
    return targetPath;
  }
}

function formatPromptPreview(prompt) {
  if (!prompt) return '';
  const trimmed = prompt.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}...`;
}

main();

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
  // YAML module not available; we'll ignore agent.yaml or try JSON as fallback.
}

const SCRIPT_DIR = path.dirname(__filename);
const CONFIG_PATH = path.join(SCRIPT_DIR, 'agent.yaml');

const INTERNAL_BACKGROUND_ENV = 'GENIE_AGENT_BACKGROUND_RUNNER';
const INTERNAL_START_TIME_ENV = 'GENIE_AGENT_START_TIME';
const INTERNAL_LOG_PATH_ENV = 'GENIE_AGENT_LOG_FILE';

const DEFAULT_CONFIG = {
  defaults: {
    preset: 'default',
    background: true
  },
  paths: {
    baseDir: '.',
    sessionsFile: '.genie/state/agents/sessions.json',
    legacySessionsFile: '~/.genie-sessions.json',
    logsDir: '.genie/state/agents/logs',
    backgroundDir: '.genie/state/agents/background',
    codexSessionsDir: '~/.codex/sessions'
  },
  codex: {
    exec: {
      fullAuto: true,
      model: 'gpt-5-codex',
      sandbox: 'workspace-write',
      profile: null,
      includePlanTool: false,
      search: false,
      skipGitRepoCheck: false,
      json: false,
      color: 'auto',
      cd: null,
      outputSchema: null,
      outputLastMessage: null,
      additionalArgs: [],
      images: []
    },
    resume: {
      includePlanTool: false,
      search: false,
      last: false,
      additionalArgs: []
    }
  },
  presets: {
    default: {
      description: 'Workspace-write automation with GPT-5 Codex.',
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
      case 'chat':
        runChat(parsed, config, paths);
        break;
      case 'continue':
        runContinue(parsed, config, paths);
        break;
      case 'agents':
        runAgentsList(parsed, config, paths);
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
    json: false,
    style: 'compact'
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
}

function loadConfig(overrides) {
  let config = deepClone(DEFAULT_CONFIG);
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const file = fs.readFileSync(CONFIG_PATH, 'utf8');
      if (file.trim().length) {
        let parsed = {};
        if (YAML) {
          parsed = YAML.parse(file) || {};
        } else if (file.trim().startsWith('{')) {
          try { parsed = JSON.parse(file); } catch (_) { parsed = {}; }
        } else {
          console.warn('[genie] YAML module not found; skipping agent.yaml parsing');
        }
        config = mergeDeep(config, parsed);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${CONFIG_PATH}: ${error.message}`);
    }
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

function resolvePaths(pathsConfig) {
  const baseDir = resolvePath(pathsConfig.baseDir || '.', process.cwd());
  return {
    baseDir,
    sessionsFile: resolvePath(pathsConfig.sessionsFile, baseDir),
    legacySessionsFile: resolvePath(pathsConfig.legacySessionsFile, baseDir),
    logsDir: resolvePath(pathsConfig.logsDir, baseDir),
    backgroundDir: resolvePath(pathsConfig.backgroundDir, baseDir),
    codexSessionsDir: resolvePath(pathsConfig.codexSessionsDir, baseDir)
  };
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
  ensureDirectory(path.dirname(paths.sessionsFile));
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
    throw new Error('Usage: agent chat <agent> "<prompt>" [--preset <name>] [--background]');
  }
  const prompt = promptParts.join(' ').trim();
  if (!prompt) {
    throw new Error('Prompt is required for chat command.');
  }

  const presetName = parsed.options.preset || 'default';
  const instructions = loadAgent(agentName);

  const execConfig = buildExecConfig(config, presetName);
  const store = loadSessions(paths);

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
    console.log(`🧞 Background conversation started with ${agentName}.`);
    console.log(`   Runner PID: ${runnerPid}`);
    console.log(`   Log file: ${formatPathRelative(logFile, paths.baseDir)}`);
    return;
  }

  executeCodexRun({
    args: buildExecArgs(execConfig, instructions, prompt),
    agentName,
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

function buildExecConfig(config, presetName) {
  const baseExec = config.codex && config.codex.exec ? config.codex.exec : {};
  const preset = config.presets && config.presets[presetName];
  if (!preset && presetName && presetName !== 'default') {
    const available = Object.keys(config.presets || {}).join(', ') || 'default';
    throw new Error(`Preset '${presetName}' not found. Available presets: ${available}`);
  }
  const overrides = (preset && preset.overrides && preset.overrides.exec) || {};
  return mergeDeep(baseExec, overrides);
}

function buildExecArgs(execConfig, instructions, prompt) {
  const args = ['exec', ...collectExecOptions(execConfig)];
  args.push('-c', `base-instructions=${JSON.stringify(instructions)}`);
  if (prompt) {
    args.push(prompt);
  }
  return args;
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
  if (execConfig.json) options.push('--json');
  if (execConfig.color && execConfig.color !== 'auto') options.push('--color', String(execConfig.color));
  if (execConfig.cd) options.push('-C', String(execConfig.cd));
  if (execConfig.outputSchema) options.push('--output-schema', String(execConfig.outputSchema));
  if (execConfig.outputLastMessage) options.push('--output-last-message', String(execConfig.outputLastMessage));
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

function executeCodexRun({ args, agentName, prompt, store, entry, paths, config, startTime, logFile, background, runnerPid }) {
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  const proc = spawn('codex', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  entry.status = 'running';
  entry.codexPid = proc.pid || null;
  if (runnerPid) entry.runnerPid = runnerPid;
  saveSessions(paths, store);

  proc.stdout.pipe(logStream);
  proc.stderr.pipe(logStream);

  if (!background) {
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
  }

  proc.on('error', (error) => {
    entry.status = 'failed';
    entry.error = error.message;
    entry.lastUsed = new Date().toISOString();
    saveSessions(paths, store);
    logStream.end();
    if (!background) {
      console.error(`\n❌ Failed to launch Codex for ${agentName}: ${error.message}`);
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
      const outcome = code === 0 ? '✅ Codex run completed' : `⚠️ Codex exited with code ${code}`;
      console.log(`\n${outcome} (${agentName})`);
      if (entry.sessionId) {
        console.log(`Session ID: ${entry.sessionId}`);
      }
      console.log(`Log: ${formatPathRelative(logFile, paths.baseDir)}`);
    }
  });

  const delay = (config.background && config.background.sessionExtractionDelayMs) || 2000;
  setTimeout(() => {
    if (entry.sessionId) return;
    const sessionId = extractSessionId(startTime, paths.codexSessionsDir);
    if (sessionId) {
      entry.sessionId = sessionId;
      entry.lastUsed = new Date().toISOString();
      saveSessions(paths, store);
      if (!background) {
        console.log(`\n✅ Session saved for ${agentName} (${sessionId})`);
      }
    }
  }, delay);
}

function runContinue(parsed, config, paths) {
  if (parsed.options.requestHelp) {
    runHelp(config, paths);
    return;
  }

  const [agentName, ...promptParts] = parsed.commandArgs;
  if (!agentName) {
    throw new Error('Usage: agent continue <agent> "<prompt>" [--background]');
  }
  const prompt = promptParts.join(' ').trim();

  const store = loadSessions(paths);
  const session = store.agents[agentName];
  if (!session || !session.sessionId) {
    throw new Error(`❌ No active session for agent '${agentName}'`);
  }

  const presetName = session.preset || parsed.options.preset || (config.defaults && config.defaults.preset) || 'default';
  const execConfig = buildExecConfig(config, presetName);
  const resumeConfig = (config.codex && config.codex.resume) || {};
  const args = buildResumeArgs(execConfig, resumeConfig, session.sessionId, prompt);

  const startTime = deriveStartTime();
  const logFile = deriveLogFile(agentName, startTime, paths);

  session.lastPrompt = prompt ? prompt.slice(0, 200) : session.lastPrompt;
  session.lastUsed = new Date().toISOString();
  session.logFile = logFile;
  session.status = 'starting';
  session.background = parsed.options.background;
  session.runnerPid = parsed.options.backgroundRunner ? process.pid : null;
  session.codexPid = null;
  session.exitCode = null;
  session.signal = null;
  saveSessions(paths, store);

  if (parsed.options.background && !parsed.options.backgroundRunner) {
    const runnerPid = spawnBackgroundProcess(parsed.options.rawArgs, startTime, logFile, config);
    session.runnerPid = runnerPid;
    session.status = 'running';
    saveSessions(paths, store);
    console.log(`🧞 Background resume started for ${agentName}.`);
    console.log(`   Runner PID: ${runnerPid}`);
    console.log(`   Log file: ${formatPathRelative(logFile, paths.baseDir)}`);
    return;
  }

  executeCodexRun({
    args,
    agentName,
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

function buildResumeArgs(execConfig, resumeConfig, sessionId, prompt) {
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
  return args;
}

function runList(config, paths) {
  const store = loadSessions(paths);
  const entries = Object.entries(store.agents);
  if (entries.length === 0) {
    console.log('No active sessions. Start one with: agent chat <agent> "<prompt>"');
    return;
  }

  console.log('\n🧞 Active Agent Sessions:\n');
  entries.forEach(([agent, data]) => {
    const status = resolveDisplayStatus(data);
    const lastUsed = data.lastUsed ? new Date(data.lastUsed).toLocaleString() : 'unknown';
    console.log(`  ${agent}:`);
    console.log(`    Status: ${status}`);
    if (data.sessionId) {
      console.log(`    Session ID: ${data.sessionId}`);
    }
    if (data.runnerPid) {
      console.log(`    Runner PID: ${data.runnerPid}`);
    }
    if (data.codexPid) {
      console.log(`    Codex PID: ${data.codexPid}`);
    }
    if (typeof data.exitCode === 'number') {
      console.log(`    Exit code: ${data.exitCode}`);
    }
    console.log(`    Last prompt: "${formatPromptPreview(data.lastPrompt)}"`);
    console.log(`    Last used: ${lastUsed}`);
    if (data.logFile) {
      console.log(`    Log: ${formatPathRelative(data.logFile, paths.baseDir)}`);
    }
    console.log('');
  });
}

function resolveDisplayStatus(entry) {
  const baseStatus = entry.status || 'unknown';
  const codexRunning = isProcessAlive(entry.codexPid);
  const runnerRunning = isProcessAlive(entry.runnerPid);

  if (baseStatus === 'running') {
    if (codexRunning) return 'running';
    if (!codexRunning && runnerRunning) return 'pending-completion';
    if (entry.exitCode === 0) return 'completed';
    if (typeof entry.exitCode === 'number' && entry.exitCode !== 0) {
      return `failed (${entry.exitCode})`;
    }
    return 'stopped';
  }

  if (baseStatus === 'completed' || baseStatus === 'failed') {
    return baseStatus;
  }

  if (runnerRunning || codexRunning) {
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
  const store = loadSessions(paths);
  const entry = store.agents[agentName];
  if (!entry) {
    console.log(`No session found for ${agentName}`);
    return;
  }
  if (isProcessAlive(entry.codexPid) || isProcessAlive(entry.runnerPid)) {
    console.error(`⚠️ Session for ${agentName} is still running. Stop the process before clearing.`);
    return;
  }
  delete store.agents[agentName];
  saveSessions(paths, store);
  console.log(`✅ Cleared session for ${agentName}`);
}

function runHelp(config, paths) {
  const agents = listAgents();
  const presets = Object.entries(config.presets || {});
  console.log(`
🧞 GENIE Agent CLI — Prompt-Oriented Interface

Background mode: ON by default. Add --no-background to run in foreground.

Core Commands (self-explanatory, LLM-friendly):
  • agent chat <agent> "<prompt>" [--preset <name>] [--no-background]
      - Use prompt skeleton: "[Discovery] … [Implementation] … [Verification] …"
      - Include @file references to auto-load context
  • agent continue <agent> "<prompt>" [--no-background]
      - Continue the most recent session for <agent> with follow-up instructions
  • agent agents [--prefix <text>] [--style compact|grouped] [--json]
      - Lists agents with standardized line output for direct copy/paste
  • agent list
      - Shows active/completed sessions with logs and status
  • agent clear <agent>
      - Clears a stopped/completed session record

Prompt Skeleton (recommended for all chats):
  "[Discovery] Load @files and context; identify objectives, constraints, and gaps.
   [Implementation] Perform the requested work per @.genie/agents/<agent>.md; apply edits or produce artifacts.
   [Verification] Summarize outputs, list sections changed, evidence, and open questions."

Config & Paths:
  • Config file: ${CONFIG_PATH}
  • Override keys at runtime: agent chat hello-coder "..." -c codex.exec.model='"o4"'
  • Logs: ${formatPathRelative(paths.logsDir, paths.baseDir)}

Presets:
${presets.map(([name, info]) => `  • ${name}: ${info.description || 'no description'}`).join('\n')}

Quick Agent Catalog (ids only — see 'agent agents' for details):
${agents.map((a) => '  • ' + a).join('\n')}

Notes for agents:
  - Always include [Discovery][Implementation][Verification] blocks in prompts
  - Prefer @file references to auto-load code/docs
  - Use numbered, concise outcomes; reference Death Testaments when applicable
  - Background is default; use --no-background when interactive streaming is required
`);
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
  const promptHint = (id) => `Usage: agent chat ${id} "[Discovery] Load @files & context. [Implementation] Apply per @.genie/agents/${id}.md. [Verification] Summarize edits, evidence, open questions."`;
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

function loadSessions(paths) {
  const storePath = paths.sessionsFile;
  if (storePath && fs.existsSync(storePath)) {
    return normalizeSessionStore(readJson(storePath));
  }
  if (paths.legacySessionsFile && fs.existsSync(paths.legacySessionsFile)) {
    const legacy = readJson(paths.legacySessionsFile);
    return convertLegacySessions(legacy);
  }
  return { version: 1, agents: {} };
}

function saveSessions(paths, store) {
  const payload = JSON.stringify(store, null, 2);
  fs.writeFileSync(paths.sessionsFile, payload);
}

function readJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim().length) return {};
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`⚠️ Could not parse JSON from ${filePath}: ${error.message}`);
    return {};
  }
}

function normalizeSessionStore(data) {
  if (!data || typeof data !== 'object') {
    return { version: 1, agents: {} };
  }
  if (data.agents) {
    return {
      version: data.version || 1,
      agents: data.agents
    };
  }
  return {
    version: 1,
    agents: data
  };
}

function convertLegacySessions(legacy) {
  const store = { version: 1, agents: {} };
  if (!legacy || typeof legacy !== 'object') {
    return store;
  }
  Object.entries(legacy).forEach(([agent, data]) => {
    store.agents[agent] = {
      ...data,
      status: data && data.sessionId ? 'completed' : 'unknown',
      background: false
    };
  });
  return store;
}

function extractSessionId(startTime, codexSessionsDir) {
  if (!codexSessionsDir) return null;
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dayDir = path.join(codexSessionsDir, String(year), month, day);
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

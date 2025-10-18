import fs from 'fs';
import path from 'path';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import type { Executor } from '../executors/types';
import type { CLIOptions, ParsedCommand, ConfigPaths, GenieConfig, ExecuteRunArgs } from '../lib/types';
import { resolveAgentIdentifier, loadAgentSpec } from '../lib/agent-resolver';
import { deriveStartTime, deriveLogFile } from '../lib/utils';
import { getSemanticDisplayMessage } from '../lib/display-transform';
import { INTERNAL_SESSION_ID_ENV } from '../background-manager';
import { getPackageRoot } from '../lib/paths';
import {
  loadSessions,
  saveSessions,
  SessionLoadConfig,
  SessionPathsConfig,
  SessionStore,
  SessionEntry
} from '../session-store';
import { DEFAULT_CONFIG } from '../lib/config-defaults';
import { emitView } from '../lib/view-helpers';
import { buildRunCompletionView } from '../views/background';
import type { ExecutorCommand } from '../executors/types';
import { maybeHandleBackgroundLaunch } from '../lib/background-launcher';
import {
  resolveExecutorKey,
  requireExecutor,
  extractExecutorOverrides,
  buildExecutorConfig,
  resolveExecutorPaths
} from '../lib/executor-config';
import {
  parseSessionUpdate,
  createSessionUpdateHandler,
  attachOutputListener,
  createLogPollingHandler
} from '../lib/session-updater';

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
  const cliMode = parsed.options.mode;
  const modeName = cliMode || (typeof agentMode === 'string' && agentMode.trim().length ? agentMode.trim() : defaultMode);
  const executorKey = parsed.options.executor || agentGenie.executor || resolveExecutorKey(config, modeName);
  const executor = requireExecutor(executorKey);
  const executorOverrides = extractExecutorOverrides(agentGenie, executorKey);
  const executorConfig = buildExecutorConfig(config, modeName, executorKey, executorOverrides);
  const executorPaths = resolveExecutorPaths(paths, executorKey);
  const store = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);

  const isBackgroundRunner = parsed.options.backgroundRunner === true;
  const startTime = deriveStartTime(isBackgroundRunner);
  const logFile = deriveLogFile(resolvedAgentName, startTime, paths, isBackgroundRunner);

  // Generate or reuse sessionId
  const uuidv4 = () => {
    try {
      const { randomUUID } = require('crypto');
      if (typeof randomUUID === 'function') return randomUUID();
    } catch {}
    const { randomBytes } = require('crypto');
    return randomBytes(16).toString('hex');
  };
  const { generateSessionName } = require('../session-store');
  const envSessionId = process.env[INTERNAL_SESSION_ID_ENV];
  const sessionId = (parsed.options.backgroundRunner && typeof envSessionId === 'string' && envSessionId.trim().length)
    ? envSessionId.trim()
    : uuidv4();

  const entry: SessionEntry = {
    agent: resolvedAgentName,
    name: parsed.options.name || generateSessionName(resolvedAgentName),
    preset: modeName,
    mode: modeName,
    logFile,
    lastPrompt: prompt.slice(0, 200),
    created: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    status: 'starting',
    background: parsed.options.background,
    runnerPid: parsed.options.backgroundRunner ? process.pid : null,
    executor: executorKey,
    executorPid: null,
    exitCode: null,
    signal: null,
    startTime: new Date(startTime).toISOString(),
    sessionId: sessionId // UUID assigned immediately
  };
  store.sessions[sessionId] = entry;
  saveSessions(paths as SessionPathsConfig, store);

  // Show executor info to user
  if (!parsed.options.backgroundRunner) {
    const model = executorConfig.exec?.model || executorConfig.model || 'default';
    const permissionMode = executorConfig.exec?.permissionMode || executorConfig.permissionMode || 'default';
    const executorSource = parsed.options.executor ? 'flag' : (agentGenie.executor ? 'agent' : 'config');

    console.error(getSemanticDisplayMessage(resolvedAgentName));
    console.error(`   Executor: ${executorKey} (from ${executorSource})`);
    console.error(`   Mode: ${modeName}`);
    console.error(`   Model: ${model}`);
    console.error(`   Permissions: ${permissionMode}`);
    console.error('');
  }

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

  // Pass agent instructions directly (already loaded by loadAgentSpec)
  // This avoids path resolution issues with npm-backed agents
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
    cliOptions: parsed.options,
    executionMode: modeName
  });
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

  // Write version header if log file is new
  const isNewLog = !fs.existsSync(logFile);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  if (isNewLog) {
    const pkg = JSON.parse(fs.readFileSync(path.join(getPackageRoot(), 'package.json'), 'utf8'));
    const timestamp = new Date().toISOString();
    logStream.write(`# Genie CLI v${pkg.version} - ${timestamp}\n\n`);
  }
  const spawnOptions: SpawnOptionsWithoutStdio = {
    stdio: ['ignore', 'pipe', 'pipe'] as any,
    ...(command.spawnOptions || {}),
    cwd: paths.baseDir  // Use workspace root, not inherited process.cwd()
  };
  const proc = spawn(command.command, command.args, spawnOptions);

  entry.status = 'running';
  entry.executorPid = proc.pid || null;
  if (runnerPid) entry.runnerPid = runnerPid;
  saveSessions(paths as SessionPathsConfig, store);

  let filteredStdout: NodeJS.ReadWriteStream | null = null;

  const updateSessionHandler = createSessionUpdateHandler(entry, store, paths);

  let outputSource: NodeJS.ReadableStream | null = null;

  if (proc.stdout) {
    if (executor.createOutputFilter) {
      filteredStdout = executor.createOutputFilter(logStream);
      outputSource = filteredStdout;
      attachOutputListener(filteredStdout, updateSessionHandler);
      proc.stdout.pipe(filteredStdout);
    } else {
      proc.stdout.pipe(logStream);
      outputSource = proc.stdout;
      attachOutputListener(proc.stdout, updateSessionHandler);
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
  if (logViewer?.readSessionIdFromLog) {
    const pollSessionIdFromLog = createLogPollingHandler(entry, store, paths, logFile, logViewer);
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
        sessionName: entry.name,
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

    if (!background) {
      const outcome = code === 0 ? 'success' : 'failure';
      const notes = signal ? [`Signal: ${signal}`] : [];
      const envelope = buildRunCompletionView({
        agentName,
        outcome,
        sessionName: entry.name,
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
    // sessionId already assigned at creation time - just update lastUsed if needed
    const attemptExtraction = () => {
      entry.lastUsed = new Date().toISOString();
      saveSessions(paths as SessionPathsConfig, store);
    };

    setTimeout(attemptExtraction, sessionDelay);
  }

  return promise;
}

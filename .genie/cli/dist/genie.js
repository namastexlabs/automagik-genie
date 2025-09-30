#!/usr/bin/env node
"use strict";
/**
 * GENIE Agent CLI - Codex exec orchestration with configurable execution modes
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const executors_1 = require("./executors");
const cli_parser_1 = require("./lib/cli-parser");
const config_1 = require("./lib/config");
const utils_1 = require("./lib/utils");
const agent_resolver_1 = require("./lib/agent-resolver");
const session_helpers_1 = require("./lib/session-helpers");
const view_1 = require("./view");
const help_1 = require("./views/help");
const agent_catalog_1 = require("./views/agent-catalog");
const runs_1 = require("./views/runs");
const background_1 = require("./views/background");
const stop_1 = require("./views/stop");
const common_1 = require("./views/common");
const chat_1 = require("./views/chat");
const transcript_utils_1 = require("./executors/transcript-utils");
const background_manager_1 = __importStar(require("./background-manager"));
const session_store_1 = require("./session-store");
const EXECUTORS = (0, executors_1.loadExecutors)();
if (!EXECUTORS[executors_1.DEFAULT_EXECUTOR_KEY]) {
    const available = Object.keys(EXECUTORS).join(', ') || 'none';
    throw new Error(`Default executor '${executors_1.DEFAULT_EXECUTOR_KEY}' not found. Available executors: ${available}`);
}
const backgroundManager = new background_manager_1.default();
const DEFAULT_CONFIG = (0, config_1.buildDefaultConfig)();
void main();
async function main() {
    try {
        let parsed = (0, cli_parser_1.parseArguments)(process.argv.slice(2));
        const envIsBackground = process.env[background_manager_1.INTERNAL_BACKGROUND_ENV] === '1';
        if (envIsBackground) {
            parsed.options.background = true;
            parsed.options.backgroundRunner = true;
            parsed.options.backgroundExplicit = true;
        }
        const config = (0, config_1.loadConfig)();
        (0, config_1.applyDefaults)(parsed.options, config.defaults);
        const paths = (0, config_1.resolvePaths)(config.paths || {});
        (0, config_1.prepareDirectories)(paths);
        const startupWarnings = (0, config_1.getStartupWarnings)();
        if (startupWarnings.length) {
            const envelope = (0, common_1.buildWarningView)('Configuration warnings', startupWarnings);
            await emitView(envelope, parsed.options);
            (0, config_1.clearStartupWarnings)();
        }
        switch (parsed.command) {
            case 'run':
                if (parsed.options.requestHelp) {
                    await emitView((0, help_1.buildRunHelpView)(), parsed.options);
                    return;
                }
                await runChat(parsed, config, paths);
                break;
            case 'resume':
                if (parsed.options.requestHelp) {
                    await emitView((0, help_1.buildResumeHelpView)(), parsed.options);
                    return;
                }
                await runContinue(parsed, config, paths);
                break;
            case 'list':
                if (parsed.options.requestHelp) {
                    await emitView((0, help_1.buildListHelpView)(), parsed.options);
                    return;
                }
                await runList(parsed, config, paths);
                break;
            case 'view':
                if (parsed.options.requestHelp) {
                    await emitView((0, help_1.buildViewHelpView)(), parsed.options);
                    return;
                }
                await runView(parsed, config, paths);
                break;
            case 'stop':
                if (parsed.options.requestHelp) {
                    await emitView((0, help_1.buildStopHelpView)(), parsed.options);
                    return;
                }
                await runStop(parsed, config, paths);
                break;
            case 'help':
            case undefined:
                await runHelp(parsed, config, paths);
                break;
            default: {
                await emitView((0, common_1.buildErrorView)('Unknown command', `Unknown command: ${parsed.command}`), parsed.options, { stream: process.stderr });
                await runHelp(parsed, config, paths);
                process.exitCode = 1;
                break;
            }
        }
        const runtimeWarnings = (0, session_helpers_1.getRuntimeWarnings)();
        if (runtimeWarnings.length) {
            const envelope = (0, common_1.buildWarningView)('Runtime warnings', runtimeWarnings);
            await emitView(envelope, parsed.options);
            (0, session_helpers_1.clearRuntimeWarnings)();
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await emitEmergencyError(message);
        process.exitCode = 1;
    }
}
async function emitView(envelope, options, opts = {}) {
    const style = 'genie';
    const styledEnvelope = { ...envelope, style };
    await (0, view_1.renderEnvelope)(styledEnvelope, {
        json: opts.forceJson ?? false,
        stream: opts.stream,
        style
    });
}
async function emitEmergencyError(message) {
    const envelope = (0, common_1.buildErrorView)('Fatal error', message);
    await (0, view_1.renderEnvelope)(envelope, { json: false, stream: process.stderr });
}
async function maybeHandleBackgroundLaunch(params) {
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
    (0, session_store_1.saveSessions)(paths, store);
    // Print directly to stdout instead of using Ink for background
    process.stdout.write(`▸ Launching ${agentName} in background...\n`);
    process.stdout.write(`▸ Waiting for session ID...\n`);
    // Poll for session ID (up to 20 seconds)
    const pollStart = Date.now();
    const pollTimeout = 20000; // 20 seconds
    const pollInterval = 500; // Check every 500ms
    while (Date.now() - pollStart < pollTimeout) {
        await sleep(pollInterval);
        const liveStore = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
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
    // Timeout - show pending with helpful commands
    process.stdout.write(`▸ Session started but ID not available yet (timeout after 20s)\n\n`);
    process.stdout.write(`  List sessions to find ID:\n`);
    process.stdout.write(`    ./genie list sessions\n\n`);
    process.stdout.write(`  Then view output:\n`);
    process.stdout.write(`    ./genie view <sessionId>\n`);
    return true;
}
async function runChat(parsed, config, paths) {
    const [agentName, ...promptParts] = parsed.commandArgs;
    if (!agentName) {
        throw new Error('Usage: genie run <agent> "<prompt>"');
    }
    const prompt = promptParts.join(' ').trim();
    const resolvedAgentName = (0, agent_resolver_1.resolveAgentIdentifier)(agentName);
    const agentSpec = (0, agent_resolver_1.loadAgentSpec)(resolvedAgentName);
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
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
    const startTime = (0, utils_1.deriveStartTime)();
    const logFile = (0, utils_1.deriveLogFile)(resolvedAgentName, startTime, paths);
    const entry = {
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
    (0, session_store_1.saveSessions)(paths, store);
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
    const agentPath = path_1.default.join('.genie', 'agents', `${resolvedAgentName}.md`);
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
function resolveExecutorKey(config, modeName) {
    const modes = config.executionModes || config.presets || {};
    const mode = modes[modeName];
    if (mode && mode.executor)
        return mode.executor;
    if (config.defaults && config.defaults.executor)
        return config.defaults.executor;
    return executors_1.DEFAULT_EXECUTOR_KEY;
}
function requireExecutor(key) {
    const executor = EXECUTORS[key];
    if (!executor) {
        const available = Object.keys(EXECUTORS).join(', ') || 'none';
        throw new Error(`Executor '${key}' not found. Available executors: ${available}`);
    }
    return executor;
}
function buildExecutorConfig(config, modeName, executorKey, agentOverrides) {
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
function resolveExecutorPaths(paths, executorKey) {
    if (!paths.executors)
        return {};
    return paths.executors[executorKey] || {};
}
function getExecutorOverrides(mode, executorKey) {
    if (!mode || !mode.overrides)
        return {};
    const { overrides } = mode;
    if (overrides.executors && overrides.executors[executorKey]) {
        return overrides.executors[executorKey];
    }
    if (overrides[executorKey]) {
        return overrides[executorKey];
    }
    return overrides;
}
function extractExecutorOverrides(agentGenie, executorKey) {
    if (!agentGenie || typeof agentGenie !== 'object')
        return {};
    const { executor, background: _background, preset: _preset, mode: _mode, executionMode: _executionMode, json: _json, ...rest } = agentGenie;
    const overrides = {};
    const executorDef = EXECUTORS[executorKey]?.defaults;
    const topLevelKeys = executorDef ? new Set(Object.keys(executorDef)) : null;
    Object.entries(rest || {}).forEach(([key, value]) => {
        if (key === 'json')
            return;
        if (key === 'exec' || key === 'resume') {
            overrides[key] = mergeDeep(overrides[key], deepClone(value));
            return;
        }
        if (topLevelKeys && topLevelKeys.has(key)) {
            overrides[key] = mergeDeep(overrides[key], deepClone(value));
            return;
        }
        if (!overrides.exec)
            overrides.exec = {};
        overrides.exec[key] = mergeDeep(overrides.exec[key], deepClone(value));
    });
    return overrides;
}
function deepClone(input) {
    return JSON.parse(JSON.stringify(input));
}
function mergeDeep(target, source) {
    if (source === null || source === undefined)
        return target;
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
function executeRun(args) {
    const { agentName, command, executorKey, executor, executorConfig, executorPaths, store, entry, paths, config, startTime, logFile, background, runnerPid, cliOptions, executionMode } = args;
    if (!command || typeof command.command !== 'string' || !Array.isArray(command.args)) {
        throw new Error(`Executor '${executorKey}' returned an invalid command configuration.`);
    }
    const logDir = path_1.default.dirname(logFile);
    if (!fs_1.default.existsSync(logDir)) {
        fs_1.default.mkdirSync(logDir, { recursive: true });
    }
    const logStream = fs_1.default.createWriteStream(logFile, { flags: 'a' });
    const spawnOptions = {
        stdio: ['ignore', 'pipe', 'pipe'],
        ...(command.spawnOptions || {})
    };
    const proc = (0, child_process_1.spawn)(command.command, command.args, spawnOptions);
    entry.status = 'running';
    entry.executorPid = proc.pid || null;
    if (runnerPid)
        entry.runnerPid = runnerPid;
    (0, session_store_1.saveSessions)(paths, store);
    let filteredStdout = null;
    if (proc.stdout) {
        if (executor.createOutputFilter) {
            filteredStdout = executor.createOutputFilter(logStream);
            proc.stdout.pipe(filteredStdout);
        }
        else {
            proc.stdout.pipe(logStream);
        }
    }
    if (proc.stderr)
        proc.stderr.pipe(logStream);
    const updateSessionFromLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{'))
            return;
        try {
            const data = JSON.parse(trimmed);
            if (data && typeof data === 'object' && data.type === 'session.created') {
                const sessionId = data.session_id || data.sessionId;
                if (sessionId) {
                    if (entry.sessionId !== sessionId) {
                        entry.sessionId = sessionId;
                        entry.lastUsed = new Date().toISOString();
                        (0, session_store_1.saveSessions)(paths, store);
                    }
                }
            }
        }
        catch {
            // ignore malformed JSON lines
        }
    };
    if (proc.stdout) {
        let buffer = '';
        proc.stdout.on('data', (chunk) => {
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
        if (filteredStdout) {
            // Filter is active, pipe filtered output to console
            filteredStdout.pipe(process.stdout);
        }
        else if (proc.stdout) {
            // No filter, pipe directly
            proc.stdout.pipe(process.stdout);
        }
        if (proc.stderr)
            proc.stderr.pipe(process.stderr);
    }
    let settled = false;
    let resolvePromise = () => { };
    const settle = () => {
        if (!settled) {
            settled = true;
            logStream.end();
            resolvePromise();
        }
    };
    const promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });
    proc.on('error', (error) => {
        entry.status = 'failed';
        entry.error = error instanceof Error ? error.message : String(error);
        entry.lastUsed = new Date().toISOString();
        (0, session_store_1.saveSessions)(paths, store);
        const message = error instanceof Error ? error.message : String(error);
        if (!background) {
            const envelope = (0, background_1.buildRunCompletionView)({
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
        }
        else {
            settle();
        }
    });
    proc.on('exit', (code, signal) => {
        if (settled)
            return;
        const finishedAt = new Date().toISOString();
        entry.lastUsed = finishedAt;
        entry.exitCode = code;
        entry.signal = signal;
        entry.status = code === 0 ? 'completed' : 'failed';
        (0, session_store_1.saveSessions)(paths, store);
        logStream.end();
        const logViewer = executor.logViewer;
        const sessionFromLog = logViewer?.readSessionIdFromLog?.(logFile) ?? null;
        const resolvedSessionId = sessionFromLog || entry.sessionId || null;
        if (entry.sessionId !== resolvedSessionId) {
            entry.sessionId = resolvedSessionId;
            entry.lastUsed = new Date().toISOString();
            (0, session_store_1.saveSessions)(paths, store);
        }
        if (!background) {
            const outcome = code === 0 ? 'success' : 'failure';
            const notes = signal ? [`Signal: ${signal}`] : [];
            const envelope = (0, background_1.buildRunCompletionView)({
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
        }
        else {
            settle();
        }
    });
    const defaultDelay = (config.background && config.background.sessionExtractionDelayMs) || 5000;
    const sessionDelay = executor.getSessionExtractionDelay
        ? executor.getSessionExtractionDelay({ config: executorConfig, defaultDelay })
        : defaultDelay;
    if (executor.extractSessionId) {
        // Retry extractSessionId with exponential intervals: 5s, 7s, 10s, 13s
        const retryIntervals = [sessionDelay, 2000, 3000, 3000];
        let retryIndex = 0;
        const attemptExtraction = () => {
            if (entry.sessionId)
                return;
            const sessionId = executor.extractSessionId?.({
                startTime,
                config: executorConfig,
                paths: executorPaths
            }) || null;
            if (sessionId) {
                entry.sessionId = sessionId;
                entry.lastUsed = new Date().toISOString();
                (0, session_store_1.saveSessions)(paths, store);
            }
            else if (retryIndex < retryIntervals.length) {
                setTimeout(attemptExtraction, retryIntervals[retryIndex]);
                retryIndex++;
            }
        };
        setTimeout(attemptExtraction, retryIntervals[retryIndex++]);
    }
    return promise;
}
async function runContinue(parsed, config, paths) {
    // Help is handled in the main switch statement
    const cmdArgs = parsed.commandArgs;
    if (cmdArgs.length < 2) {
        throw new Error('Usage: genie resume <sessionId> "<prompt>"');
    }
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
    const sessionIdArg = cmdArgs[0];
    const prompt = cmdArgs.slice(1).join(' ').trim();
    const found = (0, session_helpers_1.findSessionEntry)(store, sessionIdArg, paths);
    if (!found) {
        // Check if session file exists but is orphaned
        const executorKey = config.defaults?.executor || executors_1.DEFAULT_EXECUTOR_KEY;
        const executor = requireExecutor(executorKey);
        if (executor.tryLocateSessionFileBySessionId && executor.resolvePaths) {
            const executorConfig = config.executors?.[executorKey] || {};
            const executorPaths = executor.resolvePaths({
                config: executorConfig,
                baseDir: paths.baseDir,
                resolvePath: (target, base) => path_1.default.isAbsolute(target) ? target : path_1.default.resolve(base || paths.baseDir || '.', target)
            });
            const sessionsDir = executorPaths.sessionsDir;
            if (sessionsDir) {
                const sessionFilePath = executor.tryLocateSessionFileBySessionId(sessionIdArg, sessionsDir);
                if (sessionFilePath && fs_1.default.existsSync(sessionFilePath)) {
                    throw new Error(`❌ Session '${sessionIdArg}' is not tracked in CLI state.\n\n` +
                        `Session file exists at:\n  ${sessionFilePath}\n\n` +
                        `This session cannot be resumed because CLI tracking information is missing.\n` +
                        `This may happen if sessions.json was corrupted or deleted.\n\n` +
                        `Options:\n` +
                        `  1. View the session: ./genie view ${sessionIdArg}\n` +
                        `  2. Start a new session: ./genie run <agent> "<prompt>"\n` +
                        `  3. (Advanced) Manually restore sessions.json entry`);
                }
            }
        }
        throw new Error(`❌ No run found with session id '${sessionIdArg}'`);
    }
    const { agentName, entry: session } = found;
    if (!session || !session.sessionId) {
        throw new Error(`❌ No active session for agent '${agentName}'`);
    }
    const agentSpec = (0, agent_resolver_1.loadAgentSpec)(agentName);
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
    const startTime = (0, utils_1.deriveStartTime)();
    const logFile = (0, utils_1.deriveLogFile)(agentName, startTime, paths);
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
    (0, session_store_1.saveSessions)(paths, store);
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
async function runRuns(parsed, config, paths) {
    const warnings = [];
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG, { onWarning: (message) => warnings.push(message) });
    const entries = Object.entries(store.agents || {});
    const rows = entries.map(([agent, entry]) => {
        const iso = entry.lastUsed ? (0, utils_1.safeIsoString)(entry.lastUsed) : entry.created ? (0, utils_1.safeIsoString)(entry.created) : null;
        return {
            agent,
            status: (0, session_helpers_1.resolveDisplayStatus)(entry),
            sessionId: entry.sessionId || null,
            updated: iso ? (0, utils_1.formatRelativeTime)(iso) : 'n/a',
            updatedIso: iso,
            log: entry.logFile ? (0, utils_1.formatPathRelative)(entry.logFile, paths.baseDir || '.') : null
        };
    });
    const isActive = (row) => {
        const normalized = (row.status || '').toLowerCase();
        return normalized.startsWith('running') || normalized.startsWith('pending');
    };
    const sortByUpdated = (a, b) => {
        const aTime = a.updatedIso ? new Date(a.updatedIso).getTime() : 0;
        const bTime = b.updatedIso ? new Date(b.updatedIso).getTime() : 0;
        return bTime - aTime;
    };
    const active = rows.filter(isActive).sort(sortByUpdated);
    const recent = rows.filter((row) => !isActive(row)).sort(sortByUpdated).slice(0, 10);
    const envelope = (0, runs_1.buildRunsOverviewView)({
        active,
        recent,
        warnings: warnings.length ? warnings : undefined
    });
    await emitView(envelope, parsed.options);
}
async function runList(parsed, config, paths) {
    const [targetRaw] = parsed.commandArgs;
    // Show help if no subcommand provided
    if (!targetRaw) {
        await emitView((0, help_1.buildListHelpView)(), parsed.options);
        return;
    }
    const target = targetRaw.toLowerCase();
    if (target === 'agents') {
        await emitAgentCatalog(parsed, config, paths);
        return;
    }
    if (target === 'sessions') {
        await runRuns(parsed, config, paths);
        return;
    }
    await emitView((0, common_1.buildErrorView)('Unknown list target', `Unknown list target '${targetRaw}'. Try 'agents' or 'sessions'.`), parsed.options, { stream: process.stderr });
    process.exitCode = 1;
}
async function runView(parsed, config, paths) {
    const [sessionId] = parsed.commandArgs;
    if (!sessionId) {
        await emitView((0, common_1.buildInfoView)('View usage', ['Usage: genie view <sessionId> [--full]']), parsed.options);
        return;
    }
    const warnings = [];
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG, { onWarning: (message) => warnings.push(message) });
    // Try sessions.json first
    let found = (0, session_helpers_1.findSessionEntry)(store, sessionId, paths);
    let orphanedSession = false;
    // If not found in sessions.json, try direct session file lookup
    if (!found) {
        const executorKey = config.defaults?.executor || executors_1.DEFAULT_EXECUTOR_KEY;
        const executor = requireExecutor(executorKey);
        if (executor.tryLocateSessionFileBySessionId && executor.resolvePaths) {
            const executorConfig = config.executors?.[executorKey] || {};
            const executorPaths = executor.resolvePaths({
                config: executorConfig,
                baseDir: paths.baseDir,
                resolvePath: (target, base) => path_1.default.isAbsolute(target) ? target : path_1.default.resolve(base || paths.baseDir || '.', target)
            });
            const sessionsDir = executorPaths.sessionsDir;
            if (sessionsDir) {
                const sessionFilePath = executor.tryLocateSessionFileBySessionId(sessionId, sessionsDir);
                if (sessionFilePath && fs_1.default.existsSync(sessionFilePath)) {
                    orphanedSession = true;
                    warnings.push('⚠️  Session not tracked in CLI state. Displaying from session file.');
                    // Read session file directly
                    const sessionFileContent = fs_1.default.readFileSync(sessionFilePath, 'utf8');
                    const jsonl = [];
                    const sourceLines = sessionFileContent.split(/\r?\n/);
                    for (const line of sourceLines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('{'))
                            continue;
                        try {
                            jsonl.push(JSON.parse(trimmed));
                        }
                        catch { /* skip */ }
                    }
                    const transcript = (0, transcript_utils_1.buildTranscriptFromEvents)(jsonl);
                    // Display transcript for orphaned session
                    const displayTranscript = parsed.options.full
                        ? transcript
                        : parsed.options.live
                            ? (0, transcript_utils_1.sliceForLatest)(transcript)
                            : (0, transcript_utils_1.sliceForRecent)(transcript);
                    const metaItems = [
                        { label: 'Source', value: 'Orphaned session file', tone: 'warning' },
                        { label: 'Session file', value: sessionFilePath }
                    ];
                    const envelope = (0, chat_1.buildChatView)({
                        agent: 'unknown',
                        sessionId: sessionId,
                        status: null,
                        messages: displayTranscript,
                        meta: metaItems,
                        showFull: Boolean(parsed.options.full),
                        hint: !parsed.options.full && transcript.length > displayTranscript.length
                            ? parsed.options.live
                                ? 'Add --full to replay the entire session or remove --live to see more messages.'
                                : 'Add --full to replay the entire session.'
                            : undefined
                    });
                    await emitView(envelope, parsed.options);
                    if (warnings.length) {
                        await emitView((0, common_1.buildWarningView)('Session warnings', warnings), parsed.options);
                    }
                    return;
                }
            }
        }
        // Truly not found
        await emitView((0, common_1.buildErrorView)('Run not found', `No run found with session id '${sessionId}'`), parsed.options, { stream: process.stderr });
        return;
    }
    const { entry } = found;
    const executorKey = entry.executor || config.defaults?.executor || executors_1.DEFAULT_EXECUTOR_KEY;
    const executor = requireExecutor(executorKey);
    const logViewer = executor.logViewer;
    const logFile = entry.logFile;
    if (!logFile || !fs_1.default.existsSync(logFile)) {
        await emitView((0, common_1.buildErrorView)('Log missing', '❌ Log not found for this run'), parsed.options, { stream: process.stderr });
        return;
    }
    const raw = fs_1.default.readFileSync(logFile, 'utf8');
    const allLines = raw.split(/\r?\n/);
    if (!entry.sessionId && logViewer?.extractSessionIdFromContent) {
        const sessionFromLog = logViewer.extractSessionIdFromContent(allLines);
        if (sessionFromLog) {
            entry.sessionId = sessionFromLog;
            (0, session_store_1.saveSessions)(paths, store);
        }
    }
    // Try to locate and read from codex session file for full conversation history
    let sessionFileContent = null;
    if (entry.sessionId && entry.startTime && executor.locateSessionFile) {
        const executorConfig = config.executors?.[executorKey] || {};
        const executorPaths = executor.resolvePaths({
            config: executorConfig,
            baseDir: paths.baseDir,
            resolvePath: (target, base) => path_1.default.isAbsolute(target) ? target : path_1.default.resolve(base || paths.baseDir || '.', target)
        });
        const sessionsDir = executorPaths.sessionsDir;
        const startTime = new Date(entry.startTime).getTime();
        if (sessionsDir && !Number.isNaN(startTime)) {
            const sessionFilePath = executor.locateSessionFile({
                sessionId: entry.sessionId,
                startTime,
                sessionsDir
            });
            if (sessionFilePath && fs_1.default.existsSync(sessionFilePath)) {
                try {
                    sessionFileContent = fs_1.default.readFileSync(sessionFilePath, 'utf8');
                }
                catch {
                    // Fall back to CLI log if session file read fails
                }
            }
        }
    }
    // Parse JSONL events from session file or CLI log
    const jsonl = [];
    const sourceLines = sessionFileContent ? sessionFileContent.split(/\r?\n/) : allLines;
    // Detect format: filtered or JSONL
    let hasFilteredFormat = false;
    for (const line of sourceLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[assistant]') || trimmed.startsWith('[tool]') ||
            trimmed.startsWith('[reasoning]') || trimmed.startsWith('[command]') ||
            trimmed.startsWith('[tool_result]')) {
            hasFilteredFormat = true;
            break;
        }
    }
    if (hasFilteredFormat) {
        // Parse filtered format blocks
        let currentBlock = null;
        for (const line of sourceLines) {
            const trimmed = line.trim();
            // Check for JSON events (system, result)
            if (trimmed.startsWith('{')) {
                try {
                    const event = JSON.parse(trimmed);
                    if (event.type === 'system' || event.type === 'result') {
                        jsonl.push(event);
                    }
                }
                catch { /* skip */ }
                continue;
            }
            // Check for block markers
            if (trimmed.startsWith('[assistant]')) {
                if (currentBlock) {
                    jsonl.push(createFilteredEvent(currentBlock.type, currentBlock.content));
                }
                currentBlock = { type: 'assistant', content: [] };
                const contentAfterMarker = trimmed.substring('[assistant]'.length).trim();
                if (contentAfterMarker) {
                    currentBlock.content.push(contentAfterMarker);
                }
            }
            else if (trimmed.startsWith('[tool]')) {
                if (currentBlock) {
                    jsonl.push(createFilteredEvent(currentBlock.type, currentBlock.content));
                }
                currentBlock = { type: 'tool', content: [] };
                const contentAfterMarker = trimmed.substring('[tool]'.length).trim();
                if (contentAfterMarker) {
                    currentBlock.content.push(contentAfterMarker);
                }
            }
            else if (trimmed.startsWith('[reasoning]')) {
                if (currentBlock) {
                    jsonl.push(createFilteredEvent(currentBlock.type, currentBlock.content));
                }
                currentBlock = { type: 'reasoning', content: [] };
                const contentAfterMarker = trimmed.substring('[reasoning]'.length).trim();
                if (contentAfterMarker) {
                    currentBlock.content.push(contentAfterMarker);
                }
            }
            else if (trimmed.startsWith('[command]')) {
                if (currentBlock) {
                    jsonl.push(createFilteredEvent(currentBlock.type, currentBlock.content));
                }
                currentBlock = { type: 'command', content: [] };
                const contentAfterMarker = trimmed.substring('[command]'.length).trim();
                if (contentAfterMarker) {
                    currentBlock.content.push(contentAfterMarker);
                }
            }
            else if (trimmed.startsWith('[tool_result]')) {
                if (currentBlock) {
                    jsonl.push(createFilteredEvent(currentBlock.type, currentBlock.content));
                }
                currentBlock = { type: 'tool_result', content: [] };
                const contentAfterMarker = trimmed.substring('[tool_result]'.length).trim();
                if (contentAfterMarker) {
                    currentBlock.content.push(contentAfterMarker);
                }
            }
            else if (trimmed && currentBlock) {
                // Continuation of current block
                currentBlock.content.push(line);
            }
            else if (!trimmed && currentBlock) {
                // Empty line within block
                currentBlock.content.push('');
            }
        }
        // Push final block
        if (currentBlock) {
            jsonl.push(createFilteredEvent(currentBlock.type, currentBlock.content));
        }
    }
    else {
        // Parse standard JSONL format
        for (const line of sourceLines) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            if (!trimmed.startsWith('{'))
                continue;
            try {
                jsonl.push(JSON.parse(trimmed));
            }
            catch { /* skip */ }
        }
    }
    // Helper function to convert filtered blocks to Claude JSONL format
    function createFilteredEvent(type, content) {
        const text = content.join('\n').trim();
        if (type === 'assistant') {
            return {
                type: 'assistant',
                message: {
                    content: [{ type: 'text', text }]
                }
            };
        }
        else if (type === 'reasoning') {
            return {
                type: 'reasoning',
                message: {
                    content: [{ type: 'text', text }]
                }
            };
        }
        else if (type === 'tool') {
            // Tool calls are shown as assistant messages with tool info
            return {
                type: 'assistant',
                message: {
                    content: [{ type: 'text', text: `[Tool Call]\n${text}` }]
                }
            };
        }
        else if (type === 'tool_result') {
            return {
                type: 'user',
                message: {
                    content: [{ type: 'text', text: `[Tool Result]\n${text}` }]
                }
            };
        }
        else if (type === 'command') {
            return {
                type: 'user',
                message: {
                    content: [{ type: 'text', text: `[Command]\n${text}` }]
                }
            };
        }
        return {
            type: 'assistant',
            message: {
                content: [{ type: 'text', text }]
            }
        };
    }
    // Use executor-specific log viewer if available
    if (logViewer?.buildJsonlView) {
        const style = 'genie';
        const envelope = logViewer.buildJsonlView({
            render: {
                entry,
                jsonl,
                raw
            },
            parsed,
            paths,
            store,
            save: session_store_1.saveSessions,
            formatPathRelative: utils_1.formatPathRelative,
            style
        });
        await emitView(envelope, parsed.options);
        if (warnings.length) {
            await emitView((0, common_1.buildWarningView)('Session warnings', warnings), parsed.options);
        }
        return;
    }
    // Fallback to generic transcript view
    const transcript = (0, transcript_utils_1.buildTranscriptFromEvents)(jsonl);
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
            ? (0, transcript_utils_1.sliceForLatest)(transcript)
            : (0, transcript_utils_1.sliceForRecent)(transcript);
    const metaItems = [];
    if (entry.executor)
        metaItems.push({ label: 'Executor', value: String(entry.executor) });
    const executionMode = entry.mode || entry.preset;
    if (executionMode)
        metaItems.push({ label: 'Execution mode', value: String(executionMode) });
    if (entry.background !== undefined) {
        metaItems.push({ label: 'Background', value: entry.background ? 'detached' : 'attached' });
    }
    const envelope = (0, chat_1.buildChatView)({
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
        await emitView((0, common_1.buildWarningView)('Session warnings', warnings), parsed.options);
    }
}
async function runStop(parsed, config, paths) {
    const [target] = parsed.commandArgs;
    if (!target) {
        throw new Error('Usage: genie stop <sessionId>');
    }
    const warnings = [];
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG, { onWarning: (message) => warnings.push(message) });
    const found = (0, session_helpers_1.findSessionEntry)(store, target, paths);
    const events = [];
    let summary = '';
    const appendWarningView = async () => {
        if (warnings.length) {
            await emitView((0, common_1.buildWarningView)('Session warnings', warnings), parsed.options);
        }
    };
    if (!found) {
        events.push({ label: target, status: 'failed', message: 'Session id not found' });
        summary = `No run found with session id '${target}'.`;
        const envelope = (0, stop_1.buildStopView)({ target, events, summary });
        await emitView(envelope, parsed.options);
        await appendWarningView();
        return;
    }
    const { agentName, entry } = found;
    const identifier = entry.sessionId || agentName;
    const alivePids = [entry.runnerPid, entry.executorPid].filter((pid) => backgroundManager.isAlive(pid));
    if (!alivePids.length) {
        events.push({ label: identifier, detail: 'No active process', status: 'pending' });
        summary = `No active process found for ${identifier}.`;
    }
    else {
        alivePids.forEach((pid) => {
            try {
                const ok = backgroundManager.stop(pid);
                if (ok !== false) {
                    events.push({ label: `${identifier}`, detail: `PID ${pid} stopped`, status: 'done' });
                }
                else {
                    events.push({ label: `${identifier}`, detail: `PID ${pid} not running`, status: 'failed' });
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                events.push({ label: `${identifier}`, detail: `PID ${pid}`, status: 'failed', message });
            }
        });
        summary = `Stop signal handled for ${identifier}`;
        entry.status = 'stopped';
        entry.lastUsed = new Date().toISOString();
        entry.signal = entry.signal || 'SIGTERM';
        if (entry.exitCode === undefined)
            entry.exitCode = null;
        (0, session_store_1.saveSessions)(paths, store);
    }
    const envelope = (0, stop_1.buildStopView)({ target, events, summary });
    await emitView(envelope, parsed.options);
    await appendWarningView();
}
function buildBackgroundActions(sessionId, options) {
    if (!sessionId) {
        const lines = [
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
    const lines = [`• View: genie view ${sessionId}`];
    if (options.resume) {
        lines.push(`• Resume: genie resume ${sessionId} "<prompt>"`);
    }
    if (options.includeStop) {
        lines.push(`• Stop: genie stop ${sessionId}`);
    }
    return lines;
}
async function resolveSessionIdForBanner(agentName, config, paths, current, logFile, onProgress, timeoutMs = null, intervalMs = 250) {
    if (current)
        return current;
    const startedAt = Date.now();
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;
    while (true) {
        const elapsed = Date.now() - startedAt;
        if (timeoutMs !== null && elapsed >= timeoutMs) {
            return current ?? null;
        }
        try {
            const liveStore = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
            const agentEntry = liveStore.agents?.[agentName];
            if (agentEntry?.sessionId) {
                return agentEntry.sessionId;
            }
            if (onProgress) {
                const frame = frames[frameIndex++ % frames.length];
                onProgress(frame).catch(() => { }); // Fire and forget - don't block polling
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            (0, session_helpers_1.recordRuntimeWarning)(`[genie] Failed to refresh session id for banner: ${message}`);
            if (timeoutMs === null) {
                await sleep(intervalMs);
                continue;
            }
            return current ?? null;
        }
        await sleep(intervalMs);
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function runHelp(parsed, config, paths) {
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
    const envelope = (0, help_1.buildHelpView)({
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
async function emitAgentCatalog(parsed, _config, _paths) {
    const agents = (0, agent_resolver_1.listAgents)();
    const summarize = (entry) => {
        const description = (entry.meta?.description || entry.meta?.summary || '').replace(/\s+/g, ' ').trim();
        return (0, utils_1.truncateText)(description || '—', 96);
    };
    const grouped = new Map();
    agents.forEach((entry) => {
        const folder = entry.folder ?? '.';
        if (!grouped.has(folder))
            grouped.set(folder, []);
        grouped.get(folder).push(entry);
    });
    const orderedFolders = Array.from(grouped.keys()).sort((a, b) => {
        if (a === '.')
            return -1;
        if (b === '.')
            return 1;
        return a.localeCompare(b);
    });
    const groups = orderedFolders.map((folder) => ({
        label: folder === '.' ? 'root' : folder,
        rows: grouped
            .get(folder)
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((entry) => ({ id: entry.id, summary: summarize(entry) }))
    }));
    const envelope = (0, agent_catalog_1.buildAgentCatalogView)({
        total: agents.length,
        groups
    });
    await emitView(envelope, parsed.options);
}

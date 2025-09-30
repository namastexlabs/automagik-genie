"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractExecutorOverrides = exports.resolveExecutorPaths = exports.buildExecutorConfig = exports.requireExecutor = exports.resolveExecutorKey = exports.executeRun = exports.maybeHandleBackgroundLaunch = exports.runChat = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const agent_resolver_1 = require("../lib/agent-resolver");
const utils_1 = require("../lib/utils");
const session_store_1 = require("../session-store");
const background_manager_instance_1 = require("../lib/background-manager-instance");
const async_1 = require("../lib/async");
const config_defaults_1 = require("../lib/config-defaults");
const view_helpers_1 = require("../lib/view-helpers");
const background_1 = require("../views/background");
const executor_registry_1 = require("../lib/executor-registry");
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
    const store = (0, session_store_1.loadSessions)(paths, config, config_defaults_1.DEFAULT_CONFIG);
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
exports.runChat = runChat;
async function maybeHandleBackgroundLaunch(params) {
    const { parsed, config, paths, store, entry, agentName, executorKey, executionMode, startTime, logFile, allowResume } = params;
    if (!parsed.options.background || parsed.options.backgroundRunner) {
        return false;
    }
    const runnerPid = background_manager_instance_1.backgroundManager.launch({
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
    process.stdout.write(`▸ Launching ${agentName} in background...\n`);
    process.stdout.write(`▸ Waiting for session ID...\n`);
    const pollStart = Date.now();
    const pollTimeout = 20000;
    const pollInterval = 500;
    while (Date.now() - pollStart < pollTimeout) {
        await (0, async_1.sleep)(pollInterval);
        const liveStore = (0, session_store_1.loadSessions)(paths, config, config_defaults_1.DEFAULT_CONFIG);
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
exports.maybeHandleBackgroundLaunch = maybeHandleBackgroundLaunch;
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
            filteredStdout.pipe(process.stdout);
        }
        else if (proc.stdout) {
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
            void (0, view_helpers_1.emitView)(envelope, cliOptions, { stream: process.stderr }).finally(settle);
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
            void (0, view_helpers_1.emitView)(envelope, cliOptions).finally(settle);
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
exports.executeRun = executeRun;
function resolveExecutorKey(config, modeName) {
    const modes = config.executionModes || config.presets || {};
    const mode = modes[modeName];
    if (mode && mode.executor)
        return mode.executor;
    if (config.defaults && config.defaults.executor)
        return config.defaults.executor;
    return executor_registry_1.DEFAULT_EXECUTOR_KEY;
}
exports.resolveExecutorKey = resolveExecutorKey;
function requireExecutor(key) {
    const executor = executor_registry_1.EXECUTORS[key];
    if (!executor) {
        const available = Object.keys(executor_registry_1.EXECUTORS).join(', ') || 'none';
        throw new Error(`Executor '${key}' not found. Available executors: ${available}`);
    }
    return executor;
}
exports.requireExecutor = requireExecutor;
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
exports.buildExecutorConfig = buildExecutorConfig;
function resolveExecutorPaths(paths, executorKey) {
    if (!paths.executors)
        return {};
    return paths.executors[executorKey] || {};
}
exports.resolveExecutorPaths = resolveExecutorPaths;
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
    const executorDef = executor_registry_1.EXECUTORS[executorKey]?.defaults;
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
exports.extractExecutorOverrides = extractExecutorOverrides;
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

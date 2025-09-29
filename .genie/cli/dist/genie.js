#!/usr/bin/env node
"use strict";
/**
 * GENIE Agent CLI - Codex exec orchestration with configurable presets
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const executors_1 = require("./executors");
const view_1 = require("./view");
const help_1 = require("./views/help");
const agent_catalog_1 = require("./views/agent-catalog");
const runs_1 = require("./views/runs");
const background_1 = require("./views/background");
const stop_1 = require("./views/stop");
const common_1 = require("./views/common");
const chat_1 = require("./views/chat");
const background_manager_1 = __importStar(require("./background-manager"));
const session_store_1 = require("./session-store");
let YAML = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    YAML = require('yaml');
}
catch (_) {
    // yaml module optional
}
const EXECUTORS = (0, executors_1.loadExecutors)();
if (!EXECUTORS[executors_1.DEFAULT_EXECUTOR_KEY]) {
    const available = Object.keys(EXECUTORS).join(', ') || 'none';
    throw new Error(`Default executor '${executors_1.DEFAULT_EXECUTOR_KEY}' not found. Available executors: ${available}`);
}
const SCRIPT_DIR = path_1.default.dirname(__filename);
const CONFIG_PATH = path_1.default.join(SCRIPT_DIR, 'config.yaml');
const backgroundManager = new background_manager_1.default();
const startupWarnings = [];
const runtimeWarnings = [];
function recordStartupWarning(message) {
    startupWarnings.push(message);
}
function recordRuntimeWarning(message) {
    runtimeWarnings.push(message);
}
const BASE_CONFIG = {
    defaults: {
        preset: 'default',
        background: true,
        executor: executors_1.DEFAULT_EXECUTOR_KEY
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
            executor: executors_1.DEFAULT_EXECUTOR_KEY,
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
const DEFAULT_CONFIG = buildDefaultConfig();
void main();
async function main() {
    try {
        const parsed = parseArguments(process.argv.slice(2));
        const envIsBackground = process.env[background_manager_1.INTERNAL_BACKGROUND_ENV] === '1';
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
            case 'agent':
                await runAgentCommand(parsed, config, paths);
                break;
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
            case 'stop':
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
        await flushRuntimeWarnings(parsed.options);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await emitEmergencyError(message);
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
        preset: undefined,
        executor: undefined,
        requestHelp: undefined,
        full: false
    };
    const filtered = [];
    for (let i = 0; i < raw.length; i++) {
        const token = raw[i];
        if (token === '--preset') {
            if (i + 1 >= raw.length)
                throw new Error('Missing value for --preset');
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
            if (i + 1 >= raw.length)
                throw new Error('Missing value for --executor');
            options.executor = raw[++i];
            continue;
        }
        if (token === '-c' || token === '--config') {
            if (i + 1 >= raw.length)
                throw new Error('Missing value for -c/--config');
            options.configOverrides.push(raw[++i]);
            continue;
        }
        if (token === '--help' || token === '-h') {
            options.requestHelp = true;
            continue;
        }
        if (token === '--full') {
            options.full = true;
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
async function flushStartupWarnings(options) {
    if (!startupWarnings.length)
        return;
    const envelope = (0, common_1.buildWarningView)('Configuration warnings', [...startupWarnings]);
    await emitView(envelope, options);
    startupWarnings.length = 0;
}
async function flushRuntimeWarnings(options) {
    if (!runtimeWarnings.length)
        return;
    const envelope = (0, common_1.buildWarningView)('Runtime warnings', [...runtimeWarnings]);
    await emitView(envelope, options);
    runtimeWarnings.length = 0;
}
function applyDefaults(options, defaults) {
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
function loadConfig(overrides) {
    let config = deepClone(DEFAULT_CONFIG);
    let configFilePath = null;
    if (fs_1.default.existsSync(CONFIG_PATH)) {
        configFilePath = CONFIG_PATH;
    }
    if (configFilePath) {
        try {
            const file = fs_1.default.readFileSync(configFilePath, 'utf8');
            if (file.trim().length) {
                let parsed = {};
                if (YAML) {
                    parsed = YAML.parse(file) || {};
                }
                else if (file.trim().startsWith('{')) {
                    try {
                        parsed = JSON.parse(file);
                    }
                    catch {
                        parsed = {};
                    }
                }
                else {
                    try {
                        parsed = parseSimpleYaml(file);
                    }
                    catch (fallbackError) {
                        const message = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                        recordStartupWarning(`[genie] Failed to parse ${path_1.default.basename(configFilePath)} without yaml module: ${message}`);
                        parsed = {};
                    }
                }
                config = mergeDeep(config, parsed);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to parse ${configFilePath}: ${message}`);
        }
        config.__configPath = configFilePath;
    }
    else {
        config.__configPath = CONFIG_PATH;
    }
    overrides.forEach((override) => applyConfigOverride(config, override));
    return config;
}
function deepClone(input) {
    return JSON.parse(JSON.stringify(input));
}
function buildDefaultConfig() {
    const config = deepClone(BASE_CONFIG);
    config.executors = config.executors || {};
    Object.entries(EXECUTORS).forEach(([key, executor]) => {
        config.executors[key] = executor.defaults || {};
    });
    return config;
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
function applyConfigOverride(config, override) {
    const index = override.indexOf('=');
    if (index === -1) {
        throw new Error(`Invalid override '${override}'. Expected key=value.`);
    }
    const keyPath = override.slice(0, index).trim();
    const valueRaw = override.slice(index + 1).trim();
    if (!keyPath.length)
        throw new Error(`Invalid override '${override}'. Key is required.`);
    let value;
    try {
        value = JSON.parse(valueRaw);
    }
    catch {
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
        if (!line || !line.trim())
            continue;
        const hash = line.indexOf('#');
        if (hash !== -1) {
            line = line.slice(0, hash);
        }
        if (!line.trim())
            continue;
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
                }
                else {
                    parentContainer[key] = value;
                }
                stack.push({ indent: level, value });
                continue;
            }
            value = null;
        }
        else {
            value = parseYamlScalar(valueRaw);
        }
        if (Array.isArray(parentContainer)) {
            parentContainer.push(value);
        }
        else {
            parentContainer[key] = value;
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            stack.push({ indent: level, value });
        }
    }
    return root;
}
function findNextMeaningfulYamlLine(lines, start) {
    for (let i = start; i < lines.length; i += 1) {
        let line = lines[i];
        if (!line || !line.trim())
            continue;
        const hash = line.indexOf('#');
        if (hash !== -1) {
            line = line.slice(0, hash);
        }
        if (!line.trim())
            continue;
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
function parseYamlScalar(valueRaw) {
    if (!valueRaw.length)
        return null;
    if (valueRaw === 'true')
        return true;
    if (valueRaw === 'false')
        return false;
    if (valueRaw === 'null')
        return null;
    if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(valueRaw)) {
        return Number(valueRaw);
    }
    if ((valueRaw.startsWith('"') && valueRaw.endsWith('"')) || (valueRaw.startsWith('\'') && valueRaw.endsWith('\''))) {
        const unquoted = valueRaw.slice(1, -1);
        return unquoted.replace(/\"/g, '"').replace(/\\'/g, "'");
    }
    return valueRaw;
}
function resolvePaths(paths) {
    const baseDir = paths.baseDir || '.';
    return {
        baseDir,
        sessionsFile: paths.sessionsFile || path_1.default.join(baseDir, '.genie/state/agents/sessions.json'),
        logsDir: paths.logsDir || path_1.default.join(baseDir, '.genie/state/agents/logs'),
        backgroundDir: paths.backgroundDir || path_1.default.join(baseDir, '.genie/state/agents/background'),
        executors: paths.executors || {}
    };
}
function prepareDirectories(paths) {
    [paths.logsDir, paths.backgroundDir, path_1.default.dirname(paths.sessionsFile)].forEach((dir) => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    });
}
async function runChat(parsed, config, paths) {
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
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
    const startTime = deriveStartTime();
    const logFile = deriveLogFile(agentName, startTime, paths);
    const entry = {
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
    (0, session_store_1.saveSessions)(paths, store);
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
        (0, session_store_1.saveSessions)(paths, store);
        const emitStarting = async (frame) => {
            const startingView = (0, background_1.buildBackgroundStartingView)({ agentName, frame });
            await emitView(startingView, parsed.options);
        };
        const emitStatus = async (sessionId, frame) => {
            if (!sessionId) {
                const pendingView = (0, background_1.buildBackgroundPendingView)({ agentName, frame });
                await emitView(pendingView, parsed.options);
                return;
            }
            const actions = buildBackgroundActions(sessionId, { resume: true, includeStop: true });
            const statusView = (0, background_1.buildBackgroundStartView)({
                agentName,
                sessionId,
                actions
            });
            await emitView(statusView, parsed.options);
        };
        await emitStarting('⠋');
        if (entry.sessionId) {
            await emitStatus(entry.sessionId);
            return;
        }
        await emitStatus(null, '⠙');
        const resolvedSessionId = await resolveSessionIdForBanner(agentName, config, paths, entry.sessionId, logFile, async (frame) => emitStatus(null, frame));
        const finalSessionId = resolvedSessionId || entry.sessionId;
        if (finalSessionId && !entry.sessionId) {
            entry.sessionId = finalSessionId;
            entry.lastUsed = new Date().toISOString();
            (0, session_store_1.saveSessions)(paths, store);
        }
        await emitStatus(entry.sessionId ?? resolvedSessionId ?? null);
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
async function runAgentCommand(parsed, config, paths) {
    const [maybeSubcommand, ...rest] = parsed.commandArgs;
    if (parsed.options.requestHelp) {
        await emitView((0, common_1.buildInfoView)('Agent command', [
            'Usage:',
            '  genie agent list',
            '  genie agent run <agent-id> "<prompt>"',
            '  genie agent <agent-id> "<prompt>"'
        ]), parsed.options);
        return;
    }
    const sub = (maybeSubcommand || '').toLowerCase();
    if (!maybeSubcommand || sub === 'list' || sub === 'ls') {
        await emitAgentCatalog(parsed, config, paths);
        return;
    }
    if (sub === 'run' || sub === 'start' || sub === 'launch') {
        if (!rest.length) {
            throw new Error('Usage: genie agent run <agent-id> "<prompt>"');
        }
        const [agentId, ...promptParts] = rest;
        await runAgentRun(agentId, promptParts, parsed, config, paths);
        return;
    }
    if (sub === 'help') {
        await emitView((0, common_1.buildInfoView)('Agent command', [
            'Usage:',
            '  genie agent list',
            '  genie agent run <agent-id> "<prompt>"',
            '  genie agent <agent-id> "<prompt>"'
        ]), parsed.options);
        return;
    }
    await runAgentRun(maybeSubcommand, rest, parsed, config, paths);
}
async function runAgentRun(agentInput, promptParts, parsed, config, paths) {
    const agentId = resolveAgentIdentifier(agentInput);
    const prompt = promptParts.join(' ').trim();
    if (!prompt) {
        throw new Error(`Usage: genie agent run ${agentInput} "<prompt>"`);
    }
    const cloned = {
        command: 'run',
        commandArgs: [agentId, prompt],
        options: {
            ...parsed.options,
            rawArgs: [...parsed.options.rawArgs]
        }
    };
    await runChat(cloned, config, paths);
}
function resolveExecutorKey(options, config, presetName) {
    if (options.executor)
        return options.executor;
    const preset = config.presets && config.presets[presetName];
    if (preset && preset.executor)
        return preset.executor;
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
function buildExecutorConfig(config, presetName, executorKey, agentOverrides) {
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
function resolveExecutorPaths(paths, executorKey) {
    if (!paths.executors)
        return {};
    return paths.executors[executorKey] || {};
}
function getExecutorOverrides(preset, executorKey) {
    if (!preset || !preset.overrides)
        return {};
    const { overrides } = preset;
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
    const { executor, background: _background, preset: _preset, json: _json, ...rest } = agentGenie;
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
function executeRun(args) {
    const { agentName, command, executorKey, executor, executorConfig, executorPaths, store, entry, paths, config, startTime, logFile, background, runnerPid, cliOptions } = args;
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
    if (proc.stdout)
        proc.stdout.pipe(logStream);
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
        if (proc.stdout)
            proc.stdout.pipe(process.stdout);
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
    const defaultDelay = (config.background && config.background.sessionExtractionDelayMs) || 2000;
    const sessionDelay = executor.getSessionExtractionDelay
        ? executor.getSessionExtractionDelay({ config: executorConfig, defaultDelay })
        : defaultDelay;
    if (executor.extractSessionId) {
        setTimeout(() => {
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
        }, sessionDelay);
    }
    return promise;
}
async function runMode(parsed, config, paths) {
    const [modeName, ...promptParts] = parsed.commandArgs;
    if (!modeName) {
        throw new Error('Usage: genie mode <genie-mode> "<prompt>"');
    }
    const id = modeName.startsWith('genie-') ? modeName : `genie-${modeName}`;
    const prompt = promptParts.join(' ').trim();
    const cloned = {
        command: 'run',
        commandArgs: [id, prompt],
        options: {
            ...parsed.options,
            rawArgs: [...parsed.options.rawArgs]
        }
    };
    await runChat(cloned, config, paths);
}
function loadAgentSpec(name) {
    const base = name.endsWith('.md') ? name.slice(0, -3) : name;
    const agentPath = path_1.default.join('.genie', 'agents', `${base}.md`);
    if (!fs_1.default.existsSync(agentPath)) {
        throw new Error(`❌ Agent '${name}' not found in .genie/agents`);
    }
    const content = fs_1.default.readFileSync(agentPath, 'utf8');
    const { meta, body } = extractFrontMatter(content);
    return {
        meta,
        instructions: body.replace(/^(\r?\n)+/, '')
    };
}
function extractFrontMatter(source) {
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
    }
    catch {
        try {
            const fallback = parseSimpleYaml(raw);
            return { meta: fallback || {}, body };
        }
        catch {
            return { meta: {}, body };
        }
    }
}
function deriveStartTime() {
    const fromEnv = process.env[background_manager_1.INTERNAL_START_TIME_ENV];
    if (!fromEnv)
        return Date.now();
    const parsed = Number(fromEnv);
    if (Number.isFinite(parsed))
        return parsed;
    return Date.now();
}
function sanitizeLogFilename(agentName) {
    const fallback = 'agent';
    if (!agentName || typeof agentName !== 'string')
        return fallback;
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
function deriveLogFile(agentName, startTime, paths) {
    const envPath = process.env[background_manager_1.INTERNAL_LOG_PATH_ENV];
    if (envPath)
        return envPath;
    const filename = `${sanitizeLogFilename(agentName)}-${startTime}.log`;
    return path_1.default.join(paths.logsDir || '.genie/state/agents/logs', filename);
}
function formatPathRelative(targetPath, baseDir) {
    if (!targetPath)
        return 'n/a';
    try {
        return path_1.default.relative(baseDir, targetPath) || targetPath;
    }
    catch {
        return targetPath;
    }
}
function safeIsoString(value) {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp))
        return null;
    return new Date(timestamp).toISOString();
}
function formatRelativeTime(value) {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp))
        return 'n/a';
    const diffMs = Date.now() - timestamp;
    if (diffMs < 0)
        return 'just now';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 5)
        return 'just now';
    if (seconds < 60)
        return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7)
        return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5)
        return `${weeks}w ago`;
    return new Date(value).toLocaleDateString();
}
async function runContinue(parsed, config, paths) {
    if (parsed.options.requestHelp) {
        await runHelp(parsed, config, paths);
        return;
    }
    const cmdArgs = parsed.commandArgs;
    if (cmdArgs.length < 2) {
        throw new Error('Usage: genie continue <sessionId> "<prompt>"');
    }
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
    const sessionIdArg = cmdArgs[0];
    const prompt = cmdArgs.slice(1).join(' ').trim();
    const found = findSessionEntry(store, sessionIdArg, paths);
    if (!found)
        throw new Error(`❌ No run found with session id '${sessionIdArg}'`);
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
    (0, session_store_1.saveSessions)(paths, store);
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
        (0, session_store_1.saveSessions)(paths, store);
        const emitStarting = async (frame) => {
            const startingView = (0, background_1.buildBackgroundStartingView)({ agentName, frame });
            await emitView(startingView, parsed.options);
        };
        const emitStatus = async (sessionId, frame) => {
            if (!sessionId) {
                const pendingView = (0, background_1.buildBackgroundPendingView)({ agentName, frame });
                await emitView(pendingView, parsed.options);
                return;
            }
            const actions = buildBackgroundActions(sessionId, { resume: false, includeStop: true });
            const statusView = (0, background_1.buildBackgroundStartView)({
                agentName,
                sessionId,
                actions
            });
            await emitView(statusView, parsed.options);
        };
        await emitStarting('⠋');
        if (session.sessionId) {
            await emitStatus(session.sessionId);
            return;
        }
        await emitStatus(null, '⠙');
        const resolvedSessionId = await resolveSessionIdForBanner(agentName, config, paths, session.sessionId, logFile, async (frame) => emitStatus(null, frame));
        const finalSessionId = resolvedSessionId || session.sessionId;
        if (finalSessionId && !session.sessionId) {
            session.sessionId = finalSessionId;
            session.lastUsed = new Date().toISOString();
            (0, session_store_1.saveSessions)(paths, store);
        }
        await emitStatus(session.sessionId ?? resolvedSessionId ?? null);
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
async function runRuns(parsed, config, paths) {
    const warnings = [];
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG, { onWarning: (message) => warnings.push(message) });
    const entries = Object.entries(store.agents || {});
    const rows = entries.map(([agent, entry]) => {
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
async function runView(parsed, config, paths) {
    const [sessionId] = parsed.commandArgs;
    if (!sessionId) {
        await emitView((0, common_1.buildInfoView)('View usage', ['Usage: genie view <sessionId> [--full]']), parsed.options);
        return;
    }
    const warnings = [];
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG, { onWarning: (message) => warnings.push(message) });
    const found = findSessionEntry(store, sessionId, paths);
    if (!found) {
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
    const jsonl = [];
    for (const line of allLines) {
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
    const transcript = buildTranscriptFromEvents(jsonl);
    const displayTranscript = parsed.options.full ? transcript : sliceTranscriptForLatest(transcript);
    const metaItems = [];
    if (entry.executor)
        metaItems.push({ label: 'Executor', value: String(entry.executor) });
    if (entry.preset)
        metaItems.push({ label: 'Preset', value: String(entry.preset) });
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
            ? 'Add --full to replay the entire session.'
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
    const found = findSessionEntry(store, target, paths);
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
            '• View: session pending – run `./genie list sessions` then `./genie view <sessionId>`'
        ];
        if (options.resume) {
            lines.push('• Resume: session pending – run `./genie resume <sessionId> "<prompt>"` once available');
        }
        if (options.includeStop) {
            lines.push('• Stop: session pending – run `./genie stop <sessionId>` once available');
        }
        return lines;
    }
    const lines = [`• View: ./genie view ${sessionId}`];
    if (options.resume) {
        lines.push(`• Resume: ./genie resume ${sessionId} "<prompt>"`);
    }
    if (options.includeStop) {
        lines.push(`• Stop: ./genie stop ${sessionId}`);
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
        if (timeoutMs !== null && Date.now() - startedAt >= timeoutMs) {
            return current ?? null;
        }
        try {
            const liveStore = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
            const agentEntry = liveStore.agents?.[agentName];
            if (agentEntry?.sessionId) {
                return agentEntry.sessionId;
            }
            if (logFile && fs_1.default.existsSync(logFile)) {
                const content = fs_1.default.readFileSync(logFile, 'utf8');
                const match = /"session_id"\s*:\s*"([^"]+)"/i.exec(content) || /"sessionId"\s*:\s*"([^"]+)"/i.exec(content);
                if (match) {
                    const sessionId = match[1];
                    if (agentEntry && !agentEntry.sessionId) {
                        agentEntry.sessionId = sessionId;
                        agentEntry.lastUsed = new Date().toISOString();
                        (0, session_store_1.saveSessions)(paths, liveStore);
                    }
                    else {
                        const refreshStore = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
                        const refreshEntry = refreshStore.agents?.[agentName];
                        if (refreshEntry && !refreshEntry.sessionId) {
                            refreshEntry.sessionId = sessionId;
                            refreshEntry.lastUsed = new Date().toISOString();
                            (0, session_store_1.saveSessions)(paths, refreshStore);
                        }
                    }
                    return sessionId;
                }
            }
            if (onProgress) {
                const frame = frames[frameIndex++ % frames.length];
                await onProgress(frame);
            }
        }
        catch (error) {
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
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function findSessionEntry(store, sessionId, paths) {
    if (!sessionId || typeof sessionId !== 'string')
        return null;
    const trimmed = sessionId.trim();
    if (!trimmed)
        return null;
    for (const [agentName, entry] of Object.entries(store.agents || {})) {
        if (entry && entry.sessionId === trimmed) {
            return { agentName, entry };
        }
    }
    for (const [agentName, entry] of Object.entries(store.agents || {})) {
        const logFile = entry.logFile;
        if (!logFile || !fs_1.default.existsSync(logFile))
            continue;
        try {
            const content = fs_1.default.readFileSync(logFile, 'utf8');
            const marker = new RegExp(`"session_id":"${trimmed}"`);
            if (marker.test(content)) {
                entry.sessionId = trimmed;
                entry.lastUsed = new Date().toISOString();
                (0, session_store_1.saveSessions)(paths, store);
                return { agentName, entry };
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            recordRuntimeWarning(`[genie] Failed to scan log ${logFile}: ${message}`);
        }
    }
    return null;
}
function resolveDisplayStatus(entry) {
    const baseStatus = entry.status || 'unknown';
    const executorRunning = backgroundManager.isAlive(entry.executorPid);
    const runnerRunning = backgroundManager.isAlive(entry.runnerPid);
    if (baseStatus === 'running') {
        if (executorRunning)
            return 'running';
        if (!executorRunning && runnerRunning)
            return 'pending-completion';
        if (entry.exitCode === 0)
            return 'completed';
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
async function runHelp(parsed, config, paths) {
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
        promptFramework: [
            'Discovery → load @ context, restate goals, surface blockers early.',
            'Implementation → follow wish/forge guidance with evidence-first outputs.',
            'Verification → capture validation commands, metrics, and open questions.'
        ],
        examples: [
            'genie run plan "[Discovery] mission @.genie/product/mission.md"',
            'genie view RUN-1234',
            'genie list agents'
        ]
    });
    await emitView(envelope, parsed.options);
}
function listAgents() {
    const baseDir = '.genie/agents';
    const records = [];
    if (!fs_1.default.existsSync(baseDir))
        return records;
    const visit = (dirPath, relativePath) => {
        const entries = fs_1.default.readdirSync(dirPath, { withFileTypes: true });
        entries.forEach((entry) => {
            const entryPath = path_1.default.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                visit(entryPath, relativePath ? path_1.default.join(relativePath, entry.name) : entry.name);
                return;
            }
            if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'README.md')
                return;
            const rawId = relativePath ? path_1.default.join(relativePath, entry.name) : entry.name;
            const normalizedId = rawId.replace(/\.md$/i, '').split(path_1.default.sep).join('/');
            const content = fs_1.default.readFileSync(entryPath, 'utf8');
            const { meta } = extractFrontMatter(content);
            const metaObj = meta || {};
            if (metaObj.hidden === true || metaObj.disabled === true)
                return;
            const label = (metaObj.name || normalizedId.split('/').pop() || normalizedId).trim();
            const folder = normalizedId.includes('/') ? normalizedId.split('/').slice(0, -1).join('/') : null;
            records.push({ id: normalizedId, label, meta: metaObj, folder });
        });
    };
    visit(baseDir, null);
    return records;
}
async function emitAgentCatalog(parsed, _config, _paths) {
    const agents = listAgents();
    const summarize = (entry) => {
        const description = (entry.meta?.description || entry.meta?.summary || '').replace(/\s+/g, ' ').trim();
        return truncateText(description || '—', 96);
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
function resolveAgentIdentifier(input) {
    const trimmed = (input || '').trim();
    if (!trimmed) {
        throw new Error('Agent id is required');
    }
    const normalized = trimmed.replace(/\.md$/i, '');
    const normalizedLower = normalized.toLowerCase();
    const directCandidates = [normalized, normalizedLower];
    for (const candidate of directCandidates) {
        if (agentExists(candidate))
            return candidate.replace(/\\/g, '/');
    }
    const agents = listAgents();
    const byExactId = agents.find((agent) => agent.id.toLowerCase() === normalizedLower);
    if (byExactId)
        return byExactId.id;
    const byLabel = agents.find((agent) => agent.label.toLowerCase() === normalizedLower);
    if (byLabel)
        return byLabel.id;
    const legacy = normalizedLower.replace(/^genie-/, '').replace(/^template-/, '');
    const legacyCandidates = [legacy, `core/${legacy}`, `specialized/${legacy}`];
    for (const candidate of legacyCandidates) {
        if (agentExists(candidate))
            return candidate;
    }
    if (normalizedLower === 'forge-master' && agentExists('forge'))
        return 'forge';
    throw new Error(`❌ Agent '${input}' not found. Try 'genie agent list' to see available ids.`);
}
function agentExists(id) {
    if (!id)
        return false;
    const normalized = id.replace(/\\/g, '/');
    const file = path_1.default.join('.genie', 'agents', `${normalized}.md`);
    return fs_1.default.existsSync(file);
}
function truncateText(text, maxLength = 64) {
    if (!text)
        return '';
    if (text.length <= maxLength)
        return text;
    const sliceLength = Math.max(0, maxLength - 3);
    return text.slice(0, sliceLength).trimEnd() + '...';
}
function buildTranscriptFromEvents(events) {
    const messages = [];
    const commandIndex = new Map();
    const toolIndex = new Map();
    const pushMessage = (message) => {
        messages.push({
            ...message,
            body: message.body.filter((line) => Boolean(line?.trim()))
        });
        return messages.length - 1;
    };
    events.forEach((event) => {
        if (!event || typeof event !== 'object')
            return;
        const type = String(event.type || '').toLowerCase();
        if (type === 'item.completed') {
            const item = event.item || {};
            const itemType = String(item.item_type || '').toLowerCase();
            const text = typeof item.text === 'string' ? item.text.trim() : '';
            if (!text)
                return;
            if (itemType === 'assistant_message') {
                pushMessage({ role: 'assistant', title: 'Assistant', body: [text] });
            }
            else if (itemType === 'reasoning') {
                pushMessage({ role: 'reasoning', title: 'Reasoning', body: [text] });
            }
            else if (itemType === 'tool_call') {
                const header = item.tool_name || item.tool || 'Tool call';
                const idx = pushMessage({ role: 'tool', title: header, body: [text] });
                if (item.id)
                    toolIndex.set(item.id, idx);
            }
            else if (itemType === 'tool_result') {
                const header = item.tool_name || item.tool || 'Tool result';
                const idx = item.id && toolIndex.has(item.id)
                    ? toolIndex.get(item.id)
                    : pushMessage({ role: 'tool', title: header, body: [] });
                messages[idx].body.push(text);
            }
            else {
                pushMessage({ role: 'reasoning', title: itemType || 'Item', body: [text] });
            }
            return;
        }
        const payload = event.msg || event;
        const callId = payload?.call_id || payload?.callId || null;
        switch (type) {
            case 'exec_command_begin': {
                const command = Array.isArray(payload?.command) ? payload.command.join(' ') : payload?.command || '(unknown)';
                const cwd = payload?.cwd ? `cwd: ${payload.cwd}` : null;
                const idx = pushMessage({
                    role: 'action',
                    title: 'Shell command',
                    body: [`$ ${command}`, cwd || undefined].filter(Boolean)
                });
                if (callId)
                    commandIndex.set(callId, idx);
                break;
            }
            case 'exec_command_end': {
                if (!callId || !commandIndex.has(callId))
                    break;
                const idx = commandIndex.get(callId);
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
                if (callId)
                    toolIndex.set(callId, idx);
                break;
            }
            case 'mcp_tool_call_end': {
                if (!callId || !toolIndex.has(callId))
                    break;
                const idx = toolIndex.get(callId);
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
function sliceTranscriptForLatest(messages) {
    if (!messages.length)
        return [];
    let index = messages.length - 1;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (messages[i].role === 'assistant') {
            index = i;
            break;
        }
    }
    if (index <= 0)
        return messages.slice(index);
    const prev = messages[index - 1];
    if (prev && prev.role === 'reasoning') {
        return messages.slice(index - 1);
    }
    return messages.slice(index);
}

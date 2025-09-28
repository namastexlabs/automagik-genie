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
const log_tail_1 = require("./views/log-tail");
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
const DEFAULT_RUNS_PER_PAGE = 10;
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
                await emitView((0, common_1.buildErrorView)(parsed.options.style, 'Unknown command', `Unknown command: ${parsed.command}`), parsed.options, { stream: process.stderr });
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
        prefix: null,
        executor: undefined,
        json: false,
        style: 'compact',
        status: null,
        lines: 60,
        page: 1,
        per: 10
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
        if (token === '--prefix') {
            if (i + 1 >= raw.length)
                throw new Error('Missing value for --prefix');
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
            if (i + 1 >= raw.length)
                throw new Error('Missing value for --style');
            options.style = coerceStyle(raw[++i]);
            continue;
        }
        if (token === '--status') {
            if (i + 1 >= raw.length)
                throw new Error('Missing value for --status');
            options.status = raw[++i];
            continue;
        }
        if (token === '--lines') {
            if (i + 1 >= raw.length)
                throw new Error('Missing value for --lines');
            const n = parseInt(raw[++i], 10);
            if (!Number.isFinite(n) || n <= 0)
                throw new Error('Invalid --lines value');
            options.lines = n;
            continue;
        }
        if (token === '--page') {
            if (i + 1 >= raw.length)
                throw new Error('Missing value for --page');
            const n = parseInt(raw[++i], 10);
            if (!Number.isFinite(n) || n <= 0)
                throw new Error('Invalid --page value');
            options.page = n;
            continue;
        }
        if (token === '--per') {
            if (i + 1 >= raw.length)
                throw new Error('Missing value for --per');
            const n = parseInt(raw[++i], 10);
            if (!Number.isFinite(n) || n <= 0)
                throw new Error('Invalid --per value');
            options.per = n;
            continue;
        }
        filtered.push(token);
    }
    return { command, commandArgs: filtered, options };
}
function coerceStyle(input) {
    const token = (input || '').toLowerCase();
    if (token === 'art')
        return 'art';
    if (token === 'plain')
        return 'plain';
    return 'compact';
}
async function emitView(envelope, options, opts = {}) {
    const style = options.style || 'compact';
    const styledEnvelope = { ...envelope, style };
    await (0, view_1.renderEnvelope)(styledEnvelope, {
        json: opts.forceJson ?? options.json,
        stream: opts.stream,
        style
    });
}
async function emitEmergencyError(message) {
    const envelope = (0, common_1.buildErrorView)('compact', 'Fatal error', message);
    await (0, view_1.renderEnvelope)(envelope, { json: false, stream: process.stderr, style: 'compact' });
}
async function flushStartupWarnings(options) {
    if (!startupWarnings.length)
        return;
    const envelope = (0, common_1.buildWarningView)(options.style, 'Configuration warnings', [...startupWarnings]);
    await emitView(envelope, options);
    startupWarnings.length = 0;
}
async function flushRuntimeWarnings(options) {
    if (!runtimeWarnings.length)
        return;
    const envelope = (0, common_1.buildWarningView)(options.style, 'Runtime warnings', [...runtimeWarnings]);
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
    const envStyle = process.env.GENIE_CLI_STYLE;
    if (envStyle && options.style === 'compact') {
        options.style = coerceStyle(envStyle);
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
        const bannerSessionId = await resolveSessionIdForBanner(agentName, config, paths, entry.sessionId, logFile);
        if (bannerSessionId && !entry.sessionId) {
            entry.sessionId = bannerSessionId;
            (0, session_store_1.saveSessions)(paths, store);
        }
        const envelope = (0, background_1.buildBackgroundStartView)({
            style: parsed.options.style,
            agentName,
            logPath: formatPathRelative(logFile, paths.baseDir || '.'),
            sessionId: bannerSessionId,
            actions: buildBackgroundActions(bannerSessionId, {
                resume: true
            })
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
async function runAgentCommand(parsed, config, paths) {
    const [maybeSubcommand, ...rest] = parsed.commandArgs;
    if (parsed.options.requestHelp) {
        await emitView((0, common_1.buildInfoView)(parsed.options.style, 'Agent command', [
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
        await emitView((0, common_1.buildInfoView)(parsed.options.style, 'Agent command', [
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
function deriveLogFile(agentName, startTime, paths) {
    const envPath = process.env[background_manager_1.INTERNAL_LOG_PATH_ENV];
    if (envPath)
        return envPath;
    const filename = `${agentName}-${startTime}.log`;
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
        const bannerSessionId = await resolveSessionIdForBanner(agentName, config, paths, session.sessionId, logFile);
        if (bannerSessionId && !session.sessionId) {
            session.sessionId = bannerSessionId;
            (0, session_store_1.saveSessions)(paths, store);
        }
        const envelope = (0, background_1.buildBackgroundStartView)({
            style: parsed.options.style,
            agentName,
            logPath: formatPathRelative(logFile, paths.baseDir || '.'),
            sessionId: bannerSessionId,
            actions: buildBackgroundActions(bannerSessionId, {
                resume: false,
                includeStop: true
            })
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
async function runRuns(parsed, config, paths) {
    const warnings = [];
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG, { onWarning: (message) => warnings.push(message) });
    const entries = Object.entries(store.agents);
    const dataAll = entries.map(([agent, entry]) => ({
        agent,
        status: resolveDisplayStatus(entry),
        sessionId: entry.sessionId || null,
        log: entry.logFile || null,
        lastUsed: entry.lastUsed || entry.created || null
    }));
    const want = parsed.options.status;
    const page = parsed.options.page && parsed.options.page > 0 ? parsed.options.page : 1;
    const perCandidate = parsed.options.per && parsed.options.per > 0 ? parsed.options.per : DEFAULT_RUNS_PER_PAGE;
    const per = perCandidate || DEFAULT_RUNS_PER_PAGE;
    const byStatus = (status) => dataAll.filter((row) => (row.status || '').toLowerCase().startsWith(status));
    const sortByTimeDesc = (arr) => arr.slice().sort((a, b) => {
        const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        return bTime - aTime;
    });
    const paginate = (arr) => arr.slice((page - 1) * per, (page - 1) * per + per);
    const formatRow = (row) => {
        const iso = row.lastUsed ? safeIsoString(row.lastUsed) : null;
        return {
            agent: row.agent,
            status: row.status,
            sessionId: row.sessionId,
            updated: iso ? formatRelativeTime(iso) : 'n/a',
            updatedIso: iso,
            log: row.log ? formatPathRelative(row.log, paths.baseDir || '.') : null
        };
    };
    const baseHints = [
        'View details: genie view <sessionId>',
        'Resume background work: genie continue <sessionId> "<prompt>"',
        'Stop session: genie stop <sessionId>'
    ];
    const scopeSuffix = want && want !== 'default' ? ` --status ${want}` : '';
    const buildPagerHints = (total) => {
        const hints = [];
        if (total > page * per)
            hints.push(`Next page: genie runs${scopeSuffix} --page ${page + 1}`);
        if (page > 1)
            hints.push(`Previous page: genie runs${scopeSuffix} --page ${page - 1}`);
        return hints;
    };
    if (want && want !== 'default') {
        let pool;
        if (want === 'all')
            pool = sortByTimeDesc([...dataAll]);
        else if (want === 'running')
            pool = sortByTimeDesc([...byStatus('running'), ...byStatus('pending-completion')]);
        else
            pool = sortByTimeDesc(dataAll.filter((row) => (row.status || '').toLowerCase().startsWith(want)));
        const pageRows = paginate(pool).map(formatRow);
        const pager = {
            page,
            per,
            hints: [...buildPagerHints(pool.length), ...baseHints]
        };
        const envelope = (0, runs_1.buildRunsScopedView)({
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
    const recentPool = sortByTimeDesc(dataAll.filter((row) => !['running', 'pending-completion'].includes((row.status || '').toLowerCase())));
    const activeRows = paginate(activePool).map(formatRow);
    const recentRows = paginate(recentPool).map(formatRow);
    const statusHints = ['Focus on running sessions: genie runs --status running', 'See completed sessions: genie runs --status completed'];
    const pager = {
        page,
        per,
        hints: [...buildPagerHints(Math.max(activePool.length, recentPool.length)), ...statusHints, ...baseHints]
    };
    const envelope = (0, runs_1.buildRunsOverviewView)({
        style: parsed.options.style,
        active: activeRows,
        recent: recentRows,
        pager,
        warnings
    });
    await emitView(envelope, parsed.options);
}
async function runView(parsed, config, paths) {
    const [sessionId] = parsed.commandArgs;
    if (!sessionId) {
        await emitView((0, common_1.buildInfoView)(parsed.options.style, 'View usage', ['Usage: genie view <sessionId> [--lines N]']), parsed.options);
        return;
    }
    const warnings = [];
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG, { onWarning: (message) => warnings.push(message) });
    const found = findSessionEntry(store, sessionId, paths);
    if (!found) {
        await emitView((0, common_1.buildErrorView)(parsed.options.style, 'Run not found', `No run found with session id '${sessionId}'`), parsed.options, { stream: process.stderr });
        return;
    }
    const { entry } = found;
    const executorKey = entry.executor || config.defaults?.executor || executors_1.DEFAULT_EXECUTOR_KEY;
    const executor = requireExecutor(executorKey);
    const logViewer = executor.logViewer;
    const logFile = entry.logFile;
    if (!logFile || !fs_1.default.existsSync(logFile)) {
        await emitView((0, common_1.buildErrorView)(parsed.options.style, 'Log missing', '❌ Log not found for this run'), parsed.options, { stream: process.stderr });
        return;
    }
    const raw = fs_1.default.readFileSync(logFile, 'utf8');
    if (parsed.options.json) {
        process.stdout.write(raw);
        return;
    }
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
    if (jsonl.length && logViewer?.buildJsonlView) {
        const envelope = logViewer.buildJsonlView({
            render: { entry, jsonl, raw },
            parsed,
            paths,
            store,
            save: session_store_1.saveSessions,
            formatPathRelative,
            style: parsed.options.style
        });
        await emitView(envelope, parsed.options);
        if (warnings.length) {
            await emitView((0, common_1.buildWarningView)(parsed.options.style, 'Session warnings', warnings), parsed.options);
        }
        return;
    }
    const lastN = parsed.options.lines && parsed.options.lines > 0 ? parsed.options.lines : 60;
    const instructions = entry.lastPrompt ? [entry.lastPrompt] : [];
    const errorLines = allLines.filter((line) => /error/i.test(line)).slice(-5);
    const envelope = (0, log_tail_1.buildLogTailView)({
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
        await emitView((0, common_1.buildWarningView)(parsed.options.style, 'Session warnings', warnings), parsed.options);
    }
}
async function runStop(parsed, config, paths) {
    const [target] = parsed.commandArgs;
    if (!target) {
        throw new Error('Usage: genie stop <sessionId|pid>');
    }
    const warnings = [];
    const store = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG, { onWarning: (message) => warnings.push(message) });
    const found = findSessionEntry(store, target, paths);
    const events = [];
    let summary = '';
    const appendWarningView = async () => {
        if (warnings.length) {
            await emitView((0, common_1.buildWarningView)(parsed.options.style, 'Session warnings', warnings), parsed.options);
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
                        if (entry.exitCode === undefined)
                            entry.exitCode = null;
                        (0, session_store_1.saveSessions)(paths, store);
                        break;
                    }
                }
                events.push({ label: `PID ${numericPid}`, detail: 'SIGTERM sent', status: 'done' });
                summary = `Sent SIGTERM to pid ${numericPid}.`;
            }
            else {
                events.push({ label: `PID ${numericPid}`, detail: 'No running process', status: 'failed' });
                summary = `No running process found for pid ${numericPid}.`;
            }
        }
        else {
            events.push({ label: target, status: 'failed', message: 'Session id not found' });
            summary = `No run found with session id '${target}'.`;
        }
        const envelope = (0, stop_1.buildStopView)({
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
    const envelope = (0, stop_1.buildStopView)({
        style: parsed.options.style,
        target,
        events,
        summary
    });
    await emitView(envelope, parsed.options);
    await appendWarningView();
}
function buildBackgroundActions(sessionId, options) {
    if (!sessionId) {
        const lines = ['• Watch: session pending – run `./genie runs --status running` then `./genie view <sessionId>`'];
        if (options.resume) {
            lines.push('• Resume: session pending – run `./genie continue <sessionId> "<prompt>"` once available');
        }
        if (options.includeStop) {
            lines.push('• Stop: session pending – run `./genie stop <sessionId>` once available');
        }
        return lines;
    }
    const lines = [`• Watch: ./genie view ${sessionId}`];
    if (options.resume) {
        lines.push(`• Resume: ./genie continue ${sessionId} "<prompt>"`);
    }
    if (options.includeStop) {
        lines.push(`• Stop: ./genie stop ${sessionId}`);
    }
    return lines;
}
async function resolveSessionIdForBanner(agentName, config, paths, current, logFile, timeoutMs = 15000, intervalMs = 250) {
    if (current)
        return current;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await sleep(intervalMs);
        try {
            const liveStore = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
            const candidate = liveStore.agents?.[agentName]?.sessionId;
            if (candidate) {
                return candidate;
            }
            if (logFile && fs_1.default.existsSync(logFile)) {
                const content = fs_1.default.readFileSync(logFile, 'utf8');
                const match = /"session_id"\s*:\s*"([^"]+)"/i.exec(content) || /"sessionId"\s*:\s*"([^"]+)"/i.exec(content);
                if (match) {
                    const sessionId = match[1];
                    const refreshStore = (0, session_store_1.loadSessions)(paths, config, DEFAULT_CONFIG);
                    const agentEntry = refreshStore.agents?.[agentName];
                    if (agentEntry && !agentEntry.sessionId) {
                        agentEntry.sessionId = sessionId;
                        agentEntry.lastUsed = new Date().toISOString();
                        (0, session_store_1.saveSessions)(paths, refreshStore);
                    }
                    return sessionId;
                }
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            recordRuntimeWarning(`[genie] Failed to refresh session id for banner: ${message}`);
            break;
        }
    }
    return current ?? null;
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
    const presetsEntries = Object.entries(config.presets || {});
    const backgroundDefault = Boolean(config.defaults && config.defaults.background);
    const commandRows = [
        {
            command: 'agent',
            args: 'list | run <agent-id> "<prompt>"',
            description: backgroundDefault
                ? 'List agents or start a run (background default)'
                : 'List agents or start a run (foreground default)'
        },
        { command: 'continue', args: '<sessionId> "<prompt>"', description: 'Continue a background session' },
        { command: 'view', args: '<sessionId> [--lines N]', description: 'Stream the latest output' },
        { command: 'runs', args: '[--status <s>] [--json]', description: 'Show background activity' },
        { command: 'stop', args: '<sessionId>', description: 'Gracefully end a session' },
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
    const envelope = (0, help_1.buildHelpView)({
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
            'genie agent run planner "[Discovery] mission @.genie/product/mission.md ..."',
            'genie agent run implementor "[Discovery] Review @README.md ..."'
        ]
    });
    await emitView(envelope, parsed.options);
}
function listAgents() {
    const baseDir = '.genie/agents';
    const records = [];
    const segments = [
        { relative: '', category: 'core' },
        { relative: 'modes', category: 'mode' },
        { relative: 'specialists', category: 'specialized' }
    ];
    if (!fs_1.default.existsSync(baseDir))
        return records;
    segments.forEach(({ relative, category }) => {
        const dirPath = relative ? path_1.default.join(baseDir, relative) : baseDir;
        if (!fs_1.default.existsSync(dirPath))
            return;
        fs_1.default.readdirSync(dirPath).forEach((entry) => {
            if (!entry.endsWith('.md') || entry === 'README.md')
                return;
            const fullPath = path_1.default.join(dirPath, entry);
            if (!fs_1.default.statSync(fullPath).isFile())
                return;
            const relId = relative ? path_1.default.join(relative, entry.replace(/\.md$/, '')) : entry.replace(/\.md$/, '');
            const content = fs_1.default.readFileSync(fullPath, 'utf8');
            const { meta } = extractFrontMatter(content);
            const metaObj = meta || {};
            if (metaObj.hidden === true || metaObj.disabled === true)
                return;
            const label = (metaObj.name || relId.split(/[\\/]/).pop() || relId).trim();
            records.push({ id: relId, label, meta: metaObj, category });
        });
    });
    return records;
}
async function emitAgentCatalog(parsed, _config, _paths) {
    const agents = listAgents();
    const summarize = (entry) => {
        const description = (entry.meta?.description || entry.meta?.summary || '').replace(/\s+/g, ' ').trim();
        return truncateText(description || '—', 96);
    };
    const envelope = (0, agent_catalog_1.buildAgentCatalogView)({
        style: parsed.options.style,
        totals: {
            all: agents.length,
            modes: agents.filter((entry) => entry.category === 'mode').length,
            specialized: agents.filter((entry) => entry.category === 'specialized').length,
            core: agents.filter((entry) => entry.category === 'core').length
        },
        groups: [
            {
                label: 'Modes',
                emptyText: 'No modes found',
                rows: agents
                    .filter((entry) => entry.category === 'mode')
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((entry) => ({ id: entry.label, rawId: entry.id, summary: summarize(entry) }))
            },
            {
                label: 'Core Agents',
                emptyText: 'No core agents found',
                rows: agents
                    .filter((entry) => entry.category === 'core')
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((entry) => ({ id: entry.label, rawId: entry.id, summary: summarize(entry) }))
            },
            {
                label: 'Specialized Agents',
                emptyText: 'No specialized agents found',
                rows: agents
                    .filter((entry) => entry.category === 'specialized')
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((entry) => ({ id: entry.label, rawId: entry.id, summary: summarize(entry) }))
            }
        ]
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
    const legacyCandidates = [legacy, `modes/${legacy}`, `specialists/${legacy}`];
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

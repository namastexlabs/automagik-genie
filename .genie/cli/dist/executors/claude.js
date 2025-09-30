"use strict";
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
const logViewer = __importStar(require("./claude-log-viewer"));
const defaults = {
    binary: 'claude',
    packageSpec: undefined,
    sessionsDir: undefined,
    exec: {
        model: 'sonnet',
        permissionMode: 'default',
        outputFormat: 'stream-json',
        allowedTools: [],
        disallowedTools: []
    },
    resume: {
        outputFormat: 'stream-json'
    },
    sessionExtractionDelayMs: 1000
};
function buildRunCommand({ config = {}, agentPath, prompt }) {
    const execConfig = mergeExecConfig(config.exec);
    const command = config.binary || defaults.binary;
    const args = ['-p', '--verbose', '--output-format', 'stream-json'];
    if (execConfig.model) {
        args.push('--model', String(execConfig.model));
    }
    if (execConfig.permissionMode && execConfig.permissionMode !== 'default') {
        args.push('--permission-mode', String(execConfig.permissionMode));
    }
    if (Array.isArray(execConfig.allowedTools) && execConfig.allowedTools.length > 0) {
        args.push('--allowed-tools', execConfig.allowedTools.join(','));
    }
    if (Array.isArray(execConfig.disallowedTools) && execConfig.disallowedTools.length > 0) {
        args.push('--disallowed-tools', execConfig.disallowedTools.join(','));
    }
    if (agentPath) {
        const instructionsFile = path_1.default.isAbsolute(agentPath) ? agentPath : path_1.default.resolve(agentPath);
        try {
            const content = fs_1.default.readFileSync(instructionsFile, 'utf-8');
            args.push('--append-system-prompt', content);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[genie] Failed to read agent file at ${instructionsFile}: ${message}`);
        }
    }
    if (prompt) {
        args.push(prompt);
    }
    return { command, args };
}
function buildResumeCommand({ config = {}, sessionId, prompt }) {
    const resumeConfig = mergeResumeConfig(config.resume);
    const command = config.binary || defaults.binary;
    const args = ['-p', '--verbose', '--output-format', 'stream-json'];
    if (sessionId) {
        args.push('--resume', sessionId);
    }
    if (prompt) {
        args.push(prompt);
    }
    return { command, args };
}
function resolvePaths({ config = {}, baseDir, resolvePath }) {
    return {};
}
function extractSessionId({ startTime, paths = {} }) {
    return null;
}
function getSessionExtractionDelay({ config = {}, defaultDelay }) {
    if (typeof config.sessionExtractionDelayMs === 'number') {
        return config.sessionExtractionDelayMs;
    }
    if (typeof defaults.sessionExtractionDelayMs === 'number') {
        return defaults.sessionExtractionDelayMs;
    }
    return defaultDelay;
}
function mergeExecConfig(execConfig = {}) {
    return {
        ...defaults.exec,
        ...execConfig,
        allowedTools: Array.isArray(execConfig.allowedTools)
            ? execConfig.allowedTools.slice()
            : defaults.exec.allowedTools.slice(),
        disallowedTools: Array.isArray(execConfig.disallowedTools)
            ? execConfig.disallowedTools.slice()
            : defaults.exec.disallowedTools.slice()
    };
}
function mergeResumeConfig(resume = {}) {
    return {
        ...defaults.resume,
        ...resume
    };
}
const claudeExecutor = {
    defaults,
    buildRunCommand,
    buildResumeCommand,
    resolvePaths,
    extractSessionId,
    getSessionExtractionDelay,
    logViewer
};
exports.default = claudeExecutor;

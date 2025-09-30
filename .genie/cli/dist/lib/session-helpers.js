"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordRuntimeWarning = recordRuntimeWarning;
exports.getRuntimeWarnings = getRuntimeWarnings;
exports.clearRuntimeWarnings = clearRuntimeWarnings;
exports.findSessionEntry = findSessionEntry;
exports.resolveDisplayStatus = resolveDisplayStatus;
const fs_1 = __importDefault(require("fs"));
const session_store_1 = require("../session-store");
const background_manager_1 = __importDefault(require("../background-manager"));
const backgroundManager = new background_manager_1.default();
const runtimeWarnings = [];
function recordRuntimeWarning(message) {
    runtimeWarnings.push(message);
}
function getRuntimeWarnings() {
    return [...runtimeWarnings];
}
function clearRuntimeWarnings() {
    runtimeWarnings.length = 0;
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

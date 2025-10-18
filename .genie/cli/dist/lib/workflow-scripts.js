"use strict";
/**
 * Workflow Scripts Integration
 *
 * TypeScript wrapper for Node.js workflow automation scripts
 * Provides type-safe interfaces and error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectTeachingSignal = detectTeachingSignal;
exports.logBlocker = logBlocker;
exports.validateRole = validateRole;
exports.trackPromise = trackPromise;
exports.areWorkflowScriptsAvailable = areWorkflowScriptsAvailable;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const SCRIPTS_DIR = path_1.default.join(__dirname, '../../../custom/workflow-scripts');
/**
 * Execute a workflow script and parse JSON output
 */
async function executeScript(scriptName, args, options = {}) {
    const scriptPath = path_1.default.join(SCRIPTS_DIR, scriptName);
    return new Promise((resolve, reject) => {
        const proc = (0, child_process_1.spawn)('node', [scriptPath, ...args], {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        proc.on('error', (error) => {
            reject(new Error(`Failed to execute ${scriptName}: ${error.message}`));
        });
        proc.on('exit', (code) => {
            if (options.verbose && stderr) {
                console.error(stderr);
            }
            try {
                const result = JSON.parse(stdout.trim());
                resolve(result);
            }
            catch (err) {
                // Some scripts exit with non-zero for negative results but still output valid JSON
                if (stdout.trim()) {
                    try {
                        const result = JSON.parse(stdout.trim());
                        resolve(result);
                    }
                    catch {
                        reject(new Error(`Invalid JSON output from ${scriptName}: ${stdout}`));
                    }
                }
                else {
                    reject(new Error(`Script ${scriptName} failed with code ${code}: ${stderr || 'No output'}`));
                }
            }
        });
    });
}
/**
 * Detect teaching signals in user messages
 */
async function detectTeachingSignal(message, options = {}) {
    return executeScript('detect-teaching-signal.js', [message], options);
}
/**
 * Log a blocker to a wish document
 */
async function logBlocker(wishPath, blockerDescription, options = {}) {
    return executeScript('log-blocker.js', [wishPath, blockerDescription], options);
}
/**
 * Validate role before MCP delegation
 */
async function validateRole(currentRole, intendedAction, sessionStatePath, options = {}) {
    const args = [currentRole, intendedAction];
    if (sessionStatePath) {
        args.push(sessionStatePath);
    }
    return executeScript('validate-role.js', args, options);
}
/**
 * Track promises and detect say-do gaps
 */
async function trackPromise(message, executedCommands = [], options = {}) {
    return executeScript('track-promise.js', [message, ...executedCommands], options);
}
/**
 * Check if workflow scripts are available
 */
function areWorkflowScriptsAvailable() {
    const fs = require('fs');
    const scripts = [
        'detect-teaching-signal.js',
        'log-blocker.js',
        'validate-role.js',
        'track-promise.js'
    ];
    return scripts.every(script => fs.existsSync(path_1.default.join(SCRIPTS_DIR, script)));
}

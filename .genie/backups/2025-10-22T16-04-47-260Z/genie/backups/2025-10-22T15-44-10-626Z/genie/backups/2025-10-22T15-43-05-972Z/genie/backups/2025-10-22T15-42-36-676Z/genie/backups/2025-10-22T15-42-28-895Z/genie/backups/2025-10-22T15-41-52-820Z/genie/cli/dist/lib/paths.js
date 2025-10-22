"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findWorkspaceRoot = findWorkspaceRoot;
exports.getPackageRoot = getPackageRoot;
exports.getTemplateGeniePath = getTemplateGeniePath;
exports.getTemplateClaudePath = getTemplateClaudePath;
exports.getTemplateRootPath = getTemplateRootPath;
exports.getTemplateRelativeBlacklist = getTemplateRelativeBlacklist;
exports.resolveTargetGeniePath = resolveTargetGeniePath;
exports.resolveTargetStatePath = resolveTargetStatePath;
exports.resolveBackupsRoot = resolveBackupsRoot;
exports.resolveWorkspaceProviderPath = resolveWorkspaceProviderPath;
exports.resolveWorkspaceVersionPath = resolveWorkspaceVersionPath;
exports.resolveWorkspacePackageJson = resolveWorkspacePackageJson;
exports.resolveProviderStatusPath = resolveProviderStatusPath;
exports.resolveTempBackupsRoot = resolveTempBackupsRoot;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Find workspace root by searching upward for .genie/ directory
// This locates the USER'S project root (where they run genie)
function findWorkspaceRoot() {
    let dir = process.cwd();
    while (dir !== path_1.default.dirname(dir)) {
        if (fs_1.default.existsSync(path_1.default.join(dir, '.genie'))) {
            return dir;
        }
        dir = path_1.default.dirname(dir);
    }
    // Fallback to cwd if .genie not found
    return process.cwd();
}
// Get Genie framework package root (where automagik-genie package.json lives)
// This is DIFFERENT from workspace root!
// Works in both dev mode and npm mode (npx automagik-genie)
function getPackageRoot() {
    // __dirname = .genie/cli/dist/lib/
    // ../../../../ = workspace root (dev) or package root (npm)
    return path_1.default.resolve(__dirname, '../../../..');
}
function getTemplateGeniePath(template = 'code') {
    // Copy from framework's .genie/code/ or .genie/create/ directory
    return path_1.default.join(getPackageRoot(), '.genie', template);
}
function getTemplateClaudePath(_template = 'code') {
    // .claude/ not used - Claude Code wraps core agents directly
    return path_1.default.join(getPackageRoot(), '.claude');
}
function getTemplateRootPath(_template = 'code') {
    // Root files (AGENTS.md, CLAUDE.md) copied from framework root
    return getPackageRoot();
}
function getTemplateRelativeBlacklist() {
    // Protect user work - these directories should NEVER be overwritten
    return new Set([
        'cli', // Framework CLI code
        'mcp', // Framework MCP code
        'backups', // User backups
        'wishes', // User wishes (preserve entirely)
        'reports', // User reports (preserve entirely)
        'state' // User session state (preserve entirely)
    ]);
}
function resolveTargetGeniePath(cwd = process.cwd()) {
    return path_1.default.resolve(cwd, '.genie');
}
function resolveTargetStatePath(cwd = process.cwd()) {
    return path_1.default.join(resolveTargetGeniePath(cwd), 'state');
}
function resolveBackupsRoot(cwd = process.cwd()) {
    return path_1.default.join(resolveTargetGeniePath(cwd), 'backups');
}
function resolveWorkspaceProviderPath(cwd = process.cwd()) {
    return path_1.default.join(resolveTargetStatePath(cwd), 'provider.json');
}
function resolveWorkspaceVersionPath(cwd = process.cwd()) {
    return path_1.default.join(resolveTargetStatePath(cwd), 'version.json');
}
function resolveWorkspacePackageJson(cwd = process.cwd()) {
    return path_1.default.join(resolveTargetGeniePath(cwd), 'package.json');
}
function resolveProviderStatusPath(cwd = process.cwd()) {
    return path_1.default.join(resolveTargetStatePath(cwd), 'provider-status.json');
}
function resolveTempBackupsRoot(cwd = process.cwd()) {
    return path_1.default.join(cwd, '.genie-backups-temp');
}

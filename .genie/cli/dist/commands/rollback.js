"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRollback = void 0;
const path_1 = __importDefault(require("path"));
const view_helpers_1 = require("../lib/view-helpers");
const common_1 = require("../views/common");
const paths_1 = require("../lib/paths");
const fs_utils_1 = require("../lib/fs-utils");
const package_1 = require("../lib/package");
const fs_1 = require("fs");
async function runRollback(parsed, _config, _paths) {
    try {
        const flags = parseFlags(parsed.commandArgs);
        const cwd = process.cwd();
        const targetGenie = (0, paths_1.resolveTargetGeniePath)(cwd);
        const backupsRoot = (0, paths_1.resolveBackupsRoot)(cwd);
        if (!(await (0, fs_utils_1.pathExists)(targetGenie))) {
            await (0, view_helpers_1.emitView)((0, common_1.buildInfoView)('Nothing to rollback', ['No .genie directory found in this workspace.']), parsed.options);
            return;
        }
        if (!(await (0, fs_utils_1.pathExists)(backupsRoot))) {
            await (0, view_helpers_1.emitView)((0, common_1.buildInfoView)('No backups found', ['The .genie/backups directory is empty.']), parsed.options);
            return;
        }
        const backupIds = await listBackupIds(backupsRoot);
        if (backupIds.length === 0) {
            await (0, view_helpers_1.emitView)((0, common_1.buildInfoView)('No backups found', ['The .genie/backups directory is empty.']), parsed.options);
            return;
        }
        if (flags.list) {
            await (0, view_helpers_1.emitView)((0, common_1.buildInfoView)('Available backups', backupIds.map((id) => `• ${id}`)), parsed.options);
            return;
        }
        const targetId = selectBackupId(backupIds, flags);
        if (!targetId) {
            await (0, view_helpers_1.emitView)((0, common_1.buildInfoView)('Rollback cancelled', ['No backup selected. Pass --id <backupId> to choose a specific snapshot.']), parsed.options);
            return;
        }
        const backupDir = path_1.default.join(backupsRoot, targetId, 'genie');
        if (!(await (0, fs_utils_1.pathExists)(backupDir))) {
            await (0, view_helpers_1.emitView)((0, common_1.buildErrorView)('Invalid backup', `Backup ${targetId} does not contain a genie snapshot.`), parsed.options, { stream: process.stderr });
            process.exitCode = 1;
            return;
        }
        const preBackupId = await backupCurrentState(targetGenie);
        await restoreFromBackup(targetGenie, backupDir);
        // Restore root documentation files if they exist in backup
        const docsBackupDir = path_1.default.join(backupsRoot, targetId, 'docs');
        if (await (0, fs_utils_1.pathExists)(docsBackupDir)) {
            await restoreRootDocs(cwd, docsBackupDir);
        }
        await mergeBackupHistories(targetGenie, backupsRoot, preBackupId);
        await touchVersionFile(cwd, 'rollback');
        await (0, view_helpers_1.emitView)((0, common_1.buildInfoView)('Rollback complete', [
            `Restored snapshot: ${targetId}`,
            `Previous state stored as backup: ${preBackupId}`
        ]), parsed.options);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await (0, view_helpers_1.emitView)((0, common_1.buildErrorView)('Rollback failed', message), parsed.options, { stream: process.stderr });
        process.exitCode = 1;
    }
}
exports.runRollback = runRollback;
function parseFlags(args) {
    const flags = {};
    for (let i = 0; i < args.length; i++) {
        const token = args[i];
        if (token === '--list') {
            flags.list = true;
            continue;
        }
        if (token === '--latest') {
            flags.latest = true;
            continue;
        }
        if (token === '--id' && args[i + 1]) {
            flags.id = args[i + 1];
            i++;
            continue;
        }
        if (token.startsWith('--id=')) {
            flags.id = token.split('=')[1];
            continue;
        }
        if (token === '--force' || token === '-f') {
            flags.force = true;
            continue;
        }
    }
    return flags;
}
async function listBackupIds(backupsRoot) {
    const entries = await fs_1.promises.readdir(backupsRoot, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().reverse();
}
function selectBackupId(ids, flags) {
    if (flags.id) {
        return ids.find((id) => id === flags.id);
    }
    if (flags.latest || !flags.force) {
        return ids[0];
    }
    return undefined;
}
async function backupCurrentState(targetGenie) {
    const backupId = `${(0, fs_utils_1.toIsoId)()}-pre-rollback`;
    const backupDir = path_1.default.join(targetGenie, 'backups', backupId);
    const cwd = process.cwd();
    await (0, fs_utils_1.ensureDir)(backupDir);
    // Backup current .genie directory
    await (0, fs_utils_1.snapshotDirectory)(targetGenie, path_1.default.join(backupDir, 'genie'));
    // Backup current root framework documentation files
    const rootDocsDir = path_1.default.join(backupDir, 'docs');
    await (0, fs_utils_1.ensureDir)(rootDocsDir);
    const rootDocsFiles = ['AGENTS.md', 'CLAUDE.md'];
    for (const file of rootDocsFiles) {
        const srcPath = path_1.default.join(cwd, file);
        const destPath = path_1.default.join(rootDocsDir, file);
        if (await (0, fs_utils_1.pathExists)(srcPath)) {
            await fs_1.promises.copyFile(srcPath, destPath);
        }
    }
    return backupId;
}
async function restoreFromBackup(targetGenie, backupGenieDir) {
    const stagingDir = path_1.default.join(path_1.default.dirname(targetGenie), `.genie-restore-${(0, fs_utils_1.toIsoId)()}`);
    await (0, fs_utils_1.copyDirectory)(backupGenieDir, stagingDir);
    const previousDir = `${targetGenie}.previous-${(0, fs_utils_1.toIsoId)()}`;
    await fs_1.promises.rename(targetGenie, previousDir);
    await fs_1.promises.rename(stagingDir, targetGenie);
    // Preserve backups from previous state by merging later
    await mergeBackups(previousDir, targetGenie);
    await fs_1.promises.rm(previousDir, { recursive: true, force: true });
}
async function mergeBackups(previousDir, targetGenie) {
    const previousBackups = path_1.default.join(previousDir, 'backups');
    const targetBackups = path_1.default.join(targetGenie, 'backups');
    await (0, fs_utils_1.ensureDir)(targetBackups);
    const exists = await (0, fs_utils_1.pathExists)(previousBackups);
    if (!exists) {
        return;
    }
    const snapshots = await fs_1.promises.readdir(previousBackups, { withFileTypes: true });
    for (const snapshot of snapshots) {
        if (!snapshot.isDirectory())
            continue;
        const source = path_1.default.join(previousBackups, snapshot.name);
        const destination = path_1.default.join(targetBackups, snapshot.name);
        if (await (0, fs_utils_1.pathExists)(destination)) {
            continue;
        }
        await fs_1.promises.rename(source, destination);
    }
}
async function mergeBackupHistories(targetGenie, backupsRoot, preBackupId) {
    await (0, fs_utils_1.ensureDir)(backupsRoot);
    const recordDir = path_1.default.join(backupsRoot, preBackupId, 'metadata');
    await (0, fs_utils_1.ensureDir)(recordDir);
    await fs_1.promises.writeFile(path_1.default.join(recordDir, 'note.txt'), 'Created automatically before rollback.');
}
async function restoreRootDocs(cwd, docsBackupDir) {
    const rootDocsFiles = ['AGENTS.md', 'CLAUDE.md'];
    for (const file of rootDocsFiles) {
        const srcPath = path_1.default.join(docsBackupDir, file);
        const destPath = path_1.default.join(cwd, file);
        if (await (0, fs_utils_1.pathExists)(srcPath)) {
            await fs_1.promises.copyFile(srcPath, destPath);
        }
    }
}
async function touchVersionFile(cwd, reason) {
    const versionPath = (0, paths_1.resolveWorkspaceVersionPath)(cwd);
    const version = (0, package_1.getPackageVersion)();
    const now = new Date().toISOString();
    const existing = await (0, fs_utils_1.pathExists)(versionPath);
    if (!existing) {
        await (0, fs_utils_1.writeJsonFile)(versionPath, {
            version,
            installedAt: now,
            lastUpdated: now,
            migrationInfo: {
                lastAction: reason
            }
        });
        return;
    }
    const raw = await fs_1.promises.readFile(versionPath, 'utf8');
    const parsed = JSON.parse(raw);
    parsed.version = version;
    parsed.lastUpdated = now;
    parsed.migrationInfo = {
        ...(parsed.migrationInfo || {}),
        lastAction: reason
    };
    await (0, fs_utils_1.writeJsonFile)(versionPath, parsed);
}

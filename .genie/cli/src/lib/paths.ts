import fs from 'fs';
import path from 'path';

// Find workspace root by searching upward for .genie/ directory
// This locates the USER'S project root (where they run genie)
export function findWorkspaceRoot(): string {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.genie'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  // Fallback to cwd if .genie not found
  return process.cwd();
}

// Get Genie framework package root (where automagik-genie package.json lives)
// This is DIFFERENT from workspace root!
// Works in both dev mode and npm mode (npx automagik-genie)
export function getPackageRoot(): string {
  // __dirname = .genie/cli/dist/lib/
  // ../../../../ = workspace root (dev) or package root (npm)
  return path.resolve(__dirname, '../../../..');
}

export type TemplateType = 'code' | 'create';

export function getTemplateGeniePath(_template: TemplateType = 'code'): string {
  // Copy directly from framework's .genie/ directory
  // Template variants (code vs create) handled by install/update neurons
  return path.join(getPackageRoot(), '.genie');
}

export function getTemplateClaudePath(_template: TemplateType = 'code'): string {
  // .claude/ not used - Claude Code wraps core agents directly
  return path.join(getPackageRoot(), '.claude');
}

export function getTemplateRootPath(_template: TemplateType = 'code'): string {
  // Root files (AGENTS.md, CLAUDE.md) copied from framework root
  return getPackageRoot();
}

export function getTemplateRelativeBlacklist(): Set<string> {
  // Protect user work - these directories should NEVER be overwritten
  return new Set([
    'cli',        // Framework CLI code
    'mcp',        // Framework MCP code
    'backups',    // User backups
    'agents',     // User custom agents (preserve entirely)
    'wishes',     // User wishes (preserve entirely)
    'reports',    // User reports (preserve entirely)
    'state'       // User session state (preserve entirely)
  ]);
}

export function resolveTargetGeniePath(cwd: string = process.cwd()): string {
  return path.resolve(cwd, '.genie');
}

export function resolveTargetStatePath(cwd: string = process.cwd()): string {
  return path.join(resolveTargetGeniePath(cwd), 'state');
}

export function resolveBackupsRoot(cwd: string = process.cwd()): string {
  return path.join(resolveTargetGeniePath(cwd), 'backups');
}

export function resolveWorkspaceProviderPath(cwd: string = process.cwd()): string {
  return path.join(resolveTargetStatePath(cwd), 'provider.json');
}

export function resolveWorkspaceVersionPath(cwd: string = process.cwd()): string {
  return path.join(resolveTargetStatePath(cwd), 'version.json');
}

export function resolveProviderStatusPath(cwd: string = process.cwd()): string {
  return path.join(resolveTargetStatePath(cwd), 'provider-status.json');
}

export function resolveTempBackupsRoot(cwd: string = process.cwd()): string {
  return path.join(cwd, '.genie-backups-temp');
}

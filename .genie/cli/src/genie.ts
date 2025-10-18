#!/usr/bin/env node
/**
 * GENIE Agent CLI - Codex exec orchestration with configurable execution modes
 */

import { parseArguments } from './lib/cli-parser';
import {
  loadConfig,
  applyDefaults,
  resolvePaths,
  prepareDirectories,
  getStartupWarnings,
  clearStartupWarnings
} from './lib/config';
import { getRuntimeWarnings, clearRuntimeWarnings } from './lib/session-helpers';
import {
  buildRunHelpView,
  buildResumeHelpView,
  buildListHelpView,
  buildViewHelpView,
  buildStopHelpView
} from './views/help';
import { buildErrorView, buildInfoView, buildWarningView } from './views/common';
import { emitView } from './lib/view-helpers';
import { runChat } from './commands/run';
import { runContinue } from './commands/resume';
import { runList } from './commands/list';
import { runView } from './commands/view';
import { runStop } from './commands/stop';
import { runHelp } from './commands/help';
import { runInit } from './commands/init';
import { runMigrateCommand } from './commands/migrate';
import { runUpdate } from './commands/update';
import { runRollback } from './commands/rollback';
import { runStatus } from './commands/status';
import { runCleanup } from './commands/cleanup';
import { runStatusline } from './commands/statusline';
import { modelCommand } from './commands/model';
import { runWorkflowCommand } from './commands/workflow';
import {
  INTERNAL_BACKGROUND_MARKER_ENV,
  INTERNAL_BACKGROUND_ENV,
  INTERNAL_START_TIME_ENV,
  INTERNAL_LOG_PATH_ENV
} from './background-manager';

void main();

async function main(): Promise<void> {
  try {
    let parsed = parseArguments(process.argv.slice(2));
    const envIsBackground = process.env[INTERNAL_BACKGROUND_MARKER_ENV] === '1';
    if (envIsBackground) {
      parsed.options.background = true;
      parsed.options.backgroundRunner = true;
      parsed.options.backgroundExplicit = true;
    } else {
      delete process.env[INTERNAL_BACKGROUND_ENV];
      delete process.env[INTERNAL_START_TIME_ENV];
      delete process.env[INTERNAL_LOG_PATH_ENV];
    }

    // Fast path for help commands - skip config loading
    const isHelpOnly = (parsed.command === 'help' || parsed.command === undefined) ||
                      parsed.options.requestHelp;

    let config: ReturnType<typeof loadConfig>;
    let paths: ReturnType<typeof resolvePaths>;

    if (isHelpOnly) {
      // Minimal config for help display
      config = { defaults: { background: true } } as ReturnType<typeof loadConfig>;
      paths = resolvePaths({});
    } else {
      config = loadConfig();
      applyDefaults(parsed.options, config.defaults);
      paths = resolvePaths(config.paths || {});
      prepareDirectories(paths);

      const startupWarnings = getStartupWarnings();
      if (startupWarnings.length) {
        const envelope = buildWarningView('Configuration warnings', startupWarnings);
        await emitView(envelope, parsed.options);
        clearStartupWarnings();
      }
    }

    switch (parsed.command) {
      case 'run':
        if (parsed.options.requestHelp) {
          await emitView(buildRunHelpView(), parsed.options);
          return;
        }
        await runChat(parsed, config, paths);
        break;
      case 'init':
        if (parsed.options.requestHelp) {
          await emitView(buildInfoView('Genie init', [
            'Usage: genie init [--provider <codex|claude>] [--yes]',
            'Copies the packaged .genie templates into the current workspace, backs up any existing configuration, and records provider defaults.'
          ]), parsed.options);
          return;
        }
        await runInit(parsed, config, paths);
        break;
      case 'migrate':
        if (parsed.options.requestHelp) {
          await emitView(buildInfoView('Genie migrate', [
            'Usage: genie migrate [--dry-run] [--force]',
            'Migrates old Genie installations to npm-backed architecture (v3.0+).',
            'Backs up existing setup, preserves custom agents, removes core agents (now in npm).'
          ]), parsed.options);
          return;
        }
        await runMigrateCommand(parsed, config, paths);
        break;
      case 'update':
        if (parsed.options.requestHelp) {
          await emitView(buildInfoView('Genie update', [
            'Usage: genie update [--dry-run] [--force]',
            'Bakes template changes into the workspace after creating a backup snapshot.'
          ]), parsed.options);
          return;
        }
        await runUpdate(parsed, config, paths);
        break;
      case 'rollback':
        if (parsed.options.requestHelp) {
          await emitView(buildInfoView('Genie rollback', [
            'Usage: genie rollback [--list] [--id <backupId>] [--latest]',
            'Restores a previous snapshot stored under .genie/backups.'
          ]), parsed.options);
          return;
        }
        await runRollback(parsed, config, paths);
        break;
      case 'status':
        await runStatus(parsed, config, paths);
        break;
      case 'cleanup':
        await runCleanup(parsed, config, paths);
        break;
      case 'statusline':
        await runStatusline(parsed, config, paths);
        break;
      case 'model':
        if (parsed.options.requestHelp) {
          await emitView(buildInfoView('Genie model', [
            'Usage: genie model [subcommand]',
            '',
            'Configure default executor (codex or claude)',
            '',
            'Subcommands:',
            '  show    - Show current default executor (default)',
            '  detect  - Detect available executors',
            '  codex   - Set codex as default executor',
            '  claude  - Set claude as default executor'
          ]), parsed.options);
          return;
        }
        await modelCommand(parsed, config, paths);
        break;
      case 'workflow':
        if (parsed.options.requestHelp) {
          await emitView(buildInfoView('Genie workflow', [
            'Usage: genie workflow <subcommand> [options]',
            '',
            'Run workflow automation scripts',
            '',
            'Subcommands:',
            '  teach <message>                      - Detect teaching signals',
            '  blocker <wish-path> <description>    - Log blocker to wish',
            '  role <role> <action> [session-path]  - Validate role before delegation',
            '  promise <message> [commands...]      - Track promises and detect say-do gaps',
            '  help                                 - Show detailed help',
            '',
            'Use "genie workflow help" for detailed documentation and examples.'
          ]), parsed.options);
          return;
        }
        await runWorkflowCommand(parsed, config, paths);
        break;
      case 'resume':
        if (parsed.options.requestHelp) {
          await emitView(buildResumeHelpView(), parsed.options);
          return;
        }
        await runContinue(parsed, config, paths);
        break;
      case 'list':
        if (parsed.options.requestHelp) {
          await emitView(buildListHelpView(), parsed.options);
          return;
        }
        await runList(parsed, config, paths);
        break;
      case 'view':
        if (parsed.options.requestHelp) {
          await emitView(buildViewHelpView(), parsed.options);
          return;
        }
        await runView(parsed, config, paths);
        break;
      case 'stop':
        if (parsed.options.requestHelp) {
          await emitView(buildStopHelpView(), parsed.options);
          return;
        }
        await runStop(parsed, config, paths);
        break;
      case 'help':
      case undefined:
        await runHelp(parsed, config, paths);
        break;
      default: {
        await emitView(buildErrorView('Unknown command', `Unknown command: ${parsed.command}`), parsed.options, { stream: process.stderr });
        await runHelp(parsed, config, paths);
        process.exitCode = 1;
        break;
      }
    }
    const runtimeWarnings = getRuntimeWarnings();
    if (runtimeWarnings.length) {
      const envelope = buildWarningView('Runtime warnings', runtimeWarnings);
      await emitView(envelope, parsed.options);
      clearRuntimeWarnings();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await emitEmergencyError(message);
    process.exitCode = 1;
  }
}

async function emitEmergencyError(message: string): Promise<void> {
  const errorMessage = buildErrorView('Fatal error', message);
  process.stderr.write(errorMessage + '\n');
}

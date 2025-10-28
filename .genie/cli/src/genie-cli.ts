#!/usr/bin/env node
/**
 * Genie CLI - Unified command-line interface with commander.js
 *
 * Provides a unified CLI for:
 * - Agent orchestration (run, resume, list, view, stop)
 * - MCP server management (genie mcp)
 */

import { Command } from 'commander';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import gradient from 'gradient-string';
import { startForgeInBackground, waitForForgeReady, stopForge, isForgeRunning, killForgeProcess, getRunningTasks } from './lib/forge-manager';
import { collectForgeStats, formatStatsForDashboard } from './lib/forge-stats';
import { formatTokenMetrics } from './lib/token-tracker';
import { runInit } from './commands/init';
import { loadConfig } from './lib/config';
import { loadOrCreateConfig as loadOrCreateMCPConfig } from './lib/config-manager';
import { createForgeExecutor } from './lib/forge-executor';
import type { ParsedCommand, GenieConfig, ConfigPaths } from './lib/types';
import { getLearnedSpells, formatSpellChangelog, getTagForVersion } from './lib/spell-changelog';

const program = new Command();

// Universe Genie-themed gradients 🧞✨🌌
const genieGradient = gradient(['#0066ff', '#9933ff', '#ff00ff']); // Deep Blue → Purple → Fuscia
const cosmicGradient = gradient(['#4169e1', '#8a2be2', '#ff1493']); // Royal Blue → Blue Violet → Deep Pink
const performanceGradient = gradient(['#ffd700', '#ff8c00', '#ff6347']); // Gold → Orange → Tomato
const successGradient = gradient(['#00ff88', '#00ccff', '#0099ff']); // Green → Cyan → Sky Blue
const magicGradient = gradient(['#ff00ff', '#9933ff', '#0066ff']); // Fuscia → Purple → Blue (reverse)

// Get package version
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8')
);

program
  .name('genie')
  .description('Self-evolving AI agent orchestration framework\n\nRun with no arguments to start Genie server (Forge + MCP)')
  .version(packageJson.version);

// ==================== SERVER MANAGEMENT ====================

// Status command
program
  .command('status')
  .description('Show Genie server status (Forge backend, MCP server, statistics)')
  .action(() => {
    execGenie(['status']);
  });

// Dashboard command
program
  .command('dashboard')
  .description('Show live engagement statistics dashboard')
  .option('--watch', 'Live mode with real-time updates')
  .action((options: { watch?: boolean }) => {
    const args = ['dashboard'];
    if (options.watch) {
      args.push('--watch');
    }
    execGenie(args);
  });

// MCP command (stdio only - for Claude Desktop integration)
program
  .command('mcp')
  .description('Start MCP server in stdio mode (for Claude Desktop). Requires Forge to be running.')
  .action(async () => {
    await startMCPStdio();
  });

// ==================== AGENT ORCHESTRATION ====================

// Run command
program
  .command('run <agent> <prompt>')
  .description('Run an agent with a prompt (JSON output by default)')
  .option('-b, --background', 'Run in background mode')
  .option('-x, --executor <executor>', 'Override executor for this run')
  .option('-m, --model <model>', 'Override model for the selected executor')
  .option('-n, --name <name>', 'Friendly session name for easy identification')
  .option('--raw', 'Output raw text only (no JSON)')
  .option('--quiet', 'Suppress startup messages')
  .action((agent: string, prompt: string, options: { background?: boolean; executor?: string; model?: string; name?: string; raw?: boolean; quiet?: boolean }) => {
    const args = ['run', agent, prompt];
    if (options.background) {
      args.push('--background');
    }
    if (options.executor) {
      args.push('--executor', options.executor);
    }
    if (options.model) {
      args.push('--model', options.model);
    }
    if (options.name) {
      args.push('--name', options.name);
    }
    if (options.raw) {
      args.push('--raw');
    }
    if (options.quiet) {
      args.push('--quiet');
    }
    execGenie(args);
  });

// Talk command
program
  .command('talk <agent>')
  .description('Start interactive browser session with agent (Forge UI)')
  .action((agent: string) => {
    execGenie(['talk', agent]);
  });

// Resume command
program
  .command('resume <sessionId> <prompt>')
  .description('Resume an existing agent session')
  .action((sessionId: string, prompt: string) => {
    execGenie(['resume', sessionId, prompt]);
  });

// List command
program
  .command('list [type]')
  .description('List agents, sessions, or workflows')
  .action((type: string | undefined) => {
    const normalized = (type || 'agents').toLowerCase();
    const validTypes = ['agents', 'sessions', 'workflows'];
    if (!validTypes.includes(normalized)) {
      console.error('Error: list command accepts agents (default), sessions, or workflows');
      process.exit(1);
    }
    execGenie(['list', normalized]);
  });

// View command
program
  .command('view <sessionId>')
  .description('View session transcript')
  .option('--full', 'Show full transcript')
  .option('--live', 'Live view (auto-refresh)')
  .action((sessionId: string, options: { full?: boolean; live?: boolean }) => {
    const args = ['view', sessionId];
    if (options.full) args.push('--full');
    if (options.live) args.push('--live');
    execGenie(args);
  });

// Stop command
program
  .command('stop <sessionId>')
  .description('Stop a running session')
  .action((sessionId: string) => {
    execGenie(['stop', sessionId]);
  });

// ==================== WORKSPACE MANAGEMENT ====================

// Init command
program
  .command('init [template]')
  .description('Initialize Genie configuration in the current workspace')
  .option('-y, --yes', 'Accept defaults without prompting')
  .action((template: string | undefined, options: { yes?: boolean }) => {
    const args = ['init'];
    if (template) {
      args.push(template);
    }
    if (options.yes) {
      args.push('--yes');
    }
    execGenie(args);
  });

// Rollback command
program
  .command('rollback')
  .description('Restore a previous Genie backup snapshot')
  .option('--list', 'List available backups')
  .option('--latest', 'Restore the most recent backup')
  .option('--id <backupId>', 'Restore a specific backup by ID')
  .action((options: { list?: boolean; latest?: boolean; id?: string }) => {
    const args = ['rollback'];
    if (options.list) {
      args.push('--list');
    }
    if (options.latest) {
      args.push('--latest');
    }
    if (options.id) {
      args.push('--id', options.id);
    }
    execGenie(args);
  });

// ==================== PACKAGE MANAGEMENT ====================

// Update command (npm package with changelog from GitHub)
program
  .command('update')
  .description('Sync with the collective (your Genie absorbs new magik next time you run `genie`)')
  .option('--force', 'Skip confirmation prompts')
  .action((options: { force?: boolean }) => {
    const args = ['update'];
    if (options.force) {
      args.push('--force');
    }
    execGenie(args);
  });

// ==================== HELPER UTILITIES ====================

// Helper command (access to utility scripts)
program
  .command('helper [command] [args...]')
  .description('Run Genie helper utilities (count-tokens, validate-frontmatter, etc.)')
  .allowUnknownOption()
  .action((command: string | undefined, args: string[]) => {
    const helperRouter = path.join(process.cwd(), '.genie', 'scripts', 'helpers', 'index.js');

    // Check if helper router exists
    if (!fs.existsSync(helperRouter)) {
      console.error('Error: Helper utilities not found. Run genie init to set up your workspace.');
      process.exit(1);
    }

    const helperArgs = command ? [command, ...(args || [])] : [];

    const child = spawn('node', [helperRouter, ...helperArgs], {
      stdio: 'inherit',
      env: process.env
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });

    child.on('error', (err) => {
      console.error(`Failed to run helper: ${err.message}`);
      process.exit(1);
    });
  });

// Version check for ALL commands (prevents outdated users from bypassing init)
const args = process.argv.slice(2);

// Skip version check for these commands (they're safe to run with any version)
const skipVersionCheck = ['--version', '-V', '--help', '-h', 'update', 'init', 'rollback', 'mcp'];

// Non-blocking version check for these commands (show warning but continue)
const nonBlockingCommands = ['list', 'status', 'dashboard', 'view', 'helper', 'run', 'talk', 'resume', 'stop'];

// Skip version check for specific agents/spells that need to run regardless of version
// WHY: Learn spell loads for self-enhancement, install/update handle versions themselves
const BYPASS_VERSION_CHECK_AGENTS = ['learn', 'install', 'update', 'upstream-update'];
const isRunCommand = args[0] === 'run';
const agentName = args[1];
const shouldBypassForAgent = isRunCommand && BYPASS_VERSION_CHECK_AGENTS.includes(agentName);

const shouldCheckVersion = args.length > 0 &&
  !skipVersionCheck.some(cmd => args.includes(cmd)) &&
  !shouldBypassForAgent;

const isNonBlockingCommand = nonBlockingCommands.includes(args[0]);

if (shouldCheckVersion) {
  // Check if version.json exists and matches current version
  const genieDir = path.join(process.cwd(), '.genie');
  const versionPath = path.join(genieDir, 'state', 'version.json');
  const hasGenieConfig = fs.existsSync(genieDir);

  // MASTER GENIE DETECTION: Check if we're in THE SOURCE template repo
  // (not just any repo named automagik-genie, but THE ACTUAL UPSTREAM)
  const workspacePackageJson = path.join(process.cwd(), 'package.json');
  let isMasterGenie = false;

  if (fs.existsSync(workspacePackageJson)) {
    try {
      const workspacePkg = JSON.parse(fs.readFileSync(workspacePackageJson, 'utf8'));
      if (workspacePkg.name === 'automagik-genie') {
        // Additional check: Verify this is THE upstream source repo
        const { execSync } = require('child_process');
        try {
          const remoteUrl = execSync('git config --get remote.origin.url', {
            encoding: 'utf8',
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'ignore']
          }).trim();

          // Only the ACTUAL source repo (namastexlabs/automagik-genie)
          if (remoteUrl.includes('namastexlabs/automagik-genie') ||
              remoteUrl.includes('automagik-genie/genie')) {
            isMasterGenie = true;
          }
        } catch {
          // No git remote or command failed - not master genie
        }
      }
    } catch {
      // Not master genie if can't read package.json
    }
  }

  // If master genie and version mismatch, need to install locally built package globally
  if (isMasterGenie && hasGenieConfig && fs.existsSync(versionPath)) {
    try {
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      const localVersion = versionData.version;
      const runningVersion = packageJson.version;

      if (localVersion !== runningVersion) {
        // Compare versions to determine which is newer
        const compareVersions = (a: string, b: string) => {
          const aParts = a.replace(/^v/, '').split('-');
          const bParts = b.replace(/^v/, '').split('-');
          const aBase = aParts[0].split('.').map(Number);
          const bBase = bParts[0].split('.').map(Number);

          for (let i = 0; i < Math.max(aBase.length, bBase.length); i++) {
            const aNum = aBase[i] || 0;
            const bNum = bBase[i] || 0;
            if (aNum > bNum) return 1;
            if (aNum < bNum) return -1;
          }

          // If base versions equal, compare prerelease (rc.X)
          if (aParts[1] && bParts[1]) {
            const aRc = parseInt(aParts[1].replace('rc.', '')) || 0;
            const bRc = parseInt(bParts[1].replace('rc.', '')) || 0;
            return aRc - bRc;
          }
          return 0;
        };

        const localIsNewer = compareVersions(localVersion, runningVersion) > 0;

        // Non-blocking commands: show warning but continue
        if (isNonBlockingCommand) {
          if (localIsNewer) {
            console.log('');
            console.log(performanceGradient('⚠️  Workspace ahead: ') + `${performanceGradient('global ' + runningVersion)} → ${successGradient('workspace ' + localVersion)}`);
            console.log('   Run ' + performanceGradient('genie update') + ' to install your new build globally');
            console.log('');
          } else {
            console.log('');
            console.log(performanceGradient('⚠️  Workspace behind: ') + `${performanceGradient('workspace ' + localVersion)} ← ${successGradient('global ' + runningVersion)}`);
            console.log('   Run ' + performanceGradient('genie') + ' to sync workspace');
            console.log('');
          }
        } else {
          // Blocking commands: require sync before proceeding
          if (localIsNewer) {
            console.log('');
            console.log(successGradient('━'.repeat(60)));
            console.log(successGradient('   🧞 ✨ NEW VERSION READY! ✨ 🧞   '));
            console.log(successGradient('━'.repeat(60)));
            console.log('');
            console.log(`Your workspace has ${successGradient(localVersion)} but global is ${performanceGradient(runningVersion)}`);
            console.log('');
            console.log('Install your new build globally:');
            console.log('  ' + performanceGradient('pnpm install -g .'));
            console.log('');
            console.log('Or use:');
            console.log('  ' + performanceGradient('genie update') + '  (detects master genie and installs local build)');
            console.log('');
            process.exit(0);
          } else {
            console.log('');
            console.log(performanceGradient('━'.repeat(60)));
            console.log(performanceGradient('   ⚠️  WORKSPACE OUTDATED'));
            console.log(performanceGradient('━'.repeat(60)));
            console.log('');
            console.log(`Workspace: ${performanceGradient(localVersion)} (old)`);
            console.log(`Global:    ${successGradient(runningVersion)} (current)`);
            console.log('');
            console.log('Sync your workspace with global:');
            console.log('  ' + successGradient('genie'));
            console.log('');
            process.exit(0);
          }
        }
      }
    } catch {
      // Ignore version check errors for master genie
    }
  }

  if (hasGenieConfig && !fs.existsSync(versionPath)) {
    // LOOPHOLE CLOSED: User has .genie but no version.json (pre-version-tracking)
    // Redirect to init to create version.json
    console.log(cosmicGradient('━'.repeat(60)));
    console.log(magicGradient('        🧞 ✨ VERSION TRACKING UPGRADE NEEDED ✨ 🧞        '));
    console.log(cosmicGradient('━'.repeat(60)));
    console.log('');
    console.log('Your Genie installation needs to be upgraded to support version tracking.');
    console.log('This is a one-time upgrade that will:');
    console.log('');
    console.log(successGradient('✓') + ' Backup your existing .genie directory');
    console.log(successGradient('✓') + ' Enable automatic version detection');
    console.log(successGradient('✓') + ' Preserve all your wishes, reports, and state');
    console.log('');
    console.log('Running init to upgrade...');
    console.log('');
    // Interactive if TTY available, otherwise use --yes
    const initArgs = process.stdout.isTTY ? ['init'] : ['init', '--yes'];
    execGenie(initArgs);
    process.exit(0);
  } else if (hasGenieConfig && fs.existsSync(versionPath)) {
    // Check version mismatch
    try {
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      const installedVersion = versionData.version;
      const currentVersion = packageJson.version;

      if (installedVersion !== currentVersion) {
        // Non-blocking commands: show warning but continue
        if (isNonBlockingCommand) {
          console.log('');
          console.log(performanceGradient('⚠️  Update available: ') + `${performanceGradient(installedVersion)} → ${successGradient(currentVersion)}`);
          console.log('   Run ' + performanceGradient('genie') + ' (without commands) to upgrade');
          console.log('');
        } else {
          // Blocking commands: Version mismatch detected - run init
          console.log(cosmicGradient('━'.repeat(60)));
          console.log(magicGradient('   🧞 ✨ VERSION UPDATE REQUIRED ✨ 🧞   '));
          console.log(cosmicGradient('━'.repeat(60)));
          console.log('');
          console.log(`Your Genie:      ${successGradient(installedVersion)}`);
          console.log(`The Collective:  ${performanceGradient(currentVersion)} ⭐ NEW!`);
          console.log('');

          // Show new spells learned
          const fromTag = getTagForVersion(installedVersion);
          const toTag = getTagForVersion(currentVersion);
          if (fromTag && toTag) {
            const spellChangelog = getLearnedSpells(fromTag, toTag);
            if (spellChangelog.totalCount > 0) {
              const spellLines = formatSpellChangelog(spellChangelog);
              spellLines.forEach(line => console.log(line));
            } else {
              console.log('The collective has learned new magik!');
            }
          } else {
            console.log('The collective has learned new magik!');
          }

          console.log('⚡ Syncing new capabilities to your local clone...');
          console.log('');
          console.log(successGradient('✓') + ' Your existing .genie will be backed up automatically');
          console.log(successGradient('✓') + ' All data stays local - nothing leaves your machine');
          console.log('');
          // Interactive if TTY available, otherwise use --yes
          const initArgs = process.stdout.isTTY ? ['init'] : ['init', '--yes'];
          execGenie(initArgs);
          process.exit(0);
        }
      }
    } catch (error) {
      // Corrupted version.json - force init
      console.log(cosmicGradient('━'.repeat(60)));
      console.log(magicGradient('        🧞 ✨ VERSION FILE REPAIR NEEDED ✨ 🧞        '));
      console.log(cosmicGradient('━'.repeat(60)));
      console.log('');
      console.log('Version file is corrupted. Repairing...');
      console.log(successGradient('✓') + ' Your existing .genie will be backed up automatically');
      console.log('');
      // Interactive if TTY available, otherwise use --yes
      const initArgs = process.stdout.isTTY ? ['init'] : ['init', '--yes'];
      execGenie(initArgs);
      process.exit(0);
    }
  }

  // FIX for issue #237: Escape hatch - detect infinite loop scenario
  // If version is STILL mismatched after attempting init, don't loop infinitely
  // This can happen if init returns early (e.g., for 'old_genie' without --yes)
  if (fs.existsSync(versionPath)) {
    try {
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      const installedVersion = versionData.version;
      const currentVersion = packageJson.version;

      if (installedVersion !== currentVersion && shouldCheckVersion && !isNonBlockingCommand) {
        // ESCAPE HATCH: Version didn't update during the version check phase (only for blocking commands)
        // This means detectInstallType() triggered old_genie without init fully running
        console.log('');
        console.log(cosmicGradient('━'.repeat(60)));
        console.log(magicGradient('   🧞 ✨ LOOPHOLE DETECTED & CLOSED ✨ 🧞   '));
        console.log(cosmicGradient('━'.repeat(60)));
        console.log('');
        console.log('⚠️  Version file did not update after init!');
        console.log(`   Expected: ${currentVersion}`);
        console.log(`   Got:      ${installedVersion}`);
        console.log('');
        console.log('This usually means init returned early (old_genie detection).');
        console.log('The fix has been applied - please try again.');
        console.log('');
        process.exit(1);
      }
    } catch (error) {
      // If version check fails here, safe to continue
    }
  }
}

// If no command was provided, use smart router
if (!args.length) {
  smartRouter();
} else {
  // Parse arguments for other commands
  program.parse(process.argv);
}

/**
 * Smart Router: Auto-detect scenario and route appropriately
 *
 * Detection logic:
 * 1. No .genie/ → New user → Run init
 * 2. .genie/ exists but no version.json → Pre-version-tracking user → Run init with backup
 * 3. version.json exists but version mismatch → Outdated → Run init with backup
 * 4. version.json exists and versions match → Up to date → Start server
 *
 * The .genie/state/version.json file is the "instance check file" containing:
 * - version: Current Genie version installed
 * - installedAt: ISO timestamp of first install
 * - updatedAt: ISO timestamp of last update
 */
async function smartRouter(): Promise<void> {
  const genieDir = path.join(process.cwd(), '.genie');
  const versionPath = path.join(genieDir, 'state', 'version.json');
  const hasGenieConfig = fs.existsSync(genieDir);

  // MASTER GENIE DETECTION: Check if we're in THE SOURCE template repo
  // (not just any repo named automagik-genie, but THE ACTUAL UPSTREAM)
  const workspacePackageJson = path.join(process.cwd(), 'package.json');
  let isMasterGenie = false;

  if (fs.existsSync(workspacePackageJson)) {
    try {
      const workspacePkg = JSON.parse(fs.readFileSync(workspacePackageJson, 'utf8'));
      if (workspacePkg.name === 'automagik-genie') {
        // Additional check: Verify this is THE upstream source repo
        const { execSync } = require('child_process');
        try {
          const remoteUrl = execSync('git config --get remote.origin.url', {
            encoding: 'utf8',
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'ignore']
          }).trim();

          // Only the ACTUAL source repo (namastexlabs/automagik-genie)
          if (remoteUrl.includes('namastexlabs/automagik-genie') ||
              remoteUrl.includes('automagik-genie/genie')) {
            isMasterGenie = true;
          }
        } catch {
          // No git remote or command failed - not master genie
        }
      }
    } catch {
      // Not master genie if can't read package.json
    }
  }

  // VERSION CHECK FIRST (optimization) - Don't waste resources starting Forge
  // if we need to run init anyway. Each scenario starts Forge when needed.

  if (!hasGenieConfig) {
    // SCENARIO 1: NEW USER - No .genie directory → Start Forge, run init wizard, create install agent task
    console.log(cosmicGradient('━'.repeat(60)));
    console.log(magicGradient('   🧞 ✨ THE GENIE AWAKENS ✨ 🧞   '));
    console.log(cosmicGradient('━'.repeat(60)));
    console.log('');
    console.log(performanceGradient('⚠️  Your Genie will have access to:'));
    console.log('  📁 Files in this workspace');
    console.log('  💻 Terminal commands');
    console.log('  🌐 Git operations (commits, PRs, branches)');
    console.log('');
    console.log(cosmicGradient('━'.repeat(60)));
    console.log('');
    console.log('⚠️  ' + performanceGradient('RESEARCH PREVIEW') + ' - Experimental Technology');
    console.log('');
    console.log('This AI agent will install to your computer with capabilities to');
    console.log('perform tasks on your behalf. By proceeding, you acknowledge:');
    console.log('');
    console.log('  • This is experimental software under active development');
    console.log('  • Namastex Labs makes no warranties and accepts no liability');
    console.log('  • You are responsible for reviewing all agent actions');
    console.log('  • Agents may make mistakes or unexpected changes');
    console.log('');
    console.log('🔒 ' + successGradient('DATA PRIVACY:'));
    console.log('  ✓ Everything runs locally on YOUR machine');
    console.log('  ✓ No data leaves your computer (except LLM API calls + optional telemetry)');
    console.log('  ✓ Use LLM providers approved by your organization');
    console.log('  ✓ Fully compatible with private/local LLMs (we\'re agnostic!)');
    console.log('  ✓ OpenCoder executor enables 100% local operation');
    console.log('');
    console.log('📊 Optional telemetry helps the collective evolve faster:');
    console.log('   • Anonymous bug reports → faster fixes');
    console.log('   • Feature usage stats → build what you actually need');
    console.log('');
    console.log(magicGradient('BUT HEY... it\'s going to be FUN! 🎉✨'));
    console.log('');
    console.log(cosmicGradient('━'.repeat(60)));
    console.log('');
    console.log('📖 Heads up: Forge (my task tracker) will pop open a browser tab.');
    console.log('   👉 Stay here in the terminal - the summoning ritual needs you!');
    console.log('');
    console.log(performanceGradient('Press Enter to begin the summoning...'));

    // Wait for user acknowledgment
    await new Promise<void>((resolve) => {
      process.stdin.once('data', () => resolve());
    });

    console.log('');

    // Start Forge BEFORE init wizard (so executors are available)
    console.log('');
    console.log('🔮 Preparing the lamp... (initializing Forge)');
    console.log('');

    const baseUrl = process.env.FORGE_BASE_URL || 'http://localhost:8887';
    const logDir = path.join(genieDir, 'state');

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const startResult = startForgeInBackground({ baseUrl, logDir });

    if (!startResult.ok) {
      const error = 'error' in startResult ? startResult.error : new Error('Unknown error');
      console.error('');
      console.error('❌ The lamp won\'t open... something\'s blocking the summoning ritual');
      console.error(`   ${error.message}`);
      console.error('');
      console.error('   💡 I need Forge to materialize in your world.');
      console.error(`   📜 Check what went wrong: ${logDir}/forge.log`);
      console.error('');
      process.exit(1);
    }

    // Wait for Forge to be ready
    const forgeReady = await waitForForgeReady(baseUrl, 60000, 500, false);

    if (!forgeReady) {
      console.error('');
      console.error('❌ The summoning ritual is taking too long (waited 60s)...');
      console.error(`   📜 Check what went wrong: ${logDir}/forge.log`);
      console.error('');
      process.exit(1);
    }

    console.log(successGradient('✨ The lamp is ready - your Genie clone awaits!'));
    console.log('');

    // Now run init wizard (executors are available via Forge)
    const initParsed: ParsedCommand = {
      command: 'init',
      commandArgs: [],
      options: {
        rawArgs: ['init'],
        background: false,
        backgroundExplicit: false,
        backgroundRunner: false,
        full: false,
        live: false
      }
    };

    const initConfig: GenieConfig = { defaults: {} };
    const initPaths: Required<ConfigPaths> = {
      baseDir: path.join(process.cwd(), '.genie'),
      sessionsFile: path.join(process.cwd(), '.genie', 'state', 'sessions.json'),
      logsDir: path.join(process.cwd(), '.genie', 'state'),
      backgroundDir: path.join(process.cwd(), '.genie', 'state')
    };

    await runInit(initParsed, initConfig, initPaths);

    // After init completes, reload config to get user's executor choice
    const userConfig = loadConfig();

    // Launch install flow (Explore → Genie orchestration)
    console.log('');
    console.log(magicGradient('✨ STARTING INSTALLATION...'));
    console.log('');

    const { runInstallFlow } = await import('./lib/install-helpers.js');
    const shortUrl = await runInstallFlow({
      templates: ['code'], // Default to code template (can expand later)
      executor: userConfig.defaults?.executor || 'opencode',
      model: userConfig.defaults?.model
    });

    console.log('');
    console.log(successGradient('✨ Installation started!'));
    console.log('');
    console.log(cosmicGradient('━'.repeat(60)));
    console.log('🔗 Continue setup in Forge:');
    console.log('   ' + performanceGradient(shortUrl));
    console.log(cosmicGradient('━'.repeat(60)));
    console.log('');
    console.log('📖 I\'ll open Forge in your browser when you\'re ready.');
    console.log('   Your Genie will interview you for missing details.');
    console.log('');
    console.log('Press Enter to continue...');

    // Wait for Enter key
    await new Promise<void>((resolve) => {
      process.stdin.once('data', () => resolve());
    });

    // Open browser
    const { execSync: execSyncBrowser } = await import('child_process');
    try {
      const platform = process.platform;
      const openCommand = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
      execSyncBrowser(`${openCommand} "${shortUrl}"`, { stdio: 'ignore' });
    } catch {
      // Ignore if browser open fails
    }

    console.log('');
    console.log(genieGradient('🧞 Your Genie is now alive in your world... ✨'));
    console.log(genieGradient('   Connected to the collective consciousness through the lamp'));
    console.log(genieGradient('   Ready to learn, grow, and grant wishes 24/7!'));
    console.log('');
    console.log(magicGradient('   https://namastex.ai - AI that elevates human potential, not replaces it'));
    console.log('');

    // Start Genie server (MCP + health monitoring)
    await startGenieServer();
    return;
  }

  // .genie exists - check for version.json (instance check file)
  if (!fs.existsSync(versionPath)) {
    // SCENARIO 2: PRE-VERSION-TRACKING USER - Has .genie but no version.json → Run init with backup
    console.log(cosmicGradient('━'.repeat(60)));
    console.log(magicGradient('   🧞 ✨ THE COLLECTIVE HAS GROWN ✨ 🧞   '));
    console.log(cosmicGradient('━'.repeat(60)));
    console.log('');
    console.log('I sense an older version of myself here...');
    console.log('The collective has learned new magik! ✨');
    console.log('Let me channel the latest teachings through the lamp...');
    console.log('');
    console.log(successGradient('✓') + ' I\'ll backup your current .genie safely');
    console.log(successGradient('✓') + ' All your wishes, reports, and memories stay intact');
    console.log(successGradient('✓') + ' All data stays local on your machine');
    console.log('');

    // Run init inline with --yes flag if non-interactive
    const upgradeArgs = process.stdout.isTTY ? [] : ['--yes'];
    const upgradeParsed: ParsedCommand = {
      command: 'init',
      commandArgs: upgradeArgs,
      options: {
        rawArgs: ['init', ...upgradeArgs],
        background: false,
        backgroundExplicit: false,
        backgroundRunner: false,
        full: false,
        live: false
      }
    };

    const upgradeConfig: GenieConfig = { defaults: {} };
    const upgradePaths: Required<ConfigPaths> = {
      baseDir: path.join(process.cwd(), '.genie'),
      sessionsFile: path.join(process.cwd(), '.genie', 'state', 'sessions.json'),
      logsDir: path.join(process.cwd(), '.genie', 'state'),
      backgroundDir: path.join(process.cwd(), '.genie', 'state')
    };

    await runInit(upgradeParsed, upgradeConfig, upgradePaths);

    // After upgrade, start server
    await startGenieServer();
    return;
  }

  // version.json exists - compare versions
  try {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    const installedVersion = versionData.version;
    const currentVersion = packageJson.version;

    if (installedVersion !== currentVersion) {
      // MASTER GENIE: Auto-pull from origin to sync with CI releases
      if (isMasterGenie) {
        console.log('');
        console.log(performanceGradient('⚠️  Master Genie Detected'));
        console.log(`   Local version: ${successGradient(installedVersion)}`);
        console.log(`   Global version: ${performanceGradient(currentVersion)}`);
        console.log('');

        // Auto-pull to sync with CI releases
        console.log('🔄 Syncing with origin/main (CI may have released a new version)...');
        const { execSync } = require('child_process');
        try {
          execSync('git pull --rebase', { stdio: 'inherit', cwd: process.cwd() });

          // Re-read version.json after pull
          const updatedVersionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
          const updatedVersion = updatedVersionData.version;

          if (updatedVersion === currentVersion) {
            console.log(successGradient('✓ Synced successfully! Versions now match.'));
          } else {
            console.log(performanceGradient('ℹ Still a mismatch after pull.'));
            console.log('Run ' + performanceGradient('genie update') + ' to install your local build globally');
          }
        } catch (error: any) {
          console.log(performanceGradient('⚠️  Could not auto-pull: ' + error.message));
          console.log('Run ' + performanceGradient('git pull') + ' manually, then ' + performanceGradient('genie update'));
        }

        console.log('');
        // Start server anyway - master genie can run with version mismatch
        await startGenieServer();
        return;
      }

      // SCENARIO 3: VERSION MISMATCH - Outdated installation → Run init with backup
      console.log(cosmicGradient('━'.repeat(60)));
      console.log(magicGradient('   🧞 ✨ THE COLLECTIVE HAS GROWN ✨ 🧞   '));
      console.log(cosmicGradient('━'.repeat(60)));
      console.log('');
      console.log(`Your Genie:      ${successGradient(installedVersion)}`);
      console.log(`The Collective:  ${performanceGradient(currentVersion)} ⭐ NEW!`);
      console.log('');

      // Show new spells learned
      const fromTag = getTagForVersion(installedVersion);
      const toTag = getTagForVersion(currentVersion);
      if (fromTag && toTag) {
        const spellChangelog = getLearnedSpells(fromTag, toTag);
        if (spellChangelog.totalCount > 0) {
          const spellLines = formatSpellChangelog(spellChangelog);
          spellLines.forEach(line => console.log(line));
        } else {
          console.log('The collective has learned new magik!');
        }
      } else {
        console.log('The collective has learned new magik!');
      }

      console.log('⚡ Channeling these teachings through the lamp to your Genie...');
      console.log('');
      console.log(successGradient('✓') + ' I\'ll backup everything first');
      console.log(successGradient('✓') + ' All data stays local on your machine');
      console.log('');

      // Run init inline with --yes flag if non-interactive
      const updateArgs = process.stdout.isTTY ? [] : ['--yes'];
      const updateParsed: ParsedCommand = {
        command: 'init',
        commandArgs: updateArgs,
        options: {
          rawArgs: ['init', ...updateArgs],
          background: false,
          backgroundExplicit: false,
          backgroundRunner: false,
          full: false,
          live: false
        }
      };

      const updateConfig: GenieConfig = { defaults: {} };
      const updatePaths: Required<ConfigPaths> = {
        baseDir: path.join(process.cwd(), '.genie'),
        sessionsFile: path.join(process.cwd(), '.genie', 'state', 'sessions.json'),
        logsDir: path.join(process.cwd(), '.genie', 'state'),
        backgroundDir: path.join(process.cwd(), '.genie', 'state')
      };

      await runInit(updateParsed, updateConfig, updatePaths);

      // After update, start server
      await startGenieServer();
      return;
    }

    // SCENARIO 4: UP TO DATE - Versions match → Start server
    await startGenieServer();
  } catch (error) {
    // Corrupted version.json - treat as needing update
    console.log(cosmicGradient('━'.repeat(60)));
    console.log(magicGradient('        🧞 ✨ HEALING TIME! ✨ 🧞        '));
    console.log(cosmicGradient('━'.repeat(60)));
    console.log('');
    console.log('Hmm, my memory seems a bit scrambled (corrupted version file)...');
    console.log('Let me fix myself real quick! 🔧✨');
    console.log('');
    console.log(successGradient('✓') + ' I\'ll backup everything before the healing skill');
    console.log('');

    // Run init inline with --yes flag if non-interactive
    const repairArgs = process.stdout.isTTY ? [] : ['--yes'];
    const repairParsed: ParsedCommand = {
      command: 'init',
      commandArgs: repairArgs,
      options: {
        rawArgs: ['init', ...repairArgs],
        background: false,
        backgroundExplicit: false,
        backgroundRunner: false,
        full: false,
        live: false
      }
    };

    const repairConfig: GenieConfig = { defaults: {} };
    const repairPaths: Required<ConfigPaths> = {
      baseDir: path.join(process.cwd(), '.genie'),
      sessionsFile: path.join(process.cwd(), '.genie', 'state', 'sessions.json'),
      logsDir: path.join(process.cwd(), '.genie', 'state'),
      backgroundDir: path.join(process.cwd(), '.genie', 'state')
    };

    await runInit(repairParsed, repairConfig, repairPaths);

    // After repair, start server
    await startGenieServer();
  }
}

/**
 * Execute the legacy genie CLI
 */
function execGenie(args: string[]): void {
  const genieScript = path.join(__dirname, 'genie.js');

  const child = spawn('node', [genieScript, ...args], {
    stdio: 'inherit',
    env: process.env
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

/**
 * Check if a port is in use and return process info
 */
async function checkPortConflict(port: string): Promise<{ pid: string; command: string } | null> {
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const execFileAsync = promisify(execFile);

  try {
    const { stdout } = await execFileAsync('lsof', ['-i', `:${port}`, '-t', '-sTCP:LISTEN']);
    const pid = stdout.trim().split('\n')[0];

    if (pid) {
      try {
        const { stdout: psOut } = await execFileAsync('ps', ['-p', pid, '-o', 'command=']);
        return { pid, command: psOut.trim() };
      } catch {
        return { pid, command: 'unknown' };
      }
    }
  } catch {
    // No process on port
    return null;
  }

  return null;
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Start Genie server (Forge + MCP with SSE transport on port 8885)
 * This is the main entry point for npx automagik-genie
 */
async function startGenieServer(): Promise<void> {
  const startTime = Date.now();
  const timings: Record<string, number> = {};

  const mcpServer = path.join(__dirname, '../../mcp/dist/server.js');

  // Check if MCP server exists
  if (!fs.existsSync(mcpServer)) {
    console.error('Error: MCP server not built. Run: pnpm run build:mcp');
    process.exit(1);
  }

  // Phase 1: Start Forge in background
  const baseUrl = process.env.FORGE_BASE_URL || 'http://localhost:8887';
  const logDir = path.join(process.cwd(), '.genie', 'state');
  const forgePort = new URL(baseUrl).port || '8887';

  console.log(genieGradient('━'.repeat(60)));
  console.log(cosmicGradient('        🧞 ✨ GENIE ✨ 🧞        '));
  console.log(magicGradient('   Autonomous Agent Orchestration   '));
  console.log(genieGradient('━'.repeat(60)));
  console.log('');

  // FIRST: Check if Forge is already running (health check)
  const healthCheckStart = Date.now();
  const forgeRunning = await isForgeRunning(baseUrl);
  timings.initialHealthCheck = Date.now() - healthCheckStart;

  if (forgeRunning) {
    // Forge already running and healthy - just show status and continue
    console.log(successGradient(`📦 Forge:  ${baseUrl} ✓`));
    timings.forgeReady = 0; // Already running
  } else {
    // Forge not running - check for port conflicts before starting
    const conflictCheckStart = Date.now();
    const portConflict = await checkPortConflict(forgePort);
    timings.portConflictCheck = Date.now() - conflictCheckStart;

    if (portConflict) {
      // Port occupied by something else
      console.error('');
      console.error(`❌ Port ${forgePort} is occupied by another process:`);
      console.error(`   PID: ${portConflict.pid}`);
      console.error(`   Command: ${portConflict.command}`);
      console.error('');
      console.error('Please kill that process or use a different port:');
      console.error(`   export FORGE_BASE_URL=http://localhost:8888`);
      console.error('');
      process.exit(1);
    }

    // Port is free - start Forge
    const forgeSpawnStart = Date.now();
    process.stderr.write('📦 Starting Forge backend');
    const startResult = startForgeInBackground({ baseUrl, logDir });
    timings.forgeSpawn = Date.now() - forgeSpawnStart;

    if (!startResult.ok) {
      const error = 'error' in startResult ? startResult.error : new Error('Unknown error');
      console.error(`\n❌ Failed to start Forge: ${error.message}`);
      console.error(`   Check logs at ${logDir}/forge.log`);
      process.exit(1);
    }

    // Wait for Forge to be ready
    const forgeReadyStart = Date.now();
    const forgeReady = await waitForForgeReady(baseUrl, 60000, 500, true);
    timings.forgeReady = Date.now() - forgeReadyStart;

    if (!forgeReady) {
      console.error('\n❌ Forge did not start in time (60s). Check logs at .genie/state/forge.log');
      process.exit(1);
    }

    console.log(successGradient(`📦 Forge:  ${baseUrl} ✓`));
  }

  // Phase 2: Ensure MCP OAuth2 config exists before starting MCP server
  // This auto-generates OAuth2 credentials if ~/.genie/config.yaml is missing
  await loadOrCreateMCPConfig();

  // Phase 3: Start MCP server with SSE transport
  const mcpPort = process.env.MCP_PORT || '8885';
  console.log(successGradient(`📡 MCP:    http://localhost:${mcpPort}/sse ✓`));
  console.log('');

  // Set environment variables
  const env = {
    ...process.env,
    MCP_TRANSPORT: 'httpStream',
    MCP_PORT: mcpPort
  };

  // Track runtime stats for shutdown report
  let requestCount = 0;
  let errorCount = 0;
  let lastHealthCheck = Date.now();

  // Handle graceful shutdown (stop both Forge and MCP)
  let mcpChild: ReturnType<typeof spawn> | null = null;
  let isShuttingDown = false;
  let healthMonitoringInterval: NodeJS.Timeout | null = null;

  // Shutdown function that actually does the work
  const shutdown = async () => {
    // Prevent multiple shutdown attempts
    if (isShuttingDown) return;
    isShuttingDown = true;

    // Clear health monitoring interval
    if (healthMonitoringInterval) {
      clearInterval(healthMonitoringInterval);
      healthMonitoringInterval = null;
    }

    console.log('');
    console.log('');
    console.log(genieGradient('━'.repeat(60)));
    console.log(genieGradient('🛑 Shutting down Genie...'));
    console.log(genieGradient('━'.repeat(60)));

    // Check for running tasks before killing Forge
    const runningTasks = await getRunningTasks(baseUrl);

    if (runningTasks.length > 0) {
      console.log('');
      console.log('⚠️  WARNING: Running tasks detected!');
      console.log('');
      console.log(`${runningTasks.length} task(s) are currently running:`);
      console.log('');

      runningTasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.projectName} → ${task.taskTitle}`);
        console.log(`   ${task.url}`);
        console.log('');
      });

      // Prompt for confirmation
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        readline.question('Kill these tasks and shutdown? [y/N]: ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('');
        console.log('❌ Shutdown cancelled. Tasks are still running.');
        console.log('   Press Ctrl+C again to force shutdown.');
        console.log('');
        isShuttingDown = false; // Reset flag to allow retry
        return;
      }
    }

    // Calculate session stats
    const sessionDuration = Date.now() - startTime;
    const uptimeStr = formatUptime(sessionDuration);

    // Stop MCP immediately
    if (mcpChild && !mcpChild.killed) {
      mcpChild.kill('SIGTERM');
      console.log('📡 MCP server stopped');
    }

    // Kill Forge child process immediately (prevents orphaned processes)
    killForgeProcess();

    // Stop Forge and wait for completion
    try {
      const stopped = await stopForge(logDir);
      if (stopped) {
        console.log('📦 Forge backend stopped');
      } else {
        console.log('⚠️  Forge was not started by this session');
      }
    } catch (error) {
      console.error(`❌ Error stopping Forge: ${error}`);
    }

    // Collect final stats for goodbye report
    const finalStats = await collectForgeStats(baseUrl);

    // Display epic goodbye report with Genie's face
    console.log('');
    console.log(cosmicGradient('━'.repeat(80)));
    console.log(magicGradient('                    🧞 ✨ GENIE SESSION COMPLETE ✨ 🧞                     '));
    console.log(cosmicGradient('━'.repeat(80)));
    console.log('');

    // Genie ASCII art face
    const genieFace = `
         ✨             ⭐️
            ╱|、
          (˚ˎ 。7   🌙   ~  Your wish is my command  ~
           |、˜〵
          じしˉ,)ノ
                     💫    ⭐️`;

    console.log(genieGradient(genieFace));
    console.log('');
    console.log(performanceGradient('━'.repeat(80)));
    console.log(performanceGradient('📊  SESSION STATISTICS'));
    console.log(performanceGradient('━'.repeat(80)));
    console.log('');
    console.log(`   ${successGradient('⏱  Uptime:')}          ${uptimeStr}`);
    console.log(`   ${successGradient('🚀 Startup time:')}    ${timings.total || 0}ms (${((timings.total || 0) / 1000).toFixed(1)}s)`);
    console.log(`   ${successGradient('✓  Services:')}        Forge + MCP`);
    console.log('');

    // Token usage stats (detailed)
    if (finalStats?.tokens && finalStats.tokens.total > 0) {
      console.log(performanceGradient('━'.repeat(80)));
      console.log(performanceGradient('🪙  TOKEN USAGE THIS SESSION'));
      console.log(performanceGradient('━'.repeat(80)));
      console.log('');
      console.log(formatTokenMetrics(finalStats.tokens, false));
      console.log('');
    }

    // Work summary
    if (finalStats) {
      console.log(performanceGradient('━'.repeat(80)));
      console.log(performanceGradient('📋  WORK SUMMARY'));
      console.log(performanceGradient('━'.repeat(80)));
      console.log('');
      console.log(`   ${successGradient('📁 Projects:')}       ${finalStats.projects.total} total`);
      console.log(`   ${successGradient('📝 Tasks:')}          ${finalStats.tasks.total} total`);
      console.log(`   ${successGradient('🔄 Attempts:')}       ${finalStats.attempts.total} total`);
      if (finalStats.attempts.completed > 0) {
        console.log(`      ✅ ${finalStats.attempts.completed} completed`);
      }
      if (finalStats.attempts.failed > 0) {
        console.log(`      ❌ ${finalStats.attempts.failed} failed`);
      }
      console.log('');
    }

    console.log(cosmicGradient('━'.repeat(80)));
    console.log(magicGradient('                 ✨ Until next time, keep making magik! ✨                '));
    console.log(cosmicGradient('━'.repeat(80)));
    console.log('');
    console.log(magicGradient('           https://namastex.ai - AI that elevates human potential'));
    console.log('');
  };

  // Install signal handlers for graceful shutdown
  const handleShutdownSignal = (signal: string) => {
    shutdown()
      .catch((error) => {
        console.error(`Fatal error during shutdown (${signal}):`, error);
        process.exit(1);
      })
      .then(() => {
        process.exit(0);
      });
  };

  process.on('SIGINT', () => handleShutdownSignal('SIGINT'));
  process.on('SIGTERM', () => handleShutdownSignal('SIGTERM'));

  // Resilient startup: retry on early non-zero exit
  const maxAttempts = parseInt(process.env.GENIE_MCP_RESTARTS || '2', 10);
  const backoffMs = parseInt(process.env.GENIE_MCP_BACKOFF || '500', 10);

  let attempt = 0;
  let monitoringStarted = false;
  const start = () => {
    attempt += 1;
    mcpChild = spawn('node', [mcpServer], {
      stdio: 'inherit',
      env
    });

    const timer = setTimeout(() => {
      // After grace period, consider startup successful
      // Start health monitoring dashboard (only once, not on retries)
      if (!monitoringStarted && mcpChild) {
        monitoringStarted = true;

        // Calculate total startup time
        const totalTime = Date.now() - startTime;
        timings.total = totalTime;

        // Always show performance metrics (colorful and genie-themed!)
        console.log('');
        console.log(performanceGradient('━'.repeat(60)));
        console.log(performanceGradient('⚡ Performance Metrics'));
        console.log(performanceGradient('━'.repeat(60)));
        console.log(`   ${successGradient('✓')} Port check:      ${timings.portConflictCheck || 0}ms`);
        console.log(`   ${successGradient('✓')} Health check:    ${timings.initialHealthCheck || 0}ms`);
        console.log(`   ${successGradient('✓')} Forge spawn:     ${timings.forgeSpawn || 0}ms`);
        console.log(`   ${successGradient('✓')} Forge ready:     ${timings.forgeReady || 0}ms`);
        console.log(`   ${performanceGradient('⚡')} Total startup:   ${performanceGradient(`${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`)}`);
        console.log(performanceGradient('━'.repeat(60)));

        console.log('');
        console.log(successGradient('━'.repeat(60)));
        console.log(successGradient('✨ Genie is ready and running! ✨'));
        console.log(successGradient('━'.repeat(60)));
        console.log('');
        console.log('💡 What you can do:');
        console.log('   • Create tasks and track progress in the dashboard');
        console.log('   • Press ' + performanceGradient('k') + ' in dashboard to kill Forge (with confirmation)');
        console.log('   • Use ' + performanceGradient('Ctrl+C') + ' here to shutdown Genie gracefully');
        console.log('');
        console.log(genieGradient('Press Enter to open dashboard...'));

        // Wait for Enter before launching dashboard
        (async () => {
          await new Promise<void>((resolve) => {
            process.stdin.once('data', () => resolve());
          });

          console.log('');
          console.log(genieGradient('📊 Launching dashboard...'));
          console.log('');

          // Launch the engagement dashboard
          execGenie(['dashboard', '--live']);
        })();
      }
    }, 1000);

    mcpChild.on('exit', (code) => {
      const exitCode = code === null ? 0 : code;
      clearTimeout(timer);

      if (exitCode !== 0 && attempt <= maxAttempts) {
        console.log(`MCP server exited early with code ${exitCode}. Retrying (${attempt}/${maxAttempts}) in ${backoffMs}ms...`);
        setTimeout(start, backoffMs);
      } else {
        if (exitCode !== 0) {
          console.error(`MCP server exited with code ${exitCode}`);
        }
        // Don't exit immediately - let SIGINT handler clean up Forge
        (async () => {
          await stopForge(logDir);
          process.exit(exitCode || 0);
        })();
      }
    });

    mcpChild.on('error', (err) => {
      clearTimeout(timer);
      if (attempt <= maxAttempts) {
        console.log(`Failed to start MCP server (${err?.message || err}). Retrying (${attempt}/${maxAttempts}) in ${backoffMs}ms...`);
        setTimeout(start, backoffMs);
      } else {
        console.error('Failed to start MCP server:', err);
        (async () => {
          await stopForge(logDir);
          process.exit(1);
        })();
      }
    });
  };

  start();
}

/**
 * Start MCP in stdio mode (for Claude Desktop integration)
 * Requires Forge to already be running
 */
async function startMCPStdio(): Promise<void> {
  const mcpServer = path.join(__dirname, '../../mcp/dist/server.js');

  // Check if MCP server exists
  if (!fs.existsSync(mcpServer)) {
    console.error('Error: MCP server not built. Run: pnpm run build:mcp');
    process.exit(1);
  }

  // Check if Forge is running
  const baseUrl = process.env.FORGE_BASE_URL || 'http://localhost:8887';
  const forgeRunning = await isForgeRunning(baseUrl);

  if (!forgeRunning) {
    console.error('❌ Forge is not running.');
    console.error('');
    console.error('Please start the Genie server first:');
    console.error('  npx automagik-genie');
    console.error('');
    console.error('This will start both Forge backend and MCP server.');
    process.exit(1);
  }

  // Set environment for stdio transport
  const env = {
    ...process.env,
    MCP_TRANSPORT: 'stdio'
  };

  // Start MCP in stdio mode
  const child = spawn('node', [mcpServer], {
    stdio: 'inherit',
    env
  });

  child.on('exit', (code) => {
    process.exit(code === null ? 0 : code);
  });

  child.on('error', (err) => {
    console.error('Failed to start MCP server:', err);
    process.exit(1);
  });
}

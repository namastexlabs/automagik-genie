/**
 * Workflow Validation Commands
 *
 * CLI commands for running workflow automation scripts
 */

import type { ParsedCommand, GenieConfig, ConfigPaths } from '../lib/types';
import {
  detectTeachingSignal,
  logBlocker,
  validateRole,
  trackPromise,
  areWorkflowScriptsAvailable
} from '../lib/workflow-scripts';

export async function runWorkflowCommand(
  parsed: ParsedCommand,
  config: GenieConfig,
  paths: Required<ConfigPaths>
): Promise<void> {
  const [subcommand, ...args] = parsed.commandArgs;

  if (!areWorkflowScriptsAvailable()) {
    console.error('Error: Workflow scripts not found in .genie/custom/workflow-scripts/');
    console.error('Please ensure scripts are installed.');
    process.exit(1);
  }

  const verbose = parsed.options.verbose === true;

  try {
    switch (subcommand) {
      case 'teach':
        await runTeachingDetection(args, verbose);
        break;

      case 'blocker':
        await runBlockerLog(args, verbose);
        break;

      case 'role':
        await runRoleValidation(args, verbose);
        break;

      case 'promise':
        await runPromiseTracking(args, verbose);
        break;

      case 'help':
      default:
        printWorkflowHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function runTeachingDetection(args: string[], verbose: boolean): Promise<void> {
  if (args.length === 0) {
    console.error('Usage: genie workflow teach <message>');
    console.error('Example: genie workflow teach "Let me teach you something"');
    process.exit(1);
  }

  const message = args.join(' ');
  const result = await detectTeachingSignal(message, { verbose });

  if (verbose || !result.detected) {
    console.log(JSON.stringify(result, null, 2));
  }

  if (result.detected) {
    console.error(`\n✅ Teaching signal detected: ${result.signal_type} (${result.confidence} confidence)`);
    console.error(`   Pattern: ${result.pattern || 'N/A'}`);
    console.error(`\n💡 Suggestion: Consider invoking learn neuron with this teaching input`);
    process.exit(0);
  } else {
    console.error('\n❌ No teaching signal detected');
    process.exit(1);
  }
}

async function runBlockerLog(args: string[], verbose: boolean): Promise<void> {
  if (args.length < 2) {
    console.error('Usage: genie workflow blocker <wish-path> <description>');
    console.error('Example: genie workflow blocker .genie/wishes/my-wish/my-wish.md "Permission denied"');
    process.exit(1);
  }

  const [wishPath, ...descParts] = args;
  const description = descParts.join(' ');

  const result = await logBlocker(wishPath, description, { verbose });

  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.error(`\n✅ Blocker logged successfully`);
    console.error(`   Timestamp: ${result.timestamp}`);
    console.error(`   Wish: ${result.wish_path}`);
    process.exit(0);
  } else {
    console.error('\n❌ Failed to log blocker');
    process.exit(1);
  }
}

async function runRoleValidation(args: string[], verbose: boolean): Promise<void> {
  if (args.length < 2) {
    console.error('Usage: genie workflow role <current-role> <intended-action> [session-state-path]');
    console.error('Example: genie workflow role orchestrator "edit file" .genie/SESSION-STATE.md');
    process.exit(1);
  }

  const [currentRole, intendedAction, sessionStatePath] = args;

  const result = await validateRole(currentRole, intendedAction, sessionStatePath, { verbose });

  console.log(JSON.stringify(result, null, 2));

  if (result.valid) {
    console.error(`\n✅ Role validation passed`);
    console.error(`   ${result.message || 'Role and action alignment validated'}`);
    process.exit(0);
  } else {
    console.error(`\n❌ Role validation failed`);
    console.error(`   Error: ${result.error}`);
    if (result.suggestion) {
      console.error(`   Suggestion: ${result.suggestion}`);
    }
    process.exit(1);
  }
}

async function runPromiseTracking(args: string[], verbose: boolean): Promise<void> {
  if (args.length === 0) {
    console.error('Usage: genie workflow promise <message> [executed-command-1] [executed-command-2] ...');
    console.error('Example: genie workflow promise "Waiting 120s..." "sleep 120"');
    process.exit(1);
  }

  const [message, ...commands] = args;

  const result = await trackPromise(message, commands, { verbose });

  console.log(JSON.stringify(result, null, 2));

  if (result.gap_detected) {
    console.error(`\n❌ Say-do gap detected!`);
    console.error(`   ${result.summary}`);

    const gaps = result.promises.filter(p => p.gap_detected);
    gaps.forEach(gap => {
      console.error(`\n   Promise: "${gap.promise_text}"`);
      console.error(`   Missing: ${gap.missing_action}`);
    });
    process.exit(1);
  } else {
    console.error(`\n✅ ${result.summary}`);
    process.exit(0);
  }
}

function printWorkflowHelp(): void {
  console.log(`
Genie Workflow Automation Commands

USAGE:
  genie workflow <subcommand> [options]

SUBCOMMANDS:
  teach <message>                      Detect teaching signals in user message
  blocker <wish-path> <description>    Log blocker to wish document
  role <role> <action> [session-path]  Validate role before delegation
  promise <message> [commands...]      Track promises and detect say-do gaps
  help                                 Show this help message

EXAMPLES:
  # Detect teaching signal
  genie workflow teach "Let me teach you something new"

  # Log blocker to wish
  genie workflow blocker .genie/wishes/my-wish/my-wish.md "Permission denied on implementor"

  # Validate role
  genie workflow role orchestrator "edit file" .genie/SESSION-STATE.md

  # Track promise
  genie workflow promise "Waiting 120s before checking..." "sleep 120"

OPTIONS:
  --verbose, -v    Show verbose output including script errors

EXIT CODES:
  0    Success (signal detected, validation passed, no gap)
  1    Failure (no signal, validation failed, gap detected)

INTEGRATION:
  These commands wrap the workflow scripts in .genie/custom/workflow-scripts/
  They can be used programmatically or in shell scripts for automation.

DOCUMENTATION:
  See .genie/custom/workflow-scripts/README.md for detailed information
  `);
}

/**
 * Workflow Scripts Integration
 *
 * TypeScript wrapper for Node.js workflow automation scripts
 * Provides type-safe interfaces and error handling
 */

import { spawn } from 'child_process';
import path from 'path';

const SCRIPTS_DIR = path.join(__dirname, '../../../custom/workflow-scripts');

export interface TeachingSignalResult {
  detected: boolean;
  signal_type: 'explicit_teaching' | 'behavioral_correction' | 'meta_learning' | 'pattern_establishment' | 'none';
  confidence: 'high' | 'medium' | 'low';
  pattern?: string;
}

export interface BlockerLogResult {
  success: boolean;
  timestamp: string;
  wish_path: string;
  message: string;
}

export interface RoleValidationResult {
  valid: boolean;
  role: string;
  action: string;
  error?: string;
  suggestion?: string;
  message?: string;
}

export interface PromiseTrackingResult {
  gap_detected: boolean;
  promises: Array<{
    detected: boolean;
    promise_text: string;
    expected_action: string;
    expected_value: string;
    gap_detected: boolean;
    missing_action: string | null;
  }>;
  summary: string;
}

/**
 * Execute a workflow script and parse JSON output
 */
async function executeScript<T>(
  scriptName: string,
  args: string[],
  options: { verbose?: boolean } = {}
): Promise<T> {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);

  return new Promise((resolve, reject) => {
    const proc = spawn('node', [scriptPath, ...args], {
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
        resolve(result as T);
      } catch (err) {
        // Some scripts exit with non-zero for negative results but still output valid JSON
        if (stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result as T);
          } catch {
            reject(new Error(`Invalid JSON output from ${scriptName}: ${stdout}`));
          }
        } else {
          reject(new Error(`Script ${scriptName} failed with code ${code}: ${stderr || 'No output'}`));
        }
      }
    });
  });
}

/**
 * Detect teaching signals in user messages
 */
export async function detectTeachingSignal(
  message: string,
  options: { verbose?: boolean } = {}
): Promise<TeachingSignalResult> {
  return executeScript<TeachingSignalResult>(
    'detect-teaching-signal.js',
    [message],
    options
  );
}

/**
 * Log a blocker to a wish document
 */
export async function logBlocker(
  wishPath: string,
  blockerDescription: string,
  options: { verbose?: boolean } = {}
): Promise<BlockerLogResult> {
  return executeScript<BlockerLogResult>(
    'log-blocker.js',
    [wishPath, blockerDescription],
    options
  );
}

/**
 * Validate role before MCP delegation
 */
export async function validateRole(
  currentRole: string,
  intendedAction: string,
  sessionStatePath?: string,
  options: { verbose?: boolean } = {}
): Promise<RoleValidationResult> {
  const args = [currentRole, intendedAction];
  if (sessionStatePath) {
    args.push(sessionStatePath);
  }

  return executeScript<RoleValidationResult>(
    'validate-role.js',
    args,
    options
  );
}

/**
 * Track promises and detect say-do gaps
 */
export async function trackPromise(
  message: string,
  executedCommands: string[] = [],
  options: { verbose?: boolean } = {}
): Promise<PromiseTrackingResult> {
  return executeScript<PromiseTrackingResult>(
    'track-promise.js',
    [message, ...executedCommands],
    options
  );
}

/**
 * Check if workflow scripts are available
 */
export function areWorkflowScriptsAvailable(): boolean {
  const fs = require('fs');
  const scripts = [
    'detect-teaching-signal.js',
    'log-blocker.js',
    'validate-role.js',
    'track-promise.js'
  ];

  return scripts.every(script =>
    fs.existsSync(path.join(SCRIPTS_DIR, script))
  );
}

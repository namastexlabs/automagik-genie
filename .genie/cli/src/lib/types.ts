/**
 * Shared TypeScript types for Genie CLI
 * Extracted from genie.ts to serve as foundation layer for modularization
 */

// ============================================================================
// CLI Argument Types
// ============================================================================

/**
 * CLI command-line options parsed from argv
 */
export interface CLIOptions {
  rawArgs: string[];
  background: boolean;
  backgroundExplicit: boolean;
  backgroundRunner: boolean;
  requestHelp?: boolean;
  full: boolean;
  live: boolean;
}

/**
 * Parsed command structure from argv
 */
export interface ParsedCommand {
  command?: string;
  commandArgs: string[];
  options: CLIOptions;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * File system paths for CLI state and logs
 */
export interface ConfigPaths {
  baseDir?: string;
  sessionsFile?: string;
  logsDir?: string;
  backgroundDir?: string;
  executors?: Record<string, Record<string, any>>;
}

/**
 * Main Genie configuration structure
 */
export interface GenieConfig {
  defaults?: {
    executionMode?: string;
    preset?: string;
    background?: boolean;
    executor?: string;
  };
  paths?: ConfigPaths;
  executors?: Record<string, any>;
  executionModes?: Record<string, any>;
  presets?: Record<string, any>;
  background?: {
    enabled?: boolean;
    detach?: boolean;
    pollIntervalMs?: number;
    sessionExtractionDelayMs?: number;
  };
  __configPath?: string;
}

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Agent specification with frontmatter metadata and instructions
 */
export interface AgentSpec {
  meta?: Record<string, any>;
  instructions: string;
}

/**
 * Agent entry in catalog listing
 */
export interface ListedAgent {
  id: string;
  label: string;
  meta: any;
  folder: string | null;
}

// ============================================================================
// Executor Types
// ============================================================================

/**
 * Arguments for executing a run command
 */
export interface ExecuteRunArgs {
  agentName: string;
  command: any;
  executorKey: string;
  executor: any;
  executorConfig: any;
  executorPaths: any;
  prompt: string;
  store: any;
  entry: any;
  paths: Required<ConfigPaths>;
  config: GenieConfig;
  startTime: number;
  logFile: string;
  background: boolean;
  runnerPid: number | null;
  cliOptions: CLIOptions;
  executionMode: string;
}
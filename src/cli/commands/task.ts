/**
 * Task Command - Pure headless task execution
 *
 * Creates a Forge task and returns immediately with task ID.
 * No browser opening, no monitoring. Designed for automation and scripting.
 *
 * Behavior:
 * 1. Create Forge task with agent
 * 2. Return task ID and URL immediately
 * 3. Task runs in background
 * 4. Exit (fire and forget)
 *
 * This preserves the old `genie run` behavior for backward compatibility.
 */

import { getForgeConfig } from '../lib/service-config.js';
import type { ParsedCommand, GenieConfig, ConfigPaths } from '../lib/types';
import { ensureForgeRunning } from '../lib/headless-helpers';
import { resolveAgentIdentifier, loadAgentSpec } from '../lib/agent-resolver';
import { createForgeExecutor } from '../lib/forge-executor';
import { describeForgeError, FORGE_RECOVERY_HINT } from '../lib/forge-helpers';
import { normalizeExecutorKeyOrDefault } from '../lib/executor-registry';

export async function runTask(
  parsed: ParsedCommand,
  config: GenieConfig,
  paths: Required<ConfigPaths>
): Promise<void> {
  const [agentName, ...promptParts] = parsed.commandArgs;

  if (!agentName) {
    console.error('Usage: genie task <agent> "<prompt>"');
    process.exit(1);
  }

  const prompt = promptParts.join(' ').trim();
  if (!prompt) {
    console.error('Error: Prompt is required');
    console.error('Usage: genie task <agent> "<prompt>"');
    process.exit(1);
  }

  const resolvedAgentName = resolveAgentIdentifier(agentName);
  const agentSpec = loadAgentSpec(resolvedAgentName);
  const agentGenie = agentSpec.meta?.genie || {};

  // Resolve executor configuration
  const executorKey = normalizeExecutorKeyOrDefault(
    agentGenie.executor || config.defaults?.executor
  );
  const executorVariant = (
    agentGenie.executorVariant ||
    agentGenie.variant ||
    config.defaults?.executorVariant ||
    'DEFAULT'
  ).trim().toUpperCase();
  const model = agentGenie.model || config.defaults?.model;

  // Ensure Forge is running (quiet mode)
  await ensureForgeRunning(true);

  const forgeExecutor = createForgeExecutor();

  let sessionResult;
  try {
    sessionResult = await forgeExecutor.createSession({
      agentName: resolvedAgentName,
      prompt,
      executorKey,
      executorVariant,
      executionMode: 'background',
      model
    });
  } catch (error) {
    const reason = describeForgeError(error);
    console.error(JSON.stringify({
      error: `Failed to create task: ${reason}`,
      hint: FORGE_RECOVERY_HINT
    }, null, 2));
    process.exit(1);
  }

  const attemptId = sessionResult.attemptId;
  const taskUrl = sessionResult.forgeUrl;

  // Output JSON immediately
  const jsonOutput = {
    task_id: attemptId,
    task_url: taskUrl,
    agent: resolvedAgentName,
    executor: `${executorKey}:${executorVariant}`,
    ...(model && { model }),
    status: 'started',
    message: 'Task running in background'
  };

  console.log(JSON.stringify(jsonOutput, null, 2));
  process.exitCode = 0;
}

import type { Handler, HandlerContext } from '../context';
import type { ParsedCommand } from '../types';
import { createForgeExecutor } from '../../lib/forge-executor';
import { describeForgeError, FORGE_RECOVERY_HINT } from '../../lib/forge-helpers';

export function createResumeHandler(ctx: HandlerContext): Handler {
  return async (parsed: ParsedCommand) => {
    const cmdArgs = parsed.commandArgs;
    if (cmdArgs.length < 2) {
      throw new Error('Usage: genie resume <attempt-id> "<prompt>"');
    }

    const store = ctx.sessionService.load({ onWarning: ctx.recordRuntimeWarning });
    const attemptId = cmdArgs[0]; // Direct UUID (issue #407 fix)
    const prompt = cmdArgs.slice(1).join(' ').trim();
    const entry = store.sessions[attemptId];

    if (!entry) {
      throw new Error(`❌ No session found with ID '${attemptId}'`);
    }

    const forgeExecutor = createForgeExecutor();
    try {
      // Skip config.forge.executors - incompatible format, Forge loads from its own config
      await forgeExecutor.syncProfiles();
    } catch (error) {
      const reason = describeForgeError(error);
      ctx.recordRuntimeWarning(`Forge sync failed: ${reason}`);
      throw new Error(`Forge backend unavailable while resuming session '${attemptId}'. ${FORGE_RECOVERY_HINT}`);
    }

    try {
      await forgeExecutor.resumeSession(attemptId, prompt);
    } catch (error) {
      const reason = describeForgeError(error);
      ctx.recordRuntimeWarning(`Forge resume failed: ${reason}`);
      throw new Error(`Forge backend rejected resume for session '${attemptId}'. ${FORGE_RECOVERY_HINT}`);
    }

    entry.lastPrompt = prompt.slice(0, 200);
    entry.lastUsed = new Date().toISOString();
    entry.status = 'running';
    store.sessions[attemptId] = entry;
    await ctx.sessionService.save(store);

    process.stdout.write(`✓ Resumed session ${attemptId} via Forge\n`);
  };
}

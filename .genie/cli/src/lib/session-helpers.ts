import fs from 'fs';
import type { SessionStore, SessionEntry } from '../session-store';
import type { ConfigPaths } from './types';
import { saveSessions } from '../session-store';
import BackgroundManager from '../background-manager';

const backgroundManager = new BackgroundManager();

const runtimeWarnings: string[] = [];

export function recordRuntimeWarning(message: string): void {
  runtimeWarnings.push(message);
}

export function getRuntimeWarnings(): string[] {
  return [...runtimeWarnings];
}

export function clearRuntimeWarnings(): void {
  runtimeWarnings.length = 0;
}

export function findSessionEntry(
  store: SessionStore,
  sessionId: string,
  paths: Required<ConfigPaths>
) {
  if (!sessionId || typeof sessionId !== 'string') return null;
  const trimmed = sessionId.trim();
  if (!trimmed) return null;

  for (const [agentName, entry] of Object.entries(store.agents || {})) {
    if (entry && entry.sessionId === trimmed) {
      return { agentName, entry };
    }
  }

  for (const [agentName, entry] of Object.entries(store.agents || {})) {
    const logFile = entry.logFile;
    if (!logFile || !fs.existsSync(logFile)) continue;
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const marker = new RegExp(`"session_id":"${trimmed}"`);
      if (marker.test(content)) {
        entry.sessionId = trimmed;
        entry.lastUsed = new Date().toISOString();
        saveSessions(paths as any, store);
        return { agentName, entry };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      recordRuntimeWarning(`[genie] Failed to scan log ${logFile}: ${message}`);
    }
  }
  return null;
}

export function resolveDisplayStatus(entry: SessionEntry): string {
  const baseStatus = entry.status || 'unknown';
  const executorRunning = backgroundManager.isAlive(entry.executorPid);
  const runnerRunning = backgroundManager.isAlive(entry.runnerPid);

  if (baseStatus === 'running') {
    if (executorRunning) return 'running';
    if (!executorRunning && runnerRunning) return 'pending-completion';
    if (entry.exitCode === 0) return 'completed';
    if (typeof entry.exitCode === 'number' && entry.exitCode !== 0) {
      return `failed (${entry.exitCode})`;
    }
    return 'stopped';
  }

  if (baseStatus === 'completed' || baseStatus === 'failed') {
    return baseStatus;
  }

  if (runnerRunning || executorRunning) {
    return 'running';
  }
  return baseStatus;
}
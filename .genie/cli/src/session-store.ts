import fs from 'fs';
import { DEFAULT_EXECUTOR_KEY, normalizeExecutorKeyOrDefault, normalizeExecutorKey } from './lib/executor-registry';

/**
 * Session entry metadata (v4)
 *
 * Breaking Change (Issue #407):
 * - Sessions are now keyed by Forge attemptId (UUID) instead of friendly names
 * - This removes the abstraction layer and aligns directly with Forge's API
 * - Friendly name generation (generateSessionName) has been removed
 *
 * Forge Integration (Wish #120-A):
 * - All sessions use Forge backend for operations (create, resume, stop, view)
 * - attemptId is the natural identifier provided by Forge
 * - taskId and projectId track the parent entities in Forge
 */
export interface SessionEntry {
  agent: string;
  taskId?: string;         // Forge task ID (optional for migrated v3 sessions)
  projectId?: string;      // Forge project ID (optional for migrated v3 sessions)
  preset?: string;
  mode?: string;
  executor?: string;
  executorVariant?: string | null;
  model?: string | null;
  status?: string;
  created?: string;
  lastUsed?: string;
  lastPrompt?: string;
  forgeUrl?: string;       // Full Forge URL for easy access
  background?: boolean;
}

export interface SessionStore {
  version: number;
  sessions: Record<string, SessionEntry>; // keyed by attemptId (UUID) - v4
  // Legacy format compatibility (will be migrated on load or rejected)
  agents?: Record<string, SessionEntry>;
}

export interface SessionPathsConfig {
  sessionsFile?: string;
}

export interface SessionLoadConfig {
  defaults?: {
    executor?: string;
  };
}

export interface SessionDefaults {
  defaults?: {
    executor?: string;
  };
}

export function loadSessions(
  paths: SessionPathsConfig = {},
  config: SessionLoadConfig = {},
  defaults: SessionDefaults = {},
  callbacks: { onWarning?: (message: string) => void } = {}
): SessionStore {
  const storePath = paths.sessionsFile;
  let store: SessionStore;

  if (storePath && fs.existsSync(storePath)) {
    store = normalizeSessionStore(readJson(storePath, callbacks), callbacks);
  } else {
    store = { version: 4, sessions: {} };
  }

  const defaultExecutor = resolveDefaultExecutor(config, defaults);
  return migrateSessionEntries(store, defaultExecutor);
}

export function saveSessions(paths: SessionPathsConfig = {}, store: SessionStore): void {
  if (!paths.sessionsFile) return;
  const payload = JSON.stringify(store, null, 2);
  fs.writeFileSync(paths.sessionsFile, payload);
}

function readJson(filePath: string, callbacks: { onWarning?: (message: string) => void }): unknown {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim().length) return {};
  try {
    return JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    callbacks.onWarning?.(`Could not parse JSON from ${filePath}: ${message}`);
    return {};
  }
}

function normalizeSessionStore(
  data: unknown,
  callbacks: { onWarning?: (message: string) => void } = {}
): SessionStore {
  if (!data || typeof data !== 'object') {
    return { version: 4, sessions: {} };
  }

  const incoming = data as Partial<SessionStore> & {
    agents?: Record<string, SessionEntry>;
    sessions?: Record<string, SessionEntry>;
  };

  // Version 4 format (sessions keyed by attemptId/UUID) - current
  if (incoming.version === 4 && incoming.sessions) {
    return {
      version: 4,
      sessions: incoming.sessions
    };
  }

  // Version 3 or earlier - MIGRATE to v4
  // Rationale: Preserve user's ability to resume/stop/view existing sessions
  // Key change: Use attemptId (from v3's sessionId field) as the v4 key
  if (incoming.version && incoming.version < 4) {
    const sessions: Record<string, SessionEntry> = {};
    let migratedCount = 0;

    // v3 sessions were keyed by friendly name, need to rekey by attemptId
    Object.entries(incoming.sessions || {}).forEach(([_friendlyName, entry]: [string, any]) => {
      if (!entry || typeof entry !== 'object') return;

      // v3 stored attemptId in the 'sessionId' field
      const attemptId = entry.sessionId;
      if (!attemptId || typeof attemptId !== 'string') return;

      // Migrate to v4 format (taskId/projectId will be undefined for migrated sessions)
      sessions[attemptId] = {
        agent: entry.agent,
        // taskId and projectId omitted (not available in v3)
        preset: entry.preset,
        mode: entry.mode,
        executor: entry.executor,
        executorVariant: entry.executorVariant,
        model: entry.model,
        status: entry.status,
        created: entry.created,
        lastUsed: entry.lastUsed,
        lastPrompt: entry.lastPrompt,
        forgeUrl: entry.forgeUrl,
        background: entry.background
      };
      migratedCount++;
    });

    callbacks.onWarning?.(
      `Migrated ${migratedCount} session(s) from v${incoming.version} to v4. ` +
      `Sessions can be viewed/resumed/stopped using their IDs. ` +
      `Some metadata (taskId/projectId) may be incomplete for migrated sessions.`
    );

    return {
      version: 4,
      sessions
    };
  }

  // No version number - treat as v2 and migrate
  if (!incoming.version && incoming.sessions) {
    const sessions: Record<string, SessionEntry> = {};
    let migratedCount = 0;

    // v2 sessions were keyed by sessionId (attemptId), already in correct format
    Object.entries(incoming.sessions).forEach(([attemptId, entry]: [string, any]) => {
      if (!entry || typeof entry !== 'object') return;

      // v2 already used attemptId as key, just need to copy fields
      sessions[attemptId] = {
        agent: entry.agent,
        // taskId and projectId omitted (not available in v2)
        preset: entry.preset,
        mode: entry.mode,
        executor: entry.executor,
        executorVariant: entry.executorVariant,
        model: entry.model,
        status: entry.status,
        created: entry.created,
        lastUsed: entry.lastUsed,
        lastPrompt: entry.lastPrompt,
        forgeUrl: entry.forgeUrl,
        background: entry.background
      };
      migratedCount++;
    });

    callbacks.onWarning?.(
      `Migrated ${migratedCount} session(s) from v2 to v4. ` +
      `Sessions can be viewed/resumed/stopped using their IDs. ` +
      `Some metadata (taskId/projectId) may be incomplete for migrated sessions.`
    );

    return {
      version: 4,
      sessions
    };
  }

  // Empty or malformed
  return {
    version: 4,
    sessions: {}
  };
}

function migrateSessionEntries(store: SessionStore, defaultExecutor: string): SessionStore {
  const result: SessionStore = {
    version: store.version ?? 4,
    sessions: { ...store.sessions }
  };

  // Migrate session entries (apply defaults)
  Object.entries(result.sessions || {}).forEach(([attemptId, entry]) => {
    if (!entry || typeof entry !== 'object') return;
    if (!entry.mode && entry.preset) result.sessions[attemptId].mode = entry.preset;
    if (!entry.preset && entry.mode) result.sessions[attemptId].preset = entry.mode;
    const normalized = entry.executor ? normalizeExecutorKey(entry.executor) : undefined;
    result.sessions[attemptId].executor = normalized ?? defaultExecutor;
  });

  return result;
}

function resolveDefaultExecutor(config: SessionLoadConfig = {}, defaults: SessionDefaults = {}): string {
  return normalizeExecutorKeyOrDefault(
    config.defaults?.executor ??
      defaults.defaults?.executor ??
      DEFAULT_EXECUTOR_KEY,
    DEFAULT_EXECUTOR_KEY
  );
}

export const _internals = {
  readJson,
  normalizeSessionStore,
  migrateSessionEntries,
  resolveDefaultExecutor
};

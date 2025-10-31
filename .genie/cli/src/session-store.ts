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
  taskId: string;          // Forge task ID
  projectId: string;       // Forge project ID
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

  // Version 3 or earlier - CLEAN BREAK (no migration)
  // Rationale: Fixes issue #407 by removing friendly name abstraction
  // Previous sessions incompatible with new UUID-based architecture
  if (incoming.version && incoming.version < 4) {
    callbacks.onWarning?.(
      `Session storage upgraded to v4 (issue #407 fix). ` +
      `Previous v${incoming.version} sessions are no longer compatible. ` +
      `Please create new sessions using: genie run <agent> "<prompt>"`
    );

    return {
      version: 4,
      sessions: {}
    };
  }

  // No version number - treat as legacy
  if (!incoming.version) {
    callbacks.onWarning?.(
      'Session storage upgraded to v4 (issue #407 fix). ' +
      'Previous sessions are no longer compatible. ' +
      'Please create new sessions using: genie run <agent> "<prompt>"'
    );

    return {
      version: 4,
      sessions: {}
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

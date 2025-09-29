import fs from 'fs';

export interface SessionEntry {
  agent: string;
  preset?: string;
  mode?: string;
  logFile?: string;
  lastPrompt?: string;
  created?: string;
  lastUsed?: string;
  status?: string;
  background?: boolean;
  runnerPid?: number | null;
  executor?: string;
  executorPid?: number | null;
  exitCode?: number | null;
  signal?: string | null;
  startTime?: string;
  sessionId?: string | null;
  [key: string]: unknown;
}

export interface SessionStore {
  version: number;
  agents: Record<string, SessionEntry>;
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
    store = normalizeSessionStore(readJson(storePath, callbacks));
  } else {
    store = { version: 1, agents: {} };
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

function normalizeSessionStore(data: unknown): SessionStore {
  if (!data || typeof data !== 'object') {
    return { version: 1, agents: {} };
  }
  const incoming = data as Partial<SessionStore> & { agents?: Record<string, SessionEntry> };
  if (incoming.agents) {
    return {
      version: incoming.version ?? 1,
      agents: incoming.agents
    };
  }
  return {
    version: 1,
    agents: incoming as unknown as Record<string, SessionEntry>
  };
}

function migrateSessionEntries(store: SessionStore, defaultExecutor: string): SessionStore {
  const result: SessionStore = {
    version: store.version ?? 1,
    agents: { ...store.agents }
  };

  Object.entries(result.agents || {}).forEach(([agent, entry]) => {
    if (!entry || typeof entry !== 'object') return;
    if (!entry.mode && entry.preset) result.agents[agent].mode = entry.preset;
    if (!entry.preset && entry.mode) result.agents[agent].preset = entry.mode;
    if (!entry.executor) result.agents[agent].executor = defaultExecutor;
  });

  return result;
}

function resolveDefaultExecutor(config: SessionLoadConfig = {}, defaults: SessionDefaults = {}): string {
  return (
    config.defaults?.executor ||
    defaults.defaults?.executor ||
    'codex'
  );
}

export const _internals = {
  readJson,
  normalizeSessionStore,
  migrateSessionEntries,
  resolveDefaultExecutor
};

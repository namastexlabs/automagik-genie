const fs = require('fs');

function loadSessions(paths = {}, config = {}, defaults = {}) {
  const storePath = paths.sessionsFile;
  let store;

  if (storePath && fs.existsSync(storePath)) {
    store = normalizeSessionStore(readJson(storePath));
  } else {
    store = { version: 1, agents: {} };
  }

  const defaultExecutor = resolveDefaultExecutor(config, defaults);
  return migrateSessionEntries(store, defaultExecutor);
}

function saveSessions(paths = {}, store) {
  if (!paths.sessionsFile) return;
  const payload = JSON.stringify(store, null, 2);
  fs.writeFileSync(paths.sessionsFile, payload);
}

function readJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim().length) return {};
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`⚠️ Could not parse JSON from ${filePath}: ${error.message}`);
    return {};
  }
}

function normalizeSessionStore(data) {
  if (!data || typeof data !== 'object') {
    return { version: 1, agents: {} };
  }
  if (data.agents) {
    return {
      version: data.version || 1,
      agents: data.agents
    };
  }
  return {
    version: 1,
    agents: data
  };
}

function migrateSessionEntries(store, defaultExecutor) {
  const result = (store && typeof store === 'object') ? store : { version: 1, agents: {} };
  Object.entries(result.agents || {}).forEach(([agent, entry]) => {
    if (!entry || typeof entry !== 'object') return;
    if (!entry.executor) entry.executor = defaultExecutor;
  });
  return result;
}

function resolveDefaultExecutor(config = {}, defaults = {}) {
  return (config.defaults && config.defaults.executor)
    || (defaults.defaults && defaults.defaults.executor)
    || 'codex';
}

module.exports = {
  loadSessions,
  saveSessions,
  _internals: {
    readJson,
    normalizeSessionStore,
    migrateSessionEntries,
    resolveDefaultExecutor
  }
};

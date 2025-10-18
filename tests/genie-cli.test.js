const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { extractSessionIdFromContent, buildJsonlView } = require('../.genie/cli/dist/executors/codex-log-viewer.js');
const { loadSessions } = require('../.genie/cli/dist/session-store.js');

(function testExtractSessionId() {
  const lines = [
    '{"type":"session.created","session_id":"test-session-123"}',
    '{"type":"item.completed","item":{"id":"item_0","item_type":"assistant_message","text":"Hello"}}'
  ];
  const result = extractSessionIdFromContent(lines);
  assert.strictEqual(result, 'test-session-123', 'session id should be extracted from JSON lines');
})();

(function testSessionDefaults() {
  const tempSessionsPath = path.join(process.cwd(), '.genie', 'state', 'agents', 'sessions.json');
  const store = loadSessions({ sessionsFile: tempSessionsPath }, { defaults: { executor: 'codex' } }, { defaults: { executor: 'codex' } });
  assert.ok(store && typeof store === 'object', 'loadSessions returns an object');
  Object.values(store.sessions || store.agents || {}).forEach((entry) => {
    assert.ok(entry.executor, 'each session entry should have an executor');
  });
})();

(function testBuildJsonlView() {
  const entry = { agent: 'codex-test', sessionId: null, logFile: 'test.log' };
  const jsonl = [
    { type: 'session.created', session_id: 'render-session-1' },
    { type: 'item.completed', item: { id: 'item_0', item_type: 'reasoning', text: 'Reasoning trace' } },
    { type: 'item.completed', item: { id: 'item_1', item_type: 'assistant_message', text: 'Assistant output' } }
  ];
  const raw = jsonl.map((line) => JSON.stringify(line)).join('\n');
  const markdown = buildJsonlView({
    render: {
      entry,
      jsonl,
      raw
    },
    parsed: { options: { lines: 10, full: false, live: false } },
    paths: { baseDir: '.' },
    store: { version: 2, sessions: { 'codex-test': entry } },
    save: () => {},
    formatPathRelative: (targetPath) => targetPath
  });
  assert.strictEqual(entry.sessionId, 'render-session-1', 'entry should capture new session id');
  assert.strictEqual(typeof markdown, 'string', 'buildJsonlView should return markdown string');
  assert.ok(markdown.length > 0, 'markdown output should not be empty');
  assert.ok(markdown.includes('Assistant output'), 'markdown should include assistant output text');
})();

async function runCliCoreTests() {
  const cliCore = require('../.genie/cli/dist/cli-core');
  assert.strictEqual(typeof cliCore.createHandlers, 'function', 'createHandlers should be exported from cli-core');
  assert.strictEqual(typeof cliCore.SessionService, 'function', 'SessionService should be exported from cli-core');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'genie-sessions-'));
  const sessionsFile = path.join(tmpDir, 'sessions.json');

  // V3 format: sessions keyed by name (not agent name or sessionId)
  fs.writeFileSync(
    sessionsFile,
    JSON.stringify(
      {
        version: 3,
        sessions: {
          genieA: { agent: 'genieA', name: 'genieA', executor: 'codex', sessionId: 'genieA-uuid' }
        }
      },
      null,
      2
    )
  );

  try {
    const service = new cliCore.SessionService({
      paths: { sessionsFile },
      loadConfig: { defaults: { executor: 'codex' } },
      defaults: { defaults: { executor: 'codex' } }
    });

    const store = service.load();
    store.sessions.genieB = { agent: 'genieB', name: 'genieB', executor: 'codex', sessionId: 'genieB-uuid' };

    // Simulate concurrent write (another process adds session-c)
    fs.writeFileSync(
      sessionsFile,
      JSON.stringify(
        {
          version: 3,
          sessions: {
            genieA: { agent: 'genieA', name: 'genieA', executor: 'codex', sessionId: 'genieA-uuid' },
            genieC: { agent: 'genieC', name: 'genieC', executor: 'codex', sessionId: 'genieC-uuid' }
          }
        },
        null,
        2
      )
    );

    await service.save(store);

    const merged = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
    assert.ok(merged.sessions.genieA, 'should retain original entries');
    assert.ok(merged.sessions.genieB, 'should include newly saved session');
    assert.ok(merged.sessions.genieC, 'should merge concurrent session additions');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

runCliCoreTests()
  .then(() => {
    console.log('genie-cli tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

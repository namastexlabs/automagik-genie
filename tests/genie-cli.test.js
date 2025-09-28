const assert = require('assert');
const path = require('path');
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
  Object.values(store.agents).forEach((entry) => {
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
  const envelope = buildJsonlView({
    render: { entry, jsonl, raw },
    parsed: { options: { lines: 10 } },
    paths: { baseDir: '.' },
    store: { version: 1, agents: { 'codex-test': entry } },
    save: () => {},
    formatPathRelative: (targetPath) => targetPath,
    style: 'compact'
  });
  assert.strictEqual(envelope.meta.sessionId, 'render-session-1', 'envelope should surface session id');
  assert.ok(envelope.meta.assistantMessages.includes('Assistant output'), 'assistant messages should be captured in view meta');
})();

console.log('genie-cli tests passed');

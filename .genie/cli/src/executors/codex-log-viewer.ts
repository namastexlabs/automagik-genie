import fs from 'fs';
import { SessionStore, saveSessions } from '../session-store';
import { ViewEnvelope, ViewStyle, LogLine } from '../view';

export interface RenderOptions {
  entry: Record<string, any>;
  jsonl: Array<Record<string, any>>;
  raw: string;
}

export interface JsonlViewContext {
  render: RenderOptions;
  parsed: any;
  paths: any;
  store: SessionStore;
  save: typeof saveSessions;
  formatPathRelative: (targetPath: string, baseDir: string) => string;
  style: ViewStyle;
}

export function readSessionIdFromLog(logFile: string): string | null {
  if (!logFile) return null;
  try {
    const content = fs.readFileSync(logFile, 'utf8');
    return extractSessionIdFromContent(content);
  } catch {
    return null;
  }
}

export function extractSessionIdFromContent(content: string | string[]): string | null {
  const lines = Array.isArray(content) ? content : String(content).split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const raw = lines[i];
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object') continue;
      const candidate =
        parsed.session_id ||
        parsed.sessionId ||
        (parsed.session && (parsed.session.id || parsed.session.session_id || parsed.session.sessionId)) ||
        (parsed.data && (parsed.data.session_id || parsed.data.sessionId));
      if (candidate) return candidate;
      if (parsed.type === 'session.created' && parsed.id) {
        return parsed.id;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export function buildJsonlView(ctx: JsonlViewContext): ViewEnvelope {
  const { render, parsed, paths, store, save, formatPathRelative, style } = ctx;
  const { entry, jsonl, raw } = render;
  const lastN = parsed.options.lines && parsed.options.lines > 0 ? parsed.options.lines : 60;

  let meta = jsonl.find((item) => item.provider && item.model) || {};
  const promptEntry = jsonl.find((item) => typeof item.prompt === 'string');
  const prompt = promptEntry?.prompt || '';

  const byCall = new Map<string, { cmd?: string; cwd?: string; mcp?: { server?: string; tool?: string } }>();
  const execs: Array<{ cmd: string; exit: number | null | undefined; dur?: { secs: number; nanos?: number } }> = [];
  const mcp: Array<{ server: string; tool: string; secs: number }> = [];
  const patches = { add: 0, update: 0, move: 0, delete: 0 };
  const errorObjects: Array<Record<string, any>> = [];
  const streamErrors: string[] = [];
  const reasoningItems: string[] = [];
  const assistantMessages: string[] & { _buffer?: Map<string, string> } = [] as any;
  const toolItems: Array<{ id: string | null; role: string; text: string }> = [];
  type TokenInfo = { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  let tokenInfo: TokenInfo | null = null;
  let rateLimits: any = null;
  let sessionIdFromEvents: string | null = null;

  jsonl.forEach((event) => {
    if (!meta.model && event.model && event.provider) {
      meta = {
        ...meta,
        model: event.model,
        provider: event.provider,
        sandbox: event.sandbox,
        workdir: event.workdir
      };
    }

    const envelope = event && typeof event === 'object' ? event : {};
    const explicitType = envelope.type;

    if (explicitType === 'error') {
      const message = envelope.message || envelope.text || JSON.stringify(envelope);
      streamErrors.push(message);
      return;
    }

    if (explicitType === 'item.completed') {
      const item = envelope.item || {};
      const text = typeof item.text === 'string' ? item.text : '';
      switch (item.item_type) {
        case 'assistant_message':
          if (text) assistantMessages.push(text.trim());
          break;
        case 'reasoning':
          if (text) reasoningItems.push(text.trim());
          break;
        case 'tool_call':
        case 'tool_result':
          toolItems.push({
            id: item.id || null,
            role: item.item_type,
            text: text || JSON.stringify(item)
          });
          break;
        default:
          if (text) reasoningItems.push(`${item.item_type || 'item'}: ${text.trim()}`);
      }
      return;
    }

    const payload = (envelope as any).msg || envelope;
    const type = payload && payload.type;
    const info = (envelope as any).info || payload.info;
    const rate = (envelope as any).rate_limits || payload.rate_limits;

    if (type === 'session.created') {
      const found = payload.session_id || payload.sessionId || (payload.session && (payload.session.id || payload.session.session_id || payload.session.sessionId));
      if (found) sessionIdFromEvents = sessionIdFromEvents || found;
      if (payload.model || payload.provider || payload.sandbox || (payload.session && payload.session.model)) {
        meta = {
          ...meta,
          ...(payload.session || {}),
          ...(typeof payload.metadata === 'object' ? payload.metadata : {})
        };
        if (payload.model) meta.model = payload.model;
        if (payload.provider) meta.provider = payload.provider;
        if (payload.sandbox) meta.sandbox = payload.sandbox;
        if (payload.workdir) meta.workdir = payload.workdir;
        if (payload.session && payload.session.model && !meta.model) meta.model = payload.session.model;
        if (payload.session && payload.session.provider && !meta.provider) meta.provider = payload.session.provider;
      }
      return;
    }

    switch (type) {
      case 'exec_command_begin':
        byCall.set(payload.call_id, { cmd: (payload.command || []).join(' '), cwd: payload.cwd });
        break;
      case 'exec_command_end': {
        const rec = byCall.get(payload.call_id) || {};
        execs.push({ cmd: rec.cmd || '(unknown)', exit: payload.exit_code, dur: payload.duration });
        break; }
      case 'mcp_tool_call_begin':
        byCall.set(payload.call_id, { mcp: { server: payload.invocation?.server, tool: payload.invocation?.tool } });
        break;
      case 'mcp_tool_call_end': {
        const rec = byCall.get(payload.call_id) || { mcp: {} };
        const d = payload.duration || {};
        mcp.push({ server: rec.mcp?.server || '?', tool: rec.mcp?.tool || '?', secs: d.secs || 0 });
        break; }
      case 'patch_apply_begin': {
        const changes = payload.changes || {};
        Object.values(changes).forEach((chg: any) => {
          if (chg.add) patches.add += 1;
          if (chg.update) {
            patches.update += 1;
            if (chg.update.move_path) patches.move += 1;
          }
          if (chg.delete) patches.delete += 1;
        });
        break; }
      case 'token_count': {
        if (info?.total_token_usage) tokenInfo = info.total_token_usage;
        if (rate) rateLimits = rate;
        break; }
      case 'token.usage': {
        if (payload.input_tokens || payload.output_tokens || payload.total_tokens) {
          tokenInfo = {
            input_tokens: payload.input_tokens,
            output_tokens: payload.output_tokens,
            total_tokens: payload.total_tokens || ((payload.input_tokens || 0) + (payload.output_tokens || 0))
          };
        }
        break; }
      case 'response.usage': {
        const usage = (envelope as any).usage || payload.usage || payload;
        if (usage) {
          tokenInfo = {
            input_tokens: usage.input_tokens || usage.prompt_tokens || 0,
            output_tokens: usage.output_tokens || usage.completion_tokens || 0,
            total_tokens: usage.total_tokens || usage.usage || ((usage.input_tokens || 0) + (usage.output_tokens || 0))
          };
        }
        break; }
      case 'response.output_text.delta': {
        const responseId = (envelope as any).response_id || payload.response_id;
        if (!responseId) break;
        const delta = (envelope as any).delta || payload.delta || '';
        if (!delta) break;
        if (!assistantMessages._buffer) assistantMessages._buffer = new Map();
        const buffer = assistantMessages._buffer;
        const prev = buffer.get(responseId) || '';
        buffer.set(responseId, prev + delta);
        break; }
      case 'response.output_text.completed': {
        const responseId = (envelope as any).response_id || payload.response_id;
        if (responseId && assistantMessages._buffer?.has(responseId)) {
          const text = assistantMessages._buffer.get(responseId)?.trim();
          if (text) assistantMessages.push(text);
          assistantMessages._buffer.delete(responseId);
        }
        break; }
      case 'response.completed': {
        if (assistantMessages._buffer) {
          const values = Array.from(assistantMessages._buffer.values());
          values.forEach((val) => {
            const cleaned = (val || '').trim();
            if (cleaned) assistantMessages.push(cleaned);
          });
          assistantMessages._buffer.clear();
        }
        break; }
      case 'response.refusal.delta': {
        const delta = (envelope as any).delta || payload.delta;
        if (delta) reasoningItems.push(`refusal: ${delta}`);
        break; }
      default: {
        const s = JSON.stringify(payload || envelope);
        if (/error/i.test(s)) errorObjects.push(payload);
      }
    }
  });

  if (sessionIdFromEvents && !entry.sessionId) {
    entry.sessionId = sessionIdFromEvents;
    save(paths, store);
  }

  if (assistantMessages._buffer) {
    const bufferValues = Array.from(assistantMessages._buffer.values() || []);
    bufferValues.forEach((val) => {
      const cleaned = (val || '').trim();
      if (cleaned) assistantMessages.push(cleaned);
    });
    assistantMessages._buffer.clear();
    delete assistantMessages._buffer;
  }

  const finalAssistantMessages = assistantMessages.filter((msg) => typeof msg === 'string' && msg.trim().length);

  const okCount = execs.filter((e) => e.exit === 0).length;
  const errCount = execs.filter((e) => e.exit !== 0 && e.exit != null).length;

  const tailLines = raw.split(/\r?\n/).slice(-lastN);
  const logLines: LogLine[] = tailLines.map((line) => ({
    text: `  ${line}`,
    tone: classifyTone(line)
  }));

  const tokensItem = tokenInfo
    ? (() => {
        const info = tokenInfo as TokenInfo;
        return { label: 'Tokens', value: `in:${info.input_tokens ?? 0} out:${info.output_tokens ?? 0} total:${info.total_tokens ?? 0}` };
      })()
    : null;

  return {
    style,
    title: `${entry.agent} session overview`,
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: entry.agent, accent: 'primary' },
        {
          type: 'keyValue',
          columns: 1,
          items: [
            { label: 'Session', value: entry.sessionId || 'n/a', tone: entry.sessionId ? 'success' : 'muted' },
            { label: 'Log', value: formatPathRelative(entry.logFile, paths.baseDir) }
          ]
        },
        metaSection(meta),
        prompt
          ? {
              type: 'layout',
              direction: 'column',
              children: [
                { type: 'heading', level: 2, text: 'Prompt', accent: 'secondary' },
                { type: 'text', text: prompt, wrap: true, tone: 'muted' }
              ]
            }
          : null,
        reasoningItems.length
          ? listSection('Reasoning', reasoningItems.slice(-5))
          : null,
        finalAssistantMessages.length
          ? listSection('Assistant', finalAssistantMessages.slice(-3))
          : null,
        toolItems.length
          ? listSection('Tool Items', toolItems.slice(-5).map((item) =>
              `${item.role}${item.id ? `(${item.id})` : ''}: ${truncate(item.text, 160)}`
            ))
          : null,
        mcp.length
          ? listSection('MCP', mcp.slice(-5).map((call) => `${call.server}:${call.tool} ${call.secs}s`))
          : null,
        patches.add || patches.update || patches.move || patches.delete
          ? {
              type: 'text',
              text: `Patches → add:${patches.add} update:${patches.update} move:${patches.move} delete:${patches.delete}`,
              tone: 'muted'
            }
          : null,
        execs.length
          ? listSection(
              `Execs (last ${Math.min(3, execs.length)})`,
              execs.slice(-3).map((cmd) => {
                const ms = cmd.dur ? cmd.dur.secs * 1000 + Math.round((cmd.dur.nanos || 0) / 1e6) : null;
                return `${cmd.exit === 0 ? 'OK ' : 'ERR'} ${cmd.cmd} (${ms ?? '?'} ms)`;
              })
            )
          : null,
        errorObjects.length
          ? listSection('Errors', errorObjects.slice(-5).map((item) => truncate(JSON.stringify(item), 160)))
          : null,
        streamErrors.length
          ? listSection('Stream Errors', streamErrors.slice(-5).map((item) => truncate(item, 160)))
          : null,
        {
          type: 'keyValue',
          columns: 1,
          items: compact([
            { label: 'MCP', value: String(mcp.length) },
            { label: 'Execs', value: `total:${execs.length} ok:${okCount} err:${errCount}` },
            patches.add || patches.update || patches.move || patches.delete
              ? { label: 'Patches', value: `add:${patches.add} update:${patches.update} move:${patches.move} delete:${patches.delete}` }
              : null,
            finalAssistantMessages.length
              ? { label: 'Assistant', value: String(finalAssistantMessages.length) }
              : null,
            reasoningItems.length
              ? { label: 'Reasoning', value: String(reasoningItems.length) }
              : null,
            toolItems.length
              ? { label: 'Tool Items', value: String(toolItems.length) }
              : null,
            tokensItem,
            rateLimits?.primary
              ? { label: 'RateLimit', value: `used:${rateLimits.primary.used_percent || 0}% reset:${rateLimits.primary.resets_in_seconds || 0}s` }
              : null
          ])
        },
        { type: 'heading', level: 2, text: `Raw Tail (${lastN} lines)`, accent: 'muted' },
        { type: 'log', lines: logLines }
      ].filter(Boolean) as any
    },
    meta: {
      sessionId: entry.sessionId,
      logFile: formatPathRelative(entry.logFile, paths.baseDir),
      prompt,
      reasoningItems,
      assistantMessages: finalAssistantMessages,
      toolItems,
      mcp,
      patches,
      execs,
      errors: errorObjects,
      streamErrors,
      tokenInfo,
      rateLimits,
      tailLines
    }
  };
}

function metaSection(meta: Record<string, any>) {
  const rows = compact([
    meta.model ? { label: 'Model', value: meta.model } : null,
    meta.provider ? { label: 'Provider', value: meta.provider } : null,
    meta.sandbox ? { label: 'Sandbox', value: meta.sandbox } : null,
    meta.workdir ? { label: 'Workdir', value: meta.workdir } : null
  ]);
  if (!rows.length) return null;
  return {
    type: 'keyValue' as const,
    columns: 1 as const,
    items: rows
  };
}

function listSection(title: string, items: string[]) {
  return {
    type: 'layout' as const,
    direction: 'column' as const,
    children: [
      { type: 'heading', level: 2, text: title, accent: 'secondary' },
      { type: 'list', items }
    ]
  };
}

function classifyTone(line: string) {
  const upper = line.toUpperCase();
  if (upper.includes('ERROR')) return 'danger';
  if (upper.includes('WARN')) return 'warning';
  return 'default';
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

function compact<T>(items: Array<T | null | undefined>): T[] {
  return items.filter((item): item is T => Boolean(item));
}

export default {
  readSessionIdFromLog,
  extractSessionIdFromContent,
  buildJsonlView
};

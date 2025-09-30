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
  for (const line of lines) {
    if (!line) continue;
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object') continue;
      if (parsed.type === 'system' && parsed.session_id) {
        return parsed.session_id;
      }
      if (parsed.session_id) {
        return parsed.session_id;
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

  const assistantMessages: string[] = [];
  const toolCalls: Array<{ name: string; input: any; id: string }> = [];
  const toolResults: Array<{ tool_use_id: string; content: string }> = [];
  let finalResult: string | null = null;
  let sessionIdFromEvents: string | null = null;
  type TokenInfo = { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  let tokenInfo: TokenInfo | null = null;
  let meta: Record<string, any> = {};

  jsonl.forEach((event) => {
    if (!event || typeof event !== 'object') return;

    if (event.type === 'system') {
      if (event.session_id) {
        sessionIdFromEvents = sessionIdFromEvents || event.session_id;
      }
      if (event.model) {
        meta.model = event.model;
      }
      return;
    }

    if (event.type === 'assistant' && event.message?.content) {
      const content = event.message.content;
      if (!Array.isArray(content)) return;

      content.forEach((item: any) => {
        if (item.type === 'text' && item.text) {
          assistantMessages.push(item.text.trim());
        } else if (item.type === 'tool_use') {
          toolCalls.push({
            name: item.name || 'unknown',
            input: item.input || {},
            id: item.id || ''
          });
        }
      });
      return;
    }

    if (event.type === 'user' && event.message?.content) {
      const content = event.message.content;
      if (!Array.isArray(content)) return;

      content.forEach((item: any) => {
        if (item.type === 'tool_result') {
          toolResults.push({
            tool_use_id: item.tool_use_id || '',
            content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content)
          });
        }
      });
      return;
    }

    if (event.type === 'result') {
      if (event.result) {
        finalResult = typeof event.result === 'string' ? event.result : JSON.stringify(event.result);
      }
      if (event.usage) {
        tokenInfo = {
          input_tokens: event.usage.input_tokens || 0,
          output_tokens: event.usage.output_tokens || 0,
          total_tokens: (event.usage.input_tokens || 0) + (event.usage.output_tokens || 0)
        };
      }
      return;
    }
  });

  if (sessionIdFromEvents && !entry.sessionId) {
    entry.sessionId = sessionIdFromEvents;
    save(paths, store);
  }

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
      children: compact([
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
        assistantMessages.length
          ? listSection('Assistant', assistantMessages.slice(-3))
          : null,
        toolCalls.length
          ? listSection('Tool Calls', toolCalls.slice(-5).map((call) =>
              `${call.name}(${truncate(JSON.stringify(call.input), 120)})`
            ))
          : null,
        toolResults.length
          ? listSection('Tool Results', toolResults.slice(-5).map((result) =>
              `[${result.tool_use_id}] ${truncate(result.content, 160)}`
            ))
          : null,
        finalResult
          ? {
              type: 'layout',
              direction: 'column',
              children: [
                { type: 'heading', level: 2, text: 'Final Result', accent: 'secondary' },
                { type: 'text', text: truncate(finalResult, 500), wrap: true, tone: 'muted' }
              ]
            }
          : null,
        {
          type: 'keyValue',
          columns: 1,
          items: compact([
            { label: 'Assistant Messages', value: String(assistantMessages.length) },
            { label: 'Tool Calls', value: String(toolCalls.length) },
            { label: 'Tool Results', value: String(toolResults.length) },
            tokensItem
          ])
        },
        { type: 'heading', level: 2, text: `Raw Tail (${lastN} lines)`, accent: 'muted' },
        { type: 'log', lines: logLines }
      ]) as any
    },
    meta: {
      sessionId: entry.sessionId,
      logFile: formatPathRelative(entry.logFile, paths.baseDir),
      assistantMessages,
      toolCalls,
      toolResults,
      finalResult,
      tokenInfo,
      tailLines
    }
  };
}

function metaSection(meta: Record<string, any>) {
  const rows = compact([
    meta.model ? { label: 'Model', value: meta.model } : null
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
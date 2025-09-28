import { ViewEnvelope, ViewStyle, ViewNode } from '../view';

export interface RunRow {
  agent: string;
  status: string;
  sessionId: string | null;
  updated: string;
  updatedIso: string | null;
  log: string | null;
}

export interface RunsPagerInfo {
  page: number;
  per: number;
  hints: string[];
}

interface RunsOverviewParams {
  style: ViewStyle;
  active: RunRow[];
  recent: RunRow[];
  pager: RunsPagerInfo;
  warnings?: string[];
}

interface RunsScopedParams {
  style: ViewStyle;
  scopeTitle: string;
  rows: RunRow[];
  pager: RunsPagerInfo;
  warnings?: string[];
}

export function buildRunsOverviewView(params: RunsOverviewParams): ViewEnvelope {
  const { style, active, recent, pager } = params;
  return {
    style,
    title: 'Background Sessions',
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: 'Background Sessions', accent: 'primary' },
        sectionWithTable('Active Sessions', active, 'No active sessions'),
        sectionWithTable('Recent Sessions', recent, 'No recent sessions'),
        {
          type: 'layout',
          direction: 'row',
          gap: 2,
          children: [
            { type: 'badge', text: `Page ${pager.page}`, tone: 'info' },
            { type: 'text', text: `Showing ${pager.per} per page`, tone: 'muted' }
          ]
        },
        hintList(pager.hints),
        params.warnings && params.warnings.length
          ? {
              type: 'callout',
              tone: 'warning',
              title: 'Session store warning',
              body: params.warnings
            }
          : null
      ].filter(Boolean) as ViewNode[]
    },
    meta: {
      active,
      recent,
      pager,
      warnings: params.warnings
    }
  };
}

export function buildRunsScopedView(params: RunsScopedParams): ViewEnvelope {
  const { style, scopeTitle, rows, pager } = params;
  return {
    style,
    title: scopeTitle,
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: scopeTitle, accent: 'primary' },
        sectionWithTable(scopeTitle, rows, 'No sessions in this scope'),
        {
          type: 'layout',
          direction: 'row',
          gap: 2,
          children: [
            { type: 'badge', text: `Page ${pager.page}`, tone: 'info' },
            { type: 'text', text: `Showing ${pager.per} per page`, tone: 'muted' }
          ]
        },
        hintList(pager.hints),
        params.warnings && params.warnings.length
          ? {
              type: 'callout',
              tone: 'warning',
              title: 'Session store warning',
              body: params.warnings
            }
          : null
      ].filter(Boolean) as ViewNode[]
    },
    meta: {
      scope: scopeTitle,
      rows,
      pager,
      warnings: params.warnings
    }
  };
}

function sectionWithTable(title: string, rows: RunRow[], emptyText: string): ViewNode {
  const logItems = rows.filter((row) => Boolean(row.log)).map((row) => `${row.agent}: ${truncateLogPath(row.log!)}`);
  return {
    type: 'layout' as const,
    direction: 'column' as const,
    children: [
      { type: 'heading', level: 2, text: title, accent: 'secondary' },
      {
        type: 'table' as const,
        columns: [
          { key: 'agent', label: 'Agent' },
          { key: 'status', label: 'Status' },
          { key: 'sessionId', label: 'Session' },
          { key: 'updated', label: 'Updated' }
        ],
        rows: rows.map((row) => ({
          agent: row.agent,
          status: decorateStatus(row.status),
          sessionId: row.sessionId ?? 'n/a',
          updated: row.updated || 'n/a'
        })),
        emptyText
      },
      logItems.length
        ? {
            type: 'layout' as const,
            direction: 'column' as const,
            children: [
              { type: 'text', text: 'Logs:', tone: 'muted' },
              { type: 'list', tone: 'muted', items: logItems }
            ]
          }
        : null
    ].filter(Boolean) as ViewNode[]
  };
}

function decorateStatus(status: string): string {
  const normalized = status.toLowerCase();
  const prefix = statusEmoji(normalized);
  return prefix ? `${prefix} ${status}` : status;
}

function statusEmoji(status: string): string {
  if (status.startsWith('running')) return '🟢';
  if (status.startsWith('pending')) return '🟠';
  if (status.startsWith('completed')) return '✅';
  if (status.startsWith('failed')) return '❌';
  if (status.startsWith('stopped')) return '🔚';
  return '⌛️';
}

function hintList(items: string[]): ViewNode {
  return {
    type: 'list' as const,
    tone: 'muted',
    items: items.filter((item) => typeof item === 'string' && item.trim().length)
  };
}

function truncateLogPath(value: string): string {
  const max = 56;
  if (value.length <= max) return value;
  return `…${value.slice(-max + 1)}`;
}

import { ViewEnvelope, ViewStyle, ViewNode } from '../view';

export interface RunRow {
  agent: string;
  status: string;
  sessionId: string | null;
  lastUsed: string | null;
  log: string | null;
}

export interface RunsPagerInfo {
  page: number;
  per: number;
  nextHint: string;
  actionHint: string;
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
            { type: 'text', text: `per ${pager.per}`, tone: 'muted' }
          ]
        },
        actionBar([pager.nextHint, pager.actionHint]),
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
            { type: 'text', text: `per ${pager.per}`, tone: 'muted' }
          ]
        },
        actionBar([pager.nextHint, pager.actionHint]),
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
          { key: 'lastUsed', label: 'Last Activity' },
          { key: 'log', label: 'Log' }
        ],
        rows: rows.map((row) => ({
          agent: row.agent,
          status: decorateStatus(row.status),
          sessionId: row.sessionId ?? 'n/a',
          lastUsed: row.lastUsed ?? 'n/a',
          log: row.log ?? 'n/a'
        })),
        emptyText
      }
    ]
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

function actionBar(items: string[]): ViewNode {
  return {
    type: 'layout' as const,
    direction: 'row' as const,
    gap: 2,
    children: items.map((item) => ({ type: 'text' as const, text: item, tone: 'muted' }))
  };
}

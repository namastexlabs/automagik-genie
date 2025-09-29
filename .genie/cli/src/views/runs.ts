import { ViewEnvelope, ViewNode, ViewStyle } from '../view';

export interface RunRow {
  agent: string;
  status: string;
  sessionId: string | null;
  updated: string;
  updatedIso: string | null;
  log: string | null;
}

interface RunsViewParams {
  active: RunRow[];
  recent: RunRow[];
  warnings?: string[];
}

const GENIE_STYLE: ViewStyle = 'genie';

export function buildRunsOverviewView(params: RunsViewParams): ViewEnvelope {
  const { active, recent, warnings } = params;
  const badgeRow: ViewNode = {
    type: 'layout',
    direction: 'row',
    gap: 1,
    children: [
      { type: 'badge', text: `${active.length} active`, tone: active.length ? 'info' : 'muted' },
      { type: 'badge', text: `${recent.length} recent`, tone: recent.length ? 'info' : 'muted' }
    ]
  };
  return {
    style: GENIE_STYLE,
    title: 'Background Sessions',
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: 'Background Sessions', accent: 'primary' },
        badgeRow,
        {
          type: 'callout',
          tone: 'info',
          icon: '🛰️',
          title: 'Manage background work',
          body: [
            'Use `genie resume <sessionId>` to feed follow-up prompts.',
            'Run `genie stop <sessionId>` to terminate detached processes.'
          ]
        },
        { type: 'divider', variant: 'solid', accent: 'muted' },
        sectionWithTable('Active Sessions', active, 'No active sessions'),
        sectionWithTable('Recent Sessions (last 10)', recent, 'No recent sessions'),
        warnings && warnings.length
          ? {
              type: 'callout',
              tone: 'warning',
              icon: '⚠️',
              title: 'Session store warning',
              body: warnings
            }
          : null,
        {
          type: 'callout',
          tone: 'info',
          icon: '💡',
          title: 'Tips',
          body: ['View details: `genie view <sessionId>`', 'Resume work: `genie resume <sessionId> "<prompt>"`']
        }
      ].filter(Boolean) as ViewNode[]
    }
  };
}

function sectionWithTable(title: string, rows: RunRow[], emptyText: string): ViewNode {
  const badge: ViewNode = {
    type: 'badge',
    text: rows.length ? `${rows.length} entries` : 'Empty',
    tone: rows.length ? 'info' : 'muted'
  };
  return {
    type: 'layout' as const,
    direction: 'column' as const,
    children: [
      { type: 'heading', level: 2, text: title, accent: 'secondary' },
      {
        type: 'layout',
        direction: 'row',
        gap: 1,
        children: [badge]
      },
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

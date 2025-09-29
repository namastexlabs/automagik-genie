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
  return {
    style: GENIE_STYLE,
    title: 'Background Sessions',
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: 'Background Sessions', accent: 'primary' },
        sectionWithTable('Active Sessions', active, 'No active sessions'),
        sectionWithTable('Recent Sessions (last 10)', recent, 'No recent sessions'),
        warnings && warnings.length
          ? {
              type: 'callout',
              tone: 'warning',
              title: 'Session store warning',
              body: warnings
            }
          : null,
        {
          type: 'callout',
          tone: 'info',
          title: 'Tips',
          body: ['View details: `genie view <sessionId>`', 'Resume work: `genie resume <sessionId> "<prompt>"`']
        }
      ].filter(Boolean) as ViewNode[]
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

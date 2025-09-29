import { ViewEnvelope, ViewStyle, ViewNode } from '../view';

interface AgentCatalogRow {
  id: string;
  summary: string;
}

interface AgentCatalogGroup {
  label: string;
  rows: AgentCatalogRow[];
}

interface AgentCatalogParams {
  total: number;
  groups: AgentCatalogGroup[];
}

const GENIE_STYLE: ViewStyle = 'genie';

export function buildAgentCatalogView(params: AgentCatalogParams): ViewEnvelope {
  const { total, groups } = params;
  const badgeRow: ViewNode = {
    type: 'layout',
    direction: 'row',
    gap: 1,
    children: [
      { type: 'badge', text: `Total ${total}`, tone: 'info' },
      { type: 'badge', text: `${groups.length} folders`, tone: 'muted' }
    ]
  };
  return {
    style: GENIE_STYLE,
    title: 'Agent Catalog',
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: 'Agent Catalog', accent: 'primary' },
        badgeRow,
        {
          type: 'callout',
          tone: 'info',
          icon: '🧭',
          title: 'Usage',
          body: [
            'Run an agent: `genie run <agent-id> "<prompt>"`.',
            'List active work: `genie list sessions`.'
          ]
        },
        { type: 'divider', variant: 'solid', accent: 'muted' },
        ...groups.flatMap((group, index) => {
          const section = buildGroupSection(group);
          return index < groups.length - 1
            ? [section, { type: 'divider', variant: 'solid', accent: 'muted' } as ViewNode]
            : [section];
        }) as ViewNode[],
        {
          type: 'callout',
          tone: 'success',
          icon: '🧪',
          title: 'Next steps',
          body: [
            'Pair `/forge` plans with `/implementor` runs for structured delivery.',
            'Keep wish context updated as you add or retire agents.'
          ]
        }
      ] as ViewNode[]
    }
  };
}

function buildGroupSection(group: AgentCatalogGroup): ViewNode {
  const badges: ViewNode = {
    type: 'layout',
    direction: 'row',
    gap: 1,
    children: [
      { type: 'badge', text: `${group.rows.length} agents`, tone: 'info' }
    ]
  };
  return {
    type: 'layout',
    direction: 'column',
    gap: 1,
    children: [
      { type: 'heading', level: 2, text: group.label, accent: 'secondary' },
      badges,
      {
        type: 'table',
        columns: [
          { key: 'id', label: 'Identifier' },
          { key: 'summary', label: 'Summary' }
        ],
        rows: group.rows.map((row) => ({
          id: row.id,
          summary: row.summary
        })),
        emptyText: 'No agents found in this folder'
      }
    ]
  };
}

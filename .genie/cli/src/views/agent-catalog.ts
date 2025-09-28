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
  return {
    style: GENIE_STYLE,
    title: 'Agent Catalog',
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: 'Agent Catalog', accent: 'primary' },
        {
          type: 'keyValue',
          columns: 1,
          items: [{ label: 'Total agents', value: String(total) }]
        },
        ...groups.map((group) => buildGroupSection(group)),
        {
          type: 'callout',
          tone: 'info',
          title: 'Usage',
          body: [
            'Run an agent: `genie run <agent-id> "<prompt>"`.',
            'List active work: `genie list sessions`.'
          ]
        }
      ] as ViewNode[]
    }
  };
}

function buildGroupSection(group: AgentCatalogGroup): ViewNode {
  return {
    type: 'layout',
    direction: 'column',
    gap: 1,
    children: [
      { type: 'heading', level: 2, text: group.label, accent: 'secondary' },
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

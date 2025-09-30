"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentCatalogView = void 0;
const GENIE_STYLE = 'genie';
function buildAgentCatalogView(params) {
    const { total, groups } = params;
    const badgeRow = {
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
                        ? [section, { type: 'divider', variant: 'solid', accent: 'muted' }]
                        : [section];
                }),
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
            ]
        }
    };
}
exports.buildAgentCatalogView = buildAgentCatalogView;
function buildGroupSection(group) {
    const badges = {
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentCatalogView = buildAgentCatalogView;
function buildAgentCatalogView(params) {
    const { style, totals, groups } = params;
    return {
        style,
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
                    items: [
                        { label: 'Total', value: String(totals.all) },
                        { label: 'Modes', value: String(totals.modes) },
                        { label: 'Core agents', value: String(totals.core) },
                        { label: 'Specialized', value: String(totals.specialized) }
                    ]
                },
                ...groups.map((group) => buildGroupSection(group)),
                {
                    type: 'callout',
                    tone: 'info',
                    title: 'Usage',
                    body: [
                        'Run an entry: `genie agent run <agent-id> "<prompt>"`.',
                        'Modes accept aliases: `genie agent run planner "..."` resolves to `modes/planner`.'
                    ]
                }
            ]
        }
    };
}
function buildGroupSection(group) {
    return {
        type: 'layout',
        direction: 'column',
        gap: 1,
        children: [
            { type: 'heading', level: 2, text: group.label, accent: 'secondary' },
            {
                type: 'table',
                columns: [
                    { key: 'id', label: 'Agent' },
                    { key: 'summary', label: 'Summary' }
                ],
                rows: group.rows.map((row) => ({
                    id: row.id,
                    summary: row.summary
                })),
                emptyText: group.emptyText
            }
        ]
    };
}

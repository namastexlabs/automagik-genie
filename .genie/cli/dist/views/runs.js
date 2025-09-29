"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRunsOverviewView = buildRunsOverviewView;
const GENIE_STYLE = 'genie';
function buildRunsOverviewView(params) {
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
            ].filter(Boolean)
        }
    };
}
function sectionWithTable(title, rows, emptyText) {
    return {
        type: 'layout',
        direction: 'column',
        children: [
            { type: 'heading', level: 2, text: title, accent: 'secondary' },
            {
                type: 'table',
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
function decorateStatus(status) {
    const normalized = status.toLowerCase();
    const prefix = statusEmoji(normalized);
    return prefix ? `${prefix} ${status}` : status;
}
function statusEmoji(status) {
    if (status.startsWith('running'))
        return '🟢';
    if (status.startsWith('pending'))
        return '🟠';
    if (status.startsWith('completed'))
        return '✅';
    if (status.startsWith('failed'))
        return '❌';
    if (status.startsWith('stopped'))
        return '🔚';
    return '⌛️';
}

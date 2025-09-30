"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRunsOverviewView = void 0;
const GENIE_STYLE = 'genie';
function buildRunsOverviewView(params) {
    const { active, recent, warnings } = params;
    const badgeRow = {
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
        title: 'Sessions',
        body: {
            type: 'layout',
            direction: 'column',
            gap: 0,
            children: [
                badgeRow,
                active.length > 0 ? simpleTable('Active', active) : null,
                recent.length > 0 ? simpleTable('Recent (last 10)', recent) : null,
                warnings && warnings.length
                    ? {
                        type: 'callout',
                        tone: 'warning',
                        icon: '⚠️',
                        title: 'Warnings',
                        body: warnings
                    }
                    : null,
                {
                    type: 'callout',
                    tone: 'info',
                    icon: '💡',
                    title: 'Commands',
                    body: [
                        'genie view <sessionId>',
                        'genie resume <sessionId> "<prompt>"',
                        'genie stop <sessionId>'
                    ]
                }
            ].filter(Boolean)
        }
    };
}
exports.buildRunsOverviewView = buildRunsOverviewView;
function simpleTable(title, rows) {
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
                }))
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

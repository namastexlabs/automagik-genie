"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRunsOverviewView = buildRunsOverviewView;
exports.buildRunsScopedView = buildRunsScopedView;
function buildRunsOverviewView(params) {
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
            ].filter(Boolean)
        },
        meta: {
            active,
            recent,
            pager,
            warnings: params.warnings
        }
    };
}
function buildRunsScopedView(params) {
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
            ].filter(Boolean)
        },
        meta: {
            scope: scopeTitle,
            rows,
            pager,
            warnings: params.warnings
        }
    };
}
function sectionWithTable(title, rows, emptyText) {
    const logItems = rows.filter((row) => Boolean(row.log)).map((row) => `${row.agent}: ${truncateLogPath(row.log)}`);
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
            },
            logItems.length
                ? {
                    type: 'layout',
                    direction: 'column',
                    children: [
                        { type: 'text', text: 'Logs:', tone: 'muted' },
                        { type: 'list', tone: 'muted', items: logItems }
                    ]
                }
                : null
        ].filter(Boolean)
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
function hintList(items) {
    return {
        type: 'list',
        tone: 'muted',
        items: items.filter((item) => typeof item === 'string' && item.trim().length)
    };
}
function truncateLogPath(value) {
    const max = 56;
    if (value.length <= max)
        return value;
    return `…${value.slice(-max + 1)}`;
}

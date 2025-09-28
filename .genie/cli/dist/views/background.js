"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBackgroundStartView = buildBackgroundStartView;
exports.buildBackgroundPendingView = buildBackgroundPendingView;
exports.buildRunCompletionView = buildRunCompletionView;
function buildBackgroundStartView(params) {
    const sessionLine = `sessionid: ${params.sessionId ?? 'n/a'}`;
    const rows = [sessionLine, ...(params.actions || [])];
    return {
        style: params.style,
        body: {
            type: 'layout',
            direction: 'column',
            gap: 1,
            children: [
                {
                    type: 'callout',
                    tone: 'success',
                    title: 'Background session started',
                    body: compact(rows)
                }
            ]
        }
    };
}
function buildBackgroundPendingView(params) {
    const message = `${params.agentName} starting – waiting for session id…${params.frame ? ` ${params.frame}` : ''}`;
    return {
        style: params.style,
        body: {
            type: 'layout',
            direction: 'column',
            gap: 1,
            children: [
                { type: 'text', text: message, tone: 'muted' }
            ]
        }
    };
}
function buildRunCompletionView(params) {
    const tone = params.outcome === 'success' ? 'success' : params.outcome === 'warning' ? 'warning' : 'danger';
    const title = params.outcome === 'success'
        ? `${params.agentName} completed`
        : params.outcome === 'warning'
            ? `${params.agentName} completed with warnings`
            : `${params.agentName} failed`;
    const hasSession = Boolean(params.sessionId);
    const viewHint = hasSession
        ? `View logs → ./genie view ${params.sessionId}`
        : 'View logs → session pending (run `./genie runs --status running` to fetch the session id).';
    return {
        style: params.style,
        title,
        body: {
            type: 'layout',
            direction: 'column',
            gap: 1,
            children: [
                { type: 'heading', level: 1, text: title, accent: params.outcome === 'failure' ? 'muted' : 'secondary' },
                {
                    type: 'callout',
                    tone,
                    body: compact([
                        viewHint,
                        hasSession ? `Session → ${params.sessionId}` : 'Session → pending (check `./genie runs --status running`).',
                        params.exitCode !== undefined && params.exitCode !== null ? `Exit code → ${params.exitCode}` : null,
                        params.executorKey ? `Executor → ${params.executorKey}` : null,
                        params.durationMs ? `Runtime → ${(params.durationMs / 1000).toFixed(1)}s` : null
                    ])
                },
                params.extraNotes && params.extraNotes.length
                    ? { type: 'list', items: params.extraNotes, tone: 'muted' }
                    : null
            ].filter(Boolean)
        }
    };
}
function compact(items) {
    return items.filter((item) => Boolean(item));
}

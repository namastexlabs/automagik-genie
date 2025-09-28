"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBackgroundStartView = buildBackgroundStartView;
exports.buildRunCompletionView = buildRunCompletionView;
function buildBackgroundStartView(params) {
    return {
        style: params.style,
        title: `Detached: ${params.agentName}`,
        body: {
            type: 'layout',
            direction: 'column',
            gap: 1,
            children: [
                { type: 'heading', level: 1, text: `${params.agentName} detached`, accent: 'primary' },
                {
                    type: 'callout',
                    tone: 'success',
                    title: 'Background session started',
                    body: compact([
                        `Log → ${params.logPath}`,
                        params.sessionId ? `Session ID → ${params.sessionId}` : null,
                        params.note ?? 'Use `./genie view <sessionId>` to stream output.'
                    ])
                },
                params.context && params.context.length
                    ? { type: 'list', items: params.context, tone: 'muted' }
                    : null
            ].filter(Boolean)
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
                        `Log → ${params.logPath}`,
                        params.sessionId ? `Session → ${params.sessionId}` : null,
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

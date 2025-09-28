"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStopView = buildStopView;
function buildStopView(params) {
    return {
        style: params.style,
        title: `Stop: ${params.target}`,
        body: {
            type: 'layout',
            direction: 'column',
            gap: 1,
            children: [
                { type: 'heading', level: 1, text: `Stop signal • ${params.target}`, accent: 'primary' },
                {
                    type: 'timeline',
                    items: params.events.map((event) => ({
                        title: event.label,
                        subtitle: event.detail,
                        meta: event.message,
                        status: event.status
                    }))
                },
                {
                    type: 'callout',
                    tone: params.events.every((e) => e.status === 'done') ? 'success' : 'warning',
                    title: 'Summary',
                    body: [params.summary]
                },
                params.followUps && params.followUps.length
                    ? { type: 'list', items: params.followUps, tone: 'muted' }
                    : null
            ].filter(Boolean)
        }
    };
}

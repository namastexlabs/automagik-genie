"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChatView = buildChatView;
const GENIE_STYLE = 'genie';
function buildChatView(params) {
    const { agent, sessionId, logPath, messages, meta = [], showFull, hint } = params;
    const headerRows = [
        { label: 'Session', value: sessionId ?? 'n/a', tone: sessionId ? 'success' : 'muted' },
        { label: 'Log', value: logPath }
    ];
    const metaRows = headerRows.concat(meta ?? []);
    const children = [
        { type: 'heading', level: 1, text: agent, accent: 'primary' },
        { type: 'keyValue', columns: 1, items: metaRows }
    ];
    if (!messages.length) {
        children.push({
            type: 'callout',
            tone: 'info',
            title: 'No transcript yet',
            body: ['Agent has not produced chat output for this session.']
        });
    }
    else {
        children.push({ type: 'heading', level: 2, text: showFull ? 'Transcript' : 'Latest Output', accent: 'secondary' });
        children.push({
            type: 'layout',
            direction: 'column',
            gap: 1,
            children: messages.map((message) => chatMessageNode(message))
        });
        if (!showFull) {
            children.push({
                type: 'callout',
                tone: 'info',
                title: 'Tip',
                body: ['Run `genie view <sessionId> --full` to see the entire conversation.']
            });
        }
    }
    if (hint) {
        children.push({
            type: 'callout',
            tone: 'info',
            title: 'Hint',
            body: [hint]
        });
    }
    return {
        style: GENIE_STYLE,
        title: `${agent} transcript`,
        body: {
            type: 'layout',
            direction: 'column',
            gap: 1,
            children
        }
    };
}
function chatMessageNode(message) {
    const tone = message.role === 'assistant'
        ? 'default'
        : message.role === 'reasoning'
            ? 'muted'
            : message.role === 'tool'
                ? 'info'
                : 'warning';
    const badgeTone = message.role === 'assistant' ? 'info' : message.role === 'tool' ? 'warning' : message.role === 'action' ? 'danger' : 'muted';
    const bodyTexts = message.body.filter(Boolean);
    return {
        type: 'layout',
        direction: 'column',
        gap: 1,
        children: [
            {
                type: 'layout',
                direction: 'row',
                gap: 1,
                children: [
                    { type: 'badge', text: message.title, tone: badgeTone },
                    { type: 'text', text: bodyTexts[0] || '', tone }
                ]
            },
            ...bodyTexts.slice(1).map((line) => ({ type: 'text', text: line, tone: 'muted' }))
        ]
    };
}

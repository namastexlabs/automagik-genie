"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHelpView = buildHelpView;
const GENIE_STYLE = 'genie';
function buildHelpView(params) {
    const commandTable = {
        type: 'table',
        columns: [
            { key: 'command', label: 'Command' },
            { key: 'args', label: 'Arguments' },
            { key: 'description', label: 'Description' }
        ],
        rows: params.commandRows,
        rowGap: 0,
        border: 'round',
        divider: true
    };
    const metaBadges = [
        {
            type: 'badge',
            text: params.backgroundDefault ? 'Background: detached default' : 'Background: attach by default',
            tone: params.backgroundDefault ? 'info' : 'warning'
        },
        { type: 'badge', text: 'Plan → Wish → Forge workflow', tone: 'info' },
        { type: 'badge', text: 'Evidence-first outputs', tone: 'success' }
    ];
    return {
        style: GENIE_STYLE,
        title: 'GENIE Command Palette',
        body: {
            type: 'layout',
            direction: 'column',
            gap: 0,
            children: [
                { type: 'heading', level: 1, text: 'GENIE CLI', accent: 'primary', align: 'center' },
                { type: 'text', text: 'Genie Template :: Command Palette Quickstart', tone: 'muted', align: 'center' },
                {
                    type: 'layout',
                    direction: 'row',
                    gap: 1,
                    children: metaBadges
                },
                { type: 'divider', variant: 'double', accent: 'primary' },
                {
                    type: 'callout',
                    tone: 'info',
                    icon: '🧭',
                    title: 'Usage',
                    body: [
                        'Invoke commands with `genie <command> [options]`.'
                    ]
                },
                { type: 'divider', variant: 'solid', accent: 'muted' },
                { type: 'heading', level: 2, text: 'Command Palette', accent: 'secondary' },
                commandTable,
                {
                    type: 'callout',
                    tone: 'info',
                    title: params.promptFramework.title,
                    body: params.promptFramework.bulletPoints.map((line) => `• ${line}`)
                },
                {
                    type: 'callout',
                    tone: 'success',
                    icon: '⚡',
                    title: 'Quick start examples',
                    body: params.examples
                },
                {
                    type: 'callout',
                    tone: 'info',
                    icon: '💡',
                    title: 'Tips',
                    body: [
                        'Watch sessions: `genie list sessions`.',
                        'Run an agent: `genie run <agent-id> "<prompt>"`.'
                    ]
                }
            ]
        }
    };
}

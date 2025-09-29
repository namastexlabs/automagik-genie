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
        rows: params.commandRows
    };
    return {
        style: GENIE_STYLE,
        title: 'GENIE Command Palette',
        body: {
            type: 'layout',
            direction: 'column',
            gap: 1,
            children: [
                { type: 'heading', level: 1, text: 'GENIE CLI', accent: 'primary', align: 'center' },
                { type: 'text', text: 'Genie Template :: Command Palette Quickstart', tone: 'muted', align: 'center' },
                { type: 'divider', variant: 'double', accent: 'primary' },
                {
                    type: 'keyValue',
                    columns: 1,
                    items: [
                        { label: 'Usage', value: 'genie <command> [options]' },
                        {
                            label: 'Background',
                            value: params.backgroundDefault
                                ? 'Enabled (detached by default)'
                                : 'Disabled (attach unless explicitly requested)'
                        }
                    ]
                },
                { type: 'divider', variant: 'solid', accent: 'muted' },
                commandTable,
                { type: 'divider', variant: 'solid', accent: 'muted' },
                {
                    type: 'layout',
                    direction: 'column',
                    children: [
                        { type: 'heading', level: 2, text: 'Prompt Framework', accent: 'secondary' },
                        { type: 'list', items: params.promptFramework, tone: 'default' }
                    ]
                },
                {
                    type: 'layout',
                    direction: 'column',
                    children: [
                        { type: 'heading', level: 2, text: 'Examples', accent: 'primary' },
                        { type: 'list', items: params.examples }
                    ]
                },
                {
                    type: 'callout',
                    tone: 'info',
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

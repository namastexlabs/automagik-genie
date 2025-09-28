import { ViewEnvelope, ViewStyle } from '../view';

interface HelpViewParams {
  style: ViewStyle;
  backgroundDefault: boolean;
  defaultPreset?: string;
  commandRows: Array<{ command: string; args: string; description: string }>;
  optionRows: Array<{ flag: string; description: string }>;
  presets: Array<{ name: string; description: string }>; 
  promptFramework: string[];
  examples: string[];
}

export function buildHelpView(params: HelpViewParams): ViewEnvelope {
  const style = params.style;
  const commandTable = {
    type: 'table' as const,
    columns: [
      { key: 'command', label: 'Command' },
      { key: 'args', label: 'Arguments' },
      { key: 'description', label: 'Description' }
    ],
    rows: params.commandRows
  };

  const optionTable = params.optionRows.length
    ? {
        type: 'table' as const,
        columns: [
          { key: 'flag', label: 'Flag' },
          { key: 'description', label: 'What it does' }
        ],
        rows: params.optionRows
      }
    : null;

  const presetTable = params.presets.length
    ? {
        type: 'table' as const,
        columns: [
          { key: 'name', label: 'Preset' },
          { key: 'description', label: 'Persona' }
        ],
        rows: params.presets
      }
    : null;

  return {
    style,
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
          type: 'layout',
          direction: 'row',
          gap: 2,
          children: [
            {
              type: 'keyValue',
              columns: 1,
              items: [
                { label: 'Usage', value: 'genie <command> [options]' },
                {
                  label: 'Background',
                  value: params.backgroundDefault
                    ? 'Enabled (detached by default)'
                    : 'Disabled (attach unless --background)'
                }
              ]
            },
            params.defaultPreset
              ? { type: 'badge', text: `Preset: ${params.defaultPreset}`, tone: 'info' }
              : null
          ]
        },
        { type: 'divider', variant: 'solid', accent: 'muted' },
        commandTable,
        optionTable ? { type: 'divider', variant: 'solid', accent: 'muted' } : null,
        optionTable,
        presetTable ? { type: 'divider', variant: 'solid', accent: 'muted' } : null,
        presetTable,
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
            'Monitor active sessions with `./genie runs --status running`.',
            'Use `genie agent list` to browse every agent and mode.'
          ]
        }
      ].filter(Boolean) as any
    }
  };
}

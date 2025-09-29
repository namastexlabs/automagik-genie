import { ViewEnvelope, ViewStyle, ViewNode } from '../view';

interface HelpViewParams {
  backgroundDefault: boolean;
  commandRows: Array<{ command: string; args: string; description: string }>;
  promptFramework: { title: string; bulletPoints: string[] };
  examples: string[];
}

interface SubcommandHelpParams {
  command: string;
  description: string;
  usage: string;
  arguments?: Array<{ name: string; description: string; required?: boolean }>;
  options?: Array<{ flag: string; description: string }>;
  examples?: string[];
  notes?: string[];
}

const GENIE_STYLE: ViewStyle = 'genie';

// Main help view
export function buildHelpView(params: HelpViewParams): ViewEnvelope {
  const commandTable = {
    type: 'table' as const,
    columns: [
      { key: 'command', label: 'Command' },
      { key: 'args', label: 'Arguments' },
      { key: 'description', label: 'Description' }
    ],
    rows: params.commandRows,
    rowGap: 0,
    border: 'round' as const,
    divider: true
  };

  const metaBadges: ViewNode[] = [
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

// Helper function to build subcommand help views
export function buildSubcommandHelpView(params: SubcommandHelpParams): ViewEnvelope {
  const children: ViewNode[] = [
    { type: 'heading', level: 1, text: `genie ${params.command}`, accent: 'primary', align: 'center' },
    { type: 'text', text: params.description, tone: 'muted', align: 'center' },
    { type: 'divider', variant: 'double', accent: 'primary' },
    {
      type: 'callout',
      tone: 'info',
      icon: '📖',
      title: 'Usage',
      body: [params.usage]
    }
  ];

  if (params.arguments && params.arguments.length > 0) {
    children.push(
      { type: 'divider', variant: 'solid', accent: 'muted' },
      { type: 'heading', level: 2, text: 'Arguments', accent: 'secondary' },
      {
        type: 'table',
        columns: [
          { key: 'name', label: 'Argument' },
          { key: 'description', label: 'Description' },
          { key: 'required', label: 'Required' }
        ],
        rows: params.arguments.map(arg => ({
          name: arg.name,
          description: arg.description,
          required: arg.required !== false ? 'Yes' : 'No'
        })),
        border: 'round',
        divider: true
      }
    );
  }

  if (params.options && params.options.length > 0) {
    children.push(
      { type: 'divider', variant: 'solid', accent: 'muted' },
      { type: 'heading', level: 2, text: 'Options', accent: 'secondary' },
      {
        type: 'table',
        columns: [
          { key: 'flag', label: 'Option' },
          { key: 'description', label: 'Description' }
        ],
        rows: params.options.map(opt => ({
          flag: opt.flag,
          description: opt.description
        })),
        border: 'round',
        divider: true
      }
    );
  }

  if (params.examples && params.examples.length > 0) {
    children.push(
      { type: 'divider', variant: 'solid', accent: 'muted' },
      {
        type: 'callout',
        tone: 'success',
        icon: '⚡',
        title: 'Examples',
        body: params.examples
      }
    );
  }

  if (params.notes && params.notes.length > 0) {
    children.push(
      { type: 'divider', variant: 'solid', accent: 'muted' },
      {
        type: 'callout',
        tone: 'info',
        icon: '💡',
        title: 'Notes',
        body: params.notes
      }
    );
  }

  return {
    style: GENIE_STYLE,
    title: `GENIE ${params.command.toUpperCase()}`,
    body: {
      type: 'layout',
      direction: 'column',
      gap: 0,
      children
    }
  };
}

// Specific help views for each subcommand
export function buildRunHelpView(): ViewEnvelope {
  return buildSubcommandHelpView({
    command: 'run',
    description: 'Start or attach to an agent session',
    usage: 'genie run <agent> "<prompt>" [--help]',
    arguments: [
      { name: '<agent>', description: 'Agent identifier (from genie list agents)' },
      { name: '<prompt>', description: 'Initial prompt or task description' }
    ],
    options: [
      { flag: '--help, -h', description: 'Show this help message' }
    ],
    examples: [
      'genie run plan "[Discovery] mission @.genie/product/mission.md"',
      'genie run forge "Break down the approved wish into execution groups"',
      'genie run implementor "Implement the user authentication feature"'
    ],
    notes: [
      'Agents run in background mode by default (detached)',
      'Use quotes around prompts containing spaces or special characters',
      'Agent identifiers can be found with: genie list agents'
    ]
  });
}

export function buildResumeHelpView(): ViewEnvelope {
  return buildSubcommandHelpView({
    command: 'resume',
    description: 'Continue an existing agent session',
    usage: 'genie resume <sessionId> "<prompt>" [--help]',
    arguments: [
      { name: '<sessionId>', description: 'Session identifier from active or recent runs' },
      { name: '<prompt>', description: 'Follow-up prompt or new task instruction' }
    ],
    options: [
      { flag: '--help, -h', description: 'Show this help message' }
    ],
    examples: [
      'genie resume RUN-1234 "Please add error handling to the implementation"',
      'genie resume GENIE-567 "Review the test coverage and suggest improvements"',
      'genie resume FORGE-890 "Update the documentation with the new API changes"'
    ],
    notes: [
      'Session IDs can be found with: genie list sessions',
      'Only active or recently completed sessions can be resumed',
      'Use quotes around prompts containing spaces or special characters'
    ]
  });
}

export function buildListHelpView(): ViewEnvelope {
  return buildSubcommandHelpView({
    command: 'list',
    description: 'Display available agents or active sessions',
    usage: 'genie list <target> [--help]',
    arguments: [
      { name: '<target>', description: 'What to list: "agents" or "sessions"' }
    ],
    options: [
      { flag: '--help, -h', description: 'Show this help message' }
    ],
    examples: [
      'genie list agents',
      'genie list sessions'
    ],
    notes: [
      'Default target is "agents" if none specified',
      'Sessions show both active runs and recent history',
      'Agent list shows all available agents organized by category'
    ]
  });
}

export function buildViewHelpView(): ViewEnvelope {
  return buildSubcommandHelpView({
    command: 'view',
    description: 'Show transcript and details for a session',
    usage: 'genie view <sessionId> [--full] [--help]',
    arguments: [
      { name: '<sessionId>', description: 'Session identifier to display' }
    ],
    options: [
      { flag: '--full', description: 'Show complete session transcript (default: latest exchange)' },
      { flag: '--help, -h', description: 'Show this help message' }
    ],
    examples: [
      'genie view RUN-1234',
      'genie view GENIE-567 --full',
      'genie view FORGE-890'
    ],
    notes: [
      'Session IDs can be found with: genie list sessions',
      'Default view shows recent conversation; use --full for complete history',
      'Includes session metadata like execution mode and background status'
    ]
  });
}

export function buildStopHelpView(): ViewEnvelope {
  return buildSubcommandHelpView({
    command: 'stop',
    description: 'End a running background session',
    usage: 'genie stop <sessionId> [--help]',
    arguments: [
      { name: '<sessionId>', description: 'Session identifier to stop' }
    ],
    options: [
      { flag: '--help, -h', description: 'Show this help message' }
    ],
    examples: [
      'genie stop RUN-1234',
      'genie stop GENIE-567'
    ],
    notes: [
      'Only affects running background sessions',
      'Session IDs can be found with: genie list sessions',
      'Stopped sessions can still be viewed but not resumed'
    ]
  });
}

export function buildGeneralHelpView(): ViewEnvelope {
  return buildSubcommandHelpView({
    command: 'help',
    description: 'Show help information for commands',
    usage: 'genie help [<command>] [--help]',
    arguments: [
      { name: '<command>', description: 'Specific command to get help for', required: false }
    ],
    options: [
      { flag: '--help, -h', description: 'Show this help message' }
    ],
    examples: [
      'genie help',
      'genie help run',
      'genie help list'
    ],
    notes: [
      'Without arguments, shows the main command palette',
      'With a command name, shows detailed help for that command',
      'Most commands also accept --help or -h for quick access'
    ]
  });
}

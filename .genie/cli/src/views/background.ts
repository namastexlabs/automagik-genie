import { ViewEnvelope, ViewStyle, ViewNode } from '../view';

const GENIE_STYLE: ViewStyle = 'genie';

export interface BackgroundLoadingParams {
  agentName: string;
  frame?: string;
}

export interface BackgroundStartParams {
  agentName: string;
  sessionId?: string | null;
  actions?: string[];
}

export interface RunCompletionParams {
  agentName: string;
  outcome: 'success' | 'warning' | 'failure';
  sessionId?: string | null;
  exitCode?: number | null;
  durationMs?: number | null;
  executorKey?: string;
  extraNotes?: string[];
}

export function buildBackgroundStartingView(params: BackgroundLoadingParams): ViewEnvelope {
  const message = `${params.frame ?? '⠋'} Starting background agent…`;
  return {
    style: GENIE_STYLE,
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [{ type: 'text', text: message, tone: 'muted' }]
    }
  };
}

export function buildBackgroundPendingView(params: BackgroundLoadingParams): ViewEnvelope {
  const message = `${params.frame ?? '⠋'} Obtaining session id…`;
  return {
    style: GENIE_STYLE,
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [{ type: 'text', text: message, tone: 'muted' }]
    }
  };
}

export function buildBackgroundStartView(params: BackgroundStartParams): ViewEnvelope {
  const bodyLines = compact([
    params.sessionId ? `Session → ${params.sessionId}` : null,
    ...(params.actions || [])
  ]);

  return {
    style: GENIE_STYLE,
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        {
          type: 'callout',
          tone: 'success',
          title: `${params.agentName} ready in background`,
          body: bodyLines.length ? bodyLines : ['Session initialised.']
        }
      ] as ViewNode[]
    }
  };
}

export function buildRunCompletionView(params: RunCompletionParams): ViewEnvelope {
  const tone = params.outcome === 'success' ? 'success' : params.outcome === 'warning' ? 'warning' : 'danger';
  const title = params.outcome === 'success'
    ? `${params.agentName} completed`
    : params.outcome === 'warning'
      ? `${params.agentName} completed with warnings`
      : `${params.agentName} failed`;

  return {
    style: GENIE_STYLE,
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
            params.sessionId ? `Session → ${params.sessionId}` : null,
            params.exitCode !== undefined && params.exitCode !== null ? `Exit code → ${params.exitCode}` : null,
            params.executorKey ? `Executor → ${params.executorKey}` : null,
            params.durationMs ? `Runtime → ${(params.durationMs / 1000).toFixed(1)}s` : null
          ])
        },
        params.extraNotes && params.extraNotes.length
          ? { type: 'list', items: params.extraNotes, tone: 'muted' }
          : null
      ].filter(Boolean) as ViewNode[]
    }
  };
}

function compact<T>(items: Array<T | null | undefined>): T[] {
  return items.filter((item): item is T => Boolean(item));
}

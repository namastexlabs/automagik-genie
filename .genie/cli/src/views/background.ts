import { ViewEnvelope, ViewStyle, ViewNode, Tone } from '../view';

const GENIE_STYLE: ViewStyle = 'genie';

export interface BackgroundLoadingParams {
  agentName: string;
  frame?: string;
}

export interface BackgroundStartParams {
  agentName: string;
  sessionId?: string | null;
  executor?: string | null;
  preset?: string | null;
  background?: boolean | null;
  actions?: string[];
}

export interface RunCompletionParams {
  agentName: string;
  outcome: 'success' | 'warning' | 'failure';
  sessionId?: string | null;
  executorKey?: string;
  preset?: string | null;
  background?: boolean | null;
  exitCode?: number | null;
  durationMs?: number | null;
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
  const message = `${params.frame ?? '⠙'} Obtaining session id…`;
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
  const items: Array<{ label: string; value: string; tone?: Tone }> = compact([
    { label: 'Session', value: params.sessionId ?? 'n/a', tone: params.sessionId ? 'success' : 'muted' },
    params.executor ? { label: 'Executor', value: params.executor } : null,
    params.preset ? { label: 'Preset', value: params.preset } : null,
    params.background === true
      ? { label: 'Background', value: 'detached' }
      : params.background === false
        ? { label: 'Background', value: 'attached' }
        : null
  ]);

  const actionsList = params.actions && params.actions.length
    ? {
        type: 'callout' as const,
        tone: 'info' as const,
        title: 'Next steps',
        body: params.actions
      }
    : null;

  return {
    style: GENIE_STYLE,
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: `${params.agentName} ready in background`, accent: 'secondary' },
        {
          type: 'keyValue',
          columns: 1,
          items
        },
        actionsList
      ].filter(Boolean) as ViewNode[]
    }
  };
}

export function buildRunCompletionView(params: RunCompletionParams): ViewEnvelope {
  const tone = params.outcome === 'success' ? 'success' : params.outcome === 'warning' ? 'warning' : 'danger';
  const title =
    params.outcome === 'success'
      ? `${params.agentName} completed`
      : params.outcome === 'warning'
        ? `${params.agentName} completed with warnings`
        : `${params.agentName} failed`;

  const metaItems: Array<{ label: string; value: string; tone?: Tone }> = compact([
    params.sessionId ? { label: 'Session', value: params.sessionId } : null,
    params.executorKey ? { label: 'Executor', value: params.executorKey } : null,
    params.preset ? { label: 'Preset', value: params.preset } : null,
    params.background === true
      ? { label: 'Background', value: 'detached' }
      : params.background === false
        ? { label: 'Background', value: 'attached' }
        : null,
    params.exitCode !== undefined && params.exitCode !== null ? { label: 'Exit code', value: String(params.exitCode) } : null,
    params.durationMs ? { label: 'Runtime', value: `${(params.durationMs / 1000).toFixed(1)}s` } : null
  ]);

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
          type: 'keyValue',
          columns: 1,
          items: metaItems
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

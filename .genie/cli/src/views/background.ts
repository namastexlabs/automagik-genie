import { ViewEnvelope, ViewStyle } from '../view';

export interface BackgroundStartParams {
  style: ViewStyle;
  agentName: string;
  logPath: string;
  sessionId?: string | null;
  note?: string;
  context?: string[];
}

export interface RunCompletionParams {
  style: ViewStyle;
  agentName: string;
  outcome: 'success' | 'warning' | 'failure';
  logPath: string;
  sessionId?: string | null;
  exitCode?: number | null;
  durationMs?: number | null;
  executorKey?: string;
  extraNotes?: string[];
}

export function buildBackgroundStartView(params: BackgroundStartParams): ViewEnvelope {
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
      ].filter(Boolean) as any
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
      ].filter(Boolean) as any
    }
  };
}

function compact<T>(items: Array<T | null | undefined>): T[] {
  return items.filter((item): item is T => Boolean(item));
}

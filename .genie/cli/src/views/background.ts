import { ViewEnvelope, ViewStyle } from '../view';

export interface BackgroundStartParams {
  style: ViewStyle;
  agentName: string;
  logPath: string;
  sessionId?: string | null;
  actions?: string[];
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
  const hasSession = Boolean(params.sessionId);
  const viewHint = hasSession
    ? `View logs → ./genie view ${params.sessionId}`
    : 'View logs → session pending (run `./genie runs --status running` to fetch the session id).';
  const sessionLine = hasSession
    ? `sessionid: ${params.sessionId}`
    : 'sessionid: pending (run `./genie runs --status running`).';

  const actionLines = (params.actions && params.actions.length)
    ? params.actions
    : hasSession
      ? [`• Watch: ./genie view ${params.sessionId}`]
      : ['• Watch: session pending – run `./genie runs --status running` then `./genie view <sessionId>`'];

  const [firstAction, ...otherActions] = actionLines;
  const rows = [
    firstAction ? `${sessionLine}    ${firstAction}` : sessionLine,
    ...otherActions
  ];

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
          body: compact(rows)
        }
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

  const hasSession = Boolean(params.sessionId);
  const viewHint = hasSession
    ? `View logs → ./genie view ${params.sessionId}`
    : 'View logs → session pending (run `./genie runs --status running` to fetch the session id).';

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
            viewHint,
            hasSession ? `Session → ${params.sessionId}` : 'Session → pending (check `./genie runs --status running`).',
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

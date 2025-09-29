import { ViewEnvelope, ViewStyle, ViewNode } from '../view';

export interface StopEvent {
  label: string;
  detail?: string;
  status: 'done' | 'pending' | 'failed';
  message?: string;
}

interface StopViewParams {
  target: string;
  events: StopEvent[];
  summary: string;
  followUps?: string[];
}

const GENIE_STYLE: ViewStyle = 'genie';

export function buildStopView(params: StopViewParams): ViewEnvelope {
  const counts = countStatuses(params.events);
  const badgeRow: ViewNode = {
    type: 'layout',
    direction: 'row',
    gap: 1,
    children: [
      { type: 'badge', text: `${counts.done} stopped`, tone: 'success' },
      { type: 'badge', text: `${counts.pending} pending`, tone: counts.pending ? 'warning' : 'muted' },
      { type: 'badge', text: `${counts.failed} failed`, tone: counts.failed ? 'danger' : 'muted' }
    ]
  };
  return {
    style: GENIE_STYLE,
    title: `Stop: ${params.target}`,
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: `Stop signal • ${params.target}`, accent: 'primary' },
        badgeRow,
        { type: 'divider', variant: 'solid', accent: 'muted' },
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
          icon: params.events.every((e) => e.status === 'done') ? '✅' : '⚠️',
          title: 'Summary',
          body: [params.summary]
        },
        params.followUps && params.followUps.length
          ? { type: 'list', items: params.followUps, tone: 'muted' }
          : null
      ].filter(Boolean) as ViewNode[]
    }
  };
}

function countStatuses(events: StopEvent[]): { done: number; pending: number; failed: number } {
  return events.reduce(
    (acc, event) => {
      if (event.status === 'done') acc.done += 1;
      else if (event.status === 'pending') acc.pending += 1;
      else if (event.status === 'failed') acc.failed += 1;
      return acc;
    },
    { done: 0, pending: 0, failed: 0 }
  );
}

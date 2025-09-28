import { ViewEnvelope, ViewStyle, LogLine } from '../view';

interface LogTailParams {
  style: ViewStyle;
  agent: string;
  sessionId: string | null;
  logPath: string;
  instructions: string[];
  errors: string[];
  totalLines: number;
  lastN: number;
  tailLines: string[];
}

export function buildLogTailView(params: LogTailParams): ViewEnvelope {
  const logLines: LogLine[] = params.tailLines.map((line) => ({
    text: `  ${line}`,
    tone: classifyTone(line)
  }));

  return {
    style: params.style,
    title: `${params.agent} log tail`,
    body: {
      type: 'layout',
      direction: 'column',
      gap: 1,
      children: [
        { type: 'heading', level: 1, text: params.agent, accent: 'primary' },
        {
          type: 'keyValue',
          columns: 1,
          items: [
            { label: 'Session', value: params.sessionId ?? 'n/a', tone: params.sessionId ? 'success' : 'muted' },
            { label: 'Log', value: params.logPath }
          ]
        },
        params.instructions.length
          ? {
              type: 'layout',
              direction: 'column',
              children: [
                { type: 'heading', level: 2, text: 'Last Instructions', accent: 'secondary' },
                { type: 'list', items: params.instructions }
              ]
            }
          : null,
        params.errors.length
          ? {
              type: 'layout',
              direction: 'column',
              children: [
                { type: 'heading', level: 2, text: 'Recent Errors', accent: 'secondary' },
                { type: 'list', items: params.errors, tone: 'danger' }
              ]
            }
          : null,
        {
          type: 'keyValue',
          columns: 1,
          items: [
            { label: 'Errors', value: String(params.errors.length), tone: params.errors.length ? 'danger' : 'success' },
            { label: 'Lines', value: String(params.totalLines) }
          ]
        },
        { type: 'heading', level: 2, text: `Raw Tail (${params.lastN} lines)`, accent: 'muted' },
        { type: 'log', lines: logLines }
      ].filter(Boolean) as any
    },
    meta: {
      sessionId: params.sessionId,
      logPath: params.logPath,
      tailLines: params.tailLines
    }
  };
}

function classifyTone(line: string) {
  const upper = line.toUpperCase();
  if (upper.includes('ERROR')) return 'danger';
  if (upper.includes('WARN')) return 'warning';
  return 'default';
}

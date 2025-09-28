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
  const chatBubbles = collectChatBubbles(params.tailLines).slice(-5);
  const chatSection = chatBubbles.length
    ? {
        type: 'layout' as const,
        direction: 'column' as const,
        gap: 1,
        children: [
          { type: 'heading', level: 2, text: 'Dialogue', accent: 'secondary' },
          ...chatBubbles.map((bubble) => chatBubbleNode(bubble))
        ]
      }
    : null;

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
        chatSection,
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

type ChatRole = 'assistant' | 'reasoning' | 'tool';

interface ChatBubble {
  role: ChatRole;
  text: string;
}

function collectChatBubbles(lines: string[]): ChatBubble[] {
  const bubbles: ChatBubble[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) return;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.type === 'item.completed') {
        const item = parsed.item || {};
        const text = typeof item.text === 'string' ? item.text.trim() : '';
        if (!text) return;
        switch (item.item_type) {
          case 'assistant_message':
            bubbles.push({ role: 'assistant', text });
            break;
          case 'reasoning':
            bubbles.push({ role: 'reasoning', text });
            break;
          case 'tool_call':
          case 'tool_result':
            bubbles.push({ role: 'tool', text });
            break;
          default:
        }
      }
    } catch {
      /* ignore */
    }
  });
  return bubbles;
}

function chatBubbleNode(bubble: ChatBubble) {
  const textTone = bubble.role === 'reasoning' ? 'muted' : bubble.role === 'tool' ? 'info' : 'default';
  const badgeTone = bubble.role === 'assistant' ? 'info' : bubble.role === 'tool' ? 'warning' : 'muted';
  const badge = {
    type: 'badge' as const,
    text: chatLabel(bubble.role),
    tone: badgeTone
  };
  return {
    type: 'layout' as const,
    direction: 'row' as const,
    gap: 1,
    children: [
      badge,
      {
        type: 'text' as const,
        text: bubble.text,
        tone: textTone,
        dim: bubble.role === 'reasoning'
      }
    ]
  };
}

function chatLabel(role: ChatRole): string {
  switch (role) {
    case 'assistant':
      return 'Assistant';
    case 'tool':
      return 'Tool';
    case 'reasoning':
    default:
      return 'Reasoning';
  }
}

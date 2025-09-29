import { ViewEnvelope } from '../view';

const GENIE_STYLE = 'genie';

export function buildErrorView(title: string, message: string): ViewEnvelope {
  return {
    style: GENIE_STYLE,
    title,
    body: {
      type: 'callout',
      tone: 'danger',
      icon: '❌',
      title,
      body: [message]
    }
  };
}

export function buildWarningView(title: string, messages: string[]): ViewEnvelope {
  return {
    style: GENIE_STYLE,
    title,
    body: {
      type: 'callout',
      tone: 'warning',
      icon: '⚠️',
      title,
      body: messages
    }
  };
}

export function buildInfoView(title: string, messages: string[]): ViewEnvelope {
  return {
    style: GENIE_STYLE,
    title,
    body: {
      type: 'callout',
      tone: 'info',
      icon: 'ℹ️',
      title,
      body: messages
    }
  };
}
